'use strict';

const { CONTENT_TYPES, isContentTypeKey, roundMoney } = require('./content-types');
const {
  findDocuments,
  normalizeExportOptions,
  resolveScope,
} = require('./cm-query');
const {
  parseBoolean,
  parseCsv,
  parseInteger,
  parseNumber,
  rowsToCsv,
} = require('./csv');
const {
  FORMAT_META,
  isExportFormat,
  rowsToExcelBuffer,
  rowsToPdfBuffer,
} = require('./export-formats');

function categoryName(category) {
  if (!category || typeof category !== 'object') return '';
  return typeof category.name === 'string' ? category.name : '';
}

function productName(product) {
  if (!product || typeof product !== 'object') return '';
  return typeof product.name === 'string' ? product.name : '';
}

function formatDate(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString();
}

async function findCategoryByName(strapi, name) {
  const trimmed = name.trim();
  if (!trimmed) return null;

  return strapi.db.query('api::category.category').findOne({
    where: { name: trimmed },
  });
}

async function findProductByName(strapi, name) {
  const trimmed = name.trim();
  if (!trimmed) return null;

  return strapi.db.query('api::product.product').findOne({
    where: { name: trimmed },
  });
}

async function exportCategories(strapi, options = {}) {
  const categories = await findDocuments(
    strapi,
    'categories',
    normalizeExportOptions(options),
    { sort: ['list_position:asc'] },
  );

  return categories.map((category) => ({
    name: category.name ?? '',
    link_name: category.link_name ?? '',
    list_position: category.list_position ?? 0,
  }));
}

async function exportProducts(strapi, options = {}) {
  const products = await findDocuments(
    strapi,
    'products',
    normalizeExportOptions(options),
    {
      populate: { category: true },
      sort: ['name:asc'],
    },
  );

  return products.map((product) => ({
    name: product.name ?? '',
    link_name: product.link_name ?? '',
    description: product.description ?? '',
    highlight_on_homepage: product.highlight_on_homepage ? 'true' : 'false',
    mark_as_new: product.mark_as_new ? 'true' : 'false',
    category_name: categoryName(product.category),
  }));
}

async function exportInventoryMovements(strapi, options = {}) {
  const rows = await findDocuments(
    strapi,
    'inventory-movements',
    normalizeExportOptions(options),
    { sort: ['createdAt:asc'] },
  );

  return rows.map((row) => ({
    created_at: formatDate(row.createdAt),
    movement_type: row.movement_type ?? '',
    item_code: row.item_code ?? '',
    product_name: row.product_name ?? '',
    size: row.size ?? '',
    color: row.color ?? '',
    quantity_delta: row.quantity_delta ?? 0,
    quantity_before: row.quantity_before ?? 0,
    quantity_after: row.quantity_after ?? 0,
    order_reference: row.order_reference ?? '',
    source: row.source ?? '',
    reason: row.reason ?? '',
  }));
}

async function exportPriceHistories(strapi, options = {}) {
  const rows = await findDocuments(
    strapi,
    'price-histories',
    normalizeExportOptions(options),
    { sort: ['createdAt:asc'] },
  );

  return rows.map((row) => ({
    created_at: formatDate(row.createdAt),
    price_field: row.price_field ?? '',
    item_code: row.item_code ?? '',
    product_name: row.product_name ?? '',
    size: row.size ?? '',
    color: row.color ?? '',
    price_before: row.price_before ?? '',
    price_after: row.price_after ?? '',
    source: row.source ?? '',
    reason: row.reason ?? '',
  }));
}

async function exportProductVariants(strapi, options = {}) {
  const variants = await findDocuments(
    strapi,
    'product-variants',
    normalizeExportOptions(options),
    {
      populate: { product: true },
      sort: ['item_code:asc'],
    },
  );

  return variants.map((variant) => ({
    item_code: variant.item_code ?? '',
    size: variant.size ?? '',
    color: variant.color ?? '',
    color_dot: variant.color_dot ?? '',
    price_for_one: variant.price_for_one ?? 0,
    price_for_bulk: variant.price_for_bulk ?? '',
    min_quantity_for_bulk: variant.min_quantity_for_bulk ?? '',
    how_many_left: variant.how_many_left ?? 0,
    product_name: productName(variant.product),
  }));
}

