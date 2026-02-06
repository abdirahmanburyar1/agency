import { prisma } from "./db";
import { getCurrencyRates, toUsd } from "./currency-rates";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/** Get list of YYYY-MM months from fromDate to toDate (inclusive by month). */
function monthsInRange(fromDate: Date, toDate: Date): { monthStr: string; label: string }[] {
  const out: { monthStr: string; label: string }[] = [];
  const from = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
  const to = new Date(toDate.getFullYear(), toDate.getMonth(), 1);
  const cur = new Date(from);
  while (cur <= to) {
    const monthStr = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`;
    const label = cur.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    out.push({ monthStr, label });
    cur.setMonth(cur.getMonth() + 1);
  }
  return out;
}

export type DashboardDateFilter = {
  fromDate: Date;
  toDate: Date;
};

function getCurrentMonthRange(): { from: Date; to: Date } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0); // last day of current month
  return { from, to };
}

export async function getDashboard(filter?: DashboardDateFilter) {
  const now = new Date();
  const currentMonth = getCurrentMonthRange();
  const fromDate = filter?.fromDate ?? currentMonth.from;
  const toDate = filter?.toDate ?? currentMonth.to;

  const dateRange = {
    date: {
      gte: startOfDay(fromDate),
      lte: endOfDay(toDate),
    },
  };

  const ticketWhere = { ...dateRange, canceledAt: null };
  const paymentWhere = { ...dateRange, canceledAt: null, status: { not: "refunded" } };
  const payableWhere = { ...dateRange };
  const expenseWhere = { ...dateRange, status: "approved" };
  const hajUmrahPaymentWhere = { ...paymentWhere, hajUmrahBookingId: { not: null }, status: { not: "refunded" } };

  const [tickets, visas, expensesRaw, payments, payables, hajUmrahRevenueAgg, currencyRates] = await Promise.all([
    prisma.ticket.aggregate({ where: ticketWhere, _sum: { netSales: true, profit: true } }),
    prisma.visa.aggregate({ where: dateRange, _sum: { netSales: true, profit: true } }),
    prisma.expense.findMany({ where: expenseWhere, select: { date: true, month: true, amount: true, currency: true } }),
    prisma.payment.findMany({
      where: paymentWhere,
      include: { receipts: true },
    }),
    prisma.payable.aggregate({ where: payableWhere, _sum: { balance: true } }),
    prisma.payment.aggregate({
      where: hajUmrahPaymentWhere,
      _sum: { amount: true },
    }),
    getCurrencyRates(),
  ]);

  const totalReceivables = payments.reduce((sum, p) => {
    const received = p.receipts.reduce((s, r) => s + Number(r.amount), 0);
    const balance = Number(p.amount) - received;
    return sum + (balance > 0 ? balance : 0);
  }, 0);

  const fromForChart = startOfDay(fromDate);
  const toForChart = endOfDay(toDate);
  const chartMonths = monthsInRange(fromForChart, toForChart);
  const chartDateWhere = { date: { gte: fromForChart, lte: toForChart } };

  const [ticketByMonth, visaByMonth, hajUmrahByMonth] = await Promise.all([
    prisma.ticket.groupBy({
      by: ["month"],
      where: { ...chartDateWhere, canceledAt: null },
      _sum: { netSales: true },
    }),
    prisma.visa.groupBy({
      by: ["month"],
      where: chartDateWhere,
      _sum: { netSales: true },
    }),
    prisma.payment.groupBy({
      by: ["month"],
      where: { ...chartDateWhere, hajUmrahBookingId: { not: null }, status: { not: "refunded" } },
      _sum: { amount: true },
    }),
  ]);

  function toMonthStr(d: Date): string {
    const x = new Date(d);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`;
  }
  const expenseByMonthMap = new Map<string, number>();
  for (const e of expensesRaw) {
    const amt = toUsd(Number(e.amount ?? 0), (e as { currency?: string }).currency || "USD", currencyRates);
    const monthStr = toMonthStr(e.date);
    expenseByMonthMap.set(monthStr, (expenseByMonthMap.get(monthStr) ?? 0) + amt);
  }

  const monthMap = new Map<string, { month: string; ticketRevenue: number; visaRevenue: number; hajUmrahRevenue: number; expenses: number }>();
  for (const { monthStr, label } of chartMonths) {
    monthMap.set(monthStr, { month: label, ticketRevenue: 0, visaRevenue: 0, hajUmrahRevenue: 0, expenses: 0 });
  }

  for (const t of ticketByMonth) {
    const m = monthMap.get(t.month);
    if (m) m.ticketRevenue = Number(t._sum.netSales ?? 0);
  }
  for (const v of visaByMonth) {
    const m = monthMap.get(v.month);
    if (m) m.visaRevenue = Number(v._sum.netSales ?? 0);
  }
  for (const h of hajUmrahByMonth) {
    const m = monthMap.get(h.month);
    if (m) m.hajUmrahRevenue = Number(h._sum.amount ?? 0);
  }
  for (const [month, amount] of expenseByMonthMap) {
    const m = monthMap.get(month);
    if (m) m.expenses = amount;
  }

  const chartData = Array.from(monthMap.values());

  const ticketRevenue = Number(tickets._sum.netSales ?? 0);
  const visaRevenue = Number(visas._sum.netSales ?? 0);
  const hajUmrahRevenue = Number(hajUmrahRevenueAgg._sum.amount ?? 0);
  const totalRevenue = ticketRevenue + visaRevenue + hajUmrahRevenue;
  const totalExpensesNum = expensesRaw.reduce(
    (sum, e) => sum + toUsd(Number(e.amount ?? 0), (e as { currency?: string }).currency || "USD", currencyRates),
    0
  );

  return {
    ticketRevenue,
    visaRevenue,
    hajUmrahRevenue,
    totalExpenses: totalExpensesNum,
    grossProfitTicket: Number(tickets._sum.profit ?? 0),
    grossProfitVisa: Number(visas._sum.profit ?? 0),
    totalReceivables,
    totalPayables: Number(payables._sum.balance ?? 0),
    totalRevenue,
    netIncome: totalRevenue - totalExpensesNum,
    chartData,
    dateFilter: filter ? { fromDate: filter.fromDate, toDate: filter.toDate } : null,
    dateRangeLabel: filter ? "Selected date range" : "Current month",
  };
}
