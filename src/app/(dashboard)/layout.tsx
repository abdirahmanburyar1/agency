import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PERMISSION } from "@/lib/permissions";
import { getSystemSettings } from "@/lib/system-settings";
import { getTenantIdFromSession, getTenantStatus } from "@/lib/tenant";
import DashboardShell from "@/components/DashboardShell";

const NAV_ITEMS = [
  { href: "/tickets", label: "Tickets", icon: "tickets", perm: PERMISSION.TICKETS_VIEW },
  { href: "/visas", label: "Visas", icon: "visas", perm: PERMISSION.VISAS_VIEW },
  { href: "/haj-umrah", label: "Haj & Umrah", icon: "haj_umrah", perm: PERMISSION.HAJ_UMRAH_VIEW },
  { href: "/customers", label: "Customers", icon: "customers", perm: PERMISSION.CUSTOMERS_VIEW },
  { href: "/expenses", label: "Expenses", icon: "expenses", perm: PERMISSION.EXPENSES_VIEW },
  { href: "/receivables", label: "Receivables", icon: "receivables", perm: PERMISSION.RECEIVABLES_VIEW },
  { href: "/payables", label: "Payables", icon: "payables", perm: PERMISSION.PAYABLES_VIEW },
  { href: "/payments", label: "Payments", icon: "payments", perm: PERMISSION.PAYMENTS_VIEW },
  { href: "/cargo", label: "Cargo", icon: "cargo", perm: PERMISSION.CARGO_VIEW },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const perms = (session.user as { permissions?: string[] }).permissions ?? [];
  const roleName = String((session.user as { roleName?: string }).roleName ?? "").trim();
  const isAdmin = roleName.toLowerCase() === "admin";

  if (!isAdmin && perms.includes(PERMISSION.HAJ_UMRAH_LEADER) && !perms.includes(PERMISSION.HAJ_UMRAH_VIEW)) {
    redirect("/leader");
  }

  const navItems = NAV_ITEMS.filter((item) => {
    if (isAdmin || perms.length === 0) return true;
    if (item.href === "/payments" && roleName.toLowerCase() === "cargo section") return false; // Cargo Section: no Payments main page
    if (item.perm && perms.includes(item.perm)) return true;
    if (item.href === "/cargo") {
      return perms.some((p) => p.startsWith("cargo."));
    }
    return false;
  });

  const canViewReports = isAdmin || perms.length === 0 || perms.includes(PERMISSION.REPORTS_VIEW);
  const canViewDashboard = isAdmin || perms.length === 0 || perms.includes(PERMISSION.DASHBOARD_VIEW);

  const isPlatformAdmin = (session.user as { isPlatformAdmin?: boolean }).isPlatformAdmin ?? false;
  const adminItems: { href: string; label: string }[] = [];
  if (isPlatformAdmin) {
    adminItems.push({ href: "/platform", label: "Platform" });
  }
  if (isAdmin || perms.includes(PERMISSION.SETTINGS_VIEW) || perms.includes(PERMISSION.USERS_VIEW) || perms.includes(PERMISSION.ROLES_VIEW)) {
    adminItems.push({ href: "/admin", label: "Admin" });
    if (isAdmin || perms.includes(PERMISSION.SETTINGS_VIEW)) adminItems.push({ href: "/admin/settings", label: "Settings" });
    if (isAdmin || perms.includes(PERMISSION.USERS_VIEW)) adminItems.push({ href: "/admin/users", label: "Users" });
    if (isAdmin || perms.includes(PERMISSION.ROLES_VIEW)) adminItems.push({ href: "/admin/roles", label: "Roles" });
  }

  const tenantId = getTenantIdFromSession(session);
  const tenantStatus = await getTenantStatus(tenantId);
  if (tenantStatus === "suspended" || tenantStatus === "banned") {
    redirect("/tenant-suspended");
  }
  const systemSettings = await getSystemSettings(tenantId);

  return (
    <DashboardShell
      navItems={navItems}
      adminItems={adminItems}
      showDashboard={canViewDashboard}
      showReports={canViewReports}
      homeHref={canViewDashboard ? "/" : "/cargo"}
      userEmail={session.user.email ?? ""}
      userName={session.user.name ?? null}
      roleName={roleName || "User"}
      systemName={systemSettings.systemName}
      logoUrl={systemSettings.logoUrl}
    >
      {children}
    </DashboardShell>
  );
}
