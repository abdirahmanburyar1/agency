"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { CARGO_STATUSES, type CargoStatus } from "@/lib/cargo";
import { getCurrencySymbol } from "@/lib/currencies";

type Log = { id: string; status: string; note: string | null; createdAt: string };
type Item = { id: string; description: string; quantity: number; weight: number; unitPrice: number };
type Shipment = {
  id: string;
  trackingNumber: string;
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  source: string;
  destination: string;
  transportMode?: string;
  carrier?: string;
  totalWeight: number;
  price: number;
  currency?: string;
  status: string;
  createdAt: string;
  items: Item[];
  logs: Log[];
};

const NEXT_STATUS: Record<string, CargoStatus | null> = {
  PENDING: "WAREHOUSE",
  WAREHOUSE: "ASSIGNED_TO_MANIFEST",
  ASSIGNED_TO_MANIFEST: "DISPATCHED",
  DISPATCHED: "ARRIVED",
  ARRIVED: "DELIVERED",
  DELIVERED: null,
};

export default function CargoDetailClient({
  shipment,
  canEdit,
  statusStyles,
  paymentId,
  canViewPayments,
}: {
  shipment: Shipment;
  canEdit: boolean;
  statusStyles: Record<string, string>;
  paymentId: string | null;
  canViewPayments: boolean;
}) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);
  const nextStatus = NEXT_STATUS[shipment.status] ?? null;

  async function confirmAndUpdateStatus(status: string) {
    const statusLabel = status.replace(/_/g, " ");
    const result = await Swal.fire({
      title: "Confirm status change",
      text: `Change status to "${statusLabel}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, update",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d97706",
    });
    if (!result.isConfirmed) return;

    setUpdating(status);
    try {
      const res = await fetch(`/api/cargo/${shipment.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await Swal.fire({ icon: "success", title: "Updated", timer: 1200, showConfirmButton: false });
        router.refresh();
      } else {
        const data = await res.json();
        await Swal.fire({ icon: "error", title: "Error", text: data.error ?? "Failed to update status" });
      }
    } catch {
      await Swal.fire({ icon: "error", title: "Error", text: "Failed to update status" });
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            {shipment.trackingNumber}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Created {new Date(shipment.createdAt).toLocaleString()}
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
            statusStyles[shipment.status] ?? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          }`}
        >
          {shipment.status.replace(/_/g, " ")}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="mb-4 font-semibold text-zinc-900 dark:text-white">Sender & Receiver</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Sender
                </p>
                <p className="mt-0.5 font-medium text-zinc-800 dark:text-zinc-200">{shipment.senderName}</p>
                {shipment.senderPhone && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{shipment.senderPhone}</p>
                )}
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Receiver
                </p>
                <p className="mt-0.5 font-medium text-zinc-800 dark:text-zinc-200">{shipment.receiverName}</p>
                {shipment.receiverPhone && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{shipment.receiverPhone}</p>
                )}
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  From
                </p>
                <p className="mt-0.5 font-medium text-zinc-800 dark:text-zinc-200">{shipment.source}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  To
                </p>
                <p className="mt-0.5 font-medium text-zinc-800 dark:text-zinc-200">{shipment.destination}</p>
              </div>
              {(shipment.transportMode || shipment.carrier) && (
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                    Transport
                  </p>
                  <p className="mt-0.5 font-medium text-zinc-800 dark:text-zinc-200">
                    {[shipment.transportMode ? String(shipment.transportMode).charAt(0).toUpperCase() + String(shipment.transportMode).slice(1) : null, shipment.carrier].filter(Boolean).join(" – ")}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800 sm:px-6 sm:py-4">
              <h2 className="font-semibold text-zinc-900 dark:text-white">Items</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 sm:px-6 sm:py-3">
                      Description
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 sm:px-6 sm:py-3">
                      Qty
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 sm:px-6 sm:py-3">
                      Weight
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 sm:px-6 sm:py-3">
                      $/kg
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {shipment.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 sm:px-6 sm:py-3">
                        {item.description}
                      </td>
                      <td className="px-3 py-2 text-right text-sm text-zinc-700 dark:text-zinc-300 sm:px-6 sm:py-3">
                        {item.quantity}
                      </td>
                      <td className="px-3 py-2 text-right text-sm text-zinc-700 dark:text-zinc-300 sm:px-6 sm:py-3">
                        {item.weight} kg
                      </td>
                      <td className="px-3 py-2 text-right text-sm text-zinc-700 dark:text-zinc-300 sm:px-6 sm:py-3">
                        ${(item.unitPrice ?? 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between border-t border-zinc-200 px-4 py-3 dark:border-zinc-800 sm:px-6 sm:py-4">
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Total Weight</span>
              <span className="font-semibold text-zinc-900 dark:text-white">{shipment.totalWeight} kg</span>
            </div>
            <div className="flex justify-between border-t border-zinc-200 px-4 py-3 dark:border-zinc-800 sm:px-6 sm:py-4">
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Price</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {getCurrencySymbol(shipment.currency ?? "USD")}{shipment.price.toFixed(2)} {shipment.currency ?? "USD"}
              </span>
            </div>
            {canViewPayments && paymentId && (
              <div className="flex justify-between border-t border-zinc-200 px-4 py-3 dark:border-zinc-800 sm:px-6 sm:py-4">
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Payment</span>
                <Link
                  href={`/payments/${paymentId}`}
                  className="font-medium text-amber-600 hover:underline dark:text-amber-400"
                >
                  View payment →
                </Link>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="mb-4 font-semibold text-zinc-900 dark:text-white">Timeline</h2>
            <div className="space-y-4">
              {shipment.logs.map((log, idx) => (
                <div key={log.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="size-3 rounded-full bg-amber-500" />
                    {idx < shipment.logs.length - 1 && (
                      <div className="mt-1 w-0.5 flex-1 bg-zinc-200 dark:bg-zinc-700" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium text-zinc-800 dark:text-zinc-200">
                      {log.status.replace(/_/g, " ")}
                    </p>
                    {log.note && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{log.note}</p>
                    )}
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="mb-4 font-semibold text-zinc-900 dark:text-white">QR Code</h2>
            <div className="flex justify-center rounded-lg bg-white p-4 dark:bg-zinc-100">
              <QRCodeSVG value={shipment.trackingNumber} size={160} level="M" />
            </div>
            <p className="mt-3 text-center font-mono text-sm text-zinc-600 dark:text-zinc-500">
              {shipment.trackingNumber}
            </p>
            <a
              href={`/track/${encodeURIComponent(shipment.trackingNumber)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block text-center text-sm font-medium text-amber-600 hover:underline dark:text-amber-400"
            >
              Public tracking page →
            </a>
          </div>

          {canEdit && nextStatus && (
            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
              <h2 className="mb-4 font-semibold text-zinc-900 dark:text-white">Update Status</h2>
              <button
                type="button"
                onClick={() => confirmAndUpdateStatus(nextStatus)}
                disabled={!!updating}
                className="w-full rounded-xl bg-amber-600 px-6 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:opacity-70 dark:bg-amber-500 dark:hover:bg-amber-600"
              >
                {updating ? "Updating..." : `Mark as ${nextStatus.replace(/_/g, " ")}`}
              </button>
              {CARGO_STATUSES.filter((s) => s !== shipment.status && s !== nextStatus).length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Or set directly:</p>
                  {CARGO_STATUSES.filter((s) => s !== shipment.status).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => confirmAndUpdateStatus(s)}
                      disabled={!!updating}
                      className="block w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      {s.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
