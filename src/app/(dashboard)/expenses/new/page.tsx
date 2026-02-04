import Link from "next/link";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import CreateExpenseForm from "./CreateExpenseForm";

export default async function NewExpensePage() {
  await requirePermission(PERMISSION.EXPENSES_CREATE, { redirectOnForbidden: true });

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
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
