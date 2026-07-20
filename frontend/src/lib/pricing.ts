import type { PricingMode, Product, ProductVariant } from "@/types/database";

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

export function variantSupportsBulk(variant: ProductVariant): boolean {
  return variant.bulk_price != null && variant.bulk_price > 0;
}

export function productSupportsRetail(product: Product): boolean {
  return (product.variants ?? []).some((v) => v.per_piece_price > 0);
}

export function productSupportsBulk(product: Product): boolean {
  return (product.variants ?? []).some(variantSupportsBulk);
}

export function lowestPerPiecePrice(product: Product): number {
  const prices = (product.variants ?? []).map((v) =>
    roundMoney(v.per_piece_price),
  );
  return prices.length ? Math.min(...prices) : 0;
}

export function lowestBulkPrice(product: Product): number | null {
  const prices = (product.variants ?? [])
    .map((v) => (v.bulk_price != null ? roundMoney(v.bulk_price) : null))
    .filter((p): p is number => p != null && p > 0);
  return prices.length ? Math.min(...prices) : null;
}

export function lowestBulkMinimum(product: Product): number {
  const mins = (product.variants ?? [])
    .filter(variantSupportsBulk)
    .map((v) => v.bulk_minimum);
  return mins.length ? Math.min(...mins) : 10;
}

function variantsForColor(
  variants: ProductVariant[],
  color: string,
): ProductVariant[] {
  return variants.filter((v) => v.color === color);
}

export function colorStockTotal(
  variants: ProductVariant[],
  color: string,
): number {
  return variantsForColor(variants, color).reduce(
    (sum, v) => sum + v.stock_quantity,
    0,
  );
}

export function lowestPerPiecePriceForColor(
  variants: ProductVariant[],
  color: string,
): number {
  const prices = variantsForColor(variants, color).map((v) =>
    roundMoney(v.per_piece_price),
  );
  return prices.length ? Math.min(...prices) : 0;
}

export function lowestBulkPriceForColor(
  variants: ProductVariant[],
  color: string,
): number | null {
  const prices = variantsForColor(variants, color)
    .map((v) => (v.bulk_price != null ? roundMoney(v.bulk_price) : null))
    .filter((p): p is number => p != null && p > 0);
  return prices.length ? Math.min(...prices) : null;
}

export function lowestBulkMinimumForColor(
  variants: ProductVariant[],
  color: string,
): number {
  const mins = variantsForColor(variants, color)
    .filter(variantSupportsBulk)
    .map((v) => v.bulk_minimum);
  return mins.length ? Math.min(...mins) : 10;
}

export function colorSupportsBulk(
  variants: ProductVariant[],
  color: string,
): boolean {
  return variantsForColor(variants, color).some(variantSupportsBulk);
}

export function resolveUnitPrice(
  mode: PricingMode,
  variant: ProductVariant,
): { unitPrice: number; isWholesale: boolean } {
  if (mode === "wholesale" && variantSupportsBulk(variant)) {
    return { unitPrice: roundMoney(variant.bulk_price!), isWholesale: true };
  }
  return { unitPrice: roundMoney(variant.per_piece_price), isWholesale: false };
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

export function bulkSavingsPercent(
  perPiece: number,
  bulkPrice: number,
): number | null {
  if (perPiece <= 0 || bulkPrice <= 0 || bulkPrice >= perPiece) return null;
  return Math.round(((perPiece - bulkPrice) / perPiece) * 100);
}

export type BulkDealHighlight = {
  product: Product;
  perPiece: number;
  bulkPrice: number;
  bulkMinimum: number;
  savingsPercent: number;
};

/** Best bulk discount across a product list — for wholesale page examples. */
export function bestBulkDeal(products: Product[]): BulkDealHighlight | null {
  let best: BulkDealHighlight | null = null;

  for (const product of products) {
    const perPiece = lowestPerPiecePrice(product);
    const bulkPrice = lowestBulkPrice(product);
    if (bulkPrice == null) continue;

    const savingsPercent = bulkSavingsPercent(perPiece, bulkPrice);
    if (savingsPercent == null) continue;

    const highlight: BulkDealHighlight = {
      product,
      perPiece,
      bulkPrice,
      bulkMinimum: lowestBulkMinimum(product),
      savingsPercent,
    };

    if (!best || highlight.savingsPercent > best.savingsPercent) {
      best = highlight;
    }
  }

  return best;
}
