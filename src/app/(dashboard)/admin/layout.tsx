import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PERMISSION } from "@/lib/permissions";
import AdminTabs from "@/components/AdminTabs";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = (session.user as { permissions?: string[] }).permissions ?? [];
  const roleName = String((session.user as { roleName?: string }).roleName ?? "").trim();
  const isAdmin = roleName.toLowerCase() === "admin";

  const canViewSettings = isAdmin || perms.includes(PERMISSION.SETTINGS_VIEW);
  const canViewUsers = isAdmin || perms.includes(PERMISSION.USERS_VIEW);
  const canViewRoles = isAdmin || perms.includes(PERMISSION.ROLES_VIEW);

  if (!canViewSettings && !canViewUsers && !canViewRoles) {
    redirect("/");
  }

  const tabs = [
    ...(canViewSettings ? [{ href: "/admin/settings", label: "Application Settings" }] : []),
    ...(canViewUsers ? [{ href: "/admin/users", label: "Users" }] : []),
    ...(canViewRoles ? [{ href: "/admin/roles", label: "Roles & Permissions" }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/"
            className="text-sm text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            ← Dashboard
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
            Administration
          </h1>
        </div>
        <AdminTabs tabs={tabs} />
      </div>
      {children}
    </div>
  );
}
