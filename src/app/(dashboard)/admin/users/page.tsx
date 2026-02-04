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
      include: { role: true },
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
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
          ← Back
        </Link>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Users</h1>
      </div>

      {canCreate && <CreateUserForm />}

      <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
              <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">Email</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">Name</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">Role</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">User type</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">Status</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <UserRow key={u.id} user={u} canEdit={canEdit} />
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
