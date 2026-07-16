import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/shop/ProductCard";
import ShopCategoryNav from "@/components/shop/ShopCategoryNav";
import { getCategories, getProducts } from "@/lib/products";
import { getRatingSummaries } from "@/lib/reviews";

type Props = {
  searchParams: Promise<{ category?: string; q?: string }>;
};

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Browse clothing by size and color. Buy one piece or many at a lower price.",
};

export default async function ShopPage({ searchParams }: Props) {
  const params = await searchParams;
  const categorySlug = params.category?.trim() || undefined;
  const query = params.q?.trim() || undefined;

  const [products, categories, ratings] = await Promise.all([
    getProducts({ categorySlug, query }),
    getCategories(),
    getRatingSummaries(),
  ]);

  const activeCategory = categories.find((cat) => cat.slug === categorySlug);
  const pageTitle = query
    ? `Results for “${query}”`
    : activeCategory
      ? activeCategory.name
      : "Shop all";
  const pageDescription = query
    ? `Products matching “${query}”.`
    : activeCategory
      ? `Clothing in ${activeCategory.name} — pick your size, color, and quantity.`
      : "Every product comes in sizes and colors. Buy one piece or order many at a lower price.";

  return (
    <div className="container-custom py-10">
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">
            TygaStyle shop
          </p>
          <h1 className="section-title mt-1">{pageTitle}</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            {pageDescription}
          </p>
          <p className="mt-3 text-sm text-body">
            {products.length}{" "}
            {products.length === 1 ? "product" : "products"}
            {activeCategory && !query ? ` in ${activeCategory.name}` : ""}
          </p>
          {query && (
            <Link
              href={categorySlug ? `/shop?category=${categorySlug}` : "/shop"}
              className="mt-2 inline-flex text-sm font-medium text-brand hover:text-brand-dark"
            >
              Clear search
            </Link>
          )}
        </div>

        <div className="rounded-xl border border-gray-3 bg-gray-1 px-5 py-4 lg:max-w-sm">
          <p className="text-sm font-medium text-dark">Buying for a shop or event?</p>
          <p className="mt-1 text-xs text-muted">
            Many items have a lower price when you order more pieces.
          </p>
          <Link
            href="/wholesale"
            className="mt-3 inline-flex text-sm font-medium text-brand hover:text-brand-dark"
          >
            See bulk prices →
          </Link>
        </div>
      </div>

      <div className="mb-8">
        <ShopCategoryNav
          categories={categories}
          activeSlug={categorySlug}
          searchQuery={query}
        />
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-3 bg-gray-1 px-6 py-16 text-center">
          <p className="text-lg font-medium text-dark">
            {query ? "No matches" : "Nothing here yet"}
          </p>
          <p className="mt-2 text-sm text-muted">
            {query
              ? `Nothing matched “${query}”. Try another word or browse categories.`
              : activeCategory
                ? `No products in ${activeCategory.name} right now.`
                : "Check back soon — new items are added regularly."}
          </p>
          {(activeCategory || query) && (
            <Link href="/shop" className="btn-primary mt-6 inline-flex">
              View all products
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              rating={ratings[product.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
