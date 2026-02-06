import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { handleAuthError } from "@/lib/api-auth";
import { trigger, EVENTS } from "@/lib/pusher";

export async function GET() {
  try {
    await requirePermission(PERMISSION.HAJ_UMRAH_VIEW);
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }
  try {
    const bookings = await prisma.hajUmrahBooking.findMany({
      where: { canceledAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        campaign: { include: { leader: { select: { id: true, name: true, email: true } } } },
        packages: true,
      },
    });
    return NextResponse.json(
      bookings.map((b) => ({
        id: b.id,
        trackNumber: b.trackNumber,
        campaignId: b.campaignId,
        campaign: b.campaign
          ? {
              id: b.campaign.id,
              date: b.campaign.date.toISOString(),
              month: b.campaign.month,
              name: b.campaign.name,
              type: b.campaign.type,
              leaderId: b.campaign.leaderId ?? null,
              leader: b.campaign.leader ? { id: b.campaign.leader.id, name: b.campaign.leader.name, email: b.campaign.leader.email } : null,
            }
          : null,
        customerId: b.customerId,
        customer: { id: b.customer.id, name: b.customer.name, email: b.customer.email, phone: b.customer.phone },
        date: b.date.toISOString(),
        month: b.month,
        status: b.status,
        notes: b.notes,
        createdAt: b.createdAt.toISOString(),
        packages: b.packages.map((bp) => ({
          id: bp.id,
          packageId: bp.packageId,
          packageName: bp.packageName ?? "Package",
          packageType: "umrah",
          quantity: bp.quantity,
          unitPrice: Number(bp.unitPrice),
          amount: Number(bp.amount),
        })),
        totalAmount: b.packages.reduce((sum, bp) => sum + Number(bp.amount), 0) + (b.profit != null ? Number(b.profit) : 0),
      }))
    );
  } catch (error) {
    console.error("Haj Umrah bookings GET error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
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
    const customerId = String(body.customerId ?? "").trim();
    if (!customerId) return NextResponse.json({ error: "Customer is required" }, { status: 400 });
    const packageLines = Array.isArray(body.packages) ? body.packages : [];
    if (packageLines.length === 0) {
      return NextResponse.json({ error: "At least one package is required" }, { status: 400 });
    }
    const campaignId = body.campaignId ? String(body.campaignId).trim() || null : null;
    let date: Date;
    let month: string;
    if (campaignId) {
      const campaign = await prisma.hajUmrahCampaign.findUnique({ where: { id: campaignId } });
      if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 400 });
      if (campaign.canceledAt) return NextResponse.json({ error: "Campaign is canceled and cannot be selected." }, { status: 400 });
      const now = new Date();
      if (campaign.date <= now) return NextResponse.json({ error: "Campaign is past due (departure date and time have passed) and cannot be selected." }, { status: 400 });
      const duplicate = await prisma.hajUmrahBooking.findFirst({
        where: { customerId, campaignId, canceledAt: null },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "This customer already has a booking in this campaign. A customer cannot be added twice to the same campaign." },
          { status: 400 }
        );
      }
      date = campaign.date;
      month = campaign.month;
    } else {
      date = body.date ? new Date(body.date) : new Date();
      month = body.month ?? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    }
    const status = String(body.status ?? "draft").toLowerCase();
    if (!["draft", "confirmed", "canceled"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const notes = body.notes ? String(body.notes).trim() || null : null;
    const profit = body.profit != null ? Number(body.profit) : null;
    const passportCountry = body.passportCountry ? String(body.passportCountry).trim() || null : null;

    const booking = await prisma.$transaction(async (tx) => {
      const lastBooking = await tx.hajUmrahBooking.findFirst({
        where: { trackNumber: { not: null } },
        orderBy: { trackNumber: "desc" },
        select: { trackNumber: true },
      });
      const nextTrackNumber = (lastBooking?.trackNumber ?? 0) + 1;
      const b = await tx.hajUmrahBooking.create({
        data: {
          customerId,
          campaignId,
          date,
          month,
          trackNumber: nextTrackNumber,
          status,
          notes,
          profit: profit != null && !Number.isNaN(profit) && profit >= 0 ? profit : null,
          passportCountry,
        },
      });
      for (const line of packageLines) {
        const packageId = String(line.packageId ?? "").trim() || null;
        const packageName = String(line.packageName ?? "").trim() || "Package";
        const quantity = Math.max(1, Number(line.quantity) || 1);
        const unitPrice = Number(line.unitPrice);
        if (Number.isNaN(unitPrice) || unitPrice < 0) continue;
        const amount = unitPrice * quantity;
        await tx.$executeRaw`
          INSERT INTO haj_umrah_booking_packages (id, booking_id, package_id, package_name, quantity, unit_price, amount)
          VALUES (${randomUUID()}, ${b.id}, ${packageId}, ${packageName}, ${quantity}, ${unitPrice}, ${amount})
        `;
      }
      return tx.hajUmrahBooking.findUniqueOrThrow({
        where: { id: b.id },
        include: { customer: true, packages: true },
      });
    });

    const packagesTotal = booking.packages.reduce((sum, bp) => sum + Number(bp.amount), 0);
    const profitAmount = booking.profit != null ? Number(booking.profit) : 0;
    const totalAmount = packagesTotal + profitAmount;

    // Create payment only when booking is confirmed: customer owes us totalAmount
    if (status === "confirmed" && totalAmount > 0 && booking.customer) {
      const customerName = booking.customer.name;
      const trackDisplay =
        booking.trackNumber != null
          ? booking.trackNumber < 1000
            ? String(booking.trackNumber).padStart(3, "0")
            : String(booking.trackNumber)
          : "";
      await prisma.payment.create({
        data: {
          date: booking.date,
          month: booking.month,
          paymentDate: new Date(), // current date when booking is confirmed
          status: "pending",
          name: trackDisplay ? `Haj & Umrah #${trackDisplay}` : "Haj & Umrah",
          description: customerName ? `Customer: ${customerName}` : null,
          amount: totalAmount,
          hajUmrahBookingId: booking.id,
        },
      });
      const payment = await prisma.payment.findFirst({
        where: { hajUmrahBookingId: booking.id },
        orderBy: { createdAt: "desc" },
      });
      if (payment) trigger(EVENTS.PAYMENT_CREATED, { payment }).catch(() => {});
    }

    return NextResponse.json({
      id: booking.id,
      trackNumber: booking.trackNumber,
      customerId: booking.customerId,
      customer: booking.customer,
      date: booking.date.toISOString(),
      month: booking.month,
      status: booking.status,
      notes: booking.notes,
      createdAt: booking.createdAt.toISOString(),
      packages: booking.packages.map((bp) => ({
        id: bp.id,
        packageId: bp.packageId,
        packageName: bp.packageName ?? "Package",
        packageType: "umrah",
        quantity: bp.quantity,
        unitPrice: Number(bp.unitPrice),
        amount: Number(bp.amount),
      })),
      totalAmount,
    });
  } catch (error) {
    console.error("Haj Umrah booking POST error:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
