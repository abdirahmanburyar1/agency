"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SearchableOptionSelect from "@/components/SearchableOptionSelect";
import SearchableCurrencySelect from "@/components/SearchableCurrencySelect";
import { getCurrencySymbol } from "@/lib/currencies";

type ItemRow = { id: string; description: string; quantity: string; weight: string; unitPrice: string };
type Location = { id: string; name: string; branches: { id: string; name: string }[] };

type Props = {
  userLocationId?: string | null;
  userBranchId?: string | null;
  userLocationName?: string | null;
  userBranchName?: string | null;
};

export default function CreateCargoForm({
  userLocationId: propLocationId,
  userBranchId: propBranchId,
  userLocationName: propLocationName,
  userBranchName: propBranchName,
}: Props) {
  const router = useRouter();
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [sourceLocationId, setSourceLocationId] = useState(propLocationId ?? "");
  const [sourceBranchId, setSourceBranchId] = useState(propBranchId ?? "");
  const [destLocationId, setDestLocationId] = useState("");
  const [destBranchId, setDestBranchId] = useState("");
  const [transportMode, setTransportMode] = useState<"air" | "road" | "sea">("air");
  const [carrier, setCarrier] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [locations, setLocations] = useState<Location[]>([]);
  const [carriersByMode, setCarriersByMode] = useState<{ air: string[]; road: string[]; sea: string[] }>({
    air: [],
    road: [],
    sea: [],
  });
  const [showAddCarrierModal, setShowAddCarrierModal] = useState(false);
  const [newCarrierValue, setNewCarrierValue] = useState("");

  const carriers = carriersByMode[transportMode] ?? [];

  useEffect(() => {
    fetch("/api/cargo/options")
      .then((r) => r.json())
      .then((data) => {
        setLocations(Array.isArray(data?.locations) ? data.locations : []);
        setCarriersByMode(data?.carriersByMode ?? { air: [], road: [], sea: [] });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (propLocationId) setSourceLocationId(propLocationId);
    if (propBranchId) setSourceBranchId(propBranchId);
  }, [propLocationId, propBranchId]);

  const hasUserLocation = !!(propLocationId && propBranchId);

  const sourceBranches = sourceLocationId
    ? (locations.find((l) => l.id === sourceLocationId)?.branches ?? [])
    : [];
  const destBranches = destLocationId
    ? (locations.find((l) => l.id === destLocationId)?.branches ?? [])
    : [];

  async function addNewCarrier() {
    const v = newCarrierValue.trim();
    if (!v) return;
    const type = `cargo_carrier_${transportMode}`;
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, value: v }),
    });
    if (res.ok) {
      setCarriersByMode((prev) => ({
        ...prev,
        [transportMode]: [...(prev[transportMode] ?? []), v].sort(),
      }));
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

    if (!hasUserLocation) {
      setError("Your account must have a location and branch assigned to create cargo. Contact your administrator.");
      return;
    }
    if (!senderName.trim()) {
      setError("Sender name is required");
      return;
    }
    if (!receiverName.trim()) {
      setError("Receiver name is required");
      return;
    }
    if (!destLocationId || !destBranchId) {
      setError("Destination location and branch are required");
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
          sourceBranchId,
          destinationBranchId: destBranchId,
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
              From * (your branch)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={propLocationName ?? locations.find((l) => l.id === sourceLocationId)?.name ?? "—"}
                readOnly
                disabled
                className="flex-1 cursor-not-allowed rounded-xl border border-zinc-300 bg-zinc-100 px-4 py-3 text-base dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              />
              <input
                type="text"
                value={propBranchName ?? sourceBranches.find((b) => b.id === sourceBranchId)?.name ?? "—"}
                readOnly
                disabled
                className="flex-1 cursor-not-allowed rounded-xl border border-zinc-300 bg-zinc-100 px-4 py-3 text-base dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              />
            </div>
            {!hasUserLocation && (
              <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                You need a location and branch assigned to create cargo. Contact your administrator.
              </p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              To *
            </label>
            <div className="flex gap-2">
              <select
                value={destLocationId}
                onChange={(e) => {
                  setDestLocationId(e.target.value);
                  setDestBranchId("");
                }}
                required
                className="flex-1 rounded-xl border border-zinc-300 px-4 py-3 text-base dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              >
                <option value="">Location</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
              <select
                value={destBranchId}
                onChange={(e) => setDestBranchId(e.target.value)}
                required
                className="flex-1 rounded-xl border border-zinc-300 px-4 py-3 text-base dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              >
                <option value="">Branch</option>
                {destBranches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Transport Mode *
            </label>
            <select
              value={transportMode}
              onChange={(e) => {
                const mode = e.target.value as "air" | "road" | "sea";
                setTransportMode(mode);
                setCarrier("");
              }}
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-base dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            >
              <option value="air">Airline</option>
              <option value="road">Road</option>
              <option value="sea">Sea</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Carrier * ({transportMode === "air" ? "Airline" : transportMode === "road" ? "Road" : "Sea"})
            </label>
            <SearchableOptionSelect
              options={carriers}
              value={carrier}
              onChange={setCarrier}
              onAddNew={() => setShowAddCarrierModal(true)}
              placeholder={transportMode === "air" ? "e.g. Daallo Airline" : transportMode === "road" ? "e.g. Bus company" : "e.g. Shipping line"}
              emptyLabel={`No ${transportMode} carriers yet`}
              addNewLabel={`+ Add ${transportMode} carrier`}
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
          disabled={loading || !hasUserLocation}
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
              Add {transportMode === "air" ? "airline" : transportMode === "road" ? "road" : "sea"} carrier
            </h3>
            <input
              type="text"
              value={newCarrierValue}
              onChange={(e) => setNewCarrierValue(e.target.value)}
              placeholder={transportMode === "air" ? "e.g. Daallo Airline" : transportMode === "road" ? "e.g. Bus company" : "e.g. Shipping line"}
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
