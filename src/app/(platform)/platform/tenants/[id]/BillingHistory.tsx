"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BillingHistory({ payments }: { payments: any[] }) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);

  const handleMarkPaid = async (paymentId: string) => {
    setUpdating(paymentId);

    try {
      const res = await fetch(`/api/platform/subscription-payments/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid", paidDate: new Date().toISOString() }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to update payment");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred");
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
      paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
      failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      refunded: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400",
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  if (payments.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
        <p className="text-slate-600 dark:text-slate-400">No billing history yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow dark:border-slate-800 dark:bg-slate-900">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
        <thead className="bg-slate-50 dark:bg-slate-800">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
              Invoice #
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
              Period
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
              Amount
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
              Due Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
              Paid Date
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td className="px-4 py-3 font-mono text-sm text-slate-900 dark:text-white">
                {payment.invoiceNumber || "N/A"}
              </td>
              <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                {new Date(payment.periodStart).toLocaleDateString()} -{" "}
                {new Date(payment.periodEnd).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white">
                ${parseFloat(payment.amount).toFixed(2)} {payment.currency}
              </td>
              <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                {new Date(payment.dueDate).toLocaleDateString()}
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadge(payment.status)}`}>
                  {payment.status}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                {payment.paidDate ? new Date(payment.paidDate).toLocaleDateString() : "—"}
              </td>
              <td className="px-4 py-3 text-right">
                {payment.status === "pending" && (
                  <button
                    onClick={() => handleMarkPaid(payment.id)}
                    disabled={updating === payment.id}
                    className="rounded bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {updating === payment.id ? "..." : "Mark Paid"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
