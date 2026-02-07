"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type ChartPoint = {
  month: string;
  ticketRevenue: number;
  visaRevenue: number;
  hajUmrahRevenue?: number;
  expenses: number;
  totalRevenue?: number;
  netIncome?: number;
};

type SummaryStats = {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  totalReceivables: number;
  totalPayables: number;
};

const PIE_COLORS = ["#3b82f6", "#10b981", "#14b8a6"];

export default function DashboardCharts({
  data,
  summary,
  dateRangeLabel = "Current month",
}: {
  data: ChartPoint[];
  summary?: SummaryStats;
  dateRangeLabel?: string;
}) {
  const chartData = data.map((d) => ({
    ...d,
    hajUmrahRevenue: d.hajUmrahRevenue ?? 0,
    totalRevenue: (d.ticketRevenue ?? 0) + (d.visaRevenue ?? 0) + (d.hajUmrahRevenue ?? 0),
    netIncome: (d.ticketRevenue ?? 0) + (d.visaRevenue ?? 0) + (d.hajUmrahRevenue ?? 0) - (d.expenses ?? 0),
  }));

  const pieData = [
    { name: "Tickets", value: chartData.reduce((s, d) => s + (d.ticketRevenue ?? 0), 0) },
    { name: "Visas", value: chartData.reduce((s, d) => s + (d.visaRevenue ?? 0), 0) },
    { name: "Haj & Umrah", value: chartData.reduce((s, d) => s + (d.hajUmrahRevenue ?? 0), 0) },
  ].filter((x) => x.value > 0);

  const renderBarTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: readonly { name?: string; value?: number; color?: string }[];
    label?: string | number;
  }) => {
    if (!active || !payload?.length || label == null) return null;
    const totalRev =
      (payload.find((p) => p.name === "Tickets")?.value ?? 0) +
      (payload.find((p) => p.name === "Visas")?.value ?? 0) +
      (payload.find((p) => p.name === "Haj & Umrah")?.value ?? 0);
    const expenses = payload.find((p) => p.name === "Expenses")?.value ?? 0;
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-900">
        <p className="mb-2 font-semibold text-slate-800 dark:text-slate-200">{String(label)}</p>
        <div className="space-y-1 text-sm">
          <p className="flex justify-between gap-4">
            <span className="text-slate-600 dark:text-slate-400">Tickets</span>
            <span className="font-medium">${(payload.find((p) => p.name === "Tickets")?.value ?? 0).toLocaleString()}</span>
          </p>
          <p className="flex justify-between gap-4">
            <span className="text-slate-600 dark:text-slate-400">Visas</span>
            <span className="font-medium">${(payload.find((p) => p.name === "Visas")?.value ?? 0).toLocaleString()}</span>
          </p>
          <p className="flex justify-between gap-4">
            <span className="text-slate-600 dark:text-slate-400">Haj & Umrah</span>
            <span className="font-medium">${(payload.find((p) => p.name === "Haj & Umrah")?.value ?? 0).toLocaleString()}</span>
          </p>
          <p className="border-t border-slate-200 pt-2 font-medium dark:border-slate-700">
            Revenue: ${totalRev.toLocaleString()}
          </p>
          <p className="flex justify-between gap-4">
            <span className="text-slate-600 dark:text-slate-400">Expenses</span>
            <span className="font-medium text-amber-600 dark:text-amber-400">${expenses.toLocaleString()}</span>
          </p>
          <p className="border-t border-slate-200 pt-2 font-medium">
            Net: ${(totalRev - expenses).toLocaleString()}
          </p>
        </div>
      </div>
    );
  };

  const formatCurrency = (v: number | undefined) => `$${(v ?? 0).toLocaleString()}`;

  return (
    <div className="space-y-8">
      {/* Revenue vs Expenses */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              Revenue vs Expenses
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{dateRangeLabel}</p>
          </div>
          {summary && (
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="text-slate-600 dark:text-slate-400">
                Revenue: <strong className="text-slate-900 dark:text-white">{formatCurrency(summary.totalRevenue)}</strong>
              </span>
              <span className="text-slate-600 dark:text-slate-400">
                Expenses: <strong className="text-amber-600 dark:text-amber-400">{formatCurrency(summary.totalExpenses)}</strong>
              </span>
              <span className="text-slate-600 dark:text-slate-400">
                Net: <strong className={summary.netIncome >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>{formatCurrency(summary.netIncome)}</strong>
              </span>
            </div>
          )}
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis dataKey="month" tick={{ fill: "currentColor", fontSize: 12 }} />
              <YAxis tick={{ fill: "currentColor", fontSize: 12 }} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
              <Tooltip content={renderBarTooltip} />
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-sm text-slate-600 dark:text-slate-400">{v}</span>} />
              <Bar dataKey="ticketRevenue" name="Tickets" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="visaRevenue" name="Visas" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="hajUmrahRevenue" name="Haj & Umrah" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Net Income Trend */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80">
          <h3 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-200">
            Net Income by Month
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNetIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis dataKey="month" tick={{ fill: "currentColor", fontSize: 12 }} />
                <YAxis tick={{ fill: "currentColor", fontSize: 12 }} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number | undefined) => [formatCurrency(v ?? 0), "Net Income"]} contentStyle={{ borderRadius: 12 }} />
                <Area type="monotone" dataKey="netIncome" stroke="#10b981" strokeWidth={2} fill="url(#colorNetIncome)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Composition (Pie) or Receivables vs Payables */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80">
          {pieData.length > 0 ? (
            <>
              <h3 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-200">
                Revenue Composition
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number | undefined) => formatCurrency(v ?? 0)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <>
              <h3 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-200">
                Balance Overview
              </h3>
              <div className="h-64 flex items-center justify-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">No revenue data in this period</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Receivables vs Payables - only if we have summary */}
      {summary && (summary.totalReceivables > 0 || summary.totalPayables > 0) && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80">
          <h3 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-200">
            Receivables vs Payables
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: "Receivables", value: summary.totalReceivables, fill: "#22c55e" },
                  { name: "Payables", value: summary.totalPayables, fill: "#f43f5e" },
                ]}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 80, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis type="number" tickFormatter={(v) => `$${v}`} tick={{ fill: "currentColor", fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: "currentColor", fontSize: 12 }} width={70} />
                <Tooltip formatter={(v: number | undefined) => formatCurrency(v ?? 0)} contentStyle={{ borderRadius: 12 }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Total Revenue Trend - full width */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80">
        <h3 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-200">
          Total Revenue Trend
        </h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis dataKey="month" tick={{ fill: "currentColor", fontSize: 12 }} />
              <YAxis tick={{ fill: "currentColor", fontSize: 12 }} tickFormatter={(v) => `$${v}`} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number | undefined) => [formatCurrency(v ?? 0), "Revenue"]} contentStyle={{ borderRadius: 12 }} />
              <Area type="monotone" dataKey="totalRevenue" stroke="#10b981" strokeWidth={2.5} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
