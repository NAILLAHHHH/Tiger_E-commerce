import type {
  ColorOption,
  GalleryItem,
  Product,
  ProductVariant,
} from "@/types/database";
import {
  getProductOptionAxes,
  optionValue,
} from "@/lib/variant-options";

function productPhotoUrls(product: Product): string[] {
  return uniqueUrls([product.image_url, ...(product.images ?? [])]);
}

function variantPhotoUrls(variant: ProductVariant): string[] {
  return uniqueUrls([variant.image_url, ...(variant.color_images ?? [])]);
}

function productVideoUrls(product: Product): string[] {
  return uniqueUrls([product.video_url, ...(product.videos ?? [])]);
}

function variantVideoUrls(variant: ProductVariant): string[] {
  return uniqueUrls([variant.video_url, ...(variant.videos ?? [])]);
}

function insertVideos(
  items: GalleryItem[],
  urls: (string | null | undefined)[],
  meta?: Pick<GalleryItem, "color" | "option_code" | "option_value">,
) {
  const videos = uniqueUrls(urls).filter(
    (url) => !items.some((item) => item.url === url),
  );
  if (!videos.length) return;
  const insertAt = Math.min(1, items.length);
  items.splice(
    insertAt,
    0,
    ...videos.map((url) => ({
      type: "video" as const,
      url,
      ...meta,
    })),
  );
}

function uniqueUrls(urls: (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const url of urls) {
    if (url && !seen.has(url)) {
      seen.add(url);
      result.push(url);
    }
  }
  return result;
}

/** Swatch axis code if the product has color-like options. */
export function getSwatchAxisCode(variants: ProductVariant[]): string | null {
  const axes = getProductOptionAxes(variants);
  const swatch = axes.find(
    (a) => a.display_type === "swatch" || a.code === "color",
  );
  return swatch?.code ?? null;
}

/** Unique colors from variants, preserving first-seen order. */
export function getProductColors(
  variants: ProductVariant[],
  fallbackImage?: string | null,
): ColorOption[] {
  const axisCode = getSwatchAxisCode(variants);
  if (!axisCode) return [];

  const map = new Map<string, ColorOption>();
  for (const v of variants) {
    const color = optionValue(v, axisCode);
    if (!color || map.has(color)) continue;

    const colorVariants = variants.filter(
      (variant) => optionValue(variant, axisCode) === color,
    );
    let image_url: string | null = null;
    for (const variant of colorVariants) {
      const first = variantPhotoUrls(variant)[0];
      if (first) {
        image_url = first;
        break;
      }
    }

    const hex =
      v.options.find((o) => o.code === axisCode)?.meta?.hex ?? v.color_hex;

    map.set(color, {
      color,
      color_hex: hex ?? null,
      image_url: image_url ?? fallbackImage ?? null,
    });
  }
  return [...map.values()];
}

/** All images for one color/swatch value — primary + additional photos. */
export function getColorImages(
  variants: ProductVariant[],
  color: string,
  fallbackImage?: string | null,
): string[] {
  const axisCode = getSwatchAxisCode(variants) ?? "color";
  const colorVariants = variants.filter(
    (v) => optionValue(v, axisCode) === color,
  );
  const urls: string[] = [];

  for (const v of colorVariants) {
    urls.push(...variantPhotoUrls(v));
  }

  if (!urls.length && fallbackImage) {
    urls.push(fallbackImage);
  }

  return urls.length ? urls : [fallbackImage ?? "/placeholder-product.svg"];
}

/** Images for product cards — scoped to a swatch value when present. */
export function getCardImages(product: Product, color?: string): string[] {
  const variants = product.variants ?? [];
  const axisCode = getSwatchAxisCode(variants);
  if (!axisCode) {
    const urls = uniqueUrls([
      ...productPhotoUrls(product),
      ...variants.flatMap((v) => variantPhotoUrls(v)),
    ]);
    return urls.length ? urls : [product.image_url ?? "/placeholder-product.svg"];
  }

  const activeColor = color || optionValue(variants[0], axisCode);
  if (!activeColor) {
    const urls = productPhotoUrls(product);
    return urls.length ? urls : [product.image_url ?? "/placeholder-product.svg"];
  }
  const look = getColorImages(variants, activeColor, null);
  if (look.length && look[0] !== "/placeholder-product.svg") return look;
  const productPhotos = productPhotoUrls(product);
  return productPhotos.length ? productPhotos : ["/placeholder-product.svg"];
}

