import { cache } from "react";
import {
  getMockProductBySlug,
  getMockProductsByCategory,
  mockCategories,
  mockProducts,
} from "@/data/mock-products";
import {
  shouldUseMockData,
  shouldUseStrapi,
} from "@/lib/config";
import { strapiFetch } from "@/lib/strapi/client";
import { productSupportsBulk } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/server";
import type { Category, Product } from "@/types/database";

function filterProducts(
  products: Product[],
  options?: {
    featured?: boolean;
    categorySlug?: string;
    limit?: number;
    newOnly?: boolean;
    wholesaleOnly?: boolean;
    query?: string;
  },
): Product[] {
  let items = [...products];
  if (options?.featured) items = items.filter((p) => p.is_featured);
  if (options?.newOnly) items = items.filter((p) => p.is_new);
  if (options?.wholesaleOnly) {
    items = items.filter(productSupportsBulk);
  }
  if (options?.categorySlug) {
    items = items.filter((p) => p.category?.slug === options.categorySlug);
  }
  if (options?.query) {
    const q = options.query.trim().toLowerCase();
    if (q) {
      items = items.filter((p) => {
        const haystack = [
          p.name,
          p.description ?? "",
          p.category?.name ?? "",
          ...(p.variants?.map((v) =>
            `${v.color} ${v.size} ${v.sku} ${v.options?.map((o) => o.value).join(" ") ?? ""}`,
          ) ?? []),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }
  }
  if (options?.limit) items = items.slice(0, options.limit);
  return items;
}

function filterMockProducts(options?: {
  featured?: boolean;
  categorySlug?: string;
  limit?: number;
  newOnly?: boolean;
  wholesaleOnly?: boolean;
  query?: string;
}): Product[] {
  let items = [...mockProducts];
  if (options?.featured) items = items.filter((p) => p.is_featured);
  if (options?.newOnly) items = items.filter((p) => p.is_new);
  if (options?.wholesaleOnly) {
    items = items.filter(productSupportsBulk);
  }
  if (options?.categorySlug) {
    items = getMockProductsByCategory(options.categorySlug);
  }
  if (options?.query) {
    const q = options.query.trim().toLowerCase();
    if (q) {
      items = items.filter((p) => {
        const haystack = [
          p.name,
          p.description ?? "",
          p.category?.name ?? "",
          ...(p.variants?.map((v) =>
            `${v.color} ${v.size} ${v.sku} ${v.options?.map((o) => o.value).join(" ") ?? ""}`,
          ) ?? []),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }
  }
  if (options?.limit) items = items.slice(0, options.limit);
  return items;
}

/** Node store API already returns storefront Product / Category shapes. */
const fetchApiProducts = cache(async (): Promise<Product[]> => {
  const json = await strapiFetch<{ data: Product[] }>("/api/products");
  return json.data ?? [];
});

const fetchApiCategories = cache(async (): Promise<Category[]> => {
  const json = await strapiFetch<{ data: Category[] }>("/api/categories");
  return json.data ?? [];
});

export async function getCategories(): Promise<Category[]> {
  if (shouldUseMockData()) return mockCategories;

  if (shouldUseStrapi()) {
    try {
      return await fetchApiCategories();
    } catch {
      return mockCategories;
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  if (error || !data) return mockCategories;
  return data as Category[];
}

export async function getProducts(options?: {
  featured?: boolean;
  categorySlug?: string;
  limit?: number;
  query?: string;
}): Promise<Product[]> {
  if (shouldUseMockData()) return filterMockProducts(options);

  if (shouldUseStrapi()) {
    try {
      const products = await fetchApiProducts();
      return filterProducts(products, options);
    } catch {
      return filterMockProducts(options);
    }
  }

  return filterMockProducts(options);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (shouldUseMockData()) return getMockProductBySlug(slug);

  if (shouldUseStrapi()) {
    try {
      const json = await strapiFetch<{ data: Product | null }>(
        `/api/products/${encodeURIComponent(slug)}`,
      );
      return json.data ?? null;
    } catch {
      return getMockProductBySlug(slug);
    }
  }

  return getMockProductBySlug(slug);
}

export async function getNewArrivals(limit = 8): Promise<Product[]> {
  if (shouldUseMockData()) {
    return filterMockProducts({ newOnly: true, limit });
  }

  if (shouldUseStrapi()) {
    try {
      const products = await fetchApiProducts();
      return filterProducts(products, { newOnly: true, limit });
    } catch {
      return filterMockProducts({ newOnly: true, limit });
    }
  }

  return filterMockProducts({ newOnly: true, limit });
}

export async function getWholesaleProducts(): Promise<Product[]> {
  if (shouldUseMockData()) return filterMockProducts({ wholesaleOnly: true });

  if (shouldUseStrapi()) {
    try {
      const products = await fetchApiProducts();
      return filterProducts(products, { wholesaleOnly: true });
    } catch {
      return filterMockProducts({ wholesaleOnly: true });
    }
  }

  return filterMockProducts({ wholesaleOnly: true });
}
