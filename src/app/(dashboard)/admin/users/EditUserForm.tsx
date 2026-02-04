"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  userType: string | null;
  role: { id: string; name: string };
};

type Props = {
  user: User;
  onClose: () => void;
};

export default function EditUserForm({ user, onClose }: Props) {
  const router = useRouter();
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [name, setName] = useState(user.name ?? "");
  const [roleId, setRoleId] = useState(user.role.id);
  const [userType, setUserType] = useState<"officer" | "leader" | "">(
    user.userType === "leader" ? "leader" : "officer"
  );
  const [isActive, setIsActive] = useState(user.isActive);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/roles")
      .then((r) => r.json())
      .then((data) => {
        setRoles(data.filter((r: { name: string }) => r.name.toLowerCase() !== "admin"));
        setRoleId(user.role.id);
      });
  }, [user.role.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body: { name: string; roleId: string; isActive: boolean; password?: string } = {
        name,
        roleId,
        isActive,
      };
      if (password.length >= 8) body.password = password;

      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to update user");
        return;
      }
      onClose();
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold">Edit User</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{user.email}</p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
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
              onChange={(e) => setUserType(e.target.value as "officer" | "leader")}
              className="mt-1 w-full rounded border px-3 py-2 dark:bg-zinc-800 dark:text-white"
            >
              <option value="officer">Officer</option>
              <option value="leader">Leader</option>
            </select>
          </div>
          <div>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <span className="text-sm font-medium">Active</span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium">New Password (optional)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current"
              minLength={8}
              className="mt-1 w-full rounded border px-3 py-2 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-zinc-900 px-4 py-2 text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded border px-4 py-2 dark:border-zinc-700 dark:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
