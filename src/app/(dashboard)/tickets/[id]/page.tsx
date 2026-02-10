import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePermission, canAccess } from "@/lib/permissions";
import { getSystemSettings } from "@/lib/system-settings";
import { PERMISSION } from "@/lib/permissions";
import { PrintButton } from "@/components/PrintButton";
import TicketCancelButton from "./TicketCancelButton";
import TicketAdjustmentButton from "./TicketAdjustmentButton";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    select: { reference: true },
  });
  if (!ticket) return { title: "Ticket" };
  // Use reference as title for PDF filename when saving (sanitize for filename safety)
  const safeRef = (ticket.reference || "Ticket").replace(/[/\\?%*:|"<>]/g, "-").trim() || "Ticket";
  return { title: safeRef };
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  const v = value?.trim();
  if (v == null || v === "") return null;
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-slate-800">{v}</p>
    </div>
  );
}

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission(PERMISSION.TICKETS_VIEW, { redirectOnForbidden: true });
  const { id } = await params;

  const [ticket, systemSettings] = await Promise.all([
    prisma.ticket.findUnique({
      where: { id },
      include: { customer: true, adjustments: { orderBy: { createdAt: "asc" } } },
    }),
    getSystemSettings(),
  ]);

  if (!ticket) notFound();

  const canEdit = await canAccess(PERMISSION.TICKETS_EDIT);
  const isCanceled = !!ticket.canceledAt;

  const traveler = ticket.customer;
  const travelerName = traveler?.name ?? ticket.customerName ?? null;
  const travelerPhone = traveler?.phone ?? null;
  const travelerEmail =
    traveler && "email" in traveler
      ? (traveler as { email?: string }).email
      : null;
  const hasTraveler = travelerName || travelerPhone || travelerEmail;

  const currentNetSales = Number(ticket.netSales);

  const ticketNumberDisplay =
    ticket.ticketNumber != null
      ? ticket.ticketNumber < 1000
        ? String(ticket.ticketNumber).padStart(3, "0")
        : String(ticket.ticketNumber)
      : ticket.id.slice(-8).toUpperCase();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-emerald-50/30 p-6 print:bg-white print:p-0 print:min-h-0">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page { size: A4; margin: 12mm; }
              * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
              .print\\:hidden { display: none !important; }
              .ticket-a4 {
                box-shadow: none !important;
                max-width: 100% !important;
              }
              .print-header { background: #334155 !important; }
              .print-badge { background: rgba(255,255,255,0.2) !important; backdrop-filter: none !important; }
            }
          `,
        }}
      />

      <div className="mx-auto max-w-[210mm] print:max-w-none">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <Link
            href="/tickets"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-white/80 hover:text-slate-900"
          >
            ← Back to Tickets
          </Link>
          <div className="flex items-center gap-3">
            {isCanceled && (
              <span className="rounded-full bg-rose-100 px-3 py-1.5 text-sm font-semibold text-rose-800 dark:bg-rose-900/50 dark:text-rose-400">
                Canceled
              </span>
            )}
            {canEdit && !isCanceled && (
              <>
                <Link
                  href={`/tickets/${id}/edit`}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Edit
                </Link>
                <TicketAdjustmentButton
                  ticketId={id}
                  currentNetSales={currentNetSales}
                  currentNetCost={Number(ticket.netCost)}
                />
                <TicketCancelButton ticketId={id} reference={ticket.reference} />
              </>
            )}
            {!isCanceled && (
              <PrintButton className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800">
                Print ticket
              </PrintButton>
            )}
          </div>
        </div>

        <article
          className={`ticket-a4 mx-auto w-full max-w-[210mm] overflow-hidden rounded-2xl bg-white shadow-xl shadow-slate-200/50 ring-1 ring-slate-200/80 print:max-w-none print:rounded-lg print:shadow-none print:ring-1 print:ring-slate-200 ${isCanceled ? "print:hidden" : ""}`}
        >
          {/* Header - gradient band */}
          <div className="print-header relative overflow-hidden bg-gradient-to-r from-slate-800 via-slate-700 to-emerald-800 px-8 py-6">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent" />
            <div className="relative flex items-center justify-between">
              <img
                src={systemSettings.logoUrl}
                alt={systemSettings.systemName}
                className="h-14 w-auto object-contain drop-shadow-sm"
              />
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs font-medium uppercase tracking-widest text-emerald-300/90">
                    Reference
                  </p>
                  <p className="mt-0.5 text-lg font-semibold text-white">
                    {ticket.reference}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {isCanceled && (
                    <span className="rounded-lg bg-rose-500/80 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
                      Canceled
                    </span>
                  )}
                  <div className="print-badge print:hidden rounded-xl bg-white/15 px-5 py-3 backdrop-blur-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                      Ticket no
                    </p>
                    <p className="mt-0.5 font-mono text-2xl font-bold tracking-tight text-white">
                      {ticketNumberDisplay}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            {/* Traveler & Ticket - two columns (force 2 cols in print) */}
            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2 print:grid-cols-2">
              {/* Traveler card */}
              <div className="overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/80 ring-1 ring-slate-200/60">
                <div className="border-b border-slate-200/80 bg-white/50 px-6 py-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                    Traveler
                  </h2>
                </div>
                <div className="space-y-4 p-6">
                  <InfoItem label="Name" value={travelerName} />
                  <InfoItem label="Phone" value={travelerPhone} />
                  <InfoItem label="Email" value={travelerEmail} />
                  {!hasTraveler && (
                    <p className="text-sm text-slate-400">—</p>
                  )}
                </div>
              </div>

              {/* Ticket details card */}
              <div className="overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/80 ring-1 ring-slate-200/60">
                <div className="border-b border-slate-200/80 bg-white/50 px-6 py-3">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                    Ticket details
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-4 p-6">
                  <InfoItem
                    label="Date"
                    value={new Date(ticket.date).toLocaleDateString()}
                  />
                  <InfoItem label="Month" value={ticket.month} />
                  <InfoItem label="Sponsor" value={ticket.sponsor} />
                </div>
              </div>
            </div>

            {/* Flight details */}
            <div className="mb-8 overflow-hidden rounded-xl bg-slate-50/50 ring-1 ring-slate-200/60">
              <div className="border-b border-slate-200/80 bg-white/60 px-6 py-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                  Flight details
                </h2>
              </div>
              <div className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4">
                <InfoItem label="Airline" value={ticket.airline} />
                <InfoItem label="Route" value={ticket.route} />
                <InfoItem label="Flight type" value={ticket.flight} />
                {ticket.departure && (
                  <InfoItem
                    label="Departure"
                    value={new Date(ticket.departure).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  />
                )}
                {ticket.return && (
                  <InfoItem
                    label="Return"
                    value={new Date(ticket.return).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  />
                )}
              </div>
            </div>

            {/* Net sales (price) */}
            <div className="rounded-xl bg-emerald-50 p-5 ring-1 ring-emerald-200/60">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700/80">
                Net sales (price)
              </p>
              <p className="mt-2 text-xl font-bold text-emerald-800">
                ${currentNetSales.toLocaleString()}
              </p>
              {ticket.adjustments.length > 0 && (
                <div className="mt-3 space-y-1 border-t border-emerald-200/60 pt-3">
                  <p className="text-xs font-medium text-emerald-700/80">
                    Adjustment history
                  </p>
                  {ticket.adjustments.map((a) => (
                    <p key={a.id} className="text-xs text-emerald-800/90">
                      ${Number(a.previousNetSales).toLocaleString()} → $
                      {Number(a.newNetSales).toLocaleString()}
                      {a.reason && ` (${a.reason})`}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <p className="mt-8 text-center text-xs font-medium text-slate-400">
              Issued {new Date(ticket.date).toLocaleDateString()} ·{" "}
              {ticket.sponsor ? `Booked by ${ticket.sponsor}` : systemSettings.systemName}
            </p>
          </div>
        </article>

        <p className="mt-6 text-center text-sm text-slate-500 print:hidden">
          Present this ticket at check-in · Keep for your records
        </p>
      </div>
    </main>
  );
}
