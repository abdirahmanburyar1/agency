"use client";

import { useState, useRef, useEffect } from "react";

type Employee = { id: string; name: string; role?: string | null; phone?: string | null };

function formatLabel(e: Employee): string {
  return e.phone?.trim() ? `${e.name} - ${e.phone}` : e.name;
}

type Props = {
  employees: Employee[];
  value: string;
  onChange: (employeeId: string) => void;
  onAddNew: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export default function SearchableEmployeeSelect({
  employees,
  value,
  onChange,
  onAddNew,
  placeholder = "Search or select employee...",
  disabled = false,
  className = "",
}: Props) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLabel = value
    ? (() => {
        const e = employees.find((x) => x.id === value);
        return e ? formatLabel(e) : "";
      })()
    : "";
  const displayValue = isOpen ? query : selectedLabel;

  const filtered = query.trim()
    ? employees.filter((e) =>
        formatLabel(e).toLowerCase().includes(query.toLowerCase())
      )
    : employees;

  useEffect(() => {
    function handleClickOutside(ev: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(ev.target as Node)
      ) {
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
              No employees yet
            </li>
          ) : filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">
              No matches for &quot;{query}&quot;
            </li>
          ) : (
            filtered.map((e) => (
              <li
                key={e.id}
                role="option"
                tabIndex={0}
                onClick={() => handleSelect(e.id)}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    handleSelect(e.id);
                  }
                }}
                className="cursor-pointer px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {formatLabel(e)}
              </li>
            ))
          )}
          <li
            role="option"
            tabIndex={0}
            onClick={handleAddNew}
            onKeyDown={(ev) => {
              if (ev.key === "Enter" || ev.key === " ") {
                ev.preventDefault();
                handleAddNew();
              }
            }}
            className="cursor-pointer border-t border-zinc-100 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            + Add new employee
          </li>
        </ul>
      )}
    </div>
  );
}
