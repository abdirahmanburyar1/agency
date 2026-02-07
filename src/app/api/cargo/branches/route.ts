import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";

export async function GET(request: Request) {
  try {
    await requirePermission(PERMISSION.CARGO_VIEW);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get("locationId");
  try {
    const where = locationId ? { locationId } : {};
    const branches = await prisma.branch.findMany({
      where,
      orderBy: [{ location: { name: "asc" } }, { name: "asc" }],
      include: { location: true },
    });
    return NextResponse.json(branches);
  } catch (error) {
    console.error("Branches GET error:", error);
    return NextResponse.json({ error: "Failed to fetch branches" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission(PERMISSION.SETTINGS_EDIT);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const locationId = String(body.locationId ?? "").trim();
    const name = String(body.name ?? "").trim();
    const address = body.address ? String(body.address).trim() || null : null;
    const email = body.email ? String(body.email).trim() || null : null;
    const phone = body.phone ? String(body.phone).trim() || null : null;
    const whatsapp = body.whatsapp ? String(body.whatsapp).trim() || null : null;

    if (!locationId || !name) {
      return NextResponse.json(
        { error: "Location and branch name are required" },
        { status: 400 }
      );
    }
    const location = await prisma.cargoLocation.findUnique({ where: { id: locationId } });
    if (!location) {
      return NextResponse.json({ error: "Invalid location" }, { status: 400 });
    }
    const existing = await prisma.branch.findUnique({
      where: { locationId_name: { locationId, name } },
    });
    if (existing) {
      return NextResponse.json({ error: "Branch already exists in this location" }, { status: 400 });
    }
    const branch = await prisma.branch.create({
      data: { locationId, name, address, email, phone, whatsapp },
      include: { location: true },
    });
    return NextResponse.json(branch);
  } catch (error) {
    console.error("Branches POST error:", error);
    return NextResponse.json({ error: "Failed to create branch" }, { status: 500 });
  }
}
