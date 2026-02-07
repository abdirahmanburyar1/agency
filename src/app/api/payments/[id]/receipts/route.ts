import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { trigger, EVENTS } from "@/lib/pusher";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { handleAuthError } from "@/lib/api-auth";
import { auth } from "@/auth";
import { getCurrencyRates } from "@/lib/currency-rates";

/** Convert amount to USD. rateToUsd = units per 1 USD, so amountUsd = amount / rate. */
function toUsd(amount: number, currency: string, rates: Record<string, number>): number {
  const rate = rates[currency] ?? 1;
  if (currency === "USD" || rate === 1) return amount;
  return amount / rate;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(PERMISSION.PAYMENTS_CREATE);
  } catch (e) {
    const res = handleAuthError(e);
    if (res) return res;
    throw e;
  }
  try {
    const { id: paymentId } = await params;
    const body = await request.json();
    const amount = Number(body.amount ?? 0);
    const currency = String(body.currency ?? "USD").trim().toUpperCase() || "USD";
    const pMethod = body.pMethod?.trim();
    const collectionPoint = body.collectionPoint?.trim() || null; // "shipment" | "delivery" for cargo

    if (amount <= 0) {
      return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });
    }
    if (!pMethod) {
      return NextResponse.json({ error: "Payment method is required" }, { status: 400 });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { receipts: true },
    });
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const rates = await getCurrencyRates();
    const paymentCurrency = (payment as { currency?: string }).currency ?? "USD";
    const expectedUsd = toUsd(Number(payment.amount), paymentCurrency, rates);

    const totalReceivedUsd = payment.receipts.reduce((sum, r) => {
      const rAmount = Number(r.amount);
      const rCurrency = (r as { currency?: string }).currency ?? "USD";
      const rRate = (r as { rateToBase?: number | null }).rateToBase;
      const amtUsd = rRate != null ? rAmount * Number(rRate) : toUsd(rAmount, rCurrency, rates);
      return sum + amtUsd;
    }, 0);

    const receiptRateToUsd = rates[currency];
    if (currency !== "USD" && (receiptRateToUsd == null || receiptRateToUsd <= 0)) {
      return NextResponse.json(
        { error: `No exchange rate configured for ${currency}. Add it in Admin → Settings → Currency rates.` },
        { status: 400 }
      );
    }
    const rateToBase = currency === "USD" ? 1 : 1 / (receiptRateToUsd ?? 1); // USD per 1 unit of receipt currency
    const amountUsd = amount * rateToBase;

    const balanceUsd = expectedUsd - totalReceivedUsd;
    if (amountUsd > balanceUsd) {
      return NextResponse.json(
        {
          error: `Paid amount (${amount} ${currency} ≈ $${amountUsd.toFixed(2)} USD) exceeds balance remaining ($${balanceUsd.toFixed(2)} USD)`,
        },
        { status: 400 }
      );
    }

    const receiptDate = body.date ? new Date(body.date) : new Date();
    const newTotalReceivedUsd = totalReceivedUsd + amountUsd;
    const newBalanceUsd = expectedUsd - newTotalReceivedUsd;
    const newStatus =
      newBalanceUsd <= 0 ? "paid" : newTotalReceivedUsd > 0 ? "partial" : "pending";

    const updateData: { status: string; expectedDate?: null } = { status: newStatus };
    updateData.expectedDate = null;

    const session = await auth();
    const userName = session?.user?.name?.trim();
    const userEmail = session?.user?.email;
    const receivedBy = userName || userEmail || body.receivedBy || null;

    const cargoShipmentId = (payment as { cargoShipmentId?: string | null }).cargoShipmentId;

    const [receipt] = await prisma.$transaction([
      prisma.receipt.create({
        data: {
          date: receiptDate,
          amount,
          currency,
          rateToBase,
          collectionPoint: !cargoShipmentId && ["shipment", "delivery"].includes(collectionPoint ?? "") ? collectionPoint : null,
          pMethod,
          account: body.account ?? null,
          receivedBy,
          paymentId,
        },
      }),
      prisma.payment.update({
        where: { id: paymentId },
        data: updateData,
      }),
    ]);

    trigger(EVENTS.RECEIPT_CREATED, { receipt }).catch(() => {});
    return NextResponse.json(receipt);
  } catch (error) {
    console.error("Record receipt error:", error);
    return NextResponse.json(
      { error: "Failed to record receipt" },
      { status: 500 }
    );
  }
}
