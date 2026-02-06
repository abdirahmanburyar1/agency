import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { handleAuthError } from "@/lib/api-auth";
import { trigger, EVENTS } from "@/lib/pusher";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const permissions = (session.user as { permissions?: string[] }).permissions ?? [];
  const hasEdit = permissions.includes(PERMISSION.HAJ_UMRAH_EDIT);
  const hasLeader = permissions.includes(PERMISSION.HAJ_UMRAH_LEADER);
  if (!hasEdit && !hasLeader) {
    const res = handleAuthError(new Error("Forbidden"));
    if (res) return res;
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await request.json();
    const bookingIds = Array.isArray(body.bookingIds) ? body.bookingIds.map(String).filter(Boolean) : [];
    if (bookingIds.length === 0) {
      return NextResponse.json({ error: "No booking IDs provided" }, { status: 400 });
    }
    if (hasLeader && !hasEdit) {
      const userId = (session.user as { id?: string }).id;
      const bookings = await prisma.hajUmrahBooking.findMany({
        where: { id: { in: bookingIds }, canceledAt: null },
        select: { id: true, campaignId: true, campaign: { select: { leaderId: true } } },
      });
      const allLedByUser = bookings.every((b) => b.campaign?.leaderId === userId);
      if (!allLedByUser || bookings.length !== bookingIds.length) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    const result = await prisma.hajUmrahBooking.updateMany({
      where: { id: { in: bookingIds }, canceledAt: null },
      data: { status: "confirmed" },
    });

    // Generate payment for each confirmed booking if none exists
    const confirmedBookings = await prisma.hajUmrahBooking.findMany({
      where: { id: { in: bookingIds }, status: "confirmed", canceledAt: null },
      include: { customer: true, packages: true },
    });
    const existingPaymentBookingIds = new Set(
      (
        await prisma.payment.findMany({
          where: { hajUmrahBookingId: { in: bookingIds } },
          select: { hajUmrahBookingId: true },
        })
      )
        .map((p) => p.hajUmrahBookingId)
        .filter(Boolean) as string[]
    );
    for (const booking of confirmedBookings) {
      const totalAmount = booking.packages.reduce((sum, bp) => sum + Number(bp.amount), 0);
      if (totalAmount > 0 && booking.customer && !existingPaymentBookingIds.has(booking.id)) {
        const trackDisplay =
          booking.trackNumber != null
            ? booking.trackNumber < 1000
              ? String(booking.trackNumber).padStart(3, "0")
              : String(booking.trackNumber)
            : "";
        const payment = await prisma.payment.create({
          data: {
            date: booking.date,
            month: booking.month,
            paymentDate: booking.date,
            status: "pending",
            name: trackDisplay ? `Haj & Umrah #${trackDisplay}` : "Haj & Umrah",
            description: booking.customer.name ? `Customer: ${booking.customer.name}` : null,
            amount: totalAmount,
            hajUmrahBookingId: booking.id,
          },
        });
        existingPaymentBookingIds.add(booking.id);
        trigger(EVENTS.PAYMENT_CREATED, { payment }).catch(() => {});
      }
    }

    return NextResponse.json({ ok: true, count: result.count });
  } catch (error) {
    console.error("Haj Umrah bulk confirm error:", error);
    return NextResponse.json({ error: "Failed to confirm bookings" }, { status: 500 });
  }
}
