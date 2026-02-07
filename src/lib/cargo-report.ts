import { prisma } from "./db";
import { getCurrencyRates, toUsd } from "./currency-rates";
import { getCargoVisibilityWhere } from "./cargo";

export type CargoReportFilters = {
  fromDate: Date;
  toDate: Date;
  status?: string;
  sourceLocationId?: string;
  destinationLocationId?: string;
};

export type CargoReportSummary = {
  totalShipments: number;
  totalWeight: number;
  /** Received on hand: sum of receipts for paid/partial cargo payments */
  totalReceived: number;
  totalReceivables: number;
  byStatus: Record<string, { count: number; weight: number; revenue: number }>;
};

export type CargoReportRow = {
  id: string;
  trackingNumber: string;
  senderName: string;
  receiverName: string;
  source: string;
  destination: string;
  status: string;
  totalWeight: number;
  price: number;
  currency: string;
  createdAt: Date;
};

export type CargoReportData = {
  summary: CargoReportSummary;
  shipments: CargoReportRow[];
  fromDate: Date;
  toDate: Date;
  dateRangeLabel: string;
};

export async function getCargoReportData(
  filter: CargoReportFilters,
  visibilityWhere: { id?: string } | { OR?: unknown[] }
): Promise<CargoReportData> {
  const from = new Date(filter.fromDate);
  from.setHours(0, 0, 0, 0);
  const to = new Date(filter.toDate);
  to.setHours(23, 59, 59, 999);

  const andParts: Record<string, unknown>[] = [visibilityWhere, { createdAt: { gte: from, lte: to } }];
  if (filter.status) andParts.push({ status: filter.status });
  if (filter.sourceLocationId) {
    andParts.push({ sourceBranch: { locationId: filter.sourceLocationId } });
  }
  if (filter.destinationLocationId) {
    andParts.push({ destinationBranch: { locationId: filter.destinationLocationId } });
  }
  const where = { AND: andParts };

  const [shipments, currencyRates] = await Promise.all([
    prisma.cargoShipment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        sourceBranch: { include: { location: true } },
        destinationBranch: { include: { location: true } },
        payments: {
          where: { canceledAt: null, status: { not: "refunded" } },
          include: { receipts: true },
        },
      },
    }),
    getCurrencyRates(),
  ]);

  type PaymentWithReceipts = { amount: unknown; currency: string; status: string; receipts: { amount: unknown; currency: string; rateToBase?: number | null }[] };
  const byStatus: Record<string, { count: number; weight: number; revenue: number }> = {};
  let totalShipments = 0;
  let totalWeight = 0;
  let totalReceived = 0;
  let totalReceivables = 0;

  for (const s of shipments) {
    const currency = (s as { currency?: string }).currency ?? "USD";
    const priceUsd = toUsd(Number(s.price), currency, currencyRates);
    totalShipments += 1;
    totalWeight += s.totalWeight;
    const existing = byStatus[s.status] ?? { count: 0, weight: 0, revenue: 0 };
    byStatus[s.status] = {
      count: existing.count + 1,
      weight: existing.weight + s.totalWeight,
      revenue: existing.revenue + priceUsd,
    };

    for (const p of (s as { payments: PaymentWithReceipts[] }).payments ?? []) {
      const received = p.receipts.reduce((sum, r) => {
        const amt = Number(r.amount ?? 0);
        const rate = r.rateToBase != null && r.rateToBase > 0 ? Number(r.rateToBase) : null;
        const usd = rate != null ? amt * rate : toUsd(amt, r.currency || "USD", currencyRates);
        return sum + usd;
      }, 0);
      const expectedUsd = toUsd(Number(p.amount ?? 0), p.currency || "USD", currencyRates);
      const balance = expectedUsd - received;
      if (p.status === "paid" || p.status === "partial") totalReceived += received;
      if (balance > 0) totalReceivables += balance;
    }
  }

  const rows: CargoReportRow[] = shipments.map((s) => ({
    id: s.id,
    trackingNumber: s.trackingNumber,
    senderName: s.senderName,
    receiverName: s.receiverName,
    source: s.source,
    destination: s.destination,
    status: s.status,
    totalWeight: s.totalWeight,
    price: toUsd(Number(s.price), (s as { currency?: string }).currency ?? "USD", currencyRates),
    currency: "USD",
    createdAt: s.createdAt,
  }));

  const dateRangeLabel = `From ${from.toLocaleDateString()} to ${to.toLocaleDateString()}`;

  return {
    summary: {
      totalShipments,
      totalWeight,
      totalReceived,
      totalReceivables,
      byStatus,
    },
    shipments: rows,
    fromDate: from,
    toDate: to,
    dateRangeLabel,
  };
}
