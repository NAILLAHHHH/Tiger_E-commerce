"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { COUNTRY_DIALS, type CountryDial } from "@/lib/phone";

type PhoneInputProps = {
  id?: string;
  nationalNumber: string;
  country: CountryDial;
  onNationalNumberChange: (value: string) => void;
  onCountryChange: (country: CountryDial) => void;
  required?: boolean;
  invalid?: boolean;
};

export default function PhoneInput({
  id,
  nationalNumber,
  country,
  onNationalNumberChange,
  onCountryChange,
  required,
  invalid,
}: PhoneInputProps) {
  const listId = useId();
  const searchId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRY_DIALS;
    return COUNTRY_DIALS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dial.includes(q) ||
        c.code.toLowerCase().includes(q) ||
        `+${c.dial}`.includes(q),
    );
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      // Focus search after open
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  return (
    <div
      className={`relative mt-1 flex rounded-lg border bg-surface focus-within:border-brand ${
        invalid ? "border-red-500" : "border-gray-3"
      }`}
    >
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className="flex shrink-0 items-center gap-1.5 rounded-l-lg border-r border-gray-3 bg-gray-1 px-2.5 py-2 text-sm text-dark hover:bg-gray-2"
      >
        <span aria-hidden className="text-base leading-none">
          {country.flag}
        </span>
        <span className="font-medium tabular-nums">+{country.dial}</span>
        <svg
          className={`h-3.5 w-3.5 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <input
        id={id}
        type="tel"
        inputMode="numeric"
        required={required}
        autoComplete="tel-national"
        aria-invalid={invalid || undefined}
        value={nationalNumber}
        onChange={(e) =>
          onNationalNumberChange(e.target.value.replace(/[^\d\s]/g, ""))
        }
        onFocus={() => setOpen(false)}
        placeholder="Phone number"
        className="min-w-0 flex-1 rounded-r-lg bg-transparent px-3 py-2 text-sm text-dark outline-none placeholder:text-muted"
      />

      {open && (
        <>
          <button
            type="button"
            aria-label="Close country list"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full z-20 mt-1 w-72 overflow-hidden rounded-lg border border-gray-3 bg-surface shadow-[var(--shadow-card)]">
            <div className="border-b border-gray-2 p-2">
              <label htmlFor={searchId} className="sr-only">
                Search countries
              </label>
              <input
                ref={searchRef}
                id={searchId}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search country or code…"
                className="w-full rounded-md border border-gray-3 bg-gray-1 px-2.5 py-1.5 text-sm outline-none focus:border-brand"
              />
            </div>
            <ul
              id={listId}
              role="listbox"
              className="max-h-56 overflow-auto py-1"
            >
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted">No matches</li>
              ) : (
                filtered.map((c) => (
                  <li
                    key={c.code}
                    role="option"
                    aria-selected={c.code === country.code}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onCountryChange(c);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-1 ${
                        c.code === country.code ? "bg-gray-1 font-medium" : ""
                      }`}
                    >
                      <span aria-hidden>{c.flag}</span>
                      <span className="flex-1 truncate text-dark">{c.name}</span>
                      <span className="tabular-nums text-muted">+{c.dial}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
