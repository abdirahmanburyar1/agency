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
} from "recharts";

type ChartPoint = {
  month: string;
  ticketRevenue: number;
  visaRevenue: number;
  hajUmrahRevenue?: number;
  expenses: number;
  totalRevenue?: number;
};

export default function DashboardCharts({
  data,
  dateRangeLabel = "Current month",
}: {
  data: ChartPoint[];
  dateRangeLabel?: string;
}) {
  const chartData = data.map((d) => ({
    ...d,
    hajUmrahRevenue: d.hajUmrahRevenue ?? 0,
    totalRevenue: (d.ticketRevenue ?? 0) + (d.visaRevenue ?? 0) + (d.hajUmrahRevenue ?? 0),
  }));

  const renderBarTooltip = ({ active, payload, label }: { active?: boolean; payload?: readonly { name?: string; value?: number; color?: string }[]; label?: string | number }) => {
    if (!active || !payload?.length || label == null) return null;
    const labelStr = String(label);
    const totalRev = (payload.find((p) => p.name === "Tickets")?.value ?? 0) + (payload.find((p) => p.name === "Visas")?.value ?? 0) + (payload.find((p) => p.name === "Haj & Umrah")?.value ?? 0);
    const expenses = payload.find((p) => p.name === "Expenses")?.value ?? 0;
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-900">
        <p className="mb-2 font-semibold text-slate-800 dark:text-slate-200">{labelStr}</p>
        <div className="space-y-1 text-sm">
          <p className="flex justify-between gap-4"><span className="text-slate-600 dark:text-slate-400">Tickets</span><span className="font-medium">${(payload.find((p) => p.name === "Tickets")?.value ?? 0).toLocaleString()}</span></p>
          <p className="flex justify-between gap-4"><span className="text-slate-600 dark:text-slate-400">Visas</span><span className="font-medium">${(payload.find((p) => p.name === "Visas")?.value ?? 0).toLocaleString()}</span></p>
          <p className="flex justify-between gap-4"><span className="text-slate-600 dark:text-slate-400">Haj & Umrah</span><span className="font-medium">${(payload.find((p) => p.name === "Haj & Umrah")?.value ?? 0).toLocaleString()}</span></p>
          <p className="border-t border-slate-200 pt-2 font-medium text-slate-800 dark:border-slate-700 dark:text-slate-200">Total revenue: ${totalRev.toLocaleString()}</p>
          <p className="flex justify-between gap-4"><span className="text-slate-600 dark:text-slate-400">Expenses</span><span className="font-medium text-amber-600 dark:text-amber-400">${expenses.toLocaleString()}</span></p>
          <p className="border-t border-slate-200 pt-2 font-medium text-slate-800 dark:text-slate-200">Income (revenue − expenses): ${(totalRev - expenses).toLocaleString()}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80">
        <h3 className="mb-1 text-base font-semibold text-slate-800 dark:text-slate-200">
          Revenue vs Expenses
        </h3>
        <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
          {dateRangeLabel}
        </p>
        <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Each month shows four bars: <strong>Tickets</strong> (blue), <strong>Visas</strong> (green), <strong>Haj &amp; Umrah</strong> (teal) = money in; <strong>Expenses</strong> (orange) = money out. Hover a month to see exact amounts and that month&apos;s income.
        </p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis
                dataKey="month"
                tick={{ fill: "currentColor", fontSize: 12 }}
                axisLine={{ stroke: "rgb(226 232 240)" }}
              />
              <YAxis
                tick={{ fill: "currentColor", fontSize: 12 }}
                tickFormatter={(v) => `$${v}`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={renderBarTooltip}
              />
              <Legend
                wrapperStyle={{ paddingTop: 16 }}
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span className="text-sm text-slate-600 dark:text-slate-400">{value}</span>}
              />
              <Bar dataKey="ticketRevenue" name="Tickets" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              <Bar dataKey="visaRevenue" name="Visas" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar dataKey="hajUmrahRevenue" name="Haj & Umrah" fill="#14b8a6" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80">
        <h3 className="mb-2 text-base font-semibold text-slate-800 dark:text-slate-200">
          Total Revenue Trend
        </h3>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          Monthly revenue over time
        </p>
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
              <XAxis
                dataKey="month"
                tick={{ fill: "currentColor", fontSize: 12 }}
                axisLine={{ stroke: "rgb(226 232 240)" }}
              />
              <YAxis
                tick={{ fill: "currentColor", fontSize: 12 }}
                tickFormatter={(v) => `$${v}`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number | undefined) => [`$${(value ?? 0).toLocaleString()}`, "Revenue"]}
                contentStyle={{
                  backgroundColor: "rgb(255 255 255)",
                  border: "1px solid rgb(226 232 240)",
                  borderRadius: "12px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  padding: "12px 16px",
                }}
              />
              <Area
                type="monotone"
                dataKey="totalRevenue"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
