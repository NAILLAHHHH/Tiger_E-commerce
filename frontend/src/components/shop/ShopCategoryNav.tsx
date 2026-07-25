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

export default function ShopCategoryNav({
  categories,
  activeSlug,
  searchQuery,
}: Props) {
  return (
    <nav
      aria-label="Shop categories"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
    >
      <Link
        href={shopHref(undefined, searchQuery)}
        className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
          !activeSlug
            ? "bg-brand text-white"
            : "bg-gray-1 text-body hover:bg-gray-2"
        }`}
      >
        All
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={shopHref(cat.slug, searchQuery)}
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            activeSlug === cat.slug
              ? "bg-brand text-white"
              : "bg-gray-1 text-body hover:bg-gray-2"
          }`}
        >
          {cat.name}
        </Link>
      ))}
    </nav>
  );
}
