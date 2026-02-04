import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { handleAuthError } from "@/lib/api-auth";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(PERMISSION.TICKETS_EDIT);
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }
  try {
    const { id } = await params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { payments: true, payables: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (ticket.canceledAt) {
      return NextResponse.json(
        { error: "Ticket is already canceled" },
        { status: 400 }
      );
    }

    const now = new Date();

    await prisma.$transaction([
      prisma.ticket.update({
        where: { id },
        data: { canceledAt: now },
      }),
      ...ticket.payments.map((p) =>
        prisma.payment.update({
          where: { id: p.id },
          data: { canceledAt: now },
        })
      ),
      ...ticket.payables.map((p) =>
        prisma.payable.update({
          where: { id: p.id },
          data: { canceledAt: now },
        })
      ),
    ]);

    return NextResponse.json({ success: true, canceledAt: now });
  } catch (error) {
    console.error("Cancel ticket error:", error);
    return NextResponse.json(
      { error: "Failed to cancel ticket" },
      { status: 500 }
    );
  }
}
