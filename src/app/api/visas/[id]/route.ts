import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { handleAuthError } from "@/lib/api-auth";
import { auth } from "@/auth";
import { getTenantIdFromSession } from "@/lib/tenant";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(PERMISSION.VISAS_VIEW);
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }
  try {
    const session = await auth();
    const tenantId = getTenantIdFromSession(session);
    const { id } = await params;
    
    const visa = await prisma.visa.findFirst({
      where: { 
        id,
        tenantId, // SCOPE BY TENANT - security check
      },
      include: { customerRelation: true },
    });
    if (!visa) {
      return NextResponse.json({ error: "Visa not found" }, { status: 404 });
    }
    return NextResponse.json(visa);
  } catch (error) {
    console.error("Visa GET error:", error);
    return NextResponse.json({ error: "Failed to fetch visa" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(PERMISSION.VISAS_EDIT);
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }
  try {
    const session = await auth();
    const tenantId = getTenantIdFromSession(session);
    const { id } = await params;
    const body = await request.json();
    const referenceTrimmed = String(body.reference ?? "").trim();

    if (!referenceTrimmed) {
      return NextResponse.json(
        { error: "Reference is required" },
        { status: 400 }
      );
    }

    const visa = await prisma.visa.findFirst({
      where: { 
        id,
        tenantId, // SCOPE BY TENANT - security check
      },
    });

    if (!visa) {
      return NextResponse.json({ error: "Visa not found" }, { status: 404 });
    }

    let customer: string | null = body.customer ?? visa.customer;
    const customerId: string | null = body.customerId ?? visa.customerId;
    if (customerId) {
      const c = await prisma.customer.findUnique({
        where: { id: customerId },
      });
      customer = c?.name ?? customer;
    }

    const netCostNum = Number(body.netCost ?? visa.netCost);
    const netSalesNum = Number(body.netSales ?? visa.netSales);
    const profit = netSalesNum - netCostNum;

    if (netSalesNum < netCostNum) {
      return NextResponse.json(
        { error: "Net sales cannot be less than net cost" },
        { status: 400 }
      );
    }
    if (netCostNum < 0 || netSalesNum < 0) {
      return NextResponse.json(
        { error: "Net cost and net sales cannot be negative" },
        { status: 400 }
      );
    }

    const updated = await prisma.visa.update({
      where: { id },
      data: {
        date: body.date ? new Date(body.date) : visa.date,
        month: body.month ?? visa.month,
        sponsor: body.sponsor ?? visa.sponsor,
        customerId: customerId ?? visa.customerId,
        customer,
        country: body.country ?? visa.country,
        reference: referenceTrimmed,
        netCost: netCostNum,
        netSales: netSalesNum,
        profit,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Visa PATCH error:", error);
    return NextResponse.json({ error: "Failed to update visa" }, { status: 500 });
  }
}
