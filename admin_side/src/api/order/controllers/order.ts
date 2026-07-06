import { factories } from '@strapi/strapi';

const PAID_OR_LATER = new Set(['paid', 'pending', 'completed']);

export default factories.createCoreController('api::order.order', ({ strapi }) => ({
  async markPaid(ctx) {
    const { documentId } = ctx.params as { documentId?: string };

    if (!documentId) {
      return ctx.badRequest('Order id is required');
    }

    const order = await strapi.db.query('api::order.order').findOne({
      where: { documentId },
    });

    if (!order) {
      return ctx.notFound('Order not found');
    }

    const currentStatus = String(order.order_status ?? 'placed');

    if (PAID_OR_LATER.has(currentStatus)) {
      ctx.body = {
        data: {
          documentId,
          order_status: currentStatus,
        },
      };
      return;
    }

    const updated = await strapi.documents('api::order.order').update({
      documentId,
      data: { order_status: 'paid' },
    });

    ctx.body = {
      data: {
        documentId,
        order_status: updated.order_status ?? 'paid',
      },
    };
  },
}));

