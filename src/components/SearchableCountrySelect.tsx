"use client";

import { useState, useRef, useEffect } from "react";

type Props = {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  onAddNew?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** When false, hides the "+ Add new country" option */
  showAddNew?: boolean;
};

export default function SearchableCountrySelect({
  options,
  value,
  onChange,
  onAddNew,
  placeholder = "Search or select country...",
  disabled = false,
  className = "",
  showAddNew = true,
}: Props) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const displayValue = isOpen ? query : value;

  const filtered = query.trim()
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options;

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

  function handleSelect(v: string) {
    onChange(v);
    setQuery("");
    setIsOpen(false);
  }

  function handleAddNew() {
    setIsOpen(false);
    setQuery("");
    onAddNew?.();
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
          if (!v) onChange("");
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
        autoComplete="off"
      />
      {isOpen && (
        <ul
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
          role="listbox"
        >
          {filtered.length === 0 && !query.trim() ? (
            <li className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">
              No countries yet
            </li>
          ) : filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">
              No matches for &quot;{query}&quot;
            </li>
          ) : (
            filtered.map((c) => (
              <li
                key={c}
                role="option"
                tabIndex={0}
                onClick={() => handleSelect(c)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelect(c);
                  }
                }}
                className="cursor-pointer px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {c}
              </li>
            ))
          )}
          {showAddNew && (
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
              + Add new country
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
