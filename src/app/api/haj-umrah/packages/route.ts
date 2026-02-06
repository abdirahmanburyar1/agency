import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
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
    type PkgRow = {
      id: string;
      name: string;
      type: string;
      description: string | null;
      duration_days: number | null;
      is_active: boolean;
      price_by_country: boolean;
      fixed_price: unknown;
      created_at: Date;
    };
    type VisaRow = { package_id: string; country: string; price: unknown };
    const pkgRows = await prisma.$queryRaw<PkgRow[]>`
      SELECT id, name, type, description, duration_days, is_active, price_by_country, fixed_price, created_at
      FROM haj_umrah_packages
      ${activeOnly ? Prisma.sql`WHERE is_active = true` : Prisma.empty}
      ORDER BY type ASC, name ASC
    `;
    const visaRows = await prisma.$queryRaw<VisaRow[]>`
      SELECT package_id, country, price FROM haj_umrah_package_visa_prices
    `;
    const packages = pkgRows.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      description: p.description,
      durationDays: p.duration_days,
      isActive: p.is_active,
      priceByCountry: p.price_by_country,
      fixedPrice: p.fixed_price != null ? Number(p.fixed_price) : null,
      createdAt: new Date(p.created_at).toISOString(),
      visaPrices: visaRows
        .filter((v) => v.package_id === p.id)
        .map((v) => ({ country: v.country, price: Number(v.price) })),
    }));
    return NextResponse.json(packages);
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

    // Use raw SQL to bypass outdated Prisma client (avoids "Unknown argument priceByCountry" when prisma generate wasn't run)
    const result = await prisma.$transaction(async (tx) => {
      const [inserted] = await tx.$queryRaw<
        { id: string; name: string; type: string; description: string | null; duration_days: number | null; is_active: boolean; price_by_country: boolean; fixed_price: unknown; created_at: Date }[]
      >(Prisma.sql`
        INSERT INTO haj_umrah_packages (name, type, description, duration_days, is_active, price_by_country, fixed_price, created_at, updated_at)
        VALUES (${name}, ${type}, ${body.description ? String(body.description).trim() : null}, ${body.durationDays != null ? Number(body.durationDays) : null}, ${body.isActive !== false}, ${priceByCountry}, ${!priceByCountry && fixedPrice != null ? fixedPrice : null}, NOW(), NOW())
        RETURNING id, name, type, description, duration_days, is_active, price_by_country, fixed_price, created_at
      `);
      if (!inserted) throw new Error("Insert failed");
      if (priceByCountry && visaPrices.length > 0) {
        for (const v of visaPrices) {
          await tx.hajUmrahPackageVisaPrice.create({ data: { packageId: inserted.id, country: v.country, price: v.price } });
        }
      }
      const visaRows = await tx.hajUmrahPackageVisaPrice.findMany({ where: { packageId: inserted.id } });
      return { ...inserted, visaPrices: visaRows };
    });
    return NextResponse.json({
      id: result.id,
      name: result.name,
      type: result.type,
      description: result.description,
      durationDays: result.duration_days,
      isActive: result.is_active,
      priceByCountry: result.price_by_country,
      fixedPrice: result.fixed_price != null ? Number(result.fixed_price) : null,
      createdAt: result.created_at.toISOString(),
      visaPrices: result.visaPrices.map((v) => ({ country: v.country, price: Number(v.price) })),
    });
  } catch (error) {
    console.error("Haj Umrah package POST error:", error);
    return NextResponse.json({ error: "Failed to create package" }, { status: 500 });
  }
}
