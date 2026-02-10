import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/platform";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requirePlatformAdmin();
  if (err) return err;
  const { id } = await params;
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
    if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    return NextResponse.json(tenant);
  } catch (e) {
    console.error("Platform tenant GET error:", e);
    return NextResponse.json({ error: "Failed to fetch tenant" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const err = await requirePlatformAdmin();
  if (err) return err;
  const { id } = await params;
  try {
    const body = await request.json();
    const updates: { name?: string; status?: string } = {};
    if (typeof body.name === "string") updates.name = body.name.trim();
    if (["active", "suspended", "banned"].includes(body.status)) updates.status = body.status;
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid updates" }, { status: 400 });
    }
    const tenant = await prisma.tenant.update({
      where: { id },
      data: updates,
    });
    return NextResponse.json(tenant);
  } catch (e) {
    console.error("Platform tenant PATCH error:", e);
    return NextResponse.json({ error: "Failed to update tenant" }, { status: 500 });
  }
}
