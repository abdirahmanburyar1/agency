import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePermission, canAccess } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { getCurrencyRates, toUsd } from "@/lib/currency-rates";
import { getCurrencySymbol } from "@/lib/currencies";
import ExpenseMonthDetailClient from "./ExpenseMonthDetailClient";

function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default async function ExpenseMonthDetailPage({
  params,
}: {
  params: Promise<{ monthKey: string }>;
}) {
  await requirePermission(PERMISSION.EXPENSES_VIEW, { redirectOnForbidden: true });
  const { monthKey } = await params;

  if (!/^\d{4}-\d{2}$/.test(monthKey)) notFound();

  const [year, mon] = monthKey.split("-").map(Number);
  const from = new Date(year, mon - 1, 1);
  const to = new Date(year, mon, 0, 23, 59, 59, 999);

  const [expenses, currencyRates, canApprove, canMarkPaid] = await Promise.all([
    prisma.expense.findMany({
      where: {
        status: { not: "paid" },
        date: { gte: from, lte: to },
      },
      orderBy: { date: "asc" },
      include: { employee: true },
    }),
    getCurrencyRates(),
    canAccess(PERMISSION.EXPENSES_APPROVE),
    canAccess(PERMISSION.EXPENSES_PAID),
  ]);

  const serialized = expenses.map((e) => ({
    id: e.id,
    date: e.date.toISOString(),
    description: e.description,
    category: e.category,
    amount: Number(e.amount),
    currency: e.currency ?? "USD",
    pMethod: e.pMethod,
    status: e.status,
    employee: e.employee
      ? { name: e.employee.name, role: e.employee.role, phone: e.employee.phone }
      : null,
  }));

  const totalUsd = serialized.reduce(
    (sum, e) => sum + toUsd(e.amount, e.currency, currencyRates),
    0
  );
  const pendingCount = serialized.filter((e) => e.status === "pending").length;

  return (
    <main className="w-full py-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/expenses"
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          ← Back to Expenses
        </Link>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
          Expenses of {formatMonthLabel(monthKey)}
        </h1>
      </div>

      <div className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/50">
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Total (USD):{" "}
          <span className="font-bold text-zinc-900 dark:text-white">
            ${totalUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          {pendingCount > 0 && (
            <span className="ml-2 text-amber-600 dark:text-amber-400">
              ({pendingCount} pending)
            </span>
          )}
        </p>
      </div>

      {expenses.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-zinc-500 dark:text-zinc-400">
            No pending or approved expenses for this month. Paid expenses are shown in Reports.
          </p>
          <Link
            href="/expenses"
            className="mt-4 inline-block text-sm font-medium text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            ← Back to Expenses
          </Link>
        </div>
      ) : (
        <ExpenseMonthDetailClient
          expenses={serialized}
          monthKey={monthKey}
          canApprove={canApprove}
          canMarkPaid={canMarkPaid}
        />
      )}
    </main>
  );
}
