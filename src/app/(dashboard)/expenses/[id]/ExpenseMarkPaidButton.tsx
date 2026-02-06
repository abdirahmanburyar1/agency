"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

export default function ExpenseMarkPaidButton({ expenseId }: { expenseId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleMarkPaid() {
    const result = await Swal.fire({
      title: "Mark as paid?",
      text: "This expense will be marked as paid. Finance has processed the payment.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Mark as paid",
      confirmButtonColor: "#2563eb",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/expenses/${expenseId}/paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (!res.ok) {
        await Swal.fire({
          title: "Error",
          text: data.error ?? "Failed to mark expense as paid",
          icon: "error",
        });
        return;
      }

      await Swal.fire({
        title: "Done",
        text: "Expense has been marked as paid.",
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
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleMarkPaid}
      disabled={loading}
      className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? "Processing..." : "Mark as paid"}
    </button>
  );
}
