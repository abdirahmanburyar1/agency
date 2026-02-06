import { prisma } from "./db";

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

function getDefaultRange(): { from: Date; to: Date } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from, to };
}

export type ReportPeriod = "today" | "daily" | "monthly" | "yearly";

/** Local date string YYYY-MM-DD (no timezone shift) */
function toLocalDateKey(d: Date): string {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Days in range for today/daily grouping; uses local date for keys. Label = full date. */
function daysInRange(fromDate: Date, toDate: Date): { periodKey: string; label: string }[] {
  const out: { periodKey: string; label: string }[] = [];
  const from = startOfDay(fromDate);
  const to = endOfDay(toDate);
  const cur = new Date(from);
  while (cur <= to) {
    const periodKey = toLocalDateKey(cur);
    const label = cur.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
    out.push({ periodKey, label });
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

/** Months in range for grouping */
function monthsInRange(fromDate: Date, toDate: Date): { periodKey: string; label: string }[] {
  const out: { periodKey: string; label: string }[] = [];
  const from = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
  const to = new Date(toDate.getFullYear(), toDate.getMonth(), 1);
  const cur = new Date(from);
  while (cur <= to) {
    const periodKey = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`;
    const label = cur.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    out.push({ periodKey, label });
    cur.setMonth(cur.getMonth() + 1);
  }
  return out;
}

/** Years in range for yearly grouping */
function yearsInRange(fromDate: Date, toDate: Date): { periodKey: string; label: string }[] {
  const out: { periodKey: string; label: string }[] = [];
  const startYear = fromDate.getFullYear();
  const endYear = toDate.getFullYear();
  for (let y = startYear; y <= endYear; y++) {
    const periodKey = String(y);
    out.push({ periodKey, label: periodKey });
  }
  return out;
}

export type ReportFilters = {
  fromDate: Date;
  toDate: Date;
  period?: ReportPeriod;
};

export type ReportSummary = {
  ticketRevenue: number;
  visaRevenue: number;
  hajUmrahRevenue: number;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  /** Money actually received in the period (sum of receipt amounts by receipt date) */
  incomeReceived: number;
  /** Outstanding amount not yet received (customer balances) */
  totalReceivables: number;
  totalPayables: number;
  ticketProfit: number;
  visaProfit: number;
};

export type ReportRow = {
  month: string;
  monthLabel: string;
  ticketRevenue: number;
  visaRevenue: number;
  hajUmrahRevenue: number;
  totalRevenue: number;
  expenses: number;
  netIncome: number;
};

export type ReportData = {
  summary: ReportSummary;
  rows: ReportRow[];
  fromDate: Date;
  toDate: Date;
  dateRangeLabel: string;
  period: ReportPeriod;
  periodLabel: string;
};

/** Day key for grouping records; use local date so server timezone matches user intent */
function toDayKey(d: Date): string {
  return toLocalDateKey(d);
}

/** Month key YYYY-MM for grouping; derived from date to avoid DB month format mismatch */
function toMonthKey(d: Date): string {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`;
}

/** First day of month (00:00:00 local) */
function firstDayOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Last day of month (23:59:59 local) */
function lastDayOfMonth(d: Date): Date {
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return endOfDay(last);
}

export async function getReportData(filter?: ReportFilters): Promise<ReportData> {
  const defaultRange = getDefaultRange();
  let fromDate = filter?.fromDate ?? defaultRange.from;
  let toDate = filter?.toDate ?? defaultRange.to;
  const period = filter?.period ?? "monthly";

  if (period === "today") {
    const now = new Date();
    fromDate = startOfDay(now);
    toDate = endOfDay(now);
  } else if (period === "monthly") {
    fromDate = firstDayOfMonth(fromDate);
    toDate = lastDayOfMonth(toDate);
  }

  const from = startOfDay(fromDate);
  const to = endOfDay(toDate);
  const dateRange = { date: { gte: from, lte: to } };
  /** Payments: filter by payment_date (departure date for Haj & Umrah, creation for others) */
  const paymentDateRange = { paymentDate: { gte: from, lte: to } };
  const paymentWhere = { ...paymentDateRange, canceledAt: null, status: { not: "refunded" } };
  const hajPaymentWhere = { ...paymentWhere, hajUmrahBookingId: { not: null }, status: { not: "refunded" } };

  const ticketWhere = { ...dateRange, canceledAt: null };
  const visaWhere = { ...dateRange, canceledAt: null };
  const expenseWhere = { ...dateRange, status: "approved" };
  const payableWhere = { ...dateRange, canceledAt: null };
  const receiptWhere = { date: { gte: from, lte: to }, payment: { status: { not: "refunded" } } };

  /** Receipts with payment source for attributing received amounts to ticket/visa/haj */
  type ReceiptWithSource = { date: Date; amount: unknown; payment: { ticketId: string | null; visaId: string | null; hajUmrahBookingId: string | null } };

  const [
    ticketsAgg,
    visasAgg,
    expensesAgg,
    payments,
    payablesAgg,
    receiptsAgg,
    receiptsWithSource,
    expensesForGrouping,
    expensesDaily,
  ] = await Promise.all([
    prisma.ticket.aggregate({ where: ticketWhere, _sum: { netSales: true, profit: true } }),
    prisma.visa.aggregate({ where: visaWhere, _sum: { netSales: true, profit: true } }),
    prisma.expense.aggregate({ where: expenseWhere, _sum: { amount: true } }),
    prisma.payment.findMany({ where: paymentWhere, include: { receipts: true } }),
    prisma.payable.aggregate({ where: payableWhere, _sum: { balance: true } }),
    prisma.receipt.aggregate({ where: receiptWhere, _sum: { amount: true } }),
    prisma.receipt.findMany({
      where: receiptWhere,
      select: { date: true, amount: true, payment: { select: { ticketId: true, visaId: true, hajUmrahBookingId: true } } },
    }),
    period === "monthly" || period === "yearly"
      ? prisma.expense.findMany({ where: expenseWhere, select: { date: true, amount: true } })
      : [],
    period === "today" || period === "daily"
      ? prisma.expense.findMany({ where: expenseWhere, select: { date: true, amount: true } })
      : [],
  ]);

  const allReceiptsWithSource = receiptsWithSource as ReceiptWithSource[];

  function attributeReceipt(r: ReceiptWithSource): { ticket: number; visa: number; haj: number } {
    const amt = Number(r.amount ?? 0);
    if (r.payment.ticketId) return { ticket: amt, visa: 0, haj: 0 };
    if (r.payment.visaId) return { ticket: 0, visa: amt, haj: 0 };
    if (r.payment.hajUmrahBookingId) return { ticket: 0, visa: 0, haj: amt };
    return { ticket: 0, visa: 0, haj: 0 };
  }

  const totalReceivables = payments.reduce((sum, p) => {
    const received = p.receipts.reduce((s, r) => s + Number(r.amount), 0);
    const balance = Number(p.amount) - received;
    return sum + (balance > 0 ? balance : 0);
  }, 0);

  let ticketRevenue = 0;
  let visaRevenue = 0;
  let hajUmrahRevenue = 0;
  for (const r of allReceiptsWithSource) {
    const attr = attributeReceipt(r);
    ticketRevenue += attr.ticket;
    visaRevenue += attr.visa;
    hajUmrahRevenue += attr.haj;
  }
  const totalRevenue = ticketRevenue + visaRevenue + hajUmrahRevenue;
  const totalExpenses = Number(expensesAgg._sum.amount ?? 0);
  const totalPayables = Number(payablesAgg._sum.balance ?? 0);
  const incomeReceived = Number(receiptsAgg._sum.amount ?? 0);

  const summary: ReportSummary = {
    ticketRevenue,
    visaRevenue,
    hajUmrahRevenue,
    totalRevenue,
    totalExpenses,
    netIncome: incomeReceived,
    incomeReceived,
    totalReceivables,
    totalPayables,
    ticketProfit: Number(ticketsAgg._sum.profit ?? 0),
    visaProfit: Number(visasAgg._sum.profit ?? 0),
  };

  const periodLabels: Record<ReportPeriod, string> = {
    today: "Today",
    daily: "Daily",
    monthly: "Monthly",
    yearly: "Yearly",
  };

  let rows: ReportRow[];

  if (period === "today" || period === "daily") {
    const dayBuckets = daysInRange(from, to);
    const rowMap = new Map<
      string,
      { ticketRevenue: number; visaRevenue: number; hajUmrahRevenue: number; expenses: number; incomeReceived: number }
    >();
    for (const { periodKey } of dayBuckets) {
      rowMap.set(periodKey, { ticketRevenue: 0, visaRevenue: 0, hajUmrahRevenue: 0, expenses: 0, incomeReceived: 0 });
    }
    for (const r of allReceiptsWithSource) {
      const key = toDayKey(r.date);
      const m = rowMap.get(key);
      if (m) {
        const attr = attributeReceipt(r);
        m.ticketRevenue += attr.ticket;
        m.visaRevenue += attr.visa;
        m.hajUmrahRevenue += attr.haj;
        m.incomeReceived += Number(r.amount ?? 0);
      }
    }
    for (const e of (expensesDaily ?? []) as { date: Date; amount: unknown }[]) {
      const key = toDayKey(e.date);
      const m = rowMap.get(key);
      if (m) m.expenses += Number(e.amount ?? 0);
    }
    rows = dayBuckets.map(({ periodKey, label }) => {
      const m = rowMap.get(periodKey) ?? { ticketRevenue: 0, visaRevenue: 0, hajUmrahRevenue: 0, expenses: 0, incomeReceived: 0 };
      const totalRevenue = m.ticketRevenue + m.visaRevenue + m.hajUmrahRevenue;
      return {
        month: periodKey,
        monthLabel: label,
        ticketRevenue: m.ticketRevenue,
        visaRevenue: m.visaRevenue,
        hajUmrahRevenue: m.hajUmrahRevenue,
        totalRevenue,
        expenses: m.expenses,
        netIncome: m.incomeReceived,
      };
    });
  } else if (period === "yearly") {
    const monthBuckets = monthsInRange(from, to);
    const rowMap = new Map<
      string,
      { ticketRevenue: number; visaRevenue: number; hajUmrahRevenue: number; expenses: number; incomeReceived: number }
    >();
    for (const r of allReceiptsWithSource) {
      const y = String(new Date(r.date).getFullYear());
      let m = rowMap.get(y);
      if (!m) {
        m = { ticketRevenue: 0, visaRevenue: 0, hajUmrahRevenue: 0, expenses: 0, incomeReceived: 0 };
        rowMap.set(y, m);
      }
      const attr = attributeReceipt(r);
      m.ticketRevenue += attr.ticket;
      m.visaRevenue += attr.visa;
      m.hajUmrahRevenue += attr.haj;
      m.incomeReceived += Number(r.amount ?? 0);
    }
    for (const e of expensesForGrouping as { date: Date; amount: unknown }[]) {
      const y = String(new Date(e.date).getFullYear());
      let m = rowMap.get(y);
      if (!m) {
        m = { ticketRevenue: 0, visaRevenue: 0, hajUmrahRevenue: 0, expenses: 0, incomeReceived: 0 };
        rowMap.set(y, m);
      }
      m.expenses += Number(e.amount ?? 0);
    }
    const yearBuckets = yearsInRange(from, to);
    rows = yearBuckets.map(({ periodKey, label }) => {
      const m = rowMap.get(periodKey) ?? { ticketRevenue: 0, visaRevenue: 0, hajUmrahRevenue: 0, expenses: 0, incomeReceived: 0 };
      const totalRevenue = m.ticketRevenue + m.visaRevenue + m.hajUmrahRevenue;
      return {
        month: periodKey,
        monthLabel: label,
        ticketRevenue: m.ticketRevenue,
        visaRevenue: m.visaRevenue,
        hajUmrahRevenue: m.hajUmrahRevenue,
        totalRevenue,
        expenses: m.expenses,
        netIncome: m.incomeReceived,
      };
    });
  } else {
    const chartMonths = monthsInRange(from, to);
    const rowMap = new Map<
      string,
      { ticketRevenue: number; visaRevenue: number; hajUmrahRevenue: number; expenses: number; incomeReceived: number }
    >();
    for (const { periodKey } of chartMonths) {
      rowMap.set(periodKey, { ticketRevenue: 0, visaRevenue: 0, hajUmrahRevenue: 0, expenses: 0, incomeReceived: 0 });
    }
    for (const r of allReceiptsWithSource) {
      const monthKey = toMonthKey(r.date);
      const m = rowMap.get(monthKey);
      if (m) {
        const attr = attributeReceipt(r);
        m.ticketRevenue += attr.ticket;
        m.visaRevenue += attr.visa;
        m.hajUmrahRevenue += attr.haj;
        m.incomeReceived += Number(r.amount ?? 0);
      }
    }
    for (const e of expensesForGrouping as { date: Date; amount: unknown }[]) {
      const monthKey = toMonthKey(e.date);
      const m = rowMap.get(monthKey);
      if (m) m.expenses += Number(e.amount ?? 0);
    }
    rows = chartMonths.map(({ periodKey, label }) => {
      const m = rowMap.get(periodKey) ?? { ticketRevenue: 0, visaRevenue: 0, hajUmrahRevenue: 0, expenses: 0, incomeReceived: 0 };
      const totalRevenue = m.ticketRevenue + m.visaRevenue + m.hajUmrahRevenue;
      return {
        month: periodKey,
        monthLabel: label,
        ticketRevenue: m.ticketRevenue,
        visaRevenue: m.visaRevenue,
        hajUmrahRevenue: m.hajUmrahRevenue,
        totalRevenue,
        expenses: m.expenses,
        netIncome: m.incomeReceived,
      };
    });
  }

  const dateRangeLabel =
    period === "today"
      ? `Today (${from.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })})`
      : period === "yearly"
        ? (from.getFullYear() === to.getFullYear()
            ? String(from.getFullYear())
            : `${from.getFullYear()} – ${to.getFullYear()}`)
        : period === "monthly"
          ? from.toLocaleDateString("en-US", { month: "long", year: "numeric" })
          : `From ${fromDate.toLocaleDateString()} to ${toDate.toLocaleDateString()}`;

  return {
    summary,
    rows,
    fromDate: from,
    toDate: to,
    dateRangeLabel,
    period,
    periodLabel: periodLabels[period],
  };
}
