"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

type PaymentDetailClientProps = {
  paymentId: string;
  balance: number;
  balanceCurrency: string;
  customerName: string;
  canRecordReceipt: boolean;
  canEditStatus: boolean;
  isCargo?: boolean;
  currencies: string[];
};

export default function PaymentDetailClient({
  paymentId,
  balance,
  balanceCurrency,
  customerName,
  canRecordReceipt,
  canEditStatus,
  isCargo = false,
  currencies = ["USD"],
}: PaymentDetailClientProps) {
  const router = useRouter();
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetch("/api/settings/ticket-options")
      .then((r) => r.json())
      .then((d) => setPaymentMethods(d.payment_method ?? []))
      .catch(() => {});
  }, []);

  async function handleRecordReceipt() {
    const options = paymentMethods
      .map((m) => `<option value="${m.replace(/"/g, "&quot;")}">${m}</option>`)
      .join("");
    const currencyOptions = currencies
      .map((c) => `<option value="${c}">${c}</option>`)
      .join("");
    const collectionOptions = ""; // Cargo payment is always at shipment; no need to ask

    const { value: formValues } = await Swal.fire({
      title: "Record payment received",
      html: `
        <p class="text-left text-sm text-zinc-600 mb-4">${customerName} — Balance due: ${balanceCurrency === "USD" ? "$" : ""}${balance.toLocaleString()} ${balanceCurrency}</p>
        <div class="text-left space-y-3">
          <div>
            <label class="block text-xs font-medium text-zinc-500 mb-1">Amount *</label>
            <input id="record-amount" type="number" step="0.01" min="0" placeholder="0.00" 
              class="swal2-input w-full" style="margin: 0; width: 100%; box-sizing: border-box;">
          </div>
          <div>
            <label class="block text-xs font-medium text-zinc-500 mb-1">Currency *</label>
            <select id="record-currency" class="swal2-input w-full" style="margin: 0; width: 100%; box-sizing: border-box;">
              ${currencyOptions}
            </select>
          </div>
          ${collectionOptions}
          <div>
            <label class="block text-xs font-medium text-zinc-500 mb-1">Payment method *</label>
            <select id="record-pmethod" class="swal2-input w-full" style="margin: 0; width: 100%; box-sizing: border-box;">
              <option value="">Select payment method</option>
              ${options}
            </select>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Record & Print receipt",
      confirmButtonColor: "#059669",
      cancelButtonText: "Cancel",
      focusConfirm: false,
      preConfirm: () => {
        const amountEl = document.getElementById("record-amount") as HTMLInputElement;
        const currencyEl = document.getElementById("record-currency") as HTMLSelectElement;
        const pMethodEl = document.getElementById("record-pmethod") as HTMLSelectElement;
        const amt = Number(amountEl?.value ?? 0);
        const curr = currencyEl?.value?.trim() ?? "USD";
        const pMethod = pMethodEl?.value?.trim() ?? "";
        if (!amt || amt <= 0) {
          Swal.showValidationMessage("Enter a valid amount");
          return false;
        }
        if (!pMethod) {
          Swal.showValidationMessage("Select a payment method");
          return false;
        }
        return { amount: amt, currency: curr, pMethod };
      },
    });

    if (!formValues) return;

    setProcessing(true);
    try {
      const res = await fetch(`/api/payments/${paymentId}/receipts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: formValues.amount,
          currency: formValues.currency,
          pMethod: formValues.pMethod,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: data.error ?? "Failed to record receipt",
        });
        return;
      }

      await Swal.fire({
        icon: "success",
        title: "Payment recorded",
        text: "Redirecting to receipt...",
        timer: 1500,
        showConfirmButton: false,
      });
      router.refresh();
      router.push(`/payments/${paymentId}/receipt?r=${data.id}`);
    } catch {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to record receipt",
      });
    } finally {
      setProcessing(false);
    }
  }

  async function handleSetStatus() {
    const { value: expectedDate } = await Swal.fire({
      title: "Mark as credit",
      html: `
        <p class="text-left text-sm text-zinc-600 mb-4">When is the customer expected to pay?</p>
        <div class="text-left">
          <label class="block text-xs font-medium text-zinc-500 mb-1">Expected date *</label>
          <input id="expected-date" type="date" required
            class="swal2-input w-full" style="margin: 0; width: 100%; box-sizing: border-box;">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Set as credit",
      confirmButtonColor: "#334155",
      cancelButtonText: "Cancel",
      focusConfirm: false,
      preConfirm: () => {
        const el = document.getElementById("expected-date") as HTMLInputElement;
        const val = el?.value?.trim();
        if (!val) {
          Swal.showValidationMessage("Expected date is required");
          return false;
        }
        return val;
      },
    });
    if (!expectedDate) return;

    try {
      const res = await fetch(`/api/payments/${paymentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "credit", expectedDate }),
      });

      if (!res.ok) {
        const data = await res.json();
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: data.error ?? "Failed to update status",
        });
        return;
      }

      await Swal.fire({
        icon: "success",
        title: "Status updated",
        timer: 1200,
        showConfirmButton: false,
      });
      router.refresh();
    } catch {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update status",
      });
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <h2 className="font-semibold text-zinc-900 dark:text-white">Actions</h2>
      </div>
      <div className="flex flex-wrap items-center gap-4 px-6 py-4">
        {balance < 0 && (
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Refund due: {balanceCurrency === "USD" ? "$" : ""}{Math.abs(balance).toLocaleString()} {balanceCurrency} — customer overpaid after adjustment. Process refund separately.
          </p>
        )}
        {canRecordReceipt && balance > 0 && (
          <button
            type="button"
            onClick={handleRecordReceipt}
            disabled={processing}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-emerald-500 dark:hover:bg-emerald-600"
          >
            {processing ? "Payment processing…" : "Record payment received"}
          </button>
        )}
        {canEditStatus && balance > 0 && (
          <button
            type="button"
            onClick={handleSetStatus}
            className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-400 dark:hover:bg-rose-900/50"
          >
            Mark as credit
          </button>
        )}
        {balance === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Payment fully received. No actions available.
          </p>
        )}
      </div>
    </div>
  );
}
