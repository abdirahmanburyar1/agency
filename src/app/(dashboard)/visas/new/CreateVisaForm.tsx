"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SearchableCustomerSelect from "@/components/SearchableCustomerSelect";
import SearchableCountrySelect from "@/components/SearchableCountrySelect";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function CreateVisaForm({
  sponsorName = "",
  nextVisaNo = "—",
  nextVisaNumber = 1,
}: {
  sponsorName?: string;
  nextVisaNo?: string;
  nextVisaNumber?: number;
}) {
  const router = useRouter();
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [options, setOptions] = useState<{ country: string[] }>({ country: [] });
  const [showAddCountryModal, setShowAddCountryModal] = useState(false);
  const [newCountryValue, setNewCountryValue] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const monthDefault = new Date().toISOString().slice(0, 7);
  const [date, setDate] = useState(today);
  const [monthValue, setMonthValue] = useState(monthDefault);
  const [reference, setReference] = useState("");
  const [country, setCountry] = useState("");
  const [netCost, setNetCost] = useState("");
  const [netSales, setNetSales] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/settings/ticket-options")
      .then((r) => r.json())
      .then((data) =>
        setOptions({ country: data.country ?? [] })
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/customers/for-select")
      .then((r) => r.json())
      .then((data) => setCustomers(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  async function addNewCountry() {
    const v = newCountryValue.trim();
    if (!v) return;
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "country", value: v }),
    });
    if (res.ok) {
      setOptions((prev) => ({
        ...prev,
        country: [...prev.country, v].sort(),
      }));
      setCountry(v);
      setNewCountryValue("");
      setShowAddCountryModal(false);
    }
  }

  async function addNewCustomer() {
    const name = newCustomerName.trim();
    if (!name) return;
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email: newCustomerEmail.trim() || null,
        phone: newCustomerPhone.trim() || null,
      }),
    });
    if (res.ok) {
      const created = await res.json();
      setCustomers((prev) => [...prev, { id: created.id, name: created.name, phone: created.phone }].sort((a, b) => a.name.localeCompare(b.name)));
      setCustomerId(created.id);
      setNewCustomerName("");
      setNewCustomerEmail("");
      setNewCustomerPhone("");
      setShowAddCustomerModal(false);
    }
  }

  function onDateChange(value: string) {
    setDate(value);
    if (value) setMonthValue(value.slice(0, 7));
  }

  function onMonthChange(value: string) {
    setMonthValue(value);
    if (value) setDate(value + "-01");
  }

  function monthToName(ym: string): string {
    if (!ym || ym.length < 7) return MONTHS[new Date().getMonth()];
    const m = parseInt(ym.slice(5, 7), 10);
    return MONTHS[m - 1] ?? MONTHS[new Date().getMonth()];
  }

  function computeProfit() {
    const cost = parseFloat(netCost) || 0;
    const sales = parseFloat(netSales) || 0;
    return (sales - cost).toFixed(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!customerId) {
      setError("Please select a customer");
      return;
    }
    const refTrimmed = reference.trim();
    if (!refTrimmed) {
      setError("Reference is required");
      return;
    }
    const cost = parseFloat(netCost) || 0;
    const sales = parseFloat(netSales) || 0;
    if (sales < cost) {
      setError("Net sales cannot be less than net cost");
      return;
    }
    setLoading(true);
    const profit = sales - cost;
    try {
      const res = await fetch("/api/visas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          month: monthToName(monthValue),
          sponsor: sponsorName || null,
          customerId: customerId || null,
          country: country || null,
          reference: refTrimmed,
          visaNumber: nextVisaNumber,
          netCost: cost,
          netSales: sales,
          profit,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create visa");
        return;
      }
      router.push("/visas");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900"
      >
        {error && (
          <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:gap-4">
            <div className="flex flex-col gap-4 sm:flex-1 sm:flex-row sm:gap-3">
              <div className="min-w-0 w-full sm:w-[100px] sm:shrink-0">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Visa No</label>
                <input
                  type="text"
                  value={nextVisaNo}
                  disabled
                  className="mt-1 w-full rounded border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
                />
              </div>
              <div className="flex-1 min-w-0">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Reference *</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. VN12345"
                  required
                  className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                />
              </div>
            </div>
            <div className="min-w-0 w-full sm:w-[140px] sm:shrink-0">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => onDateChange(e.target.value)}
                required
                className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Month</label>
            <input
              type="month"
              value={monthValue}
              onChange={(e) => onMonthChange(e.target.value)}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Customer *</label>
            <SearchableCustomerSelect
              customers={customers}
              value={customerId}
              onChange={setCustomerId}
              onAddNew={() => setShowAddCustomerModal(true)}
              placeholder="Search or select customer..."
              className="mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Sponsor</label>
            <input
              type="text"
              value={sponsorName}
              disabled
              className="mt-1 w-full rounded border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Country</label>
            <SearchableCountrySelect
              options={options.country}
              value={country}
              onChange={setCountry}
              onAddNew={() => setShowAddCountryModal(true)}
              placeholder="Search or select country..."
              className="mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Net Cost *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={netCost}
              onChange={(e) => setNetCost(e.target.value)}
              required
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Net Sales *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={netSales}
              onChange={(e) => setNetSales(e.target.value)}
              required
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Profit (auto)</label>
            <input
              type="text"
              value={computeProfit()}
              readOnly
              className="mt-1 w-full rounded border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
            />
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? "Creating..." : "Create Visa"}
          </button>
          <Link
            href="/visas"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
          >
            Cancel
          </Link>
        </div>
      </form>

      {showAddCustomerModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => (setShowAddCustomerModal(false), setNewCustomerName(""), setNewCustomerEmail(""), setNewCustomerPhone(""))}
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
                  if (e.key === "Enter") { e.preventDefault(); addNewCustomer(); }
                  if (e.key === "Escape") { setShowAddCustomerModal(false); setNewCustomerName(""); setNewCustomerEmail(""); setNewCustomerPhone(""); }
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
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => (setShowAddCustomerModal(false), setNewCustomerName(""), setNewCustomerEmail(""), setNewCustomerPhone(""))}
                className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addNewCustomer}
                className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddCountryModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => (setShowAddCountryModal(false), setNewCountryValue(""))}
        >
          <div
            className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-medium text-zinc-900 dark:text-white">
              Add new country
            </h3>
            <input
              type="text"
              value={newCountryValue}
              onChange={(e) => setNewCountryValue(e.target.value)}
              placeholder="Enter country name"
              className="mb-4 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addNewCountry();
                }
                if (e.key === "Escape") {
                  setShowAddCountryModal(false);
                  setNewCountryValue("");
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => (setShowAddCountryModal(false), setNewCountryValue(""))}
                className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addNewCountry}
                className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
