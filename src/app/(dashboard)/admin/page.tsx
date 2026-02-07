import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PERMISSION } from "@/lib/permissions";
import Link from "next/link";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = (session.user as { permissions?: string[] }).permissions ?? [];
  const roleName = String((session.user as { roleName?: string }).roleName ?? "").trim();
  const isAdmin = roleName.toLowerCase() === "admin";

  const canViewSettings = isAdmin || perms.includes(PERMISSION.SETTINGS_VIEW);
  const canViewUsers = isAdmin || perms.includes(PERMISSION.USERS_VIEW);
  const canViewRoles = isAdmin || perms.includes(PERMISSION.ROLES_VIEW);

  const firstHref = canViewSettings
    ? "/admin/settings"
    : canViewUsers
      ? "/admin/users"
      : canViewRoles
        ? "/admin/roles"
        : "/";

  redirect(firstHref);
}
