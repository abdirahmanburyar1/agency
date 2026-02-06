import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import EditExpenseForm from "./EditExpenseForm";

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSION.EXPENSES_EDIT, { redirectOnForbidden: true });
  const { id } = await params;

  const expense = await prisma.expense.findUnique({
    where: { id },
    include: { employee: true },
  });

  if (!expense) notFound();

  const initial = {
    expenseId: expense.id,
    date: new Date(expense.date).toISOString().slice(0, 10),
    monthValue: new Date(expense.date).toISOString().slice(0, 7),
    category: expense.category ?? "",
    employeeId: expense.employeeId ?? "",
    employeeName: expense.employee?.name ?? "",
    employeePhone: expense.employee?.phone ?? null,
    description: expense.description ?? "",
    amount: String(Number(expense.amount)),
    currency: (expense as { currency?: string }).currency ?? "USD",
    pMethod: expense.pMethod ?? "",
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href={`/expenses/${id}`}
          className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          ← Back to Expense
        </Link>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Edit Expense</h1>
      </div>
      <EditExpenseForm initial={initial} />
    </main>
  );
}
