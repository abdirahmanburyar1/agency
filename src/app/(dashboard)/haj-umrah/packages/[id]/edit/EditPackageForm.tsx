"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Props = {
  id: string;
  initialName: string;
  initialType: "haj" | "umrah";
  initialDescription: string;
  initialDefaultPrice: number;
  initialDurationDays: number | "";
  initialIsActive: boolean;
};

export default function EditPackageForm({
  id,
  initialName,
  initialType,
  initialDescription,
  initialDefaultPrice,
  initialDurationDays,
  initialIsActive,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [type, setType] = useState<"haj" | "umrah">(initialType);
  const [description, setDescription] = useState(initialDescription);
  const [defaultPrice, setDefaultPrice] = useState(String(initialDefaultPrice));
  const [durationDays, setDurationDays] = useState(initialDurationDays === "" ? "" : String(initialDurationDays));
  const [isActive, setIsActive] = useState(initialIsActive);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const price = Number(defaultPrice);
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (Number.isNaN(price) || price < 0) {
      setError("Enter a valid default price.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/haj-umrah/packages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          description: description.trim() || null,
          defaultPrice: price,
          durationDays: durationDays ? Number(durationDays) || null : null,
          isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to update package");
        return;
      }
      router.push("/haj-umrah/packages");
      router.refresh();
    } catch {
      setError("Failed to update package");
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
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Default Price *</label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={defaultPrice}
            onChange={(e) => setDefaultPrice(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            required
          />
        </div>
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
          {loading ? "Saving…" : "Save"}
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
