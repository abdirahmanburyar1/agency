import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { handleAuthError } from "@/lib/api-auth";
import { auth } from "@/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(PERMISSION.PAYABLES_VIEW);
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }
  try {
    const { id: payableId } = await params;
    const payments = await prisma.payablePayment.findMany({
      where: { payableId },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(payments);
  } catch (error) {
    console.error("Payable payments GET error:", error);
    return NextResponse.json({ error: "Failed to fetch payable payments" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(PERMISSION.PAYABLES_EDIT);
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }
  try {
    const { id: payableId } = await params;
    const body = await request.json();
    const amount = Number(body.amount ?? 0);
    const pMethod = body.pMethod?.trim();
    if (amount <= 0) {
      return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });
    }
    if (!pMethod) {
      return NextResponse.json({ error: "Payment method is required" }, { status: 400 });
    }

    const payable = await prisma.payable.findUnique({
      where: { id: payableId },
      include: { payments: true },
    });
    if (!payable) {
      return NextResponse.json({ error: "Payable not found" }, { status: 404 });
    }
    if (payable.canceledAt) {
      return NextResponse.json({ error: "Cannot record payment for a canceled payable" }, { status: 400 });
    }

    const balance = Number(payable.balance);
    const pendingOrApprovedTotal = payable.payments
      .filter((p) => p.status === "pending" || p.status === "approved")
      .reduce((s, p) => s + Number(p.amount), 0);
    const available = balance - pendingOrApprovedTotal;
    if (amount > available) {
      return NextResponse.json(
        { error: `Amount cannot exceed available balance. Available: $${Math.max(0, available).toLocaleString()}` },
        { status: 400 }
      );
    }

    const paymentDate = body.date ? new Date(body.date) : new Date();
    const session = await auth();
    const submittedBy = session?.user?.name?.trim() || session?.user?.email || null;

    const payablePayment = await prisma.payablePayment.create({
      data: {
        date: paymentDate,
        amount,
        pMethod,
        account: body.account ?? null,
        reference: body.reference?.trim() || null,
        status: "pending",
        submittedBy,
        payableId,
      },
    });

    return NextResponse.json(payablePayment);
  } catch (error) {
    console.error("Submit payable payment error:", error);
    return NextResponse.json(
      { error: "Failed to submit payable payment" },
      { status: 500 }
    );
  }
}
