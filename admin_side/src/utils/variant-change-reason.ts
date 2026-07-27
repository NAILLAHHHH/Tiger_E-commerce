export const CHANGE_REASON_FIELD = 'change_reason';

export function normalizeChangeReason(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function roundPrice(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100) / 100;
}

function effectiveValue(incoming: unknown, previous: unknown): unknown {
  return incoming !== undefined ? incoming : previous;
}

export function variantStockChanging(
  previous: Record<string, unknown>,
  data: Record<string, unknown>,
): boolean {
  const before = Math.max(0, Number(previous.how_many_left ?? 0));
  const after = Math.max(
    0,
    Number(effectiveValue(data.how_many_left, previous.how_many_left) ?? 0),
  );
  return before !== after;
}

export function variantPriceChanging(
  previous: Record<string, unknown>,
  data: Record<string, unknown>,
): boolean {
  for (const field of ['price_for_one', 'price_for_bulk'] as const) {
    const before = roundPrice(previous[field]);
    const after = roundPrice(effectiveValue(data[field], previous[field]));
    if (before !== after) return true;
  }
  return false;
}

export function variantStockOrPriceChanging(
  previous: Record<string, unknown>,
  data: Record<string, unknown>,
): boolean {
  return (
    variantStockChanging(previous, data) ||
    variantPriceChanging(previous, data)
  );
}
