"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  colorStockTotal,
  formatPrice,
  lowestPerPiecePriceForColor,
  stockLabel,
} from "@/lib/pricing";
import {
  getCardImages,
  getProductColors,
} from "@/lib/product-media";
import { resolveProductImage } from "@/lib/images";
import ColorSwatches from "@/components/shop/ColorSwatches";
import StarRating from "@/components/shop/StarRating";
import { useT } from "@/i18n/LocaleProvider";
import type { Product, RatingSummary } from "@/types/database";

type Props = {
  product: Product;
  rating?: RatingSummary;
};

export default function ProductCard({ product, rating }: Props) {
  const { t } = useT();
  const variants = product.variants ?? [];
  const colors = useMemo(
    () => getProductColors(variants, product.image_url),
    [variants, product.image_url],
  );
  const [activeColor, setActiveColor] = useState(() => {
    const inStock = colors.find((c) => colorStockTotal(variants, c.color) > 0);
    return inStock?.color ?? colors[0]?.color ?? "";
  });
  const [activeImage, setActiveImage] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!colors.length) {
      if (activeColor) setActiveColor("");
      return;
    }
    if (colors.some((c) => c.color === activeColor)) return;
    const inStock = colors.find(
      (c) => colorStockTotal(variants, c.color) > 0,
    );
    setActiveColor(inStock?.color ?? colors[0]?.color ?? "");
  }, [colors, activeColor, variants]);

  const images = useMemo(
    () => getCardImages(product, activeColor || undefined),
    [product, activeColor],
  );

  const totalStock = useMemo(
    () => colorStockTotal(variants, activeColor),
    [variants, activeColor],
  );
  const perPiece = useMemo(
    () => lowestPerPiecePriceForColor(variants, activeColor),
    [variants, activeColor],
  );

  useEffect(() => {
    setActiveImage(0);
  }, [activeColor, images.length]);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setActiveImage((i) => (i + 1) % images.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [activeColor, images]);

  const goTo = useCallback(
    (index: number) => {
      if (!images.length) return;
      setActiveImage(((index % images.length) + images.length) % images.length);
    },
    [images.length],
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current || images.length <= 1) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) goTo(activeImage + 1);
    else goTo(activeImage - 1);
  };

  return (
    <article className="group relative overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-card)] transition-shadow hover:shadow-lg">
      <div
        className="relative aspect-[4/5] overflow-hidden bg-gray-1"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {product.is_new && (
          <span className="badge badge-new absolute left-3 top-3 z-10">
            {t("badge.new")}
          </span>
        )}
        <Link href={`/shop/${product.slug}`} className="relative block h-full w-full">
          {images.map((url, i) => (
            <Image
              key={`${url}-${i}`}
              src={resolveProductImage(url)}
              alt={product.name}
              fill
              className={`object-cover object-center transition-opacity duration-500 ${
                i === activeImage
                  ? "opacity-100"
                  : "pointer-events-none opacity-0"
              }`}
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ))}
        </Link>

        {colors.length > 1 && (
          <div className="absolute right-2 top-1/2 z-10 -translate-y-1/2">
            <ColorSwatches
              colors={colors}
              selected={activeColor}
              onSelect={setActiveColor}
              compact
              vertical
            />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 translate-y-0 bg-gradient-to-t from-dark/80 to-transparent p-3 transition-transform duration-300 md:translate-y-full md:p-4 md:group-hover:translate-y-0">
          <Link
            href={`/shop/${product.slug}`}
            className="btn-primary w-full text-center text-xs"
          >
            {t("card.viewProduct")}
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

        {rating && rating.count > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <StarRating rating={rating.average} size="sm" />
            <span className="text-xs text-muted">
              {rating.average.toFixed(1)} ({rating.count})
            </span>
          </div>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-lg font-semibold text-brand">
            {formatPrice(perPiece)}
          </span>
          <span className="text-xs text-muted">{t("card.perPiece")}</span>
        </div>

        <p className="mt-1 text-xs text-muted">{stockLabel(totalStock, t)}</p>
      </div>
    </article>
  );
}
