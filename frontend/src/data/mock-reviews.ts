import type { ProductReview, RatingSummary } from "@/types/database";

const now = Date.now();
const daysAgo = (n: number) =>
  new Date(now - n * 24 * 60 * 60 * 1000).toISOString();

/** Mock reviews keyed by product id — used when Strapi is offline / mock mode. */
export const mockReviews: ProductReview[] = [
  {
    id: "rev-1",
    product_id: "p-21",
    customer_name: "Aline K.",
    stars: 5,
    title: "Perfect everyday tee",
    comment:
      "Soft cotton, true to size. Ordered black and navy — both wash well. Will buy again.",
    created_at: daysAgo(3),
  },
  {
    id: "rev-2",
    product_id: "p-21",
    customer_name: "Jean P.",
    stars: 4,
    title: "Good quality for the price",
    comment:
      "Nice fit for wholesale too. Bought 12 for my shop — customers liked them.",
    created_at: daysAgo(12),
  },
  {
    id: "rev-3",
    product_id: "p-21",
    customer_name: "Diane M.",
    stars: 5,
    title: null,
    comment: "Exactly as shown. Fast WhatsApp help with sizing.",
    created_at: daysAgo(28),
  },
  {
    id: "rev-4",
    product_id: "p-1",
    customer_name: "Eric N.",
    stars: 5,
    title: "Warm and stylish",
    comment:
      "The heather grey zip hoodie looks premium. Zipper is smooth, fabric is thick enough for evenings.",
    created_at: daysAgo(5),
  },
  {
    id: "rev-5",
    product_id: "p-1",
    customer_name: "Sandrine U.",
    stars: 4,
    title: "Love the fit",
    comment: "Slightly oversized as expected. Great with jeans.",
    created_at: daysAgo(18),
  },
  {
    id: "rev-6",
    product_id: "p-8",
    customer_name: "Patrick H.",
    stars: 5,
    title: "Office ready",
    comment:
      "Black quarter zip looks sharp for work. Ordered cream too — both excellent.",
    created_at: daysAgo(7),
  },
  {
    id: "rev-7",
    product_id: "p-8",
    customer_name: "Claudine T.",
    stars: 3,
    title: "Nice but runs small",
    comment: "Quality is good. Size up if you want a looser fit.",
    created_at: daysAgo(21),
  },
  {
    id: "rev-8",
    product_id: "p-16",
    customer_name: "Yves B.",
    stars: 5,
    title: "Best chinos I've bought",
    comment: "Navy slim chino — clean cut, doesn't fade after wash.",
    created_at: daysAgo(9),
  },
  {
    id: "rev-9",
    product_id: "p-14",
    customer_name: "Grace I.",
    stars: 4,
    title: "Comfortable jeans",
    comment: "Slim black jeans stretch just enough. True to size 32.",
    created_at: daysAgo(14),
  },
  {
    id: "rev-10",
    product_id: "p-18",
    customer_name: "Michel R.",
    stars: 5,
    title: "Jacket is fire",
    comment: "MA-1 bomber looks exactly like the photos. Warm lining.",
    created_at: daysAgo(4),
  },
];

export function getMockReviewsForProduct(
  productId: string,
): ProductReview[] {
  return mockReviews
    .filter((r) => r.product_id === productId)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
}

export function summarizeReviews(reviews: ProductReview[]): RatingSummary {
  const distribution: RatingSummary["distribution"] = [0, 0, 0, 0, 0];
  if (!reviews.length) {
    return { average: 0, count: 0, distribution };
  }

  let sum = 0;
  for (const review of reviews) {
    const stars = Math.min(5, Math.max(1, Math.round(review.stars)));
    distribution[stars - 1] += 1;
    sum += stars;
  }

  return {
    average: Math.round((sum / reviews.length) * 10) / 10,
    count: reviews.length,
    distribution,
  };
}

export function getMockRatingSummaries(): Record<string, RatingSummary> {
  const byProduct = new Map<string, ProductReview[]>();
  for (const review of mockReviews) {
    const list = byProduct.get(review.product_id) ?? [];
    list.push(review);
    byProduct.set(review.product_id, list);
  }

  const summaries: Record<string, RatingSummary> = {};
  for (const [productId, list] of byProduct) {
    summaries[productId] = summarizeReviews(list);
  }
  return summaries;
}
