import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import RolePermissionsForm from "./RolePermissionsForm";
import CreateRoleForm from "./CreateRoleForm";

export default async function RolesPage() {
  await requirePermission(PERMISSION.ROLES_VIEW, { redirectOnForbidden: true });
  const canCreate = await (await import("@/lib/permissions")).canAccess(PERMISSION.ROLES_CREATE);

  const roles = await prisma.role.findMany({
    include: {
      permissions: { include: { permission: true } },
      _count: { select: { users: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <main className="w-full py-6 sm:py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
          ← Back
        </Link>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Roles & Permissions</h1>
      </div>

      {canCreate && <CreateRoleForm />}

      <div className="mt-6 space-y-6">
        {roles.map((role) => (
          <div
            key={role.id}
            className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-zinc-900 dark:text-white">
                  {role.name}
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {role.description ?? `${role._count.users} user(s)`}
                </p>
              </div>
              {role.name !== "Admin" && (
                <RolePermissionsForm
                  roleId={role.id}
                  roleName={role.name}
                  currentPermissions={role.permissions.map((rp) => rp.permission.code)}
                />
              )}
            </div>
            {role.name === "Admin" && (
              <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
                Admin has all permissions by default.
              </p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
