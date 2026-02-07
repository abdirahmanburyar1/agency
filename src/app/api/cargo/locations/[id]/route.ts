import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(PERMISSION.SETTINGS_EDIT);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const { name } = await request.json();
    const trimmed = String(name ?? "").trim();
    if (!trimmed) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const existing = await prisma.cargoLocation.findFirst({
      where: { name: trimmed, id: { not: id } },
    });
    if (existing) {
      return NextResponse.json({ error: "Location already exists" }, { status: 400 });
    }
    const location = await prisma.cargoLocation.update({
      where: { id },
      data: { name: trimmed },
    });
    return NextResponse.json(location);
  } catch (error) {
    console.error("Location PUT error:", error);
    return NextResponse.json({ error: "Failed to update location" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(PERMISSION.SETTINGS_EDIT);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    await prisma.cargoLocation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Location DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete location" }, { status: 500 });
  }
}
