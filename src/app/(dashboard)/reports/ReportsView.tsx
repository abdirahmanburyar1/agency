"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getLogoDataUrl } from "@/lib/pdf-logo";
import type { ReportData, ReportPeriod } from "@/lib/reports";

type Props = { initialData: ReportData };

function SummaryCard({
  title,
  value,
  prefix = "",
  accent,
  highlight,
}: {
  title: string;
  value: number;
  prefix?: string;
  accent: string;
  highlight?: boolean;
}) {
  const accentClasses: Record<string, string> = {
    blue: "border-blue-200 bg-blue-50/80 dark:border-blue-900/50 dark:bg-blue-950/30",
    emerald: "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/50 dark:bg-emerald-950/30",
    teal: "border-teal-200 bg-teal-50/80 dark:border-teal-900/50 dark:bg-teal-950/30",
    amber: "border-amber-200 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/30",
    rose: "border-rose-200 bg-rose-50/80 dark:border-rose-900/50 dark:bg-rose-950/30",
    violet: "border-violet-200 bg-violet-50/80 dark:border-violet-900/50 dark:bg-violet-950/30",
  };
  const valueClasses: Record<string, string> = {
    blue: "text-blue-700 dark:text-blue-300",
    emerald: "text-emerald-700 dark:text-emerald-300",
    teal: "text-teal-700 dark:text-teal-300",
    amber: "text-amber-700 dark:text-amber-300",
    rose: "text-rose-700 dark:text-rose-300",
    violet: "text-violet-700 dark:text-violet-300",
  };
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md ${
        highlight ? "ring-2 ring-emerald-400/50 dark:ring-emerald-500/30" : ""
      } ${accentClasses[accent] ?? accentClasses.emerald}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {title}
      </p>
      <p className={`mt-2 text-2xl font-bold ${valueClasses[accent] ?? valueClasses.emerald}`}>
        {prefix}
        {value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  );
}

