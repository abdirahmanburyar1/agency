import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  WAREHOUSE: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  ASSIGNED_TO_MANIFEST: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  DISPATCHED: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
  ARRIVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  DELIVERED: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
};

const STATUS_DESCRIPTIONS: Record<string, string> = {
  PENDING: "Awaiting payment. Shipment will proceed once moved to warehouse.",
  WAREHOUSE: "Shipment is in our warehouse.",
  ASSIGNED_TO_MANIFEST: "Shipment has been assigned to a transport manifest.",
  DISPATCHED: "Shipment has left and is in transit.",
  ARRIVED: "Shipment has arrived at the destination.",
  DELIVERED: "Shipment has been delivered to the receiver.",
};

async function getTracking(trackingNumber: string) {
  try {
    const shipment = await prisma.cargoShipment.findFirst({
      where: { trackingNumber },
      include: {
        items: true,
        logs: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!shipment) return null;
    return {
      trackingNumber: shipment.trackingNumber,
      source: shipment.source,
      destination: shipment.destination,
      transportMode: shipment.transportMode,
      carrier: shipment.carrier,
      status: shipment.status,
      totalWeight: shipment.totalWeight,
      items: shipment.items.map((i) => ({
        id: i.id,
        description: i.description,
        quantity: i.quantity,
        weight: i.weight,
        unitPrice: Number(i.unitPrice ?? 0),
      })),
      logs: shipment.logs.map((l) => ({
        status: l.status,
        note: l.note,
        createdAt: l.createdAt.toISOString(),
      })),
    };
  } catch {
    return null;
  }
}

export default async function TrackResultPage({
  params,
}: {
  params: Promise<{ trackingNumber: string }>;
}) {
  const { trackingNumber } = await params;
  const normalized = decodeURIComponent(trackingNumber ?? "").trim().toUpperCase();
  if (!normalized) notFound();

  const data = await getTracking(normalized);
  if (!data) notFound();

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-slate-100 px-4 py-12 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-lg">
        <Link
          href="/track"
          className="mb-6 inline-block text-sm font-medium text-zinc-500 transition hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Search another
        </Link>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="mb-1 font-mono text-xl font-bold text-zinc-900 dark:text-white">
            {data.trackingNumber}
          </h1>
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            From {data.source ?? "—"} → To {data.destination ?? "—"}
            {(data.carrier || data.transportMode) && (
              <span className="block mt-1">
                {(data.transportMode ? String(data.transportMode).charAt(0).toUpperCase() + String(data.transportMode).slice(1) : null)}
                {data.carrier ? ` – ${data.carrier}` : ""}
              </span>
            )}
          </p>
          <div className="mb-2">
            <span
              className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${
                STATUS_STYLES[data.status] ?? "bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
              }`}
            >
              {data.status.replace(/_/g, " ")}
            </span>
            {STATUS_DESCRIPTIONS[data.status] && (
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                {STATUS_DESCRIPTIONS[data.status]}
              </p>
            )}
          </div>
          {data.items && data.items.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-3 font-semibold text-zinc-900 dark:text-white">Cargo Items</h2>
              <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
                <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 sm:px-4 sm:py-3">
                        Description
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 sm:px-4 sm:py-3">
                        Qty
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 sm:px-4 sm:py-3">
                        Weight
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                    {data.items.map((item: { id: string; description: string; quantity: number; weight: number }) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 sm:px-4 sm:py-3">
                          {item.description}
                        </td>
                        <td className="px-3 py-2 text-right text-sm text-zinc-700 dark:text-zinc-300 sm:px-4 sm:py-3">
                          {item.quantity}
                        </td>
                        <td className="px-3 py-2 text-right text-sm text-zinc-700 dark:text-zinc-300 sm:px-4 sm:py-3">
                          {item.weight} kg
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.totalWeight != null && (
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Total weight: <span className="font-medium">{data.totalWeight} kg</span>
                </p>
              )}
            </div>
          )}
          <div className="mt-8">
            <h2 className="mb-4 font-semibold text-zinc-900 dark:text-white">Timeline</h2>
            <div className="space-y-4">
              {data.logs.map((log: { status: string; note: string | null; createdAt: string }, idx: number) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="size-3 rounded-full bg-amber-500" />
                    {idx < data.logs.length - 1 && (
                      <div className="mt-1 w-0.5 flex-1 bg-zinc-200 dark:bg-zinc-700" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-medium text-zinc-800 dark:text-zinc-200">
                      {log.status.replace(/_/g, " ")}
                    </p>
                    {log.note && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">{log.note}</p>
                    )}
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
