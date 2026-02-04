"use client";

import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

type TicketCancelButtonProps = {
  ticketId: string;
  reference: string;
};

export default function TicketCancelButton({
  ticketId,
  reference,
}: TicketCancelButtonProps) {
  const router = useRouter();

  async function handleCancel() {
    const result = await Swal.fire({
      title: "Cancel ticket?",
      html: `This will cancel ticket <strong>${reference}</strong> and its associated payment. This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, cancel ticket",
      confirmButtonColor: "#dc2626",
      cancelButtonText: "Keep ticket",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/tickets/${ticketId}/cancel`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: data.error ?? "Failed to cancel ticket",
        });
        return;
      }

      await Swal.fire({
        icon: "success",
        title: "Ticket canceled",
        timer: 1200,
        showConfirmButton: false,
      });
      router.refresh();
    } catch {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to cancel ticket",
      });
    }
  }

  return (
    <button
      type="button"
      onClick={handleCancel}
      className="rounded-xl border border-rose-300 bg-rose-50 px-5 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-400 dark:hover:bg-rose-900/50"
    >
      Cancel ticket
    </button>
  );
}
