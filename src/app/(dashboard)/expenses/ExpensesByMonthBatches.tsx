"use client";

import Link from "next/link";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { useRouter } from "next/navigation";
import { useState } from "react";

type MonthBatch = {
  monthKey: string;
  monthLabel: string;
  totalUsd: number;
  pendingCount: number;
  expenseCount: number;
};

type Props = {
  batches: MonthBatch[];
  canApprove: boolean;
};

function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function ExpensesByMonthBatches({ batches, canApprove }: Props) {
  const router = useRouter();
  const [approving, setApproving] = useState<string | null>(null);

  async function handleApproveBatch(e: React.MouseEvent, monthKey: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!canApprove || approving) return;
    const label = formatMonthLabel(monthKey);
    const { value: confirmed } = await Swal.fire({
      title: `Approve all pending expenses for ${label}?`,
      text: "This will approve all pending expenses in this month at once. This action cannot be undone.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#059669",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Approve all",
    });
    if (!confirmed) return;
    setApproving(monthKey);
    try {
      const res = await fetch("/api/expenses/approve-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month: monthKey }),
      });
      const data = await res.json();
      if (res.ok) {
        await Swal.fire({ title: "Approved", text: data.message ?? "Batch approved.", icon: "success" });
        router.refresh();
      } else {
        await Swal.fire({ title: "Error", text: data.error ?? "Failed to approve batch.", icon: "error" });
      }
    } catch {
      await Swal.fire({ title: "Error", text: "Failed to approve batch.", icon: "error" });
    } finally {
      setApproving(null);
    }
  }

  if (batches.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-zinc-500 dark:text-zinc-400">No expenses yet. Create one to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {batches.map((batch) => (
        <Link
          key={batch.monthKey}
          href={`/expenses/month/${batch.monthKey}`}
          className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-4 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/80"
        >
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              {batch.monthLabel}
            </h2>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              {batch.expenseCount} expense{batch.expenseCount !== 1 ? "s" : ""}
              {batch.pendingCount > 0 && (
                <span className="ml-2 text-amber-600 dark:text-amber-400">
                  ({batch.pendingCount} pending)
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-right">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Total (USD)</span>
              <span className="ml-2 block text-xl font-bold text-zinc-900 dark:text-white">
                ${batch.totalUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </p>
            {canApprove && batch.pendingCount > 0 && (
              <button
                type="button"
                onClick={(ev) => handleApproveBatch(ev, batch.monthKey)}
                disabled={!!approving}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600"
              >
                {approving === batch.monthKey ? "Approving…" : "Approve all"}
              </button>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
