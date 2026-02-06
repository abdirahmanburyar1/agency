import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { handleAuthError } from "@/lib/api-auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(PERMISSION.HAJ_UMRAH_VIEW);
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }
  try {
    const { id } = await params;
    const pkg = await prisma.hajUmrahPackage.findUnique({
      where: { id },
      include: { visaPrices: true },
    });
    if (!pkg) return NextResponse.json({ error: "Package not found" }, { status: 404 });
    return NextResponse.json({
      id: pkg.id,
      name: pkg.name,
      type: pkg.type,
      description: pkg.description,
      defaultPrice: Number(pkg.defaultPrice),
      durationDays: pkg.durationDays,
      isActive: pkg.isActive,
      createdAt: pkg.createdAt.toISOString(),
      updatedAt: pkg.updatedAt.toISOString(),
      visaPrices: pkg.visaPrices.map((v) => ({ country: v.country, price: Number(v.price) })),
    });
  } catch (error) {
    console.error("Haj Umrah package GET error:", error);
    return NextResponse.json({ error: "Failed to fetch package" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(PERMISSION.HAJ_UMRAH_EDIT);
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }
  try {
    const { id } = await params;
    const body = await request.json();
    const name = body.name != null ? String(body.name).trim() : undefined;
    if (name !== undefined && !name) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    }
    const type = body.type != null ? String(body.type).toLowerCase() : undefined;
    if (type !== undefined && type !== "haj" && type !== "umrah") {
      return NextResponse.json({ error: "Type must be haj or umrah" }, { status: 400 });
    }
    const defaultPrice = body.defaultPrice != null ? Number(body.defaultPrice) : undefined;
    if (defaultPrice !== undefined && (Number.isNaN(defaultPrice) || defaultPrice < 0)) {
      return NextResponse.json({ error: "Invalid default price" }, { status: 400 });
    }
    const visaPrices = Array.isArray(body.visaPrices)
      ? body.visaPrices
          .filter((v: unknown) => v && typeof v === "object" && typeof (v as { country?: unknown }).country === "string" && typeof (v as { price?: unknown }).price === "number")
          .map((v: { country: string; price: number }) => ({ country: String(v.country).trim(), price: v.price }))
          .filter((v) => v.country && v.price >= 0)
      : undefined;
    const pkg = await prisma.hajUmrahPackage.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(type !== undefined && { type }),
        ...(body.description !== undefined && { description: body.description ? String(body.description).trim() || null : null }),
        ...(defaultPrice !== undefined && { defaultPrice }),
        ...(body.durationDays !== undefined && { durationDays: body.durationDays != null ? Number(body.durationDays) || null : null }),
        ...(body.isActive !== undefined && { isActive: Boolean(body.isActive) }),
        ...(visaPrices !== undefined && {
          visaPrices: { deleteMany: {}, create: visaPrices },
        }),
      },
    });
    const withPrices = await prisma.hajUmrahPackage.findUnique({
      where: { id: pkg.id },
      include: { visaPrices: true },
    });
    return NextResponse.json({
      id: pkg.id,
      name: pkg.name,
      type: pkg.type,
      description: pkg.description,
      defaultPrice: Number(pkg.defaultPrice),
      durationDays: pkg.durationDays,
      isActive: pkg.isActive,
      updatedAt: pkg.updatedAt.toISOString(),
      visaPrices: withPrices?.visaPrices.map((v) => ({ country: v.country, price: Number(v.price) })) ?? [],
    });
  } catch (error) {
    console.error("Haj Umrah package PATCH error:", error);
    return NextResponse.json({ error: "Failed to update package" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(PERMISSION.HAJ_UMRAH_DELETE);
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }
  try {
    const { id } = await params;
    await prisma.hajUmrahPackage.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Haj Umrah package DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete package" }, { status: 500 });
  }
}
