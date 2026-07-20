import { getStrapiUrl } from "@/lib/config";

type StrapiListResponse<T> = {
  data: T[];
  meta?: { pagination?: { page: number; pageSize: number; total: number } };
};

type StrapiSingleResponse<T> = {
  data: T | null;
};

export type StrapiEntity = Record<string, unknown> & {
  id?: number;
  documentId?: string;
};

export async function strapiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const base = getStrapiUrl().replace(/\/$/, "");
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    next: init?.method === "POST" ? undefined : { revalidate: 30 },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Strapi ${res.status}: ${text || res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export async function strapiList<T extends StrapiEntity>(
  resource: string,
  query?: string,
): Promise<T[]> {
  const qs = query ? `?${query}` : "";
  const json = await strapiFetch<StrapiListResponse<T>>(`/api/${resource}${qs}`);
  return json.data ?? [];
}

export async function strapiCreate<T extends StrapiEntity>(
  resource: string,
  data: Record<string, unknown>,
): Promise<T> {
  const json = await strapiFetch<StrapiSingleResponse<T>>(`/api/${resource}`, {
    method: "POST",
    body: JSON.stringify({ data }),
  });
  if (!json.data) throw new Error("Strapi create returned no data");
  return json.data;
}

export const PRODUCT_POPULATE =
  "populate[category]=true&populate[photo]=true&populate[video]=true&populate[sizes_and_colors][populate][photo]=true&populate[sizes_and_colors][populate][color_photos]=true";

/** Only return published products — drafts stay hidden from the storefront. */
export const PUBLISHED_PRODUCTS = "status=published";
