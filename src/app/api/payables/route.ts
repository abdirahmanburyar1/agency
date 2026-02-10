import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { trigger, EVENTS } from "@/lib/pusher";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { handleAuthError } from "@/lib/api-auth";
import { getTenantIdFromSession } from "@/lib/tenant";

export async function GET() {
  try {
    const payables = await prisma.payable.findMany({
      where: { canceledAt: null },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(payables);
  } catch (error) {
    console.error("Payables GET error:", error);
    return NextResponse.json({ error: "Failed to fetch payables" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission(PERMISSION.PAYABLES_CREATE);
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }
  try {
    const session = await auth();
    const tenantId = getTenantIdFromSession(session);
    const body = await request.json();
    const payable = await prisma.payable.create({
      data: {
        tenantId,
        date: new Date(body.date),
        month: body.month,
        invoice: body.invoice,
        name: body.name,
        description: body.description,
        amount: body.amount,
        balance: body.balance,
        deadline: body.deadline ? new Date(body.deadline) : null,
        remaining: body.remaining,
        ticketId: body.ticketId || undefined,
        visaId: body.visaId || undefined,
      },
    });
    trigger(EVENTS.PAYABLE_CREATED, { payable }).catch(() => {});
    return NextResponse.json(payable);
  } catch (error) {
    console.error("Payables POST error:", error);
    return NextResponse.json({ error: "Failed to create payable" }, { status: 500 });
  }
}
