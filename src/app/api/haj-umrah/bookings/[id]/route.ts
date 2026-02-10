import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { handleAuthError } from "@/lib/api-auth";
import { trigger, EVENTS } from "@/lib/pusher";

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
    const booking = await prisma.hajUmrahBooking.findUnique({
      where: { id },
      include: {
        customer: true,
        campaign: { include: { leader: { select: { id: true, name: true, email: true } } } },
        packages: true,
      },
    });
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    const packagesTotal = booking.packages.reduce((sum, bp) => sum + Number(bp.amount), 0);
    const profitAmount = booking.profit != null ? Number(booking.profit) : 0;
    const totalAmount = packagesTotal + profitAmount;
    const campaignPayload = booking.campaign
      ? {
          id: booking.campaign.id,
          date: booking.campaign.date.toISOString(),
          month: booking.campaign.month,
          name: booking.campaign.name,
          type: booking.campaign.type,
          leaderId: booking.campaign.leaderId ?? null,
          leader: booking.campaign.leader ? { id: booking.campaign.leader.id, name: booking.campaign.leader.name, email: booking.campaign.leader.email } : null,
        }
      : null;
    return NextResponse.json({
      id: booking.id,
      trackNumber: booking.trackNumber,
      campaignId: booking.campaignId,
      campaign: campaignPayload,
      customerId: booking.customerId,
      customer: booking.customer,
      date: booking.date.toISOString(),
      month: booking.month,
      status: booking.status,
      notes: booking.notes,
      profit: booking.profit != null ? Number(booking.profit) : null,
      passportCountry: booking.passportCountry ?? null,
      createdAt: booking.createdAt.toISOString(),
      canceledAt: booking.canceledAt?.toISOString() ?? null,
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
    console.error("Haj Umrah booking GET error:", error);
    return NextResponse.json({ error: "Failed to fetch booking" }, { status: 500 });
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
    const status = body.status != null ? String(body.status).toLowerCase() : undefined;
    if (status !== undefined && !["draft", "confirmed", "canceled"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const updateData: {
      status?: string;
      notes?: string | null;
      canceledAt?: Date | null;
      customerId?: string;
      campaignId?: string | null;
      date?: Date;
      month?: string;
      trackNumber?: number;
      profit?: number | null;
      passportCountry?: string | null;
    } = {};
    if (status !== undefined) updateData.status = status;
    if (status === "canceled") updateData.canceledAt = new Date();
    else if (status && status !== "canceled") updateData.canceledAt = null;
    if (body.notes !== undefined) updateData.notes = body.notes ? String(body.notes).trim() || null : null;
    if (body.profit !== undefined) {
      const p = Number(body.profit);
      updateData.profit = !Number.isNaN(p) && p >= 0 ? p : null;
    }
    if (body.passportCountry !== undefined) {
      updateData.passportCountry = body.passportCountry ? String(body.passportCountry).trim() || null : null;
    }

    const customerId = body.customerId != null ? String(body.customerId).trim() : undefined;
    if (customerId !== undefined && customerId) updateData.customerId = customerId;

    const campaignId = body.campaignId != null ? (body.campaignId === "" || body.campaignId === null ? null : String(body.campaignId).trim()) : undefined;
    if (campaignId !== undefined) {
      updateData.campaignId = campaignId || null;
      if (campaignId) {
        const campaign = await prisma.hajUmrahCampaign.findUnique({ where: { id: campaignId }, select: { date: true, month: true, canceledAt: true } });
        if (campaign) {
          if (campaign.canceledAt) return NextResponse.json({ error: "Campaign is canceled and cannot be selected." }, { status: 400 });
          const now = new Date();
          if (campaign.date <= now) return NextResponse.json({ error: "Campaign is past due (departure date and time have passed) and cannot be selected." }, { status: 400 });
          updateData.date = campaign.date;
          updateData.month = campaign.month;
        }
      }
    }

    const packageLines = Array.isArray(body.packages) ? body.packages : undefined;

    const existing = await prisma.hajUmrahBooking.findUnique({
      where: { id },
      select: { trackNumber: true, canceledAt: true, campaignId: true, customerId: true, campaign: { select: { date: true } } },
    });
    if (!existing) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    const effectiveCustomerId = customerId !== undefined ? customerId : existing.customerId;
    const effectiveCampaignId = campaignId !== undefined ? (campaignId || null) : existing.campaignId;
    if (effectiveCustomerId && effectiveCampaignId) {
      const duplicate = await prisma.hajUmrahBooking.findFirst({
        where: {
          customerId: effectiveCustomerId,
          campaignId: effectiveCampaignId,
          canceledAt: null,
          id: { not: id },
        },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "This customer already has a booking in this campaign. A customer cannot be added twice to the same campaign." },
          { status: 400 }
        );
      }
    }

    const now = new Date();
    const campaignDatePassed = existing.campaign?.date ? existing.campaign.date <= now : false;
    if (existing.campaign?.date) {
      if (existing.canceledAt) {
        if (status && status !== "canceled" && campaignDatePassed) {
          return NextResponse.json(
            { error: "Cannot reinitiate booking after the campaign departure date has passed." },
            { status: 400 }
          );
        }
      } else if (campaignDatePassed) {
        return NextResponse.json(
          { error: "Cannot edit booking after the campaign departure date has passed." },
          { status: 400 }
        );
      }
    }

    const canceledAt = status === "canceled" ? new Date() : undefined;
    const booking = await prisma.$transaction(
      async (tx) => {
        if (existing.trackNumber == null) {
          const lastBooking = await tx.hajUmrahBooking.findFirst({
            where: { trackNumber: { not: null } },
            orderBy: { trackNumber: "desc" },
            select: { trackNumber: true },
          });
          updateData.trackNumber = (lastBooking?.trackNumber ?? 0) + 1;
        }
        if (packageLines !== undefined) {
          await tx.hajUmrahBookingPackage.deleteMany({ where: { bookingId: id } });
          for (const line of packageLines) {
            const pkgId = String(line.packageId ?? "").trim() || null;
            const packageName = String(line.packageName ?? "").trim() || "Package";
            const quantity = Math.max(1, Number(line.quantity) || 1);
            const unitPrice = Number(line.unitPrice);
            if (Number.isNaN(unitPrice) || unitPrice < 0) continue;
            const amount = unitPrice * quantity;
            await tx.$executeRaw`
              INSERT INTO haj_umrah_booking_packages (id, booking_id, package_id, package_name, quantity, unit_price, amount)
              VALUES (${randomUUID()}, ${id}, ${pkgId}, ${packageName}, ${quantity}, ${unitPrice}, ${amount})
            `;
          }
        }
        if (canceledAt) {
          await tx.payment.updateMany({
            where: { hajUmrahBookingId: id },
            data: { status: "refunded" },
          });
          await tx.payable.updateMany({
            where: { hajUmrahBookingId: id },
            data: { canceledAt },
          });
        }
        return tx.hajUmrahBooking.update({
          where: { id },
          data: updateData,
          include: {
            customer: true,
            campaign: { include: { leader: { select: { id: true, name: true, email: true } } } },
            packages: true,
          },
        });
      },
      { timeout: 15000 }
    );
    const packagesTotal = booking.packages.reduce((sum, bp) => sum + Number(bp.amount), 0);
    const profitAmount = booking.profit != null ? Number(booking.profit) : 0;
    const totalAmount = packagesTotal + profitAmount;

    // When booking is confirmed, create or update payment to match total (packages + profit)
    if (status === "confirmed" && totalAmount > 0 && booking.customer) {
      const existingActivePayment = await prisma.payment.findFirst({
        where: { hajUmrahBookingId: booking.id, status: { not: "refunded" } },
      });
      if (!existingActivePayment) {
        const trackDisplay =
          booking.trackNumber != null
            ? booking.trackNumber < 1000
              ? String(booking.trackNumber).padStart(3, "0")
              : String(booking.trackNumber)
            : "";
        const payment = await prisma.payment.create({
          data: {
            tenantId: booking.tenantId,
            date: booking.date,
            month: booking.month,
            paymentDate: new Date(), // current date when booking is confirmed
            status: "pending",
            name: trackDisplay ? `Haj & Umrah #${trackDisplay}` : "Haj & Umrah",
            description: booking.customer.name ? `Customer: ${booking.customer.name}` : null,
            amount: totalAmount,
            hajUmrahBookingId: booking.id,
          },
        });
        trigger(EVENTS.PAYMENT_CREATED, { payment }).catch(() => {});
      } else if (Number(existingActivePayment.amount) !== totalAmount) {
        // Sync payment amount when booking total changes (e.g. profit added or packages updated)
        await prisma.payment.update({
          where: { id: existingActivePayment.id },
          data: { amount: totalAmount },
        });
      }
    }

    return NextResponse.json({
      id: booking.id,
      trackNumber: booking.trackNumber,
      campaignId: booking.campaignId,
      campaign: booking.campaign
        ? {
            id: booking.campaign.id,
            date: booking.campaign.date.toISOString(),
            month: booking.campaign.month,
            name: booking.campaign.name,
            type: booking.campaign.type,
            leaderId: booking.campaign.leaderId ?? null,
            leader: booking.campaign.leader ? { id: booking.campaign.leader.id, name: booking.campaign.leader.name, email: booking.campaign.leader.email } : null,
          }
        : null,
      customerId: booking.customerId,
      customer: booking.customer,
      date: booking.date.toISOString(),
      month: booking.month,
      status: booking.status,
      notes: booking.notes,
      canceledAt: booking.canceledAt?.toISOString() ?? null,
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
    console.error("Haj Umrah booking PATCH error:", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
