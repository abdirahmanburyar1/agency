"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

function getCurrentMonthDateStrings(): { from: string; to: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const from = `${y}-${String(m + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(y, m + 1, 0).getDate();
  const to = `${y}-${String(m + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}

export default function DashboardDateFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentMonth = getCurrentMonthDateStrings();

  const fromParam = searchParams.get("from") ?? "";
  const toParam = searchParams.get("to") ?? "";

  const displayFrom = fromParam || currentMonth.from;
  const displayTo = toParam || currentMonth.to;

  const applyFilter = useCallback(
    (from: string, to: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (from) params.set("from", from);
      else params.delete("from");
      if (to) params.set("to", to);
      else params.delete("to");
      router.push(`/?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const from = e.target.value;
    applyFilter(from, toParam || currentMonth.to);
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const to = e.target.value;
    applyFilter(fromParam || currentMonth.from, to);
  };

  const clearFilter = () => {
    router.push("/", { scroll: false });
  };

  const hasFilter = fromParam || toParam;

  return (
    <div className="mb-6 flex flex-wrap items-end gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80">
      <h3 className="w-full text-sm font-semibold text-slate-700 dark:text-slate-300 sm:w-auto">
        Filter by date
      </h3>
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
            From (day / month / year)
          </label>
          <input
            type="date"
            value={displayFrom}
            onChange={handleFromChange}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
            To (day / month / year)
          </label>
          <input
            type="date"
            value={displayTo}
            onChange={handleToChange}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>
        {hasFilter && (
          <button
            type="button"
            onClick={clearFilter}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Clear filter
          </button>
        )}
      </div>
      <p className="w-full text-xs text-slate-500 dark:text-slate-400 sm:w-auto">
        {hasFilter ? "Cards and chart show data for the selected date range only." : "Default: current month. Set From/To to filter by a custom range."}
      </p>
    </div>
  );
}
