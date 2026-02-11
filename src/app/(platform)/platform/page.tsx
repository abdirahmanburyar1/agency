import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getPlatformStats() {
  const [
    totalTenants,
    activeTenants,
    totalSubscriptions,
    activeSubscriptions,
    totalRevenue,
    recentTenants,
    expiringSubscriptions,
  ] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: "active" } }),
    prisma.subscription.count(),
    prisma.subscription.count({ where: { status: "active" } }),
    prisma.subscriptionPayment.aggregate({
      where: { status: "paid" },
      _sum: { amount: true },
    }),
    prisma.tenant.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        subdomain: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.subscription.findMany({
      where: {
        status: "active",
        currentPeriodEnd: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
        },
      },
      take: 5,
      include: {
        tenant: { select: { name: true, subdomain: true } },
        plan: { select: { displayName: true } },
      },
      orderBy: { currentPeriodEnd: "asc" },
    }),
  ]);

  return {
    totalTenants,
    activeTenants,
    totalSubscriptions,
    activeSubscriptions,
    totalRevenue: Number(totalRevenue._sum.amount || 0),
    recentTenants,
    expiringSubscriptions,
  };
}

export default async function PlatformDashboardPage() {
  const stats = await getPlatformStats();

  const statCards = [
    {
      label: "Total Tenants",
      value: stats.totalTenants,
      change: "+12%",
      trend: "up",
      icon: "🏢",
      color: "from-blue-500 to-cyan-600",
    },
    {
      label: "Active Tenants",
      value: stats.activeTenants,
      subtitle: `${Math.round((stats.activeTenants / stats.totalTenants) * 100)}% of total`,
      icon: "✅",
      color: "from-emerald-500 to-teal-600",
    },
    {
      label: "Active Subscriptions",
      value: stats.activeSubscriptions,
      subtitle: `${stats.totalSubscriptions} total`,
      icon: "💎",
      color: "from-purple-500 to-pink-600",
    },
    {
      label: "Total Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      change: "+23%",
      trend: "up",
      icon: "💰",
      color: "from-amber-500 to-orange-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Platform Dashboard
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Monitor and manage your SaaS platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  {stat.label}
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                  {stat.value}
                </p>
                {stat.subtitle && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {stat.subtitle}
                  </p>
                )}
                {stat.change && (
                  <div className="mt-2 flex items-center gap-1">
                    <span
                      className={`text-sm font-semibold ${
                        stat.trend === "up" ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {stat.change}
                    </span>
                    <span className="text-xs text-slate-500">vs last month</span>
                  </div>
                )}
              </div>
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.color} text-2xl shadow-lg`}
              >
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Tenants */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Recent Tenants
            </h2>
            <Link
              href="/platform/tenants"
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {stats.recentTenants.map((tenant) => (
              <Link
                key={tenant.id}
                href={`/platform/tenants/${tenant.id}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 p-4 transition hover:border-emerald-500 hover:bg-emerald-50 dark:border-slate-700 dark:hover:border-emerald-500 dark:hover:bg-emerald-900/10"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 text-lg font-bold text-white">
                    {tenant.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {tenant.name}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {tenant.subdomain}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    tenant.status === "active"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {tenant.status}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Expiring Subscriptions */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Expiring Soon
            </h2>
            <Link
              href="/platform/subscriptions"
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              View All →
            </Link>
          </div>
          {stats.expiringSubscriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="text-4xl mb-3">🎉</div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                No subscriptions expiring in the next 7 days
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.expiringSubscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-900/10"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {sub.tenant.name}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {sub.plan.displayName}
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-900/50 dark:text-amber-300">
                      {Math.ceil(
                        (sub.currentPeriodEnd.getTime() - Date.now()) /
                          (24 * 60 * 60 * 1000)
                      )}{" "}
                      days
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Expires: {sub.currentPeriodEnd.toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
          Quick Actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/platform/tenants?action=new"
            className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 p-6 text-center transition hover:border-emerald-500 hover:bg-emerald-50 dark:border-slate-700 dark:hover:border-emerald-500 dark:hover:bg-emerald-900/10"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl dark:bg-emerald-900/30">
              ➕
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">
                Add Tenant
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Create new organization
              </p>
            </div>
          </Link>
          <Link
            href="/platform/subscription-plans?action=new"
            className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 p-6 text-center transition hover:border-purple-500 hover:bg-purple-50 dark:border-slate-700 dark:hover:border-purple-500 dark:hover:bg-purple-900/10"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-2xl dark:bg-purple-900/30">
              💎
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">
                Create Plan
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                New pricing tier
              </p>
            </div>
          </Link>
          <Link
            href="/platform/analytics"
            className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 p-6 text-center transition hover:border-blue-500 hover:bg-blue-50 dark:border-slate-700 dark:hover:border-blue-500 dark:hover:bg-blue-900/10"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-2xl dark:bg-blue-900/30">
              📊
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">
                View Analytics
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Detailed reports
              </p>
            </div>
          </Link>
          <Link
            href="/platform/settings"
            className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-slate-300 p-6 text-center transition hover:border-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-500 dark:hover:bg-slate-800"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl dark:bg-slate-800">
              ⚙️
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">
                Settings
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Platform config
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
