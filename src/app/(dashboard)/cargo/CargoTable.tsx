"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import SearchableOptionSelect from "@/components/SearchableOptionSelect";

type CargoItem = { id: string; description: string; quantity: number; weight: number; unitPrice: number };
type Shipment = {
  id: string;
  trackingNumber: string;
  senderName: string;
  senderPhone?: string;
  receiverName: string;
  receiverPhone?: string;
  source: string;
  destination: string;
  transportMode?: string;
  carrier?: string;
  totalWeight: number;
  price: number;
  status: string;
  createdAt: Date;
  items: CargoItem[];
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  WAREHOUSE: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  ASSIGNED_TO_MANIFEST: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  DISPATCHED: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
  ARRIVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  DELIVERED: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
};

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

export default function CargoTable({ shipments, canCreate }: { shipments: Shipment[]; canCreate?: boolean }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [destinationFilter, setDestinationFilter] = useState("");
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const [locations, setLocations] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/cargo/options")
      .then((r) => r.json())
      .then((data) => setLocations(Array.isArray(data?.locations) ? data.locations : []))
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return shipments.filter((s) => {
      if (q && !s.trackingNumber.toLowerCase().includes(q) && !s.senderName.toLowerCase().includes(q) &&
          !s.receiverName.toLowerCase().includes(q) && !(s.carrier ?? "").toLowerCase().includes(q) &&
          !(s.transportMode ?? "").toLowerCase().includes(q)) return false;
      if (statusFilter && s.status !== statusFilter) return false;
      if (sourceFilter && sourceFilter !== "All from" && s.source !== sourceFilter) return false;
      if (destinationFilter && destinationFilter !== "All to" && s.destination !== destinationFilter) return false;
      return true;
    });
  }, [shipments, search, statusFilter, sourceFilter, destinationFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const paginated = useMemo(
    () => filtered.slice((currentPage - 1) * perPage, currentPage * perPage),
    [filtered, currentPage, perPage]
  );
  const start = (currentPage - 1) * perPage + 1;
  const end = Math.min(currentPage * perPage, filtered.length);

  const statuses = [...new Set(shipments.map((s) => s.status))].sort();
  const fromOptions = ["All from", ...locations.filter((l) => l !== "All from")];
  const toOptions = ["All to", ...locations.filter((l) => l !== "All to")];

  const paginationBlock =
    filtered.length > 0 ? (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Showing {start}-{end} of {filtered.length}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Previous
          </button>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Next
          </button>
        </div>
      </div>
    ) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1 min-w-0 order-last sm:order-first">
          <input
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search tracking, carrier, transport mode, sender, receiver..."
            className="w-full min-w-0 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white sm:max-w-xs"
          />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white sm:w-52"
          >
            <option value="">All statuses</option>
            {statuses.map((st) => (
              <option key={st} value={st}>{st.replace(/_/g, " ")}</option>
            ))}
          </select>
          <SearchableOptionSelect
            options={fromOptions}
            value={sourceFilter || "All from"}
            onChange={(v) => { setSourceFilter(v === "All from" ? "" : v); setPage(1); }}
            placeholder="All from"
            emptyLabel="No locations yet"
            showAddNew={false}
            className="w-full min-w-0 sm:w-52"
          />
          <SearchableOptionSelect
            options={toOptions}
            value={destinationFilter || "All to"}
            onChange={(v) => { setDestinationFilter(v === "All to" ? "" : v); setPage(1); }}
            placeholder="All to"
            emptyLabel="No locations yet"
            showAddNew={false}
            className="w-full min-w-0 sm:w-52"
          />
        </div>
        <div className="order-first sm:order-last flex items-center gap-3 shrink-0">
          {canCreate && (
            <Link
              href="/cargo/new"
              className="inline-flex items-center justify-center rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
            >
              + New Shipment
            </Link>
          )}
          <div className="flex items-center gap-2">
            <label htmlFor="per-page" className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
              Per page
            </label>
            <select
              id="per-page"
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
              className="rounded-xl border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white w-20"
            >
              {PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border-b border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
            <thead>
              <tr>
                <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 sm:px-4 sm:py-3">
                  Tracking
                </th>
                <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 sm:px-4 sm:py-3">
                  Sender
                </th>
                <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 sm:px-4 sm:py-3">
                  Receiver
                </th>
                <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 sm:px-4 sm:py-3">
                  From
                </th>
                <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 sm:px-4 sm:py-3">
                  To
                </th>
                <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 sm:px-4 sm:py-3">
                  Carrier
                </th>
                <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 sm:px-4 sm:py-3">
                  Weight
                </th>
                <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 sm:px-4 sm:py-3">
                  Price
                </th>
                <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 sm:px-4 sm:py-3">
                  Status
                </th>
                <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 sm:px-4 sm:py-3">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {paginated.map((s) => (
                <tr key={s.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="whitespace-nowrap px-2 py-2 sm:px-4 sm:py-3">
                    <Link
                      href={`/cargo/${s.id}`}
                      className="font-mono text-sm font-medium text-amber-600 hover:underline dark:text-amber-400"
                    >
                      {s.trackingNumber}
                    </Link>
                  </td>
                  <td className="px-2 py-2 text-sm text-zinc-700 dark:text-zinc-300 sm:px-4 sm:py-3">
                    {s.senderName}{s.senderPhone ? ` ${s.senderPhone}` : ""}
                  </td>
                  <td className="px-2 py-2 text-sm text-zinc-700 dark:text-zinc-300 sm:px-4 sm:py-3">
                    {s.receiverName}{s.receiverPhone ? ` ${s.receiverPhone}` : ""}
                  </td>
                  <td className="px-2 py-2 text-sm text-zinc-700 dark:text-zinc-300 sm:px-4 sm:py-3">{s.source}</td>
                  <td className="px-2 py-2 text-sm text-zinc-700 dark:text-zinc-300 sm:px-4 sm:py-3">{s.destination}</td>
                  <td className="px-2 py-2 text-sm text-zinc-700 dark:text-zinc-300 sm:px-4 sm:py-3">
                    <span className="capitalize">{(s.transportMode ?? "air").replace("_", " ")}</span>
                    {s.carrier ? ` – ${s.carrier}` : ""}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-right text-sm text-zinc-700 dark:text-zinc-300 sm:px-4 sm:py-3">
                    {s.totalWeight} kg
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-right text-sm font-medium text-zinc-900 dark:text-white sm:px-4 sm:py-3">
                    ${s.price.toFixed(2)}
                  </td>
                  <td className="px-2 py-2 sm:px-4 sm:py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        STATUS_STYLES[s.status] ?? "bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {s.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-sm text-zinc-500 dark:text-zinc-400 sm:px-4 sm:py-3">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        {paginated.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No shipments found.
          </p>
        )}
      </div>
      {paginationBlock}
    </div>
  );
}
