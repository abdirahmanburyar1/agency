import { prisma } from "./db";
import { DEFAULT_TENANT_ID } from "./tenant";

export type SystemSettings = {
  systemName: string;
  logoUrl: string;
  faviconUrl: string;
};

const DEFAULT_SETTINGS: SystemSettings = {
  systemName: "Daybah Travel Agency",
  logoUrl: "/logo.png",
  faviconUrl: "/favicon.png",
};

export async function getSystemSettings(tenantId: string = DEFAULT_TENANT_ID): Promise<SystemSettings> {
  try {
    const rows = await prisma.systemSetting.findMany({
      where: { tenantId },
    });
    const map = new Map(rows.map((r) => [r.key, r.value ?? ""]));
    return {
      systemName: map.get("system_name")?.trim() || DEFAULT_SETTINGS.systemName,
      logoUrl: map.get("logo_url")?.trim() || DEFAULT_SETTINGS.logoUrl,
      faviconUrl: map.get("favicon_url")?.trim() || DEFAULT_SETTINGS.faviconUrl,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
