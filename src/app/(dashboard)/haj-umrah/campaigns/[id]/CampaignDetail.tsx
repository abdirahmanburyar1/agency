"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { CheckCircleIcon, XCircleIcon, EyeIcon, ReceiptIcon, UsersIcon, CalendarIcon, PackageIcon, DollarIcon, PencilIcon } from "../../icons";

type PackageItem = {
  name: string;
  type: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

type Booking = {
  id: string;
  trackNumber: number | null;
  trackNumberDisplay: string;
  customerName: string;
  customerPhone: string | null;
  date: string;
  status: string;
  canceledAt: string | null;
  packageCount: number;
  totalAmount: number;
  packages: PackageItem[];
};

type Campaign = {
  id: string;
  date: string;
  returnDate: string | null;
  month: string;
  name: string | null;
  type: string | null;
  leader: { id: string; name: string | null; email: string } | null;
  canceledAt: string | null;
  bookings: Booking[];
};

type Props = {
  campaign: Campaign;
  canEdit: boolean;
  /** Leader app view: show bulk confirm only, hide Edit/Cancel campaign */
  leaderView?: boolean;
};

export default function CampaignDetail({ campaign, canEdit, leaderView }: Props) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [packagesModalBooking, setPackagesModalBooking] = useState<Booking | null>(null);

  const d = new Date(campaign.date);
  const dateDisplay = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeDisplay = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  const returnDateDisplay = campaign.returnDate
    ? (() => {
        const rd = new Date(campaign.returnDate!);
        return `${rd.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })} ${rd.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
      })()
    : null;
  const campaignDateInFuture = d > new Date();
  const isCanceled = !!campaign.canceledAt;
  const draftBookings = campaign.bookings.filter((b) => b.status === "draft" && !b.canceledAt);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size >= draftBookings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(draftBookings.map((b) => b.id)));
    }
  }

  async function handleBulkConfirm() {
    if (selectedIds.size === 0) {
      setError("Select at least one booking.");
      return;
    }
    const result = await Swal.fire({
      title: "Confirm selected bookings?",
      text: `${selectedIds.size} booking(s) will be marked as confirmed.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Confirm",
      confirmButtonColor: "#0d9488",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;

    setError("");
    setLoading(true);
    Swal.fire({
      title: "Processing…",
      text: "Confirming bookings…",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    try {
      const res = await fetch("/api/haj-umrah/bookings/bulk-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingIds: Array.from(selectedIds) }),
      });
      const data = await res.json();
      await Swal.close();
      if (!res.ok) {
        await Swal.fire({
          title: "Error",
          text: data.error ?? "Failed to confirm",
          icon: "error",
        });
        return;
      }
      setSelectedIds(new Set());
      await Swal.fire({
        title: "Done",
        text: "Bookings confirmed.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
      router.refresh();
    } catch {
      await Swal.close();
      await Swal.fire({
        title: "Error",
        text: "Failed to confirm bookings",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelCampaign() {
    const result = await Swal.fire({
      title: "Cancel this campaign?",
      text: "All customers (bookings) in this campaign will be marked as canceled. This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, cancel campaign",
      confirmButtonColor: "#dc2626",
      cancelButtonText: "Keep campaign",
    });
    if (!result.isConfirmed) return;

    setError("");
    setLoading(true);
    Swal.fire({
      title: "Processing…",
      text: "Canceling campaign…",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    try {
      const res = await fetch(`/api/haj-umrah/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cancel: true }),
      });
      const data = await res.json();
      await Swal.close();
      if (!res.ok) {
        await Swal.fire({
          title: res.status === 400 ? "Cannot cancel" : "Error",
          text: data.error ?? "Failed to cancel campaign",
          icon: res.status === 400 ? "warning" : "error",
        });
        return;
      }
      await Swal.fire({
        title: "Campaign canceled",
        text: "All bookings in this campaign have been marked as canceled.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
      router.refresh();
    } catch {
      await Swal.close();
      await Swal.fire({
        title: "Error",
        text: "Failed to cancel campaign",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
            Campaign — {dateDisplay} {timeDisplay}
            {returnDateDisplay && (
              <>
                {" "}
                · Return {returnDateDisplay}
              </>
            )}
            {campaign.name ? ` (${campaign.name})` : ""}
            {campaign.leader ? ` · Leader: ${campaign.leader.name?.trim() || campaign.leader.email}` : ""}
            {campaign.type ? ` · ${campaign.type}` : ""}
          </h1>
          {isCanceled && (
            <p className="mt-1 text-sm font-medium text-red-600 dark:text-red-400">
              This campaign is canceled. All its customers (bookings) are canceled.
            </p>
          )}
        </div>
        {canEdit && !isCanceled && (
          <div className="flex flex-wrap items-center gap-2">
            {!leaderView && campaignDateInFuture && (
              <Link
                href={`/haj-umrah/campaigns/${campaign.id}/edit`}
                className="flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                <PencilIcon className="size-4" />
                Edit campaign
              </Link>
            )}
            {campaignDateInFuture && draftBookings.length > 0 && (
              <button
                type="button"
                onClick={handleBulkConfirm}
                disabled={loading || selectedIds.size === 0}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? "…" : `Confirm selected (${selectedIds.size})`}
              </button>
            )}
            {!leaderView && campaignDateInFuture && (
              <button
                type="button"
                onClick={handleCancelCampaign}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 disabled:opacity-50"
              >
                <XCircleIcon className="size-4" />
                Cancel campaign
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </p>
      )}

      {canEdit && !isCanceled && campaignDateInFuture && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {draftBookings.length > 0 ? (
            <>Select draft bookings below and use <strong>Confirm selected</strong> to confirm them in bulk.</>
          ) : (
            <>No draft bookings to confirm. Bookings with status <strong>Draft</strong> will show a checkbox for bulk confirmation.</>
          )}
        </p>
      )}
      {canEdit && !isCanceled && !campaignDateInFuture && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          This campaign&apos;s departure date and time have passed. It can no longer be edited.
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
                {canEdit && !isCanceled && campaignDateInFuture && (
                  <th className="w-10 px-4 py-3">
                    {draftBookings.length > 0 ? (
                      <input
                        type="checkbox"
                        checked={selectedIds.size === draftBookings.length}
                        onChange={toggleSelectAll}
                        className="rounded border-zinc-300"
                        aria-label="Select all draft"
                      />
                    ) : (
                      <span className="text-zinc-400" aria-hidden>—</span>
                    )}
                  </th>
                )}
                <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
                  <span className="inline-flex items-center gap-1.5"><ReceiptIcon className="size-4" /> Track #</span>
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
                  <span className="inline-flex items-center gap-1.5"><UsersIcon className="size-4" /> Customer</span>
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
                  <span className="inline-flex items-center gap-1.5"><CalendarIcon className="size-4" /> Date</span>
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">Status</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
                  <span className="inline-flex items-center gap-1.5"><PackageIcon className="size-4" /> Packages</span>
                </th>
                {!leaderView && (
                  <th className="px-4 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">
                    <span className="inline-flex items-center justify-end gap-1.5"><DollarIcon className="size-4" /> Total</span>
                  </th>
                )}
                {!leaderView && (
                  <th className="px-4 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {campaign.bookings.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      leaderView
                        ? (canEdit && !isCanceled && campaignDateInFuture ? 6 : 5)
                        : canEdit && !isCanceled && campaignDateInFuture
                        ? 8
                        : 7
                    }
                    className="px-4 py-8 text-center text-zinc-500"
                  >
                    No customers (bookings) in this campaign yet.
                  </td>
                </tr>
              ) : (
                campaign.bookings.map((b) => {
                  const isDraft = b.status === "draft" && !b.canceledAt;
                  const canSelect = canEdit && !isCanceled && campaignDateInFuture && isDraft;
                  return (
                    <tr
                      key={b.id}
                      className="border-b border-zinc-100 dark:border-zinc-700/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                    >
                      {canEdit && !isCanceled && campaignDateInFuture && (
                        <td className="w-10 px-4 py-3">
                          {canSelect ? (
                            <input
                              type="checkbox"
                              checked={selectedIds.has(b.id)}
                              onChange={() => toggleSelect(b.id)}
                              className="rounded border-zinc-300"
                              aria-label={`Select ${b.trackNumberDisplay}`}
                            />
                          ) : (
                            <span className="inline-block w-4 text-zinc-300 dark:text-zinc-600" aria-hidden>—</span>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <Link
                          href={`/haj-umrah/${b.id}`}
                          className="font-medium text-zinc-900 hover:underline dark:text-white"
                        >
                          {b.trackNumberDisplay}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-zinc-900 dark:text-white">{b.customerName}</span>
                        {b.customerPhone && (
                          <span className="block text-xs text-zinc-500">{b.customerPhone}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        {new Date(b.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            b.status === "confirmed"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400"
                              : b.status === "canceled" || b.canceledAt
                              ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400"
                              : "bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                        <button
                          type="button"
                          onClick={() => setPackagesModalBooking(b)}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-transparent px-2 py-1 text-left hover:border-zinc-300 hover:bg-zinc-50 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
                        >
                          <PackageIcon className="size-4 shrink-0" />
                          <span>
                            {b.packageCount} {b.packageCount === 1 ? "package" : "packages"}
                          </span>
                        </button>
                      </td>
                      {!leaderView && (
                        <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-white">
                          ${b.totalAmount.toLocaleString()}
                        </td>
                      )}
                      {!leaderView && (
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/haj-umrah/${b.id}`}
                            className="inline-flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                          >
                            <EyeIcon className="size-4" />
                            View
                          </Link>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Packages modal */}
      {packagesModalBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setPackagesModalBooking(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="packages-modal-title"
        >
          <div
            className="w-full max-w-md rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
              <h2 id="packages-modal-title" className="text-sm font-semibold text-zinc-900 dark:text-white">
                Packages — {packagesModalBooking.customerName} (#{packagesModalBooking.trackNumberDisplay})
              </h2>
              <button
                type="button"
                onClick={() => setPackagesModalBooking(null)}
                className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                aria-label="Close"
              >
                <span className="text-lg leading-none">×</span>
              </button>
            </div>
            <div className="max-h-[60vh] overflow-auto px-4 py-3">
              {(packagesModalBooking.packages ?? []).length === 0 ? (
                <p className="text-sm text-zinc-500">No packages</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                      <th className="pb-2 pr-3 font-medium">Package</th>
                      <th className="pb-2 pr-3 text-center font-medium">Qty</th>
                      {!leaderView && (
                        <>
                          <th className="pb-2 pr-3 text-right font-medium">Unit price</th>
                          <th className="pb-2 text-right font-medium">Amount</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {(packagesModalBooking.packages ?? []).map((p, i) => (
                      <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="py-2 pr-3 font-medium text-zinc-900 dark:text-white">
                          {p.name}
                          <span className="ml-1 text-zinc-500 dark:text-zinc-400">({p.type})</span>
                        </td>
                        <td className="py-2 pr-3 text-center text-zinc-600 dark:text-zinc-400">{p.quantity}</td>
                        {!leaderView && (
                          <>
                            <td className="py-2 pr-3 text-right text-zinc-600 dark:text-zinc-400">
                              ${p.unitPrice.toLocaleString()}
                            </td>
                            <td className="py-2 text-right font-medium text-zinc-900 dark:text-white">
                              ${p.amount.toLocaleString()}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {(packagesModalBooking.packages ?? []).length > 0 && !leaderView && (
                <p className="mt-2 text-right text-sm font-medium text-zinc-900 dark:text-white">
                  Total: ${packagesModalBooking.totalAmount.toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex justify-end border-t border-zinc-200 px-4 py-3 dark:border-zinc-700">
              <Link
                href={`/haj-umrah/${packagesModalBooking.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"
              >
                <EyeIcon className="size-4" />
                View booking
              </Link>
              <button
                type="button"
                onClick={() => setPackagesModalBooking(null)}
                className="ml-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
