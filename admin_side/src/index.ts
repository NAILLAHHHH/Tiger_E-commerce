import type { Core } from '@strapi/strapi';
import { seedCategories, seedProducts } from '../data/seed';
import {
  seedFeatures,
  seedHeroSlides,
  seedHomepageScalars,
  seedPromoBanners,
} from '../data/seed-homepage';
import { applyStaffAdminLabels } from './config/apply-staff-labels';
import { repairCatalogFromSeed } from './config/repair-catalog';
import { uploadCatalogImage } from './utils/seed-images';
import { ensureLinkName } from './utils/link-name';
import { syncOrderStock } from './api/order/services/order-stock';
import {
  isStockRelevantUpdate,
  loadOrderByDocumentId,
  sanitizeOrderData,
} from './api/order/content-types/order/lifecycles';

const PUBLIC_ACTIONS = [
  'api::category.category.find',
  'api::category.category.findOne',
  'api::product.product.find',
  'api::product.product.findOne',
  'api::product-variant.product-variant.find',
  'api::product-variant.product-variant.findOne',
  'api::homepage.homepage.find',
  'api::order.order.create',
  'api::order.order.markPaid',
  'api::order.order.findByReference',
];

const ORDER_STATUS_MAP: Record<string, string> = {
  waiting_to_call: 'placed',
  customer_agreed: 'pending',
  payment_received: 'pending',
  delivered: 'completed',
  pending_contact: 'placed',
  confirmed: 'pending',
  paid: 'paid',
  fulfilled: 'completed',
  cancelled: 'cancelled',
  placed: 'placed',
  pending: 'pending',
  completed: 'completed',
};

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
    const categoryPhotoId = await uploadCatalogImage(strapi, cat.photo);
    const created = await strapi.db.query('api::category.category').create({
      data: {
        name: cat.name,
        link_name: cat.link_name,
        photo: categoryPhotoId,
        list_position: cat.list_position,
      },
    });
    categoryMap.set(cat.link_name, created.id);
  }

  for (const product of seedProducts) {
    const categoryId = categoryMap.get(product.category_link_name);
    const productPhotoId = await uploadCatalogImage(strapi, product.photo);

    const createdProduct = await strapi.db.query('api::product.product').create({
      data: {
        name: product.name,
        link_name: product.link_name,
        description: product.description,
        photo: productPhotoId,
        highlight_on_homepage: product.highlight_on_homepage,
        mark_as_new: product.mark_as_new,
        category: categoryId ?? null,
      },
    });

    for (const variant of product.variants) {
      const variantPhotoId = await uploadCatalogImage(
        strapi,
        variant.photo ?? product.photo,
      );
      const colorPhotoIds = variant.color_photos
        ? (
            await Promise.all(
              variant.color_photos.map((imagePath) =>
                uploadCatalogImage(strapi, imagePath),
              ),
            )
          ).filter((id): id is number => id != null)
        : [];

      await strapi.db.query('api::product-variant.product-variant').create({
        data: {
          item_code: variant.item_code,
          size: variant.size,
          color: variant.color,
          color_dot: variant.color_dot ?? null,
          photo: variantPhotoId,
          color_photos: colorPhotoIds.length ? colorPhotoIds : undefined,
          price_for_one: variant.price_for_one,
          price_for_bulk: variant.price_for_bulk ?? null,
          min_quantity_for_bulk: variant.min_quantity_for_bulk ?? 10,
          how_many_left: variant.how_many_left,
          product: createdProduct.id,
        },
      });
    }
  }

  strapi.log.info('TigerWear seed catalog created');
}

async function seedHomepageContent(strapi: Core.Strapi) {
  const existing = await strapi.documents('api::homepage.homepage').findFirst();
  if (existing) return;

  const hero_slides = [];
  for (const slide of seedHeroSlides) {
    const imageId = await uploadCatalogImage(strapi, slide.image);
    hero_slides.push({
      tag: slide.tag,
      title: slide.title,
      subtitle: slide.subtitle,
      cta: slide.cta,
      href: slide.href,
      image: imageId,
    });
  }

  await strapi.documents('api::homepage.homepage').create({
    data: {
      ...seedHomepageScalars,
      hero_slides,
      features: seedFeatures,
      promo_banners: seedPromoBanners,
    },
  });

  strapi.log.info('TigerWear storefront homepage created');
}

