"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Location = { id: string; name: string; branches: { id: string; name: string }[] };

export default function CreateUserForm() {
  const router = useRouter();
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [roleId, setRoleId] = useState("");
  const [userType, setUserType] = useState<"officer" | "leader" | "">("officer");
  const [locationId, setLocationId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/roles")
      .then((r) => r.json())
      .then((data) => {
        setRoles(data);
        if (data[0]) setRoleId(data[0].id);
      });
  }, []);

  useEffect(() => {
    fetch("/api/cargo/locations")
      .then((r) => r.json())
      .then((data) => setLocations(Array.isArray(data) ? data : []))
      .catch(() => setLocations([]));
  }, []);

  const branches = locationId ? (locations.find((l) => l.id === locationId)?.branches ?? []) : [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (locationId && !branchId) {
      setError("Please select a branch when location is selected");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name,
          roleId,
          userType: userType || null,
          locationId: locationId || null,
          branchId: locationId ? branchId : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create user");
        return;
      }
      setOpen(false);
      setEmail("");
      setPassword("");
      setName("");
      setLocationId("");
      setBranchId("");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
      >
        Create User
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-lg font-semibold">Create User</h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
              <div>
                <label className="block text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 w-full rounded border px-3 py-2 dark:bg-zinc-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded border px-3 py-2 dark:bg-zinc-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="mt-1 w-full rounded border px-3 py-2 dark:bg-zinc-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Role</label>
                <select
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                  className="mt-1 w-full rounded border px-3 py-2 dark:bg-zinc-800 dark:text-white"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">User type</label>
                <select
                  value={userType}
                  onChange={(e) => setUserType(e.target.value as "officer" | "leader" | "")}
                  className="mt-1 w-full rounded border px-3 py-2 dark:bg-zinc-800 dark:text-white"
                >
                  <option value="officer">Officer</option>
                  <option value="leader">Leader</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Location (optional)</label>
                <select
                  value={locationId}
                  onChange={(e) => {
                    setLocationId(e.target.value);
                    setBranchId("");
                  }}
                  className="mt-1 w-full rounded border px-3 py-2 dark:bg-zinc-800 dark:text-white"
                >
                  <option value="">— No location —</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
              {locationId && (
                <div>
                  <label className="block text-sm font-medium">Branch *</label>
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    required
                    className="mt-1 w-full rounded border px-3 py-2 dark:bg-zinc-800 dark:text-white"
                  >
                    <option value="">Select branch</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                >
                  {loading ? "Creating..." : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded border px-4 py-2 dark:border-zinc-700 dark:text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
