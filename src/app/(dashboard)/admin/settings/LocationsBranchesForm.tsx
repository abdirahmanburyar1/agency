"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Branch = {
  id: string;
  name: string;
  address: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  locationId: string;
};

type Location = {
  id: string;
  name: string;
  branches: Branch[];
};

type Props = { canEdit: boolean };

export default function LocationsBranchesForm({ canEdit }: Props) {
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [addLocLoading, setAddLocLoading] = useState(false);
  const [showAddBranch, setShowAddBranch] = useState<string | null>(null);
  const [branchForm, setBranchForm] = useState({
    name: "",
    address: "",
    email: "",
    phone: "",
    whatsapp: "",
  });
  const [addBranchLoading, setAddBranchLoading] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  useEffect(() => {
    fetch("/api/cargo/locations")
      .then((r) => r.json())
      .then((data) => setLocations(Array.isArray(data) ? data : []))
      .catch(() => setLocations([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleAddLocation(e: React.FormEvent) {
    e.preventDefault();
    if (!newLocationName.trim() || !canEdit) return;
    setAddLocLoading(true);
    try {
      const res = await fetch("/api/cargo/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newLocationName.trim() }),
      });
      if (res.ok) {
        setNewLocationName("");
        setShowAddLocation(false);
        router.refresh();
        const data = await fetch("/api/cargo/locations").then((r) => r.json());
        setLocations(Array.isArray(data) ? data : []);
      }
    } finally {
      setAddLocLoading(false);
    }
  }

  async function handleAddBranch(locationId: string, e: React.FormEvent) {
    e.preventDefault();
    if (!branchForm.name.trim() || !canEdit) return;
    setAddBranchLoading(true);
    try {
      const res = await fetch("/api/cargo/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId,
          name: branchForm.name.trim(),
          address: branchForm.address.trim() || undefined,
          email: branchForm.email.trim() || undefined,
          phone: branchForm.phone.trim() || undefined,
          whatsapp: branchForm.whatsapp.trim() || undefined,
        }),
      });
      if (res.ok) {
        setBranchForm({ name: "", address: "", email: "", phone: "", whatsapp: "" });
        setShowAddBranch(null);
        router.refresh();
        const data = await fetch("/api/cargo/locations").then((r) => r.json());
        setLocations(Array.isArray(data) ? data : []);
      }
    } finally {
      setAddBranchLoading(false);
    }
  }

  async function handleEditBranch(branch: Branch) {
    if (!canEdit) return;
    setEditingBranch(branch);
  }

  async function handleSaveBranchEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingBranch || !canEdit) return;
    setAddBranchLoading(true);
    try {
      const res = await fetch(`/api/cargo/branches/${editingBranch.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: branchForm.name.trim() || editingBranch.name,
          address: branchForm.address.trim() || null,
          email: branchForm.email.trim() || null,
          phone: branchForm.phone.trim() || null,
          whatsapp: branchForm.whatsapp.trim() || null,
        }),
      });
      if (res.ok) {
        setEditingBranch(null);
        setBranchForm({ name: "", address: "", email: "", phone: "", whatsapp: "" });
        router.refresh();
        const data = await fetch("/api/cargo/locations").then((r) => r.json());
        setLocations(Array.isArray(data) ? data : []);
      }
    } finally {
      setAddBranchLoading(false);
    }
  }

  async function handleDeleteBranch(branchId: string) {
    if (!canEdit || !confirm("Delete this branch?")) return;
    try {
      await fetch(`/api/cargo/branches/${branchId}`, { method: "DELETE" });
      router.refresh();
      const data = await fetch("/api/cargo/locations").then((r) => r.json());
      setLocations(Array.isArray(data) ? data : []);
    } catch {}
  }

  async function handleDeleteLocation(locId: string) {
    if (!canEdit || !confirm("Delete this location and all its branches?")) return;
    try {
      await fetch(`/api/cargo/locations/${locId}`, { method: "DELETE" });
      router.refresh();
      const data = await fetch("/api/cargo/locations").then((r) => r.json());
      setLocations(Array.isArray(data) ? data : []);
    } catch {}
  }

  if (loading) return <div className="text-sm text-zinc-500">Loading...</div>;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Locations & Branches</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Locations (e.g. Nairobi, Mombasa) contain branches (e.g. Westlands Branch, Eastleigh Branch) with contact details.
      </p>
      <div className="mt-4 space-y-4">
        {locations.map((loc) => (
          <div
            key={loc.id}
            className="rounded-xl border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50">
              <span className="font-semibold text-slate-900 dark:text-white">{loc.name}</span>
              {canEdit && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddBranch(showAddBranch === loc.id ? null : loc.id)}
                    className="text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400"
                  >
                    + Add branch
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteLocation(loc.id)}
                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    Remove location
                  </button>
                </div>
              )}
            </div>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {loc.branches.map((b) => (
                <li key={b.id} className="flex items-start justify-between px-3 py-2">
                  <div>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{b.name}</span>
                    {(b.address || b.phone || b.email || b.whatsapp) && (
                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        {[b.address, b.phone, b.email, b.whatsapp].filter(Boolean).join(" • ")}
                      </p>
                    )}
                  </div>
                  {canEdit && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBranch(b);
                          setBranchForm({
                            name: b.name,
                            address: b.address ?? "",
                            email: b.email ?? "",
                            phone: b.phone ?? "",
                            whatsapp: b.whatsapp ?? "",
                          });
                        }}
                        className="text-sm text-zinc-600 hover:text-zinc-800 dark:text-zinc-400"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBranch(b.id)}
                        className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {showAddBranch === loc.id && canEdit && (
              <form
                onSubmit={(e) => handleAddBranch(loc.id, e)}
                className="border-t border-zinc-100 px-3 py-3 dark:border-zinc-800"
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    type="text"
                    value={branchForm.name}
                    onChange={(e) => setBranchForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Branch name *"
                    required
                    className="rounded border px-2 py-1.5 text-sm dark:bg-zinc-800 dark:text-white"
                  />
                  <input
                    type="text"
                    value={branchForm.address}
                    onChange={(e) => setBranchForm((p) => ({ ...p, address: e.target.value }))}
                    placeholder="Address"
                    className="rounded border px-2 py-1.5 text-sm dark:bg-zinc-800 dark:text-white"
                  />
                  <input
                    type="email"
                    value={branchForm.email}
                    onChange={(e) => setBranchForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="Email"
                    className="rounded border px-2 py-1.5 text-sm dark:bg-zinc-800 dark:text-white"
                  />
                  <input
                    type="tel"
                    value={branchForm.phone}
                    onChange={(e) => setBranchForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="Phone"
                    className="rounded border px-2 py-1.5 text-sm dark:bg-zinc-800 dark:text-white"
                  />
                  <input
                    type="tel"
                    value={branchForm.whatsapp}
                    onChange={(e) => setBranchForm((p) => ({ ...p, whatsapp: e.target.value }))}
                    placeholder="WhatsApp"
                    className="rounded border px-2 py-1.5 text-sm dark:bg-zinc-800 dark:text-white"
                  />
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    type="submit"
                    disabled={addBranchLoading}
                    className="rounded bg-zinc-900 px-3 py-1.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => (setShowAddBranch(null), setBranchForm({ name: "", address: "", email: "", phone: "", whatsapp: "" }))}
                    className="rounded border px-3 py-1.5 text-sm dark:border-zinc-700 dark:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        ))}
      </div>
      {canEdit && (
        <form onSubmit={handleAddLocation} className="mt-4 flex gap-2">
          <input
            type="text"
            value={newLocationName}
            onChange={(e) => setNewLocationName(e.target.value)}
            placeholder="Add location (e.g. Nairobi, Mombasa)..."
            className="flex-1 rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
          />
          <button
            type="submit"
            disabled={addLocLoading || !newLocationName.trim()}
            className="rounded bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Add location
          </button>
        </form>
      )}

      {editingBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleSaveBranchEdit}
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
          >
            <h3 className="text-lg font-medium">Edit {editingBranch.name}</h3>
            <div className="mt-4 space-y-2">
              <input
                type="text"
                value={branchForm.name}
                onChange={(e) => setBranchForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Branch name *"
                required
                className="w-full rounded border px-3 py-2 dark:bg-zinc-800 dark:text-white"
              />
              <input
                type="text"
                value={branchForm.address}
                onChange={(e) => setBranchForm((p) => ({ ...p, address: e.target.value }))}
                placeholder="Address"
                className="w-full rounded border px-3 py-2 dark:bg-zinc-800 dark:text-white"
              />
              <input
                type="email"
                value={branchForm.email}
                onChange={(e) => setBranchForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="Email"
                className="w-full rounded border px-3 py-2 dark:bg-zinc-800 dark:text-white"
              />
              <input
                type="tel"
                value={branchForm.phone}
                onChange={(e) => setBranchForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="Phone"
                className="w-full rounded border px-3 py-2 dark:bg-zinc-800 dark:text-white"
              />
              <input
                type="tel"
                value={branchForm.whatsapp}
                onChange={(e) => setBranchForm((p) => ({ ...p, whatsapp: e.target.value }))}
                placeholder="WhatsApp"
                className="w-full rounded border px-3 py-2 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                disabled={addBranchLoading}
                className="rounded bg-zinc-900 px-4 py-2 text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => (setEditingBranch(null), setBranchForm({ name: "", address: "", email: "", phone: "", whatsapp: "" }))}
                className="rounded border px-4 py-2 dark:border-zinc-700 dark:text-white"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
