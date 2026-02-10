"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Tenant = {
  id: string;
  subdomain: string;
  name: string;
  status: string;
};

export default function TenantActions({ tenant }: { tenant: Tenant }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateStatus(status: string) {
    if (!confirm(`Set tenant "${tenant.name}" to ${status}?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/platform/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) router.refresh();
      else alert("Failed to update");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-end gap-2">
      {tenant.status === "active" && (
        <button
          onClick={() => updateStatus("suspended")}
          disabled={loading}
          className="rounded-lg border border-amber-300 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/30"
        >
          Suspend
        </button>
      )}
      {tenant.status === "suspended" && (
        <button
          onClick={() => updateStatus("active")}
          disabled={loading}
          className="rounded-lg border border-emerald-300 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
        >
          Reactivate
        </button>
      )}
      {tenant.status !== "banned" && (
        <button
          onClick={() => updateStatus("banned")}
          disabled={loading}
          className="rounded-lg border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30"
        >
          Ban
        </button>
      )}
    </div>
  );
}