export default function ReportsView({ initialData }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [from, setFrom] = useState(() => {
    const f = searchParams.get("from");
    if (f) return f;
    const d = new Date(initialData.fromDate);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => {
    const t = searchParams.get("to");
    if (t) return t;
    const d = new Date(initialData.toDate);
    return d.toISOString().slice(0, 10);
  });
  const [period, setPeriod] = useState<ReportPeriod>(() => {
    const p = searchParams.get("period");
    if (p === "today" || p === "daily" || p === "monthly" || p === "yearly") return p;
    return initialData.period;
  });

  const [isPending, startTransition] = useTransition();
  const data = initialData;
  const { summary, rows, dateRangeLabel, periodLabel } = data;

  const fromDate = new Date(data.fromDate);
  const toDate = new Date(data.toDate);
  const fromStr = fromDate.toISOString().slice(0, 10);
  const toStr = toDate.toISOString().slice(0, 10);
  const year = fromDate.getFullYear();
  const month = String(fromDate.getMonth() + 1).padStart(2, "0");
  const exportFileBase =
    data.period === "today"
      ? `report-today-${fromStr}`
      : data.period === "daily"
        ? `report-daily-${fromStr}-to-${toStr}`
        : data.period === "yearly"
          ? `report-yearly-${year}`
          : `report-monthly-${year}-${month}`;

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (period) params.set("period", period);
    startTransition(() => {
      router.push(`/reports?${params.toString()}`);
    });
  }, [router, from, to, period]);

  const exportExcel = useCallback(() => {
    const summarySheet = [
      ["Report Summary", ""],
      ["Date range", dateRangeLabel],
      [],
      ["Metric", "Amount"],
      ["Ticket revenue", summary.ticketRevenue],
      ["Visa revenue", summary.visaRevenue],
      ["Haj & Umrah revenue", summary.hajUmrahRevenue],
      ["Total revenue", summary.totalRevenue],
      ["Total expenses", summary.totalExpenses],
      ["Net income", summary.netIncome],
      ["Receivables (outstanding)", summary.totalReceivables],
      ["Payables", summary.totalPayables],
    ];
    const tableHeaders = ["Period", "Tickets", "Visas", "Haj & Umrah", "Total revenue", "Expenses", "Net income"];
    const tableRows = rows.map((r) => [
      r.monthLabel,
      r.ticketRevenue,
      r.visaRevenue,
      r.hajUmrahRevenue,
      r.totalRevenue,
      r.expenses,
      r.netIncome,
    ]);
    const receivablesRow = ["", "", "", "", "", "Receivables (outstanding)", summary.totalReceivables];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summarySheet), "Summary");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([tableHeaders, ...tableRows, [], receivablesRow]), "Breakdown");
    XLSX.writeFile(wb, `${exportFileBase}.xlsx`);
  }, [dateRangeLabel, summary, rows, exportFileBase]);

  const exportPdf = useCallback(async () => {
    const doc = new jsPDF({ orientation: "portrait" });
    const pageW = 210; // A4 portrait width (mm)
    const logoW = 48;
    const logoH = 18;
    const margin = 14;
    try {
      const logoDataUrl = await getLogoDataUrl();
      // Top right: preserve aspect ratio (wider than tall) so logo isn't compressed
      doc.addImage(logoDataUrl, "PNG", pageW - margin - logoW, 8, logoW, logoH);
    } catch {
      // logo optional: continue without it
    }
    doc.setFontSize(16);
    doc.text("Daybah Travel Agency — Report", margin, 16);
    doc.setFontSize(10);
    doc.text(dateRangeLabel, margin, 24);

    const summaryData = [
      ["Total revenue", `$${summary.totalRevenue.toLocaleString()}`],
      ["Total expenses", `$${summary.totalExpenses.toLocaleString()}`],
      ["Net income", `$${summary.netIncome.toLocaleString()}`],
      ["Receivables (outstanding)", `$${summary.totalReceivables.toLocaleString()}`],
      ["Payables", `$${summary.totalPayables.toLocaleString()}`],
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
    doc.text(`${periodLabel} breakdown`, 14, tableStartY);
    autoTable(doc, {
      startY: tableStartY + 6,
      head: [["Period", "Tickets", "Visas", "Haj & Umrah", "Revenue", "Expenses", "Net"]],
      body: rows.map((r) => [
        r.monthLabel,
        `$${r.ticketRevenue.toLocaleString()}`,
        `$${r.visaRevenue.toLocaleString()}`,
        `$${r.hajUmrahRevenue.toLocaleString()}`,
        `$${r.totalRevenue.toLocaleString()}`,
        `$${r.expenses.toLocaleString()}`,
        `$${r.netIncome.toLocaleString()}`,
      ]),
      theme: "striped",
      styles: { fontSize: 8 },
    });
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text("Receivables (outstanding):", 14, finalY);
    doc.text(`$${summary.totalReceivables.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 80, finalY);

    doc.save(`${exportFileBase}.pdf`);
  }, [dateRangeLabel, summary, rows, periodLabel, exportFileBase]);

  const chartData = rows.map((r) => ({
    month: r.monthLabel,
    Tickets: r.ticketRevenue,
    Visas: r.visaRevenue,
    "Haj & Umrah": r.hajUmrahRevenue,
    Expenses: r.expenses,
  }));

  return (
    <div className="space-y-8">
      {/* Filters card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/50 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          Filters
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
          <div className="w-full min-w-0 sm:w-auto sm:min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div className="w-full min-w-0 sm:w-auto sm:min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div className="w-full min-w-0 sm:w-auto sm:min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
              className="w-full min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            >
              <option value="today">Today</option>
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <button
            type="button"
            onClick={applyFilters}
            disabled={isPending}
            className="w-full rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 disabled:opacity-70 dark:bg-emerald-500 dark:hover:bg-emerald-600 sm:w-auto"
          >
            {isPending ? "Applying…" : "Apply"}
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{dateRangeLabel}</p>
      </div>

      {/* Summary cards */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          Summary
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <SummaryCard title="Total revenue" value={summary.totalRevenue} prefix="$" accent="emerald" highlight />
          <SummaryCard title="Ticket revenue" value={summary.ticketRevenue} prefix="$" accent="blue" />
          <SummaryCard title="Visa revenue" value={summary.visaRevenue} prefix="$" accent="emerald" />
          <SummaryCard title="Haj & Umrah revenue" value={summary.hajUmrahRevenue} prefix="$" accent="teal" />
          <SummaryCard title="Total expenses" value={summary.totalExpenses} prefix="$" accent="amber" />
          <SummaryCard title="Net income" value={summary.netIncome} prefix="$" accent="emerald" highlight />
          <SummaryCard title="Receivables (outstanding)" value={summary.totalReceivables} prefix="$" accent="violet" />
          <SummaryCard title="Payables" value={summary.totalPayables} prefix="$" accent="rose" />
        </div>
      </section>

      {/* Chart */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
          Revenue vs expenses ({periodLabel.toLowerCase()})
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis dataKey="month" tick={{ fill: "currentColor", fontSize: 11 }} />
              <YAxis tick={{ fill: "currentColor", fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(v: number | undefined) => `$${Number(v ?? 0).toLocaleString()}`} contentStyle={{ borderRadius: "12px" }} />
              <Legend />
              <Bar dataKey="Tickets" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Visas" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Haj & Umrah" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expenses" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table + Export */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 dark:border-slate-700 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:px-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            {periodLabel} breakdown
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportExcel}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Export Excel
            </button>
            <button
              type="button"
              onClick={exportPdf}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Export PDF
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                <th className="px-3 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 sm:px-6 sm:py-4">{periodLabel === "Today" || periodLabel === "Daily" ? "Date" : periodLabel === "Yearly" ? "Year" : "Month"}</th>
                <th className="px-3 py-3 text-right font-semibold text-slate-700 dark:text-slate-300 sm:px-6 sm:py-4">Tickets</th>
                <th className="px-3 py-3 text-right font-semibold text-slate-700 dark:text-slate-300 sm:px-6 sm:py-4">Visas</th>
                <th className="px-3 py-3 text-right font-semibold text-slate-700 dark:text-slate-300 sm:px-6 sm:py-4">Haj & Umrah</th>
                <th className="px-3 py-3 text-right font-semibold text-slate-700 dark:text-slate-300 sm:px-6 sm:py-4">Revenue</th>
                <th className="px-3 py-3 text-right font-semibold text-slate-700 dark:text-slate-300 sm:px-6 sm:py-4">Expenses</th>
                <th className="px-3 py-3 text-right font-semibold text-emerald-700 dark:text-emerald-400 sm:px-6 sm:py-4">Net income</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-12 text-center text-slate-500 dark:text-slate-400 sm:px-6">
                    No data for the selected period
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.month} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="px-3 py-3 font-medium text-slate-900 dark:text-white sm:px-6 sm:py-4">{r.monthLabel}</td>
                    <td className="px-3 py-3 text-right text-slate-600 dark:text-slate-300 sm:px-6 sm:py-4">
                      ${r.ticketRevenue.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-600 dark:text-slate-300 sm:px-6 sm:py-4">
                      ${r.visaRevenue.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-600 dark:text-slate-300 sm:px-6 sm:py-4">
                      ${r.hajUmrahRevenue.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-slate-900 dark:text-white sm:px-6 sm:py-4">
                      ${r.totalRevenue.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-right text-amber-600 dark:text-amber-400 sm:px-6 sm:py-4">
                      ${r.expenses.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400 sm:px-6 sm:py-4">
                      ${r.netIncome.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-violet-50/50 dark:border-slate-700 dark:bg-violet-950/20">
                <td className="px-3 py-3 font-semibold text-slate-700 dark:text-slate-300 sm:px-6 sm:py-4" colSpan={4}>
                  Receivables (outstanding)
                </td>
                <td className="px-3 py-3 text-right font-semibold text-violet-700 dark:text-violet-300 sm:px-6 sm:py-4" colSpan={3}>
                  ${summary.totalReceivables.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
