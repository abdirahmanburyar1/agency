import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { handleAuthError } from "@/lib/api-auth";

export async function GET() {
  try {
    await requirePermission(PERMISSION.SETTINGS_VIEW);
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }
  try {
    const rates = await prisma.currencyRate.findMany({
      orderBy: { currency: "asc" },
    });
    return NextResponse.json(
      rates.map((r) => ({ currency: r.currency, rateToUsd: Number(r.rateToUsd), updatedAt: r.updatedAt.toISOString() }))
    );
  } catch (error) {
    console.error("Currency rates GET error:", error);
    return NextResponse.json({ error: "Failed to fetch currency rates" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await requirePermission(PERMISSION.SETTINGS_EDIT);
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }
  try {
    const body = await request.json();
    const rates = Array.isArray(body.rates) ? body.rates : [];
    const valid: { currency: string; rateToUsd: number }[] = [];
    for (const r of rates) {
      const currency = r?.currency ? String(r.currency).trim().toUpperCase() : "";
      const rate = r?.rateToUsd != null ? Number(r.rateToUsd) : NaN;
      if (currency && currency !== "USD" && !Number.isNaN(rate) && rate > 0) {
        valid.push({ currency, rateToUsd: rate });
      }
    }
    await prisma.$transaction(
      valid.map(({ currency, rateToUsd }) =>
        prisma.currencyRate.upsert({
          where: { currency },
          create: { currency, rateToUsd },
          update: { rateToUsd },
        })
      )
    );
    const updated = await prisma.currencyRate.findMany({ orderBy: { currency: "asc" } });
    return NextResponse.json(
      updated.map((r) => ({ currency: r.currency, rateToUsd: Number(r.rateToUsd), updatedAt: r.updatedAt.toISOString() }))
    );
  } catch (error) {
    console.error("Currency rates PUT error:", error);
    return NextResponse.json({ error: "Failed to save currency rates" }, { status: 500 });
  }
}
