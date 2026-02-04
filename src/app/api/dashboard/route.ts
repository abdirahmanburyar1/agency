import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";

export async function GET(request: Request) {
  await requirePermission(PERMISSION.DASHBOARD_VIEW);
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // optional filter

    const monthWhere = month ? { month } : {};
    const ticketWhere = { ...monthWhere, canceledAt: null };
    const paymentWhere = { ...monthWhere, canceledAt: null };
    const payableWhere = { ...monthWhere, canceledAt: null };
    const expenseWhere = { ...monthWhere, status: "approved" };

    const [tickets, visas, expenses, payments, payables] = await Promise.all([
      prisma.ticket.aggregate({ where: ticketWhere, _sum: { netSales: true, profit: true } }),
      prisma.visa.aggregate({ where: monthWhere, _sum: { netSales: true, profit: true } }),
      prisma.expense.aggregate({ where: expenseWhere, _sum: { amount: true } }),
      prisma.payment.findMany({
        where: paymentWhere,
        include: { receipts: true },
      }),
      prisma.payable.aggregate({ where: payableWhere, _sum: { balance: true } }),
    ]);

    const totalReceivables = payments.reduce((sum, p) => {
      const received = p.receipts.reduce((s, r) => s + Number(r.amount), 0);
      const balance = Number(p.amount) - received;
      return sum + (balance > 0 ? balance : 0);
    }, 0);

    const ticketRevenue = Number(tickets._sum.netSales ?? 0);
    const visaRevenue = Number(visas._sum.netSales ?? 0);
    const totalExpenses = Number(expenses._sum.amount ?? 0);
    const totalPayables = Number(payables._sum.balance ?? 0);
    const grossProfitTicket = Number(tickets._sum.profit ?? 0);
    const grossProfitVisa = Number(visas._sum.profit ?? 0);

    return NextResponse.json({
      ticketRevenue,
      visaRevenue,
      totalRevenue: ticketRevenue + visaRevenue,
      totalExpenses,
      grossProfitTicket,
      grossProfitVisa,
      netIncome: grossProfitTicket + grossProfitVisa - totalExpenses,
      totalReceivables,
      totalPayables,
    });
  } catch (error) {
    console.error("Dashboard GET error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard" }, { status: 500 });
  }
}
