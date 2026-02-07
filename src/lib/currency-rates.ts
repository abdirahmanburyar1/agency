import { prisma } from "./db";

/** Stored rate = units per 1 USD (e.g. 128 for KES means 1 USD = 128 KES). USD is always 1. */
export async function getCurrencyRates(): Promise<Record<string, number>> {
  const rates = await prisma.currencyRate.findMany();
  const map: Record<string, number> = { USD: 1 };
  for (const r of rates) {
    map[r.currency] = Number(r.rateToUsd);
  }
  return map;
}

/** Convert amount in given currency to USD. Rate = units per 1 USD, so amount USD = amount / rate. */
export function toUsd(amount: number, currency: string, rates: Record<string, number>): number {
  const rate = rates[currency] ?? 1;
  if (currency === "USD" || rate === 1) return amount;
  return amount / rate;
}
