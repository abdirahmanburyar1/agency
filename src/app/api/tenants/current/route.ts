import { NextResponse } from "next/server";
import {
  getTenantFromRequest,
  getTenantBySubdomainAnyStatus,
  parseSubdomain,
} from "@/lib/tenant";

/** Public: returns current tenant based on subdomain (for login page).
 * If subdomain tenant exists but is suspended/banned, returns { suspended: true } so login can redirect.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const subdomain = parseSubdomain(url.hostname);
    if (subdomain) {
      const tenantAny = await getTenantBySubdomainAnyStatus(subdomain);
      if (tenantAny && (tenantAny.status === "suspended" || tenantAny.status === "banned")) {
        return NextResponse.json({
          tenantId: tenantAny.id,
          subdomain: tenantAny.subdomain,
          name: tenantAny.name,
          suspended: true,
        });
      }
    }
    const tenant = await getTenantFromRequest(request);
    if (!tenant) {
      return NextResponse.json({ tenantId: null, subdomain: null, name: null });
    }
    return NextResponse.json({ ...tenant, suspended: false });
  } catch (e) {
    console.error("Tenants current error:", e);
    return NextResponse.json({ tenantId: null, subdomain: null, name: null });
  }
}
