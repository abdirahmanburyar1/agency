import { NextResponse } from "next/server";
import type { PrismaPromise } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { handleAuthError } from "@/lib/api-auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(PERMISSION.TICKETS_EDIT);
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }
  try {
    const { id } = await params;
    const body = await request.json();
    const referenceTrimmed = (body.reference ?? "").trim();

    if (!referenceTrimmed) {
      return NextResponse.json(
        { error: "Reference is required" },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: { payments: true, payables: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }
    if (ticket.canceledAt) {
      return NextResponse.json(
        { error: "Cannot edit a canceled ticket" },
        { status: 400 }
      );
    }

    let customerName: string | null = body.customerName ?? ticket.customerName;
    const customerId: string | null = body.customerId ?? ticket.customerId;
    if (customerId) {
      const c = await prisma.customer.findUnique({
        where: { id: customerId },
      });
      customerName = c?.name ?? customerName;
    }

    const newNetCost = Number(body.netCost ?? ticket.netCost);
    const newNetSales = Number(body.netSales ?? ticket.netSales);
    const newProfit = newNetSales - newNetCost;

    if (newNetSales < 0) {
      return NextResponse.json(
        { error: "Net sales cannot be negative" },
        { status: 400 }
      );
    }
    if (newNetCost < 0) {
      return NextResponse.json(
        { error: "Net cost cannot be negative" },
        { status: 400 }
      );
    }
    if (newNetSales < newNetCost) {
      return NextResponse.json(
        { error: "Net sales cannot be less than net cost" },
        { status: 400 }
      );
    }

    const payment = ticket.payments.find((p) => !p.canceledAt);
    if (payment && newNetSales > 0) {
      const totalReceived = await prisma.receipt
        .aggregate({
          where: { paymentId: payment.id },
          _sum: { amount: true },
        })
        .then((r) => Number(r._sum.amount ?? 0));

      if (newNetSales < totalReceived) {
        return NextResponse.json(
          {
            error: `New amount ($${newNetSales.toLocaleString()}) cannot be less than amount already received ($${totalReceived.toLocaleString()}).`,
          },
          { status: 400 }
        );
      }
    }

    const updateData = {
      reference: referenceTrimmed,
      date: body.date ? new Date(body.date) : ticket.date,
      month: body.month ?? ticket.month,
      customerId: customerId || null,
      customerName,
      airline: body.airline ?? ticket.airline,
      route: body.route ?? ticket.route,
      flight: body.flight ?? ticket.flight,
      departure: body.departure ? new Date(body.departure) : null,
      return: body.return ? new Date(body.return) : null,
      netCost: newNetCost,
      netSales: newNetSales,
      profit: newProfit,
    };

    const ops: PrismaPromise<unknown>[] = [
      prisma.ticket.update({
        where: { id },
        data: updateData,
      }),
    ];

    if (payment) {
      ops.push(
        prisma.payment.update({
          where: { id: payment.id },
          data: { amount: newNetSales },
        })
      );
    } else if (newNetSales > 0 && (customerId || customerName)) {
      const paymentDate =
        body.departure ? new Date(body.departure)
        : body.return ? new Date(body.return)
        : body.date ? new Date(body.date) : ticket.date;

      ops.push(
        prisma.payment.create({
          data: {
            tenantId: ticket.tenantId,
            date: body.date ? new Date(body.date) : ticket.date,
            month: body.month ?? ticket.month,
            paymentDate,
            status: "pending",
            name: (body.airline ?? ticket.airline)
              ? `Ticket: ${body.airline ?? ticket.airline}`
              : "Ticket",
            description: customerName ?? null,
            amount: newNetSales,
            ticketId: id,
          },
        })
      );
    }

    const mainPayable = ticket.payables.find((p) => p.ticketId === id);
    if (newNetCost > 0) {
      if (mainPayable) {
        const oldAmount = Number(mainPayable.amount);
        const oldBalance = Number(mainPayable.balance);
        const totalPaid = oldAmount - oldBalance;
        const newBalance = Math.max(0, newNetCost - totalPaid);
        ops.push(
          prisma.payable.update({
            where: { id: mainPayable.id },
            data: {
              amount: newNetCost,
              balance: newBalance,
              date: body.date ? new Date(body.date) : mainPayable.date,
              month: body.month ?? mainPayable.month,
            },
          })
        );
      } else {
        ops.push(
          prisma.payable.create({
            data: {
              tenantId: ticket.tenantId,
              date: body.date ? new Date(body.date) : ticket.date,
              month: body.month ?? ticket.month,
              name: (body.airline ?? ticket.airline)
                ? `Ticket: ${body.airline ?? ticket.airline}`
                : "Ticket",
              description: customerName ?? null,
              amount: newNetCost,
              balance: newNetCost,
              ticketId: id,
            },
          })
        );
      }
    } else if (mainPayable) {
      ops.push(
        prisma.payable.update({
          where: { id: mainPayable.id },
          data: { amount: 0, balance: 0 },
        })
      );
    }

    const [updated] = await prisma.$transaction(ops);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Ticket PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update ticket" },
      { status: 500 }
    );
  }
}
