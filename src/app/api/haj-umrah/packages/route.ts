import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { handleAuthError } from "@/lib/api-auth";

export async function GET(request: Request) {
  try {
    await requirePermission(PERMISSION.HAJ_UMRAH_VIEW);
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";
    const packages = await prisma.hajUmrahPackage.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: [{ type: "asc" }, { name: "asc" }],
      include: { visaPrices: true },
    });
    return NextResponse.json(
      packages.map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        description: p.description,
        durationDays: p.durationDays,
        isActive: p.isActive,
        createdAt: p.createdAt.toISOString(),
        visaPrices: p.visaPrices.map((v) => ({ country: v.country, price: Number(v.price) })),
      }))
    );
  } catch (error) {
    console.error("Haj Umrah packages GET error:", error);
    return NextResponse.json({ error: "Failed to fetch packages" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission(PERMISSION.HAJ_UMRAH_CREATE);
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const type = String(body.type ?? "").toLowerCase();
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (type !== "haj" && type !== "umrah") {
      return NextResponse.json({ error: "Type must be haj or umrah" }, { status: 400 });
    }
    const visaPrices = Array.isArray(body.visaPrices)
      ? body.visaPrices
          .filter((v: unknown) => v && typeof v === "object" && typeof (v as { country?: unknown }).country === "string" && typeof (v as { price?: unknown }).price === "number")
          .map((v: { country: string; price: number }) => ({ country: String(v.country).trim(), price: v.price }))
          .filter((v: { country: string; price: number }) => v.country && v.price >= 0)
      : [];
    if (visaPrices.length === 0) {
      return NextResponse.json(
        { error: "Add at least one visa price by country" },
        { status: 400 }
      );
    }
    const pkg = await prisma.hajUmrahPackage.create({
      data: {
        name,
        type,
        description: body.description ? String(body.description).trim() || null : null,
        durationDays: body.durationDays != null ? Number(body.durationDays) || null : null,
        isActive: body.isActive !== false,
        visaPrices: visaPrices.length > 0 ? { create: visaPrices } : undefined,
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
      durationDays: pkg.durationDays,
      isActive: pkg.isActive,
      createdAt: pkg.createdAt.toISOString(),
      visaPrices: withPrices?.visaPrices.map((v) => ({ country: v.country, price: Number(v.price) })) ?? [],
    });
  } catch (error) {
    console.error("Haj Umrah package POST error:", error);
    return NextResponse.json({ error: "Failed to create package" }, { status: 500 });
  }
}
