"use client";

import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

type Payment = {
  id: string;
  amount: number;
  date: string;
  pMethod: string | null;
  reference: string | null;
  status: string;
  submittedBy: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  paidBy: string | null;
  paidAt: string | null;
};

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  };
  const labels: Record<string, string> = {
    pending: "Pending approval",
    approved: "Approved",
    paid: "Paid",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? styles.pending}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

type Props = {
  payableId: string;
  payments: Payment[];
  canApprove: boolean;
  canMarkPaid: boolean;
};

export default function PayablePaymentList({ payableId, payments, canApprove, canMarkPaid }: Props) {
  const router = useRouter();

  async function handleApprove(paymentId: string) {
    const { isConfirmed } = await Swal.fire({
      title: "Approve payment?",
      text: "This payment will be marked as approved. Finance can then mark it as paid.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Approve",
      confirmButtonColor: "#2563eb",
    });
    if (!isConfirmed) return;

    const res = await fetch(`/api/payables/${payableId}/payments/${paymentId}/approve`, {
      method: "PATCH",
    });
    const data = await res.json();

    if (!res.ok) {
      await Swal.fire({ icon: "error", title: "Error", text: data.error ?? "Failed to approve" });
      return;
    }
    await Swal.fire({ icon: "success", title: "Approved", timer: 1500, showConfirmButton: false });
    router.refresh();
  }

  async function handleMarkPaid(paymentId: string) {
    const { isConfirmed } = await Swal.fire({
      title: "Mark as paid?",
      text: "This will reduce the payable balance. Confirm that the payment has been made.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Mark as paid",
      confirmButtonColor: "#059669",
    });
    if (!isConfirmed) return;

    const res = await fetch(`/api/payables/${payableId}/payments/${paymentId}/paid`, {
      method: "PATCH",
    });
    const data = await res.json();

    if (!res.ok) {
      await Swal.fire({ icon: "error", title: "Error", text: data.error ?? "Failed to mark as paid" });
      return;
    }
    await Swal.fire({ icon: "success", title: "Marked as paid", timer: 1500, showConfirmButton: false });
    router.refresh();
  }

  return (
    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
      {payments.map((p) => (
        <div key={p.id} className="flex items-center justify-between px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-zinc-900 dark:text-white">
                ${p.amount.toLocaleString()}
              </p>
              <StatusBadge status={p.status} />
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {new Date(p.date).toLocaleDateString()}
              {p.pMethod && ` · ${p.pMethod}`}
              {p.submittedBy && ` · Submitted by ${p.submittedBy}`}
              {p.approvedBy && ` · Approved by ${p.approvedBy}`}
              {p.paidBy && ` · Paid by ${p.paidBy}`}
              {p.reference && ` · Ref: ${p.reference}`}
            </p>
          </div>
          <div className="flex gap-2">
            {p.status === "pending" && canApprove && (
              <button
                type="button"
                onClick={() => handleApprove(p.id)}
                className="rounded-lg border border-blue-600 bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Approve
              </button>
            )}
            {p.status === "approved" && canMarkPaid && (
              <button
                type="button"
                onClick={() => handleMarkPaid(p.id)}
                className="rounded-lg border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Mark as paid
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
