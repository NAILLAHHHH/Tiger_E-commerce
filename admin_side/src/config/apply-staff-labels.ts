import type { Core } from '@strapi/strapi';
import STAFF_ADMIN_LABELS from './staff-admin-labels.json';

type CmMetadata = {
  edit?: Record<string, unknown>;
  list?: Record<string, unknown>;
};

type CmConfig = {
  metadatas: Record<string, CmMetadata>;
  layouts?: unknown;
  settings?: unknown;
  uid?: string;
  isComponent?: boolean;
};

function applyFieldLabels(config: CmConfig, fields: Record<string, Record<string, unknown>>) {
  for (const [field, updates] of Object.entries(fields)) {
    if (!config.metadatas[field]) continue;

    for (const view of ['edit', 'list'] as const) {
      const slot = config.metadatas[field][view];
      if (!slot) continue;

      if (updates.label != null) slot.label = updates.label;
      if (updates.description != null) slot.description = updates.description;
      if (updates.visible != null) slot.visible = updates.visible;
      if (updates.editable != null) slot.editable = updates.editable;
    }
  }
}

/** Apply plain-language field labels in the Content Manager for shop staff. */
export async function applyStaffAdminLabels(strapi: Core.Strapi) {
  const table = 'strapi_core_store_settings';

  for (const [storeKey, fieldLabels] of Object.entries(STAFF_ADMIN_LABELS)) {
    const row = await strapi.db.connection(table).where({ key: storeKey }).first();

    if (!row?.value) {
      strapi.log.debug(`Staff labels: no config yet for ${storeKey}`);
      continue;
    }

    let config: CmConfig;
    try {
      config = JSON.parse(row.value);
    } catch {
      strapi.log.warn(`Staff labels: could not parse config for ${storeKey}`);
      continue;
    }

    applyFieldLabels(config, fieldLabels);

    await strapi.db.connection(table).where({ key: storeKey }).update({
      value: JSON.stringify(config),
    });
  }

  strapi.log.info('Staff-friendly admin labels applied');
}
