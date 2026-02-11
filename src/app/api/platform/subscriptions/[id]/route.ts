import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const isPlatformAdmin = (session?.user as { isPlatformAdmin?: boolean })?.isPlatformAdmin;

  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: {
      tenant: true,
      plan: true,
      payments: {
        orderBy: { dueDate: "desc" },
      },
    },
  });

  if (!subscription) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  }

  return NextResponse.json(subscription);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const isPlatformAdmin = (session?.user as { isPlatformAdmin?: boolean })?.isPlatformAdmin;

  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { status, customPrice, notes, cancelAtPeriodEnd, autoRenew } = body;

  const updateData: any = {};
  if (status !== undefined) updateData.status = status;
  if (customPrice !== undefined) updateData.customPrice = customPrice ? parseFloat(customPrice) : null;
  if (notes !== undefined) updateData.notes = notes;
  if (cancelAtPeriodEnd !== undefined) updateData.cancelAtPeriodEnd = cancelAtPeriodEnd;
  if (autoRenew !== undefined) updateData.autoRenew = autoRenew;

  if (status === "canceled") {
    updateData.canceledAt = new Date();
  }

  const subscription = await prisma.subscription.update({
    where: { id },
    data: updateData,
    include: {
      tenant: true,
      plan: true,
    },
  });

  return NextResponse.json(subscription);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const isPlatformAdmin = (session?.user as { isPlatformAdmin?: boolean })?.isPlatformAdmin;

  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.subscription.delete({
    where: { id },
  });

  return NextResponse.json({ message: "Subscription deleted" });
}
