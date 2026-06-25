/**
 * Repair catalog prices, slugs, and pictures without a full Strapi restart.
 * Run: cd admin_side && npm run build && node scripts/repair-catalog.mjs
 */
import { createStrapi } from '@strapi/strapi';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = createStrapi({ distDir: path.join(__dirname, '../dist') });

await app.load();

const { repairCatalogFromSeed } = await import('../dist/src/config/repair-catalog.js');
await repairCatalogFromSeed(app);

await app.destroy();
console.log('Catalog repair complete.');
