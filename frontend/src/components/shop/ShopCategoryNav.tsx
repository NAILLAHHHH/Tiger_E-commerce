"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import type { Category } from "@/types/database";

type Props = {
  categories: Category[];
  activeSlug?: string;
  searchQuery?: string;
};

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

function itemClass(active: boolean) {
  return `flex w-full items-center rounded-[5px] px-3 py-2 text-sm font-medium transition-colors ${
    active
      ? "bg-brand text-white"
      : "text-body hover:bg-gray-1 hover:text-dark"
  }`;
}

export default function ShopCategoryNav({
  categories,
  activeSlug,
  searchQuery,
}: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const groups = groupByKind(categories);
  const showHeadings =
    groups.length > 1 ||
    Boolean(groups[0]?.name && groups[0].name !== "Other");
  const activeCategory = categories.find((cat) => cat.slug === activeSlug);
  const currentLabel = activeCategory?.name ?? "All products";

  useEffect(() => {
    setOpen(false);
  }, [activeSlug, searchQuery]);

  const nav = (
    <nav aria-label="Shop categories" className="flex flex-col gap-5">
      <div>
        <p className="mb-2 hidden px-3 text-[11px] font-semibold uppercase tracking-wider text-muted md:block">
          Browse
        </p>
        <Link
          href={shopHref(undefined, searchQuery)}
          className={itemClass(!activeSlug)}
          aria-current={!activeSlug ? "page" : undefined}
        >
          All products
        </Link>
      </div>
      {groups.map((group) => (
        <div key={group.key}>
          {showHeadings && (
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
              {group.name}
            </p>
          )}
          <ul className="flex flex-col gap-0.5">
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
      ))}
    </nav>
  );

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
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted">
              Category
            </span>
            <span className="mt-0.5 block text-sm font-medium text-dark">
              {currentLabel}
            </span>
          </span>
          <Chevron open={open} />
        </button>
        {open && (
          <div
            id={panelId}
            className="mt-2 rounded-xl border border-gray-3 bg-surface p-3"
          >
            {nav}
          </div>
        )}
      </div>

      <div className="hidden rounded-2xl border border-gray-3 bg-surface p-4 md:block md:max-h-[calc(100vh-10.5rem)] md:overflow-y-auto">
        {nav}
      </div>
    </aside>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-5 w-5 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
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
