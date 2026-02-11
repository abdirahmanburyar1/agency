import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  const isPlatformAdmin = (session?.user as { isPlatformAdmin?: boolean })?.isPlatformAdmin;

  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId");
  const subscriptionId = searchParams.get("subscriptionId");
  const status = searchParams.get("status");

  const where: any = {};
  if (tenantId) where.tenantId = tenantId;
  if (subscriptionId) where.subscriptionId = subscriptionId;
  if (status) where.status = status;

  const payments = await prisma.subscriptionPayment.findMany({
    where,
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          subdomain: true,
        },
      },
      subscription: {
        include: {
          plan: true,
        },
      },
    },
    orderBy: { dueDate: "desc" },
  });

  return NextResponse.json(payments);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const isPlatformAdmin = (session?.user as { isPlatformAdmin?: boolean })?.isPlatformAdmin;

  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    subscriptionId,
    tenantId,
    amount,
    currency,
    dueDate,
    periodStart,
    periodEnd,
    notes,
  } = body;

  // Generate invoice number
  const lastPayment = await prisma.subscriptionPayment.findFirst({
    orderBy: { createdAt: "desc" },
    select: { invoiceNumber: true },
  });

  let invoiceNumber = "INV-0001";
  if (lastPayment?.invoiceNumber) {
    const lastNumber = parseInt(lastPayment.invoiceNumber.split("-")[1]);
    invoiceNumber = `INV-${String(lastNumber + 1).padStart(4, "0")}`;
  }

  const payment = await prisma.subscriptionPayment.create({
    data: {
      subscriptionId,
      tenantId,
      amount: parseFloat(amount),
      currency: currency || "USD",
      status: "pending",
      dueDate: new Date(dueDate),
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      invoiceNumber,
      notes,
    },
    include: {
      tenant: true,
      subscription: {
        include: {
          plan: true,
        },
      },
    },
  });

  return NextResponse.json(payment, { status: 201 });
}
