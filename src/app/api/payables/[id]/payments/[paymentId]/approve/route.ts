import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { handleAuthError } from "@/lib/api-auth";
import { auth } from "@/auth";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  try {
    await requirePermission(PERMISSION.PAYABLES_APPROVE);
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }
  try {
    const { paymentId } = await params;

    const payment = await prisma.payablePayment.findUnique({
      where: { id: paymentId },
      include: { payable: true },
    });
    if (!payment) {
      return NextResponse.json({ error: "Payable payment not found" }, { status: 404 });
    }
    if (payment.status !== "pending") {
      return NextResponse.json(
        { error: `Cannot approve: payment is already ${payment.status}` },
        { status: 400 }
      );
    }

    const session = await auth();
    const approvedBy = session?.user?.name?.trim() || session?.user?.email || null;

    await prisma.payablePayment.update({
      where: { id: paymentId },
      data: { status: "approved", approvedBy, approvedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Approve payable payment error:", error);
    return NextResponse.json(
      { error: "Failed to approve payable payment" },
      { status: 500 }
    );
  }
}
