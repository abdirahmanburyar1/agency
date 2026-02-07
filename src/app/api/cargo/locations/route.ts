import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";

export async function GET() {
  try {
    await requirePermission(PERMISSION.CARGO_VIEW);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const locations = await prisma.cargoLocation.findMany({
      orderBy: { name: "asc" },
      include: { branches: { orderBy: { name: "asc" } } },
    });
    return NextResponse.json(locations);
  } catch (error) {
    console.error("Locations GET error:", error);
    return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission(PERMISSION.SETTINGS_EDIT);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { name } = await request.json();
    const trimmed = String(name ?? "").trim();
    if (!trimmed) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const existing = await prisma.cargoLocation.findUnique({
      where: { name: trimmed },
    });
    if (existing) {
      return NextResponse.json({ error: "Location already exists" }, { status: 400 });
    }
    const location = await prisma.cargoLocation.create({
      data: { name: trimmed },
    });
    return NextResponse.json(location);
  } catch (error) {
    console.error("Locations POST error:", error);
    return NextResponse.json({ error: "Failed to create location" }, { status: 500 });
  }
}
