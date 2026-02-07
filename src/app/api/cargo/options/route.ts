import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";

export async function GET() {
  await requirePermission(PERMISSION.CARGO_VIEW);
  try {
    const [locationsWithBranches, airCarriers, roadCarriers, seaCarriers] = await Promise.all([
      prisma.cargoLocation.findMany({
        orderBy: { name: "asc" },
        include: { branches: { orderBy: { name: "asc" } } },
      }),
      prisma.setting.findMany({ where: { type: "cargo_carrier_air" }, orderBy: [{ value: "asc" }] }),
      prisma.setting.findMany({ where: { type: "cargo_carrier_road" }, orderBy: [{ value: "asc" }] }),
      prisma.setting.findMany({ where: { type: "cargo_carrier_sea" }, orderBy: [{ value: "asc" }] }),
    ]);
    const carriersByMode = {
      air: airCarriers.map((s) => s.value),
      road: roadCarriers.map((s) => s.value),
      sea: seaCarriers.map((s) => s.value),
    };
    return NextResponse.json({ locations: locationsWithBranches, carriersByMode });
  } catch (error) {
    console.error("Cargo options GET error:", error);
    return NextResponse.json({ error: "Failed to fetch cargo options" }, { status: 500 });
  }
}
