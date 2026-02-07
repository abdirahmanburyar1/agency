"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SearchableOptionSelect from "@/components/SearchableOptionSelect";
import SearchableCurrencySelect from "@/components/SearchableCurrencySelect";
import { getCurrencySymbol } from "@/lib/currencies";

type ItemRow = { id: string; description: string; quantity: string; weight: string; unitPrice: string };

export default function CreateCargoForm() {
  const router = useRouter();
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [transportMode, setTransportMode] = useState<"air" | "road" | "sea">("air");
  const [carrier, setCarrier] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [locations, setLocations] = useState<string[]>([]);
  const [carriers, setCarriers] = useState<string[]>([]);
  const [showAddLocationModal, setShowAddLocationModal] = useState(false);
  const [addLocationTarget, setAddLocationTarget] = useState<"from" | "to" | null>(null);
  const [newLocationValue, setNewLocationValue] = useState("");
  const [showAddCarrierModal, setShowAddCarrierModal] = useState(false);
  const [newCarrierValue, setNewCarrierValue] = useState("");

  useEffect(() => {
    fetch("/api/cargo/options")
      .then((r) => r.json())
      .then((data) => {
        setLocations(Array.isArray(data?.locations) ? data.locations : []);
        setCarriers(Array.isArray(data?.carriers) ? data.carriers : []);
      })
      .catch(() => {});
  }, []);

  function openAddLocationModal(target: "from" | "to") {
    setAddLocationTarget(target);
    setShowAddLocationModal(true);
  }

  async function addNewLocation() {
    const v = newLocationValue.trim();
    if (!v) return;
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "cargo_location", value: v }),
    });
    if (res.ok) {
      setLocations((prev) => [...prev, v].sort());
      setNewLocationValue("");
      setShowAddLocationModal(false);
      if (addLocationTarget === "from") setSource(v);
      else if (addLocationTarget === "to") setDestination(v);
      setAddLocationTarget(null);
    }
  }

  async function addNewCarrier() {
    const v = newCarrierValue.trim();
    if (!v) return;
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "cargo_carrier", value: v }),
    });
    if (res.ok) {
      setCarriers((prev) => [...prev, v].sort());
      setNewCarrierValue("");
      setShowAddCarrierModal(false);
      setCarrier(v);
    }
  }
  const [items, setItems] = useState<ItemRow[]>([
    { id: crypto.randomUUID(), description: "", quantity: "1", weight: "", unitPrice: "5" },
  ]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const addItem = () => {
    setItems((prev) => [...prev, { id: crypto.randomUUID(), description: "", quantity: "1", weight: "", unitPrice: "5" }]);
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItem = (id: string, field: keyof ItemRow, value: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  const totalWeight = items.reduce((sum, i) => {
    const q = Math.max(0, Number(i.quantity) || 0);
    const w = Math.max(0, Number(i.weight) || 0);
    return sum + q * w;
  }, 0);
  const price = items.reduce((sum, i) => {
    const q = Math.max(0, Number(i.quantity) || 0);
    const w = Math.max(0, Number(i.weight) || 0);
    const r = Math.max(0, Number(i.unitPrice) || 0);
    return sum + q * w * r;
  }, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!senderName.trim()) {
      setError("Sender name is required");
      return;
    }
    if (!receiverName.trim()) {
      setError("Receiver name is required");
      return;
    }
    if (!source.trim()) {
      setError("Source (from) is required");
      return;
    }
    if (!destination.trim()) {
      setError("Destination (to) is required");
      return;
    }
    if (!carrier.trim()) {
      setError("Carrier is required");
      return;
    }

    const validItems = items
      .map((i) => ({
        description: i.description.trim(),
        quantity: Math.max(0, Number(i.quantity) || 0),
        weight: Math.max(0, Number(i.weight) || 0),
        unitPrice: Math.max(0, Number(i.unitPrice) || 0),
      }))
      .filter((i) => i.description && (i.quantity > 0 || i.weight > 0));

    if (validItems.length === 0) {
      setError("Add at least one item with description and weight");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/cargo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName: senderName.trim(),
          senderPhone: senderPhone.trim(),
          receiverName: receiverName.trim(),
          receiverPhone: receiverPhone.trim(),
          source: source.trim(),
          destination: destination.trim(),
          transportMode,
          carrier: carrier.trim(),
          currency,
          items: validItems,
        }),
      });
      let data: { error?: string; id?: string } = {};
        try {
          data = await res.json();
        } catch {
          /* non-JSON response */
        }
      if (!res.ok) {
        setError(data.error ?? `Failed to create shipment (${res.status})`);
        return;
      }
      router.push(`/cargo/${data.id}`);
      router.refresh();
    } catch {
      setError("Failed to create shipment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Sender & Receiver
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Sender Name *
            </label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-base dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Sender Phone
            </label>
            <input
              type="tel"
              value={senderPhone}
              onChange={(e) => setSenderPhone(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-base dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Receiver Name *
            </label>
            <input
              type="text"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-base dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Receiver Phone
            </label>
            <input
              type="tel"
              value={receiverPhone}
              onChange={(e) => setReceiverPhone(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-base dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              From *
            </label>
            <SearchableOptionSelect
              options={locations}
              value={source}
              onChange={setSource}
              onAddNew={() => openAddLocationModal("from")}
              placeholder="Search or select location..."
              emptyLabel="No locations yet"
              addNewLabel="+ Add new location"
              className="rounded-xl border border-zinc-300 px-4 py-3 text-base dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              To *
            </label>
            <SearchableOptionSelect
              options={locations}
              value={destination}
              onChange={setDestination}
              onAddNew={() => openAddLocationModal("to")}
              placeholder="Search or select location..."
              emptyLabel="No locations yet"
              addNewLabel="+ Add new location"
              className="rounded-xl border border-zinc-300 px-4 py-3 text-base dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Transport Mode *
            </label>
            <select
              value={transportMode}
              onChange={(e) => setTransportMode(e.target.value as "air" | "road" | "sea")}
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-base dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            >
              <option value="air">Airline</option>
              <option value="road">Road</option>
              <option value="sea">Sea</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Carrier *
            </label>
            <SearchableOptionSelect
              options={carriers}
              value={carrier}
              onChange={setCarrier}
              onAddNew={() => setShowAddCarrierModal(true)}
              placeholder="e.g. Daallo Airline, Doontii hebel, Bus"
              emptyLabel="No carriers yet"
              addNewLabel="+ Add new carrier"
              className="rounded-xl border border-zinc-300 px-4 py-3 text-base dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Items
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
            <thead>
              <tr>
                <th className="w-1/2 min-w-[200px] px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 sm:px-3 sm:py-3">
                  Description
                </th>
                <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 sm:px-3 sm:py-3">
                  Qty
                </th>
                <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 sm:px-3 sm:py-3">
                  Weight (kg)
                </th>
                <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 sm:px-3 sm:py-3">
                  $/kg
                </th>
                <th className="w-20 min-w-[5rem] px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 sm:px-3 sm:py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {items.map((item) => (
                <tr key={item.id} className="align-top">
                  <td className="min-w-[200px] px-2 py-2 sm:px-3 sm:py-3">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, "description", e.target.value)}
                      placeholder="e.g. Box of clothes"
                      className="w-full min-w-[180px] rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                    />
                  </td>
                  <td className="px-2 py-2 sm:px-3 sm:py-3">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, "quantity", e.target.value)}
                      className="w-full min-w-[4rem] rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                    />
                  </td>
                  <td className="px-2 py-2 sm:px-3 sm:py-3">
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={item.weight}
                      onChange={(e) => updateItem(item.id, "weight", e.target.value)}
                      placeholder="0"
                      className="w-full min-w-[5rem] rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                    />
                  </td>
                  <td className="px-2 py-2 sm:px-3 sm:py-3">
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, "unitPrice", e.target.value)}
                      placeholder="5"
                      className="w-full min-w-[5rem] rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                    />
                  </td>
                  <td className="w-20 min-w-[5rem] whitespace-nowrap px-2 py-2 sm:px-3 sm:py-3">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={addItem}
                        className="flex size-8 shrink-0 items-center justify-center rounded bg-amber-600 text-lg font-bold text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
                        title="Add item"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length <= 1}
                        className="flex size-8 shrink-0 items-center justify-center rounded border border-red-300 text-lg font-bold text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/50"
                        title="Remove item"
                      >
                        −
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-6 border-t border-zinc-200 pt-4 dark:border-zinc-700">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Total Weight: <span className="font-semibold">{totalWeight.toFixed(2)} kg</span>
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Total Price:{" "}
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {getCurrencySymbol(currency)}
                {price.toFixed(2)}
              </span>
            </p>
            <div className="w-44">
              <SearchableCurrencySelect
                value={currency}
                onChange={setCurrency}
                placeholder="Currency"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-xl bg-amber-600 px-6 py-4 text-base font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:opacity-70 dark:bg-amber-500 dark:hover:bg-amber-600"
        >
          {loading ? "Creating..." : "Create Shipment"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-zinc-300 px-6 py-4 text-base font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>

      {showAddLocationModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => (setShowAddLocationModal(false), setNewLocationValue(""), setAddLocationTarget(null))}
        >
          <div
            className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-medium text-zinc-900 dark:text-white">
              Add new location
            </h3>
            <input
              type="text"
              value={newLocationValue}
              onChange={(e) => setNewLocationValue(e.target.value)}
              placeholder="e.g. Nairobi, Dubai"
              className="mb-4 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addNewLocation();
                }
                if (e.key === "Escape") {
                  setShowAddLocationModal(false);
                  setNewLocationValue("");
                  setAddLocationTarget(null);
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => (setShowAddLocationModal(false), setNewLocationValue(""), setAddLocationTarget(null))}
                className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addNewLocation}
                className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddCarrierModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => (setShowAddCarrierModal(false), setNewCarrierValue(""))}
        >
          <div
            className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-medium text-zinc-900 dark:text-white">
              Add new carrier
            </h3>
            <input
              type="text"
              value={newCarrierValue}
              onChange={(e) => setNewCarrierValue(e.target.value)}
              placeholder="e.g. Daallo Airline, Doontii hebel, Bus"
              className="mb-4 w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addNewCarrier();
                }
                if (e.key === "Escape") {
                  setShowAddCarrierModal(false);
                  setNewCarrierValue("");
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => (setShowAddCarrierModal(false), setNewCarrierValue(""))}
                className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addNewCarrier}
                className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
