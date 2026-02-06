"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type VisaPrice = { country: string; price: number };

export default function CreatePackageForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<"haj" | "umrah">("umrah");
  const [description, setDescription] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [visaPrices, setVisaPrices] = useState<VisaPrice[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings/ticket-options")
      .then((r) => r.json())
      .then((data) => setCountries(Array.isArray(data?.country) ? data.country : []))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const validVisaPrices = visaPrices.filter((v) => v.country.trim() && v.price >= 0);
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (validVisaPrices.length === 0) {
      setError("Add at least one visa price by country.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/haj-umrah/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          description: description.trim() || null,
          durationDays: durationDays ? Number(durationDays) || null : null,
          isActive,
          visaPrices: validVisaPrices,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create package");
        return;
      }
      router.push("/haj-umrah/packages");
      router.refresh();
    } catch {
      setError("Failed to create package");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </p>
      )}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Type *</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as "haj" | "umrah")}
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
        >
          <option value="haj">Haj</option>
          <option value="umrah">Umrah</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Duration (days)</label>
          <input
            type="number"
            min={0}
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Visa price by country *
        </label>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          Country-specific prices. Matched to booking passport country.
        </p>
        <div className="mt-2 space-y-2">
          {visaPrices.map((v, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                list="visa-country-list"
                value={v.country}
                onChange={(e) =>
                  setVisaPrices((prev) => prev.map((p, j) => (j === i ? { ...p, country: e.target.value } : p)))
                }
                placeholder="Country"
                className="w-40 rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              />
              <datalist id="visa-country-list">
                {countries.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <input
                type="number"
                min={0}
                step={0.01}
                value={v.price || ""}
                onChange={(e) =>
                  setVisaPrices((prev) => prev.map((p, j) => (j === i ? { ...p, price: Number(e.target.value) || 0 } : p)))
                }
                placeholder="Price"
                className="w-24 rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setVisaPrices((prev) => prev.filter((_, j) => j !== i))}
                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setVisaPrices((prev) => [...prev, { country: "", price: 0 }])}
            className="text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
          >
            + Add visa price
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="rounded border-zinc-300 dark:border-zinc-600"
        />
        <label htmlFor="isActive" className="text-sm text-zinc-700 dark:text-zinc-300">
          Active (available for new bookings)
        </label>
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {loading ? "Creating…" : "Create Package"}
        </button>
        <Link
          href="/haj-umrah/packages"
          className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
