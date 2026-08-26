import type {
  AttributeValue,
  Attribute,
  Category,
  Product,
  ProductVariant,
  Review,
} from "@prisma/client";

type VariantWithOptions = ProductVariant & {
  optionValues: Array<{
    attributeValue: AttributeValue & { attribute: Attribute };
  }>;
};

type KindRef = { id: string; name: string; code: string };

type ProductWithRelations = Product & {
  category:
    | (Category & { attributeSet?: KindRef | null })
    | null;
  attributeSet: KindRef | null;
  variants: VariantWithOptions[];
};

function mapKind(set: KindRef | null | undefined) {
  if (!set) return null;
  return { id: set.id, name: set.name, code: set.code };
}

export function mapCategory(
  c: Category & { attributeSet?: KindRef | null },
) {
  return {
    id: c.id,
    name: c.name,
    slug: c.linkName,
    image_url: c.photoUrl,
    sort_order: c.listPosition,
    attribute_set: mapKind(c.attributeSet),
  };
}

export function mapVariant(v: VariantWithOptions, productId: string) {
  const options = [...v.optionValues]
    .map((ov) => ({
      code: ov.attributeValue.attribute.code,
      name: ov.attributeValue.attribute.name,
      value: ov.attributeValue.label,
      value_code: ov.attributeValue.code,
      meta: (ov.attributeValue.meta as { hex?: string } | null) ?? null,
      display_type: ov.attributeValue.attribute.displayType,
      list_position: ov.attributeValue.attribute.listPosition,
    }))
    .sort((a, b) => a.list_position - b.list_position);

  const size =
    options.find((o) => o.code === "size")?.value ?? v.size ?? "";
  const color =
    options.find((o) => o.code === "color")?.value ?? v.color ?? "";
  const colorHex =
    options.find((o) => o.code === "color")?.meta?.hex ?? v.colorDot ?? null;

  return {
    id: v.id,
    product_id: productId,
    sku: v.itemCode,
    options,
    size,
    color,
    color_hex: colorHex,
    image_url: v.photoUrl,
    color_images: v.extraPhotoUrls?.length ? v.extraPhotoUrls : undefined,
    per_piece_price: v.priceForOne,
    bulk_price: v.priceForBulk,
    bulk_minimum: v.minQuantityForBulk,
    stock_quantity: v.howManyLeft,
  };
}

export function mapProduct(p: ProductWithRelations) {
  const variants = p.variants.map((v) => mapVariant(v, p.id));
  return {
    id: p.id,
    name: p.name,
    slug: p.linkName,
    description: p.description,
    image_url: p.photoUrl,
    video_url: p.videoUrl,
    is_featured: p.highlightOnHomepage,
    is_new: p.markAsNew,
    published: p.published,
    category_id: p.categoryId,
    attribute_set_id: p.attributeSetId ?? p.category?.attributeSet?.id ?? null,
    category: p.category ? mapCategory(p.category) : null,
    attribute_set: mapKind(p.attributeSet ?? p.category?.attributeSet),
    variants,
    total_stock: variants.reduce((sum, v) => sum + v.stock_quantity, 0),
  };
}

export function mapReview(r: Review & { productId: string }) {
  return {
    id: r.id,
    product_id: r.productId,
    customer_name: r.customerName,
    stars: r.stars,
    title: r.title,
    comment: r.comment,
    created_at: r.createdAt.toISOString(),
  };
}

export const variantInclude = {
  optionValues: {
    include: { attributeValue: { include: { attribute: true } } },
  },
} as const;

export const productInclude = {
  category: { include: { attributeSet: true } },
  attributeSet: true,
  variants: { include: variantInclude },
} as const;
