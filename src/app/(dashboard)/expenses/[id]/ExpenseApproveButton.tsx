"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

export default function ExpenseApproveButton({
  expenseId,
}: {
  expenseId: string;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  async function handleAction(action: "approve" | "reject") {
    const title = action === "approve" ? "Approve expense?" : "Reject expense?";
    const text =
      action === "approve"
        ? "This expense will be marked as approved and included in reports."
        : "This expense will be marked as rejected and excluded from reports.";
    const confirmText = action === "approve" ? "Approve" : "Reject";
    const confirmColor = action === "approve" ? "#059669" : "#dc2626";

    const result = await Swal.fire({
      title,
      text,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: confirmText,
      confirmButtonColor: confirmColor,
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    setLoading(action);
    try {
      const res = await fetch(`/api/expenses/${expenseId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();

      if (!res.ok) {
        await Swal.fire({
          title: "Error",
          text: data.error ?? "Failed to update expense",
          icon: "error",
        });
        return;
      }

      await Swal.fire({
        title: action === "approve" ? "Approved" : "Rejected",
        text: `Expense has been ${action === "approve" ? "approved" : "rejected"} successfully.`,
        icon: "success",
      });
      router.refresh();
    } catch {
      await Swal.fire({
        title: "Error",
        text: "Something went wrong",
        icon: "error",
      });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => handleAction("approve")}
        disabled={!!loading}
        className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading === "approve" ? "Approving..." : "Approve"}
      </button>
      <button
        type="button"
        onClick={() => handleAction("reject")}
        disabled={!!loading}
        className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
      >
        {loading === "reject" ? "Rejecting..." : "Reject"}
      </button>
    </div>
  );
}
