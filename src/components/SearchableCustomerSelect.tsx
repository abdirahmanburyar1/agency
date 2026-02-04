"use client";

import { useState, useRef, useEffect } from "react";

type Customer = { id: string; name: string; phone?: string | null };

function formatLabel(c: Customer): string {
  return c.phone?.trim() ? `${c.name} - ${c.phone}` : c.name;
}

type Props = {
  customers: Customer[];
  value: string;
  onChange: (customerId: string) => void;
  onAddNew: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
};

export default function SearchableCustomerSelect({
  customers,
  value,
  onChange,
  onAddNew,
  placeholder = "Search or select customer...",
  disabled = false,
  className = "",
  error,
}: Props) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLabel = value ? (() => {
    const c = customers.find((c) => c.id === value);
    return c ? formatLabel(c) : "";
  })() : "";
  const displayValue = isOpen ? query : selectedLabel;

  const filtered = query.trim()
    ? customers.filter((c) =>
        formatLabel(c).toLowerCase().includes(query.toLowerCase())
      )
    : customers;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(id: string) {
    onChange(id);
    setQuery("");
    setIsOpen(false);
  }

  function handleAddNew() {
    setIsOpen(false);
    setQuery("");
    onAddNew();
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        type="text"
        value={displayValue}
        onChange={(e) => {
          const v = e.target.value;
          setQuery(v);
          setIsOpen(true);
          if (!v && value) onChange("");
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full rounded border px-3 py-2 dark:bg-zinc-800 dark:text-white ${
          error
            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
            : "border-zinc-300 dark:border-zinc-600"
        }`}
        autoComplete="off"
      />
      {error && (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
      {isOpen && (
        <ul
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
          role="listbox"
        >
          {filtered.length === 0 && !query.trim() ? (
            <li className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">
              No customers yet
            </li>
          ) : filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">
              No matches for &quot;{query}&quot;
            </li>
          ) : (
            filtered.map((c) => (
              <li
                key={c.id}
                role="option"
                tabIndex={0}
                onClick={() => handleSelect(c.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelect(c.id);
                  }
                }}
                className="cursor-pointer px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {formatLabel(c)}
              </li>
            ))
          )}
          <li
            role="option"
            tabIndex={0}
            onClick={handleAddNew}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleAddNew();
              }
            }}
            className="cursor-pointer border-t border-zinc-100 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            + Add new customer
          </li>
        </ul>
      )}
    </div>
  );
}
