export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function roundMoney(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount);
}

/** Retail / listed prices must be at least 1 (RWF). */
export function requirePositivePrice(
  amount: number,
  label = "Price",
): number {
  const value = roundMoney(amount);
  if (value < 1) {
    throw new Error(`${label} must be at least 1 (cannot be 0).`);
  }
  return value;
}

/** Bulk price is optional; when set it must be at least 1. */
export function requireOptionalPositivePrice(
  amount: number | null | undefined,
  label = "Bulk price",
): number | null {
  if (amount == null) return null;
  return requirePositivePrice(amount, label);
}

/**
 * Staff-set stock must be at least 1. Orders can still deduct to 0 (sold out).
 */
export function requirePositiveStock(
  amount: number,
  label = "Stock",
): number {
  const value = Math.trunc(amount);
  if (!Number.isFinite(value) || value < 1) {
    throw new Error(`${label} must be at least 1 (cannot be 0).`);
  }
  return value;
}

export function optionsLabel(
  values: Array<{ label: string; attribute?: { name: string; listPosition: number } | null }>,
  fallback?: { size?: string | null; color?: string | null },
): string {
  if (values.length) {
    return [...values]
      .sort(
        (a, b) =>
          (a.attribute?.listPosition ?? 0) - (b.attribute?.listPosition ?? 0),
      )
      .map((v) =>
        v.attribute?.name ? `${v.attribute.name} ${v.label}` : v.label,
      )
      .join(" · ");
  }
  const parts: string[] = [];
  if (fallback?.size) parts.push(`Size ${fallback.size}`);
  if (fallback?.color) parts.push(`Color ${fallback.color}`);
  return parts.join(" · ");
}
