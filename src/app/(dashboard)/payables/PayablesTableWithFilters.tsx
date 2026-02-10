"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { getLogoDataUrl } from "@/lib/pdf-logo";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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
  airline?: string | null;
  ticketReference?: string | null;
  visaReference?: string | null;
};

type PayablesTableWithFiltersProps = {
  payables: SerializedPayable[];
  systemName?: string;
  logoUrl?: string;
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

const GROUP_BY_OPTIONS = [
  { value: "", label: "No grouping" },
  { value: "airline", label: "By airline" },
  { value: "ticket", label: "By ticket" },
  { value: "visa", label: "By visa" },
];

type GroupedRow = { key: string; label: string; count: number; amount: number; balance: number; link?: string };

function sourceLabel(p: SerializedPayable): string {
  if (p.source === "ticket") return "Ticket";
  if (p.source === "visa") return "Visa";
  if (p.source === "haj_umrah") return "Haj & Umrah";
  return "—";
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString();
}

export default function PayablesTableWithFilters({ payables: allPayables, systemName = "Daybah Travel Agency", logoUrl = "/logo.png" }: PayablesTableWithFiltersProps) {
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [groupBy, setGroupBy] = useState("");

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

  const groupedRows = useMemo((): GroupedRow[] => {
    if (!groupBy) return [];
    const map = new Map<string, GroupedRow>();
    for (const p of filteredPayables) {
      let key: string;
      let label: string;
      let link: string | undefined;
      if (groupBy === "airline") {
        key = p.source === "ticket" ? (p.airline?.trim() || "—") : "_other";
        label = key === "_other" ? "Other (visa / Haj & Umrah)" : key;
        link = undefined;
      } else if (groupBy === "ticket" && p.ticketId) {
        key = p.ticketId;
        label = p.ticketReference || p.name || `Ticket ${p.ticketId.slice(0, 8)}`;
        link = `/tickets/${p.ticketId}`;
      } else if (groupBy === "visa" && p.visaId) {
        key = p.visaId;
        label = p.visaReference || p.name || `Visa ${p.visaId.slice(0, 8)}`;
        link = `/visas/${p.visaId}`;
      } else if (groupBy === "ticket" || groupBy === "visa") {
        key = "_other";
        label = "Other";
        link = undefined;
      } else {
        continue;
      }
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
        existing.amount += p.amount;
        existing.balance += p.balance;
      } else {
        map.set(key, { key, label, count: 1, amount: p.amount, balance: p.balance, link });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.balance - a.balance);
  }, [filteredPayables, groupBy]);

  const totalBalance = useMemo(
    () => filteredPayables.reduce((sum, p) => sum + p.balance, 0),
    [filteredPayables]
  );

  const hasActiveFilters = !!(search || source || dateFrom || dateTo || groupBy);

  const clearFilters = () => {
    setSearch("");
    setSource("");
    setDateFrom("");
    setDateTo("");
    setGroupBy("");
  };

  const exportToExcel = () => {
    const headers = ["Date", "Source", "Name", "Description", "Amount", "Balance", "Deadline", "Remaining"];
    const rows = filteredPayables.map((p) => [
      formatDate(p.date),
      sourceLabel(p),
      p.name ?? "",
      p.description ?? "",
      p.amount,
      p.balance,
      formatDate(p.deadline),
      p.remaining != null ? `${p.remaining} days` : "",
    ]);
    const data = [headers, ...rows, [], ["Total balance (visible rows)", "", "", "", "", totalBalance, "", ""]];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payables");
    XLSX.writeFile(wb, `payables-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportToPdf = async () => {
    const doc = new jsPDF({ orientation: "landscape" });
    const pageW = 297; // A4 landscape width (mm)
    const logoW = 48;
    const logoH = 18;
    const margin = 14;
    try {
      const logoDataUrl = await getLogoDataUrl(logoUrl);
      doc.addImage(logoDataUrl, "PNG", pageW - margin - logoW, 6, logoW, logoH);
    } catch {
      // logo optional
    }
    doc.setFontSize(14);
    doc.text(`${systemName} — Payables`, margin, 14);
    const headers = [["Date", "Source", "Name", "Description", "Amount", "Balance", "Deadline", "Remaining"]];
    const body = filteredPayables.map((p) => [
      formatDate(p.date),
      sourceLabel(p),
      p.name ?? "",
      (p.description ?? "").slice(0, 30),
      `$${p.amount.toLocaleString()}`,
      `$${p.balance.toLocaleString()}`,
      formatDate(p.deadline),
      p.remaining != null ? `${p.remaining} days` : "",
    ]);
    autoTable(doc, {
      head: headers,
      body,
      startY: 22,
      styles: { fontSize: 8 },
    });
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY ?? 22;
    doc.setFontSize(10);
    doc.text(`Total balance (visible rows): $${totalBalance.toLocaleString()}`, 14, finalY + 8);
    doc.save(`payables-${new Date().toISOString().slice(0, 10)}.pdf`);
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
              placeholder="Name, description..."
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
          <div className="w-full min-w-0 sm:w-auto sm:min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Group by
            </label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white sm:w-40"
            >
              {GROUP_BY_OPTIONS.map((opt) => (
                <option key={opt.value || "none"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {hasActiveFilters && (
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Showing {filteredPayables.length} of {allPayables.length} payable(s)
            {groupBy && " • grouped by " + GROUP_BY_OPTIONS.find((o) => o.value === groupBy)?.label.toLowerCase()}
          </p>
        )}
        <div className="mt-4 flex flex-col gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-700 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Export (visible rows):</span>
          <button
            type="button"
            onClick={exportToExcel}
            disabled={filteredPayables.length === 0}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Excel
          </button>
          <button
            type="button"
            onClick={exportToPdf}
            disabled={filteredPayables.length === 0}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            PDF
          </button>
        </div>
      </div>

      {groupBy && groupedRows.length > 0 && (
        <div className="mb-6 overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Payables by {GROUP_BY_OPTIONS.find((o) => o.value === groupBy)?.label.replace("By ", "")} (date range applied)
            </h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">
                  {groupBy === "airline" ? "Airline" : groupBy === "ticket" ? "Ticket" : "Visa"}
                </th>
                <th className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-white">Count</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-white">Amount</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-white">Balance</th>
              </tr>
            </thead>
            <tbody>
              {groupedRows.map((row) => (
                <tr key={row.key} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {row.link ? (
                      <Link href={row.link} className="text-blue-600 hover:underline dark:text-blue-400">
                        {row.label}
                      </Link>
                    ) : (
                      row.label
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-700 dark:text-zinc-300">{row.count}</td>
                  <td className="px-4 py-3 text-right text-zinc-700 dark:text-zinc-300">
                    ${row.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-red-600 dark:text-red-400">
                    ${row.balance.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-zinc-200 bg-zinc-50 font-medium dark:border-zinc-700 dark:bg-zinc-800/50">
                <td className="px-4 py-3 text-right text-zinc-900 dark:text-white">Total</td>
                <td className="px-4 py-3 text-right text-zinc-900 dark:text-white">{groupedRows.reduce((s, r) => s + r.count, 0)}</td>
                <td className="px-4 py-3 text-right text-zinc-900 dark:text-white">
                  ${groupedRows.reduce((s, r) => s + r.amount, 0).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-red-600 dark:text-red-400">
                  ${groupedRows.reduce((s, r) => s + r.balance, 0).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

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
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    <Link
                      href={`/payables/${p.id}`}
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {p.name ?? "—"}
                    </Link>
                  </td>
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
