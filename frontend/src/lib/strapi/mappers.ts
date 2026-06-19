import type { StrapiEntity } from "@/lib/strapi/client";
import type { Category, Product, ProductVariant, WholesaleTier } from "@/types/database";

function entityId(entity: StrapiEntity): string {
  return String(entity.documentId ?? entity.id ?? "");
}

function mapCategory(entity: StrapiEntity): Category {
  return {
    id: entityId(entity),
    name: String(entity.name ?? ""),
    slug: String(entity.slug ?? ""),
    image_url: entity.image_url ? String(entity.image_url) : null,
    sort_order: Number(entity.sort_order ?? 0),
  };
}

function mapVariant(entity: StrapiEntity, productId: string): ProductVariant {
  return {
    id: entityId(entity),
    product_id: productId,
    sku: String(entity.sku ?? ""),
    size: String(entity.size ?? ""),
    color: String(entity.color ?? ""),
    color_hex: entity.color_hex ? String(entity.color_hex) : null,
    stock_quantity: Number(entity.stock_quantity ?? 0),
  };
}

function mapTier(entity: StrapiEntity, productId: string): WholesaleTier {
  return {
    id: entityId(entity),
    product_id: productId,
    min_quantity: Number(entity.min_quantity ?? 0),
    unit_price: Number(entity.unit_price ?? 0),
  };
}

export function mapStrapiProduct(entity: StrapiEntity): Product {
  const productId = entityId(entity);
  const categoryEntity = entity.category as StrapiEntity | null | undefined;
  const variantEntities = (entity.variants as StrapiEntity[] | undefined) ?? [];
  const tierEntities = (entity.wholesale_tiers as StrapiEntity[] | undefined) ?? [];

  const variants = variantEntities.map((v) => mapVariant(v, productId));
  const wholesale_tiers = tierEntities
    .map((t) => mapTier(t, productId))
    .sort((a, b) => a.min_quantity - b.min_quantity);

  const total_stock = variants.reduce((sum, v) => sum + v.stock_quantity, 0);

  const images = Array.isArray(entity.images)
    ? (entity.images as string[])
    : [];

  return {
    id: productId,
    name: String(entity.name ?? ""),
    slug: String(entity.slug ?? ""),
    description: entity.description ? String(entity.description) : null,
    retail_price: Number(entity.retail_price ?? 0),
    bulk_price: entity.bulk_price != null ? Number(entity.bulk_price) : null,
    compare_at_price: entity.compare_at_price
      ? Number(entity.compare_at_price)
      : null,
    category_id: categoryEntity ? entityId(categoryEntity) : null,
    image_url: entity.image_url ? String(entity.image_url) : null,
    images,
    sell_mode: entity.sell_mode as Product["sell_mode"],
    moq_wholesale: Number(entity.moq_wholesale ?? 10),
    is_featured: Boolean(entity.is_featured),
    is_new: Boolean(entity.is_new),
    category: categoryEntity ? mapCategory(categoryEntity) : null,
    variants,
    wholesale_tiers,
    total_stock,
  };
}

export function mapStrapiCategory(entity: StrapiEntity): Category {
  return mapCategory(entity);
}
