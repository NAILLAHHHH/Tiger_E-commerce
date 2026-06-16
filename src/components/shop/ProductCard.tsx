"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/pricing";
import type { Product } from "@/types/database";

type Props = {
  product: Product;
};

export default function ProductCard({ product }: Props) {
  const image = product.image_url ?? "/placeholder-product.svg";
  const inStock = (product.total_stock ?? 0) > 0;
  const discount =
    product.compare_at_price &&
    product.compare_at_price > product.retail_price;

  return (
    <article className="group relative overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-card)] transition-shadow hover:shadow-lg">
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-1">
        {product.is_new && (
          <span className="badge badge-new absolute left-3 top-3 z-10">
            New
          </span>
        )}
        {(product.sell_mode === "wholesale" ||
          product.sell_mode === "both") && (
          <span className="badge badge-wholesale absolute right-3 top-3 z-10">
            Bulk OK
          </span>
        )}

        <Link href={`/shop/${product.slug}`}>
          <Image
            src={image}
            alt={product.name}
            fill
            className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        </Link>

        <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-dark/80 to-transparent p-4 transition-transform duration-300 group-hover:translate-y-0">
          <Link
            href={`/shop/${product.slug}`}
            className="btn-primary w-full text-center text-xs"
          >
            View product
          </Link>
        </div>
      </div>

      <div className="p-4">
        {product.category && (
          <p className="text-xs uppercase tracking-wide text-muted">
            {product.category.name}
          </p>
        )}
        <Link href={`/shop/${product.slug}`}>
          <h3 className="mt-1 line-clamp-2 font-medium text-dark hover:text-brand">
            {product.name}
          </h3>
        </Link>

        <div className="mt-2 flex items-center gap-2">
          <span className="text-lg font-semibold text-brand">
            {formatPrice(product.retail_price)}
          </span>
          {discount && (
            <span className="text-sm text-muted line-through">
              {formatPrice(product.compare_at_price!)}
            </span>
          )}
        </div>

        <p className="mt-1 text-xs text-muted">
          {inStock
            ? `${product.total_stock} in stock`
            : "Out of stock"}
          {product.wholesale_tiers?.[0] &&
            ` · Bulk from ${formatPrice(product.wholesale_tiers[0].unit_price)}`}
        </p>
      </div>
    </article>
  );
}
