"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

type PayableDetailClientProps = {
  payableId: string;
  balance: number;
  availableForNew: number;
  payableName: string;
  canRecordPayment: boolean;
  canApprove: boolean;
  canMarkPaid: boolean;
  payments: unknown[];
};

export default function PayableDetailClient({
  payableId,
  balance,
  availableForNew,
  payableName,
  canRecordPayment,
}: PayableDetailClientProps) {
  const router = useRouter();
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetch("/api/settings/ticket-options")
      .then((r) => r.json())
      .then((d) => setPaymentMethods(d.payment_method ?? []))
      .catch(() => {});
  }, []);

  async function handleRecordPayment() {
    const options = paymentMethods
      .map((m) => `<option value="${m.replace(/"/g, "&quot;")}">${m}</option>`)
      .join("");

    const { value: formValues } = await Swal.fire({
      title: "Submit payment for approval",
      html: `
        <p class="text-left text-sm text-zinc-600 mb-4">${payableName} — Available to submit: $${availableForNew.toLocaleString()}</p>
        <div class="text-left space-y-3">
          <div>
            <label class="block text-xs font-medium text-zinc-500 mb-1">Amount *</label>
            <input id="record-amount" type="number" step="0.01" min="0" max="${availableForNew}" placeholder="0.00" 
              class="swal2-input w-full" style="margin: 0; width: 100%; box-sizing: border-box;">
          </div>
          <div>
            <label class="block text-xs font-medium text-zinc-500 mb-1">Payment method *</label>
            <select id="record-pmethod" class="swal2-input w-full" style="margin: 0; width: 100%; box-sizing: border-box;">
              <option value="">Select payment method</option>
              ${options}
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-zinc-500 mb-1">Reference (optional)</label>
            <input id="record-ref" type="text" placeholder="Transaction ref..." 
              class="swal2-input w-full" style="margin: 0; width: 100%; box-sizing: border-box;">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Submit for approval",
      confirmButtonColor: "#059669",
      cancelButtonText: "Cancel",
      focusConfirm: false,
      preConfirm: () => {
        const amountEl = document.getElementById("record-amount") as HTMLInputElement;
        const pMethodEl = document.getElementById("record-pmethod") as HTMLSelectElement;
        const refEl = document.getElementById("record-ref") as HTMLInputElement;
        const amt = Number(amountEl?.value ?? 0);
        const pMethod = pMethodEl?.value?.trim() ?? "";
        const reference = refEl?.value?.trim() || null;
        if (!amt || amt <= 0) {
          Swal.showValidationMessage("Enter a valid amount");
          return false;
        }
        if (amt > availableForNew) {
          Swal.showValidationMessage(`Amount cannot exceed $${availableForNew.toLocaleString()}`);
          return false;
        }
        if (!pMethod) {
          Swal.showValidationMessage("Select a payment method");
          return false;
        }
        return { amount: amt, pMethod, reference };
      },
    });

    if (!formValues) return;

    setProcessing(true);
    try {
      const res = await fetch(`/api/payables/${payableId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: formValues.amount,
          pMethod: formValues.pMethod,
          reference: formValues.reference,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: data.error ?? "Failed to record payment",
        });
        return;
      }

      await Swal.fire({
        icon: "success",
        title: "Submitted for approval",
        text: "General Director must approve before Finance can mark as paid.",
        timer: 2000,
        showConfirmButton: false,
      });
      router.refresh();
    } catch {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to record payment",
      });
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="font-semibold text-zinc-900 dark:text-white">Submit payment</h2>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        Finance submits → General Director approves → Finance marks as paid.
      </p>
      {canRecordPayment && availableForNew > 0 && (
        <button
          type="button"
          onClick={handleRecordPayment}
          disabled={processing}
          className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? "Processing…" : "Submit payment for approval"}
        </button>
      )}
    </div>
  );
}
