"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RolePermissionsForm({
  roleId,
  roleName,
  currentPermissions,
}: {
  roleId: string;
  roleName: string;
  currentPermissions: string[];
}) {
  const router = useRouter();
  const [perms, setPerms] = useState<{ id: string; code: string; name: string; resource: string }[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set(currentPermissions));
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/permissions")
      .then((r) => r.json())
      .then((data) => {
        setPerms(data);
        setSelected(new Set(currentPermissions));
      });
  }, [currentPermissions]);

  async function handleSave() {
    setLoading(true);
    try {
      await fetch("/api/roles/" + roleId + "/permissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionCodes: Array.from(selected) }),
      });
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  function toggle(code: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  const byResource = perms.reduce((acc, p) => {
    if (!acc[p.resource]) acc[p.resource] = [];
    acc[p.resource].push(p);
    return acc;
  }, {} as Record<string, typeof perms>);

  const resourceLabel: Record<string, string> = {
    haj_umrah: "Haj & Umrah",
    dashboard: "Dashboard",
    tickets: "Tickets",
    visas: "Visas",
    expenses: "Expenses",
    receivables: "Receivables",
    payables: "Payables",
    payments: "Payments",
    users: "Users",
    roles: "Roles",
    documents: "Documents",
    settings: "Settings",
    customers: "Customers",
    cargo: "Cargo",
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        Edit Permissions
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-lg font-semibold">Permissions for {roleName}</h2>
            <div className="mt-4 space-y-4 max-h-96 overflow-auto">
              {Object.entries(byResource).map(([resource, items]) => (
                <div key={resource}>
                  <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {resourceLabel[resource] ?? resource.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {items.map((p) => (
                      <label
                        key={p.id}
                        className="flex cursor-pointer items-center gap-2 rounded border px-2 py-1 text-sm dark:border-zinc-700"
                      >
                        <input
                          type="checkbox"
                          checked={selected.has(p.code)}
                          onChange={() => toggle(p.code)}
                        />
                        {p.name}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={handleSave}
                disabled={loading}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600"
              >
                {loading ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded border px-4 py-2 dark:border-zinc-700 dark:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
