import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { handleAuthError } from "@/lib/api-auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(PERMISSION.PAYMENTS_VIEW);
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }
  try {
    const { id } = await params;
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        ticket: { include: { customer: true } },
        visa: { include: { customerRelation: true } },
        hajUmrahBooking: { include: { customer: true } },
        receipts: true,
      },
    });
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
    return NextResponse.json(payment);
  } catch (error) {
    console.error("Payment GET error:", error);
    return NextResponse.json({ error: "Failed to fetch payment" }, { status: 500 });
  }
}
