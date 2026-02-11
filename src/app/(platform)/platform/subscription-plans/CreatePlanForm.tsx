"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreatePlanForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    description: "",
    price: "",
    billingInterval: "monthly",
    maxUsers: "",
    maxStorage: "",
    trialDays: "",
    setupFee: "",
    features: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Parse features from comma-separated string
      const featuresArray = formData.features
        .split(",")
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      const payload = {
        name: formData.name,
        displayName: formData.displayName || formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        billingInterval: formData.billingInterval,
        maxUsers: formData.maxUsers ? parseInt(formData.maxUsers) : null,
        maxStorage: formData.maxStorage ? parseInt(formData.maxStorage) : null,
        trialDays: formData.trialDays ? parseInt(formData.trialDays) : 0,
        setupFee: formData.setupFee ? parseFloat(formData.setupFee) : 0,
        features: featuresArray.length > 0 ? JSON.stringify(featuresArray) : null,
      };

      const res = await fetch("/api/platform/subscription-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create plan");
      }

      setFormData({
        name: "",
        displayName: "",
        description: "",
        price: "",
        billingInterval: "monthly",
        maxUsers: "",
        maxStorage: "",
        trialDays: "",
        setupFee: "",
        features: "",
      });
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Create plan error:", error);
      alert(error instanceof Error ? error.message : "Failed to create plan");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
      >
        + Create Plan
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Create Subscription Plan
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Define a new pricing tier for your clients
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Plan Name (Internal) *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., starter, pro, enterprise"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Display Name *
              </label>
              <input
                type="text"
                required
                value={formData.displayName}
                onChange={(e) =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
                placeholder="e.g., Starter Plan, Professional"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of this plan"
                rows={2}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                placeholder="49.99"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Billing Interval *
              </label>
              <select
                value={formData.billingInterval}
                onChange={(e) =>
                  setFormData({ ...formData, billingInterval: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Max Users
              </label>
              <input
                type="number"
                value={formData.maxUsers}
                onChange={(e) =>
                  setFormData({ ...formData, maxUsers: e.target.value })
                }
                placeholder="10 (leave empty for unlimited)"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Max Storage (GB)
              </label>
              <input
                type="number"
                value={formData.maxStorage}
                onChange={(e) =>
                  setFormData({ ...formData, maxStorage: e.target.value })
                }
                placeholder="100 (leave empty for unlimited)"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Trial Days
              </label>
              <input
                type="number"
                value={formData.trialDays}
                onChange={(e) =>
                  setFormData({ ...formData, trialDays: e.target.value })
                }
                placeholder="14"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Setup Fee ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.setupFee}
                onChange={(e) =>
                  setFormData({ ...formData, setupFee: e.target.value })
                }
                placeholder="0.00"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Features (comma-separated)
              </label>
              <textarea
                value={formData.features}
                onChange={(e) =>
                  setFormData({ ...formData, features: e.target.value })
                }
                placeholder="Email support, Basic reporting, Custom branding"
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
              <p className="mt-1 text-xs text-slate-500">
                Separate each feature with a comma
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Plan"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
