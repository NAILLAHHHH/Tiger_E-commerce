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
import {
  PRODUCT_POPULATE,
  PUBLISHED_CATEGORIES,
  PUBLISHED_PRODUCTS,
  strapiList,
} from "@/lib/strapi/client";
import { mapStrapiCategory, mapStrapiProduct } from "@/lib/strapi/mappers";
import { productSupportsBulk, roundMoney } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/server";
import type { Category, Product } from "@/types/database";

function mapSupabaseProduct(row: Record<string, unknown>): Product {
  const variants = (row.product_variants as Record<string, unknown>[]) ?? [];
  const tiers =
    (row.wholesale_pricing_tiers as Record<string, unknown>[]) ?? [];
  const category = row.categories as Record<string, unknown> | null;
  const retailPrice = Number(row.retail_price ?? 0);
  const bulkFromTier = tiers.length
    ? Number(
        [...tiers].sort(
          (a, b) => Number(a.min_quantity) - Number(b.min_quantity),
        )[0]?.unit_price,
      )
    : null;

  const mappedVariants = variants.map((v) => ({
    id: String(v.id),
    product_id: String(v.product_id),
    sku: String(v.sku),
    size: String(v.size),
    color: String(v.color),
    color_hex: v.color_hex ? String(v.color_hex) : null,
    image_url: v.image_url ? String(v.image_url) : row.image_url ? String(row.image_url) : null,
    per_piece_price: roundMoney(Number(v.per_piece_price ?? retailPrice)),
    bulk_price:
      v.bulk_price != null
        ? roundMoney(Number(v.bulk_price))
        : bulkFromTier != null
          ? roundMoney(bulkFromTier)
          : null,
    bulk_minimum: Number(v.bulk_minimum ?? row.moq_wholesale ?? 10),
    stock_quantity: Number(v.stock_quantity),
  }));

  const total_stock = mappedVariants.reduce(
    (sum, v) => sum + v.stock_quantity,
    0,
  );

  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: row.description ? String(row.description) : null,
    category_id: row.category_id ? String(row.category_id) : null,
    image_url: row.image_url ? String(row.image_url) : null,
    video_url: row.video_url ? String(row.video_url) : null,
    is_featured: Boolean(row.is_featured),
    is_new: Boolean(row.is_new),
    category: category
      ? {
          id: String(category.id),
          name: String(category.name),
          slug: String(category.slug),
          image_url: category.image_url ? String(category.image_url) : null,
          sort_order: Number(category.sort_order ?? 0),
        }
      : null,
    variants: mappedVariants,
    total_stock,
  };
}

const productSelect = `
  *,
  categories (*),
  product_variants (*),
  wholesale_pricing_tiers (*)
`;

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
          ...(p.variants?.map((v) => `${v.color} ${v.size} ${v.sku}`) ?? []),
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
          ...(p.variants?.map((v) => `${v.color} ${v.size} ${v.sku}`) ?? []),
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

const fetchStrapiProducts = cache(async (): Promise<Product[]> => {
  const rows = await strapiList(
    "products",
    `${PUBLISHED_PRODUCTS}&${PRODUCT_POPULATE}&pagination[pageSize]=100`,
  );
  return rows.map(mapStrapiProduct);
});

const fetchStrapiCategories = cache(async (): Promise<Category[]> => {
  const rows = await strapiList(
    "categories",
    `${PUBLISHED_CATEGORIES}&populate[photo]=true&sort=list_position:asc&pagination[pageSize]=50`,
  );
  return rows.map(mapStrapiCategory);
});

export async function getCategories(): Promise<Category[]> {
  if (shouldUseMockData()) return mockCategories;

  if (shouldUseStrapi()) {
    try {
      return await fetchStrapiCategories();
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
      const products = await fetchStrapiProducts();
      return filterProducts(products, options);
    } catch {
      return filterMockProducts(options);
    }
  }

  const supabase = await createClient();
  let query = supabase.from("products").select(productSelect);

  if (options?.featured) query = query.eq("is_featured", true);
  if (options?.categorySlug) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", options.categorySlug)
      .single();
    if (cat) query = query.eq("category_id", cat.id);
  }
  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error || !data) return mockProducts;
  const products = data.map((row) =>
    mapSupabaseProduct(row as Record<string, unknown>),
  );
  return filterProducts(products, { query: options?.query });
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (shouldUseMockData()) return getMockProductBySlug(slug);

  if (shouldUseStrapi()) {
    try {
      const rows = await strapiList(
        "products",
        `${PUBLISHED_PRODUCTS}&filters[link_name][$eq]=${encodeURIComponent(slug)}&${PRODUCT_POPULATE}`,
      );
      const product = rows[0];
      return product ? mapStrapiProduct(product) : null;
    } catch {
      return getMockProductBySlug(slug);
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .eq("slug", slug)
    .single();

  if (error || !data) return getMockProductBySlug(slug);
  return mapSupabaseProduct(data as Record<string, unknown>);
}

export async function getNewArrivals(limit = 8): Promise<Product[]> {
  if (shouldUseMockData()) {
    return filterMockProducts({ newOnly: true, limit });
  }

  if (shouldUseStrapi()) {
    try {
      const products = await fetchStrapiProducts();
      return filterProducts(products, { newOnly: true, limit });
    } catch {
      return filterMockProducts({ newOnly: true, limit });
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .eq("is_new", true)
    .limit(limit);

  if (error || !data) {
    return mockProducts.filter((p) => p.is_new).slice(0, limit);
  }
  return data.map((row) => mapSupabaseProduct(row as Record<string, unknown>));
}

export async function getWholesaleProducts(): Promise<Product[]> {
  if (shouldUseMockData()) return filterMockProducts({ wholesaleOnly: true });

  if (shouldUseStrapi()) {
    try {
      const products = await fetchStrapiProducts();
      return filterProducts(products, { wholesaleOnly: true });
    } catch {
      return filterMockProducts({ wholesaleOnly: true });
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .in("sell_mode", ["wholesale", "both"]);

  if (error || !data) {
    return mockProducts.filter(productSupportsBulk);
  }
  return data.map((row) => mapSupabaseProduct(row as Record<string, unknown>));
}
