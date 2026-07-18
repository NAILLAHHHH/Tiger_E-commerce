'use strict';

const CONTENT_TYPES = {
  categories: {
    key: 'categories',
    label: 'Categories',
    description: 'Shop sections such as T-Shirts and Hoodies',
    exportHeaders: ['name', 'link_name', 'list_position'],
    templateHeaders: ['name', 'list_position'],
    templateExample: {
      name: 'T-Shirts',
      list_position: '1',
    },
  },
  products: {
    key: 'products',
    label: 'Products',
    description:
      'Catalog items only (name, category, flags). Add sizes & colors via the Size & color template.',
    exportHeaders: [
      'name',
      'link_name',
      'description',
      'highlight_on_homepage',
      'mark_as_new',
      'category_name',
    ],
    templateHeaders: [
      'name',
      'description',
      'highlight_on_homepage',
      'mark_as_new',
      'category_name',
    ],
    templateExample: {
      name: 'Classic Tiger Tee',
      description: 'Soft cotton tee with Tiger Wear logo',
      highlight_on_homepage: 'false',
      mark_as_new: 'true',
      category_name: 'T-Shirts',
    },
  },
  'product-variants': {
    key: 'product-variants',
    label: 'Size & color',
    description:
      'One row per size/color — set product_name to an existing product (create products first)',
    exportHeaders: [
      'item_code',
      'size',
      'color',
      'color_dot',
      'price_for_one',
      'price_for_bulk',
      'min_quantity_for_bulk',
      'how_many_left',
      'product_name',
    ],
    templateHeaders: [
      'item_code',
      'size',
      'color',
      'color_dot',
      'price_for_one',
      'price_for_bulk',
      'min_quantity_for_bulk',
      'how_many_left',
      'product_name',
    ],
    templateExample: {
      item_code: 'Tiger-Tee-M-Black',
      size: 'M',
      color: 'Black',
      color_dot: '#000000',
      price_for_one: '15000',
      price_for_bulk: '12000',
      min_quantity_for_bulk: '10',
      how_many_left: '25',
      product_name: 'Classic Tiger Tee',
    },
  },
  orders: {
    key: 'orders',
    label: 'Orders',
    description:
      'One row per product line. Rows with the same order_group become one order.',
    exportHeaders: [
      'order_reference',
      'customer_name',
      'phone',
      'delivery_address',
      'customer_notes',
      'order_status',
      'subtotal',
      'total',
      'product_name',
      'size',
      'color',
      'item_code',
      'how_many',
      'price_each',
      'bought_as',
      'row_total',
      'image_url',
      'created_at',
    ],
    templateHeaders: [
      'order_group',
      'customer_name',
      'phone',
      'delivery_address',
      'customer_notes',
      'order_status',
      'subtotal',
      'total',
      'product_name',
      'size',
      'color',
      'item_code',
      'how_many',
      'price_each',
      'bought_as',
      'row_total',
      'image_url',
    ],
    templateExample: {
      order_group: '1',
      customer_name: 'Jean Mukamana',
      phone: '+250788123456',
      delivery_address: 'Kigali, Nyarutarama',
      customer_notes: 'Call before delivery',
      order_status: 'placed',
      subtotal: '30000',
      total: '30000',
      product_name: 'Classic Tiger Tee',
      size: 'M',
      color: 'Black',
      item_code: 'Tiger-Tee-M-Black',
      how_many: '2',
      price_each: '15000',
      bought_as: 'many_pieces',
      row_total: '30000',
      image_url: '',
    },
  },
};

function isContentTypeKey(value) {
  return Object.prototype.hasOwnProperty.call(CONTENT_TYPES, value);
}

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

module.exports = {
  CONTENT_TYPES,
  isContentTypeKey,
  roundMoney,
};
