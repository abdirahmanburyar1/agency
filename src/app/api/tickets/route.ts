import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { trigger, EVENTS } from "@/lib/pusher";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { handleAuthError } from "@/lib/api-auth";
import { auth } from "@/auth";
import { getTenantIdFromSession } from "@/lib/tenant";

export async function GET() {
  try {
    await requirePermission(PERMISSION.TICKETS_VIEW);
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }
  try {
    const session = await auth();
    const tenantId = getTenantIdFromSession(session);
    
    const tickets = await prisma.ticket.findMany({
      where: {
        tenantId, // SCOPE BY TENANT
      },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Tickets GET error:", error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission(PERMISSION.TICKETS_CREATE);
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }
  try {
    const session = await auth();
    const tenantId = getTenantIdFromSession(session);
    const sponsor = session?.user?.name?.trim() || session?.user?.email || null;

    const body = await request.json();
    const referenceTrimmed = (body.reference ?? "").trim();
    if (!referenceTrimmed) {
      return NextResponse.json({ error: "Reference is required" }, { status: 400 });
    }
    let customerName: string | null = body.customerName ?? null;
    const customerId: string | null = body.customerId ?? null;
    if (customerId) {
      const c = await prisma.customer.findUnique({ where: { id: customerId } });
      customerName = c?.name ?? customerName;
    }

    const netCostNum = Number(body.netCost ?? 0);
    const netSalesNum = Number(body.netSales ?? 0);
    if (netSalesNum < netCostNum) {
      return NextResponse.json(
        { error: "Net sales cannot be less than net cost" },
        { status: 400 }
      );
    }

    // Generate next sequential ticket number (1, 2, 3, ...)
    const lastTicket = await prisma.ticket.findFirst({
      where: { ticketNumber: { not: null } },
      orderBy: { ticketNumber: "desc" },
      select: { ticketNumber: true },
    });
    const nextTicketNumber = (lastTicket?.ticketNumber ?? 0) + 1;

    const ticket = await prisma.ticket.create({
      data: {
        tenantId,
        ticketNumber: nextTicketNumber,
        reference: referenceTrimmed,
        date: new Date(body.date),
        month: body.month,
        sponsor,
        customerId: customerId || undefined,
        customerName,
        airline: body.airline,
        route: body.route,
        flight: body.flight,
        departure: body.departure ? new Date(body.departure) : null,
        return: body.return ? new Date(body.return) : null,
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
          tenantId,
          date: new Date(body.date),
          month: body.month,
          name: body.airline ? `Ticket: ${body.airline}` : "Ticket",
          description: customerName ? `Customer: ${customerName}` : null,
          amount: netCost,
          balance: netCost,
          ticketId: ticket.id,
        },
      });
    }

    // Payment: customer owes us (netSales) - generated when customer exists
    // paymentDate: departure > return > ticket date (for reports/grouping by trip)
    const paymentDate =
      body.departure ? new Date(body.departure)
      : body.return ? new Date(body.return)
      : new Date(body.date);

    const netSales = Number(body.netSales ?? 0);
    if (netSales > 0 && (customerId || customerName)) {
      await prisma.payment.create({
        data: {
          tenantId,
          date: new Date(body.date),
          month: body.month,
          paymentDate,
          status: "pending",
          name: body.airline ? `Ticket: ${body.airline}` : "Ticket",
          description: customerName ? `Customer: ${customerName}` : null,
          amount: netSales,
          ticketId: ticket.id,
        },
      });
    }

    trigger(EVENTS.TICKET_CREATED, { ticket }).catch(() => {});
    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Tickets POST error:", error);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}
