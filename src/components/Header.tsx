import Link from "next/link";
import { auth } from "@/auth";
import { SignOutButton } from "./SignOutButton";
import { PERMISSION } from "@/lib/permissions";

const nav = [
  { href: "/tickets", label: "Tickets", color: "bg-blue-500", perm: PERMISSION.TICKETS_VIEW },
  { href: "/visas", label: "Visas", color: "bg-emerald-500", perm: PERMISSION.VISAS_VIEW },
  { href: "/customers", label: "Customers", color: "bg-cyan-500", perm: PERMISSION.CUSTOMERS_VIEW },
  { href: "/expenses", label: "Expenses", color: "bg-amber-500", perm: PERMISSION.EXPENSES_VIEW },
  { href: "/receivables", label: "Receivables", color: "bg-green-600", perm: PERMISSION.RECEIVABLES_VIEW },
  { href: "/payables", label: "Payables", color: "bg-red-600", perm: PERMISSION.PAYABLES_VIEW },
  { href: "/payments", label: "Payments", color: "bg-purple-600", perm: PERMISSION.PAYMENTS_VIEW },
];

export async function Header() {
  const session = await auth();
  if (!session?.user) return null;

  const user = session.user as { roleName?: string };
  const perms = (session.user as { permissions?: string[] }).permissions ?? [];
  const isAdmin = user.roleName === "Admin";

  const links = nav.filter((item) => isAdmin || perms.includes(item.perm));
  const canManageUsers = isAdmin || perms.includes(PERMISSION.USERS_VIEW);
  const canManageRoles = isAdmin || perms.includes(PERMISSION.ROLES_VIEW);
  const canManageSettings = isAdmin || perms.includes(PERMISSION.SETTINGS_VIEW);

  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-4 print:hidden dark:border-zinc-800 dark:bg-zinc-950 sm:px-6">
      <div className="mx-auto flex w-full max-w-[1920px] items-center justify-between">
        <div>
          <Link href="/" className="text-xl font-semibold text-zinc-900 dark:text-white">
            Daybah Travel Agency
          </Link>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {user.roleName} · {session.user.email}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {(canManageUsers || canManageRoles || canManageSettings) && (
            <div className="flex gap-2">
              {canManageSettings && (
                <Link
                  href="/admin/settings"
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Settings
                </Link>
              )}
              {canManageUsers && (
                <Link
                  href="/admin/users"
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Users
                </Link>
              )}
              {canManageRoles && (
                <Link
                  href="/admin/roles"
                  className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Roles
                </Link>
              )}
            </div>
          )}
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
