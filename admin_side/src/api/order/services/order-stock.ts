import type { Core } from '@strapi/strapi';
import {
  findSizeColorRow,
  updateSizeColorStock,
} from '../../../utils/size-color';

export const ORDER_STATUSES = ['placed', 'paid', 'pending', 'completed', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Statuses that reduce how_many_left on size/color rows. */
export function statusReservesStock(status: string): boolean {
  return (
    status === 'placed' ||
    status === 'paid' ||
    status === 'pending' ||
    status === 'completed'
  );
}

type OrderLine = {
  item_code?: string | null;
  size?: string | null;
  color?: string | null;
  how_many?: number | null;
};

type OrderRecord = {
  id: number;
  order_status?: string | null;
  stock_deducted?: boolean | null;
  what_they_ordered?: OrderLine[] | null;
};

async function applyStockDelta(
  strapi: Core.Strapi,
  lines: OrderLine[],
  direction: 'deduct' | 'restore',
) {
  for (const line of lines) {
    const qty = Number(line.how_many ?? 0);
    if (qty <= 0) continue;

    const variant = await findSizeColorRow(strapi, line);
    if (!variant) {
      strapi.log.warn(
        `Order stock: no variant for ${line.item_code ?? `${line.size}/${line.color}`}`,
      );
      continue;
    }

    const current = Number(variant.how_many_left ?? 0);
    const next =
      direction === 'deduct'
        ? Math.max(0, current - qty)
        : current + qty;

    await updateSizeColorStock(strapi, variant, next);

    strapi.log.info(
      `Stock ${direction}: ${variant.item_code ?? variant.id} ${current} -> ${next}`,
    );
  }
}

/** Deduct or restore stock when order status changes. */
export async function syncOrderStock(
  strapi: Core.Strapi,
  previous: OrderRecord | null,
  next: OrderRecord,
): Promise<{ stock_deducted: boolean } | null> {
  const lines = next.what_they_ordered ?? [];
  if (!lines.length || !next.id) return null;

  const fresh = await strapi.db.query('api::order.order').findOne({
    where: { id: next.id },
    populate: { what_they_ordered: true },
  });

  if (!fresh) return null;

  const wasDeducted = Boolean(fresh.stock_deducted);
  const nextStatus = String(
    next.order_status ?? fresh.order_status ?? '',
  );
  const shouldDeduct = statusReservesStock(nextStatus);
  const previousStatus = previous
    ? String(previous.order_status ?? '')
    : '';

  if (shouldDeduct && !wasDeducted) {
    await applyStockDelta(
      strapi,
      (fresh.what_they_ordered as OrderLine[]) ?? lines,
      'deduct',
    );
    strapi.log.info(`Order ${next.id}: stock deducted (${nextStatus})`);
    return { stock_deducted: true };
  }

  if (
    nextStatus === 'cancelled' &&
    (wasDeducted || statusReservesStock(previousStatus))
  ) {
    await applyStockDelta(
      strapi,
      (fresh.what_they_ordered as OrderLine[]) ?? lines,
      'restore',
    );
    strapi.log.info(`Order ${next.id}: stock restored (cancelled)`);
    return { stock_deducted: false };
  }

  return null;
}
