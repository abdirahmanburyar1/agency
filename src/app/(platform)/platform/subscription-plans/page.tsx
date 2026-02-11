import { prisma } from "@/lib/db";
import CreatePlanForm from "./CreatePlanForm";
import PlanCard from "./PlanCard";

export default async function SubscriptionPlansPage() {
  const plans = await prisma.subscriptionPlan.findMany({
    include: {
      _count: {
        select: {
          subscriptions: true,
        },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <main className="w-full py-6 sm:py-8">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Subscription Plans
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manage subscription plans and pricing tiers for your clients
            </p>
          </div>
          <CreatePlanForm />
        </div>

        {plans.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center dark:border-slate-700 dark:bg-slate-900/50">
            <p className="text-slate-600 dark:text-slate-400">
              No subscription plans yet. Create your first plan to get started.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={{
                  ...plan,
                  price: Number(plan.price),
                  setupFee: plan.setupFee ? Number(plan.setupFee) : null,
                }}
                activeSubscriptions={plan._count.subscriptions}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
