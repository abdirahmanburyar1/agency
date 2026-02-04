import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { PERMISSION } from "@/lib/permissions";
import { handleAuthError } from "@/lib/api-auth";

/** GET /api/haj-umrah/campaigns/mine – campaigns where current user is the leader. Requires HAJ_UMRAH_LEADER. */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const permissions = (session.user as { permissions?: string[] }).permissions ?? [];
  if (!permissions.includes(PERMISSION.HAJ_UMRAH_LEADER)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const campaigns = await prisma.hajUmrahCampaign.findMany({
      where: { leaderId: userId },
      orderBy: { date: "desc" },
      include: {
        _count: { select: { bookings: true } },
        leader: { select: { id: true, name: true, email: true } },
      },
    });
    return NextResponse.json(
      campaigns.map((c) => ({
        id: c.id,
        date: c.date.toISOString(),
        month: c.month,
        name: c.name,
        type: c.type,
        leaderId: c.leaderId ?? null,
        leader: c.leader ? { id: c.leader.id, name: c.leader.name, email: c.leader.email } : null,
        canceledAt: c.canceledAt?.toISOString() ?? null,
        createdAt: c.createdAt.toISOString(),
        bookingCount: c._count.bookings,
      }))
    );
  } catch (error) {
    console.error("Haj Umrah campaigns mine GET error:", error);
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}
