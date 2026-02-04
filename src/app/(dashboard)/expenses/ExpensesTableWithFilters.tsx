"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type SerializedExpense = {
  id: string;
  date: string;
  description: string | null;
  category: string | null;
  amount: number;
  pMethod: string | null;
  status: string;
  employee: { name: string; role: string | null; phone: string | null } | null;
};

type ExpensesTableWithFiltersProps = {
  expenses: SerializedExpense[];
  categories: string[];
};

function matchSearch(expense: SerializedExpense, q: string): boolean {
  if (!q.trim()) return true;
  const search = q.trim().toLowerCase();
  const desc = expense.description ?? "";
  const cat = expense.category ?? "";
  const emp = expense.employee?.name ?? "";
  const empPhone = expense.employee?.phone ?? "";
  return (
    desc.toLowerCase().includes(search) ||
    cat.toLowerCase().includes(search) ||
    emp.toLowerCase().includes(search) ||
    empPhone.toLowerCase().includes(search)
  );
}

export default function ExpensesTableWithFilters({
  expenses: allExpenses,
  categories,
}: ExpensesTableWithFiltersProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredExpenses = useMemo(() => {
    return allExpenses.filter((e) => {
      if (!matchSearch(e, search)) return false;
      if (category && (e.category ?? "") !== category) return false;
      if (status && e.status !== status) return false;
      if (dateFrom) {
        const d = new Date(e.date);
        const from = new Date(dateFrom);
        if (d < from) return false;
      }
      if (dateTo) {
        const d = new Date(e.date);
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (d > to) return false;
      }
      return true;
    });
  }, [allExpenses, search, category, dateFrom, dateTo]);

  const hasActiveFilters = search || category || dateFrom || dateTo;

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <>
      <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Filters</h2>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-400"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Description, category, employee..."
              className="w-full min-w-[200px] rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-40 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            >
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-32 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Date from</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Date to</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
              <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">Date</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">Description</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">Category</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">Status</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">Employee</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-white">Amount</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">P Method</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                  No expenses found
                </td>
              </tr>
            ) : (
              filteredExpenses.map((e) => (
                <tr key={e.id} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    <Link
                      href={`/expenses/${e.id}`}
                      className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {new Date(e.date).toLocaleDateString()}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{e.description ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{e.category ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        e.status === "approved"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : e.status === "rejected"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                      }`}
                    >
                      {e.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {e.employee
                      ? e.employee.phone?.trim()
                        ? `${e.employee.name} - ${e.employee.phone}`
                        : e.employee.name
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-red-600 dark:text-red-400">
                    ${e.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{e.pMethod ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
