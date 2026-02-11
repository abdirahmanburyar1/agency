import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  // Get monthly stats for the last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [tenantGrowth, revenueByMonth, subscriptionsByPlan] = await Promise.all([
    prisma.tenant.groupBy({
      by: ["createdAt"],
      where: {
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      _count: true,
    }),
    prisma.subscriptionPayment.groupBy({
      by: ["createdAt"],
      where: {
        status: "paid",
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      _sum: {
        amount: true,
      },
    }),
    prisma.subscription.groupBy({
      by: ["planId"],
      where: {
        status: "active",
      },
      _count: true,
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Analytics & Insights
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Detailed platform performance metrics
        </p>
      </div>

      {/* Coming Soon Banner */}
      <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-purple-50 to-pink-50 p-12 text-center dark:border-slate-700 dark:from-purple-900/20 dark:to-pink-900/20">
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 text-6xl">📊</div>
          <h2 className="mb-3 text-2xl font-bold text-slate-900 dark:text-white">
            Advanced Analytics Coming Soon
          </h2>
          <p className="mb-6 text-slate-600 dark:text-slate-400">
            We're building comprehensive analytics dashboards with charts, trends, and
            insights to help you make data-driven decisions.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-2 text-2xl">📈</div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Revenue Trends
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track growth over time
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-2 text-2xl">👥</div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                User Analytics
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Engagement metrics
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-2 text-2xl">🎯</div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Conversion Rates
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Trial to paid conversion
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Preview */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-600 dark:text-slate-400">New Tenants (6mo)</p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {tenantGrowth.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Revenue (6mo)
          </p>
          <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            $
            {revenueByMonth
              .reduce((sum, r) => sum + Number(r._sum.amount || 0), 0)
              .toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Active Plans
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            {subscriptionsByPlan.length}
          </p>
        </div>
      </div>
    </div>
  );
}
