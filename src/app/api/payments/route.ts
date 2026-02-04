import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { trigger, EVENTS } from "@/lib/pusher";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { handleAuthError } from "@/lib/api-auth";

export async function GET() {
  try {
    await requirePermission(PERMISSION.PAYMENTS_VIEW);
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { date: "desc" },
    });
    return NextResponse.json(payments);
  } catch (error) {
    console.error("Payments GET error:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission(PERMISSION.PAYMENTS_CREATE);
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }
  try {
    const body = await request.json();
    const payment = await prisma.payment.create({
      data: {
        date: new Date(body.date),
        month: body.month,
        status: body.status ?? "pending",
        name: body.name,
        description: body.description,
        amount: body.amount,
        ticketId: body.ticketId ?? undefined,
        visaId: body.visaId ?? undefined,
        hajUmrahBookingId: body.hajUmrahBookingId ?? undefined,
      },
    });
    trigger(EVENTS.PAYMENT_CREATED, { payment }).catch(() => {});
    return NextResponse.json(payment);
  } catch (error) {
    console.error("Payments POST error:", error);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
