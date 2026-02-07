import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";

export async function GET() {
  await requirePermission(PERMISSION.CARGO_VIEW);
  try {
    const [locationSettings, carrierSettings] = await Promise.all([
      prisma.setting.findMany({ where: { type: "cargo_location" }, orderBy: [{ value: "asc" }] }),
      prisma.setting.findMany({ where: { type: "cargo_carrier" }, orderBy: [{ value: "asc" }] }),
    ]);
    const locations = locationSettings.map((s) => s.value);
    const carriers = carrierSettings.map((s) => s.value);
    return NextResponse.json({ locations, carriers });
  } catch (error) {
    console.error("Cargo options GET error:", error);
    return NextResponse.json({ error: "Failed to fetch cargo options" }, { status: 500 });
  }
}
