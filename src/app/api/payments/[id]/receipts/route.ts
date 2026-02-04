import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { trigger, EVENTS } from "@/lib/pusher";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { handleAuthError } from "@/lib/api-auth";
import { auth } from "@/auth";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(PERMISSION.PAYMENTS_CREATE);
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }
  try {
    const { id: paymentId } = await params;
    const body = await request.json();
    const amount = Number(body.amount ?? 0);
    const pMethod = body.pMethod?.trim();
    if (amount <= 0) {
      return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });
    }
    if (!pMethod) {
      return NextResponse.json({ error: "Payment method is required" }, { status: 400 });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { receipts: true },
    });
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const totalReceived = payment.receipts.reduce(
      (sum, r) => sum + Number(r.amount),
      0
    );
    const expectedAmount = Number(payment.amount);
    const balance = expectedAmount - totalReceived;
    if (amount > balance) {
      return NextResponse.json(
        { error: `Paid amount cannot exceed expected amount. Balance remaining: $${balance.toLocaleString()}` },
        { status: 400 }
      );
    }

    const receiptDate = body.date ? new Date(body.date) : new Date();
    const newTotalReceived = totalReceived + amount;
    const newBalance = expectedAmount - newTotalReceived;
    const newStatus =
      newBalance <= 0 ? "paid" : newBalance < expectedAmount ? "partial" : "pending";

    // Clear expected date when payment is received; status becomes paid/partial
    const updateData: { status: string; expectedDate?: null } = { status: newStatus };
    updateData.expectedDate = null;

    const session = await auth();
    const userName = session?.user?.name?.trim();
    const userEmail = session?.user?.email;
    const receivedBy = userName || userEmail || body.receivedBy || null;

    const [receipt] = await prisma.$transaction([
      prisma.receipt.create({
        data: {
          date: receiptDate,
          amount,
          pMethod,
          account: body.account ?? null,
          receivedBy,
          paymentId,
        },
      }),
      prisma.payment.update({
        where: { id: paymentId },
        data: updateData,
      }),
    ]);

    trigger(EVENTS.RECEIPT_CREATED, { receipt }).catch(() => {});
    return NextResponse.json(receipt);
  } catch (error) {
    console.error("Record receipt error:", error);
    return NextResponse.json(
      { error: "Failed to record receipt" },
      { status: 500 }
    );
  }
}