/** Color-synced PDP gallery — only that look's photos, plus optional product video. */
export function buildColorGallery(
  product: Product,
  color: string,
): GalleryItem[] {
  const variants = product.variants ?? [];
  const axisCode = getSwatchAxisCode(variants) ?? "color";
  const imageUrls = uniqueUrls([
    ...getColorImages(variants, color, null).filter(
      (url) => url !== "/placeholder-product.svg",
    ),
    ...productPhotoUrls(product),
  ]);
  const colorVariants = variants.filter((v) => optionValue(v, axisCode) === color);

  const items: GalleryItem[] = imageUrls.map((url) => ({
    type: "image",
    url,
    color,
    option_code: axisCode,
    option_value: color,
  }));

  if (!items.length) {
    items.push({
      type: "image",
      url: "/placeholder-product.svg",
      color,
      option_code: axisCode,
      option_value: color,
    });
  }

  insertVideos(
    items,
    [
      ...productVideoUrls(product),
      ...colorVariants.flatMap((v) => variantVideoUrls(v)),
    ],
    { color, option_code: axisCode, option_value: color },
  );

  return items;
}

/**
 * Full PDP gallery — every unique photo across looks,
 * plus optional product video once after the first image.
 */
export function buildProductGallery(product: Product): GalleryItem[] {
  const variants = product.variants ?? [];
  const colors = getProductColors(variants, product.image_url);
  const seen = new Set<string>();
  const items: GalleryItem[] = [];
  const axisCode = getSwatchAxisCode(variants);

  if (colors.length && axisCode) {
    for (const option of colors) {
      const urls = getColorImages(variants, option.color, product.image_url);
      for (const url of urls) {
        if (seen.has(url)) continue;
        seen.add(url);
        items.push({
          type: "image",
          url,
          color: option.color,
          option_code: axisCode,
          option_value: option.color,
        });
      }
    }
    const extraProduct = productPhotoUrls(product).filter((url) => !seen.has(url));
    items.unshift(
      ...extraProduct.map((url) => ({ type: "image" as const, url })),
    );
  } else {
    for (const url of uniqueUrls([
      ...productPhotoUrls(product),
      ...variants.flatMap((v) => variantPhotoUrls(v)),
    ])) {
      items.push({ type: "image", url });
    }
  }

  if (!items.length && product.image_url) {
    items.push({ type: "image", url: product.image_url });
  }

  if (!items.length) {
    items.push({ type: "image", url: "/placeholder-product.svg" });
  }

  insertVideos(
    items,
    productVideoUrls(product),
    {
      color: items[0]?.color,
      option_code: items[0]?.option_code,
      option_value: items[0]?.option_value,
    },
  );

  if (colors.length && axisCode) {
    for (const option of colors) {
      const colorVariants = variants.filter(
        (v) => optionValue(v, axisCode) === option.color,
      );
      const videos = uniqueUrls(
        colorVariants.flatMap((v) => variantVideoUrls(v)),
      ).filter((url) => !items.some((item) => item.url === url));
      if (!videos.length) continue;
      const firstIdx = items.findIndex(
        (item) =>
          item.type === "image" &&
          (item.option_value ?? item.color) === option.color,
      );
      const insertAt = firstIdx >= 0 ? firstIdx + 1 : Math.min(1, items.length);
      items.splice(
        insertAt,
        0,
        ...videos.map((url) => ({
          type: "video" as const,
          url,
          color: option.color,
          option_code: axisCode,
          option_value: option.color,
        })),
      );
    }
  } else {
    insertVideos(
      items,
      variants.flatMap((v) => variantVideoUrls(v)),
    );
  }

  return items;
}
