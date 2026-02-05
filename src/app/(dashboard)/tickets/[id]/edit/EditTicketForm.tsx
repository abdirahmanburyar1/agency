"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SearchableCustomerSelect from "@/components/SearchableCustomerSelect";
import SearchableAirlineSelect from "@/components/SearchableAirlineSelect";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type InitialData = {
  ticketId: string;
  ticketNumberDisplay: string;
  reference: string;
  date: string;
  monthValue: string;
  sponsorName: string;
  customerId: string;
  airline: string;
  route: string;
  flight: string;
  departure: string;
  returnDate: string;
  netCost: string;
  netSales: string;
};

export default function EditTicketForm({
  initial,
}: {
  initial: InitialData;
}) {
  const router = useRouter();
  const [options, setOptions] = useState<{
    airline: string[];
    flight: string[];
  }>({ airline: [], flight: [] });
  const [showAddAirlineModal, setShowAddAirlineModal] = useState(false);
  const [newAirlineValue, setNewAirlineValue] = useState("");
  const [customers, setCustomers] = useState<{ id: string; name: string; phone?: string | null }[]>([]);
  const [customerId, setCustomerId] = useState(initial.customerId);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [date, setDate] = useState(initial.date);
  const [monthValue, setMonthValue] = useState(initial.monthValue);
  const [reference, setReference] = useState(initial.reference);
  const [airline, setAirline] = useState(initial.airline);
  const [route, setRoute] = useState(initial.route);
  const [flight, setFlight] = useState(initial.flight);
  const [departure, setDeparture] = useState(initial.departure);
  const [returnDate, setReturnDate] = useState(initial.returnDate);
  const [netCost, setNetCost] = useState(initial.netCost);
  const [netSales, setNetSales] = useState(initial.netSales);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const inputErrorClass =
    "border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-500";
  const inputBaseClass =
    "mt-1 w-full rounded border px-3 py-2 dark:bg-zinc-800 dark:text-white";
  const inputClass = (field: string) =>
    `${inputBaseClass} ${
      errors[field]
        ? inputErrorClass
        : "border-zinc-300 dark:border-zinc-600"
    }`;

  useEffect(() => {
    fetch("/api/settings/ticket-options")
      .then((r) => r.json())
      .then((data) =>
        setOptions({
          airline: data.airline ?? [],
          flight: data.flight ?? [],
        })
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/customers/for-select")
      .then((r) => r.json())
      .then((data) => setCustomers(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

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
      setCustomers((prev) =>
        [...prev, { id: created.id, name: created.name, phone: created.phone }].sort(
          (a, b) => a.name.localeCompare(b.name)
        )
      );
      setCustomerId(created.id);
      setNewCustomerName("");
      setNewCustomerEmail("");
      setNewCustomerPhone("");
      setShowAddCustomerModal(false);
    }
  }

  async function addNewAirline() {
    const v = newAirlineValue.trim();
    if (!v) return;
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "airline", value: v }),
    });
    if (res.ok) {
      setOptions((prev) => ({
        ...prev,
        airline: [...prev.airline, v].sort(),
      }));
      setAirline(v);
      setNewAirlineValue("");
      setShowAddAirlineModal(false);
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

  function isOneWay(flightVal: string): boolean {
    const f = flightVal.trim().toLowerCase();
    return f === "one way" || f.includes("one way");
  }

  function computeProfit() {
    const cost = parseFloat(netCost) || 0;
    const sales = parseFloat(netSales) || 0;
    return (sales - cost).toFixed(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    const newErrors: Record<string, string> = {};
    if (!customerId) {
      newErrors.customer = "Please select a customer";
    }
    if (!reference.trim()) {
      newErrors.reference = "Reference is required";
    }
    const cost = parseFloat(netCost) || 0;
    const sales = parseFloat(netSales) || 0;
    if (sales < cost) {
      newErrors.netSales = "Net sales cannot be less than net cost";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setLoading(true);
    const profit = sales - cost;
    try {
      const res = await fetch(`/api/tickets/${initial.ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          month: monthToName(monthValue),
          reference: reference.trim(),
          customerId: customerId || null,
          airline: airline || null,
          route: route || null,
          flight: flight || null,
          departure: departure || null,
          return: isOneWay(flight) ? null : (returnDate || null),
          netCost: cost,
          netSales: sales,
          profit,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ form: data.error ?? "Failed to update ticket" });
        return;
      }
      router.push(`/tickets/${initial.ticketId}`);
      router.refresh();
    } catch {
      setErrors({ form: "Something went wrong" });
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
        {errors.form && (
          <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            {errors.form}
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:gap-4">
            <div className="flex flex-col gap-4 sm:flex-[3] sm:flex-row sm:gap-4">
              <div className="min-w-0 flex-1">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Ticket no
                </label>
                <input
                  type="text"
                  value={initial.ticketNumberDisplay}
                  disabled
                  readOnly
                  className="mt-1 w-full rounded border border-zinc-200 bg-zinc-50 font-mono font-medium dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
                />
                <p className="mt-0.5 text-xs text-zinc-500">Read-only</p>
              </div>
              <div className="min-w-0 flex-1">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Reference *
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => {
                    setReference(e.target.value);
                    if (errors.reference) setErrors((prev) => ({ ...prev, reference: "" }));
                  }}
                  placeholder="e.g. booking / PNR"
                  required
                  className={inputClass("reference")}
                />
                {errors.reference && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.reference}</p>
                )}
              </div>
            </div>
            <div className="w-full min-w-0 sm:flex-1">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Date *
              </label>
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
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Month
            </label>
            <input
              type="month"
              value={monthValue}
              onChange={(e) => onMonthChange(e.target.value)}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Sponsor
            </label>
            <input
              type="text"
              value={initial.sponsorName}
              disabled
              className="mt-1 w-full rounded border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Customer *
            </label>
            <SearchableCustomerSelect
              customers={customers}
              value={customerId}
              onChange={(id) => {
                setCustomerId(id);
                if (errors.customer) setErrors((prev) => ({ ...prev, customer: "" }));
              }}
              onAddNew={() => setShowAddCustomerModal(true)}
              placeholder="Search or select customer..."
              className="mt-1"
              error={errors.customer}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Airline
            </label>
            <SearchableAirlineSelect
              options={options.airline}
              value={airline}
              onChange={setAirline}
              onAddNew={() => setShowAddAirlineModal(true)}
              placeholder="Search or select airline..."
              className="mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Route
            </label>
            <input
              type="text"
              value={route}
              onChange={(e) => setRoute(e.target.value)}
              placeholder="e.g. NBO - MGQ"
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Flight
            </label>
            <select
              value={flight}
              onChange={(e) => {
                const v = e.target.value;
                setFlight(v);
                if (isOneWay(v)) setReturnDate("");
              }}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            >
              <option value="">Select flight</option>
              {options.flight.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Departure
            </label>
            <input
              type="datetime-local"
              value={departure}
              onChange={(e) => setDeparture(e.target.value)}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          {!isOneWay(flight) && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Return
              </label>
              <input
                type="datetime-local"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Net Cost *
            </label>
            <input
              type="number"
              step="0.01"
              value={netCost}
              onChange={(e) => {
                setNetCost(e.target.value);
                if (errors.netSales) setErrors((prev) => ({ ...prev, netSales: "" }));
              }}
              required
              className={inputClass("netSales")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Net Sales *
            </label>
            <input
              type="number"
              step="0.01"
              value={netSales}
              onChange={(e) => {
                setNetSales(e.target.value);
                if (errors.netSales) setErrors((prev) => ({ ...prev, netSales: "" }));
              }}
              required
              className={inputClass("netSales")}
            />
            {errors.netSales && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.netSales}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Profit (auto)
            </label>
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
            {loading ? "Saving..." : "Save changes"}
          </button>
          <Link
            href={`/tickets/${initial.ticketId}`}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
          >
            Cancel
          </Link>
        </div>
      </form>

      {showAddCustomerModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() =>
            (setShowAddCustomerModal(false),
            setNewCustomerName(""),
            setNewCustomerEmail(""),
            setNewCustomerPhone(""))
          }
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
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  (setShowAddCustomerModal(false),
                  setNewCustomerName(""),
                  setNewCustomerEmail(""),
                  setNewCustomerPhone(""))
                }
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

      {showAddAirlineModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => (setShowAddAirlineModal(false), setNewAirlineValue(""))}
        >
          <div
            className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-medium text-zinc-900 dark:text-white">
              Add new airline
            </h3>
            <input
              type="text"
              value={newAirlineValue}
              onChange={(e) => setNewAirlineValue(e.target.value)}
              placeholder="Enter airline name"
              className="mb-4 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addNewAirline();
                }
                if (e.key === "Escape") {
                  setShowAddAirlineModal(false);
                  setNewAirlineValue("");
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  (setShowAddAirlineModal(false), setNewAirlineValue(""))
                }
                className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addNewAirline}
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
