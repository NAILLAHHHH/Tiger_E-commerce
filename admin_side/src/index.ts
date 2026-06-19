import type { Core } from '@strapi/strapi';
import { seedCategories, seedProducts } from '../data/seed';

const PUBLIC_ACTIONS = [
  'api::category.category.find',
  'api::category.category.findOne',
  'api::product.product.find',
  'api::product.product.findOne',
  'api::product-variant.product-variant.find',
  'api::product-variant.product-variant.findOne',
  'api::wholesale-tier.wholesale-tier.find',
  'api::wholesale-tier.wholesale-tier.findOne',
  'api::order.order.create',
];

async function setPublicPermissions(strapi: Core.Strapi) {
  const publicRole = await strapi.db
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } });

  if (!publicRole) return;

  for (const action of PUBLIC_ACTIONS) {
    const existing = await strapi.db
      .query('plugin::users-permissions.permission')
      .findOne({ where: { action, role: publicRole.id } });

    if (existing) {
      if (!existing.enabled) {
        await strapi.db
          .query('plugin::users-permissions.permission')
          .update({ where: { id: existing.id }, data: { enabled: true } });
      }
      continue;
    }

    await strapi.db.query('plugin::users-permissions.permission').create({
      data: { action, role: publicRole.id, enabled: true },
    });
  }
}

async function seedCatalog(strapi: Core.Strapi) {
  const categoryCount = await strapi.db.query('api::category.category').count();
  if (categoryCount > 0) return;

  const categoryMap = new Map<string, number>();

  for (const cat of seedCategories) {
    const created = await strapi.db.query('api::category.category').create({
      data: {
        name: cat.name,
        slug: cat.slug,
        image_url: cat.image_url,
        sort_order: cat.sort_order,
      },
    });
    categoryMap.set(cat.slug, created.id);
  }

  for (const product of seedProducts) {
    const categoryId = categoryMap.get(product.category_slug);
    const createdProduct = await strapi.db.query('api::product.product').create({
      data: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        retail_price: product.retail_price,
        bulk_price: product.bulk_price ?? product.wholesale_tiers?.[0]?.unit_price ?? null,
        compare_at_price: product.compare_at_price ?? null,
        sell_mode: product.sell_mode,
        moq_wholesale: product.moq_wholesale,
        is_featured: product.is_featured,
        is_new: product.is_new,
        image_url: product.image_url,
        images: [],
        category: categoryId ?? null,
      },
    });

    for (const variant of product.variants) {
      await strapi.db.query('api::product-variant.product-variant').create({
        data: {
          ...variant,
          product: createdProduct.id,
        },
      });
    }

    for (const tier of product.wholesale_tiers ?? []) {
      await strapi.db.query('api::wholesale-tier.wholesale-tier').create({
        data: {
          min_quantity: tier.min_quantity,
          unit_price: tier.unit_price,
          product: createdProduct.id,
        },
      });
    }
  }

  strapi.log.info('TigerWear seed catalog created');
}

/** Backfill bulk_price from first wholesale tier for products created before bulk_price existed */
async function backfillBulkPrice(strapi: Core.Strapi) {
  const products = await strapi.db.query('api::product.product').findMany({
    populate: { wholesale_tiers: true },
  });

  for (const product of products) {
    if (product.bulk_price != null) continue;

    const tiers = (product.wholesale_tiers as { min_quantity: number; unit_price: number }[]) ?? [];
    if (!tiers.length) continue;

    const first = [...tiers].sort((a, b) => a.min_quantity - b.min_quantity)[0];
    await strapi.db.query('api::product.product').update({
      where: { id: product.id },
      data: { bulk_price: first.unit_price },
    });
  }
}

export default {
  register() {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await setPublicPermissions(strapi);

    if (process.env.SEED_DATA !== 'false') {
      await seedCatalog(strapi);
    }

    await backfillBulkPrice(strapi);
  },
};
