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

  return {
    documentIds: body.documentIds ?? query.documentIds,
    filters: body.filters ?? query.filters,
    _q: body._q ?? query._q,
    format: body.format ?? query.format ?? 'csv',
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
});
