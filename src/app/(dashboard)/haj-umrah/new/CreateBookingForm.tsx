"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SearchableCustomerSelect from "@/components/SearchableCustomerSelect";

type Customer = { id: string; name: string; phone?: string | null };
type PackageOption = { id: string; name: string; type: string; defaultPrice: number };

type PackageLine = {
  packageId: string;
  packageName: string;
  quantity: number;
  unitPrice: number;
};

type CampaignOption = { id: string; date: string; month: string; name: string | null; type: string | null };

type InitialBooking = {
  id: string;
  trackNumberDisplay: string;
  hasNoTrackNumberYet?: boolean;
  customerId: string;
  campaignId: string | null;
  status: string;
  notes: string | null;
  packages: { packageId: string; packageName: string; quantity: number; unitPrice: number }[];
};

type Props = {
  nextTrackNumberDisplay: string;
  initialCustomerId?: string;
  initialBooking?: InitialBooking;
  /** When false in edit mode, save is disabled (campaign departure date has passed). */
  allowSaveBeforeCampaignDate?: boolean;
};

export default function CreateBookingForm({ nextTrackNumberDisplay, initialCustomerId, initialBooking, allowSaveBeforeCampaignDate = true }: Props) {
  const router = useRouter();
  const isEdit = !!initialBooking;
  const canSave = !isEdit || allowSaveBeforeCampaignDate;
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [campaignId, setCampaignId] = useState(initialBooking?.campaignId ?? "");
  const [customerId, setCustomerId] = useState(initialCustomerId ?? initialBooking?.customerId ?? "");
  const [status, setStatus] = useState<"draft" | "confirmed">((initialBooking?.status as "draft" | "confirmed") ?? "draft");
  const [notes, setNotes] = useState(initialBooking?.notes ?? "");
  const [lines, setLines] = useState<PackageLine[]>(
    initialBooking?.packages?.map((p) => ({ packageId: p.packageId, packageName: p.packageName, quantity: p.quantity, unitPrice: p.unitPrice })) ?? []
  );
  const [showAddPackage, setShowAddPackage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/customers/for-select")
      .then((r) => r.json())
      .then((data) => setCustomers(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // Pre-select customer when opening from "Assign packages" (e.g. /haj-umrah/new?customerId=xxx)
  useEffect(() => {
    if (initialCustomerId) setCustomerId(initialCustomerId);
  }, [initialCustomerId]);

  // Sync from initialBooking when in edit mode (e.g. after navigation)
  useEffect(() => {
    if (initialBooking) {
      setCampaignId(initialBooking.campaignId ?? "");
      setCustomerId(initialBooking.customerId);
      setStatus((initialBooking.status as "draft" | "confirmed") || "draft");
      setNotes(initialBooking.notes ?? "");
      setLines(
        initialBooking.packages?.map((p) => ({ packageId: p.packageId, packageName: p.packageName, quantity: p.quantity, unitPrice: p.unitPrice })) ?? []
      );
    }
  }, [initialBooking?.id]);
  useEffect(() => {
    fetch("/api/haj-umrah/packages?active=true")
      .then((r) => r.json())
      .then((data) => setPackages(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);
  useEffect(() => {
    fetch("/api/haj-umrah/campaigns?available=true")
      .then((r) => r.json())
      .then((data) => setCampaigns(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  function addPackage(pkg: PackageOption) {
    if (lines.some((l) => l.packageId === pkg.id)) return;
    setLines((prev) => [
      ...prev,
      { packageId: pkg.id, packageName: pkg.name, quantity: 1, unitPrice: pkg.defaultPrice },
    ]);
    setShowAddPackage(false);
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  function updateLine(index: number, updates: Partial<PackageLine>) {
    setLines((prev) =>
      prev.map((l, i) => (i === index ? { ...l, ...updates } : l))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!customerId) {
      setError("Select a customer.");
      return;
    }
    if (lines.length === 0) {
      setError("Add at least one package.");
      return;
    }
    if (!isEdit && !campaignId) {
      setError("Select a campaign (departure date).");
      return;
    }
    setLoading(true);
    try {
      if (isEdit && initialBooking) {
        const res = await fetch(`/api/haj-umrah/bookings/${initialBooking.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerId,
            campaignId: campaignId || null,
            status,
            notes: notes.trim() || null,
            packages: lines.map((l) => ({ packageId: l.packageId, quantity: l.quantity, unitPrice: l.unitPrice })),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Failed to update booking");
          return;
        }
        router.push(`/haj-umrah/${initialBooking.id}`);
        router.refresh();
      } else {
        if (!campaignId) return;
        const res = await fetch("/api/haj-umrah/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campaignId,
            customerId,
            status,
            notes: notes.trim() || undefined,
            packages: lines.map((l) => ({ packageId: l.packageId, quantity: l.quantity, unitPrice: l.unitPrice })),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Failed to create booking");
          return;
        }
        router.push(`/haj-umrah/${data.id}`);
        router.refresh();
      }
    } catch {
      setError(isEdit ? "Failed to update booking" : "Failed to create booking");
    } finally {
      setLoading(false);
    }
  }

  const totalAmount = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </p>
      )}

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Customer *</label>
        <div className="mt-1">
          <SearchableCustomerSelect
            customers={customers}
            value={customerId}
            onChange={setCustomerId}
            onAddNew={() => {}}
            placeholder="Search or select customer..."
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Track #</label>
          <input
            type="text"
            value={isEdit ? initialBooking!.trackNumberDisplay : nextTrackNumberDisplay}
            readOnly
            className="mt-1 w-full rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            aria-label="Track number"
          />
          {!isEdit && <p className="mt-1 text-xs text-zinc-500">Assigned automatically when you create the booking</p>}
          {isEdit && initialBooking?.hasNoTrackNumberYet && (
            <p className="mt-1 text-xs text-zinc-500">Will be assigned when you save</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Campaign (departure date) {!isEdit && "*"}</label>
          <select
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            required={!isEdit}
          >
            <option value="">Select campaign</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {new Date(c.date).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })}
                {c.name ? ` — ${c.name}` : ""}
                {c.type ? ` (${c.type})` : ""}
              </option>
            ))}
          </select>
          {campaigns.length === 0 && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              <Link href="/haj-umrah/campaigns/new" className="underline">Create a campaign</Link> first (departure date).
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as "draft" | "confirmed")}
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
        >
          <option value="draft">Draft</option>
          <option value="confirmed">Confirmed</option>
        </select>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Packages *</label>
          {packages.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAddPackage((v) => !v)}
                className="rounded border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                + Add package
              </button>
              {showAddPackage && (
                <div className="absolute right-0 top-full z-10 mt-1 max-h-48 w-64 overflow-auto rounded border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                  {packages
                    .filter((p) => !lines.some((l) => l.packageId === p.id))
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
                  {packages.every((p) => lines.some((l) => l.packageId === p.id)) && (
                    <p className="px-4 py-2 text-sm text-zinc-500">All packages added</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        {packages.length === 0 && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            No active packages. <Link href="/haj-umrah/packages/new" className="underline">Add packages</Link> first.
          </p>
        )}
        {lines.length > 0 && (
          <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-700 dark:bg-zinc-800/30">
            {lines.map((line, index) => (
              <div key={line.packageId} className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
                <span className="w-40 truncate font-medium text-zinc-900 dark:text-white">{line.packageName}</span>
                <input
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(e) => updateLine(index, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                  className="w-16 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                />
                <span className="text-zinc-500">×</span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={line.unitPrice}
                  onChange={(e) => updateLine(index, { unitPrice: Number(e.target.value) || 0 })}
                  className="w-24 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                />
                <span className="text-zinc-600 dark:text-zinc-400">
                  = ${(line.quantity * line.unitPrice).toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={() => removeLine(index)}
                  className="ml-auto text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            ))}
            <p className="text-right font-medium text-zinc-900 dark:text-white">
              Total: ${totalAmount.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!canSave || loading || lines.length === 0 || !customerId || (!isEdit && !campaignId)}
          className="rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 dark:bg-teal-500 dark:hover:bg-teal-600"
          title={isEdit && !allowSaveBeforeCampaignDate ? "Cannot save: campaign departure date has passed." : undefined}
        >
          {loading ? (isEdit ? "Saving…" : "Creating…") : isEdit ? "Save changes" : "Create Booking"}
        </button>
        <Link
          href={isEdit ? `/haj-umrah/${initialBooking!.id}` : "/haj-umrah"}
          className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
