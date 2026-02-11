import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const isPlatformAdmin = (session?.user as { isPlatformAdmin?: boolean })?.isPlatformAdmin;

  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: params.id },
    include: {
      subscriptions: {
        include: {
          plan: true,
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: {
        select: {
          users: true,
          customers: true,
          tickets: true,
          visas: true,
          hajUmrahBookings: true,
        },
      },
    },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  return NextResponse.json(tenant);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const isPlatformAdmin = (session?.user as { isPlatformAdmin?: boolean })?.isPlatformAdmin;

  if (!isPlatformAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    name,
    status,
    contactName,
    contactEmail,
    contactPhone,
    companyAddress,
    companyCity,
    companyCountry,
    taxId,
    businessType,
    websiteUrl,
    notes,
  } = body;

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (status !== undefined) updateData.status = status;
  if (contactName !== undefined) updateData.contactName = contactName;
  if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
  if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
  if (companyAddress !== undefined) updateData.companyAddress = companyAddress;
  if (companyCity !== undefined) updateData.companyCity = companyCity;
  if (companyCountry !== undefined) updateData.companyCountry = companyCountry;
  if (taxId !== undefined) updateData.taxId = taxId;
  if (businessType !== undefined) updateData.businessType = businessType;
  if (websiteUrl !== undefined) updateData.websiteUrl = websiteUrl;
  if (notes !== undefined) updateData.notes = notes;

  const tenant = await prisma.tenant.update({
    where: { id: params.id },
    data: updateData,
    include: {
      subscriptions: {
        include: {
          plan: true,
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return NextResponse.json(tenant);
}
