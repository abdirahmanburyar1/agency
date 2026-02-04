import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import ExpensesTableWithFilters from "./ExpensesTableWithFilters";

export default async function ExpensesPage() {
  await requirePermission(PERMISSION.EXPENSES_VIEW, { redirectOnForbidden: true });
  const canCreate = await (await import("@/lib/permissions")).canAccess(PERMISSION.EXPENSES_CREATE);

  const [expenses, categoryRows] = await Promise.all([
    prisma.expense.findMany({
      orderBy: { date: "desc" },
      include: { employee: true },
    }),
    prisma.expense.findMany({
      where: { category: { not: null } },
      select: { category: true },
      distinct: ["category"],
    }),
  ]);

  const categories = categoryRows
    .map((r) => r.category)
    .filter((c): c is string => c != null)
    .sort();

  const settingsCategories = await prisma.setting
    .findMany({ where: { type: "expense_category" }, select: { value: true } })
    .then((s) => s.map((x) => x.value));
  const allCategories = [...new Set([...categories, ...settingsCategories])].sort();

  const serializedExpenses = expenses.map((e) => ({
    id: e.id,
    date: e.date.toISOString(),
    description: e.description,
    category: e.category,
    amount: Number(e.amount),
    pMethod: e.pMethod,
    status: e.status,
    employee: e.employee
      ? { name: e.employee.name, role: e.employee.role, phone: e.employee.phone }
      : null,
  }));

  return (
    <main className="w-full py-6 sm:py-8">
      <div className="mb-6 flex items-center justify-between">
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

      <ExpensesTableWithFilters expenses={serializedExpenses} categories={allCategories} />
    </main>
  );
}
