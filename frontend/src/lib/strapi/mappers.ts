import { getStrapiUrl } from "@/lib/config";
import {
  fallbackCategoryImage,
  fallbackProductImage,
} from "@/lib/catalog-fallbacks";
import { roundMoney } from "@/lib/pricing";
import type { StrapiEntity } from "@/lib/strapi/client";
import type { Category, Product, ProductVariant } from "@/types/database";

function entityId(entity: StrapiEntity): string {
  return String(entity.documentId ?? entity.id ?? "");
}

export function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function readSlug(entity: StrapiEntity): string {
  const linkName = entity.link_name ?? entity.slug;
  if (linkName != null && String(linkName).trim()) return String(linkName);
  const name = entity.name ? String(entity.name) : "";
  return name ? slugifyName(name) : "";
}

/** Strapi media object, legacy path string, or full URL → storefront image URL. */
export function resolveStrapiImage(value: unknown): string | null {
  if (!value) return null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    if (trimmed.startsWith("/uploads/")) {
      return `${getStrapiUrl().replace(/\/$/, "")}${trimmed}`;
    }
    return trimmed;
  }

  if (typeof value === "object" && value !== null) {
    const media = value as { url?: string };
    return resolveStrapiImage(media.url ?? null);
  }

  return null;
}

/** Strapi media list → URL array. */
export function resolveStrapiMediaList(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => resolveStrapiImage(item))
      .filter((url): url is string => Boolean(url));
  }
  const single = resolveStrapiImage(value);
  return single ? [single] : [];
}

function mapCategory(entity: StrapiEntity): Category {
  const slug = readSlug(entity);
  const image =
    resolveStrapiImage(entity.photo ?? entity.image ?? entity.image_url) ??
    fallbackCategoryImage(slug);

  return {
    id: entityId(entity),
    name: String(entity.name ?? ""),
    slug,
    image_url: image,
    sort_order: Number(entity.list_position ?? entity.sort_order ?? 0),
  };
}

function mapVariant(entity: StrapiEntity, productId: string): ProductVariant {
  const perPiece =
    entity.price_for_one ??
    entity.per_piece_price ??
    entity.retail_price ??
    0;
  const bulkPrice =
    entity.price_for_bulk ?? entity.bulk_price ?? null;
  const stock =
    entity.how_many_left ??
    entity.stock_count ??
    entity.stock_quantity ??
    0;
  const colorHex =
    entity.color_dot ??
    entity.color_swatch ??
    entity.color_hex ??
    null;
  const itemCode = entity.item_code ?? entity.sku ?? "";
  const image = resolveStrapiImage(entity.photo ?? entity.image_url ?? null);
  const colorImages = resolveStrapiMediaList(
    entity.color_photos ?? entity.extra_photos ?? null,
  );

  return {
    id: entityId(entity),
    product_id: productId,
    sku: String(itemCode),
    size: String(entity.size ?? ""),
    color: String(entity.color ?? ""),
    color_hex: colorHex ? String(colorHex) : null,
    image_url: image,
    color_images: colorImages.length ? colorImages : undefined,
    per_piece_price: roundMoney(Number(perPiece)),
    bulk_price: bulkPrice != null ? roundMoney(Number(bulkPrice)) : null,
    bulk_minimum: Number(
      entity.min_quantity_for_bulk ??
        entity.bulk_minimum ??
        entity.moq_wholesale ??
        10,
    ),
    stock_quantity: Number(stock),
  };
}

export function mapStrapiProduct(entity: StrapiEntity): Product {
  const productId = entityId(entity);
  const categoryEntity = entity.category as StrapiEntity | null | undefined;
  const variantEntities =
    (entity.sizes_and_colors as StrapiEntity[] | undefined) ??
    (entity.size_color_options as StrapiEntity[] | undefined) ??
    (entity.variants as StrapiEntity[] | undefined) ??
    [];

  const variants = variantEntities.map((v) => mapVariant(v, productId));
  const total_stock = variants.reduce((sum, v) => sum + v.stock_quantity, 0);

  const mainImage =
    resolveStrapiImage(
      entity.photo ?? entity.main_image ?? entity.image_url ?? null,
    ) ?? fallbackProductImage(readSlug(entity));

  const videoUrl = resolveStrapiImage(entity.video ?? entity.video_url ?? null);

  return {
    id: productId,
    name: String(entity.name ?? ""),
    slug: readSlug(entity),
    description: entity.description ? String(entity.description) : null,
    image_url: mainImage,
    video_url: videoUrl,
    is_featured: Boolean(
      entity.highlight_on_homepage ??
        entity.show_on_homepage ??
        entity.is_featured ??
        false,
    ),
    is_new: Boolean(
      entity.mark_as_new ?? entity.is_new_arrival ?? entity.is_new ?? false,
    ),
    category_id: categoryEntity ? entityId(categoryEntity) : null,
    category: categoryEntity ? mapCategory(categoryEntity) : null,
    variants,
    total_stock,
  };
}

export function mapStrapiCategory(entity: StrapiEntity): Category {
  return mapCategory(entity);
}

export function variantDisplayImage(
  variant: ProductVariant | undefined,
  product: Product,
): string | null {
  return variant?.image_url ?? product.image_url ?? null;
}
