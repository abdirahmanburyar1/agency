import { NextResponse } from "next/server";
import type { PrismaPromise } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { handleAuthError } from "@/lib/api-auth";

export async function POST(
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
    const { id: ticketId } = await params;
    const body = await request.json();
    const newNetSales = Number(body.newNetSales ?? 0);
    const newNetCost = Number(body.newNetCost ?? 0);
    const reason = body.reason?.trim() || null;

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

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { payments: true, payables: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }
    if (ticket.canceledAt) {
      return NextResponse.json(
        { error: "Cannot adjust a canceled ticket" },
        { status: 400 }
      );
    }

    const previousNetSales = Number(ticket.netSales);
    const previousNetCost = Number(ticket.netCost);

    const payment = ticket.payments.find((p) => !p.canceledAt);
    let totalReceived = 0;
    if (payment && newNetSales >= 0) {
      totalReceived = await prisma.receipt
        .aggregate({
          where: { paymentId: payment.id },
          _sum: { amount: true },
        })
        .then((r) => Number(r._sum.amount ?? 0));
    }

    const newProfit = newNetSales - newNetCost;
    const newBalance = newNetSales - totalReceived;
    const newPaymentStatus =
      totalReceived > newNetSales
        ? "refund"
        : newBalance <= 0
          ? "paid"
          : totalReceived > 0
            ? "partial"
            : payment?.status === "credit"
              ? "credit"
              : "pending";
    const adjustmentDate = body.date ? new Date(body.date) : new Date();

    const mainPayable = ticket.payables.find((p) => p.ticketId === ticketId);

    const ops: PrismaPromise<unknown>[] = [
      prisma.ticket.update({
        where: { id: ticketId },
        data: {
          netSales: newNetSales,
          netCost: newNetCost,
          profit: newProfit,
        },
      }),
      prisma.ticketAdjustment.create({
        data: {
          ticketId,
          previousNetSales,
          previousNetCost,
          newNetSales,
          newNetCost,
          reason,
          date: adjustmentDate,
        },
      }),
    ];

    if (payment) {
      ops.push(
        prisma.payment.update({
          where: { id: payment.id },
          data: {
            amount: newNetSales,
            status: newPaymentStatus,
            expectedDate:
              newPaymentStatus === "credit" ? payment.expectedDate ?? null : null,
          },
        })
      );
    }

    if (mainPayable) {
      const oldAmount = Number(mainPayable.amount);
      const oldBalance = Number(mainPayable.balance);
      const totalPaid = oldAmount - oldBalance;
      const newBalance = Math.max(0, newNetCost - totalPaid);
      ops.push(
        prisma.payable.update({
          where: { id: mainPayable.id },
          data: { amount: newNetCost, balance: newBalance },
        })
      );
    } else if (newNetCost > 0) {
      ops.push(
        prisma.payable.create({
          data: {
            date: adjustmentDate,
            month: ticket.month,
            name: ticket.airline ? `Ticket: ${ticket.airline}` : "Ticket",
            description: ticket.customerName ?? null,
            amount: newNetCost,
            balance: newNetCost,
            ticketId: ticketId,
          },
        })
      );
    }

    const [adjustment] = await prisma.$transaction(ops);

    return NextResponse.json(adjustment);
  } catch (error) {
    console.error("Create adjustment error:", error);
    return NextResponse.json(
      { error: "Failed to apply adjustment" },
      { status: 500 }
    );
  }
}
