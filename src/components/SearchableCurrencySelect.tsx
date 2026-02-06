"use client";

import { useState, useRef, useEffect } from "react";
import { CURRENCIES } from "@/lib/currencies";

type CurrencyOption = (typeof CURRENCIES)[number];

type Props = {
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export default function SearchableCurrencySelect({
  value,
  onChange,
  placeholder = "Search currency by code or name...",
  disabled = false,
  className = "",
}: Props) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = CURRENCIES.find((c) => c.code === value);
  const displayValue = isOpen ? query : (selected ? `${selected.code} — ${selected.name}` : value || "");

  const filtered = query.trim()
    ? CURRENCIES.filter(
        (c) =>
          c.code.toLowerCase().includes(query.toLowerCase()) ||
          c.name.toLowerCase().includes(query.toLowerCase())
      )
    : CURRENCIES;

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

  function handleSelect(c: CurrencyOption) {
    onChange(c.code);
    setQuery("");
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        type="text"
        value={displayValue}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
        autoComplete="off"
      />
      {isOpen && (
        <ul
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
          role="listbox"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">
              No matches for &quot;{query}&quot;
            </li>
          ) : (
            filtered.map((c) => (
              <li
                key={c.code}
                role="option"
                tabIndex={0}
                onClick={() => handleSelect(c)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelect(c);
                  }
                }}
                className={`cursor-pointer px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                  c.code === value ? "bg-zinc-100 dark:bg-zinc-800 font-medium" : ""
                }`}
              >
                <span className="font-medium">{c.code}</span>
                <span className="text-zinc-500 dark:text-zinc-400"> — </span>
                {c.name}
                <span className="ml-1 text-zinc-400 dark:text-zinc-500">({c.symbol})</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
