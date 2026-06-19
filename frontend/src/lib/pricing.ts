import type { PricingMode, WholesaleTier } from "@/types/database";

export function getEffectiveWholesaleTiers(
  tiers: WholesaleTier[],
  bulkPrice: number | null | undefined,
  moq: number,
  productId = "",
): WholesaleTier[] {
  if (tiers.length > 0) return tiers;
  if (bulkPrice != null && bulkPrice > 0 && moq > 0) {
    return [
      {
        id: "bulk",
        product_id: productId,
        min_quantity: moq,
        unit_price: bulkPrice,
      },
    ];
  }
  return [];
}

export function getWholesaleUnitPrice(
  quantity: number,
  tiers: WholesaleTier[],
  fallbackRetail: number,
): number {
  if (!tiers.length) return fallbackRetail;

  const sorted = [...tiers].sort((a, b) => b.min_quantity - a.min_quantity);
  const match = sorted.find((tier) => quantity >= tier.min_quantity);
  return match?.unit_price ?? tiers[0].unit_price;
}

export function resolveUnitPrice(
  mode: PricingMode,
  quantity: number,
  retailPrice: number,
  tiers: WholesaleTier[],
  moq: number,
  bulkPrice?: number | null,
  productId = "",
): { unitPrice: number; isWholesale: boolean } {
  const effectiveTiers = getEffectiveWholesaleTiers(
    tiers,
    bulkPrice,
    moq,
    productId,
  );

  if (mode === "wholesale") {
    return {
      unitPrice: getWholesaleUnitPrice(quantity, effectiveTiers, retailPrice),
      isWholesale: true,
    };
  }
  // Retail mode always uses the per-piece price.
  // MOQ enforcement is handled by the UI when "wholesale" is selected.
  return { unitPrice: retailPrice, isWholesale: false };
}

/** Stable RWF formatting — avoids server/client Intl locale mismatch (RF vs RWF). */
export function formatPrice(amount: number): string {
  const rounded = Math.round(amount);
  return `RWF ${rounded.toLocaleString("en-US")}`;
}

export function stockLabel(total: number): string {
  if (total <= 0) return "Out of stock";
  if (total <= 10) return `Only ${total} left`;
  return "In stock";
}
