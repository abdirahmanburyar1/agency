"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import SearchableCustomerSelect from "@/components/SearchableCustomerSelect";
import SearchableCountrySelect from "@/components/SearchableCountrySelect";

type Customer = { id: string; name: string; phone?: string | null; country?: string | null };
type PackageOption = {
  id: string;
  name: string;
  type: string;
  visaPrices?: { country: string; price: number }[];
};

type PackageLine = {
  packageId: string;
  packageName: string;
  amount: number;
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
  profit?: number;
  passportCountry?: string | null;
  packages: { packageId: string; packageName: string; amount: number }[];
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
  const [countries, setCountries] = useState<string[]>([]);
  const [campaignId, setCampaignId] = useState(initialBooking?.campaignId ?? "");
  const [customerId, setCustomerId] = useState(initialCustomerId ?? initialBooking?.customerId ?? "");
  const [status, setStatus] = useState<"draft" | "confirmed">((initialBooking?.status as "draft" | "confirmed") ?? "draft");
  const [notes, setNotes] = useState(initialBooking?.notes ?? "");
  const [profit, setProfit] = useState(initialBooking?.profit ?? 0);
  const [passportCountry, setPassportCountry] = useState(initialBooking?.passportCountry ?? "");
  const [lines, setLines] = useState<PackageLine[]>(
    initialBooking?.packages?.map((p) => ({
      packageId: p.packageId,
      packageName: p.packageName,
      amount: p.quantity * p.unitPrice,
    })) ?? []
  );
  const [showAddPackage, setShowAddPackage] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerCountry, setNewCustomerCountry] = useState("");
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
      setProfit(initialBooking.profit ?? 0);
      setPassportCountry(initialBooking.passportCountry ?? "");
      setLines(
        initialBooking.packages?.map((p) => ({
          packageId: p.packageId,
          packageName: p.packageName,
          amount: p.quantity * p.unitPrice,
        })) ?? []
      );
    }
  }, [initialBooking?.id]);

  // Default passport country from customer when customer changes
  useEffect(() => {
    if (customerId && customers.length > 0) {
      const c = customers.find((x) => x.id === customerId);
      if (c?.country?.trim()) {
        setPassportCountry((prev) => (prev ? prev : c.country!.trim()));
      }
    }
  }, [customerId, customers]);
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
  useEffect(() => {
    fetch("/api/settings/ticket-options")
      .then((r) => r.json())
      .then((data) => setCountries(Array.isArray(data?.country) ? data.country : []))
      .catch(() => {});
  }, []);

  async function addPackage(pkg: PackageOption) {
    if (lines.some((l) => l.packageId === pkg.id)) return;
    const countryForVisa = passportCountry.trim() || customers.find((c) => c.id === customerId)?.country?.trim() || null;
    if (!countryForVisa) {
      await Swal.fire({
        icon: "warning",
        title: "Select passport country first",
        text: "Please select a passport country above before adding packages. Package prices depend on the passport country.",
      });
      setShowAddPackage(false);
      return;
    }
    const matchedPrice = pkg.visaPrices?.find(
      (v) => v.country.trim().toLowerCase() === countryForVisa.toLowerCase()
    )?.price;
    const fallbackPrice = pkg.visaPrices?.[0]?.price;
    const amount = matchedPrice ?? fallbackPrice ?? 0;
    setLines((prev) => [...prev, { packageId: pkg.id, packageName: pkg.name, amount }]);
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

  async function addNewCustomer() {
    const name = newCustomerName.trim();
    if (!name) return;
    setError("");
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: newCustomerEmail.trim() || null,
          phone: newCustomerPhone.trim() || null,
          country: newCustomerCountry.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create customer");
        return;
      }
      const listRes = await fetch("/api/customers/for-select");
      const list = await listRes.json();
      setCustomers(Array.isArray(list) ? list : []);
      setCustomerId(data.id);
      setNewCustomerName("");
      setNewCustomerEmail("");
      setNewCustomerPhone("");
      setNewCustomerCountry("");
      setShowAddCustomerModal(false);
    } catch {
      setError("Failed to create customer");
    }
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
            packages: lines.map((l) => ({ packageId: l.packageId, quantity: 1, unitPrice: l.amount })),
            profit: Number(profit) || 0,
            passportCountry: passportCountry.trim() || null,
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
            packages: lines.map((l) => ({ packageId: l.packageId, quantity: 1, unitPrice: l.amount })),
            profit: Number(profit) || 0,
            passportCountry: passportCountry.trim() || null,
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

  const packagesTotal = lines.reduce((sum, l) => sum + l.amount, 0);
  const profitAmount = Number(profit) || 0;
  const totalAmount = packagesTotal + profitAmount;

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-6xl space-y-6">
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
            onAddNew={() => setShowAddCustomerModal(true)}
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
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Passport country (for visa price)</label>
        <div className="mt-1">
          <SearchableCountrySelect
            options={countries}
            value={passportCountry}
            onChange={setPassportCountry}
            showAddNew={false}
            placeholder="Search or select country..."
          />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Packages</h3>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Add packages and set the amount for each.
            </p>
          </div>
          {packages.length > 0 && (
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowAddPackage((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"
              >
                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add package
              </button>
              {showAddPackage && (
                <div className="absolute right-0 top-full z-20 mt-2 w-72 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
                  <div className="max-h-64 overflow-y-auto">
                    {packages
                      .filter((p) => !lines.some((l) => l.packageId === p.id))
                      .map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => addPackage(p)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-teal-50 dark:hover:bg-teal-900/20"
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400">
                            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8 4-8-4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-zinc-900 dark:text-white">{p.name}</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              {p.type} · {p.visaPrices?.length ? "Price by passport country" : "—"}
                            </p>
                          </div>
                        </button>
                      ))}
                    {packages.every((p) => lines.some((l) => l.packageId === p.id)) && (
                      <p className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                        All packages added
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {packages.length === 0 && (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
            No active packages. <Link href="/haj-umrah/packages/new" className="font-medium underline">Create packages</Link> first.
          </p>
        )}

        {lines.length > 0 && (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
                    <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">Package</th>
                    <th className="px-4 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">Amount</th>
                    <th className="w-16 px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, index) => (
                    <tr
                      key={line.packageId}
                      className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                    >
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">{line.packageName}</td>
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={line.amount}
                          onChange={(e) => updateLine(index, { amount: Number(e.target.value) || 0 })}
                          className="w-28 rounded-md border border-zinc-300 px-2 py-1.5 text-right text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                        />
                      </td>
                      <td className="px-2 py-3">
                        <button
                          type="button"
                          onClick={() => removeLine(index)}
                          className="rounded p-1.5 text-zinc-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                          title="Remove"
                        >
                          <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-zinc-50 px-4 py-3 dark:bg-zinc-800/50">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Extra profit</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={profit || ""}
                  onChange={(e) => setProfit(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-24 rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                />
              </div>
              <p className="text-lg font-semibold text-zinc-900 dark:text-white">
                Total: ${totalAmount.toLocaleString()}
              </p>
            </div>
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

      {showAddCustomerModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            setShowAddCustomerModal(false);
            setNewCustomerName("");
            setNewCustomerEmail("");
            setNewCustomerPhone("");
            setNewCustomerCountry("");
            setError("");
          }}
        >
          <div
            className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-medium text-zinc-900 dark:text-white">
              Add new customer
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="Name *"
                className="w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addNewCustomer();
                  }
                  if (e.key === "Escape") {
                    setShowAddCustomerModal(false);
                    setNewCustomerName("");
                    setNewCustomerEmail("");
                    setNewCustomerPhone("");
                    setError("");
                  }
                }}
              />
              <input
                type="email"
                value={newCustomerEmail}
                onChange={(e) => setNewCustomerEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              />
              <input
                type="text"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                placeholder="Phone"
                className="w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              />
              <input
                type="text"
                value={newCustomerCountry}
                onChange={(e) => setNewCustomerCountry(e.target.value)}
                placeholder="Country (for visa price)"
                className="w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddCustomerModal(false);
                  setNewCustomerName("");
                  setNewCustomerEmail("");
                  setNewCustomerPhone("");
                  setError("");
                }}
                className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addNewCustomer}
                disabled={!newCustomerName.trim()}
                className="rounded bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 dark:bg-teal-500 dark:hover:bg-teal-600"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
