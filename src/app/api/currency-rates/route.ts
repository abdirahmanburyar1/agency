import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";

/** Returns currency rates for receipt/payment conversion. Requires payments view. */
export async function GET() {
  await requirePermission(PERMISSION.PAYMENTS_VIEW, { redirectOnForbidden: true });
  try {
    const rates = await prisma.currencyRate.findMany({
      orderBy: { currency: "asc" },
    });
    const map: Record<string, number> = { USD: 1 };
    for (const r of rates) {
      map[r.currency] = Number(r.rateToUsd);
    }
    return NextResponse.json(map);
  } catch (error) {
    console.error("Currency rates GET error:", error);
    return NextResponse.json({ error: "Failed to fetch currency rates" }, { status: 500 });
  }
}
