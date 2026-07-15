export default {
  routes: [
    {
      method: 'GET',
      path: '/orders/by-reference/:orderReference',
      handler: 'order.findByReference',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
