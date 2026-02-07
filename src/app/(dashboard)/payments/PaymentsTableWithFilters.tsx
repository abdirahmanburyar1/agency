"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getCurrencySymbol } from "@/lib/currencies";

export type SerializedPayment = {
  id: string;
  date: string;
  paymentDate: string;
  status: string;
  name: string | null;
  description: string | null;
  amount: number;
  currency?: string;
  expectedDate: string | null;
  source: "ticket" | "visa" | "haj_umrah" | "cargo" | null;
  ticketId: string | null;
  visaId: string | null;
  hajUmrahBookingId: string | null;
  cargoShipmentId: string | null;
  customerName: string;
  totalReceived: number;
  balance: number;
};

type PaymentsTableWithFiltersProps = {
  payments: SerializedPayment[];
};

function matchSearch(payment: SerializedPayment, q: string): boolean {
  if (!q.trim()) return true;
  const search = q.trim().toLowerCase();
  const customer = payment.customerName ?? "";
  const name = payment.name ?? "";
  const desc = payment.description ?? "";
  return (
    customer.toLowerCase().includes(search) ||
    name.toLowerCase().includes(search) ||
    desc.toLowerCase().includes(search)
  );
}

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "partial", label: "Partial" },
  { value: "paid", label: "Paid" },
  { value: "credit", label: "Credit" },
  { value: "refund", label: "Refund" },
  { value: "refunded", label: "Refunded" },
];

const SOURCE_OPTIONS = [
  { value: "", label: "All sources" },
  { value: "ticket", label: "Ticket" },
  { value: "visa", label: "Visa" },
  { value: "haj_umrah", label: "Haj & Umrah" },
  { value: "cargo", label: "Cargo" },
];

export default function PaymentsTableWithFilters({ payments: allPayments }: PaymentsTableWithFiltersProps) {
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredPayments = useMemo(() => {
    return allPayments.filter((p) => {
      if (!matchSearch(p, search)) return false;
      if (source && p.source !== source) return false;
      if (status && p.status !== status) return false;
      if (dateFrom) {
        const d = new Date(p.paymentDate);
        const from = new Date(dateFrom);
        if (d < from) return false;
      }
      if (dateTo) {
        const d = new Date(p.paymentDate);
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (d > to) return false;
      }
      return true;
    });
  }, [allPayments, search, source, status, dateFrom, dateTo]);

  const totalBalance = useMemo(
    () => filteredPayments.filter((p) => p.status !== "refunded").reduce((sum, p) => sum + p.balance, 0),
    [filteredPayments]
  );

  const hasActiveFilters = !!(search || source || status || dateFrom || dateTo);

  const clearFilters = () => {
    setSearch("");
    setSource("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <>
      <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Filters</h2>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-400"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3">
          <div className="min-w-0 w-full sm:flex-1">
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Customer, payment name..."
              className="w-full min-w-0 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          <div className="w-full min-w-0 sm:w-36">
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Source
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white sm:w-36"
            >
              {SOURCE_OPTIONS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full min-w-0 sm:w-32">
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white sm:w-32"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full min-w-0 sm:w-auto sm:min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Date from
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full min-w-0 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          <div className="w-full min-w-0 sm:w-auto sm:min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Date to
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full min-w-0 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
          </div>
        </div>
        {hasActiveFilters && (
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Showing {filteredPayments.length} of {allPayments.length} payment(s)
          </p>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
              <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">Payment date</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">Source</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">Customer</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">Name</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-white">Amount</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-white">Received</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-white">Balance</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">Status</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">Credit date</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-zinc-500">
                  {allPayments.length === 0 ? "No payments yet" : "No payments match the filters"}
                </td>
              </tr>
            ) : (
              filteredPayments.map((p) => (
                <tr key={p.id} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {new Date(p.paymentDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {p.source === "ticket" && p.ticketId ? (
                      <Link
                        href={`/tickets/${p.ticketId}`}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Ticket
                      </Link>
                    ) : p.source === "visa" ? (
                      <Link href="/visas" className="text-blue-600 hover:underline dark:text-blue-400">
                        Visa
                      </Link>
                    ) : p.source === "haj_umrah" && p.hajUmrahBookingId ? (
                      <Link
                        href={`/haj-umrah/${p.hajUmrahBookingId}`}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Haj & Umrah
                      </Link>
                    ) : p.source === "cargo" && p.cargoShipmentId ? (
                      <Link
                        href={`/cargo/${p.cargoShipmentId}`}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Cargo
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{p.customerName}</td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{p.name ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-white">
                    {p.status === "refunded" ? (
                      <span className="cursor-not-allowed text-zinc-500 dark:text-zinc-400">
                        {getCurrencySymbol(p.currency ?? "USD")}{p.amount.toLocaleString()} {p.currency ?? "USD"}
                      </span>
                    ) : (
                      <Link
                        href={`/payments/${p.id}`}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {getCurrencySymbol(p.currency ?? "USD")}{p.amount.toLocaleString()} {p.currency ?? "USD"}
                      </Link>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-700 dark:text-zinc-300">
                    {getCurrencySymbol(p.currency ?? "USD")}{p.totalReceived.toLocaleString()} {p.currency ?? "USD"}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-white">
                    {p.balance < 0 ? (
                      <span className="text-blue-600 dark:text-blue-400" title="Refund due to customer">
                        Refund {getCurrencySymbol(p.currency ?? "USD")}{Math.abs(p.balance).toLocaleString()} {p.currency ?? "USD"}
                      </span>
                    ) : (
                      `${getCurrencySymbol(p.currency ?? "USD")}${p.balance.toLocaleString()} ${p.currency ?? "USD"}`
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        p.status === "paid"
                          ? "rounded bg-green-100 px-2 py-0.5 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : p.status === "partial"
                            ? "rounded bg-amber-100 px-2 py-0.5 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                            : p.status === "pending"
                              ? "rounded bg-zinc-100 px-2 py-0.5 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                                : p.status === "credit"
                                ? "rounded bg-red-100 px-2 py-0.5 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                : p.status === "refund" || p.status === "refunded"
                                  ? "rounded bg-blue-100 px-2 py-0.5 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                  : "rounded bg-zinc-100 px-2 py-0.5 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      }
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {p.status === "credit" && p.expectedDate
                      ? new Date(p.expectedDate).toLocaleDateString()
                      : p.status === "refund"
                        ? "Refund due"
                        : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-zinc-200 bg-zinc-50 font-medium dark:border-zinc-700 dark:bg-zinc-800/50">
              <td colSpan={6} className="px-4 py-3 text-right text-zinc-900 dark:text-white">
                Total balance (excl. refunded)
              </td>
              <td className="px-4 py-3 text-right font-semibold text-zinc-900 dark:text-white">
                {totalBalance < 0 ? (
                  <span className="text-blue-600 dark:text-blue-400" title="Net refund due to customers">
                    Refund ${Math.abs(totalBalance).toLocaleString()}
                  </span>
                ) : (
                  <span className="text-green-600 dark:text-green-400">
                    ${totalBalance.toLocaleString()}
                  </span>
                )}
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}