/** Copy old technical field names into new human-friendly ones */
async function migrateToHumanFields(strapi: Core.Strapi) {
  const categories = await strapi.db.query('api::category.category').findMany({ limit: 100 });
  for (const category of categories) {
    const updates: Record<string, unknown> = {};
    if (category.link_name == null && category.slug != null) updates.link_name = category.slug;
    if (category.list_position == null && category.sort_order != null) {
      updates.list_position = category.sort_order;
    }
    if (Object.keys(updates).length > 0) {
      await strapi.db.query('api::category.category').update({
        where: { id: category.id },
        data: updates,
      });
    }
  }

  const products = await strapi.db.query('api::product.product').findMany({ limit: 500 });
  for (const product of products) {
    const updates: Record<string, unknown> = {};
    if (product.link_name == null && product.slug != null) updates.link_name = product.slug;
    if (product.highlight_on_homepage == null && product.show_on_homepage != null) {
      updates.highlight_on_homepage = product.show_on_homepage;
    }
    if (product.highlight_on_homepage == null && product.is_featured != null) {
      updates.highlight_on_homepage = product.is_featured;
    }
    if (product.mark_as_new == null && product.is_new_arrival != null) {
      updates.mark_as_new = product.is_new_arrival;
    }
    if (product.mark_as_new == null && product.is_new != null) {
      updates.mark_as_new = product.is_new;
    }
    if (Object.keys(updates).length > 0) {
      await strapi.db.query('api::product.product').update({
        where: { id: product.id },
        data: updates,
      });
    }
  }

  const variants = await strapi.db.query('api::product-variant.product-variant').findMany({
    populate: { product: true },
    limit: 500,
  });

  for (const variant of variants) {
    const product = variant.product as Record<string, unknown> | null;
    const updates: Record<string, unknown> = {};

    if (variant.item_code == null && variant.sku != null) updates.item_code = variant.sku;
    if (variant.price_for_one == null && variant.per_piece_price != null) {
      updates.price_for_one = variant.per_piece_price;
    }
    if (variant.price_for_one == null && product?.retail_price != null) {
      updates.price_for_one = product.retail_price;
    }
    if (variant.price_for_bulk == null && variant.bulk_price != null) {
      updates.price_for_bulk = variant.bulk_price;
    }
    if (variant.price_for_bulk == null && product?.bulk_price != null) {
      updates.price_for_bulk = product.bulk_price;
    }
    if (variant.min_quantity_for_bulk == null && variant.bulk_minimum != null) {
      updates.min_quantity_for_bulk = variant.bulk_minimum;
    }
    if (variant.min_quantity_for_bulk == null && product?.moq_wholesale != null) {
      updates.min_quantity_for_bulk = product.moq_wholesale;
    }
    if (variant.how_many_left == null && variant.stock_count != null) {
      updates.how_many_left = variant.stock_count;
    }
    if (variant.how_many_left == null && variant.stock_quantity != null) {
      updates.how_many_left = variant.stock_quantity;
    }
    if (variant.color_dot == null && variant.color_swatch != null) {
      updates.color_dot = variant.color_swatch;
    }
    if (variant.color_dot == null && variant.color_hex != null) {
      updates.color_dot = variant.color_hex;
    }

    if (Object.keys(updates).length > 0) {
      await strapi.db.query('api::product-variant.product-variant').update({
        where: { id: variant.id },
        data: updates,
      });
    }
  }

  const orders = await strapi.db.query('api::order.order').findMany({ limit: 500 });
  for (const order of orders) {
    const updates: Record<string, unknown> = {};
    if (order.order_reference == null && order.order_number != null) {
      updates.order_reference = order.order_number;
    }

    const items = order.what_they_ordered as { bought_as?: string }[] | null;
    if (items?.length) {
      let changed = false;
      const migratedItems = items.map((item) => {
        if (item.bought_as === 'bulk') {
          changed = true;
          return { ...item, bought_as: 'many_pieces' };
        }
        return item;
      });
      if (changed) updates.what_they_ordered = migratedItems;
    }

    if (Object.keys(updates).length > 0) {
      await strapi.db.query('api::order.order').update({
        where: { id: order.id },
        data: updates,
      });
    }
  }
}