async function exportOrders(strapi, options = {}) {
  const orders = await findDocuments(
    strapi,
    'orders',
    normalizeExportOptions(options),
    {
      populate: { what_they_ordered: true },
      sort: ['createdAt:desc'],
    },
  );

  const rows = [];

  for (const order of orders) {
    const items = Array.isArray(order.what_they_ordered) ? order.what_they_ordered : [];

    if (items.length === 0) {
      rows.push({
        order_reference: order.order_reference ?? '',
        customer_name: order.customer_name ?? '',
        phone: order.phone ?? '',
        delivery_address: order.delivery_address ?? '',
        customer_notes: order.customer_notes ?? '',
        order_status: order.order_status ?? 'placed',
        subtotal: order.subtotal ?? 0,
        total: order.total ?? 0,
        product_name: '',
        size: '',
        color: '',
        item_code: '',
        how_many: '',
        price_each: '',
        bought_as: '',
        row_total: '',
        image_url: '',
        created_at: formatDate(order.createdAt),
      });
      continue;
    }

    for (const item of items) {
      rows.push({
        order_reference: order.order_reference ?? '',
        customer_name: order.customer_name ?? '',
        phone: order.phone ?? '',
        delivery_address: order.delivery_address ?? '',
        customer_notes: order.customer_notes ?? '',
        order_status: order.order_status ?? 'placed',
        subtotal: order.subtotal ?? 0,
        total: order.total ?? 0,
        product_name: item.product_name ?? '',
        size: item.size ?? '',
        color: item.color ?? '',
        item_code: item.item_code ?? '',
        how_many: item.how_many ?? 0,
        price_each: item.price_each ?? 0,
        bought_as: item.bought_as ?? 'one_piece',
        row_total: item.row_total ?? 0,
        image_url: item.image_url ?? '',
        created_at: formatDate(order.createdAt),
      });
    }
  }

  return rows;
}

async function importCategories(strapi, rows) {
  const result = { created: 0, updated: 0, skipped: 0, errors: [] };

  for (const [index, row] of rows.entries()) {
    const name = row.name?.trim();
    if (!name) {
      result.errors.push(`Row ${index + 2}: name is required`);
      continue;
    }

    const existing = await findCategoryByName(strapi, name);
    const data = {
      name,
      list_position: parseInteger(row.list_position, existing?.list_position ?? 0),
    };

    if (existing?.documentId) {
      await strapi.documents('api::category.category').update({
        documentId: existing.documentId,
        data,
      });
      result.updated += 1;
      continue;
    }

    await strapi.documents('api::category.category').create({ data });
    result.created += 1;
  }

  return result;
}

async function importProducts(strapi, rows) {
  const result = { created: 0, updated: 0, skipped: 0, errors: [] };

  for (const [index, row] of rows.entries()) {
    const name = row.name?.trim();
    if (!name) {
      result.errors.push(`Row ${index + 2}: name is required`);
      continue;
    }

    let categoryDocumentId;
    const categoryNameValue = row.category_name?.trim();
    if (categoryNameValue) {
      const category = await findCategoryByName(strapi, categoryNameValue);
      if (!category?.documentId) {
        result.errors.push(
          `Row ${index + 2}: category "${categoryNameValue}" was not found`,
        );
        continue;
      }
      categoryDocumentId = category.documentId;
    }

    const existing = await findProductByName(strapi, name);
    const data = {
      name,
      description: row.description?.trim() || null,
      highlight_on_homepage: parseBoolean(row.highlight_on_homepage),
      mark_as_new: parseBoolean(row.mark_as_new),
    };

    if (categoryDocumentId) {
      data.category = categoryDocumentId;
    }

    if (existing?.documentId) {
      await strapi.documents('api::product.product').update({
        documentId: existing.documentId,
        data,
      });
      result.updated += 1;
      continue;
    }

    await strapi.documents('api::product.product').create({ data });
    result.created += 1;
  }

  return result;
}

