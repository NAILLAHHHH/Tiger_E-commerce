import { factories } from '@strapi/strapi';
import { findSizeColorRow } from '../../../utils/size-color';

const PAID_OR_LATER = new Set(['paid', 'pending', 'completed']);

function mediaUrl(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (typeof value === 'object' && value !== null && 'url' in value) {
    const url = (value as { url?: unknown }).url;
    return typeof url === 'string' && url.trim() ? url.trim() : null;
  }
  return null;
}

function toPublicOrderSummary(order: Record<string, unknown>) {
  const items = Array.isArray(order.what_they_ordered)
    ? order.what_they_ordered.map((item: Record<string, unknown>) => ({
        product_name: String(item.product_name ?? ''),
        size: item.size != null ? String(item.size) : null,
        color: item.color != null ? String(item.color) : null,
        item_code: item.item_code != null ? String(item.item_code) : null,
        how_many: Number(item.how_many ?? 0),
        price_each: Number(item.price_each ?? 0),
        bought_as: String(item.bought_as ?? 'one_piece'),
        row_total: Number(item.row_total ?? 0),
        image_url: mediaUrl(item.image_url),
      }))
    : [];

  return {
    order_reference: order.order_reference ?? null,
    customer_name: order.customer_name ?? null,
    phone: order.phone ?? null,
    delivery_address: order.delivery_address ?? null,
    customer_notes: order.customer_notes ?? null,
    order_status: order.order_status ?? 'placed',
    subtotal: order.subtotal ?? 0,
    total: order.total ?? 0,
    what_they_ordered: items,
    createdAt: order.createdAt ?? null,
  };
}

async function resolveMissingItemImages(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  strapi: any,
  items: Array<{ item_code: string | null; image_url: string | null }>,
) {
  for (const item of items) {
    if (item.image_url || !item.item_code) continue;

    const variant = await findSizeColorRow(
      strapi,
      { item_code: item.item_code },
      { populatePhoto: true },
    );
    if (!variant) continue;

    let productPhoto: unknown = null;
    if (variant.source === 'variant' && variant.product) {
      const productRef = variant.product as { id?: number; photo?: unknown } | number;
      if (typeof productRef === 'object' && productRef.photo) {
        productPhoto = productRef.photo;
      } else {
        const productId =
          typeof productRef === 'object' ? productRef.id : productRef;
        if (productId) {
          const product = await strapi.db.query('api::product.product').findOne({
            where: { id: productId },
            populate: ['photo'],
          });
          productPhoto = product?.photo ?? null;
        }
      }
    } else if (variant.source === 'component') {
      const products = await strapi.db.query('api::product.product').findMany({
        populate: { photo: true, sizes_and_colors: true },
        limit: 500,
      });
      for (const product of products) {
        const rows = (product.sizes_and_colors as { id?: number }[] | undefined) ?? [];
        if (rows.some((row) => row.id === variant.id)) {
          productPhoto = product.photo ?? null;
          break;
        }
      }
    }

    item.image_url = mediaUrl(variant.photo) ?? mediaUrl(productPhoto);
  }
}

export default factories.createCoreController('api::order.order', ({ strapi }) => ({
  async findByReference(ctx) {
    const raw = (ctx.params as { orderReference?: string }).orderReference;
    const orderReference = raw ? decodeURIComponent(raw).trim() : '';

    if (!orderReference) {
      return ctx.badRequest('Order reference is required');
    }

    const order = await strapi.db.query('api::order.order').findOne({
      where: { order_reference: orderReference },
      populate: ['what_they_ordered'],
    });

    if (!order) {
      return ctx.notFound('Order not found');
    }

    const summary = toPublicOrderSummary(order as Record<string, unknown>);
    await resolveMissingItemImages(strapi, summary.what_they_ordered);
    ctx.body = { data: summary };
  },

  async markPaid(ctx) {
    const { documentId } = ctx.params as { documentId?: string };

    if (!documentId) {
      return ctx.badRequest('Order id is required');
    }

    const order = await strapi.db.query('api::order.order').findOne({
      where: { documentId },
    });

    if (!order) {
      return ctx.notFound('Order not found');
    }

    const currentStatus = String(order.order_status ?? 'placed');

    if (PAID_OR_LATER.has(currentStatus)) {
      ctx.body = {
        data: {
          documentId,
          order_status: currentStatus,
        },
      };
      return;
    }

    const updated = await strapi.documents('api::order.order').update({
      documentId,
      data: { order_status: 'paid' },
    });

    ctx.body = {
      data: {
        documentId,
        order_status: updated.order_status ?? 'paid',
      },
    };
  },
}));
