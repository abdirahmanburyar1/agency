"use client";

import { useState } from "react";
import EditUserForm from "./EditUserForm";

type User = {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  userType: string | null;
  role: { id: string; name: string };
  locationId?: string | null;
  branchId?: string | null;
  location?: { id: string; name: string } | null;
  branch?: { id: string; name: string } | null;
};

type Props = {
  user: User;
  canEdit: boolean;
};

export default function UserRow({ user, canEdit }: Props) {
  const [editing, setEditing] = useState(false);
  const isAdmin = user.role.name.toLowerCase() === "admin";

  return (
    <>
            <tr className="border-b border-zinc-100 dark:border-zinc-800">
        <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{user.email}</td>
        <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{user.name ?? "—"}</td>
        <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{user.role.name}</td>
        <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 capitalize">{user.userType ?? "—"}</td>
        <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
          {user.location && user.branch
            ? `${user.location.name} → ${user.branch.name}`
            : "—"}
        </td>
        <td className="px-4 py-3">
          <span
            className={
              user.isActive
                ? "rounded bg-green-100 px-2 py-0.5 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : "rounded bg-zinc-100 px-2 py-0.5 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            }
          >
            {user.isActive ? "Active" : "Inactive"}
          </span>
        </td>
        <td className="px-4 py-3">
          {canEdit && !isAdmin && (
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            >
              Edit
            </button>
          )}
          {isAdmin && (
            <span className="text-xs text-zinc-400 dark:text-zinc-500">—</span>
          )}
        </td>
      </tr>
      {editing && (
        <EditUserForm
          user={user}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}
