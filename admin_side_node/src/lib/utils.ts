export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function roundMoney(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount);
}

/** Retail / listed prices must be at least 1 (RWF). */
export function requirePositivePrice(
  amount: number,
  label = "Price",
): number {
  const value = roundMoney(amount);
  if (value < 1) {
    throw new Error(`${label} must be at least 1 (cannot be 0).`);
  }
  return value;
}

/** Bulk price is optional; when set it must be at least 1. */
export function requireOptionalPositivePrice(
  amount: number | null | undefined,
  label = "Bulk price",
): number | null {
  if (amount == null) return null;
  return requirePositivePrice(amount, label);
}

/** Staff-set stock must be at least 1. Orders can still deduct to 0 (sold out). */
export function requirePositiveStock(
  amount: number,
  label = "Stock",
): number {
  const value = Math.trunc(amount);
  if (!Number.isFinite(value) || value < 1) {
    throw new Error(`${label} must be at least 1 (cannot be 0).`);
  }
  return value;
}

export function uniqueTrimmedUrls(
  urls: (string | null | undefined)[] | undefined,
): string[] {
  return [
    ...new Set(
      (urls ?? [])
        .map((url) => url?.trim())
        .filter((url): url is string => Boolean(url)),
    ),
  ];
}

/** Combined list wins; otherwise first + extras. Undefined means “not sent”. */
export function incomingUrlList(
  list?: string[],
  first?: string | null,
  extras?: string[],
): string[] | undefined {
  if (list !== undefined) return list;
  if (first !== undefined || extras !== undefined) {
    return [first ?? "", ...(extras ?? [])];
  }
  return undefined;
}

/** First URL is the cover photo; the rest are extras. */
export function splitPhotoList(urls: string[] | undefined): {
  photoUrl: string | null;
  extraPhotoUrls: string[];
} {
  const clean = uniqueTrimmedUrls(urls);
  return { photoUrl: clean[0] ?? null, extraPhotoUrls: clean.slice(1) };
}

export function splitVideoList(urls: string[] | undefined): {
  videoUrl: string | null;
  extraVideoUrls: string[];
} {
  const clean = uniqueTrimmedUrls(urls);
  return { videoUrl: clean[0] ?? null, extraVideoUrls: clean.slice(1) };
}

export function photoListFrom(
  cover: string | null | undefined,
  extras: string[] | null | undefined,
): string[] {
  return uniqueTrimmedUrls([cover, ...(extras ?? [])]);
}

export function videoListFrom(
  first: string | null | undefined,
  extras: string[] | null | undefined,
): string[] {
  return uniqueTrimmedUrls([first, ...(extras ?? [])]);
}

export function optionsLabel(
  values: Array<{ label: string; attribute?: { name: string; listPosition: number } | null }>,
  fallback?: { size?: string | null; color?: string | null },
): string {
  if (values.length) {
    return [...values]
      .sort(
        (a, b) =>
          (a.attribute?.listPosition ?? 0) - (b.attribute?.listPosition ?? 0),
      )
      .map((v) =>
        v.attribute?.name ? `${v.attribute.name} ${v.label}` : v.label,
      )
      .join(" · ");
  }
  const parts: string[] = [];
  if (fallback?.size) parts.push(`Size ${fallback.size}`);
  if (fallback?.color) parts.push(`Color ${fallback.color}`);
  return parts.join(" · ");
}
