import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/shop/ProductCard";
import ShopCategoryNav from "@/components/shop/ShopCategoryNav";
import { getCategories, getProducts } from "@/lib/products";
import { getRatingSummaries } from "@/lib/reviews";

type Props = {
  searchParams: Promise<{ category?: string; q?: string; new?: string }>;
};

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Browse products by category. Pick your options and quantity.",
};

export default async function ShopPage({ searchParams }: Props) {
  const params = await searchParams;
  const categorySlug = params.category?.trim() || undefined;
  const query = params.q?.trim() || undefined;
  const newOnly = params.new === "1" || params.new === "true";

  const [products, categories, ratings] = await Promise.all([
    getProducts({ categorySlug, query, newOnly }),
    getCategories(),
    getRatingSummaries(),
  ]);

  const activeCategory = categories.find((cat) => cat.slug === categorySlug);
  const pageTitle = query
    ? `Results for “${query}”`
    : activeCategory
      ? activeCategory.name
      : newOnly
        ? "New arrivals"
        : "Shop all";
  const pageDescription = query
    ? `Products matching “${query}”.`
    : activeCategory
      ? `Products in ${activeCategory.name}${activeCategory.attribute_set?.name ? ` · ${activeCategory.attribute_set.name}` : ""} — pick your options and quantity.`
      : newOnly
        ? "The latest pieces marked as new."
        : "Every product can have its own options (size, color, pack, storage…). Pick your options and quantity.";

  return (
    <div className="container-custom py-10">
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand">
            TygaMart shop
          </p>
          {activeCategory?.attribute_set?.name && !query && (
            <p className="mt-2 text-xs font-medium text-body">
              <span className="font-semibold uppercase tracking-wider text-muted">
                Kind
              </span>
              <span className="mx-1.5 text-gray-3">·</span>
              {activeCategory.attribute_set.name}
              <span className="mx-1.5 text-gray-3">·</span>
              <span className="font-semibold uppercase tracking-wider text-muted">
                Category
              </span>
              <span className="mx-1.5 text-gray-3">·</span>
              {activeCategory.name}
            </p>
          )}
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
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8 lg:gap-10">
        <ShopCategoryNav
          categories={categories}
          activeSlug={categorySlug}
          searchQuery={query}
        />

        <div className="min-w-0 flex-1">
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
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
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
      </div>
    </div>
  );
}
