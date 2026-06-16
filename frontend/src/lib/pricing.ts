import type { PricingMode, WholesaleTier } from "@/types/database";

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
): { unitPrice: number; isWholesale: boolean } {
  if (mode === "wholesale") {
    return {
      unitPrice: getWholesaleUnitPrice(quantity, tiers, retailPrice),
      isWholesale: true,
    };
  }
  // Retail mode always uses the per-piece price.
  // MOQ enforcement is handled by the UI when "wholesale" is selected.
  return { unitPrice: retailPrice, isWholesale: false };
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("rw-RW", {
    style: "currency",
    currency: "RWF",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function stockLabel(total: number): string {
  if (total <= 0) return "Out of stock";
  if (total <= 10) return `Only ${total} left`;
  return "In stock";
}
