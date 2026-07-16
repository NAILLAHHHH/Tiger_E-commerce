"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  className?: string;
  inputId?: string;
};

export default function HeaderSearch({
  className,
  inputId = "site-search",
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(urlQuery);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      router.push("/shop");
      return;
    }
    router.push(`/shop?q=${encodeURIComponent(q)}`);
  };

  return (
    <form onSubmit={submit} role="search" className={className}>
      <label htmlFor={inputId} className="sr-only">
        Search products
      </label>
      <div className="flex items-center gap-2 rounded-[5px] border border-gray-3 bg-gray-1 px-3 py-2">
        <svg
          className="h-4 w-4 shrink-0 text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="I am shopping for…"
          className="min-w-0 flex-1 bg-transparent text-sm text-dark placeholder:text-muted outline-none"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              if (urlQuery) router.push("/shop");
            }}
            className="text-xs text-muted hover:text-dark"
            aria-label="Clear search"
          >
            Clear
          </button>
        )}
      </div>
    </form>
  );
}
