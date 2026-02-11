import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  const isPlatformAdmin = (session?.user as { isPlatformAdmin?: boolean })?.isPlatformAdmin;

  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: {
          subscriptions: true,
        },
      },
    },
  });

  return NextResponse.json(plans);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const isPlatformAdmin = (session?.user as { isPlatformAdmin?: boolean })?.isPlatformAdmin;

  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    name,
    displayName,
    description,
    price,
    billingInterval,
    features,
    maxUsers,
    maxStorage,
    trialDays,
    setupFee,
    sortOrder,
  } = body;

  const plan = await prisma.subscriptionPlan.create({
    data: {
      name,
      displayName,
      description,
      price: parseFloat(price),
      billingInterval,
      features: features ? JSON.stringify(features) : null,
      maxUsers: maxUsers ? parseInt(maxUsers) : null,
      maxStorage: maxStorage ? parseInt(maxStorage) : null,
      trialDays: trialDays ? parseInt(trialDays) : 0,
      setupFee: setupFee ? parseFloat(setupFee) : 0,
      sortOrder: sortOrder ? parseInt(sortOrder) : 0,
      isActive: true,
    },
  });

  return NextResponse.json(plan, { status: 201 });
}
