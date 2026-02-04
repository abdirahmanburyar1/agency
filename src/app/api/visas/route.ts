import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { trigger, EVENTS } from "@/lib/pusher";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { handleAuthError } from "@/lib/api-auth";

export async function GET() {
  try {
    const visas = await prisma.visa.findMany({
      orderBy: { date: "desc" },
    });
    return NextResponse.json(visas);
  } catch (error) {
    console.error("Visas GET error:", error);
    return NextResponse.json({ error: "Failed to fetch visas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission(PERMISSION.VISAS_CREATE);
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }
  try {
    const body = await request.json();
    let customer: string | null = body.customer ?? null;
    const customerId: string | null = body.customerId ?? null;
    if (customerId) {
      const c = await prisma.customer.findUnique({ where: { id: customerId } });
      customer = c?.name ?? customer;
    }

    const netCostNum = Number(body.netCost ?? 0);
    const netSalesNum = Number(body.netSales ?? 0);
    if (netSalesNum < netCostNum) {
      return NextResponse.json(
        { error: "Net sales cannot be less than net cost" },
        { status: 400 }
      );
    }

    const visaNumber = body.visaNumber != null ? Number(body.visaNumber) : null;
    const reference = String(body.reference ?? "").trim();
    if (!reference) {
      return NextResponse.json(
        { error: "Reference is required" },
        { status: 400 }
      );
    }

    const visa = await prisma.visa.create({
      data: {
        date: new Date(body.date),
        month: body.month,
        sponsor: body.sponsor,
        customerId: customerId || undefined,
        customer,
        country: body.country,
        visaNumber: visaNumber || undefined,
        reference,
        netCost: body.netCost,
        netSales: body.netSales,
        profit: body.profit,
      },
    });

    // Payable: what we owe (cost) - created in Payables section only
    const netCost = Number(body.netCost ?? 0);
    if (netCost > 0) {
      await prisma.payable.create({
        data: {
          date: new Date(body.date),
          month: body.month,
          name: body.country ? `Visa: ${body.country}` : "Visa",
          description: customer ? `Customer: ${customer}` : null,
          amount: netCost,
          balance: netCost,
          visaId: visa.id,
        },
      });
    }

    // Payment: customer owes us (netSales) - generated when customer exists
    const netSales = Number(body.netSales ?? 0);
    if (netSales > 0 && (customerId || customer)) {
      await prisma.payment.create({
        data: {
          date: new Date(body.date),
          month: body.month,
          status: "pending",
          name: body.country ? `Visa: ${body.country}` : "Visa",
          description: customer ? `Customer: ${customer}` : null,
          amount: netSales,
          visaId: visa.id,
        },
      });
    }

    trigger(EVENTS.VISA_CREATED, { visa }).catch(() => {});
    return NextResponse.json(visa);
  } catch (error) {
    console.error("Visas POST error:", error);
    return NextResponse.json({ error: "Failed to create visa" }, { status: 500 });
  }
}
