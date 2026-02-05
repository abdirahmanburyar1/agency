"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SearchIcon, FilterIcon, ReceiptIcon, UsersIcon, CalendarIcon, PackageIcon, EyeIcon } from "./icons";

type BookingRow = {
  id: string;
  trackNumber: number | null;
  trackNumberDisplay: string;
  campaignId: string | null;
  campaignDisplay: string;
  customerName: string;
  customerPhone: string | null;
  date: string;
  month: string;
  status: string;
  notes: string | null;
  packageCount: number;
  packageSummary: string;
  totalAmount: number;
};

type Props = {
  bookings: BookingRow[];
  canEdit: boolean;
  initialCampaignId?: string;
};

function matchSearch(b: BookingRow, q: string): boolean {
  if (!q.trim()) return true;
  const search = q.trim().toLowerCase();
  return (
    b.customerName.toLowerCase().includes(search) ||
    (b.customerPhone ?? "").toLowerCase().includes(search) ||
    (b.trackNumberDisplay ?? "").toLowerCase().includes(search) ||
    b.campaignDisplay.toLowerCase().includes(search) ||
    b.packageSummary.toLowerCase().includes(search)
  );
}

export default function HajUmrahBookingsTable({ bookings, canEdit, initialCampaignId }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const campaignOptions = Array.from(
    new Map(bookings.filter((b) => b.campaignId).map((b) => [b.campaignId!, b.campaignDisplay])).entries()
  );
  const [campaignFilter, setCampaignFilter] = useState(initialCampaignId ?? "");

  useEffect(() => {
    if (initialCampaignId !== undefined) setCampaignFilter(initialCampaignId);
  }, [initialCampaignId]);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (!matchSearch(b, search)) return false;
      if (statusFilter && b.status !== statusFilter) return false;
      if (campaignFilter && b.campaignId !== campaignFilter) return false;
      if (dateFrom) {
        const d = new Date(b.date);
        if (d < new Date(dateFrom)) return false;
      }
      if (dateTo) {
        const d = new Date(b.date);
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (d > to) return false;
      }
      return true;
    });
  }, [bookings, search, statusFilter, campaignFilter, dateFrom, dateTo]);

  const hasFilters = search || statusFilter || campaignFilter || dateFrom || dateTo;
  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setCampaignFilter(initialCampaignId ?? "");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <>
      <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <FilterIcon />
            Filters
          </span>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-400"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <div className="relative min-w-0 w-full sm:flex-1">
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              placeholder="Search customer, track #, packages..."
            value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full min-w-0 rounded border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full min-w-0 rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white sm:w-auto"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="confirmed">Confirmed</option>
            <option value="canceled">Canceled</option>
          </select>
          <select
            value={campaignFilter}
            onChange={(e) => setCampaignFilter(e.target.value)}
            className="w-full min-w-0 rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white sm:min-w-[180px]"
          >
            <option value="">All campaigns</option>
            {campaignOptions.map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
          <div className="w-full min-w-0 sm:w-auto sm:min-w-[140px]">
            <input
              type="date"
              placeholder="From"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full min-w-0 rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              title="Date from"
            />
          </div>
          <div className="w-full min-w-0 sm:w-auto sm:min-w-[140px]">
            <input
              type="date"
              placeholder="To"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full min-w-0 rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              title="Date to"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
                <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
                  <span className="inline-flex items-center gap-1.5">
                    <ReceiptIcon className="size-4" />
                    Track #
                  </span>
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
                  <span className="inline-flex items-center gap-1.5">
                    <UsersIcon className="size-4" />
                    Customer
                  </span>
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarIcon className="size-4" />
                    Campaign
                  </span>
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">Date</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">Status</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-700 dark:text-zinc-300">
                  <span className="inline-flex items-center gap-1.5">
                    <PackageIcon className="size-4" />
                    Packages
                  </span>
                </th>
                <th className="px-4 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">Total</th>
                {canEdit && (
                  <th className="px-4 py-3 text-right font-medium text-zinc-700 dark:text-zinc-300">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 8 : 7} className="px-4 py-8 text-center text-zinc-500">
                    No bookings found. Create a booking and add one or more packages.
                  </td>
                </tr>
              ) : (
                filtered.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-zinc-100 dark:border-zinc-700/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/haj-umrah/${b.id}`}
                        className="font-medium text-zinc-900 hover:underline dark:text-white"
                      >
                        {b.trackNumberDisplay}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-zinc-900 dark:text-white">{b.customerName}</span>
                      {b.customerPhone && (
                        <span className="block text-xs text-zinc-500">{b.customerPhone}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {b.campaignDisplay}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {new Date(b.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          b.status === "confirmed"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400"
                            : b.status === "canceled"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400"
                            : "bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400" title={b.packageSummary || undefined}>
                      {b.packageCount > 0 ? (
                        <span>{b.packageCount} {b.packageCount === 1 ? "package" : "packages"}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-white">
                      ${b.totalAmount.toLocaleString()}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/haj-umrah/${b.id}`}
                          className="inline-flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                        >
                          <EyeIcon className="size-4" />
                          View
                        </Link>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
