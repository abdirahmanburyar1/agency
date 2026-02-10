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
    const availableOnly = searchParams.get("available") === "true";
    const now = new Date();
    const campaigns = await prisma.hajUmrahCampaign.findMany({
      where: availableOnly
        ? { date: { gt: now }, canceledAt: null }
        : undefined,
      orderBy: { date: availableOnly ? "asc" : "desc" },
      include: {
        _count: { select: { bookings: true } },
        leader: { select: { id: true, name: true, email: true } },
      },
    });
    return NextResponse.json(
      campaigns.map((c) => ({
        id: c.id,
        date: c.date.toISOString(),
        returnDate: c.returnDate?.toISOString() ?? null,
        month: c.month,
        name: c.name,
        type: c.type,
        leaderId: c.leaderId ?? null,
        leader: c.leader ? { id: c.leader.id, name: c.leader.name, email: c.leader.email } : null,
        canceledAt: c.canceledAt?.toISOString() ?? null,
        createdAt: c.createdAt.toISOString(),
        bookingCount: c._count.bookings,
        available: !c.canceledAt && c.date > now,
      }))
    );
  } catch (error) {
    console.error("Haj Umrah campaigns GET error:", error);
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
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
    const date = body.date ? new Date(body.date) : new Date();
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const returnDate = body.returnDate ? new Date(body.returnDate) : null;
    const name = body.name ? String(body.name).trim() || null : null;
    const type = body.type ? String(body.type).toLowerCase() : null;
    if (type && type !== "haj" && type !== "umrah") {
      return NextResponse.json({ error: "Type must be haj or umrah" }, { status: 400 });
    }
    const leaderId = body.leaderId != null ? (body.leaderId === "" ? null : String(body.leaderId).trim()) : null;
    if (leaderId) {
      const user = await prisma.user.findUnique({ where: { id: leaderId }, select: { id: true } });
      if (!user) return NextResponse.json({ error: "Invalid leader user" }, { status: 400 });
    }
    const session = await auth();
    const tenantId = getTenantIdFromSession(session);
    const campaign = await prisma.hajUmrahCampaign.create({
      data: { tenantId, date, month, returnDate, name, type, leaderId },
      include: { leader: { select: { id: true, name: true, email: true } } },
    });
    return NextResponse.json({
      id: campaign.id,
      date: campaign.date.toISOString(),
      returnDate: campaign.returnDate?.toISOString() ?? null,
      month: campaign.month,
      name: campaign.name,
      type: campaign.type,
      leaderId: campaign.leaderId ?? null,
      leader: campaign.leader ? { id: campaign.leader.id, name: campaign.leader.name, email: campaign.leader.email } : null,
      createdAt: campaign.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Haj Umrah campaign POST error:", error);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
