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
    image_url: Schema.Attribute.Text;
    item_code: Schema.Attribute.String;
    price_each: Schema.Attribute.Decimal & Schema.Attribute.Required;
    product_name: Schema.Attribute.String & Schema.Attribute.Required;
    row_total: Schema.Attribute.Decimal & Schema.Attribute.Required;
    size: Schema.Attribute.String;
  };
}

export interface ProductSizeAndColor extends Struct.ComponentSchema {
  collectionName: 'components_product_size_and_colors';
  info: {
    description: 'One size and color with price and how many you have left';
    displayName: 'Size & color';
  };
  attributes: {
    color: Schema.Attribute.String & Schema.Attribute.Required;
    color_dot: Schema.Attribute.String;
    color_photos: Schema.Attribute.Media<'images', true>;
    how_many_left: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    item_code: Schema.Attribute.String & Schema.Attribute.Required;
    min_quantity_for_bulk: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<10>;
    photo: Schema.Attribute.Media<'images'>;
    price_for_bulk: Schema.Attribute.Decimal;
    price_for_one: Schema.Attribute.Decimal & Schema.Attribute.Required;
    size: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'homepage.feature-item': HomepageFeatureItem;
      'homepage.hero-slide': HomepageHeroSlide;
      'homepage.promo-banner': HomepagePromoBanner;
      'order.order-item': OrderOrderItem;
      'product.size-and-color': ProductSizeAndColor;
    }
  }
}
