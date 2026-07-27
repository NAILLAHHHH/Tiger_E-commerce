'use strict';

const { isContentTypeKey } = require('../services/content-types');
const { isExportFormat } = require('../services/export-formats');

const PLUGIN = 'data-transfer';
const SERVICE = 'exportImport';

function getService(strapi) {
  return strapi.plugin(PLUGIN).service(SERVICE);
}

function sendCsv(ctx, filename, csv) {
  ctx.set('Content-Type', 'text/csv; charset=utf-8');
  ctx.set('Content-Disposition', `attachment; filename="${filename}"`);
  ctx.body = csv;
}

function readScopeOptions(ctx) {
  const body = ctx.request.body ?? {};
  const query = ctx.query ?? {};
  const { normalizeFilters } = require('../services/cm-query');

  return {
    documentIds: body.documentIds ?? query.documentIds,
    filters: normalizeFilters(body.filters ?? query.filters),
    _q: body._q ?? query._q,
    format: body.format ?? query.format ?? 'csv',
    from: body.from ?? query.from,
    to: body.to ?? query.to,
    date: body.date ?? query.date,
    period: body.period ?? query.period,
    item_code: body.item_code ?? query.item_code,
    movement_type: body.movement_type ?? query.movement_type,
  };
}

module.exports = ({ strapi }) => ({
  async listContentTypes(ctx) {
    ctx.body = { data: getService(strapi).listContentTypes() };
  },

  async exportCsv(ctx) {
    const { contentType } = ctx.params;

    if (!contentType || !isContentTypeKey(contentType)) {
      return ctx.badRequest('Unsupported content type');
    }

    const options = readScopeOptions(ctx);
    if (!isExportFormat(options.format)) {
      return ctx.badRequest('Unsupported export format. Use csv, excel, or pdf.');
    }

    const result = await getService(strapi).exportData(contentType, options);

    ctx.body = {
      data: result,
    };
  },

  async templateCsv(ctx) {
    const { contentType } = ctx.params;

    if (!contentType || !isContentTypeKey(contentType)) {
      return ctx.badRequest('Unsupported content type');
    }

    const csv = getService(strapi).templateCsv(contentType);
    sendCsv(ctx, `${contentType}-template.csv`, csv);
  },

  async importCsv(ctx) {
    const { contentType } = ctx.params;

    if (!contentType || !isContentTypeKey(contentType)) {
      return ctx.badRequest('Unsupported content type');
    }

    const csvText = typeof ctx.request.body?.csv === 'string' ? ctx.request.body.csv : '';

    if (!csvText.trim()) {
      return ctx.badRequest('CSV content is required');
    }

    const result = await getService(strapi).importCsv(contentType, csvText);
    ctx.body = { data: result };
  },

  async orderSummary(ctx) {
    const options = readScopeOptions(ctx);

    ctx.body = {
      data: await getService(strapi).orderSummary(options),
    };
  },

  async inventoryDashboard(ctx) {
    ctx.body = {
      data: await strapi.plugin(PLUGIN).service('inventoryDashboard').getDashboard(),
    };
  },

  async inventoryHistory(ctx) {
    const query = ctx.query ?? {};
    ctx.body = {
      data: await strapi
        .plugin(PLUGIN)
        .service('inventoryHistory')
        .getHistory({
          period: query.period,
          date: query.date,
          from: query.from,
          to: query.to,
          item_code: query.item_code,
          movement_type: query.movement_type,
        }),
    };
  },

  async restockInventory(ctx) {
    const body = ctx.request.body ?? {};

    try {
      const data = await strapi
        .plugin(PLUGIN)
        .service('inventoryHistory')
        .restock({
          documentId: body.documentId,
          item_code: body.item_code,
          quantity: body.quantity,
          note: body.note,
        });
      ctx.body = { data };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not update stock';
      return ctx.badRequest(message);
    }
  },
});
