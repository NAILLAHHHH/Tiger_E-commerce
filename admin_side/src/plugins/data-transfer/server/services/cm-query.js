'use strict';

const SEARCH_FIELDS = {
  categories: ['name', 'link_name'],
  products: ['name', 'description', 'link_name'],
  'product-variants': ['item_code', 'size', 'color', 'color_dot'],
  'inventory-movements': [
    'movement_type',
    'item_code',
    'product_name',
    'size',
    'color',
    'reason',
    'source',
  ],
  'price-histories': [
    'price_field',
    'item_code',
    'product_name',
    'size',
    'color',
    'reason',
    'source',
  ],
  orders: [
    'order_reference',
    'customer_name',
    'phone',
    'delivery_address',
    'customer_notes',
    'order_status',
  ],
};

const UID_BY_KEY = {
  categories: 'api::category.category',
  products: 'api::product.product',
  'product-variants': 'api::product-variant.product-variant',
  'inventory-movements': 'api::inventory-movement.inventory-movement',
  'price-histories': 'api::price-history.price-history',
  orders: 'api::order.order',
};

function normalizeIds(documentIds) {
  return Array.isArray(documentIds)
    ? documentIds.map(String).filter(Boolean)
    : [];
}

function parseJsonValue(value) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }
  return value;
}

function normalizeFilters(filters) {
  if (filters == null) return null;
  const parsed = parseJsonValue(filters);
  if (!parsed || typeof parsed !== 'object') return null;
  return parsed;
}

function sanitizeFilters(filters) {
  const normalized = normalizeFilters(filters);
  if (!normalized) return null;

  const clone = JSON.parse(JSON.stringify(normalized));

  const stripStatus = (node) => {
    if (!node || typeof node !== 'object') return node;
    if (Array.isArray(node)) return node.map(stripStatus).filter(Boolean);

    if ('__status' in node) {
      const { __status, ...rest } = node;
      return Object.keys(rest).length ? stripStatus(rest) : null;
    }

    const next = {};
    for (const [key, value] of Object.entries(node)) {
      const cleaned = stripStatus(value);
      if (cleaned != null && !(Array.isArray(cleaned) && cleaned.length === 0)) {
        next[key] = cleaned;
      }
    }
    return Object.keys(next).length ? next : null;
  };

  return stripStatus(clone);
}

function parseDateBoundary(value, endOfDay = false) {
  if (!value) return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }
  return date;
}

function buildSearchFilter(contentTypeKey, searchTerm) {
  const search = typeof searchTerm === 'string' ? searchTerm.trim() : '';
  if (!search) return null;

  const clauses = [];

  for (const field of SEARCH_FIELDS[contentTypeKey] ?? []) {
    clauses.push({ [field]: { $containsi: search } });
  }

  if (contentTypeKey === 'products') {
    clauses.push({ category: { name: { $containsi: search } } });
  }

  if (contentTypeKey === 'product-variants') {
    clauses.push({ product: { name: { $containsi: search } } });
  }

  if (contentTypeKey === 'orders') {
    clauses.push(
      { what_they_ordered: { product_name: { $containsi: search } } },
      { what_they_ordered: { item_code: { $containsi: search } } },
      { what_they_ordered: { size: { $containsi: search } } },
      { what_they_ordered: { color: { $containsi: search } } },
    );
  }

  if (clauses.length === 0) return null;
  if (clauses.length === 1) return clauses[0];
  return { $or: clauses };
}

function buildWhere(contentTypeKey, options = {}) {
  const ids = normalizeIds(options.documentIds);
  if (ids.length > 0) {
    return { documentId: { $in: ids } };
  }

  const andFilters = [];
  const cleaned = sanitizeFilters(options.filters);
  if (cleaned) andFilters.push(cleaned);

  const searchFilter = buildSearchFilter(contentTypeKey, options._q);
  if (searchFilter) andFilters.push(searchFilter);

  if (contentTypeKey === 'inventory-movements' || contentTypeKey === 'price-histories') {
    if (options.before instanceof Date) {
      andFilters.push({ createdAt: { $lt: options.before } });
    } else if (options.before) {
      const before = parseDateBoundary(options.before);
      if (before) andFilters.push({ createdAt: { $lt: before } });
    }

    if (options.from instanceof Date) {
      andFilters.push({ createdAt: { $gte: options.from } });
    } else {
      const from = parseDateBoundary(options.from);
      if (from) andFilters.push({ createdAt: { $gte: from } });
    }

    if (options.to instanceof Date) {
      andFilters.push({ createdAt: { $lt: options.to } });
    } else {
      const to = parseDateBoundary(options.to, true);
      if (to) andFilters.push({ createdAt: { $lte: to } });
    }

    if (
      contentTypeKey === 'inventory-movements' &&
      typeof options.movement_type === 'string' &&
      options.movement_type.trim()
    ) {
      andFilters.push({ movement_type: options.movement_type.trim() });
    } else if (contentTypeKey === 'inventory-movements') {
      andFilters.push({
        movement_type: { $notIn: ['sale', 'cancel_restore'] },
      });
    }

    if (typeof options.item_code === 'string' && options.item_code.trim()) {
      andFilters.push({ item_code: { $containsi: options.item_code.trim() } });
    }
  }

  if (andFilters.length === 0) return {};
  if (andFilters.length === 1) return andFilters[0];
  return { $and: andFilters };
}

async function findDocuments(strapi, contentTypeKey, options = {}, queryOptions = {}) {
  const uid = UID_BY_KEY[contentTypeKey];
  if (!uid) return [];

  const filters = buildWhere(contentTypeKey, options);
  const hasFilters = filters && Object.keys(filters).length > 0;

  const params = {
    ...queryOptions,
    pagination: { pageSize: 10000, page: 1 },
  };

  if (hasFilters) {
    params.filters = filters;
  }

  const result = await strapi.documents(uid).findMany(params);
  return Array.isArray(result) ? result : result?.results ?? [];
}

function searchOrFilterScope(filters, _q) {
  const hasSearch = typeof _q === 'string' && _q.trim().length > 0;
  const cleaned = sanitizeFilters(filters);
  const hasFilters = Boolean(cleaned);

  if (hasSearch || hasFilters) return 'filtered';
  return 'all';
}

function resolveScope(options = {}) {
  if (normalizeIds(options.documentIds).length > 0) return 'selected';
  return searchOrFilterScope(options.filters, options._q);
}

function normalizeExportOptions(options = {}) {
  return {
    documentIds: options.documentIds,
    filters: normalizeFilters(options.filters),
    _q: typeof options._q === 'string' ? options._q.trim() : '',
    from: options.from,
    to: options.to,
    item_code: options.item_code,
    movement_type: options.movement_type,
  };
}

module.exports = {
  SEARCH_FIELDS,
  UID_BY_KEY,
  normalizeExportOptions,
  normalizeFilters,
  sanitizeFilters,
  buildWhere,
  buildSearchFilter,
  findDocuments,
  resolveScope,
  searchOrFilterScope,
};
