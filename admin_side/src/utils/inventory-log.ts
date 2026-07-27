import type { Core } from '@strapi/strapi';

export const MOVEMENT_TYPES = [
  'sale',
  'cancel_restore',
  'restock',
  'adjustment',
  'import',
  'initial',
  'count',
] as const;

export type MovementType = (typeof MOVEMENT_TYPES)[number];
export type LogSource = 'system' | 'admin' | 'import' | 'api';
export type PriceField = 'price_for_one' | 'price_for_bulk';

let bulkImportActive = false;
let loggingSuppressed = false;
let systemAuditWriteActive = false;

/** True while auto-logging writes audit rows (bypasses read-only lifecycles). */
export function isSystemAuditWrite() {
  return systemAuditWriteActive;
}

async function withSystemAuditWrite<T>(fn: () => Promise<T>): Promise<T> {
  systemAuditWriteActive = true;
  try {
    return await fn();
  } finally {
    systemAuditWriteActive = false;
  }
}

export function setBulkImportActive(active: boolean) {
  bulkImportActive = active;
}

export function isBulkImportActive() {
  return bulkImportActive;
}

export function isInventoryLoggingSuppressed() {
  return loggingSuppressed;
}

export async function withInventoryLoggingSuppressed<T>(
  fn: () => Promise<T>,
): Promise<T> {
  loggingSuppressed = true;
  try {
    return await fn();
  } finally {
    loggingSuppressed = false;
  }
}

type VariantInfo = {
  id?: number;
  item_code?: string | null;
  size?: string | null;
  color?: string | null;
  product?: { name?: string } | null | unknown;
};

function productLabel(product: VariantInfo['product']): string {
  if (!product || typeof product !== 'object') return '';
  return typeof (product as { name?: string }).name === 'string'
    ? (product as { name: string }).name
    : '';
}

function roundPrice(value: number | null | undefined): number | null {
  if (value == null) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100) / 100;
}

function pricesEqual(
  a: number | null | undefined,
  b: number | null | undefined,
): boolean {
  return roundPrice(a) === roundPrice(b);
}

export async function logInventoryMovement(
  strapi: Core.Strapi,
  opts: {
    variant: VariantInfo;
    movementType: MovementType;
    quantityBefore: number;
    quantityAfter: number;
    orderReference?: string | null;
    reason?: string | null;
    source?: LogSource;
  },
) {
  const before = Math.max(0, Math.round(opts.quantityBefore));
  const after = Math.max(0, Math.round(opts.quantityAfter));
  const delta = after - before;

  if (delta === 0 && opts.movementType !== 'count') return;
  if (loggingSuppressed) return;

  await withSystemAuditWrite(() =>
    strapi.db.query('api::inventory-movement.inventory-movement').create({
      data: {
        movement_type: opts.movementType,
        quantity_delta: delta,
        quantity_before: before,
        quantity_after: after,
        item_code: opts.variant.item_code ?? '',
        size: opts.variant.size ?? '',
        color: opts.variant.color ?? '',
        product_name: productLabel(opts.variant.product),
        order_reference: opts.orderReference ?? null,
        reason: opts.reason ?? null,
        source: opts.source ?? 'system',
        product_variant: opts.variant.id ?? null,
      },
    }),
  );
}

export async function logPriceChange(
  strapi: Core.Strapi,
  opts: {
    variant: VariantInfo;
    priceField: PriceField;
    priceBefore: number | null;
    priceAfter: number | null;
    reason?: string | null;
    source?: LogSource;
  },
) {
  const before = roundPrice(opts.priceBefore);
  const after = roundPrice(opts.priceAfter);
  if (pricesEqual(before, after)) return;
  if (loggingSuppressed) return;

  await withSystemAuditWrite(() =>
    strapi.db.query('api::price-history.price-history').create({
      data: {
        price_field: opts.priceField,
        price_before: before,
        price_after: after,
        item_code: opts.variant.item_code ?? '',
        size: opts.variant.size ?? '',
        color: opts.variant.color ?? '',
        product_name: productLabel(opts.variant.product),
        reason: opts.reason ?? null,
        source: opts.source ?? 'admin',
        product_variant: opts.variant.id ?? null,
      },
    }),
  );
}

export async function logVariantPriceChanges(
  strapi: Core.Strapi,
  previous: Record<string, unknown>,
  next: Record<string, unknown>,
  opts: { source?: LogSource; reason?: string | null } = {},
) {
  const variant = next as VariantInfo;
  const fields: PriceField[] = ['price_for_one', 'price_for_bulk'];
  const source = opts.source ?? 'admin';
  const reason =
    opts.reason ??
    (isBulkImportActive() ? 'Updated via CSV import' : null);

  for (const field of fields) {
    const before = previous[field] as number | null | undefined;
    const after = next[field] as number | null | undefined;
    if (pricesEqual(before, after)) continue;

    await logPriceChange(strapi, {
      variant,
      priceField: field,
      priceBefore: before == null ? null : Number(before),
      priceAfter: after == null ? null : Number(after),
      reason,
      source: isBulkImportActive() ? 'import' : source,
    });
  }
}
