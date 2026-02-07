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
            <tr className="border-b border-slate-100 transition hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/30">
        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 sm:px-6">{user.email}</td>
        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 sm:px-6">{user.name ?? "—"}</td>
        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 sm:px-6">{user.role.name}</td>
        <td className="px-4 py-3 text-slate-700 capitalize dark:text-slate-300 sm:px-6">{user.userType ?? "—"}</td>
        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 sm:px-6">
          {user.location && user.branch
            ? `${user.location.name} → ${user.branch.name}`
            : "—"}
        </td>
        <td className="px-4 py-3 sm:px-6">
          <span
            className={
              user.isActive
                ? "inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                : "inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            }
          >
            {user.isActive ? "Active" : "Inactive"}
          </span>
        </td>
        <td className="px-4 py-3">
          {canEdit && !isAdmin && (
            <button
              onClick={() => setEditing(true)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Edit
            </button>
          )}
          {isAdmin && (
            <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
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
