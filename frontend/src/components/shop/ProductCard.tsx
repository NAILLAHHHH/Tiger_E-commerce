"use client";

import Image from "next/image";
import Link from "next/link";
import {
  bulkSavingsPercent,
  formatPrice,
  lowestBulkPrice,
  lowestPerPiecePrice,
  lowestBulkMinimum,
  productSupportsBulk,
  stockLabel,
} from "@/lib/pricing";
import { resolveProductImage } from "@/lib/images";
import type { Product } from "@/types/database";

type Props = {
  product: Product;
  /** Retail shop vs wholesale catalog — changes which price is highlighted. */
  emphasis?: "retail" | "wholesale";
};

export default function ProductCard({
  product,
  emphasis = "retail",
}: Props) {
  const image = resolveProductImage(product.image_url);
  const totalStock = product.total_stock ?? 0;
  const perPiece = lowestPerPiecePrice(product);
  const bulkPrice = lowestBulkPrice(product);
  const bulkMin = lowestBulkMinimum(product);
  const hasBulk = bulkPrice != null && productSupportsBulk(product);
  const savings = hasBulk ? bulkSavingsPercent(perPiece, bulkPrice) : null;
  const isWholesaleView = emphasis === "wholesale" && hasBulk;

  return (
    <article className="group relative overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-card)] transition-shadow hover:shadow-lg">
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-1">
        {product.is_new && (
          <span className="badge badge-new absolute left-3 top-3 z-10">
            New
          </span>
        )}
        {hasBulk && !isWholesaleView && (
          <span className="badge badge-wholesale absolute right-3 top-3 z-10">
            Bulk price
          </span>
        )}
        {isWholesaleView && savings != null && savings > 0 && (
          <span className="badge badge-sale absolute right-3 top-3 z-10">
            Save {savings}%
          </span>
        )}

        <Link href={`/shop/${product.slug}`} className="relative block h-full w-full">
          <Image
            src={image}
            alt={product.name}
            fill
            className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
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

        {isWholesaleView ? (
          <div className="mt-2">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-lg font-semibold text-brand">
                {formatPrice(bulkPrice!)}
              </span>
              <span className="text-xs text-muted">per piece · {bulkMin}+ pcs</span>
            </div>
            <p className="mt-1 text-xs text-muted">
              Single piece {formatPrice(perPiece)}
              {savings != null && savings > 0 && ` · ${savings}% less than 1 pc`}
            </p>
          </div>
        ) : (
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-lg font-semibold text-brand">
              {formatPrice(perPiece)}
            </span>
            <span className="text-xs text-muted">per piece</span>
            {hasBulk && (
              <>
                <span className="text-xs text-muted">·</span>
                <span className="text-sm font-medium text-dark">
                  {formatPrice(bulkPrice!)} when buying {bulkMin}+
                </span>
              </>
            )}
          </div>
        )}

        <p className="mt-1 text-xs text-muted">{stockLabel(totalStock)}</p>
      </div>
    </article>
  );
}
