import type { Schema, Struct } from '@strapi/strapi';

export interface HomepageFeatureItem extends Struct.ComponentSchema {
  collectionName: 'components_homepage_feature_items';
  info: {
    description: 'One item in the homepage features bar';
    displayName: 'Feature';
  };
  attributes: {
    description: Schema.Attribute.String & Schema.Attribute.Required;
    icon: Schema.Attribute.String & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface HomepageHeroSlide extends Struct.ComponentSchema {
  collectionName: 'components_homepage_hero_slides';
  info: {
    description: 'One slide in the homepage hero carousel';
    displayName: 'Hero slide';
  };
  attributes: {
    cta: Schema.Attribute.String & Schema.Attribute.Required;
    href: Schema.Attribute.String & Schema.Attribute.Required;
    image: Schema.Attribute.Media<'images'>;
    subtitle: Schema.Attribute.Text;
    tag: Schema.Attribute.String & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface HomepagePromoBanner extends Struct.ComponentSchema {
  collectionName: 'components_homepage_promo_banners';
  info: {
    description: 'Retail or wholesale promo block on the homepage';
    displayName: 'Promo banner';
  };
  attributes: {
    description: Schema.Attribute.Text;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    style: Schema.Attribute.Enumeration<['brand', 'dark']> &
      Schema.Attribute.DefaultTo<'brand'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface OrderOrderItem extends Struct.ComponentSchema {
  collectionName: 'components_order_order_items';
  info: {
    description: 'One product the customer ordered';
    displayName: 'Product in order';
  };
  attributes: {
    bought_as: Schema.Attribute.Enumeration<['one_piece', 'many_pieces']> &
      Schema.Attribute.DefaultTo<'one_piece'>;
    color: Schema.Attribute.String;
    how_many: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    item_code: Schema.Attribute.String;
    price_each: Schema.Attribute.Decimal & Schema.Attribute.Required;
    product_name: Schema.Attribute.String & Schema.Attribute.Required;
    row_total: Schema.Attribute.Decimal & Schema.Attribute.Required;
    size: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'homepage.feature-item': HomepageFeatureItem;
      'homepage.hero-slide': HomepageHeroSlide;
      'homepage.promo-banner': HomepagePromoBanner;
      'order.order-item': OrderOrderItem;
    }
  }
}
