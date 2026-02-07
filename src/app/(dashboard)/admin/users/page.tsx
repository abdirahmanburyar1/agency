import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { isDbConnectionError } from "@/lib/db-safe";
import DatabaseErrorBanner from "@/components/DatabaseErrorBanner";
import CreateUserForm from "./CreateUserForm";
import UserRow from "./UserRow";

export default async function UsersPage() {
  await requirePermission(PERMISSION.USERS_VIEW, { redirectOnForbidden: true });
  const canCreate = await (await import("@/lib/permissions")).canAccess(PERMISSION.USERS_CREATE);
  const canEdit = await (await import("@/lib/permissions")).canAccess(PERMISSION.USERS_EDIT);

  const usersQuery = () =>
    prisma.user.findMany({
      include: { role: true, location: true, branch: true },
      orderBy: { createdAt: "desc" },
    });
  let users: Awaited<ReturnType<typeof usersQuery>> = [];
  try {
    users = await usersQuery();
  } catch (err) {
    if (isDbConnectionError(err)) {
      return (
        <main className="w-full py-6 sm:py-8">
          <div className="mb-6">
            <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
              ← Back
            </Link>
          </div>
          <DatabaseErrorBanner />
        </main>
      );
    }
    throw err;
  }

  return (
    <main className="w-full py-6 sm:py-8">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage user accounts, roles, and branch assignments.
          </p>
          {canCreate && <CreateUserForm />}
        </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 sm:px-6">Email</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 sm:px-6">Name</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 sm:px-6">Role</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 sm:px-6">User type</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 sm:px-6">Location / Branch</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 sm:px-6">Status</th>
              <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 sm:px-6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <UserRow key={u.id} user={u} canEdit={canEdit} />
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </main>
  );
}
