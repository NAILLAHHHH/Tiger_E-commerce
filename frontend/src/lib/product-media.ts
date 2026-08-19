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
      if (variant.image_url) {
        image_url = variant.image_url;
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
    urls.push(...uniqueUrls([v.image_url, ...(v.color_images ?? [])]));
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
      product.image_url,
      ...variants.flatMap((v) => [v.image_url, ...(v.color_images ?? [])]),
    ]);
    return urls.length ? urls : [product.image_url ?? "/placeholder-product.svg"];
  }

  const activeColor = color || optionValue(variants[0], axisCode);
  if (!activeColor) {
    return [product.image_url ?? "/placeholder-product.svg"];
  }
  return getColorImages(variants, activeColor, product.image_url);
}

/** Color-synced PDP gallery — only that look's photos, plus optional product video. */
export function buildColorGallery(
  product: Product,
  color: string,
): GalleryItem[] {
  const variants = product.variants ?? [];
  const imageUrls = getColorImages(variants, color, product.image_url);
  const axisCode = getSwatchAxisCode(variants) ?? "color";

  const items: GalleryItem[] = imageUrls.map((url) => ({
    type: "image",
    url,
    color,
    option_code: axisCode,
    option_value: color,
  }));

  if (product.video_url) {
    const insertAt = Math.min(1, items.length);
    items.splice(insertAt, 0, {
      type: "video",
      url: product.video_url,
      color,
      option_code: axisCode,
      option_value: color,
    });
  }

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
  } else {
    for (const url of uniqueUrls([
      product.image_url,
      ...variants.flatMap((v) => [v.image_url, ...(v.color_images ?? [])]),
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

  if (product.video_url) {
    const insertAt = Math.min(1, items.length);
    items.splice(insertAt, 0, {
      type: "video",
      url: product.video_url,
      color: items[0]?.color,
      option_code: items[0]?.option_code,
      option_value: items[0]?.option_value,
    });
  }

  return items;
}
