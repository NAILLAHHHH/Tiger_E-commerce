'use strict';

const { roundMoney } = require('./content-types');

const LOW_STOCK_THRESHOLD = 5;
const SOLD_STATUSES = ['placed', 'paid', 'pending', 'completed'];
const RECENT_LIMIT = 8;
const TOP_SOLD_LIMIT = 8;
const ACTIVITY_LIMIT = 20;

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(date = new Date()) {
  const d = startOfDay(date);
  // Monday as first day of week
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d;
}

function startOfMonth(date = new Date()) {
  const d = startOfDay(date);
  d.setDate(1);
  return d;
}

function daysAgo(days) {
  const date = startOfDay();
  date.setDate(date.getDate() - days);
  return date;
}

function parseQty(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function parseMoney(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function productLabel(product) {
  if (!product || typeof product !== 'object') return '';
  return typeof product.name === 'string' ? product.name : '';
}

function lineKey(item) {
  const code = typeof item.item_code === 'string' ? item.item_code.trim() : '';
  if (code) return `code:${code}`;
  return `sc:${item.size ?? ''}|${item.color ?? ''}|${item.product_name ?? ''}`;
}

function emptyPeriod() {
  return {
    orders: 0,
    unitsSold: 0,
    revenue: 0,
    cancelled: 0,
    productsCreated: 0,
    variantsCreated: 0,
    stockUpdated: 0,
    priceUpdated: 0,
  };
}

function finalizePeriod(period) {
  return {
    ...period,
    revenue: roundMoney(period.revenue),
  };
}

function inRange(value, since, until) {
  if (!value) return false;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  if (since && date < since) return false;
  if (until && date >= until) return false;
  return true;
}

function dayLabel(date = new Date()) {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatPriceValue(value) {
  if (value == null || value === '') return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `RWF ${Math.round(n).toLocaleString('en-US')}`;
}

function priceFieldLabel(field) {
  return field === 'price_for_bulk' ? 'Bulk price' : 'Retail price';
}

function orderUnits(order) {
  const lines = Array.isArray(order.what_they_ordered)
    ? order.what_they_ordered
    : [];
  let units = 0;
  for (const item of lines) {
    units += parseQty(item.how_many);
  }
  return units;
}

module.exports = ({ strapi }) => ({
  async getDashboard() {
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = startOfWeek(now);
    const monthStart = startOfMonth(now);
    const since7 = daysAgo(7);
    const since30 = daysAgo(30);

    const [variants, products, orders, movements, priceChanges] = await Promise.all([
      strapi.db.query('api::product-variant.product-variant').findMany({
        populate: ['product'],
        orderBy: { how_many_left: 'asc' },
      }),
      strapi.db.query('api::product.product').findMany({
        select: [
          'id',
          'documentId',
          'name',
          'mark_as_new',
          'createdAt',
          'updatedAt',
        ],
        orderBy: { updatedAt: 'desc' },
      }),
      strapi.db.query('api::order.order').findMany({
        populate: ['what_they_ordered'],
        orderBy: { createdAt: 'desc' },
      }),
      strapi.db.query('api::inventory-movement.inventory-movement').findMany({
        orderBy: { createdAt: 'desc' },
        limit: 5000,
      }),
      strapi.db.query('api::price-history.price-history').findMany({
        orderBy: { createdAt: 'desc' },
        limit: 5000,
      }),
    ]);

    let unitsInStock = 0;
    let outOfStock = 0;
    let lowStock = 0;
    const lowStockItems = [];

    for (const variant of variants) {
      const left = Math.max(0, Number(variant.how_many_left) || 0);
      unitsInStock += left;

      if (left === 0) {
        outOfStock += 1;
      } else if (left <= LOW_STOCK_THRESHOLD) {
        lowStock += 1;
      }

      if (left <= LOW_STOCK_THRESHOLD && lowStockItems.length < RECENT_LIMIT) {
        lowStockItems.push({
          documentId: variant.documentId,
          item_code: variant.item_code ?? '',
          product_name: productLabel(variant.product),
          size: variant.size ?? '',
          color: variant.color ?? '',
          how_many_left: left,
        });
      }
    }

    const reports = {
      today: emptyPeriod(),
      week: emptyPeriod(),
      month: emptyPeriod(),
      all: emptyPeriod(),
    };
    const last7Days = emptyPeriod();
    const last30Days = emptyPeriod();
    const soldByKey = new Map();
    const todayActivity = [];

    let unitsSoldAll = 0;
    let revenueAll = 0;
    let activeOrders = 0;
    let cancelledOrders = 0;

    for (const order of orders) {
      const status = order.order_status;
      const createdAt = order.createdAt ? new Date(order.createdAt) : null;
      const total = parseMoney(order.total);
      const units = orderUnits(order);
      const isToday = inRange(createdAt, todayStart);
      const isWeek = inRange(createdAt, weekStart);
      const isMonth = inRange(createdAt, monthStart);

      reports.all.orders += 1;

      if (status === 'cancelled') {
        cancelledOrders += 1;
        reports.all.cancelled += 1;
        if (isToday) reports.today.cancelled += 1;
        if (isWeek) reports.week.cancelled += 1;
        if (isMonth) reports.month.cancelled += 1;

        if (isToday) {
          todayActivity.push({
            type: 'order_cancelled',
            at: order.createdAt,
            title: order.order_reference || 'Order cancelled',
            detail: order.customer_name || '',
            amount: roundMoney(total),
            documentId: order.documentId,
          });
        }
        continue;
      }

      if (!SOLD_STATUSES.includes(status)) continue;

      activeOrders += 1;
      revenueAll += total;
      unitsSoldAll += units;

      reports.all.unitsSold += units;
      reports.all.revenue += total;

      if (isToday) {
        reports.today.orders += 1;
        reports.today.unitsSold += units;
        reports.today.revenue += total;
        todayActivity.push({
          type: 'order',
          at: order.createdAt,
          title: order.order_reference || 'New order',
          detail: `${order.customer_name || 'Customer'} · ${status} · ${units} units`,
          amount: roundMoney(total),
          documentId: order.documentId,
        });
      }
      if (isWeek) {
        reports.week.orders += 1;
        reports.week.unitsSold += units;
        reports.week.revenue += total;
      }
      if (isMonth) {
        reports.month.orders += 1;
        reports.month.unitsSold += units;
        reports.month.revenue += total;
      }

      const lines = Array.isArray(order.what_they_ordered)
        ? order.what_they_ordered
        : [];
      for (const item of lines) {
        const qty = parseQty(item.how_many);
        if (!qty) continue;
        const key = lineKey(item);
        const existing = soldByKey.get(key) ?? {
          product_name: item.product_name ?? '',
          item_code: item.item_code ?? '',
          size: item.size ?? '',
          color: item.color ?? '',
          units: 0,
        };
        existing.units += qty;
        soldByKey.set(key, existing);
      }

      if (createdAt && createdAt >= since7) {
        last7Days.orders += 1;
        last7Days.unitsSold += units;
        last7Days.revenue += total;
      }
      if (createdAt && createdAt >= since30) {
        last30Days.orders += 1;
        last30Days.unitsSold += units;
        last30Days.revenue += total;
      }
    }

    for (const product of products) {
      const created = inRange(product.createdAt, todayStart);
      const createdWeek = inRange(product.createdAt, weekStart);
      const createdMonth = inRange(product.createdAt, monthStart);

      reports.all.productsCreated += 1;
      if (created) {
        reports.today.productsCreated += 1;
        todayActivity.push({
          type: 'product_created',
          at: product.createdAt,
          title: product.name || 'New product',
          detail: 'Added to catalog',
          documentId: product.documentId,
        });
      }
      if (createdWeek) reports.week.productsCreated += 1;
      if (createdMonth) reports.month.productsCreated += 1;
    }

    for (const variant of variants) {
      const createdToday = inRange(variant.createdAt, todayStart);
      const createdWeek = inRange(variant.createdAt, weekStart);
      const createdMonth = inRange(variant.createdAt, monthStart);
      const updatedToday =
        inRange(variant.updatedAt, todayStart) &&
        !inRange(variant.createdAt, todayStart);
      const updatedWeek =
        inRange(variant.updatedAt, weekStart) &&
        !inRange(variant.createdAt, weekStart);
      const updatedMonth =
        inRange(variant.updatedAt, monthStart) &&
        !inRange(variant.createdAt, monthStart);

      reports.all.variantsCreated += 1;
      if (createdToday) {
        reports.today.variantsCreated += 1;
        todayActivity.push({
          type: 'variant_created',
          at: variant.createdAt,
          title: productLabel(variant.product) || variant.item_code || 'New size/color',
          detail: [
            variant.size,
            variant.color,
            variant.item_code,
            `${Math.max(0, Number(variant.how_many_left) || 0)} in stock`,
          ]
            .filter(Boolean)
            .join(' · '),
          documentId: variant.documentId,
        });
      }
      if (createdWeek) reports.week.variantsCreated += 1;
      if (createdMonth) reports.month.variantsCreated += 1;
    }

    function movementLabel(type) {
      switch (type) {
        case 'sale':
          return 'Sale';
        case 'cancel_restore':
          return 'Stock restored';
        case 'restock':
          return 'Restock';
        case 'import':
          return 'Import';
        case 'initial':
          return 'Initial stock';
        case 'count':
          return 'Stock count';
        default:
          return 'Stock adjusted';
      }
    }

    for (const movement of movements) {
      const createdAt = movement.createdAt ? new Date(movement.createdAt) : null;
      const isToday = inRange(createdAt, todayStart);
      const isWeek = inRange(createdAt, weekStart);
      const isMonth = inRange(createdAt, monthStart);
      const delta = Number(movement.quantity_delta ?? 0);
      const sign = delta > 0 ? '+' : '';
      const isOrderLinked =
        movement.movement_type === 'sale' ||
        movement.movement_type === 'cancel_restore';

      reports.all.stockUpdated += 1;
      if (isToday) reports.today.stockUpdated += 1;
      if (isWeek) reports.week.stockUpdated += 1;
      if (isMonth) reports.month.stockUpdated += 1;

      // Order-linked movements only store an order_reference — don't also
      // list them in today's activity (orders already appear there).
      if (isToday && !isOrderLinked) {
        todayActivity.push({
          type: 'stock_updated',
          at: movement.createdAt,
          title:
            movement.product_name ||
            movement.item_code ||
            movementLabel(movement.movement_type),
          detail: [
            movementLabel(movement.movement_type),
            movement.size,
            movement.color,
            `${sign}${delta} → ${Math.max(0, Number(movement.quantity_after) || 0)} left`,
            movement.reason || '',
          ]
            .filter(Boolean)
            .join(' · '),
          documentId: movement.documentId,
        });
      }
    }

    for (const change of priceChanges) {
      const createdAt = change.createdAt ? new Date(change.createdAt) : null;
      const isToday = inRange(createdAt, todayStart);
      const isWeek = inRange(createdAt, weekStart);
      const isMonth = inRange(createdAt, monthStart);

      reports.all.priceUpdated += 1;
      if (isToday) reports.today.priceUpdated += 1;
      if (isWeek) reports.week.priceUpdated += 1;
      if (isMonth) reports.month.priceUpdated += 1;

      if (isToday) {
        todayActivity.push({
          type: 'price_updated',
          at: change.createdAt,
          title: change.product_name || change.item_code || 'Price change',
          detail: [
            priceFieldLabel(change.price_field),
            change.size,
            change.color,
            change.item_code,
            `${formatPriceValue(change.price_before)} → ${formatPriceValue(change.price_after)}`,
            change.reason || '',
          ]
            .filter(Boolean)
            .join(' · '),
          documentId: change.documentId,
        });
      }
    }

    todayActivity.sort((a, b) => {
      const ta = a.at ? new Date(a.at).getTime() : 0;
      const tb = b.at ? new Date(b.at).getTime() : 0;
      return tb - ta;
    });

    const topSold = [...soldByKey.values()]
      .sort((a, b) => b.units - a.units)
      .slice(0, TOP_SOLD_LIMIT);

    const recentOrders = orders.slice(0, RECENT_LIMIT).map((order) => ({
      documentId: order.documentId,
      order_reference: order.order_reference ?? '',
      customer_name: order.customer_name ?? '',
      order_status: order.order_status ?? '',
      total: roundMoney(parseMoney(order.total)),
      createdAt: order.createdAt ?? null,
    }));

    const recentVariants = [...variants]
      .sort((a, b) => {
        const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return tb - ta;
      })
      .slice(0, RECENT_LIMIT)
      .map((variant) => ({
        documentId: variant.documentId,
        item_code: variant.item_code ?? '',
        product_name: productLabel(variant.product),
        size: variant.size ?? '',
        color: variant.color ?? '',
        how_many_left: Math.max(0, Number(variant.how_many_left) || 0),
        updatedAt: variant.updatedAt ?? null,
      }));

    const newProducts = products
      .filter((p) => p.mark_as_new)
      .slice(0, RECENT_LIMIT)
      .map((product) => ({
        documentId: product.documentId,
        name: product.name ?? '',
        createdAt: product.createdAt ?? null,
        updatedAt: product.updatedAt ?? null,
      }));

    return {
      inventory: {
        skuCount: variants.length,
        productCount: products.length,
        unitsInStock,
        outOfStock,
        lowStock,
        lowStockThreshold: LOW_STOCK_THRESHOLD,
        lowStockItems,
        unitsHandled: unitsInStock + unitsSoldAll,
      },
      sales: {
        ordersTotal: orders.length,
        ordersActive: activeOrders,
        ordersCancelled: cancelledOrders,
        unitsSold: unitsSoldAll,
        revenue: roundMoney(revenueAll),
        currency: 'RWF',
        last7Days: finalizePeriod(last7Days),
        last30Days: finalizePeriod(last30Days),
        topSold,
      },
      today: {
        label: dayLabel(now),
        date: todayStart.toISOString(),
        ...finalizePeriod(reports.today),
        activity: todayActivity.slice(0, ACTIVITY_LIMIT),
      },
      reports: {
        today: {
          key: 'today',
          label: 'Today',
          rangeLabel: dayLabel(now),
          ...finalizePeriod(reports.today),
        },
        week: {
          key: 'week',
          label: 'This week',
          rangeLabel: `Week of ${weekStart.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })}`,
          ...finalizePeriod(reports.week),
        },
        month: {
          key: 'month',
          label: 'This month',
          rangeLabel: now.toLocaleDateString(undefined, {
            month: 'long',
            year: 'numeric',
          }),
          ...finalizePeriod(reports.month),
        },
        all: {
          key: 'all',
          label: 'All time',
          rangeLabel: 'Since the store started',
          ...finalizePeriod(reports.all),
        },
      },
      recent: {
        orders: recentOrders,
        stockUpdates: recentVariants,
        newProducts,
      },
    };
  },
});
