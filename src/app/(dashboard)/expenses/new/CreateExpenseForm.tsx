"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SearchableEmployeeSelect from "@/components/SearchableEmployeeSelect";
import SearchableCountrySelect from "@/components/SearchableCountrySelect";
import SearchableCurrencySelect from "@/components/SearchableCurrencySelect";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function CreateExpenseForm() {
  const router = useRouter();
  const [categories, setCategories] = useState<string[]>([]);
  const [employees, setEmployees] = useState<{ id: string; name: string; role?: string | null; phone?: string | null }[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [newEmployeeRole, setNewEmployeeRole] = useState("");
  const [newEmployeePhone, setNewEmployeePhone] = useState("");
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryValue, setNewCategoryValue] = useState("");
  const [showAddPaymentMethodModal, setShowAddPaymentMethodModal] = useState(false);
  const [newPaymentMethodValue, setNewPaymentMethodValue] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const monthDefault = new Date().toISOString().slice(0, 7);
  const [date, setDate] = useState(today);
  const [monthValue, setMonthValue] = useState(monthDefault);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [pMethod, setPMethod] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/expenses/options")
      .then((r) => r.json())
      .then((data) => {
        setCategories(data.categories ?? []);
        setEmployees(data.employees ?? []);
        setPaymentMethods(data.paymentMethods ?? []);
      })
      .catch(() => {});
  }, []);

  function onDateChange(value: string) {
    setDate(value);
    if (value) setMonthValue(value.slice(0, 7));
  }

  function onMonthChange(value: string) {
    setMonthValue(value);
    if (value) setDate(value + "-01");
  }

  function monthToName(ym: string): string {
    if (!ym || ym.length < 7) return MONTHS[new Date().getMonth()];
    const m = parseInt(ym.slice(5, 7), 10);
    return MONTHS[m - 1] ?? MONTHS[new Date().getMonth()];
  }

  async function addNewEmployee() {
    const name = newEmployeeName.trim();
    if (!name) return;
    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        role: newEmployeeRole.trim() || null,
        phone: newEmployeePhone.trim() || null,
      }),
    });
    if (res.ok) {
      const created = await res.json();
      setEmployees((prev) =>
        [...prev, { id: created.id, name: created.name, role: created.role, phone: created.phone }].sort(
          (a, b) => a.name.localeCompare(b.name)
        )
      );
      setEmployeeId(created.id);
      setNewEmployeeName("");
      setNewEmployeeRole("");
      setNewEmployeePhone("");
      setShowAddEmployeeModal(false);
    }
  }

  async function addNewCategory() {
    const v = newCategoryValue.trim();
    if (!v) return;
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "expense_category", value: v }),
    });
    if (res.ok) {
      setCategories((prev) => [...prev, v].sort());
      setCategory(v);
      setNewCategoryValue("");
      setShowAddCategoryModal(false);
    }
  }

  async function addNewPaymentMethod() {
    const v = newPaymentMethodValue.trim();
    if (!v) return;
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "payment_method", value: v }),
    });
    if (res.ok) {
      setPaymentMethods((prev) => [...prev, v].sort());
      setPMethod(v);
      setNewPaymentMethodValue("");
      setShowAddPaymentMethodModal(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          month: monthToName(monthValue),
          amount: amt,
          currency,
          description: description.trim() || null,
          category: category.trim() || null,
          employeeId: employeeId || null,
          pMethod: pMethod.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create expense");
        return;
      }
      router.push("/expenses");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Amount & Currency - prominent */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Amount
        </h2>
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[140px] flex-1">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Amount *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="0.00"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-3 text-lg font-semibold tabular-nums dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          <div className="w-full sm:w-64">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Currency</label>
            <SearchableCurrencySelect
              value={currency}
              onChange={setCurrency}
              placeholder="Search currency by code or name..."
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Core details */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Details
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Month</label>
            <input
              type="month"
              value={monthValue}
              onChange={(e) => onMonthChange(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Category</label>
            <SearchableCountrySelect
              options={categories}
              value={category}
              onChange={setCategory}
              onAddNew={() => setShowAddCategoryModal(true)}
              placeholder="e.g. Employees, Utilities, Rent..."
              className="mt-1"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. January salary, Electricity bill"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Employee (optional)</label>
            <SearchableEmployeeSelect
              employees={employees}
              value={employeeId}
              onChange={setEmployeeId}
              onAddNew={() => setShowAddEmployeeModal(true)}
              placeholder="Select employee when applicable..."
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Payment info */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Payment
        </h2>
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Payment method</label>
          <SearchableCountrySelect
            options={paymentMethods}
            value={pMethod}
            onChange={setPMethod}
            onAddNew={() => setShowAddPaymentMethodModal(true)}
            placeholder="Cash, Card, Transfer..."
            className="mt-1"
          />
        </div>
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          Paid by is recorded automatically when Finance marks the expense as paid.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {loading ? "Creating..." : "Create Expense"}
        </button>
        <Link
          href="/expenses"
          className="rounded-lg border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Cancel
        </Link>
      </div>

      {showAddEmployeeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() =>
            (setShowAddEmployeeModal(false), setNewEmployeeName(""), setNewEmployeeRole(""), setNewEmployeePhone(""))
          }
        >
          <div
            className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">Add new employee</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={newEmployeeName}
                onChange={(e) => setNewEmployeeName(e.target.value)}
                placeholder="Name *"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
                autoFocus
              />
              <input
                type="text"
                value={newEmployeeRole}
                onChange={(e) => setNewEmployeeRole(e.target.value)}
                placeholder="Role / Position"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              />
              <input
                type="text"
                value={newEmployeePhone}
                onChange={(e) => setNewEmployeePhone(e.target.value)}
                placeholder="Phone"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  (setShowAddEmployeeModal(false), setNewEmployeeName(""), setNewEmployeeRole(""), setNewEmployeePhone(""))
                }
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addNewEmployee}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddCategoryModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => (setShowAddCategoryModal(false), setNewCategoryValue(""))}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">Add new category</h3>
            <input
              type="text"
              value={newCategoryValue}
              onChange={(e) => setNewCategoryValue(e.target.value)}
              placeholder="e.g. Employees, Utilities, Rent"
              className="mb-4 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addNewCategory();
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => (setShowAddCategoryModal(false), setNewCategoryValue(""))}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addNewCategory}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddPaymentMethodModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => (setShowAddPaymentMethodModal(false), setNewPaymentMethodValue(""))}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">Add payment method</h3>
            <input
              type="text"
              value={newPaymentMethodValue}
              onChange={(e) => setNewPaymentMethodValue(e.target.value)}
              placeholder="e.g. Cash, Card, Transfer"
              className="mb-4 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addNewPaymentMethod();
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => (setShowAddPaymentMethodModal(false), setNewPaymentMethodValue(""))}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addNewPaymentMethod}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
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
