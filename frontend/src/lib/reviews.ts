import { cache } from "react";
import {
  getMockRatingSummaries,
  getMockReviewsForProduct,
  mockReviews,
  summarizeReviews,
} from "@/data/mock-reviews";
import { shouldUseMockData, shouldUseStrapi } from "@/lib/config";
import { strapiCreate, strapiList, type StrapiEntity } from "@/lib/strapi/client";
import type { ProductReview, RatingSummary } from "@/types/database";

function mapStrapiReview(row: StrapiEntity): ProductReview {
  const product = row.product as StrapiEntity | null | undefined;
  const productId = product
    ? String(product.documentId ?? product.id ?? "")
    : "";

  return {
    id: String(row.documentId ?? row.id ?? ""),
    product_id: productId,
    customer_name: String(row.customer_name ?? "Customer"),
    stars: Math.min(5, Math.max(1, Number(row.stars) || 1)),
    title: row.title ? String(row.title) : null,
    comment: String(row.comment ?? ""),
    created_at: String(
      row.createdAt ?? row.created_at ?? new Date().toISOString(),
    ),
  };
}

const fetchApprovedReviews = cache(async (): Promise<ProductReview[]> => {
  const rows = await strapiList(
    "reviews",
    "filters[show_on_website][$eq]=true&populate[product]=true&sort=createdAt:desc&pagination[pageSize]=200",
  );
  return rows.map(mapStrapiReview);
});

export async function getReviewsForProduct(
  productId: string,
): Promise<ProductReview[]> {
  if (shouldUseMockData()) return getMockReviewsForProduct(productId);

  if (shouldUseStrapi()) {
    try {
      const all = await fetchApprovedReviews();
      return all.filter((r) => r.product_id === productId);
    } catch {
      return getMockReviewsForProduct(productId);
    }
  }

  return getMockReviewsForProduct(productId);
}

export async function getRatingSummaries(): Promise<
  Record<string, RatingSummary>
> {
  if (shouldUseMockData()) return getMockRatingSummaries();

  if (shouldUseStrapi()) {
    try {
      const reviews = await fetchApprovedReviews();
      const byProduct = new Map<string, ProductReview[]>();
      for (const review of reviews) {
        if (!review.product_id) continue;
        const list = byProduct.get(review.product_id) ?? [];
        list.push(review);
        byProduct.set(review.product_id, list);
      }
      const summaries: Record<string, RatingSummary> = {};
      for (const [id, list] of byProduct) {
        summaries[id] = summarizeReviews(list);
      }
      return summaries;
    } catch {
      return getMockRatingSummaries();
    }
  }

  return getMockRatingSummaries();
}

export async function getRatingSummaryForProduct(
  productId: string,
): Promise<RatingSummary> {
  const reviews = await getReviewsForProduct(productId);
  return summarizeReviews(reviews);
}

export type SubmitReviewInput = {
  productId: string;
  customerName: string;
  stars: number;
  title?: string;
  comment: string;
};

export async function submitReview(
  input: SubmitReviewInput,
): Promise<ProductReview> {
  const customer_name = input.customerName.trim();
  const comment = input.comment.trim();
  const stars = Math.min(5, Math.max(1, Math.round(input.stars)));
  const title = input.title?.trim() || null;

  if (!customer_name || !comment || !input.productId) {
    throw new Error("Name, rating, and review text are required");
  }

  if (shouldUseMockData() || !shouldUseStrapi()) {
    const review: ProductReview = {
      id: `rev-local-${Date.now()}`,
      product_id: input.productId,
      customer_name,
      stars,
      title,
      comment,
      created_at: new Date().toISOString(),
    };
    mockReviews.unshift(review);
    return review;
  }

  const created = await strapiCreate("reviews", {
    customer_name,
    stars,
    title,
    comment,
    show_on_website: true,
    product: input.productId,
  });

  return mapStrapiReview(created);
}

export { summarizeReviews };
