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
        const rows: RateRow[] = CURRENCIES.filter((c) => c.code !== "USD").map((c) => ({
          currency: c.code,
          rateToUsd: byCode.get(c.code) ?? 0,
        }));
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
      const payload = rates.filter((r) => r.rateToUsd > 0).map((r) => ({ currency: r.currency, rateToUsd: r.rateToUsd }));
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
      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-white">Currency rates to USD</h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-lg font-medium text-zinc-900 dark:text-white">Currency rates to USD</h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Base currency is USD. Set the rate for each currency: 1 unit = X USD. Used for reports and dashboard to convert expenses into dollars.
      </p>
      <form onSubmit={handleSave} className="mt-4">
        <div className="max-h-80 overflow-y-auto rounded border border-zinc-100 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-800/80">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">Currency</th>
                <th className="px-3 py-2 text-right font-medium text-zinc-700 dark:text-zinc-300">Rate to USD (1 X = ? USD)</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((r) => {
                const info = CURRENCIES.find((c) => c.code === r.currency);
                return (
                  <tr key={r.currency} className="border-t border-zinc-100 dark:border-zinc-800">
                    <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">
                      {r.currency} {info ? `(${info.name})` : ""}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        min={0}
                        step={0.000001}
                        value={r.rateToUsd || ""}
                        onChange={(e) => updateRate(r.currency, parseFloat(e.target.value) || 0)}
                        disabled={!canEdit}
                        placeholder="0"
                        className="w-28 rounded border border-zinc-300 px-2 py-1 text-right text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white disabled:opacity-60"
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
            className="mt-4 rounded bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {saving ? "Saving…" : "Save rates"}
          </button>
        )}
      </form>
    </div>
  );
}
