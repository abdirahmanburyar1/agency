"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type SerializedTicket = {
  id: string;
  ticketNumber: number | null;
  reference: string;
  date: string;
  customerId: string | null;
  customerName: string | null;
  airline: string | null;
  netCost: number;
  netSales: number;
  profit: number;
  customer: { name: string; phone: string | null } | null;
};

type TicketsTableWithFiltersProps = {
  tickets: SerializedTicket[];
  airlines: string[];
};

function matchSearch(ticket: SerializedTicket, q: string): boolean {
  if (!q.trim()) return true;
  const search = q.trim().toLowerCase();
  const ticketNo =
    ticket.ticketNumber != null
      ? ticket.ticketNumber < 1000
        ? String(ticket.ticketNumber).padStart(3, "0")
        : String(ticket.ticketNumber)
      : "";
  const custName = ticket.customer?.name ?? ticket.customerName ?? "";
  const custPhone = ticket.customer?.phone ?? "";
  const ref = ticket.reference ?? "";
  return (
    custName.toLowerCase().includes(search) ||
    custPhone.toLowerCase().includes(search) ||
    ticketNo.toLowerCase().includes(search) ||
    ref.toLowerCase().includes(search)
  );
}

export default function TicketsTableWithFilters({
  tickets: allTickets,
  airlines,
}: TicketsTableWithFiltersProps) {
  const [search, setSearch] = useState("");
  const [airline, setAirline] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredTickets = useMemo(() => {
    return allTickets.filter((t) => {
      if (!matchSearch(t, search)) return false;
      if (airline && (t.airline ?? "") !== airline) return false;
      if (dateFrom) {
        const d = new Date(t.date);
        const from = new Date(dateFrom);
        if (d < from) return false;
      }
      if (dateTo) {
        const d = new Date(t.date);
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (d > to) return false;
      }
      return true;
    });
  }, [allTickets, search, airline, dateFrom, dateTo]);

  const hasActiveFilters =
    search || airline || dateFrom || dateTo;

  const clearFilters = () => {
    setSearch("");
    setAirline("");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <>
      <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Filters
          </h2>
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
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Customer, phone, ticket no, reference..."
              className="w-full min-w-[200px] rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Airline
            </label>
            <select
              value={airline}
              onChange={(e) => setAirline(e.target.value)}
              className="w-40 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            >
              <option value="">All</option>
              {airlines.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Date from
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Date to
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
              <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">
                Ticket no
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">
                Reference
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">
                Date
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">
                Customer
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">
                Airline
              </th>
              <th className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-white">
                Net Cost
              </th>
              <th className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-white">
                Net Sales
              </th>
              <th className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-white">
                Profit
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-8 text-center text-zinc-500"
                >
                  No tickets found
                </td>
              </tr>
            ) : (
              filteredTickets.map((t) => {
                const ticketNo =
                  t.ticketNumber != null
                    ? t.ticketNumber < 1000
                      ? String(t.ticketNumber).padStart(3, "0")
                      : String(t.ticketNumber)
                    : "—";
                const customerDisplay = t.customer
                  ? t.customer.phone?.trim()
                    ? `${t.customer.name} - ${t.customer.phone}`
                    : t.customer.name
                  : t.customerName ?? "—";
                return (
                  <tr
                    key={t.id}
                    className="border-b border-zinc-100 dark:border-zinc-800"
                  >
                    <td className="px-4 py-3 font-mono text-zinc-700 dark:text-zinc-300">
                      <Link
                        href={`/tickets/${t.id}`}
                        className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {ticketNo}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {t.reference ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {new Date(t.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {customerDisplay}
                    </td>
                    <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                      {t.airline ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-700 dark:text-zinc-300">
                      ${t.netCost.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-700 dark:text-zinc-300">
                      ${t.netSales.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-green-600 dark:text-green-400">
                      ${t.profit.toLocaleString()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
