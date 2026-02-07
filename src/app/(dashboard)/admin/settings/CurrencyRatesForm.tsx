"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CURRENCIES } from "@/lib/currencies";

type RateRow = { currency: string; rateToUsd: number };

export default function CurrencyRatesForm({ canEdit }: { canEdit: boolean }) {
  const router = useRouter();
  const [rates, setRates] = useState<RateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings/currency-rates")
      .then((r) => r.json())
      .then((data: { currency: string; rateToUsd: number }[]) => {
        const byCode = new Map(data.map((r) => [r.currency, r.rateToUsd]));
        const rows: RateRow[] = CURRENCIES.filter((c) => c.code !== "USD").map((c) => {
          const stored = byCode.get(c.code);
          return { currency: c.code, rateToUsd: stored && stored > 0 ? stored : 0 };
        });
        setRates(rows);
      })
      .finally(() => setLoading(false));
  }, []);

  function updateRate(currency: string, rateToUsd: number) {
    setRates((prev) =>
      prev.map((r) => (r.currency === currency ? { ...r, rateToUsd } : r))
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit || saving) return;
    setSaving(true);
    try {
      // Store the value as entered (1 USD = X units). Conversion uses amount / rate.
      const payload = rates
        .filter((r) => r.rateToUsd > 0)
        .map((r) => ({ currency: r.currency, rateToUsd: r.rateToUsd }));
      const res = await fetch("/api/settings/currency-rates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rates: payload }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Currency rates to USD</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Currency rates to USD</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Enter the rate: how many units of that currency equal 1 USD. Example: 128 KES = 1 USD, enter 128. Stored and used as-is in reports and dashboard.
      </p>
      <form onSubmit={handleSave} className="mt-4">
        <div className="max-h-80 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/80">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-300">Currency</th>
                <th className="px-3 py-2 text-right font-medium text-slate-700 dark:text-slate-300">Units = 1 USD</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((r) => {
                const info = CURRENCIES.find((c) => c.code === r.currency);
                return (
                  <tr key={r.currency} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                      {r.currency} {info ? `(${info.name})` : ""}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={r.rateToUsd || ""}
                        onChange={(e) => updateRate(r.currency, parseFloat(e.target.value) || 0)}
                        disabled={!canEdit}
                        placeholder="0"
                        className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-right text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white disabled:opacity-60"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {canEdit && (
          <button
            type="submit"
            disabled={saving}
            className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-500 dark:hover:bg-emerald-600"
          >
            {saving ? "Saving…" : "Save rates"}
          </button>
        )}
      </form>
    </div>
  );
}
