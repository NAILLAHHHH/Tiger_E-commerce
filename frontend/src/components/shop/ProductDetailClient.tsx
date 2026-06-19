"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  formatPrice,
  getEffectiveWholesaleTiers,
  resolveUnitPrice,
  stockLabel,
} from "@/lib/pricing";
import { useCartStore } from "@/store/cart-store";
import type { PricingMode, Product, ProductVariant } from "@/types/database";
import WholesaleTable from "./WholesaleTable";

type Props = {
  product: Product;
};

export default function ProductDetailClient({ product }: Props) {
  const variants = product.variants ?? [];
  const tiers = product.wholesale_tiers ?? [];

  const colors = useMemo(
    () => [...new Set(variants.map((v) => v.color))],
    [variants],
  );
  const sizes = useMemo(
    () => [...new Set(variants.map((v) => v.size))],
    [variants],
  );

  const canRetail = product.sell_mode !== "wholesale";
  const canWholesale = product.sell_mode !== "retail";

  const [mode, setMode] = useState<PricingMode>(
    canRetail ? "retail" : "wholesale",
  );
  const [color, setColor] = useState(colors[0] ?? "");
  const [size, setSize] = useState(sizes[0] ?? "");
  const [quantity, setQuantity] = useState(
    mode === "wholesale" ? product.moq_wholesale : 1,
  );

  const gallery = useMemo(
    () =>
      [product.image_url, ...(product.images ?? [])].filter(
        (url): url is string => Boolean(url),
      ),
    [product.image_url, product.images],
  );
  const [activeImage, setActiveImage] = useState(0);

  const selectedVariant: ProductVariant | undefined = variants.find(
    (v) => v.color === color && v.size === size,
  );

  const { unitPrice, isWholesale } = resolveUnitPrice(
    mode,
    quantity,
    product.retail_price,
    tiers,
    product.moq_wholesale,
    product.bulk_price,
    product.id,
  );

  const displayTiers = getEffectiveWholesaleTiers(
    tiers,
    product.bulk_price,
    product.moq_wholesale,
    product.id,
  );

  const addItem = useCartStore((s) => s.addItem);

  const handleAddToCart = () => {
    if (!selectedVariant || selectedVariant.stock_quantity < quantity) return;

    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      slug: product.slug,
      image: product.image_url ?? "",
      size: selectedVariant.size,
      color: selectedVariant.color,
      sku: selectedVariant.sku,
      quantity,
      unitPrice,
      pricingMode: mode,
    });
  };

  const maxQty = selectedVariant?.stock_quantity ?? 0;

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div>
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-1">
          {gallery[activeImage] && (
            <Image
              src={gallery[activeImage]}
              alt={product.name}
              fill
              className="object-cover object-center"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          )}
        </div>
        {gallery.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {gallery.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setActiveImage(i)}
                className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${
                  i === activeImage ? "border-brand" : "border-gray-3"
                }`}
              >
                <Image
                  src={url}
                  alt=""
                  fill
                  className="object-cover object-center"
                  sizes="64px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        {product.category && (
          <p className="text-sm uppercase tracking-wide text-muted">
            {product.category.name}
          </p>
        )}
        <h1 className="mt-1 text-3xl font-bold text-dark">{product.name}</h1>
        <p className="mt-2 text-sm text-muted">
          {stockLabel(product.total_stock ?? 0)}
          {selectedVariant && ` · SKU: ${selectedVariant.sku}`}
        </p>

        {product.description && (
          <p className="mt-4 text-sm leading-relaxed text-body">
            {product.description}
          </p>
        )}

        {canRetail && canWholesale && (
          <div className="mt-6 inline-flex rounded-lg border border-gray-3 bg-gray-1 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("retail");
                setQuantity(1);
              }}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                mode === "retail"
                  ? "bg-surface text-dark shadow-sm"
                  : "text-muted hover:text-dark"
              }`}
            >
              Per piece
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("wholesale");
                setQuantity(product.moq_wholesale);
              }}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                mode === "wholesale"
                  ? "bg-surface text-dark shadow-sm"
                  : "text-muted hover:text-dark"
              }`}
            >
              Bulk ({product.moq_wholesale}+)
            </button>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <div>
            <span className="text-xs text-muted">Per piece</span>
            <p className="text-xl font-bold text-dark">
              {formatPrice(product.retail_price)}
            </p>
          </div>
          {product.bulk_price != null && canWholesale && (
            <div>
              <span className="text-xs text-muted">
                Bulk ({product.moq_wholesale}+)
              </span>
              <p className="text-xl font-bold text-brand">
                {formatPrice(product.bulk_price)}
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-baseline gap-3">
          <span className="text-3xl font-bold text-brand">
            {formatPrice(unitPrice)}
          </span>
          {mode === "retail" && product.compare_at_price && (
            <span className="text-lg text-muted line-through">
              {formatPrice(product.compare_at_price)}
            </span>
          )}
          <span className="text-sm text-muted">
            {isWholesale ? "wholesale unit price" : "per piece"}
          </span>
        </div>

        {colors.length > 1 && (
          <div className="mt-6">
            <p className="mb-2 text-sm font-medium text-dark">Color</p>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => {
                const hex =
                  variants.find((v) => v.color === c)?.color_hex ?? "#ccc";
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm ${
                      color === c
                        ? "border-brand bg-brand/5 text-brand"
                        : "border-gray-3 text-body"
                    }`}
                  >
                    <span
                      className="h-4 w-4 rounded-full border border-gray-3"
                      style={{ backgroundColor: hex }}
                    />
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {sizes.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-dark">Size</p>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => {
                const variant = variants.find(
                  (v) => v.size === s && v.color === color,
                );
                const disabled = !variant || variant.stock_quantity === 0;
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={disabled}
                    onClick={() => setSize(s)}
                    className={`min-w-[3rem] rounded-md border px-3 py-2 text-sm font-medium ${
                      size === s
                        ? "border-brand bg-brand text-white"
                        : disabled
                          ? "cursor-not-allowed border-gray-2 text-gray-300"
                          : "border-gray-3 text-dark hover:border-brand"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-dark">Quantity</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                setQuantity((q) =>
                  Math.max(mode === "wholesale" ? product.moq_wholesale : 1, q - 1),
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-3 text-lg"
            >
              −
            </button>
            <span className="w-12 text-center font-medium">{quantity}</span>
            <button
              type="button"
              onClick={() =>
                setQuantity((q) => Math.min(maxQty, q + 1))
              }
              disabled={quantity >= maxQty}
              className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-3 text-lg disabled:opacity-40"
            >
              +
            </button>
            {selectedVariant && (
              <span className="text-xs text-muted">
                {selectedVariant.stock_quantity} available
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={
            !selectedVariant ||
            selectedVariant.stock_quantity < quantity ||
            (mode === "wholesale" && quantity < product.moq_wholesale)
          }
          className="btn-primary mt-8 w-full py-3 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add to cart — {formatPrice(unitPrice * quantity)}
        </button>

        {mode === "wholesale" && quantity < product.moq_wholesale && (
          <p className="mt-2 text-xs text-red-600">
            Minimum wholesale order: {product.moq_wholesale} units
          </p>
        )}

        {displayTiers.length > 0 && (
          <div className="mt-8">
            <WholesaleTable tiers={displayTiers} currentQty={quantity} />
          </div>
        )}
      </div>
    </div>
  );
}
