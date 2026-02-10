import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { getSystemSettings } from "@/lib/system-settings";
import { getTenantIdFromRequest, getTenantIdFromSession } from "@/lib/tenant";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { handleAuthError } from "@/lib/api-auth";

export async function GET() {
  try {
    const tenantId = await getTenantIdFromRequest();
    const settings = await getSystemSettings(tenantId);
    return NextResponse.json(settings);
  } catch (error) {
    console.error("System settings GET error:", error);
    return NextResponse.json({ error: "Failed to fetch system settings" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await requirePermission(PERMISSION.SETTINGS_EDIT);
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }
  try {
    const session = await auth();
    const tenantId = getTenantIdFromSession(session);
    const body = await request.json();
    const { systemName, logoUrl, faviconUrl } = body;

    const updates: { key: string; value: string }[] = [];
    if (typeof systemName === "string") {
      updates.push({ key: "system_name", value: systemName.trim() || "Daybah Travel Agency" });
    }
    if (typeof logoUrl === "string") {
      updates.push({ key: "logo_url", value: logoUrl.trim() || "/logo.png" });
    }
    if (typeof faviconUrl === "string") {
      updates.push({ key: "favicon_url", value: faviconUrl.trim() || "/favicon.png" });
    }

    for (const { key, value } of updates) {
      await prisma.systemSetting.upsert({
        where: { tenantId_key: { tenantId, key } },
        create: { tenantId, key, value },
        update: { value },
      });
    }

    const settings = await getSystemSettings(tenantId);
    return NextResponse.json(settings);
  } catch (error) {
    console.error("System settings PATCH error:", error);
    return NextResponse.json({ error: "Failed to update system settings" }, { status: 500 });
  }
}
