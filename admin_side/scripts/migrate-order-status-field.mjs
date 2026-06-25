/**
 * Rename reserved `status` column to `order_status` (Strapi 5 reserved word).
 * Run: node admin_side/scripts/migrate-order-status-field.mjs
 */
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, '../.tmp/data.db'));

const cols = db.prepare('PRAGMA table_info(orders)').all();
const hasStatus = cols.some((c) => c.name === 'status');
const hasOrderStatus = cols.some((c) => c.name === 'order_status');

if (hasStatus && !hasOrderStatus) {
  db.exec('ALTER TABLE orders RENAME COLUMN status TO order_status');
  console.log('Renamed orders.status -> order_status');
} else if (hasStatus && hasOrderStatus) {
  db.exec(`
    UPDATE orders
    SET order_status = COALESCE(order_status, status)
    WHERE order_status IS NULL OR order_status = ''
  `);
  console.log('Copied orders.status -> order_status');
} else {
  console.log('No migration needed');
}

const map = {
  waiting_to_call: 'placed',
  customer_agreed: 'pending',
  payment_received: 'pending',
  delivered: 'completed',
};

const rows = db.prepare('SELECT id, order_status FROM orders').all();
const update = db.prepare('UPDATE orders SET order_status = ? WHERE id = ?');

for (const row of rows) {
  const next = map[row.order_status] ?? row.order_status;
  if (!['placed', 'pending', 'completed', 'cancelled'].includes(next)) {
    update.run('placed', row.id);
  } else if (next !== row.order_status) {
    update.run(next, row.id);
  }
}

db.close();
console.log('Done. Restart Strapi (npm run develop).');
