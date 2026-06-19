import type { Schema, Struct } from '@strapi/strapi';

export interface OrderOrderItem extends Struct.ComponentSchema {
  collectionName: 'components_order_order_items';
  info: {
    description: 'Line item snapshot at checkout';
    displayName: 'Order Item';
  };
  attributes: {
    color: Schema.Attribute.String;
    line_total: Schema.Attribute.Decimal & Schema.Attribute.Required;
    pricing_mode: Schema.Attribute.Enumeration<['retail', 'wholesale']> &
      Schema.Attribute.DefaultTo<'retail'>;
    product_id: Schema.Attribute.String;
    product_name: Schema.Attribute.String & Schema.Attribute.Required;
    product_slug: Schema.Attribute.String;
    quantity: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    size: Schema.Attribute.String;
    sku: Schema.Attribute.String;
    unit_price: Schema.Attribute.Decimal & Schema.Attribute.Required;
    variant_id: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'order.order-item': OrderOrderItem;
    }
  }
}
