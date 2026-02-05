import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { handleAuthError } from "@/lib/api-auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const permissions = (session.user as { permissions?: string[] }).permissions ?? [];
  const hasView = permissions.includes(PERMISSION.HAJ_UMRAH_VIEW);
  const hasLeader = permissions.includes(PERMISSION.HAJ_UMRAH_LEADER);
  if (!hasView && !hasLeader) {
    const res = handleAuthError(new Error("Forbidden"));
    if (res) return res;
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const { id } = await params;
    const campaign = await prisma.hajUmrahCampaign.findUnique({
      where: { id },
      include: {
        leader: { select: { id: true, name: true, email: true } },
        bookings: {
          where: { canceledAt: null },
          include: { customer: true, packages: { include: { package: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    if (hasLeader && !hasView && campaign.leaderId !== (session.user as { id?: string }).id) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }
    return NextResponse.json({
      id: campaign.id,
      date: campaign.date.toISOString(),
      month: campaign.month,
      name: campaign.name,
      type: campaign.type,
      leaderId: campaign.leaderId ?? null,
      leader: campaign.leader ? { id: campaign.leader.id, name: campaign.leader.name, email: campaign.leader.email } : null,
      canceledAt: campaign.canceledAt?.toISOString() ?? null,
      createdAt: campaign.createdAt.toISOString(),
      bookings: campaign.bookings.map((b) => ({
        id: b.id,
        trackNumber: b.trackNumber,
        trackNumberDisplay: b.trackNumber != null ? (b.trackNumber < 1000 ? String(b.trackNumber).padStart(3, "0") : String(b.trackNumber)) : "—",
        customerId: b.customerId,
        customerName: b.customer.name,
        customerPhone: b.customer.phone,
        date: b.date.toISOString(),
        status: b.status,
        canceledAt: b.canceledAt?.toISOString() ?? null,
        packageCount: b.packages.reduce((s, bp) => s + bp.quantity, 0),
        totalAmount: b.packages.reduce((sum, bp) => sum + Number(bp.amount), 0),
      })),
    });
  } catch (error) {
    console.error("Haj Umrah campaign GET error:", error);
    return NextResponse.json({ error: "Failed to fetch campaign" }, { status: 500 });
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

    if (body.cancel === true) {
      const campaign = await prisma.hajUmrahCampaign.findUnique({
        where: { id },
        select: { date: true },
      });
      if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
      const canceledAt = new Date();
      if (campaign.date <= canceledAt) {
        return NextResponse.json(
          { error: "Cannot cancel campaign after the departure date and time has passed." },
          { status: 400 }
        );
      }
      const bookings = await prisma.hajUmrahBooking.findMany({
        where: { campaignId: id },
        select: { id: true },
      });
      const bookingIds = bookings.map((b) => b.id);
      await prisma.$transaction([
        prisma.hajUmrahCampaign.update({
          where: { id },
          data: { canceledAt },
        }),
        prisma.hajUmrahBooking.updateMany({
          where: { campaignId: id },
          data: { status: "canceled", canceledAt },
        }),
        prisma.payment.updateMany({
          where: { hajUmrahBookingId: { in: bookingIds } },
          data: { canceledAt, status: "refunded" },
        }),
        prisma.payable.updateMany({
          where: { hajUmrahBookingId: { in: bookingIds } },
          data: { canceledAt },
        }),
      ]);
      return NextResponse.json({ ok: true, canceled: true });
    }

    // Update campaign fields (date, name, type, leaderId)
    const campaign = await prisma.hajUmrahCampaign.findUnique({ where: { id }, select: { canceledAt: true, date: true } });
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    if (campaign.canceledAt) return NextResponse.json({ error: "Cannot edit a canceled campaign" }, { status: 400 });
    const now = new Date();
    if (campaign.date <= now) return NextResponse.json({ error: "Campaign departure date and time have passed. It can no longer be edited." }, { status: 400 });

    const updateData: { date?: Date; month?: string; name?: string | null; type?: string | null; leaderId?: string | null } = {};
    if (body.date != null) {
      const date = new Date(body.date);
      updateData.date = date;
      updateData.month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    }
    if (body.name !== undefined) updateData.name = body.name ? String(body.name).trim() || null : null;
    if (body.type !== undefined) {
      const type = body.type ? String(body.type).toLowerCase() : null;
      if (type && type !== "haj" && type !== "umrah") {
        return NextResponse.json({ error: "Type must be haj or umrah" }, { status: 400 });
      }
      updateData.type = type;
    }
    if (body.leaderId !== undefined) {
      const leaderId = body.leaderId === "" || body.leaderId == null ? null : String(body.leaderId).trim();
      if (leaderId) {
        const user = await prisma.user.findUnique({ where: { id: leaderId }, select: { id: true } });
        if (!user) return NextResponse.json({ error: "Invalid leader user" }, { status: 400 });
      }
      updateData.leaderId = leaderId;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const updated = await prisma.hajUmrahCampaign.update({
      where: { id },
      data: updateData,
      include: { leader: { select: { id: true, name: true, email: true } } },
    });
    return NextResponse.json({
      id: updated.id,
      date: updated.date.toISOString(),
      month: updated.month,
      name: updated.name,
      type: updated.type,
      leaderId: updated.leaderId ?? null,
      leader: updated.leader ? { id: updated.leader.id, name: updated.leader.name, email: updated.leader.email } : null,
      canceledAt: updated.canceledAt?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Haj Umrah campaign PATCH error:", error);
    return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
  }
}
