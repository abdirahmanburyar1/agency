"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import { UserIcon, ReceiptIcon, CalendarIcon, PackageIcon, ExternalLinkIcon, PlusIcon, PencilIcon } from "../icons";

type PackageLine = {
  packageId: string;
  packageName: string;
  packageType: string;
  quantity: number;
  unitPrice: number;
};

type Booking = {
  id: string;
  trackNumber: number | null;
  trackNumberDisplay: string;
  campaignId: string | null;
  campaign: { id: string; date: string; month: string; name: string | null; type: string | null; leader: { id: string; name: string | null; email: string } | null } | null;
  campaignDisplay: string | null;
  customerId: string;
  customer: { id: string; name: string; email: string | null; phone: string | null };
  date: string;
  month: string;
  status: string;
  notes: string | null;
  createdAt: string;
  canceledAt: string | null;
  packages: {
    id: string;
    packageId: string;
    packageName: string;
    packageType: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
  totalAmount: number;
  payments?: { id: string; date: string; amount: number; status: string; canceledAt: string | null; amountReceived: number }[];
  totalReceived?: number;
};

type PackageOption = { id: string; name: string; type: string; defaultPrice: number };

type Props = {
  booking: Booking;
  canEdit: boolean;
};

function isCampaignDateInFuture(booking: Booking): boolean {
  if (!booking.campaign) return true;
  return new Date(booking.campaign.date) > new Date();
}

export default function HajUmrahBookingDetail({ booking, canEdit }: Props) {
  const router = useRouter();
  const campaignDateInFuture = isCampaignDateInFuture(booking);
  const canEditBooking = canEdit && !booking.canceledAt && campaignDateInFuture;
  const canReinitiate = canEdit && !!booking.canceledAt && campaignDateInFuture;
  const [status, setStatus] = useState(booking.status);
  const [notes, setNotes] = useState(booking.notes ?? "");
  const [packageLines, setPackageLines] = useState<PackageLine[]>(
    booking.packages.map((p) => ({ packageId: p.packageId, packageName: p.packageName, packageType: p.packageType, quantity: p.quantity, unitPrice: p.unitPrice }))
  );
  const [availablePackages, setAvailablePackages] = useState<PackageOption[]>([]);
  const [showAddPackage, setShowAddPackage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [packagesSaving, setPackagesSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setStatus(booking.status);
    setNotes(booking.notes ?? "");
    setPackageLines(
      booking.packages.map((p) => ({ packageId: p.packageId, packageName: p.packageName, packageType: p.packageType, quantity: p.quantity, unitPrice: p.unitPrice }))
    );
  }, [booking.status, booking.notes, booking.packages]);

  useEffect(() => {
    fetch("/api/haj-umrah/packages?active=true")
      .then((r) => r.json())
      .then((data) => setAvailablePackages(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  async function handleSave() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/haj-umrah/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes: notes.trim() || null }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to update");
        return;
      }
      router.refresh();
    } catch {
      setError("Failed to update");
    } finally {
      setLoading(false);
    }
  }

  function addPackage(pkg: PackageOption) {
    if (packageLines.some((l) => l.packageId === pkg.id)) return;
    setPackageLines((prev) => [...prev, { packageId: pkg.id, packageName: pkg.name, packageType: pkg.type, quantity: 1, unitPrice: pkg.defaultPrice }]);
    setShowAddPackage(false);
  }

  function removePackage(index: number) {
    setPackageLines((prev) => prev.filter((_, i) => i !== index));
  }

  function updatePackageLine(index: number, updates: Partial<PackageLine>) {
    setPackageLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...updates } : l)));
  }

  async function handleSavePackages() {
    if (packageLines.length === 0) {
      setError("Add at least one package.");
      return;
    }
    setError("");
    setPackagesSaving(true);
    try {
      const res = await fetch(`/api/haj-umrah/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packages: packageLines.map((l) => ({ packageId: l.packageId, quantity: l.quantity, unitPrice: l.unitPrice })),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to update packages");
        return;
      }
      router.refresh();
    } catch {
      setError("Failed to update packages");
    } finally {
      setPackagesSaving(false);
    }
  }

  async function handleCancel() {
    const result = await Swal.fire({
      title: "Cancel this booking?",
      text: "The booking will be marked as canceled. You can reinitiate it before the campaign departure date.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, cancel booking",
      confirmButtonColor: "#dc2626",
      cancelButtonText: "Keep",
    });
    if (!result.isConfirmed) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/haj-umrah/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "canceled" }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to update");
        return;
      }
      setStatus("canceled");
      router.refresh();
    } catch {
      setError("Failed to update");
    } finally {
      setLoading(false);
    }
  }

  async function handleReinitiate() {
    const result = await Swal.fire({
      title: "Reinitiate this booking?",
      text: "The booking will be set back to draft. You can edit and confirm it again before the campaign departure date.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Reinitiate",
      confirmButtonColor: "#0d9488",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;
    setError("");
    setLoading(true);
    Swal.fire({
      title: "Processing…",
      text: "Reinitiating booking…",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
    });
    try {
      const res = await fetch(`/api/haj-umrah/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "draft" }),
      });
      const data = await res.json();
      await Swal.close();
      if (!res.ok) {
        await Swal.fire({
          title: "Error",
          text: data.error ?? "Failed to reinitiate",
          icon: "error",
        });
        return;
      }
      await Swal.fire({
        title: "Done",
        text: "Booking reinitiated. You can edit it now.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
      router.refresh();
    } catch {
      await Swal.close();
      await Swal.fire({
        title: "Error",
        text: "Failed to reinitiate booking",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
          Booking #{booking.trackNumberDisplay}
        </h1>
        {(canEditBooking || canReinitiate) && (
          <div className="flex flex-wrap items-center gap-2">
            {canEditBooking && (
              <>
                <Link
                  href={`/haj-umrah/${booking.id}/edit`}
                  className="flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <PencilIcon className="size-4" />
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 dark:bg-teal-500 dark:hover:bg-teal-600"
                >
                  {loading ? "Saving…" : "Save changes"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                >
                  Cancel booking
                </button>
              </>
            )}
            {canReinitiate && (
              <button
                type="button"
                onClick={handleReinitiate}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 dark:bg-teal-500 dark:hover:bg-teal-600"
              >
                Reinitiate booking
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

      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          <UserIcon className="size-4" />
          Customer
        </h2>
        <p className="font-medium text-zinc-900 dark:text-white">{booking.customer.name}</p>
        {booking.customer.phone && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{booking.customer.phone}</p>
        )}
        {booking.customer.email && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{booking.customer.email}</p>
        )}
        <Link
          href={`/customers?highlight=${booking.customerId}`}
          className="mt-2 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-400 dark:hover:text-zinc-300"
        >
          <ExternalLinkIcon className="size-4" />
          View customer
        </Link>
      </div>

      <div id="booking-details" className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          <ReceiptIcon className="size-4" />
          Details
        </h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400"><ReceiptIcon className="size-3.5" /> Track #</dt>
            <dd className="text-zinc-900 dark:text-white">{booking.trackNumberDisplay}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400"><CalendarIcon className="size-3.5" /> Campaign</dt>
            <dd className="text-zinc-900 dark:text-white">{booking.campaignDisplay ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">Date</dt>
            <dd className="text-zinc-900 dark:text-white">{new Date(booking.date).toLocaleDateString()}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">Status</dt>
            <dd>
              {canEditBooking ? (
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-0.5 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                >
                  <option value="draft">Draft</option>
                  <option value="confirmed">Confirmed</option>
                </select>
              ) : (
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                    booking.status === "confirmed"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400"
                      : booking.status === "canceled"
                      ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400"
                      : "bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {booking.status}
                </span>
              )}
            </dd>
          </div>
        </dl>
        <div className="mt-4">
          <dt className="text-xs text-zinc-500 dark:text-zinc-400">Notes</dt>
          <dd className="mt-0.5">
            {canEditBooking ? (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              />
            ) : (
              <span className="text-zinc-900 dark:text-white">{booking.notes || "—"}</span>
            )}
          </dd>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            <PackageIcon className="size-4" />
            Packages
          </h2>
          {canEditBooking && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAddPackage((v) => !v)}
                  className="flex items-center gap-1.5 rounded border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <PlusIcon className="size-4" />
                  Assign package
                </button>
                {showAddPackage && (
                  <div className="absolute right-0 top-full z-10 mt-1 max-h-48 w-64 overflow-auto rounded border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                    {availablePackages
                      .filter((p) => !packageLines.some((l) => l.packageId === p.id))
                      .map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => addPackage(p)}
                          className="block w-full px-4 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        >
                          {p.name} ({p.type}) — ${p.defaultPrice.toLocaleString()}
                        </button>
                      ))}
                    {availablePackages.every((p) => packageLines.some((l) => l.packageId === p.id)) && availablePackages.length > 0 && (
                      <p className="px-4 py-2 text-sm text-zinc-500">All packages assigned</p>
                    )}
                    {availablePackages.length === 0 && (
                      <p className="px-4 py-2 text-sm text-zinc-500">No packages. <Link href="/haj-umrah/packages/new" className="underline">Add packages</Link></p>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleSavePackages}
                disabled={packagesSaving || packageLines.length === 0}
                className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
              >
                {packagesSaving ? "Saving…" : "Save packages"}
              </button>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                <th className="pb-2 pr-4 font-medium">Package</th>
                <th className="pb-2 pr-4 font-medium text-center">Qty</th>
                <th className="pb-2 pr-4 font-medium text-right">Unit price</th>
                <th className="pb-2 font-medium text-right">Amount</th>
                {canEditBooking && <th className="w-10 pb-2" />}
              </tr>
            </thead>
            <tbody>
              {(canEditBooking ? packageLines : booking.packages).map((bp, index) => (
                <tr key={`${bp.packageId}-${index}`} className="border-b border-zinc-100 dark:border-zinc-700/50">
                  <td className="py-3 pr-4">
                    <span className="font-medium text-zinc-900 dark:text-white">{"packageName" in bp ? bp.packageName : (bp as { packageName: string }).packageName}</span>
                    <span className="ml-1 text-zinc-500">({"packageType" in bp ? bp.packageType : (bp as { packageType: string }).packageType})</span>
                  </td>
                  <td className="py-3 pr-4 text-center">
                    {canEditBooking ? (
                      <input
                        type="number"
                        min={1}
                        value={packageLines[index]?.quantity ?? 1}
                        onChange={(e) => updatePackageLine(index, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                        className="w-14 rounded border border-zinc-300 px-1 py-0.5 text-center text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                      />
                    ) : (
                      "quantity" in bp ? bp.quantity : (bp as { quantity: number }).quantity
                    )}
                  </td>
                  <td className="py-3 pr-4 text-right">
                    {canEditBooking ? (
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={packageLines[index]?.unitPrice ?? 0}
                        onChange={(e) => updatePackageLine(index, { unitPrice: Number(e.target.value) || 0 })}
                        className="w-24 rounded border border-zinc-300 px-1 py-0.5 text-right text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                      />
                    ) : (
                      `$${("unitPrice" in bp ? bp.unitPrice : (bp as { unitPrice: number }).unitPrice).toLocaleString()}`
                    )}
                  </td>
                  <td className="py-3 text-right font-medium">
                    $
                    {(canEditBooking
                      ? (packageLines[index]?.quantity ?? 1) * (packageLines[index]?.unitPrice ?? 0)
                      : "amount" in bp
                        ? (bp as { amount: number }).amount
                        : (bp as { quantity: number; unitPrice: number }).quantity * (bp as { unitPrice: number }).unitPrice
                    ).toLocaleString()}
                  </td>
                  {canEditBooking && (
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => removePackage(index)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        aria-label="Remove package"
                      >
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-right text-lg font-semibold text-zinc-900 dark:text-white">
          Total: $
          {(canEditBooking
            ? packageLines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0)
            : booking.totalAmount
          ).toLocaleString()}
        </p>
      </div>

      {booking.canceledAt && booking.totalReceived != null && booking.totalReceived > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/50 dark:bg-amber-900/20">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Refund may be required — ${booking.totalReceived.toLocaleString()} was received before cancellation.
          </p>
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
            Process refund manually as needed. Payment records have been marked canceled and no longer show as outstanding.
          </p>
        </div>
      )}

      {booking.payments && booking.payments.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            <ReceiptIcon className="size-4" />
            Payments
          </h2>
          <ul className="space-y-2">
            {booking.payments.map((p) => (
              <li
                key={p.id}
                className={`flex items-center justify-between rounded-lg border py-2 px-3 dark:border-zinc-700/50 ${
                  p.canceledAt ? "border-zinc-100 bg-zinc-50/50 dark:bg-zinc-800/30" : "border-zinc-100 dark:border-zinc-700/50"
                }`}
              >
                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                  {new Date(p.date).toLocaleDateString()} · ${p.amount.toLocaleString()} · {p.status}
                  {(p.amountReceived ?? 0) > 0 && ` · $${(p.amountReceived ?? 0).toLocaleString()} received`}
                  {p.canceledAt && (
                    <span className="ml-2 rounded bg-zinc-200 px-1.5 py-0.5 text-xs dark:bg-zinc-600 dark:text-zinc-300">
                      Canceled
                    </span>
                  )}
                </span>
                <Link
                  href={`/payments/${p.id}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
                >
                  View payment
                  <ExternalLinkIcon className="size-3.5" />
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/payments"
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-400"
          >
            View all payments
            <ExternalLinkIcon className="size-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
