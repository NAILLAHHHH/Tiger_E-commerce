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

function mapApiReview(row: StrapiEntity): ProductReview {
  return {
    id: String(row.id ?? row.documentId ?? ""),
    product_id: String(row.product_id ?? ""),
    customer_name: String(row.customer_name ?? "Customer"),
    stars: Math.min(5, Math.max(1, Number(row.stars) || 1)),
    title: row.title ? String(row.title) : null,
    comment: String(row.comment ?? ""),
    created_at: String(
      row.created_at ?? row.createdAt ?? new Date().toISOString(),
    ),
  };
}

const fetchApprovedReviews = cache(async (): Promise<ProductReview[]> => {
  const rows = await strapiList<StrapiEntity>("reviews");
  return rows.map(mapApiReview);
});

export async function getReviewsForProduct(
  productId: string,
): Promise<ProductReview[]> {
  if (shouldUseMockData()) return getMockReviewsForProduct(productId);

  if (shouldUseStrapi()) {
    try {
      const rows = await strapiList<StrapiEntity>(
        "reviews",
        `productId=${encodeURIComponent(productId)}`,
      );
      return rows.map(mapApiReview);
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

  const created = await strapiCreate<StrapiEntity>("reviews", {
    customer_name,
    stars,
    title,
    comment,
    productId: input.productId,
  });

  return mapApiReview(created);
}

export { summarizeReviews };
