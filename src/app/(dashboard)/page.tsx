import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getDashboard } from "@/lib/dashboard";
import { auth } from "@/auth";
import { PERMISSION } from "@/lib/permissions";
import DashboardCharts from "@/components/DashboardCharts";
import DashboardDateFilter from "@/components/DashboardDateFilter";

export const dynamic = "force-dynamic";

const NAV_ITEMS = [
  { href: "/tickets", label: "Tickets", color: "blue", icon: "🎫", perm: PERMISSION.TICKETS_VIEW },
  { href: "/visas", label: "Visas", color: "emerald", icon: "🛂", perm: PERMISSION.VISAS_VIEW },
  { href: "/haj-umrah", label: "Haj & Umrah", color: "teal", icon: "🕋", perm: PERMISSION.HAJ_UMRAH_VIEW },
  { href: "/customers", label: "Customers", color: "cyan", icon: "👥", perm: PERMISSION.CUSTOMERS_VIEW },
  { href: "/expenses", label: "Expenses", color: "amber", icon: "📋", perm: PERMISSION.EXPENSES_VIEW },
  { href: "/receivables", label: "Receivables", color: "green", icon: "💰", perm: PERMISSION.RECEIVABLES_VIEW },
  { href: "/payables", label: "Payables", color: "rose", icon: "📤", perm: PERMISSION.PAYABLES_VIEW },
  { href: "/payments", label: "Payments", color: "violet", icon: "💳", perm: PERMISSION.PAYMENTS_VIEW },
];

