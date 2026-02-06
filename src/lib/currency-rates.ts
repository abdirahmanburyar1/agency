import { prisma } from "./db";

/** Rate to USD: 1 unit of currency = rateToUsd USD. USD is always 1. */
export async function getCurrencyRates(): Promise<Record<string, number>> {
  const rates = await prisma.currencyRate.findMany();
  const map: Record<string, number> = { USD: 1 };
  for (const r of rates) {
    map[r.currency] = Number(r.rateToUsd);
  }
  return map;
}

/** Convert amount in given currency to USD */
export function toUsd(amount: number, currency: string, rates: Record<string, number>): number {
  const rate = rates[currency] ?? 1;
  return amount * rate;
}
