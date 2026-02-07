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
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Define roles and assign permissions. Admin has all permissions by default.
          </p>
          {canCreate && <CreateRoleForm />}
        </div>

      <div className="space-y-4">
        {roles.map((role) => (
          <div
            key={role.id}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/50"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {role.name}
                </h2>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
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
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                Admin has all permissions by default.
              </p>
            )}
          </div>
        ))}
      </div>
      </div>
    </main>
  );
}
