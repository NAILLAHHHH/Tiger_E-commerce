import type { ProductVariant } from "@/types/database";
import { getSwatchAxisCode } from "@/lib/product-media";
import { optionValue } from "@/lib/variant-options";

/**
 * RWF is shown and charged in whole francs.
 * Round once here so UI (e.g. 65) and Strapi (was storing 64.99) always match.
 */
export function roundMoney(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount);
}

export function lineTotal(unitPrice: number, quantity: number): number {
  return roundMoney(roundMoney(unitPrice) * quantity);
}

function variantsForColor(
  variants: ProductVariant[],
  color: string,
): ProductVariant[] {
  const axisCode = getSwatchAxisCode(variants) ?? "color";
  return variants.filter(
    (v) => optionValue(v, axisCode) === color || v.color === color,
  );
}

export function colorStockTotal(
  variants: ProductVariant[],
  color: string,
): number {
  if (!color) {
    return variants.reduce((sum, v) => sum + v.stock_quantity, 0);
  }
  return variantsForColor(variants, color).reduce(
    (sum, v) => sum + v.stock_quantity,
    0,
  );
}

export function lowestPerPiecePriceForColor(
  variants: ProductVariant[],
  color: string,
): number {
  const pool = color ? variantsForColor(variants, color) : variants;
  const prices = pool.map((v) => roundMoney(v.per_piece_price));
  return prices.length ? Math.min(...prices) : 0;
}

/** Stable RWF formatting — whole francs only, same as cart / Strapi totals. */
export function formatPrice(amount: number): string {
  return `RWF ${roundMoney(amount).toLocaleString("en-US")}`;
}

export function stockLabel(total: number): string {
  if (total <= 0) return "Out of stock";
  if (total <= 10) return `Only ${total} left`;
  return "In stock";
}
