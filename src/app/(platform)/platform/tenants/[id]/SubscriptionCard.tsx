"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SubscriptionCard({
  subscription,
  tenant,
  plans,
}: {
  subscription: any;
  tenant: any;
  plans: any[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("");

  const handleStatusChange = async (newStatus: string) => {
    if (!subscription) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/platform/subscriptions/${subscription.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        router.refresh();
        alert(`Subscription ${newStatus} successfully!`);
      } else {
        alert("Failed to update subscription");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePlan = async () => {
    if (!selectedPlanId) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/platform/subscriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: tenant.id,
          planId: selectedPlanId,
          status: "active",
        }),
      });

      if (res.ok) {
        // Mark old subscription as canceled if exists
        if (subscription) {
          await fetch(`/api/platform/subscriptions/${subscription.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "canceled" }),
          });
        }

        router.refresh();
        setShowChangePlan(false);
        alert("Plan changed successfully!");
      } else {
        alert("Failed to change plan");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      trial: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
      past_due: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
      suspended: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      canceled: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400",
    };
    return styles[status as keyof typeof styles] || styles.active;
  };

  if (!subscription) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <p className="mb-4 text-slate-600 dark:text-slate-400">No active subscription</p>
        <button
          onClick={() => setShowChangePlan(true)}
          className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
        >
          Create Subscription
        </button>

        {showChangePlan && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
            <h4 className="mb-3 font-semibold">Select Plan</h4>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="mb-3 w-full rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="">Choose a plan</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.displayName} - ${plan.price}/{plan.billingInterval}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleChangePlan}
                disabled={!selectedPlanId || loading}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create"}
              </button>
              <button
                onClick={() => setShowChangePlan(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const daysRemaining = Math.ceil(
    (new Date(subscription.currentPeriodEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{subscription.plan.displayName}</h3>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusBadge(subscription.status)}`}>
              {subscription.status}
            </span>
          </div>
          
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            ${subscription.customPrice || subscription.plan.price}
            <span className="text-lg font-normal text-slate-600 dark:text-slate-400">
              /{subscription.plan.billingInterval}
            </span>
          </p>

          <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
            {subscription.status === "trial" && subscription.trialEndDate && (
              <p>
                🎁 Trial ends: {new Date(subscription.trialEndDate).toLocaleDateString()} ({daysRemaining} days remaining)
              </p>
            )}
            <p>📅 Current period: {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</p>
            <p>🔄 Auto-renew: {subscription.autoRenew ? "Enabled" : "Disabled"}</p>
            {subscription.plan.maxUsers && <p>👥 Max users: {subscription.plan.maxUsers}</p>}
            {subscription.plan.maxStorage && <p>💾 Max storage: {subscription.plan.maxStorage}GB</p>}
          </div>

          {subscription.plan.features && (
            <div className="mt-4">
              <p className="font-semibold text-slate-900 dark:text-white">Features:</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                {JSON.parse(subscription.plan.features).map((feature: string, idx: number) => (
                  <li key={idx}>✓ {feature}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {subscription.status === "trial" && (
            <button
              onClick={() => handleStatusChange("active")}
              disabled={loading}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Activate Now
            </button>
          )}
          {subscription.status === "active" && (
            <button
              onClick={() => handleStatusChange("suspended")}
              disabled={loading}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
            >
              Suspend
            </button>
          )}
          {subscription.status === "suspended" && (
            <button
              onClick={() => handleStatusChange("active")}
              disabled={loading}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Reactivate
            </button>
          )}
          <button
            onClick={() => setShowChangePlan(!showChangePlan)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-700"
          >
            Change Plan
          </button>
        </div>
      </div>

      {showChangePlan && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
          <h4 className="mb-3 font-semibold">Select New Plan</h4>
          <select
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
            className="mb-3 w-full rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">Choose a plan</option>
            {plans
              .filter((p) => p.id !== subscription.planId)
              .map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.displayName} - ${plan.price}/{plan.billingInterval}
                </option>
              ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleChangePlan}
              disabled={!selectedPlanId || loading}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? "Changing..." : "Change Plan"}
            </button>
            <button
              onClick={() => setShowChangePlan(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
