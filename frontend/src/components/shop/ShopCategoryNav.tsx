import Link from "next/link";
import type { Category } from "@/types/database";

type Props = {
  categories: Category[];
  activeSlug?: string;
};

export default function ShopCategoryNav({ categories, activeSlug }: Props) {
  return (
    <nav
      aria-label="Shop categories"
      className="flex flex-wrap gap-2"
    >
      <Link
        href="/shop"
        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
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
          href={`/shop?category=${cat.slug}`}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
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
