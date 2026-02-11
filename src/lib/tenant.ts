import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import type { Session } from "next-auth";
import { prisma } from "./db";

/** Default tenant ID (root / empty tenants, platform context) */
export const DEFAULT_TENANT_ID = "cldefault00000000000000001";

/** Daybah tenant ID - main app at daybah.fayohealthtech.so */
export const DAYBAH_TENANT_ID = "cldaybah00000000000000001";

/** Root domain for subdomain parsing (e.g. fayohealthtech.so) */
const ROOT_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "fayohealthtech.so";

/**
 * Extract subdomain from hostname.
 * daybah.fayohealthtech.so -> daybah
 * www.fayohealthtech.so -> default (treated as root)
 * fayohealthtech.so -> null (root, use default)
 */
export function parseSubdomain(hostname: string): string | null {
  const host = hostname.toLowerCase().replace(/:\d+$/, "");
  const parts = host.split(".");
  if (parts.length < 2) return null;
  if (parts.length === 2) return null; // root domain
  const first = parts[0];
  if (first === "www" || first === "app" || first === "api") return null;
  return first;
}

/**
 * Get tenant by subdomain. Returns null if not found. Only returns active tenants.
 */
export async function getTenantBySubdomain(subdomain: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { subdomain: subdomain.toLowerCase() },
  });
  // Filter by status after fetching
  if (tenant && tenant.status !== "active") {
    return null;
  }
  return tenant;
}

/**
 * Get tenant by subdomain (any status). Used to check if tenant is suspended/banned.
 */
export async function getTenantBySubdomainAnyStatus(subdomain: string) {
  return prisma.tenant.findUnique({
    where: { subdomain: subdomain.toLowerCase() },
  });
}

/**
 * Resolve tenant ID from request (server components, RSC).
 * Priority: X-Tenant-ID header > subdomain from host > default tenant
 */
export async function getTenantIdFromRequest(): Promise<string> {
  const headersList = await headers();
  const tenantHeader = headersList.get("x-tenant-id");
  if (tenantHeader) return tenantHeader;
  const host = headersList.get("host") ?? "";
  const subdomain = parseSubdomain(host);
  if (subdomain) {
    const tenant = await getTenantBySubdomain(subdomain);
    if (tenant) return tenant.id;
  }
  return DEFAULT_TENANT_ID;
}

/**
 * Resolve tenant from Request (API routes).
 * Returns tenant info or null. Only returns active tenants.
 */
export async function getTenantFromRequest(request: Request): Promise<{ id: string; subdomain: string; name: string; status: string } | null> {
  const tenantHeader = request.headers.get("x-tenant-id");
  if (tenantHeader) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantHeader },
      select: { id: true, subdomain: true, name: true, status: true },
    });
    // Filter by status after fetching
    if (tenant && tenant.status !== "active") {
      return null;
    }
    return tenant;
  }
  const url = new URL(request.url);
  const subdomain = parseSubdomain(url.hostname);
  if (subdomain) {
    const tenant = await getTenantBySubdomain(subdomain);
    if (tenant) return { id: tenant.id, subdomain: tenant.subdomain, name: tenant.name, status: tenant.status };
  }
  const defaultTenant = await prisma.tenant.findUnique({
    where: { id: DEFAULT_TENANT_ID },
    select: { id: true, subdomain: true, name: true, status: true },
  });
  return defaultTenant;
}

/**
 * Resolve tenant ID from request (API routes).
 */
export async function getTenantIdFromRequestForApi(request: Request): Promise<string> {
  const tenant = await getTenantFromRequest(request);
  return tenant?.id ?? DEFAULT_TENANT_ID;
}

/**
 * Resolve tenant ID from session (for authenticated requests).
 * Platform admins may not have a tenant; returns default for app context.
 */
export function getTenantIdFromSession(session: Session | null): string {
  const tid = (session?.user as { tenantId?: string | null })?.tenantId;
  return tid ?? DEFAULT_TENANT_ID;
}

/**
 * Check if tenant is suspended or banned (blocks access).
 */
export async function getTenantStatus(tenantId: string): Promise<"active" | "suspended" | "banned" | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { status: true },
  });
  return tenant?.status as "active" | "suspended" | "banned" | null;
}
