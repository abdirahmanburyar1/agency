"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { getCurrencySymbol } from "@/lib/currencies";
import ExpenseMarkPaidButton from "../../[id]/ExpenseMarkPaidButton";

type SerializedExpense = {
  id: string;
  date: string;
  description: string | null;
  category: string | null;
  amount: number;
  currency: string;
  pMethod: string | null;
  status: string;
  employee: { name: string; role: string | null; phone: string | null } | null;
};

type Props = {
  expenses: SerializedExpense[];
  monthKey: string;
  canApprove: boolean;
  canMarkPaid: boolean;
};

export default function ExpenseMonthDetailClient({
  expenses,
  monthKey,
  canApprove,
  canMarkPaid,
}: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [approving, setApproving] = useState(false);

  const pendingIds = expenses.filter((e) => e.status === "pending").map((e) => e.id);
  const allPendingSelected =
    pendingIds.length > 0 && pendingIds.every((id) => selected.has(id));

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllPending() {
    if (allPendingSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        pendingIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        pendingIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }

  async function handleBulkApprove() {
    const toApprove = Array.from(selected).filter((id) =>
      expenses.find((e) => e.id === id && e.status === "pending")
    );
    if (toApprove.length === 0 || !canApprove || approving) return;

    const { value: confirmed } = await Swal.fire({
      title: `Approve ${toApprove.length} expense${toApprove.length !== 1 ? "s" : ""}?`,
      text: "This will approve the selected pending expenses. This action cannot be undone.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#059669",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Approve",
    });
    if (!confirmed) return;

    setApproving(true);
    try {
      const results = await Promise.all(
        toApprove.map((id) =>
          fetch(`/api/expenses/${id}/approve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "approve" }),
          })
        )
      );
      const failed = results.filter((r) => !r.ok).length;
      if (failed === 0) {
        await Swal.fire({
          title: "Approved",
          text: `Approved ${toApprove.length} expense${toApprove.length !== 1 ? "s" : ""}.`,
          icon: "success",
        });
        router.refresh();
      } else {
        await Swal.fire({
          title: "Partial success",
          text: `Approved ${toApprove.length - failed} of ${toApprove.length}. ${failed} failed.`,
          icon: "warning",
        });
        router.refresh();
      }
    } catch {
      await Swal.fire({ title: "Error", text: "Failed to approve.", icon: "error" });
    } finally {
      setApproving(false);
    }
  }

  const pendingSelectedCount = Array.from(selected).filter((id) =>
    expenses.some((e) => e.id === id && e.status === "pending")
  ).length;

  return (
    <div className="space-y-4">
      {canApprove && pendingIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={allPendingSelected}
              onChange={toggleSelectAllPending}
              className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Select all pending
            </span>
          </label>
          {pendingSelectedCount > 0 && (
            <button
              type="button"
              onClick={handleBulkApprove}
              disabled={approving}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600"
            >
              {approving ? "Approving…" : `Approve ${pendingSelectedCount} selected`}
            </button>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/50">
              {canApprove && <th className="w-10 px-4 py-3" />}
              <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
                Date
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
                Description
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
                Category
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
                Status
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
                Employee
              </th>
              <th className="px-4 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">
                Amount
              </th>
              {canMarkPaid && (
                <th className="px-4 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr
                key={e.id}
                className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
              >
                {canApprove && (
                  <td className="px-4 py-3">
                    {e.status === "pending" ? (
                      <input
                        type="checkbox"
                        checked={selected.has(e.id)}
                        onChange={() => toggleSelect(e.id)}
                        className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    ) : (
                      <span className="text-zinc-300">—</span>
                    )}
                  </td>
                )}
                <td className="px-4 py-3">
                  <Link
                    href={`/expenses/${e.id}`}
                    className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {new Date(e.date).toLocaleDateString()}
                  </Link>
                </td>
                <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                  {e.description ?? "—"}
                </td>
                <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                  {e.category ?? "—"}
                </td>
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
                  {getCurrencySymbol(e.currency)}
                  {e.amount.toLocaleString()}
                </td>
                {canMarkPaid && (
                  <td className="px-4 py-3 text-right">
                    {e.status === "approved" && (
                      <ExpenseMarkPaidButton expenseId={e.id} />
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