/** Map legacy status column → order_status (status is reserved in Strapi 5). */
async function migrateOrderStatuses(strapi: Core.Strapi) {
  const valid = new Set(['placed', 'pending', 'completed', 'cancelled']);
  const orders = await strapi.db.query('api::order.order').findMany({ limit: 500 });

  for (const order of orders) {
    const updates: Record<string, unknown> = {};
    const legacyStatus =
      (order.order_status as string | undefined) ??
      (order.status as string | undefined);

    if (legacyStatus && ORDER_STATUS_MAP[legacyStatus]) {
      updates.order_status = ORDER_STATUS_MAP[legacyStatus];
    } else if (legacyStatus && !valid.has(legacyStatus)) {
      updates.order_status = 'placed';
    } else if (!order.order_status && legacyStatus && valid.has(legacyStatus)) {
      updates.order_status = legacyStatus;
    }

    if (order.stock_deducted == null) {
      updates.stock_deducted = false;
    }

    if (Object.keys(updates).length > 0) {
      await strapi.db.query('api::order.order').update({
        where: { id: order.id },
        data: updates,
      });
    }
  }
}

/** If products only had embedded size/color components, copy them into Size & color entries. */
async function migrateEmbeddedSizeColorsToCollection(strapi: Core.Strapi) {
  const mediaId = (value: unknown): number | null => {
    if (value == null) return null;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
    if (typeof value === 'object' && value !== null && 'id' in value) {
      return mediaId((value as { id: unknown }).id);
    }
    return null;
  };

  let componentCount = 0;
  try {
    componentCount = await strapi.db.query('product.size-and-color').count();
  } catch {
    return;
  }
  if (componentCount === 0) return;

  const hasJoinTable = await strapi.db.connection.schema.hasTable('products_cmps');
  if (!hasJoinTable) return;

  let links: Array<{ cmp_id: number; entity_id: number }> = [];
  try {
    links = await strapi.db.connection('products_cmps').where({
      component_type: 'product.size-and-color',
      field: 'sizes_and_colors',
    });
  } catch {
    return;
  }

  if (!links?.length) return;

  let migrated = 0;

  for (const link of links) {
    try {
      const component = await strapi.db.query('product.size-and-color').findOne({
        where: { id: link.cmp_id },
        populate: { photo: true, color_photos: true },
      });
      if (!component?.item_code) continue;

      const existing = await strapi.db
        .query('api::product-variant.product-variant')
        .findOne({ where: { item_code: component.item_code } });
      if (existing) continue;

      const photo = mediaId(component.photo);
      const colorPhotos = Array.isArray(component.color_photos)
        ? component.color_photos
            .map((file: unknown) => mediaId(file))
            .filter((id): id is number => id != null)
        : [];

      await strapi.db.query('api::product-variant.product-variant').create({
        data: {
          item_code: component.item_code,
          size: component.size,
          color: component.color,
          color_dot: component.color_dot ?? null,
          photo: photo ?? undefined,
          color_photos: colorPhotos.length ? colorPhotos : undefined,
          price_for_one: component.price_for_one,
          price_for_bulk: component.price_for_bulk ?? null,
          min_quantity_for_bulk: component.min_quantity_for_bulk ?? 10,
          how_many_left: component.how_many_left ?? 0,
          product: link.entity_id,
        },
      });
      migrated += 1;
    } catch (error) {
      strapi.log.warn(
        `Could not migrate component size/color ${link.cmp_id}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  if (migrated > 0) {
    strapi.log.info(
      `Migrated ${migrated} embedded size/color row(s) into Size & color entries`,
    );
  }
}

function hasMediaPhoto(value: unknown): boolean {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

/** Upload pictures for categories/products/variants that only have legacy path fields. */
async function attachMissingPhotos(strapi: Core.Strapi) {
  const categories = await strapi.db.query('api::category.category').findMany({
    populate: { photo: true },
    limit: 100,
  });

  for (const category of categories) {
    if (hasMediaPhoto(category.photo)) continue;

    const seed = seedCategories.find((c) => c.name === category.name);
    const legacyPath =
      (typeof category.photo === 'string' ? category.photo : null) ??
      (typeof category.image === 'string' ? category.image : null) ??
      (typeof category.image_url === 'string' ? category.image_url : null) ??
      seed?.photo ??
      null;

    if (legacyPath) {
      const fileId = await uploadCatalogImage(strapi, legacyPath);
      if (fileId) {
        await strapi.db.query('api::category.category').update({
          where: { id: category.id },
          data: { photo: fileId },
        });
      }
    }
  }

  const products = await strapi.db.query('api::product.product').findMany({
    populate: { photo: true, sizes_and_colors: { populate: { photo: true } } },
    limit: 500,
  });

  for (const product of products) {
    const legacyPath =
      (typeof product.photo === 'string' ? product.photo : null) ??
      product.main_image ??
      product.image_url ??
      null;

    if (!hasMediaPhoto(product.photo) && legacyPath && typeof legacyPath === 'string') {
      const fileId = await uploadCatalogImage(strapi, legacyPath);
      if (fileId) {
        await strapi.db.query('api::product.product').update({
          where: { id: product.id },
          data: { photo: fileId },
        });
      }
    }

    const variants =
      (product.sizes_and_colors as Record<string, unknown>[] | undefined) ?? [];

    for (const variant of variants) {
      if (hasMediaPhoto(variant.photo) || !variant.id) continue;

      const variantPath =
        (typeof variant.photo === 'string' ? variant.photo : null) ?? legacyPath;

      if (variantPath && typeof variantPath === 'string') {
        const fileId = await uploadCatalogImage(strapi, variantPath);
        if (fileId) {
          await strapi.db.query('api::product-variant.product-variant').update({
            where: { id: variant.id },
            data: { photo: fileId },
          });
        }
      }
    }
  }
}

/** Auto-fill hidden website links so staff create does not fail validation. */
function registerCatalogDocumentMiddleware(strapi: Core.Strapi) {
  strapi.documents.use(async (ctx, next) => {
    if (
      (ctx.uid === 'api::category.category' || ctx.uid === 'api::product.product') &&
      (ctx.action === 'create' || ctx.action === 'update')
    ) {
      const params = ctx.params as { data?: Record<string, unknown> };
      ensureLinkName(params.data);
    }
    return next();
  });
}

/** Strip reserved `status` and sync stock after order create/update. */
function registerOrderDocumentMiddleware(strapi: Core.Strapi) {
  strapi.documents.use(async (ctx, next) => {
    if (ctx.uid !== 'api::order.order') {
      return next();
    }

    const params = ctx.params as {
      data?: Record<string, unknown>;
      documentId?: string;
    };

    if (params.data) {
      sanitizeOrderData(params.data);
    }

    const previous =
      ctx.action === 'update' &&
      params.data &&
      isStockRelevantUpdate(params.data) &&
      params.documentId
        ? await loadOrderByDocumentId(params.documentId)
        : null;

    const result = await next();

    if (ctx.action !== 'create' && ctx.action !== 'update') {
      return result;
    }

    if (ctx.action === 'update' && params.data && !isStockRelevantUpdate(params.data)) {
      return result;
    }

    const orderId = (result as { id?: number } | undefined)?.id;
    if (!orderId) return result;

    const order = await strapi.db.query('api::order.order').findOne({
      where: { id: orderId },
      populate: { what_they_ordered: true },
    });

    if (!order) return result;

    const stockPatch = await syncOrderStock(strapi, previous, order);
    if (stockPatch) {
      await strapi.db.query('api::order.order').update({
        where: { id: orderId },
        data: stockPatch,
      });
    }

    return result;
  });
}

export default {
  register({ strapi }: { strapi: Core.Strapi }) {
    registerCatalogDocumentMiddleware(strapi);
    registerOrderDocumentMiddleware(strapi);
  },

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await setPublicPermissions(strapi);

    if (process.env.SEED_DATA !== 'false') {
      await seedCatalog(strapi);
      await seedHomepageContent(strapi);
    }

    await migrateToHumanFields(strapi);
    await migrateOrderStatuses(strapi);
    await migrateEmbeddedSizeColorsToCollection(strapi);
    await repairCatalogFromSeed(strapi);
    await attachMissingPhotos(strapi);
    await applyStaffAdminLabels(strapi);
  },
};
