import Link from "next/link";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import CreateExpenseForm from "./CreateExpenseForm";

export default async function NewExpensePage() {
  await requirePermission(PERMISSION.EXPENSES_CREATE, { redirectOnForbidden: true });

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
          New Expense
        </h1>
      </div>
      <CreateExpenseForm />
    </main>
  );
}
