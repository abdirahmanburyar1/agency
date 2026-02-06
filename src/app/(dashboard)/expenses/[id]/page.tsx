import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePermission, canAccess } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { getCurrencySymbol } from "@/lib/currencies";
import ExpenseApproveButton from "./ExpenseApproveButton";
import ExpenseMarkPaidButton from "./ExpenseMarkPaidButton";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  paid: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  const v = value?.trim();
  if (v == null || v === "") return null;
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-zinc-800 dark:text-zinc-200">{v}</p>
    </div>
  );
}

export default async function ExpenseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSION.EXPENSES_VIEW, { redirectOnForbidden: true });
  const { id } = await params;

  const expense = await prisma.expense.findUnique({
    where: { id },
    include: { employee: true, approvedBy: true },
  });

  if (!expense) notFound();

  const [canEdit, canApprove, canMarkPaid] = await Promise.all([
    canAccess(PERMISSION.EXPENSES_EDIT),
    canAccess(PERMISSION.EXPENSES_APPROVE),
    canAccess(PERMISSION.EXPENSES_PAID),
  ]);

  const isPending = expense.status === "pending";
  const isApproved = expense.status === "approved";

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center justify-between">
        <Link
          href="/expenses"
          className="text-sm font-medium text-zinc-500 transition hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Back to Expenses
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          {isPending && canApprove && <ExpenseApproveButton expenseId={id} />}
          {isApproved && canMarkPaid && <ExpenseMarkPaidButton expenseId={id} />}
          {canEdit && isPending && (
            <Link
              href={`/expenses/${id}/edit`}
              className="rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              Edit Expense
            </Link>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Header with status */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
              Expense {expense.category ?? "Details"}
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {new Date(expense.date).toLocaleDateString()} · {expense.month}
            </p>
          </div>
          <span
            className={`inline-flex shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${STATUS_STYLES[expense.status] ?? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"}`}
          >
            {expense.status}
          </span>
        </div>

        {/* Amount card */}
        <div className="rounded-xl border-2 border-red-200 bg-red-50/50 p-6 shadow-sm dark:border-red-900/50 dark:bg-red-950/30">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">
            Amount
          </p>
          <p className="mt-2 text-3xl font-bold text-red-800 dark:text-red-300">
            {getCurrencySymbol(expense.currency ?? "USD")}{Number(expense.amount).toLocaleString()}{" "}
            <span className="text-base font-normal text-red-600 dark:text-red-400">({expense.currency ?? "USD"})</span>
          </p>
        </div>

        {/* Details grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <h2 className="font-semibold text-zinc-900 dark:text-white">
                Expense information
              </h2>
            </div>
            <div className="grid gap-6 p-6 sm:grid-cols-2">
              <InfoRow label="Date" value={new Date(expense.date).toLocaleDateString()} />
              <InfoRow label="Month" value={expense.month} />
              <InfoRow label="Category" value={expense.category} />
              <InfoRow label="Description" value={expense.description} />
              <InfoRow
                label="Employee"
                value={
                  expense.employee
                    ? expense.employee.phone?.trim()
                      ? `${expense.employee.name} - ${expense.employee.phone}`
                      : expense.employee.name
                    : undefined
                }
              />
              <InfoRow label="Currency" value={expense.currency ?? "USD"} />
              <InfoRow label="Payment method" value={expense.pMethod} />
              {expense.status === "paid" && expense.paidBy && (
                <InfoRow label="Paid by" value={expense.paidBy} />
              )}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <h2 className="font-semibold text-zinc-900 dark:text-white">
                Audit
              </h2>
            </div>
            <div className="space-y-6 p-6">
              <InfoRow
                label="Created at"
                value={
                  expense.createdAt
                    ? new Date(expense.createdAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : undefined
                }
              />
              {expense.approvedAt && (
                <>
                  <InfoRow
                    label="Approved at"
                    value={new Date(expense.approvedAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  />
                  <InfoRow
                    label="Approved by"
                    value={expense.approvedBy?.name ?? expense.approvedBy?.email ?? undefined}
                  />
                </>
              )}
              {!expense.approvedAt && isPending && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Awaiting approval. Users with Approve Expenses permission can approve or reject this expense.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
