"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getLogoDataUrl } from "@/lib/pdf-logo";
import type { CargoReportData } from "@/lib/cargo-report";
type Location = { id: string; name: string };

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "WAREHOUSE", label: "Warehouse" },
  { value: "ASSIGNED_TO_MANIFEST", label: "Assigned to manifest" },
  { value: "DISPATCHED", label: "Dispatched" },
  { value: "ARRIVED", label: "Arrived" },
  { value: "DELIVERED", label: "Delivered" },
];

type Props = {
  initialData: CargoReportData;
  locations: Location[];
  systemName?: string;
  logoUrl?: string;
};

export default function CargoReportView({ initialData, locations, systemName = "Daybah Travel Agency", logoUrl = "/logo.png" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [from, setFrom] = useState(() => {
    const f = searchParams.get("from");
    if (f) return f;
    return new Date(initialData.fromDate).toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => {
    const t = searchParams.get("to");
    if (t) return t;
    return new Date(initialData.toDate).toISOString().slice(0, 10);
  });
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [source, setSource] = useState(searchParams.get("source") ?? "");
  const [dest, setDest] = useState(searchParams.get("dest") ?? "");

  function applyFilters() {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (status) params.set("status", status);
    if (source) params.set("source", source);
    if (dest) params.set("dest", dest);
    startTransition(() => {
      router.push(`/reports/cargo?${params.toString()}`);
    });
  }

  const { summary, shipments, dateRangeLabel, fromDate, toDate } = initialData;
  const fromStr = new Date(fromDate).toISOString().slice(0, 10);
  const toStr = new Date(toDate).toISOString().slice(0, 10);
  const exportFileBase = `cargo-report-${fromStr}-to-${toStr}`;

  const exportExcel = useCallback(() => {
    const summarySheet = [
      ["Cargo Report Summary", ""],
      ["Date range", dateRangeLabel],
      [],
      ["Metric", "Value"],
      ["Total shipments", summary.totalShipments],
      ["Total weight (kg)", summary.totalWeight.toLocaleString("en-US", { maximumFractionDigits: 1 })],
      ["Received on hand (paid/partial)", summary.totalReceived],
      ["Receivables (outstanding)", summary.totalReceivables ?? 0],
    ];
    const tableHeaders = ["Tracking", "Sender", "Receiver", "Route", "Status", "Weight", "Price"];
    const tableRows = shipments.map((s) => [
      s.trackingNumber,
      s.senderName,
      s.receiverName,
      `${s.source} → ${s.destination}`,
      s.status.replace(/_/g, " "),
      `${s.totalWeight} kg`,
      s.price,
    ]);
    const footerRow = ["", "", "", "", "", "Received on hand", (summary.totalReceived ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })];
    const receivablesRow = ["", "", "", "", "", "Receivables (outstanding)", (summary.totalReceivables ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summarySheet), "Summary");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([tableHeaders, ...tableRows, [], footerRow, receivablesRow]), "Shipments");
    XLSX.writeFile(wb, `${exportFileBase}.xlsx`);
  }, [dateRangeLabel, summary, shipments, exportFileBase]);

  const exportPdf = useCallback(async () => {
    const doc = new jsPDF({ orientation: "portrait" });
    const pageW = 210;
    const logoW = 48;
    const logoH = 18;
    const margin = 14;
    try {
      const logoDataUrl = await getLogoDataUrl(logoUrl);
      doc.addImage(logoDataUrl, "PNG", pageW - margin - logoW, 8, logoW, logoH);
    } catch {
      /* logo optional */
    }
    doc.setFontSize(16);
    doc.text(`${systemName} — Cargo Report`, margin, 16);
    doc.setFontSize(10);
    doc.text(dateRangeLabel, margin, 24);

    const summaryData = [
      ["Total shipments", String(summary.totalShipments)],
      ["Total weight (kg)", summary.totalWeight.toLocaleString("en-US", { maximumFractionDigits: 1 })],
      ["Received on hand (paid/partial)", `$${(summary.totalReceived ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
      ["Receivables (outstanding)", `$${(summary.totalReceivables ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
    ];
    autoTable(doc, {
      startY: 30,
      head: [["Metric", "Value"]],
      body: summaryData,
      theme: "grid",
      styles: { fontSize: 9 },
    });

    const tableStartY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
    doc.setFontSize(12);
    doc.text("Shipments", margin, tableStartY);
    autoTable(doc, {
      startY: tableStartY + 6,
      head: [["Tracking", "Sender", "Receiver", "Route", "Status", "Weight", "Price"]],
      body: shipments.map((s) => [
        s.trackingNumber,
        s.senderName,
        s.receiverName,
        `${s.source} → ${s.destination}`,
        s.status.replace(/_/g, " "),
        `${s.totalWeight} kg`,
        `$${s.price.toFixed(2)}`,
      ]),
      theme: "striped",
      styles: { fontSize: 8 },
    });
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text("Received on hand (paid/partial):", margin, finalY);
    doc.text(`$${(summary.totalReceived ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 80, finalY);
    doc.text("Receivables (outstanding):", margin, finalY + 6);
    doc.text(`$${(summary.totalReceivables ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 80, finalY + 6);

    doc.save(`${exportFileBase}.pdf`);
  }, [dateRangeLabel, summary, shipments, exportFileBase]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Filters
        </h2>
        <div className="flex w-full flex-wrap items-end gap-4">
          <div className="min-w-[140px] flex-1">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
            />
          </div>
          <div className="min-w-[140px] flex-1">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
            />
          </div>
          <div className="min-w-[140px] flex-1">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          {locations.length > 0 && (
            <>
              <div className="min-w-[140px] flex-1">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Source location</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="mt-1 w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                >
                  <option value="">All</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-[140px] flex-1">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">Destination location</label>
                <select
                  value={dest}
                  onChange={(e) => setDest(e.target.value)}
                  className="mt-1 w-full min-w-0 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                >
                  <option value="">All</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          <button
            type="button"
            onClick={applyFilters}
            disabled={isPending}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {isPending ? "Applying..." : "Apply"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total shipments
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {summary.totalShipments}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total weight (kg)
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {summary.totalWeight.toLocaleString("en-US", { maximumFractionDigits: 1 })}
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-5 dark:border-amber-900/50 dark:bg-amber-950/30">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            Received on hand
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-700 dark:text-amber-400">
            ${(summary.totalReceived ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="mt-1 text-xs text-amber-600/80 dark:text-amber-400/80">Paid & partially paid</p>
        </div>
        <div className="rounded-xl border border-violet-200 bg-violet-50/80 p-5 dark:border-violet-900/50 dark:bg-violet-950/30">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-400">
            Receivables (outstanding)
          </p>
          <p className="mt-2 text-2xl font-bold text-violet-700 dark:text-violet-400">
            ${(summary.totalReceivables ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Shipments — {dateRangeLabel}
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportExcel}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Export Excel
            </button>
            <button
              type="button"
              onClick={exportPdf}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Export PDF
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Tracking</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Sender</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Receiver</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Route</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-400">Status</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-400">Weight</th>
                <th className="px-4 py-3 text-right font-medium text-slate-600 dark:text-slate-400">Price</th>
              </tr>
            </thead>
            <tbody>
              {shipments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    No shipments in this period
                  </td>
                </tr>
              ) : (
                shipments.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/cargo/${s.id}`}
                        className="font-medium text-amber-600 hover:underline dark:text-amber-400"
                      >
                        {s.trackingNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{s.senderName}</td>
                    <td className="px-4 py-3">{s.receiverName}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {s.source} → {s.destination}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">
                        {s.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">{s.totalWeight} kg</td>
                    <td className="px-4 py-3 text-right">${s.price.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-800/50">
                <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 sm:px-6 sm:py-4" colSpan={6}>
                  Received on hand (paid & partial)
                </td>
                <td className="px-4 py-3 text-right font-semibold text-amber-700 dark:text-amber-400 sm:px-6 sm:py-4">
                  ${(summary.totalReceived ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
              <tr className="border-t border-slate-200 bg-violet-50/50 dark:border-slate-700 dark:bg-violet-950/20">
                <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 sm:px-6 sm:py-4" colSpan={6}>
                  Receivables (outstanding)
                </td>
                <td className="px-4 py-3 text-right font-semibold text-violet-700 dark:text-violet-400 sm:px-6 sm:py-4">
                  ${(summary.totalReceivables ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
