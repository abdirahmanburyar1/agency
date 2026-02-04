"use client";

import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

type TicketAdjustmentButtonProps = {
  ticketId: string;
  currentNetSales: number;
  currentNetCost: number;
};

export default function TicketAdjustmentButton({
  ticketId,
  currentNetSales,
  currentNetCost,
}: TicketAdjustmentButtonProps) {
  const router = useRouter();

  async function handleAdjustment() {
    const { value: formValues } = await Swal.fire({
      title: "Adjust amounts",
      html: `
        <p class="text-left text-sm text-zinc-600 mb-4">Update net sales and net cost. Payable and receivable will be updated accordingly.</p>
        <div class="text-left space-y-3">
          <div>
            <label class="block text-xs font-medium text-zinc-500 mb-1">New net sales *</label>
            <input id="adj-netSales" type="number" step="0.01" min="0" value="${currentNetSales}" required
              class="swal2-input w-full" style="margin: 0; width: 100%; box-sizing: border-box;">
          </div>
          <div>
            <label class="block text-xs font-medium text-zinc-500 mb-1">New net cost *</label>
            <input id="adj-netCost" type="number" step="0.01" min="0" value="${currentNetCost}" required
              class="swal2-input w-full" style="margin: 0; width: 100%; box-sizing: border-box;">
          </div>
          <div>
            <label class="block text-xs font-medium text-zinc-500 mb-1">Reason (optional)</label>
            <input id="adj-reason" type="text" placeholder="e.g. Extra days, Deduct days"
              class="swal2-input w-full" style="margin: 0; width: 100%; box-sizing: border-box;">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Apply",
      confirmButtonColor: "#334155",
      cancelButtonText: "Cancel",
      focusConfirm: false,
      preConfirm: () => {
        const salesEl = document.getElementById("adj-netSales") as HTMLInputElement;
        const costEl = document.getElementById("adj-netCost") as HTMLInputElement;
        const reasonEl = document.getElementById("adj-reason") as HTMLInputElement;
        const newNetSales = Number(salesEl?.value ?? 0);
        const newNetCost = Number(costEl?.value ?? 0);
        if (newNetSales < 0) {
          Swal.showValidationMessage("Net sales cannot be negative");
          return false;
        }
        if (newNetCost < 0) {
          Swal.showValidationMessage("Net cost cannot be negative");
          return false;
        }
        if (newNetSales < newNetCost) {
          Swal.showValidationMessage("Net sales cannot be less than net cost");
          return false;
        }
        return {
          newNetSales,
          newNetCost,
          reason: reasonEl?.value?.trim() || null,
        };
      },
    });

    if (!formValues) return;

    try {
      const res = await fetch(`/api/tickets/${ticketId}/adjustments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValues),
      });
      const data = await res.json();

      if (!res.ok) {
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: data.error ?? "Failed to apply adjustment",
        });
        return;
      }

      await Swal.fire({
        icon: "success",
        title: "Adjustment applied",
        timer: 1200,
        showConfirmButton: false,
      });
      router.refresh();
    } catch {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to apply adjustment",
      });
    }
  }

  return (
    <button
      type="button"
      onClick={handleAdjustment}
      className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
    >
      Adjustment
    </button>
  );
}