async function importProductVariants(strapi, rows) {
  const { setBulkImportActive } = require('../../../../utils/inventory-log');
  const result = { created: 0, updated: 0, skipped: 0, errors: [] };

  setBulkImportActive(true);
  try {

  for (const [index, row] of rows.entries()) {
    const itemCode = row.item_code?.trim();
    const productNameValue = row.product_name?.trim();

    if (!itemCode) {
      result.errors.push(`Row ${index + 2}: item_code is required`);
      continue;
    }

    if (!productNameValue) {
      result.errors.push(`Row ${index + 2}: product_name is required`);
      continue;
    }

    const product = await findProductByName(strapi, productNameValue);
    if (!product?.documentId) {
      result.errors.push(`Row ${index + 2}: product "${productNameValue}" was not found`);
      continue;
    }

    const data = {
      item_code: itemCode,
      size: row.size?.trim() || 'One size',
      color: row.color?.trim() || 'Default',
      color_dot: row.color_dot?.trim() || null,
      price_for_one: parseNumber(row.price_for_one),
      price_for_bulk: row.price_for_bulk?.trim()
        ? parseNumber(row.price_for_bulk)
        : null,
      min_quantity_for_bulk: parseInteger(row.min_quantity_for_bulk, 10),
      how_many_left: parseInteger(row.how_many_left, 0),
      product: product.documentId,
    };

    const existing = await strapi.db
      .query('api::product-variant.product-variant')
      .findOne({ where: { item_code: itemCode } });

    if (existing?.documentId) {
      await strapi.documents('api::product-variant.product-variant').update({
        documentId: existing.documentId,
        data,
      });
      result.updated += 1;
      continue;
    }

    await strapi.documents('api::product-variant.product-variant').create({ data });
    result.created += 1;
  }

  return result;
  } finally {
    setBulkImportActive(false);
  }
}

function groupOrderRows(rows) {
  const groups = new Map();

  rows.forEach((row, index) => {
    const groupKey =
      row.order_group?.trim() ||
      row.order_reference?.trim() ||
      `row-${index + 2}`;

    const existing = groups.get(groupKey);
    if (existing) {
      existing.rows.push(row);
      return;
    }

    groups.set(groupKey, { rows: [row] });
  });

  return groups;
}

async function importOrders(strapi, rows) {
  const result = { created: 0, updated: 0, skipped: 0, errors: [] };
  const groups = groupOrderRows(rows);

  for (const [groupKey, group] of groups.entries()) {
    const first = group.rows[0];
    const customerName = first.customer_name?.trim();
    const phone = first.phone?.trim();

    if (!customerName) {
      result.errors.push(`Order group "${groupKey}": customer_name is required`);
      continue;
    }

    if (!phone) {
      result.errors.push(`Order group "${groupKey}": phone is required`);
      continue;
    }

    const lineItems = group.rows
      .map((row, rowIndex) => {
        const productNameValue = row.product_name?.trim();
        if (!productNameValue) {
          result.errors.push(
            `Order group "${groupKey}" row ${rowIndex + 1}: product_name is required`,
          );
          return null;
        }

        const howMany = parseInteger(row.how_many, 0);
        const priceEach = parseNumber(row.price_each, 0);
        const rowTotal = row.row_total?.trim()
          ? parseNumber(row.row_total)
          : roundMoney(howMany * priceEach);

        if (howMany < 1) {
          result.errors.push(
            `Order group "${groupKey}" row ${rowIndex + 1}: how_many must be at least 1`,
          );
          return null;
        }

        return {
          product_name: productNameValue,
          size: row.size?.trim() || null,
          color: row.color?.trim() || null,
          item_code: row.item_code?.trim() || null,
          how_many: howMany,
          price_each: priceEach,
          bought_as: row.bought_as?.trim() === 'many_pieces' ? 'many_pieces' : 'one_piece',
          row_total: rowTotal,
          image_url: row.image_url?.trim() || null,
        };
      })
      .filter(Boolean);

    if (lineItems.length === 0) {
      result.skipped += 1;
      continue;
    }

    const computedSubtotal = roundMoney(
      lineItems.reduce((sum, item) => sum + Number(item.row_total ?? 0), 0),
    );
    const subtotal = first.subtotal?.trim()
      ? parseNumber(first.subtotal)
      : computedSubtotal;
    const total = first.total?.trim() ? parseNumber(first.total) : subtotal;

    const orderReference = first.order_reference?.trim();
    const existing = orderReference
      ? await strapi.db.query('api::order.order').findOne({
          where: { order_reference: orderReference },
        })
      : null;

    const data = {
      customer_name: customerName,
      phone,
      delivery_address: first.delivery_address?.trim() || null,
      customer_notes: first.customer_notes?.trim() || null,
      order_status: first.order_status?.trim() || 'placed',
      subtotal,
      total,
      what_they_ordered: lineItems,
    };

    if (orderReference) {
      data.order_reference = orderReference;
    }

    if (existing?.documentId) {
      await strapi.documents('api::order.order').update({
        documentId: existing.documentId,
        data,
      });
      result.updated += 1;
      continue;
    }

    await strapi.documents('api::order.order').create({ data });
    result.created += 1;
  }

  return result;
}

