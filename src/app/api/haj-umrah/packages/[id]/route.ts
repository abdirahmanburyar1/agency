import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
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
      durationDays: pkg.durationDays,
      isActive: pkg.isActive,
      priceByCountry: pkg.priceByCountry,
      fixedPrice: pkg.fixedPrice != null ? Number(pkg.fixedPrice) : null,
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
    const priceByCountry = body.priceByCountry !== undefined ? Boolean(body.priceByCountry) : undefined;
    const visaPrices = Array.isArray(body.visaPrices)
      ? body.visaPrices
          .filter((v: unknown) => v && typeof v === "object" && typeof (v as { country?: unknown }).country === "string" && typeof (v as { price?: unknown }).price === "number")
          .map((v: { country: string; price: number }) => ({ country: String(v.country).trim(), price: v.price }))
          .filter((v: { country: string; price: number }) => v.country && v.price >= 0)
      : undefined;
    const fixedPrice = body.fixedPrice !== undefined ? (body.fixedPrice == null ? null : Number(body.fixedPrice)) : undefined;

    if (priceByCountry === true && visaPrices !== undefined && visaPrices.length === 0) {
      return NextResponse.json({ error: "Add at least one visa price by country when price depends on country" }, { status: 400 });
    }
    if (priceByCountry === false && (fixedPrice == null || Number.isNaN(fixedPrice) || fixedPrice < 0)) {
      return NextResponse.json({ error: "Enter a valid fixed price when price does not depend on country" }, { status: 400 });
    }

    // Use raw SQL to bypass outdated Prisma client (avoids "Unknown argument priceByCountry" when prisma generate wasn't run)
    await prisma.$transaction(async (tx) => {
      const updateParts: Prisma.Sql[] = [];
      if (name !== undefined) updateParts.push(Prisma.sql`name = ${name}`);
      if (type !== undefined) updateParts.push(Prisma.sql`type = ${type}`);
      if (body.description !== undefined)
        updateParts.push(Prisma.sql`description = ${body.description ? String(body.description).trim() : null}`);
      if (body.durationDays !== undefined)
        updateParts.push(Prisma.sql`duration_days = ${body.durationDays != null ? Number(body.durationDays) : null}`);
      if (body.isActive !== undefined) updateParts.push(Prisma.sql`is_active = ${Boolean(body.isActive)}`);
      if (priceByCountry !== undefined) updateParts.push(Prisma.sql`price_by_country = ${priceByCountry}`);
      if (priceByCountry === true) updateParts.push(Prisma.sql`fixed_price = NULL`);
      else if (priceByCountry === false && fixedPrice != null) updateParts.push(Prisma.sql`fixed_price = ${fixedPrice}`);

      if (updateParts.length > 0) {
        const setClause = Prisma.join(updateParts, ", ");
        await tx.$executeRaw(Prisma.sql`UPDATE haj_umrah_packages SET ${setClause} WHERE id = ${id}`);
      }

      if (visaPrices !== undefined) {
        await tx.hajUmrahPackageVisaPrice.deleteMany({ where: { packageId: id } });
        if (visaPrices.length > 0) {
          await tx.hajUmrahPackageVisaPrice.createMany({
            data: visaPrices.map((v) => ({ packageId: id, country: v.country, price: v.price })),
          });
        }
      }
    });

    const [pkgRow] = await prisma.$queryRaw<
      { id: string; name: string; type: string; description: string | null; duration_days: number | null; is_active: boolean; price_by_country: boolean; fixed_price: unknown; updated_at: Date }[]
    >(Prisma.sql`SELECT id, name, type, description, duration_days, is_active, price_by_country, fixed_price, updated_at FROM haj_umrah_packages WHERE id = ${id}`);
    if (!pkgRow) return NextResponse.json({ error: "Package not found" }, { status: 404 });

    const visaPriceRows = await prisma.hajUmrahPackageVisaPrice.findMany({ where: { packageId: id } });
    return NextResponse.json({
      id: pkgRow.id,
      name: pkgRow.name,
      type: pkgRow.type,
      description: pkgRow.description,
      durationDays: pkgRow.duration_days,
      isActive: pkgRow.is_active,
      priceByCountry: pkgRow.price_by_country,
      fixedPrice: pkgRow.fixed_price != null ? Number(pkgRow.fixed_price) : null,
      updatedAt: pkgRow.updated_at.toISOString(),
      visaPrices: visaPriceRows.map((v) => ({ country: v.country, price: Number(v.price) })),
    });
  } catch (error) {
    console.error("Haj Umrah package PATCH error:", error);
    const message = error instanceof Error ? error.message : "Failed to update package";
    return NextResponse.json({ error: message }, { status: 500 });
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
    const packageExists = await prisma.hajUmrahPackage.findUnique({ where: { id }, select: { id: true } });
    if (!packageExists) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }
    await prisma.hajUmrahPackage.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Haj Umrah package DELETE error:", error);
    const message = error instanceof Error ? error.message : "Failed to delete package";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
