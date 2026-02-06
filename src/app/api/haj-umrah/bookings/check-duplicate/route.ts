import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";

export async function GET(request: Request) {
  try {
    await requirePermission(PERMISSION.HAJ_UMRAH_VIEW);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId")?.trim();
    const campaignId = searchParams.get("campaignId")?.trim();
    const excludeBookingId = searchParams.get("excludeBookingId")?.trim();

    if (!customerId || !campaignId) {
      return NextResponse.json({ duplicate: false });
    }

    const existing = await prisma.hajUmrahBooking.findFirst({
      where: {
        customerId,
        campaignId,
        canceledAt: null,
        ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      },
      select: { id: true },
    });

    return NextResponse.json({ duplicate: !!existing });
  } catch (error) {
    console.error("Check duplicate booking error:", error);
    return NextResponse.json({ error: "Failed to check" }, { status: 500 });
  }
}