const STAT_ICONS: Record<string, React.ReactNode> = {
  ticket: (
    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  ),
  visa: (
    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  expense: (
    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  income: (
    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  hajUmrah: (
    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  receivable: (
    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  payable: (
    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = (session.user as { permissions?: string[] })?.permissions ?? [];
  const roleName = String((session.user as { roleName?: string })?.roleName ?? "").trim();
  const isAdmin = roleName.toLowerCase() === "admin";
  const filteredNav = NAV_ITEMS.filter(
    (item) => isAdmin || perms.length === 0 || perms.includes(item.perm)
  );

  const userName = session.user?.name || session.user?.email?.split("@")[0] || "there";
  const greeting = userName === "there" ? "Welcome back" : `Welcome back, ${userName}`;

  const params = await searchParams;
  const fromStr = params.from ?? "";
  const toStr = params.to ?? "";
  const fromDate = fromStr ? new Date(fromStr) : null;
  const toDate = toStr ? new Date(toStr) : null;
  const dateFilter =
    fromDate && toDate && !Number.isNaN(fromDate.getTime()) && !Number.isNaN(toDate.getTime()) && fromDate <= toDate
      ? { fromDate, toDate }
      : undefined;

  let dashboard: Awaited<ReturnType<typeof getDashboard>> | null = null;
  try {
    dashboard = await getDashboard(dateFilter);
  } catch {
    dashboard = null;
  }

  const now = new Date();
  const placeholderChartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      month: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      ticketRevenue: 0,
      visaRevenue: 0,
      hajUmrahRevenue: 0,
      expenses: 0,
    };
  });
  const chartData = dashboard?.chartData?.length ? dashboard.chartData : placeholderChartData;
  const stats = dashboard ?? {
    ticketRevenue: 0,
    visaRevenue: 0,
    hajUmrahRevenue: 0,
    totalExpenses: 0,
    netIncome: 0,
    totalReceivables: 0,
    totalPayables: 0,
  };

  return (
    <div className="w-full">
      {/* Date filter - applies to all cards and chart */}
      <Suspense fallback={null}>
        <DashboardDateFilter />
      </Suspense>

      {/* Hero welcome */}
      <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-8 shadow-xl shadow-emerald-500/20 dark:shadow-emerald-900/20">
        <div className="relative">
          <div className="absolute -right-4 -top-4 size-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 right-12 size-24 rounded-full bg-white/5" />
          <h1 className="relative text-2xl font-bold text-white sm:text-3xl">
            {greeting}
          </h1>
          <p className="relative mt-2 max-w-xl text-emerald-50/90">
            Here&apos;s an overview of your agency&apos;s performance.
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Ticket Revenue"
          value={stats.ticketRevenue}
          prefix="$"
          icon={STAT_ICONS.ticket}
          accent="blue"
        />
        <StatCard
          title="Visa Revenue"
          value={stats.visaRevenue}
          prefix="$"
          icon={STAT_ICONS.visa}
          accent="emerald"
        />
        <StatCard
          title="Haj & Umrah Revenue"
          value={stats.hajUmrahRevenue}
          prefix="$"
          icon={STAT_ICONS.hajUmrah}
          accent="teal"
        />
        <StatCard
          title="Total Expenses"
          value={stats.totalExpenses}
          prefix="$"
          icon={STAT_ICONS.expense}
          accent="amber"
        />
        <StatCard
          title="Net Income"
          value={stats.netIncome}
          prefix="$"
          icon={STAT_ICONS.income}
          accent="emerald"
          highlight
        />
        <StatCard
          title="Receivables"
          value={stats.totalReceivables}
          prefix="$"
          icon={STAT_ICONS.receivable}
          accent="green"
        />
        <StatCard
          title="Payables"
          value={stats.totalPayables}
          prefix="$"
          icon={STAT_ICONS.payable}
          accent="rose"
        />
      </section>

      {/* Charts - same date scope as cards above */}
      <section className="mb-10">
        <DashboardCharts
          data={chartData}
          dateRangeLabel={dashboard?.dateRangeLabel ?? "Current month"}
        />
      </section>

      {/* Quick access */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          Quick access
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg dark:border-slate-700/80 dark:bg-slate-900/80 dark:hover:border-slate-600"
            >
              <div
                className={`absolute inset-0 opacity-5 transition-opacity group-hover:opacity-10 ${
                  item.color === "blue"
                    ? "bg-blue-500"
                    : item.color === "emerald"
                    ? "bg-emerald-500"
                    : item.color === "teal"
                    ? "bg-teal-500"
                    : item.color === "cyan"
                    ? "bg-cyan-500"
                    : item.color === "amber"
                    ? "bg-amber-500"
                    : item.color === "green"
                    ? "bg-green-500"
                    : item.color === "rose"
                    ? "bg-rose-500"
                    : "bg-violet-500"
                }`}
              />
              <div className="relative flex items-center gap-4">
                <span
                  className={`flex size-14 items-center justify-center rounded-2xl text-2xl shadow-inner ${
                    item.color === "blue"
                      ? "bg-blue-100 dark:bg-blue-900/40"
                      : item.color === "emerald"
                      ? "bg-emerald-100 dark:bg-emerald-900/40"
                      : item.color === "teal"
                      ? "bg-teal-100 dark:bg-teal-900/40"
                      : item.color === "cyan"
                      ? "bg-cyan-100 dark:bg-cyan-900/40"
                      : item.color === "amber"
                      ? "bg-amber-100 dark:bg-amber-900/40"
                      : item.color === "green"
                      ? "bg-green-100 dark:bg-green-900/40"
                      : item.color === "rose"
                      ? "bg-rose-100 dark:bg-rose-900/40"
                      : "bg-violet-100 dark:bg-violet-900/40"
                  }`}
                >
                  {item.icon}
                </span>
                <span className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                  {item.label}
                </span>
                <svg
                  className="ml-auto size-5 text-slate-400 transition-all group-hover:translate-x-1 group-hover:text-emerald-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  prefix = "",
  icon,
  accent,
  highlight,
}: {
  title: string;
  value: number;
  prefix?: string;
  icon?: React.ReactNode;
  accent?: string;
  highlight?: boolean;
}) {
  const accentStyles: Record<string, string> = {
    blue: "border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20",
    emerald: "border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20",
    teal: "border-l-teal-500 bg-teal-50/50 dark:bg-teal-950/20",
    amber: "border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20",
    green: "border-l-green-500 bg-green-50/50 dark:bg-green-950/20",
    rose: "border-l-rose-500 bg-rose-50/50 dark:bg-rose-950/20",
  };
  const iconStyles: Record<string, string> = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400",
    emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400",
    teal: "bg-teal-100 text-teal-600 dark:bg-teal-900/50 dark:text-teal-400",
    amber: "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400",
    green: "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400",
    rose: "bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400",
  };
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md dark:border-slate-700/80 dark:bg-slate-900/80 ${
        highlight
          ? "border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20"
          : accent
          ? `border-l-4 ${accentStyles[accent] ?? accentStyles.blue}`
          : "border-slate-200 dark:border-slate-700"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className={`text-sm font-medium ${
              highlight ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"
            }`}
          >
            {title}
          </p>
          <p
            className={`mt-2 text-2xl font-bold tracking-tight ${
              highlight ? "text-emerald-800 dark:text-emerald-300" : "text-slate-900 dark:text-white"
            }`}
          >
            {prefix}
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
        </div>
        {icon && (
          <span
            className={`rounded-xl p-2.5 ${
              highlight
                ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400"
                : accent
                ? iconStyles[accent] ?? iconStyles.blue
                : "text-slate-400"
            }`}
          >
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}
