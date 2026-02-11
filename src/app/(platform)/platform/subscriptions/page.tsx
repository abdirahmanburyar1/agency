import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SubscriptionsPage() {
  const subscriptions = await prisma.subscription.findMany({
    include: {
      tenant: { select: { name: true, subdomain: true, status: true } },
      plan: { select: { displayName: true, price: true, billingInterval: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const statusColors = {
    active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    trial: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    expired: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    cancelled: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Subscriptions
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Manage all active and inactive subscriptions
          </p>
        </div>
        <div className="flex gap-3">
          <button className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
            Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Active", count: subscriptions.filter((s) => s.status === "active").length, color: "emerald" },
          { label: "Trial", count: subscriptions.filter((s) => s.status === "trial").length, color: "blue" },
          { label: "Expired", count: subscriptions.filter((s) => s.status === "expired").length, color: "red" },
          { label: "Cancelled", count: subscriptions.filter((s) => s.status === "cancelled").length, color: "slate" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <p className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
              {stat.count}
            </p>
          </div>
        ))}
      </div>

      {/* Subscriptions Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Tenant
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Plan
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Period End
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Amount
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {subscriptions.map((sub) => (
                <tr
                  key={sub.id}
                  className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {sub.tenant.name}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {sub.tenant.subdomain}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {sub.plan.displayName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      ${Number(sub.plan.price)}/{sub.plan.billingInterval}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        statusColors[sub.status as keyof typeof statusColors] ||
                        statusColors.pending
                      }`}
                    >
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {sub.currentPeriodEnd.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                    ${Number(sub.plan.price)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/platform/tenants/${sub.tenantId}`}
                      className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
