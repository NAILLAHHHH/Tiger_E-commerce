"use client";

import { useEffect, useMemo, useState } from "react";
import {
  formatPrice,
  lineTotal,
  productSupportsBulk,
  productSupportsRetail,
  resolveUnitPrice,
  stockLabel,
  variantSupportsBulk,
} from "@/lib/pricing";
import { resolveProductImage } from "@/lib/images";
import {
  buildColorGallery,
  getProductColors,
} from "@/lib/product-media";
import { variantDisplayImage } from "@/lib/strapi/mappers";
import ColorSwatches from "@/components/shop/ColorSwatches";
import ProductGallery from "@/components/shop/ProductGallery";
import { useCartStore } from "@/store/cart-store";
import type { PricingMode, Product, ProductVariant } from "@/types/database";

type Props = {
  product: Product;
};

export default function ProductDetailClient({ product }: Props) {
  const variants = product.variants ?? [];

  const colors = useMemo(
    () => getProductColors(variants, product.image_url),
    [variants, product.image_url],
  );
  const sizes = useMemo(
    () => [...new Set(variants.map((v) => v.size))],
    [variants],
  );

  const canRetail = productSupportsRetail(product);
  const canWholesale = productSupportsBulk(product);

  const [mode, setMode] = useState<PricingMode>(
    canRetail ? "retail" : "wholesale",
  );
  const [color, setColor] = useState(colors[0]?.color ?? "");
  const [size, setSize] = useState(sizes[0] ?? "");

  const gallery = useMemo(
    () => buildColorGallery(product, color),
    [product, color],
  );

  const selectedVariant: ProductVariant | undefined = variants.find(
    (v) => v.color === color && v.size === size,
  );

  const bulkMinimum = selectedVariant?.bulk_minimum ?? 10;

  const [quantity, setQuantity] = useState(
    mode === "wholesale" ? bulkMinimum : 1,
  );

  const displayImage = resolveProductImage(
    variantDisplayImage(selectedVariant, product),
  );

  const { unitPrice, isWholesale } = selectedVariant
    ? resolveUnitPrice(mode, selectedVariant)
    : { unitPrice: 0, isWholesale: false };

  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    const available = sizes.find((s) => {
      const v = variants.find((v) => v.size === s && v.color === color);
      return v && v.stock_quantity > 0;
    });
    if (available) setSize(available);
  }, [color, sizes, variants]);

  const handleAddToCart = () => {
    if (!selectedVariant || selectedVariant.stock_quantity < quantity) return;

    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      slug: product.slug,
      image: displayImage,
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
      <ProductGallery
        items={gallery}
        alt={product.name}
        resetKey={color}
      />

      <div>
        {product.category && (
          <p className="text-sm uppercase tracking-wide text-muted">
            {product.category.name}
          </p>
        )}
        <h1 className="mt-1 text-3xl font-bold text-dark">{product.name}</h1>
        <p className="mt-2 text-sm text-muted">
          {stockLabel(product.total_stock ?? 0)}
          {selectedVariant && ` · Code: ${selectedVariant.sku}`}
        </p>

        {product.description && (
          <p className="mt-4 text-sm leading-relaxed text-body">
            {product.description}
          </p>
        )}

        {canRetail && canWholesale && selectedVariant && (
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
                setQuantity(selectedVariant.bulk_minimum);
              }}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                mode === "wholesale"
                  ? "bg-surface text-dark shadow-sm"
                  : "text-muted hover:text-dark"
              }`}
            >
              Buy many ({selectedVariant.bulk_minimum}+)
            </button>
          </div>
        )}

        {selectedVariant && (
          <div className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <div>
              <span className="text-xs text-muted">Per piece</span>
              <p className="text-xl font-bold text-dark">
                {formatPrice(selectedVariant.per_piece_price)}
              </p>
            </div>
            {variantSupportsBulk(selectedVariant) && (
              <div>
                <span className="text-xs text-muted">
                  Buy many ({selectedVariant.bulk_minimum}+)
                </span>
                <p className="text-xl font-bold text-brand">
                  {formatPrice(selectedVariant.bulk_price!)}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 flex items-baseline gap-3">
          <span className="text-3xl font-bold text-brand">
            {formatPrice(unitPrice)}
          </span>
          <span className="text-sm text-muted">
            {isWholesale ? "price when buying many" : "per piece"}
          </span>
        </div>

        <ColorSwatches
          colors={colors}
          selected={color}
          onSelect={setColor}
          className="mt-6"
        />

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
                  Math.max(mode === "wholesale" ? bulkMinimum : 1, q - 1),
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-3 text-lg"
            >
              −
            </button>
            <span className="w-12 text-center font-medium">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
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
            (mode === "wholesale" && quantity < bulkMinimum)
          }
          className="btn-primary mt-8 w-full py-3 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add to cart — {formatPrice(lineTotal(unitPrice, quantity))}
        </button>

        {mode === "wholesale" && quantity < bulkMinimum && (
          <p className="mt-2 text-xs text-red-600">
            Minimum order for lower price: {bulkMinimum} pieces
          </p>
        )}
      </div>
    </div>
  );
}
