'use strict';

module.exports = [
  {
    method: 'GET',
    path: '/content-types',
    handler: 'controller.listContentTypes',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/export/:contentType',
    handler: 'controller.exportCsv',
    config: {
      policies: [],
    },
  },
  {
    method: 'POST',
    path: '/export/:contentType',
    handler: 'controller.exportCsv',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/template/:contentType',
    handler: 'controller.templateCsv',
    config: {
      policies: [],
    },
  },
  {
    method: 'POST',
    path: '/import/:contentType',
    handler: 'controller.importCsv',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/summary/orders',
    handler: 'controller.orderSummary',
    config: {
      policies: [],
    },
  },
  {
    method: 'POST',
    path: '/summary/orders',
    handler: 'controller.orderSummary',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/dashboard/inventory',
    handler: 'controller.inventoryDashboard',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/history/inventory',
    handler: 'controller.inventoryHistory',
    config: {
      policies: [],
    },
  },
  {
    method: 'POST',
    path: '/inventory/restock',
    handler: 'controller.restockInventory',
    config: {
      policies: [],
    },
  },
];
