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

  if (roleName.toLowerCase() === "cargo section") {
    redirect("/cargo");
  }
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
  const summary = dashboard
    ? {
        totalRevenue: dashboard.totalRevenue,
        totalExpenses: dashboard.totalExpenses,
        netIncome: dashboard.netIncome,
        totalReceivables: dashboard.totalReceivables,
        totalPayables: dashboard.totalPayables,
      }
    : undefined;

  return (
    <div className="w-full">
      <Suspense fallback={null}>
        <DashboardDateFilter />
      </Suspense>

      <header className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
          {greeting}
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Overview of your agency&apos;s performance.
        </p>
      </header>

      <section className="mb-10">
        <DashboardCharts
          data={chartData}
          summary={summary}
          dateRangeLabel={dashboard?.dateRangeLabel ?? "Current month"}
        />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          Quick access
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-4 rounded-xl border border-slate-200/80 bg-white px-5 py-4 shadow-sm transition hover:border-slate-300 hover:shadow dark:border-slate-700/80 dark:bg-slate-900/80 dark:hover:border-slate-600"
            >
              <span
                className={`flex size-12 shrink-0 items-center justify-center rounded-xl text-xl ${
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
              <span className="font-medium text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                {item.label}
              </span>
              <svg
                className="ml-auto size-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-emerald-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
