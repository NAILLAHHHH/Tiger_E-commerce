import { getStrapiUrl } from "@/lib/config";

type ApiListResponse<T> = {
  data: T[];
};

type ApiSingleResponse<T> = {
  data: T | null;
};

export type StrapiEntity = Record<string, unknown> & {
  id?: number | string;
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
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export async function strapiList<T>(
  resource: string,
  query?: string,
): Promise<T[]> {
  const qs = query ? `?${query}` : "";
  const json = await strapiFetch<ApiListResponse<T>>(`/api/${resource}${qs}`);
  return json.data ?? [];
}

/** Node API accepts a flat body (not Strapi `{ data: ... }`). */
export async function strapiCreate<T>(
  resource: string,
  data: Record<string, unknown>,
): Promise<T> {
  const json = await strapiFetch<ApiSingleResponse<T>>(`/api/${resource}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!json.data) throw new Error("API create returned no data");
  return json.data;
}

/** @deprecated Node API returns nested relations; populate query unused. */
export const PRODUCT_POPULATE = "";
export const VARIANT_POPULATE = "";
export const PUBLISHED_PRODUCTS = "";
export const PUBLISHED_CATEGORIES = "";