module.exports = ({ strapi }) => ({
  listContentTypes() {
    return Object.values(CONTENT_TYPES).map(({ key, label, description }) => ({
      key,
      label,
      description,
    }));
  },

  async exportRows(contentType, options = {}) {
    switch (contentType) {
      case 'categories':
        return exportCategories(strapi, options);
      case 'products':
        return exportProducts(strapi, options);
      case 'product-variants':
        return exportProductVariants(strapi, options);
      case 'inventory-movements':
        return exportInventoryMovements(strapi, options);
      case 'price-histories':
        return exportPriceHistories(strapi, options);
      case 'orders':
        return exportOrders(strapi, options);
      default:
        return [];
    }
  },

  async exportCsv(contentType, options = {}) {
    return this.exportData(contentType, { ...options, format: 'csv' });
  },

  async exportData(contentType, options = {}) {
    const format = isExportFormat(options.format) ? options.format : 'csv';
    const config = CONTENT_TYPES[contentType];
    const rows = await this.exportRows(contentType, options);
    const scope = resolveScope(options);
    const meta = FORMAT_META[format];
    const baseName = `${contentType}-${scope === 'all' ? 'export' : `${scope}-export`}`;
    const title = `${config.label} export`;

    const count =
      contentType === 'orders'
        ? new Set(rows.map((row) => row.order_reference).filter(Boolean)).size ||
          rows.length
        : rows.length;

    if (format === 'excel') {
      const buffer = await rowsToExcelBuffer(
        config.exportHeaders,
        rows,
        config.label,
      );
      return {
        format,
        scope,
        count,
        encoding: meta.encoding,
        mimeType: meta.mimeType,
        filename: `${baseName}.${meta.extension}`,
        content: buffer.toString('base64'),
      };
    }

    if (format === 'pdf') {
      const buffer = await rowsToPdfBuffer(
        config.exportHeaders,
        rows,
        title,
      );
      return {
        format,
        scope,
        count,
        encoding: meta.encoding,
        mimeType: meta.mimeType,
        filename: `${baseName}.${meta.extension}`,
        content: buffer.toString('base64'),
      };
    }

    return {
      format: 'csv',
      scope,
      count,
      encoding: 'utf8',
      mimeType: meta.mimeType,
      filename: `${baseName}.csv`,
      content: rowsToCsv(config.exportHeaders, rows),
      // keep legacy field for older clients
      csv: rowsToCsv(config.exportHeaders, rows),
    };
  },

  templateCsv(contentType) {
    const config = CONTENT_TYPES[contentType];
    const rows = config.templateExample ? [config.templateExample] : [];
    return rowsToCsv(config.templateHeaders, rows);
  },

  async importCsv(contentType, csvText) {
    if (!isContentTypeKey(contentType)) {
      throw new Error('Unsupported content type');
    }

    const { rows } = parseCsv(csvText);
    if (rows.length === 0) {
      return {
        created: 0,
        updated: 0,
        skipped: 0,
        errors: ['The CSV file has no data rows.'],
      };
    }

    switch (contentType) {
      case 'categories':
        return importCategories(strapi, rows);
      case 'products':
        return importProducts(strapi, rows);
      case 'product-variants':
        return importProductVariants(strapi, rows);
      case 'orders':
        return importOrders(strapi, rows);
      default:
        return {
          created: 0,
          updated: 0,
          skipped: 0,
          errors: ['Unsupported content type'],
        };
    }
  },

  async orderSummary(options = {}) {
    const normalized = normalizeExportOptions(options);
    const orders = await findDocuments(strapi, 'orders', normalized, {
      fields: ['subtotal', 'total', 'documentId'],
    });

    let totalSubtotal = 0;
    let totalAmount = 0;

    for (const order of orders) {
      totalSubtotal += parseNumber(String(order.subtotal ?? 0));
      totalAmount += parseNumber(String(order.total ?? 0));
    }

    return {
      count: orders.length,
      totalSubtotal: roundMoney(totalSubtotal),
      totalAmount: roundMoney(totalAmount),
      currency: 'RWF',
      scope: resolveScope(normalized),
    };
  },
});
