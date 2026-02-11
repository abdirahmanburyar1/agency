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
  const status = searchParams.get("status");

  const where: any = {};
  if (tenantId) where.tenantId = tenantId;
  if (status) where.status = status;

  const subscriptions = await prisma.subscription.findMany({
    where,
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          subdomain: true,
          contactEmail: true,
        },
      },
      plan: true,
      _count: {
        select: {
          payments: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(subscriptions);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const isPlatformAdmin = (session?.user as { isPlatformAdmin?: boolean })?.isPlatformAdmin;

  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { tenantId, planId, status, customPrice, notes } = body;

  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const now = new Date();
  const trialEndDate = new Date(now);
  trialEndDate.setDate(trialEndDate.getDate() + (plan.trialDays || 14));

  const currentPeriodEnd = new Date(now);
  // Set period end based on billing interval
  if (plan.billingInterval === "monthly") {
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
  } else if (plan.billingInterval === "quarterly") {
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 3);
  } else if (plan.billingInterval === "yearly") {
    currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
  }

  const subscription = await prisma.subscription.create({
    data: {
      tenantId,
      planId,
      status: status || "trial",
      startDate: now,
      trialEndDate: status === "trial" ? trialEndDate : null,
      currentPeriodStart: now,
      currentPeriodEnd,
      customPrice: customPrice ? parseFloat(customPrice) : null,
      notes,
      autoRenew: true,
    },
    include: {
      plan: true,
      tenant: true,
    },
  });

  return NextResponse.json(subscription, { status: 201 });
}
