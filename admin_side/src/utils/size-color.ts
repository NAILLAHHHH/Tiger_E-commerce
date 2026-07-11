import type { Core } from '@strapi/strapi';

export type SizeColorRow = {
  id: number;
  item_code?: string | null;
  size?: string | null;
  color?: string | null;
  how_many_left?: number | null;
  photo?: unknown;
  product?: unknown;
  source: 'variant' | 'component';
};

/** Find a size/color row (Size & color collection, or leftover embedded component). */
export async function findSizeColorRow(
  strapi: Core.Strapi,
  line: {
    item_code?: string | null;
    size?: string | null;
    color?: string | null;
  },
  options?: { populatePhoto?: boolean },
): Promise<SizeColorRow | null> {
  const populate = options?.populatePhoto
    ? { photo: true, product: { populate: { photo: true } } }
    : undefined;

  if (line.item_code) {
    const variant = await strapi.db
      .query('api::product-variant.product-variant')
      .findOne({
        where: { item_code: line.item_code },
        populate: populate ?? ['photo', 'product'],
      });
    if (variant) return { ...(variant as SizeColorRow), source: 'variant' };

    try {
      const component = await strapi.db.query('product.size-and-color').findOne({
        where: { item_code: line.item_code },
        populate: options?.populatePhoto ? { photo: true } : undefined,
      });
      if (component) return { ...(component as SizeColorRow), source: 'component' };
    } catch {
      // component table may not exist
    }
  }

  if (line.size && line.color) {
    const variant = await strapi.db
      .query('api::product-variant.product-variant')
      .findOne({
        where: { size: line.size, color: line.color },
        populate: populate ?? ['photo', 'product'],
      });
    if (variant) return { ...(variant as SizeColorRow), source: 'variant' };

    try {
      const component = await strapi.db.query('product.size-and-color').findOne({
        where: { size: line.size, color: line.color },
        populate: options?.populatePhoto ? { photo: true } : undefined,
      });
      if (component) {
        return { ...(component as SizeColorRow), source: 'component' };
      }
    } catch {
      // component table may not exist
    }
  }

  return null;
}

export async function updateSizeColorStock(
  strapi: Core.Strapi,
  row: SizeColorRow,
  howManyLeft: number,
) {
  if (row.source === 'component') {
    await strapi.db.query('product.size-and-color').update({
      where: { id: row.id },
      data: { how_many_left: howManyLeft },
    });
    return;
  }

  await strapi.db.query('api::product-variant.product-variant').update({
    where: { id: row.id },
    data: { how_many_left: howManyLeft },
  });
}
