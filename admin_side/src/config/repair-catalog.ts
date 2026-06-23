import type { Core } from '@strapi/strapi';
import { seedCategories, seedProducts } from '../../data/seed';
import { uploadCatalogImage } from '../utils/seed-images';

function isBlank(value: unknown): boolean {
  return value == null || value === '';
}

/** Fill missing prices, slugs, and pictures on an existing catalog (after schema renames). */
export async function repairCatalogFromSeed(strapi: Core.Strapi) {
  const categoryMap = new Map<string, number>();
  let repaired = false;

  for (const cat of seedCategories) {
    const row = await strapi.db.query('api::category.category').findOne({
      where: { name: cat.name },
    });
    if (!row) continue;

    categoryMap.set(cat.link_name, row.id);

    const updates: Record<string, unknown> = {};
    if (isBlank(row.link_name)) updates.link_name = cat.link_name;
    if (row.list_position == null) updates.list_position = cat.list_position;
    if (isBlank(row.photo)) updates.photo = cat.photo;

    if (Object.keys(updates).length > 0) {
      await strapi.db.query('api::category.category').update({
        where: { id: row.id },
        data: updates,
      });
      repaired = true;
    }
  }

  for (const seed of seedProducts) {
    const row = await strapi.db.query('api::product.product').findOne({
      where: { name: seed.name },
      populate: { sizes_and_colors: true, category: true, photo: true },
    });
    if (!row) continue;

    const updates: Record<string, unknown> = {};
    if (isBlank(row.link_name)) updates.link_name = seed.link_name;
    if (isBlank(row.description)) updates.description = seed.description;
    if (row.highlight_on_homepage == null) {
      updates.highlight_on_homepage = seed.highlight_on_homepage;
    }
    if (row.mark_as_new == null) updates.mark_as_new = seed.mark_as_new;

    const categoryId = categoryMap.get(seed.category_link_name);
    if (categoryId && row.category == null) updates.category = categoryId;

    const hasPhoto =
      row.photo != null &&
      typeof row.photo === 'object' &&
      !Array.isArray(row.photo);

    if (!hasPhoto) {
      const photoId = await uploadCatalogImage(strapi, seed.photo);
      if (photoId) updates.photo = photoId;
    }

    if (Object.keys(updates).length > 0) {
      await strapi.db.query('api::product.product').update({
        where: { id: row.id },
        data: updates,
      });
      repaired = true;
    }

    const variants = (row.sizes_and_colors as Record<string, unknown>[]) ?? [];

    for (const seedVariant of seed.variants) {
      const variant = variants.find(
        (v) => v.size === seedVariant.size && v.color === seedVariant.color,
      );
      if (!variant) continue;

      const variantUpdates: Record<string, unknown> = {};
      if (isBlank(variant.item_code)) variantUpdates.item_code = seedVariant.item_code;
      if (variant.price_for_one == null) {
        variantUpdates.price_for_one = seedVariant.price_for_one;
      }
      if (variant.price_for_bulk == null && seedVariant.price_for_bulk != null) {
        variantUpdates.price_for_bulk = seedVariant.price_for_bulk;
      }
      if (variant.min_quantity_for_bulk == null) {
        variantUpdates.min_quantity_for_bulk = seedVariant.min_quantity_for_bulk ?? 10;
      }
      if (variant.how_many_left == null) {
        variantUpdates.how_many_left = seedVariant.how_many_left;
      }
      if (isBlank(variant.color_dot) && seedVariant.color_dot) {
        variantUpdates.color_dot = seedVariant.color_dot;
      }

      const hasVariantPhoto =
        variant.photo != null &&
        typeof variant.photo === 'object' &&
        !Array.isArray(variant.photo);

      if (!hasVariantPhoto) {
        const photoId = await uploadCatalogImage(
          strapi,
          seedVariant.photo ?? seed.photo,
        );
        if (photoId) variantUpdates.photo = photoId;
      }

      if (Object.keys(variantUpdates).length > 0) {
        await strapi.db.query('api::product-variant.product-variant').update({
          where: { id: variant.id },
          data: variantUpdates,
        });
        repaired = true;
      }
    }
  }

  if (repaired) {
    strapi.log.info('Catalog repaired from seed (prices, links, pictures)');
  }
}
