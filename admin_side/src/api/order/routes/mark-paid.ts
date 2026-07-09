export default {
  routes: [
    {
      method: 'POST',
      path: '/orders/:documentId/mark-paid',
      handler: 'order.markPaid',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
