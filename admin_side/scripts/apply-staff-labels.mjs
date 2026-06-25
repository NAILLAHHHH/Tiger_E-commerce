/**
 * Apply staff-friendly admin labels to the local Strapi database.
 * Bootstrap runs the same logic automatically on every Strapi start.
 */
import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STAFF_ADMIN_LABELS = JSON.parse(
  readFileSync(join(__dirname, '../src/config/staff-admin-labels.json'), 'utf8'),
);

function applyFieldLabels(config, fields) {
  for (const [field, updates] of Object.entries(fields)) {
    if (!config.metadatas[field]) continue;

    for (const view of ['edit', 'list']) {
      const slot = config.metadatas[field][view];
      if (!slot) continue;

      if (updates.label != null) slot.label = updates.label;
      if (updates.description != null) slot.description = updates.description;
      if (updates.visible != null) slot.visible = updates.visible;
      if (updates.editable != null) slot.editable = updates.editable;
    }
  }
}

const db = new Database(join(__dirname, '../.tmp/data.db'));
const select = db.prepare('SELECT value FROM strapi_core_store_settings WHERE key = ?');
const update = db.prepare('UPDATE strapi_core_store_settings SET value = ? WHERE key = ?');

for (const [storeKey, fieldLabels] of Object.entries(STAFF_ADMIN_LABELS)) {
  const row = select.get(storeKey);
  if (!row?.value) {
    console.log(`skip (no config): ${storeKey}`);
    continue;
  }

  const config = JSON.parse(row.value);
  applyFieldLabels(config, fieldLabels);
  update.run(JSON.stringify(config), storeKey);
  console.log(`updated: ${storeKey}`);
}

db.close();
console.log('Done — refresh the Strapi admin in your browser.');
