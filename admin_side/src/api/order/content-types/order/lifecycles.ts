import { syncOrderStock } from '../../services/order-stock';

function generateOrderReference(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `TW-${date}-${rand}`;
}

type LifecycleEvent = {
  params: {
    data?: Record<string, unknown>;
    where?: { id?: number };
    documentId?: string;
  };
};

const ORDER_STATUS_VALUES = new Set(['placed', 'pending', 'completed', 'cancelled']);

/** `status` is reserved in Strapi 5 — map legacy/admin payloads to order_status. */
export function sanitizeOrderData(data: Record<string, unknown>) {
  if (!('status' in data)) return;

  const legacy = data.status;
  if (
    !data.order_status &&
    typeof legacy === 'string' &&
    ORDER_STATUS_VALUES.has(legacy)
  ) {
    data.order_status = legacy;
  }

  delete data.status;
}

export function isStockRelevantUpdate(data: Record<string, unknown>) {
  return (
    'order_status' in data ||
    'what_they_ordered' in data ||
    'status' in data
  );
}

export async function loadOrderByDocumentId(documentId: string) {
  return strapi.db.query('api::order.order').findOne({
    where: { documentId },
    populate: { what_they_ordered: true },
  });
}

export default {
  beforeCreate(event: LifecycleEvent) {
    const { data } = event.params;
    if (!data) return;

    sanitizeOrderData(data);

    if (!data.order_reference && !data.order_number) {
      data.order_reference = generateOrderReference();
    }

    if (!data.order_status) {
      data.order_status = 'placed';
    }

    if (data.stock_deducted == null) {
      data.stock_deducted = false;
    }
  },

  beforeUpdate(event: LifecycleEvent) {
    const { data } = event.params;
    if (!data) return;

    sanitizeOrderData(data);
  },
};
