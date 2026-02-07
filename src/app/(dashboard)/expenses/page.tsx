import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { getCurrencyRates, toUsd } from "@/lib/currency-rates";
import ExpensesByMonthBatches from "./ExpensesByMonthBatches";

function toMonthKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default async function ExpensesPage() {
  await requirePermission(PERMISSION.EXPENSES_VIEW, { redirectOnForbidden: true });
  const canCreate = await (await import("@/lib/permissions")).canAccess(PERMISSION.EXPENSES_CREATE);
  const canApprove = await (await import("@/lib/permissions")).canAccess(PERMISSION.EXPENSES_APPROVE);

  const [expenses, currencyRates] = await Promise.all([
    prisma.expense.findMany({
      where: { status: { not: "paid" } },
      orderBy: { date: "desc" },
      include: { employee: true },
    }),
    getCurrencyRates(),
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

  const byMonth = new Map<string, typeof serialized>();
  for (const e of serialized) {
    const key = toMonthKey(new Date(e.date));
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(e);
  }

  const batches = Array.from(byMonth.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([monthKey, monthExpenses]) => {
      const totalUsd = monthExpenses.reduce(
        (sum, e) => sum + toUsd(e.amount, e.currency, currencyRates),
        0
      );
      const pendingCount = monthExpenses.filter((e) => e.status === "pending").length;
      return {
        monthKey,
        monthLabel: formatMonthLabel(monthKey),
        totalUsd,
        pendingCount,
        expenseCount: monthExpenses.length,
      };
    });

  return (
    <main className="w-full py-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
          ← Back
        </Link>
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Expenses</h1>
          {canCreate && (
            <Link
              href="/expenses/new"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Create Expense
            </Link>
          )}
        </div>
      </div>

      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        Expenses grouped by month. The executive committee can approve all pending expenses for a month at once.
      </p>

      <ExpensesByMonthBatches batches={batches} canApprove={canApprove} />
    </main>
  );
}
