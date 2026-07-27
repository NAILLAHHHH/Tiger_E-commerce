'use strict';

const {
  buildWhere,
  normalizeExportOptions,
} = require('./cm-query');

function buildMovementWhere(options = {}) {
  const { from, to, itemCode, movementType, item_code } = options;
  return buildWhere('inventory-movements', normalizeExportOptions({
    from,
    to,
    before: options.before,
    item_code: item_code ?? itemCode,
    movement_type: movementType,
  }));
}

function buildPriceHistoryWhere(options = {}) {
  return buildWhere('price-histories', normalizeExportOptions(options));
}

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date = new Date()) {
  const d = startOfDay(date);
  d.setDate(d.getDate() + 1);
  return d;
}

function startOfMonth(date = new Date()) {
  const d = startOfDay(date);
  d.setDate(1);
  return d;
}

function endOfMonth(date = new Date()) {
  const d = startOfMonth(date);
  d.setMonth(d.getMonth() + 1);
  return d;
}

function startOfYear(date = new Date()) {
  const d = startOfDay(date);
  d.setMonth(0, 1);
  return d;
}

function endOfYear(date = new Date()) {
  const d = startOfYear(date);
  d.setFullYear(d.getFullYear() + 1);
  return d;
}

function parseDateInput(value) {
  if (!value) return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function resolveRange({ period, date, from, to } = {}) {
  const anchor = parseDateInput(date) ?? new Date();

  if (period === 'month') {
    return { from: startOfMonth(anchor), to: endOfMonth(anchor), period: 'month' };
  }

  if (period === 'year') {
    return { from: startOfYear(anchor), to: endOfYear(anchor), period: 'year' };
  }

  if (from || to) {
    const rangeFrom = parseDateInput(from) ?? startOfDay(anchor);
    const rangeTo = parseDateInput(to)
      ? endOfDay(parseDateInput(to))
      : endOfDay(rangeFrom);
    return { from: rangeFrom, to: rangeTo, period: 'custom' };
  }

  return { from: startOfDay(anchor), to: endOfDay(anchor), period: 'day' };
}

function formatIso(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function roundMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

function mapMovement(row) {
  return {
    id: row.id,
    documentId: row.documentId,
    movement_type: row.movement_type,
    quantity_delta: Number(row.quantity_delta ?? 0),
    quantity_before: Number(row.quantity_before ?? 0),
    quantity_after: Number(row.quantity_after ?? 0),
    item_code: row.item_code ?? '',
    size: row.size ?? '',
    color: row.color ?? '',
    product_name: row.product_name ?? '',
    order_reference: row.order_reference ?? '',
    reason: row.reason ?? '',
    source: row.source ?? 'system',
    createdAt: formatIso(row.createdAt),
  };
}

function mapPriceChange(row) {
  return {
    id: row.id,
    documentId: row.documentId,
    price_field: row.price_field,
    price_before: row.price_before == null ? null : roundMoney(row.price_before),
    price_after: row.price_after == null ? null : roundMoney(row.price_after),
    item_code: row.item_code ?? '',
    size: row.size ?? '',
    color: row.color ?? '',
    product_name: row.product_name ?? '',
    reason: row.reason ?? '',
    source: row.source ?? 'admin',
    createdAt: formatIso(row.createdAt),
  };
}

function summarizeMovements(movements) {
  const summary = {
    sales: 0,
    restocked: 0,
    restored: 0,
    adjustedIn: 0,
    adjustedOut: 0,
    importedIn: 0,
    importedOut: 0,
    initial: 0,
    added: 0,
    removed: 0,
    netChange: 0,
    movementCount: movements.length,
  };

  for (const row of movements) {
    const delta = Number(row.quantity_delta ?? 0);
    summary.netChange += delta;

    switch (row.movement_type) {
      case 'sale':
        summary.sales += Math.abs(delta);
        break;
      case 'cancel_restore':
        summary.restored += delta;
        break;
      case 'restock':
        summary.restocked += delta;
        break;
      case 'import':
        if (delta >= 0) summary.importedIn += delta;
        else summary.importedOut += Math.abs(delta);
        break;
      case 'initial':
        summary.initial += delta;
        break;
      case 'adjustment':
      case 'count':
        if (delta >= 0) summary.adjustedIn += delta;
        else summary.adjustedOut += Math.abs(delta);
        break;
      default:
        break;
    }
  }

  summary.added =
    summary.restocked + summary.adjustedIn + summary.importedIn + summary.initial;
  summary.removed = summary.adjustedOut + summary.importedOut;

  return summary;
}

function groupByMonth(movements) {
  const buckets = new Map();

  for (const row of movements) {
    const date = new Date(row.createdAt);
    if (Number.isNaN(date.getTime())) continue;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const bucket = buckets.get(key) ?? {
      key,
      label: date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
      ...summarizeMovements([]),
    };
    const merged = summarizeMovements([row]);
    bucket.sales += merged.sales;
    bucket.restocked += merged.restocked;
    bucket.restored += merged.restored;
    bucket.added += merged.added;
    bucket.removed += merged.removed;
    bucket.adjustedIn += merged.adjustedIn;
    bucket.adjustedOut += merged.adjustedOut;
    bucket.importedIn += merged.importedIn;
    bucket.importedOut += merged.importedOut;
    bucket.initial += merged.initial;
    bucket.netChange += merged.netChange;
    bucket.movementCount += 1;
    buckets.set(key, bucket);
  }

  return [...buckets.values()].sort((a, b) => a.key.localeCompare(b.key));
}

async function currentStockTotal(strapi, { itemCode } = {}) {
  const where = {};
  if (typeof itemCode === 'string' && itemCode.trim()) {
    where.item_code = { $containsi: itemCode.trim() };
  }

  const variants = await strapi.db
    .query('api::product-variant.product-variant')
    .findMany({
      where,
      select: ['how_many_left'],
    });

  let total = 0;
  for (const variant of variants) {
    total += Math.max(0, Number(variant.how_many_left ?? 0));
  }
  return total;
}

async function netChangeAfterRange(strapi, { range, itemCode } = {}) {
  if (!range?.to) return 0;

  const movements = await strapi
    .documents('api::inventory-movement.inventory-movement')
    .findMany({
      filters: buildMovementWhere({
        from: range.to,
        item_code: itemCode,
      }),
      sort: ['createdAt:asc'],
      pagination: { pageSize: 5000, page: 1 },
    })
    .then((result) => (Array.isArray(result) ? result : result?.results ?? []));

  return summarizeMovements(movements.map(mapMovement)).netChange;
}

module.exports = ({ strapi }) => ({
  async getHistory(options = {}) {
    const range = resolveRange(options);
    const itemCode =
      typeof options.item_code === 'string' ? options.item_code.trim() : '';
    const movementType =
      typeof options.movement_type === 'string'
        ? options.movement_type.trim()
        : '';

    const [movements, priceChanges] = await Promise.all([
      strapi.documents('api::inventory-movement.inventory-movement').findMany({
        filters: buildMovementWhere({
          from: range.from,
          to: range.to,
          item_code: itemCode,
          movement_type: movementType,
        }),
        sort: ['createdAt:asc'],
        pagination: { pageSize: 5000, page: 1 },
      }).then((result) => (Array.isArray(result) ? result : result?.results ?? [])),
      strapi.documents('api::price-history.price-history').findMany({
        filters: buildPriceHistoryWhere({
          from: range.from,
          to: range.to,
          item_code: itemCode,
        }),
        sort: ['createdAt:asc'],
        pagination: { pageSize: 2000, page: 1 },
      }).then((result) => (Array.isArray(result) ? result : result?.results ?? [])),
    ]);

    const mappedMovements = movements.map(mapMovement);
    const summary = summarizeMovements(mappedMovements);
    const currentTotal = await currentStockTotal(strapi, { itemCode });
    const afterRangeDelta = await netChangeAfterRange(strapi, {
      range,
      itemCode,
    });
    const closingBalance = currentTotal - afterRangeDelta;
    const openingBalance = closingBalance - summary.netChange;

    return {
      range: {
        period: range.period,
        from: formatIso(range.from),
        to: formatIso(range.to),
        label: rangeLabel(range),
      },
      summary,
      openingBalance,
      closingBalance,
      currentStock: currentTotal,
      movements: mappedMovements.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
      priceChanges: priceChanges
        .map(mapPriceChange)
        .sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      monthlyBreakdown:
        range.period === 'year' ? groupByMonth(mappedMovements) : [],
    };
  },

  async restock({ documentId, item_code, quantity, note } = {}) {
    const qty = Math.round(Number(quantity));
    const code =
      typeof item_code === 'string' ? item_code.trim() : '';

    if (!documentId && !code) {
      throw new Error('documentId or item_code is required');
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      throw new Error('quantity must be a positive number');
    }
    if (!note || !String(note).trim()) {
      throw new Error('A reason is required when restocking');
    }

    const variant = documentId
      ? await strapi.db
          .query('api::product-variant.product-variant')
          .findOne({
            where: { documentId: String(documentId) },
            populate: ['product'],
          })
      : await strapi.db
          .query('api::product-variant.product-variant')
          .findOne({
            where: { item_code: code },
            populate: ['product'],
          });

    if (!variant) {
      throw new Error('Size & color row not found');
    }

    const before = Math.max(0, Number(variant.how_many_left ?? 0));
    const after = before + qty;

    const { updateSizeColorStock } = require('../../../../utils/size-color');

    await updateSizeColorStock(
      strapi,
      { ...(variant), source: 'variant' },
      after,
      {
        movementType: 'restock',
        reason: String(note).trim(),
        source: 'admin',
      },
    );

    return {
      documentId: variant.documentId,
      item_code: variant.item_code,
      how_many_left: after,
      quantity_added: qty,
    };
  },
});

function rangeLabel(range) {
  if (range.period === 'month') {
    return range.from.toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
  }
  if (range.period === 'year') {
    return String(range.from.getFullYear());
  }
  if (range.period === 'custom') {
    return `${range.from.toLocaleDateString()} – ${new Date(range.to.getTime() - 1).toLocaleDateString()}`;
  }
  return range.from.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
