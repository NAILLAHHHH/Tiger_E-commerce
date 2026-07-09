/**
 * Migrate order statuses to placed / pending / completed / cancelled.
 * Run: node admin_side/scripts/repair-order-statuses.mjs
 */
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, '../.tmp/data.db'));

const map = {
  waiting_to_call: 'placed',
  customer_agreed: 'pending',
  payment_received: 'pending',
  delivered: 'completed',
  pending_contact: 'placed',
  confirmed: 'pending',
  paid: 'paid',
  fulfilled: 'completed',
  cancelled: 'cancelled',
};

const cols = db.prepare('PRAGMA table_info(orders)').all();
const statusCol = cols.some((c) => c.name === 'order_status')
  ? 'order_status'
  : cols.some((c) => c.name === 'status')
    ? 'status'
    : null;

if (!statusCol) {
  console.log('No order_status column found — run migrate-order-status-field.mjs first');
  db.close();
  process.exit(1);
}

const rows = db.prepare(`SELECT id, ${statusCol} AS order_status FROM orders`).all();
const update = db.prepare(`UPDATE orders SET order_status = ? WHERE id = ?`);

for (const row of rows) {
  const next = map[row.order_status] ?? row.order_status;
  if (!['placed', 'pending', 'completed', 'cancelled'].includes(next)) {
    update.run('placed', row.id);
    console.log(`order ${row.id}: ${row.order_status} -> placed`);
  } else if (next !== row.order_status) {
    update.run(next, row.id);
    console.log(`order ${row.id}: ${row.order_status} -> ${next}`);
  }
}

try {
  db.exec('ALTER TABLE orders ADD COLUMN stock_deducted BOOLEAN DEFAULT 0');
  console.log('Added stock_deducted column');
} catch {
  // already exists
}

db.close();
console.log('Order statuses updated. Restart Strapi.');
