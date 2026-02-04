"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type SerializedPayable = {
  id: string;
  date: string;
  name: string | null;
  description: string | null;
  amount: number;
  balance: number;
  deadline: string | null;
  remaining: number | null;
  source: "ticket" | "visa" | "haj_umrah" | null;
  ticketId: string | null;
  visaId: string | null;
  hajUmrahBookingId: string | null;
};

type PayablesTableWithFiltersProps = {
  payables: SerializedPayable[];
};

function matchSearch(payable: SerializedPayable, q: string): boolean {
  if (!q.trim()) return true;
  const search = q.trim().toLowerCase();
  const name = payable.name ?? "";
  const desc = payable.description ?? "";
  return name.toLowerCase().includes(search) || desc.toLowerCase().includes(search);
}

const SOURCE_OPTIONS = [
  { value: "", label: "All sources" },
  { value: "ticket", label: "Ticket" },
  { value: "visa", label: "Visa" },
  { value: "haj_umrah", label: "Haj & Umrah" },
];

export default function PayablesTableWithFilters({ payables: allPayables }: PayablesTableWithFiltersProps) {
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredPayables = useMemo(() => {
    return allPayables.filter((p) => {
      if (!matchSearch(p, search)) return false;
      if (source && p.source !== source) return false;
      if (dateFrom) {
        const d = new Date(p.date);
        const from = new Date(dateFrom);
        if (d < from) return false;
      }
      if (dateTo) {
        const d = new Date(p.date);
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (d > to) return false;
      }
      return true;
    });
  }, [allPayables, search, source, dateFrom, dateTo]);

  const totalBalance = useMemo(
    () => filteredPayables.reduce((sum, p) => sum + p.balance, 0),
    [filteredPayables]
  );

  const hasActiveFilters = !!(search || source || dateFrom || dateTo);

  const clearFilters = () => {
    setSearch("");
    setSource("");
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
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, description..."
              className="w-full min-w-[200px] rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Source
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-36 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            >
              {SOURCE_OPTIONS.map((opt) => (
                <option key={opt.value || "all"} value={opt.value}>
                  {opt.label}
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
        {hasActiveFilters && (
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Showing {filteredPayables.length} of {allPayables.length} payable(s)
          </p>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
              <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">Date</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">Source</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">Name</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">Description</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-white">Amount</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-white">Balance</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">Deadline</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-white">Remaining</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayables.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                  {allPayables.length === 0 ? "No payables yet" : "No payables match the filters"}
                </td>
              </tr>
            ) : (
              filteredPayables.map((p) => (
                <tr key={p.id} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {new Date(p.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {p.source === "ticket" && p.ticketId ? (
                      <Link href="/tickets" className="text-blue-600 hover:underline dark:text-blue-400">
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
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{p.name ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{p.description ?? "—"}</td>
                  <td className="px-4 py-3 text-right text-zinc-700 dark:text-zinc-300">
                    ${p.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-red-600 dark:text-red-400">
                    ${p.balance.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {p.deadline ? new Date(p.deadline).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-700 dark:text-zinc-300">
                    {p.remaining != null ? `${p.remaining} days` : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-zinc-200 bg-zinc-50 font-medium dark:border-zinc-700 dark:bg-zinc-800/50">
              <td colSpan={5} className="px-4 py-3 text-right text-zinc-900 dark:text-white">
                Total balance (visible rows)
              </td>
              <td className="px-4 py-3 text-right font-semibold text-red-600 dark:text-red-400">
                ${totalBalance.toLocaleString()}
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}
