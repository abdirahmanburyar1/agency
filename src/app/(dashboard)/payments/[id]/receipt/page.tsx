import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { PERMISSION } from "@/lib/permissions";
import { PrintButton } from "@/components/PrintButton";

export default async function PaymentReceiptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ r?: string }>;
}) {
  await requirePermission(PERMISSION.PAYMENTS_VIEW, { redirectOnForbidden: true });
  const { id: paymentId } = await params;
  const { r: receiptId } = await searchParams;

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      ticket: { include: { customer: true } },
      visa: { include: { customerRelation: true } },
      hajUmrahBooking: { include: { customer: true } },
      receipts: { orderBy: { date: "asc" } },
    },
  });

  if (!payment) notFound();

  const totalReceived = payment.receipts.reduce((s, r) => s + Number(r.amount), 0);
  const balance = Number(payment.amount) - totalReceived;
  const expectedAmount = Number(payment.amount);
  const customer =
    payment.ticket?.customer ?? payment.visa?.customerRelation ?? payment.hajUmrahBooking?.customer;
  const customerName = customer
    ? (customer.phone ? `${customer.name} - ${customer.phone}` : customer.name)
    : (payment.ticket?.customerName ?? payment.visa?.customer ?? "Customer");
  const hajTrackDisplay = payment.hajUmrahBooking?.trackNumber != null
    ? (payment.hajUmrahBooking.trackNumber < 1000
        ? String(payment.hajUmrahBooking.trackNumber).padStart(3, "0")
        : String(payment.hajUmrahBooking.trackNumber))
    : null;
  const customerWhatsappNumber = customer && "whatsappNumber" in customer ? (customer as { whatsappNumber?: string }).whatsappNumber : null;

  const singleReceipt = receiptId
    ? payment.receipts.find((r) => r.id === receiptId)
    : null;

  const isSingleReceiptView = !!singleReceipt;
  const receipt = singleReceipt ?? payment.receipts[payment.receipts.length - 1];

  if (payment.receipts.length === 0) {
    return (
      <main className="min-h-screen bg-white p-6">
        <p className="text-zinc-500">No receipt found. Record a payment first.</p>
        <Link href={`/payments/${paymentId}`} className="mt-4 text-blue-600 hover:underline">
          ← Back to Payment
        </Link>
      </main>
    );
  }

  const amountPaid = receipt ? Number(receipt.amount) : 0;
  const receiptsBeforeThis = receipt
    ? payment.receipts.filter((r) => r.id !== receipt.id && new Date(r.date) <= new Date(receipt.date))
    : [];
  const totalExcludingThis = receiptsBeforeThis.reduce((s, r) => s + Number(r.amount), 0);
  const previousBalance = expectedAmount - totalExcludingThis;
  const newBalance = receipt ? previousBalance - amountPaid : balance;

  return (
    <main className="min-h-screen bg-white p-4 print:p-0">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .print\\:hidden { display: none !important; }
              .receipt-article { box-shadow: none !important; border: none !important; }
              .receipt-article *, .receipt-article { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          `,
        }}
      />

      <div className="mx-auto max-w-2xl print:max-w-none">
        <div className="mb-4 flex items-center justify-between print:hidden">
          <Link
            href="/payments"
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            ← Back to Payments
          </Link>
          <div className="flex gap-3">
            <Link
              href={`/payments/${paymentId}`}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
            >
              Payment details
            </Link>
            <PrintButton className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
              Print receipt
            </PrintButton>
          </div>
        </div>

        <article className="receipt-article overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm print:border-0 print:rounded-none print:shadow-none">
          {/* Header with logo and customer on right */}
          <div className="flex h-12 items-center justify-between gap-4 border-b border-zinc-200 bg-zinc-50 px-4 print:bg-white sm:h-14">
            <img
              src="/logo.png"
              alt="Daybah Travel Agency"
              className="h-full w-auto min-w-0 object-contain object-left"
            />
            <div className="shrink-0 text-right text-sm">
              <p className="font-medium text-zinc-700">{customerName}</p>
              {customerWhatsappNumber && <p className="text-xs text-zinc-500">WhatsApp: {customerWhatsappNumber}</p>}
            </div>
          </div>

          <div className="p-8">
            {/* Payment & ticket/visa info (merged) */}
            <section className="mb-8">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                Payment & booking details
              </h2>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-zinc-500">Payment date</dt>
                  <dd className="text-sm font-medium">{new Date(payment.paymentDate).toLocaleDateString()}</dd>
                </div>
                {payment.ticket?.ticketNumber != null && (
                  <div>
                    <dt className="text-xs text-zinc-500">Ticket no</dt>
                    <dd className="font-mono text-sm font-medium">
                      {payment.ticket.ticketNumber < 1000
                        ? String(payment.ticket.ticketNumber).padStart(3, "0")
                        : String(payment.ticket.ticketNumber)}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs text-zinc-500">Reference</dt>
                  <dd className="text-sm font-medium">
                    {payment.ticket?.reference ?? payment.name ?? (payment.hajUmrahBooking && hajTrackDisplay ? `Haj & Umrah #${hajTrackDisplay}` : null) ?? "—"}
                  </dd>
                </div>
                {payment.hajUmrahBooking && hajTrackDisplay && (
                  <div>
                    <dt className="text-xs text-zinc-500">Booking</dt>
                    <dd className="text-sm font-medium">Haj & Umrah #{hajTrackDisplay}</dd>
                  </div>
                )}
                {payment.ticket && (
                  <>
                    <div>
                      <dt className="text-xs text-zinc-500">Route</dt>
                      <dd className="text-sm font-medium">{payment.ticket.route ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-zinc-500">Flight</dt>
                      <dd className="text-sm font-medium">{payment.ticket.flight ?? "—"}</dd>
                    </div>
                    {payment.ticket.departure && (
                      <div>
                        <dt className="text-xs text-zinc-500">Departure</dt>
                        <dd className="text-sm font-medium">{new Date(payment.ticket.departure).toLocaleDateString()}</dd>
                      </div>
                    )}
                  </>
                )}
                {payment.visa && (
                  <div>
                    <dt className="text-xs text-zinc-500">Country</dt>
                    <dd className="text-sm font-medium">{payment.visa.country ?? "—"}</dd>
                  </div>
                )}
              </dl>
            </section>

            {/* Amount summary */}
            <section className="border-t border-zinc-200 pt-6">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Amount summary
              </h2>
              <div className="space-y-1">
                <div className="flex justify-between py-0.5">
                  <span className="text-zinc-600">Expected amount</span>
                  <span className="font-medium">${expectedAmount.toLocaleString()}</span>
                </div>
                {isSingleReceiptView && receipt && (
                  <div className="flex justify-between border-t border-zinc-200 py-2">
                    <span className="font-semibold text-zinc-900">Remaining balance</span>
                    <span className="font-bold">${newBalance.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </section>

            {payment.receipts.length > 0 && (
              <section className="mt-6 border-t border-zinc-200 pt-6">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Payment history
                </h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-left">
                      <th className="pb-1.5 font-medium text-zinc-600">Date</th>
                      <th className="pb-1.5 font-medium text-zinc-600">Method</th>
                      <th className="pb-1.5 font-medium text-zinc-600">Received by</th>
                      <th className="pb-1.5 text-right font-medium text-zinc-600">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payment.receipts.map((r) => (
                      <tr key={r.id} className="border-b border-zinc-100">
                        <td className="py-1.5">{new Date(r.date).toLocaleDateString()}</td>
                        <td className="py-1.5">{r.pMethod ?? "—"}</td>
                        <td className="py-1.5">{"receivedBy" in r ? (r.receivedBy ?? "—") : "—"}</td>
                        <td className="py-1.5 text-right font-medium">${Number(r.amount).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-zinc-200 font-semibold">
                      <td className="py-2" colSpan={3}>Total received</td>
                      <td className="py-2 text-right">${totalReceived.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5" colSpan={3}>Remaining balance</td>
                      <td className="py-1.5 text-right font-bold">${balance.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </section>
            )}

            <p className="mt-6 text-center text-sm text-zinc-500">
              Thank you for your payment
            </p>
          </div>
        </article>
      </div>
    </main>
  );
}
