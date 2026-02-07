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
    const body = await request.json();
    const name = body.name ? String(body.name).trim() : undefined;
    const address = body.address !== undefined ? (body.address ? String(body.address).trim() : null) : undefined;
    const email = body.email !== undefined ? (body.email ? String(body.email).trim() : null) : undefined;
    const phone = body.phone !== undefined ? (body.phone ? String(body.phone).trim() : null) : undefined;
    const whatsapp = body.whatsapp !== undefined ? (body.whatsapp ? String(body.whatsapp).trim() : null) : undefined;

    const data: { name?: string; address?: string | null; email?: string | null; phone?: string | null; whatsapp?: string | null } = {};
    if (name !== undefined) data.name = name;
    if (address !== undefined) data.address = address;
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;
    if (whatsapp !== undefined) data.whatsapp = whatsapp;

    if (data.name === "") {
      return NextResponse.json({ error: "Branch name is required" }, { status: 400 });
    }
    if (name) {
      const current = await prisma.branch.findUnique({ where: { id } });
      if (current) {
        const existing = await prisma.branch.findUnique({
          where: { locationId_name: { locationId: current.locationId, name } },
        });
        if (existing && existing.id !== id) {
          return NextResponse.json({ error: "Branch already exists in this location" }, { status: 400 });
        }
      }
    }
    const branch = await prisma.branch.update({
      where: { id },
      data,
      include: { location: true },
    });
    return NextResponse.json(branch);
  } catch (error) {
    console.error("Branch PUT error:", error);
    return NextResponse.json({ error: "Failed to update branch" }, { status: 500 });
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
    await prisma.branch.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Branch DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete branch" }, { status: 500 });
  }
}
