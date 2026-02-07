import { redirect } from "next/navigation";
import { auth } from "@/auth";

export const PERMISSION = {
  DASHBOARD_VIEW: "dashboard.view",
  REPORTS_VIEW: "reports.view",
  TICKETS_VIEW: "tickets.view",
  TICKETS_CREATE: "tickets.create",
  TICKETS_EDIT: "tickets.edit",
  TICKETS_DELETE: "tickets.delete",
  VISAS_VIEW: "visas.view",
  VISAS_CREATE: "visas.create",
  VISAS_EDIT: "visas.edit",
  VISAS_DELETE: "visas.delete",
  EXPENSES_VIEW: "expenses.view",
  EXPENSES_CREATE: "expenses.create",
  EXPENSES_EDIT: "expenses.edit",
  EXPENSES_DELETE: "expenses.delete",
  EXPENSES_APPROVE: "expenses.approve",
  EXPENSES_PAID: "expenses.paid", // Finance: mark expense as paid
  RECEIVABLES_VIEW: "receivables.view",
  RECEIVABLES_CREATE: "receivables.create",
  RECEIVABLES_EDIT: "receivables.edit",
  RECEIVABLES_DELETE: "receivables.delete",
  PAYABLES_VIEW: "payables.view",
  PAYABLES_CREATE: "payables.create",
  PAYABLES_EDIT: "payables.edit",
  PAYABLES_APPROVE: "payables.approve",
  PAYABLES_DELETE: "payables.delete",
  PAYMENTS_VIEW: "payments.view",
  PAYMENTS_CREATE: "payments.create",
  PAYMENTS_EDIT: "payments.edit",
  PAYMENTS_DELETE: "payments.delete",
  USERS_VIEW: "users.view",
  USERS_CREATE: "users.create",
  USERS_EDIT: "users.edit",
  USERS_DELETE: "users.delete",
  ROLES_VIEW: "roles.view",
  ROLES_CREATE: "roles.create",
  ROLES_EDIT: "roles.edit",
  ROLES_DELETE: "roles.delete",
  DOCUMENTS_VIEW: "documents.view",
  DOCUMENTS_UPLOAD: "documents.upload",
  DOCUMENTS_DELETE: "documents.delete",
  SETTINGS_VIEW: "settings.view",
  SETTINGS_EDIT: "settings.edit",
  CUSTOMERS_VIEW: "customers.view",
  CUSTOMERS_CREATE: "customers.create",
  CUSTOMERS_EDIT: "customers.edit",
  CUSTOMERS_DELETE: "customers.delete",
  HAJ_UMRAH_VIEW: "haj_umrah.view",
  HAJ_UMRAH_CREATE: "haj_umrah.create",
  HAJ_UMRAH_EDIT: "haj_umrah.edit",
  HAJ_UMRAH_DELETE: "haj_umrah.delete",
  HAJ_UMRAH_LEADER: "haj_umrah.leader", // Campaign leader: see only campaigns where they are assigned as leader (no sidebar/dashboard)
  CARGO_VIEW: "cargo.view",
  CARGO_VIEW_ALL: "cargo.view_all", // See all shipments; without this, user sees only shipments in their location
  CARGO_CREATE: "cargo.create",
  CARGO_EDIT: "cargo.edit",
  CARGO_DELETE: "cargo.delete",
} as const;

export type PermissionCode = (typeof PERMISSION)[keyof typeof PERMISSION];

// Permissions to allow when JWT has no permissions (stale JWT / Admin created before RBAC)
const STALE_JWT_ALLOWED: PermissionCode[] = [
  PERMISSION.DASHBOARD_VIEW,
  PERMISSION.REPORTS_VIEW,
  PERMISSION.SETTINGS_VIEW,
  PERMISSION.SETTINGS_EDIT,
  PERMISSION.USERS_VIEW,
  PERMISSION.USERS_CREATE,
  PERMISSION.USERS_EDIT,
  PERMISSION.ROLES_VIEW,
  PERMISSION.ROLES_CREATE,
  PERMISSION.ROLES_EDIT,
  PERMISSION.TICKETS_VIEW,
  PERMISSION.TICKETS_CREATE,
  PERMISSION.CUSTOMERS_VIEW,
  PERMISSION.CUSTOMERS_CREATE,
  PERMISSION.CUSTOMERS_EDIT,
  PERMISSION.HAJ_UMRAH_VIEW,
  PERMISSION.HAJ_UMRAH_CREATE,
  PERMISSION.HAJ_UMRAH_EDIT,
  PERMISSION.HAJ_UMRAH_DELETE,
  PERMISSION.HAJ_UMRAH_LEADER,
  PERMISSION.CARGO_VIEW,
  PERMISSION.CARGO_VIEW_ALL,
  PERMISSION.CARGO_CREATE,
  PERMISSION.CARGO_EDIT,
  PERMISSION.DOCUMENTS_VIEW,
  PERMISSION.DOCUMENTS_UPLOAD,
  PERMISSION.DOCUMENTS_DELETE,
];

export function hasPermission(userPermissions: string[] | undefined, code: string): boolean {
  if (!userPermissions) return false;
  // Admin has all permissions (checked by role name)
  return userPermissions.includes(code);
}

export class AuthError extends Error {
  constructor(
    message: "Unauthorized" | "Forbidden",
    public status: 401 | 403
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export async function requirePermission(
  code: PermissionCode,
  options?: { redirectOnForbidden?: boolean }
) {
  const session = await auth();
  if (!session?.user) {
    if (options?.redirectOnForbidden) redirect("/login");
    throw new AuthError("Unauthorized", 401);
  }

  const permissions = (session.user as { permissions?: string[] }).permissions ?? [];
  const roleName = String((session.user as { roleName?: string }).roleName ?? "").trim();

  // Admin has all permissions (case-insensitive)
  if (roleName.toLowerCase() === "admin") return session;

  // Stale JWT: allow when permissions not yet loaded (e.g. Admin created before RBAC)
  if (permissions.length === 0 && STALE_JWT_ALLOWED.includes(code)) return session;

  if (!permissions.includes(code)) {
    if (options?.redirectOnForbidden) redirect("/");
    throw new AuthError("Forbidden", 403);
  }
  return session;
}

export async function canAccess(code: PermissionCode): Promise<boolean> {
  const session = await auth();
  if (!session?.user) return false;

  const permissions = (session.user as { permissions?: string[] }).permissions ?? [];
  const roleName = String((session.user as { roleName?: string }).roleName ?? "").trim();

  if (roleName.toLowerCase() === "admin") return true;
  if (permissions.length === 0 && STALE_JWT_ALLOWED.includes(code)) return true;
  return permissions.includes(code);
}
