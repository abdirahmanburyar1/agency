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
    await requirePermission(PERMISSION.PAYABLES_EDIT);
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }
  try {
    const { id: payableId, paymentId } = await params;

    const payment = await prisma.payablePayment.findUnique({
      where: { id: paymentId },
      include: { payable: true },
    });
    if (!payment) {
      return NextResponse.json({ error: "Payable payment not found" }, { status: 404 });
    }
    if (payment.payableId !== payableId) {
      return NextResponse.json({ error: "Payable payment not found" }, { status: 404 });
    }
    if (payment.status !== "approved") {
      return NextResponse.json(
        { error: "Payment must be approved by General Director before marking as paid" },
        { status: 400 }
      );
    }

    const balance = Number(payment.payable.balance);
    const amount = Number(payment.amount);
    if (amount > balance) {
      return NextResponse.json(
        { error: `Payable balance ($${balance.toLocaleString()}) is less than payment amount. Please reconcile.` },
        { status: 400 }
      );
    }

    const session = await auth();
    const paidBy = session?.user?.name?.trim() || session?.user?.email || null;

    await prisma.$transaction([
      prisma.payablePayment.update({
        where: { id: paymentId },
        data: { status: "paid", paidBy, paidAt: new Date() },
      }),
      prisma.payable.update({
        where: { id: payableId },
        data: { balance: balance - amount },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Mark payable payment paid error:", error);
    return NextResponse.json(
      { error: "Failed to mark payment as paid" },
      { status: 500 }
    );
  }
}
