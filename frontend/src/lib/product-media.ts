import type {
  ColorOption,
  GalleryItem,
  Product,
  ProductVariant,
} from "@/types/database";

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

/** Unique colors from variants, preserving first-seen order. */
export function getProductColors(
  variants: ProductVariant[],
  fallbackImage?: string | null,
): ColorOption[] {
  const map = new Map<string, ColorOption>();
  for (const v of variants) {
    if (map.has(v.color)) continue;

    const colorVariants = variants.filter((variant) => variant.color === v.color);
    let image_url: string | null = null;
    for (const variant of colorVariants) {
      if (variant.image_url) {
        image_url = variant.image_url;
        break;
      }
    }

    map.set(v.color, {
      color: v.color,
      color_hex: v.color_hex,
      image_url: image_url ?? fallbackImage ?? null,
    });
  }
  return [...map.values()];
}

/** All images for one color — primary + additional color photos. */
export function getColorImages(
  variants: ProductVariant[],
  color: string,
  fallbackImage?: string | null,
): string[] {
  const colorVariants = variants.filter((v) => v.color === color);
  const urls: string[] = [];

  for (const v of colorVariants) {
    urls.push(...uniqueUrls([v.image_url, ...(v.color_images ?? [])]));
  }

  if (!urls.length && fallbackImage) {
    urls.push(fallbackImage);
  }

  return urls.length ? urls : [fallbackImage ?? "/placeholder-product.svg"];
}

/** Images for product cards — always scoped to a color (defaults to first). */
export function getCardImages(product: Product, color?: string): string[] {
  const variants = product.variants ?? [];
  const activeColor = color || variants[0]?.color;
  if (!activeColor) {
    return [product.image_url ?? "/placeholder-product.svg"];
  }
  return getColorImages(variants, activeColor, product.image_url);
}

/** Color-synced PDP gallery — only that color's photos, plus optional product video. */
export function buildColorGallery(
  product: Product,
  color: string,
): GalleryItem[] {
  const variants = product.variants ?? [];
  const imageUrls = getColorImages(variants, color, product.image_url);

  const items: GalleryItem[] = imageUrls.map((url) => ({
    type: "image",
    url,
  }));

  if (product.video_url) {
    const insertAt = Math.min(1, items.length);
    items.splice(insertAt, 0, { type: "video", url: product.video_url });
  }

  return items;
}
