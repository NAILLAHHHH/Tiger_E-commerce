import type { Core } from '@strapi/strapi';

const AUDIT_CONTENT_UIDS = [
  'api::inventory-movement.inventory-movement',
  'api::price-history.price-history',
] as const;

const MUTATE_ACTIONS = [
  'plugin::content-manager.explorer.create',
  'plugin::content-manager.explorer.update',
  'plugin::content-manager.explorer.delete',
  'plugin::content-manager.explorer.publish',
  'plugin::content-manager.explorer.unpublish',
] as const;

const CM_STORE_KEYS = [
  'plugin_content_manager_configuration_content_types::api::inventory-movement.inventory-movement',
  'plugin_content_manager_configuration_content_types::api::price-history.price-history',
] as const;

const SEARCHABLE_FIELDS: Record<string, string[]> = {
  'api::category.category': ['name', 'link_name'],
  'api::product.product': ['name', 'description', 'link_name'],
  'api::product-variant.product-variant': [
    'item_code',
    'size',
    'color',
    'color_dot',
  ],
  'api::order.order': [
    'order_reference',
    'customer_name',
    'phone',
    'delivery_address',
    'customer_notes',
    'order_status',
  ],
  'api::inventory-movement.inventory-movement': [
    'movement_type',
    'item_code',
    'product_name',
    'size',
    'color',
    'order_reference',
    'reason',
    'source',
  ],
  'api::price-history.price-history': [
    'price_field',
    'item_code',
    'product_name',
    'size',
    'color',
    'reason',
    'source',
  ],
  'api::review.review': ['customer_name', 'title', 'comment'],
};

const AUDIT_MAIN_FIELDS: Record<string, string> = {
  'api::inventory-movement.inventory-movement': 'item_code',
  'api::price-history.price-history': 'item_code',
};

type CmConfig = {
  metadatas?: Record<
    string,
    { edit?: Record<string, unknown>; list?: Record<string, unknown> }
  >;
  settings?: Record<string, unknown>;
};

/** Remove create / edit / delete from admin roles for audit log tables. */
export async function restrictAuditLogPermissions(strapi: Core.Strapi) {
  for (const uid of AUDIT_CONTENT_UIDS) {
    for (const action of MUTATE_ACTIONS) {
      const permissions = await strapi.db.query('admin::permission').findMany({
        where: { action, subject: uid },
      });

      for (const permission of permissions) {
        await strapi.db.query('admin::permission').delete({
          where: { id: permission.id },
        });
      }
    }
  }

  strapi.log.info('Audit log tables: create, edit, and delete disabled in admin');
}

function applySearchSettings(config: CmConfig, uid: string, audit = false) {
  config.settings = {
    ...(config.settings ?? {}),
    searchable: true,
    filterable: true,
    bulkable: audit ? false : config.settings?.bulkable ?? true,
    pageSize: config.settings?.pageSize ?? 10,
    defaultSortBy:
      config.settings?.defaultSortBy ??
      AUDIT_MAIN_FIELDS[uid] ??
      config.settings?.mainField ??
      'updatedAt',
    defaultSortOrder: config.settings?.defaultSortOrder ?? 'DESC',
  };

  if (AUDIT_MAIN_FIELDS[uid]) {
    config.settings.mainField = AUDIT_MAIN_FIELDS[uid];
  }

  const searchable = SEARCHABLE_FIELDS[uid] ?? [];
  for (const field of Object.keys(config.metadatas ?? {})) {
    const slot = config.metadatas![field];
    if (!slot.list) slot.list = {};
    slot.list.searchable = searchable.includes(field);
    slot.list.sortable = slot.list.sortable ?? true;

    if (!slot.edit) slot.edit = {};
    if (audit) {
      slot.edit.editable = false;
    }
  }
}

/** Mark audit tables read-only and enable search/filter on all shop tables. */
export async function applyReadOnlyAuditTypes(strapi: Core.Strapi) {
  const table = 'strapi_core_store_settings';

  for (const [uid] of Object.entries(SEARCHABLE_FIELDS)) {
    const storeKey = `plugin_content_manager_configuration_content_types::${uid}`;
    const row = await strapi.db.connection(table).where({ key: storeKey }).first();

    if (!row?.value) {
      strapi.log.debug(`CM list settings: no config yet for ${uid}`);
      continue;
    }

    let config: CmConfig;
    try {
      config = JSON.parse(row.value);
    } catch {
      strapi.log.warn(`CM list settings: could not parse config for ${uid}`);
      continue;
    }

    const isAudit = (AUDIT_CONTENT_UIDS as readonly string[]).includes(uid);
    applySearchSettings(config, uid, isAudit);

    await strapi.db.connection(table).where({ key: storeKey }).update({
      value: JSON.stringify(config),
    });
  }

  for (const storeKey of CM_STORE_KEYS) {
    const row = await strapi.db.connection(table).where({ key: storeKey }).first();
    if (!row?.value) continue;

    let config: CmConfig;
    try {
      config = JSON.parse(row.value);
    } catch {
      continue;
    }

    const uid = storeKey.replace(
      'plugin_content_manager_configuration_content_types::',
      '',
    );
    applySearchSettings(config, uid, true);

    await strapi.db.connection(table).where({ key: storeKey }).update({
      value: JSON.stringify(config),
    });
  }

  strapi.log.info('Content Manager search/filter settings applied');
}
