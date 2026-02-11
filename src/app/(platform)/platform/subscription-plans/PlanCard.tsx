"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Plan = {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  price: number;
  billingInterval: string;
  maxUsers: number | null;
  maxStorage: number | null;
  trialDays: number | null;
  setupFee: number | null;
  features: string | null;
  isActive: boolean;
};

type Props = {
  plan: Plan;
  activeSubscriptions: number;
};

export default function PlanCard({ plan, activeSubscriptions }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Parse features from JSON string
  const features = plan.features ? JSON.parse(plan.features) : [];

  const toggleActive = async () => {
    if (
      !confirm(
        `Are you sure you want to ${plan.isActive ? "deactivate" : "activate"} this plan?`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/platform/subscription-plans/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !plan.isActive }),
      });

      if (!res.ok) throw new Error("Failed to update plan");
      router.refresh();
    } catch (error) {
      console.error("Toggle plan error:", error);
      alert("Failed to update plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border p-6 transition ${
        plan.isActive
          ? "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/50"
          : "border-slate-200 bg-slate-50 opacity-60 dark:border-slate-700 dark:bg-slate-800/30"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {plan.displayName}
          </h3>
          {plan.description && (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {plan.description}
            </p>
          )}
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            plan.isActive
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
          }`}
        >
          {plan.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="mt-6">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            ${plan.price}
          </span>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            /{plan.billingInterval}
          </span>
        </div>
        {plan.setupFee && plan.setupFee > 0 && (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Setup fee: ${plan.setupFee}
          </p>
        )}
        {plan.trialDays && plan.trialDays > 0 && (
          <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">
            {plan.trialDays} days free trial
          </p>
        )}
      </div>

      <div className="mt-6 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">Max Users</span>
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {plan.maxUsers ?? "Unlimited"}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">
            Max Storage
          </span>
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {plan.maxStorage ? `${plan.maxStorage} GB` : "Unlimited"}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">
            Active Subscriptions
          </span>
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {activeSubscriptions}
          </span>
        </div>
      </div>

      {features && features.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Features
          </p>
          <ul className="mt-3 space-y-2">
            {features.map((feature: string, idx: number) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300"
              >
                <svg
                  className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex gap-2">
        <button
          onClick={toggleActive}
          disabled={loading}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-50 ${
            plan.isActive
              ? "border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {loading ? "..." : plan.isActive ? "Deactivate" : "Activate"}
        </button>
      </div>
    </div>
  );
}
