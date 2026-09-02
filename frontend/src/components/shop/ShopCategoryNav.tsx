"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import type { Category } from "@/types/database";

type Props = {
  categories: Category[];
  activeSlug?: string;
  searchQuery?: string;
};

const COLLAPSED_KEY = "tygamart-shop-kind-collapsed";

function shopHref(categorySlug?: string, q?: string) {
  const params = new URLSearchParams();
  if (categorySlug) params.set("category", categorySlug);
  if (q) params.set("q", q);
  const qs = params.toString();
  return qs ? `/shop?${qs}` : "/shop";
}

function groupByKind(categories: Category[]) {
  const groups: { key: string; name: string; items: Category[] }[] = [];
  const index = new Map<string, number>();

  for (const cat of categories) {
    const key = cat.attribute_set?.id ?? "_other";
    const name = cat.attribute_set?.name ?? "Other";
    let i = index.get(key);
    if (i == null) {
      i = groups.length;
      index.set(key, i);
      groups.push({ key, name, items: [] });
    }
    groups[i].items.push(cat);
  }

  return groups;
}

function readCollapsed(): Set<string> {
  try {
    const raw = sessionStorage.getItem(COLLAPSED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
}

function itemClass(active: boolean, tone: "browse" | "category" = "category") {
  const idle =
    tone === "browse"
      ? "text-body hover:bg-gray-1 hover:text-dark"
      : "text-body hover:bg-white hover:text-dark";
  return `flex w-full items-center rounded-[5px] px-2.5 py-1.5 text-sm transition-colors ${
    active ? "bg-brand font-medium text-white" : idle
  }`;
}

export default function ShopCategoryNav({
  categories,
  activeSlug,
  searchQuery,
}: Props) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);
  const panelId = useId();
  const groups = groupByKind(categories);
  const activeCategory = categories.find((cat) => cat.slug === activeSlug);
  const activeKindKey = activeCategory
    ? (activeCategory.attribute_set?.id ?? "_other")
    : null;
  const activeKind = activeCategory?.attribute_set?.name;
  const currentLabel = activeCategory?.name ?? "All products";

  useEffect(() => {
    setOpen(false);
  }, [activeSlug, searchQuery]);

  useEffect(() => {
    const stored = readCollapsed();
    if (activeKindKey) stored.delete(activeKindKey);
    setCollapsed(stored);
    setHydrated(true);
  }, [activeKindKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(COLLAPSED_KEY, JSON.stringify([...collapsed]));
    } catch {
      /* ignore quota / private mode */
    }
  }, [collapsed, hydrated]);

  function toggleKind(key: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function renderNav(idPrefix: string) {
    return (
      <nav aria-label="Shop by kind and category" className="flex flex-col gap-4">
        <div>
          <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
            Browse
          </p>
          <Link
            href={shopHref(undefined, searchQuery)}
            className={itemClass(!activeSlug, "browse")}
            aria-current={!activeSlug ? "page" : undefined}
          >
            All products
          </Link>
        </div>

        {groups.map((group) => {
          const headingId = `${idPrefix}-${group.key}`;
          const listId = `${headingId}-categories`;
          const isOpen = !collapsed.has(group.key);
          const countLabel =
            group.items.length === 1
              ? "1 category"
              : `${group.items.length} categories`;

          return (
            <section
              key={group.key}
              aria-labelledby={headingId}
              className="rounded-xl bg-gray-1 p-2.5"
            >
              <button
                type="button"
                id={headingId}
                className="flex w-full items-start justify-between gap-2 rounded-lg px-1 py-0.5 text-left hover:bg-white/70"
                aria-expanded={isOpen}
                aria-controls={listId}
                onClick={() => toggleKind(group.key)}
              >
                <span>
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-brand">
                    Kind
                  </span>
                  <span className="mt-0.5 block text-sm font-semibold leading-snug text-dark">
                    {group.name}
                  </span>
                  {!isOpen && (
                    <span className="mt-0.5 block text-[11px] text-muted">
                      {countLabel}
                    </span>
                  )}
                </span>
                <Chevron open={isOpen} className="mt-1 h-4 w-4" />
              </button>

              {isOpen && (
                <div id={listId} className="mt-2">
                  <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
                    Categories
                  </p>
                  <ul className="ml-0.5 flex flex-col gap-0.5 border-l-2 border-gray-3 pl-2">
                    {group.items.map((cat) => {
                      const active = activeSlug === cat.slug;
                      return (
                        <li key={cat.id}>
                          <Link
                            href={shopHref(cat.slug, searchQuery)}
                            className={itemClass(active)}
                            aria-current={active ? "page" : undefined}
                          >
                            {cat.name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </section>
          );
        })}
      </nav>
    );
  }

  return (
    <aside className="md:sticky md:top-36 md:w-56 md:shrink-0 md:self-start lg:w-60 xl:w-64">
      <div className="md:hidden">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-3 bg-surface px-4 py-3 text-left"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          <span>
            {activeKind ? (
              <>
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-brand">
                  Kind · {activeKind}
                </span>
                <span className="mt-0.5 block text-sm font-medium text-dark">
                  {currentLabel}
                </span>
              </>
            ) : (
              <>
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Shop
                </span>
                <span className="mt-0.5 block text-sm font-medium text-dark">
                  {currentLabel}
                </span>
              </>
            )}
          </span>
          <Chevron open={open} />
        </button>
        {open && (
          <div
            id={panelId}
            className="mt-2 rounded-xl border border-gray-3 bg-surface p-3"
          >
            {renderNav(`${panelId}-m`)}
          </div>
        )}
      </div>

      <div className="hidden rounded-2xl border border-gray-3 bg-surface p-4 md:block md:max-h-[calc(100vh-10.5rem)] md:overflow-y-auto">
        {renderNav(`${panelId}-d`)}
      </div>
    </aside>
  );
}

function Chevron({
  open,
  className = "h-5 w-5",
}: {
  open: boolean;
  className?: string;
}) {
  return (
    <svg
      className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""} ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
    </svg>
  );
}
