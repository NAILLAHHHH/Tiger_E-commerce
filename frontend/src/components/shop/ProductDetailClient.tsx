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
import { buildProductGallery } from "@/lib/product-media";
import { variantDisplayImage } from "@/lib/strapi/mappers";
import {
  adjustSelectionForStock,
  findVariantForSelection,
  getProductOptionAxes,
  initialSelection,
  optionsSnapshot,
} from "@/lib/variant-options";
import ColorSwatches from "@/components/shop/ColorSwatches";
import ProductGallery from "@/components/shop/ProductGallery";
import StarRating from "@/components/shop/StarRating";
import { useCartStore } from "@/store/cart-store";
import type {
  ColorOption,
  GalleryItem,
  PricingMode,
  Product,
  ProductVariant,
  RatingSummary,
} from "@/types/database";

type Props = {
  product: Product;
  ratingSummary?: RatingSummary;
};

export default function ProductDetailClient({
  product,
  ratingSummary,
}: Props) {
  const variants = product.variants ?? [];
  const axes = useMemo(() => getProductOptionAxes(variants), [variants]);

  const canRetail = productSupportsRetail(product);
  const canWholesale = productSupportsBulk(product);

  const [mode, setMode] = useState<PricingMode>(
    canRetail ? "retail" : "wholesale",
  );
  const [selection, setSelection] = useState<Record<string, string>>(() =>
    initialSelection(variants, axes),
  );
  const [gallerySeek, setGallerySeek] = useState({ index: 0, token: 0 });

  useEffect(() => {
    setSelection(initialSelection(variants, axes));
  }, [product.id, axes, variants]);

  const gallery = useMemo(() => buildProductGallery(product), [product]);

  const swatchAxis = axes.find(
    (a) => a.display_type === "swatch" || a.code === "color",
  );
  const selectAxes = axes.filter((a) => a.code !== swatchAxis?.code);

  const colors: ColorOption[] = useMemo(() => {
    if (!swatchAxis) return [];
    return swatchAxis.values.map((v) => ({
      color: v.value,
      color_hex: v.meta?.hex ?? null,
      image_url: v.image_url ?? product.image_url ?? null,
    }));
  }, [swatchAxis, product.image_url]);

  const handleGalleryActiveChange = (item: GalleryItem) => {
    const code = item.option_code ?? (item.color ? swatchAxis?.code : undefined);
    const value = item.option_value ?? item.color;
    if (!code || !value) return;
    setSelection((prev) =>
      adjustSelectionForStock(variants, axes, { ...prev, [code]: value }, code),
    );
  };

  const handleSwatchSelect = (next: string) => {
    if (!swatchAxis) return;
    setSelection((prev) =>
      adjustSelectionForStock(
        variants,
        axes,
        { ...prev, [swatchAxis.code]: next },
        swatchAxis.code,
      ),
    );
    const index = gallery.findIndex(
      (item) => (item.option_value ?? item.color) === next,
    );
    if (index >= 0) {
      setGallerySeek((prev) => ({ index, token: prev.token + 1 }));
    }
  };

  const selectedVariant: ProductVariant | undefined = findVariantForSelection(
    variants,
    selection,
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

  const handleAddToCart = () => {
    if (!selectedVariant || selectedVariant.stock_quantity < quantity) return;

    const snapshot = optionsSnapshot(selectedVariant);
    addItem({
      productId: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      slug: product.slug,
      image: displayImage,
      options: snapshot,
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
        autoplay={false}
        seekIndex={gallerySeek.index}
        seekToken={gallerySeek.token}
        onActiveChange={handleGalleryActiveChange}
      />

      <div>
        {product.category && (
          <p className="text-sm uppercase tracking-wide text-muted">
            {product.category.name}
          </p>
        )}
        <h1 className="mt-1 text-3xl font-bold text-dark">{product.name}</h1>
        {ratingSummary && ratingSummary.count > 0 && (
          <a
            href="#reviews"
            className="mt-2 inline-flex items-center gap-2 text-sm text-body hover:text-brand"
          >
            <StarRating rating={ratingSummary.average} size="sm" />
            <span className="font-medium text-dark">
              {ratingSummary.average.toFixed(1)}
            </span>
            <span className="text-muted">
              ({ratingSummary.count}{" "}
              {ratingSummary.count === 1 ? "review" : "reviews"})
            </span>
          </a>
        )}
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

        {swatchAxis && colors.length > 0 && (
          <ColorSwatches
            colors={colors}
            selected={selection[swatchAxis.code] ?? ""}
            onSelect={handleSwatchSelect}
            className="mt-6"
          />
        )}

        {selectAxes.map((axis) => (
          <div key={axis.code} className="mt-4">
            <p className="mb-2 text-sm font-medium text-dark">{axis.name}</p>
            <div className="flex flex-wrap gap-2">
              {axis.values.map((value) => {
                const candidate = {
                  ...selection,
                  [axis.code]: value.value,
                };
                const variant = findVariantForSelection(variants, candidate);
                const disabled = !variant || variant.stock_quantity === 0;
                const isSelected = selection[axis.code] === value.value;
                return (
                  <button
                    key={value.value}
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                      setSelection(
                        adjustSelectionForStock(
                          variants,
                          axes,
                          candidate,
                          axis.code,
                        ),
                      )
                    }
                    className={`min-w-[3rem] rounded-md border px-3 py-2 text-sm font-medium ${
                      isSelected
                        ? "border-brand bg-brand text-white"
                        : disabled
                          ? "cursor-not-allowed border-gray-2 text-gray-300"
                          : "border-gray-3 text-dark hover:border-brand"
                    }`}
                  >
                    {value.value}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

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
