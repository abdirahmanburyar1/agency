import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getTenantIdFromSession } from "@/lib/tenant";
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
        priceByCountry: p.priceByCountry,
        fixedPrice: p.fixedPrice != null ? Number(p.fixedPrice) : null,
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
    const priceByCountry = body.priceByCountry !== false;
    const visaPrices = Array.isArray(body.visaPrices)
      ? body.visaPrices
          .filter((v: unknown) => v && typeof v === "object" && typeof (v as { country?: unknown }).country === "string" && typeof (v as { price?: unknown }).price === "number")
          .map((v: { country: string; price: number }) => ({ country: String(v.country).trim(), price: v.price }))
          .filter((v: { country: string; price: number }) => v.country && v.price >= 0)
      : [];
    const fixedPrice = body.fixedPrice != null ? Number(body.fixedPrice) : null;

    if (priceByCountry) {
      if (visaPrices.length === 0) {
        return NextResponse.json(
          { error: "Add at least one visa price by country when price depends on country" },
          { status: 400 }
        );
      }
    } else {
      if (fixedPrice == null || Number.isNaN(fixedPrice) || fixedPrice < 0) {
        return NextResponse.json(
          { error: "Enter a valid fixed price when price does not depend on country" },
          { status: 400 }
        );
      }
    }

    // Sequential creates (no transaction) to avoid "Transaction not found" with serverless DBs
    const session = await auth();
    const tenantId = getTenantIdFromSession(session);
    const pkg = await prisma.hajUmrahPackage.create({
      data: {
        tenantId,
        name,
        type,
        description: body.description ? String(body.description).trim() || null : null,
        durationDays: body.durationDays != null ? Number(body.durationDays) : null,
        isActive: body.isActive !== false,
        priceByCountry,
        fixedPrice: !priceByCountry && fixedPrice != null ? fixedPrice : null,
      },
      include: { visaPrices: true },
    });
    if (priceByCountry && visaPrices.length > 0) {
      await prisma.hajUmrahPackageVisaPrice.createMany({
        data: visaPrices.map((v: { country: string; price: number }) => ({ packageId: pkg.id, country: v.country, price: v.price })),
      });
    }
    const result = await prisma.hajUmrahPackage.findUniqueOrThrow({
      where: { id: pkg.id },
      include: { visaPrices: true },
    });
    return NextResponse.json({
      id: result.id,
      name: result.name,
      type: result.type,
      description: result.description,
      durationDays: result.durationDays,
      isActive: result.isActive,
      priceByCountry: result.priceByCountry,
      fixedPrice: result.fixedPrice != null ? Number(result.fixedPrice) : null,
      createdAt: result.createdAt.toISOString(),
      visaPrices: result.visaPrices.map((v) => ({ country: v.country, price: Number(v.price) })),
    });
  } catch (error) {
    console.error("Haj Umrah package POST error:", error);
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "message" in error
          ? String((error as { message: unknown }).message)
          : "Failed to create package";
    return NextResponse.json(
      { error: "Failed to create package", details: message },
      { status: 500 }
    );
  }
}
