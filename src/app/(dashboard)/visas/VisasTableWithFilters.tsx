"use client";

import Link from "next/link";
import { useMemo, useState, useRef, useEffect } from "react";

type SerializedVisa = {
  id: string;
  visaNumber: number | null;
  reference: string;
  date: string;
  customerId: string | null;
  customer: string | null;
  country: string | null;
  netCost: number;
  netSales: number;
  profit: number;
  customerRelation: { name: string; phone: string | null } | null;
};

type VisasTableWithFiltersProps = {
  visas: SerializedVisa[];
  countries: string[];
  canEdit: boolean;
};

function matchSearch(visa: SerializedVisa, q: string): boolean {
  if (!q.trim()) return true;
  const search = q.trim().toLowerCase();
  const visaNo =
    visa.visaNumber != null
      ? String(visa.visaNumber).padStart(3, "0")
      : "";
  const custName = visa.customerRelation?.name ?? visa.customer ?? "";
  const custPhone = visa.customerRelation?.phone ?? "";
  const ref = visa.reference ?? "";
  return (
    custName.toLowerCase().includes(search) ||
    custPhone.toLowerCase().includes(search) ||
    visaNo.toLowerCase().includes(search) ||
    ref.toLowerCase().includes(search)
  );
}

export default function VisasTableWithFilters({
  visas: allVisas,
  countries,
  canEdit,
}: VisasTableWithFiltersProps) {
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const countryListRef = useRef<HTMLDivElement>(null);

  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter((c) => c.toLowerCase().includes(q));
  }, [countries, countrySearch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (countryListRef.current && !countryListRef.current.contains(e.target as Node)) {
        setCountryOpen(false);
        if (country) setCountrySearch(country);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [country]);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredVisas = useMemo(() => {
    return allVisas.filter((v) => {
      if (!matchSearch(v, search)) return false;
      if (country && (v.country ?? "") !== country) return false;
      if (dateFrom) {
        const d = new Date(v.date);
        const from = new Date(dateFrom);
        if (d < from) return false;
      }
      if (dateTo) {
        const d = new Date(v.date);
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        if (d > to) return false;
      }
      return true;
    });
  }, [allVisas, search, country, dateFrom, dateTo]);

  const hasActiveFilters = search || country || dateFrom || dateTo;

  const clearFilters = () => {
    setSearch("");
    setCountry("");
    setCountrySearch("");
    setDateFrom("");
    setDateTo("");
  };

  const selectCountry = (c: string) => {
    setCountry(c);
    setCountrySearch(c);
    setCountryOpen(false);
  };

  const colSpan = canEdit ? 9 : 8;

  return (
    <>
      <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Filters
          </h2>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-400"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3">
          <div className="min-w-0 w-full sm:flex-1">
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Customer, phone, visa no, ref..."
              className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          <div className="relative w-full min-w-0 sm:w-48" ref={countryListRef}>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Country
            </label>
            <input
              type="text"
              value={countrySearch}
              onChange={(e) => {
                setCountrySearch(e.target.value);
                setCountryOpen(true);
                if (!e.target.value) setCountry("");
              }}
              onFocus={() => setCountryOpen(true)}
              placeholder="Search or select country..."
              className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
            {countryOpen && (
              <div className="absolute top-full left-0 z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setCountry("");
                    setCountrySearch("");
                    setCountryOpen(false);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 dark:text-zinc-400"
                >
                  All countries
                </button>
                {filteredCountries.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">No match</div>
                ) : (
                  filteredCountries.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => selectCountry(c)}
                      className={`block w-full px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 ${
                        country === c ? "bg-emerald-50 font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "text-zinc-900 dark:text-white"
                      }`}
                    >
                      {c}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <div className="w-full min-w-0 sm:w-auto sm:min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Date from
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full min-w-0 rounded-lg border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          <div className="w-full min-w-0 sm:w-auto sm:min-w-[140px]">
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Date to
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full min-w-0 rounded-lg border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
              <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">Visa No</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">Reference</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">Date</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">Customer</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">Country</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-white">Net Cost</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-white">Net Sales</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-white">Profit</th>
              {canEdit && (
                <th className="px-4 py-3 text-left font-medium text-zinc-900 dark:text-white">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredVisas.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-4 py-8 text-center text-zinc-500">
                  No visas found
                </td>
              </tr>
            ) : (
              filteredVisas.map((v) => (
                <tr key={v.id} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    <Link
                      href={`/visas/${v.id}`}
                      className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {v.visaNumber != null
                        ? String(v.visaNumber).padStart(3, "0")
                        : "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {v.reference?.trim() || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {new Date(v.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {v.customerRelation
                      ? (v.customerRelation.phone?.trim() ? `${v.customerRelation.name} - ${v.customerRelation.phone}` : v.customerRelation.name)
                      : (v.customer ?? "—")}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{v.country ?? "—"}</td>
                  <td className="px-4 py-3 text-right text-zinc-700 dark:text-zinc-300">
                    ${v.netCost.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-700 dark:text-zinc-300">
                    ${v.netSales.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-green-600 dark:text-green-400">
                    ${v.profit.toLocaleString()}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3">
                      <Link
                        href={`/visas/${v.id}/edit`}
                        className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Edit
                      </Link>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
