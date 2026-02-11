import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const isPlatformAdmin = (session?.user as { isPlatformAdmin?: boolean })?.isPlatformAdmin;

  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { status, paidDate, paymentMethod, transactionId, notes } = body;

  const updateData: any = {};
  if (status !== undefined) updateData.status = status;
  if (paidDate !== undefined) updateData.paidDate = paidDate ? new Date(paidDate) : null;
  if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
  if (transactionId !== undefined) updateData.transactionId = transactionId;
  if (notes !== undefined) updateData.notes = notes;

  // Auto-set paidDate if status is being set to "paid"
  if (status === "paid" && !paidDate) {
    updateData.paidDate = new Date();
  }

  const payment = await prisma.subscriptionPayment.update({
    where: { id: params.id },
    data: updateData,
    include: {
      tenant: true,
      subscription: {
        include: {
          plan: true,
        },
      },
    },
  });

  return NextResponse.json(payment);
}
