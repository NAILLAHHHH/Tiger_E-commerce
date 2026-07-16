"use client";

import { useMemo, useState } from "react";
import StarRating, {
  InteractiveStarRating,
} from "@/components/shop/StarRating";
import { summarizeReviews } from "@/lib/reviews";
import type { ProductReview, RatingSummary } from "@/types/database";

type Props = {
  productId: string;
  productName: string;
  initialReviews: ProductReview[];
  initialSummary: RatingSummary;
};

function formatReviewDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export default function ProductReviews({
  productId,
  productName,
  initialReviews,
  initialSummary,
}: Props) {
  const [reviews, setReviews] = useState(initialReviews);
  const [filterStars, setFilterStars] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [stars, setStars] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sort, setSort] = useState<"newest" | "highest" | "lowest">("newest");

  const summary = useMemo(() => summarizeReviews(reviews), [reviews]);

  const visible = useMemo(() => {
    let list = [...reviews];
    if (filterStars != null) {
      list = list.filter((r) => r.stars === filterStars);
    }
    if (sort === "highest") list.sort((a, b) => b.stars - a.stars);
    else if (sort === "lowest") list.sort((a, b) => a.stars - b.stars);
    else {
      list.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }
    return list;
  }, [reviews, filterStars, sort]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          customerName: name,
          stars,
          title: title || undefined,
          comment,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? "Could not submit review");
      }

      const review = json.review as ProductReview;
      setReviews((prev) => [review, ...prev]);
      setSuccess(true);
      setShowForm(false);
      setName("");
      setTitle("");
      setComment("");
      setStars(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const displaySummary = summary.count > 0 ? summary : initialSummary;

  return (
    <section id="reviews" className="scroll-mt-28 border-t border-gray-3 pt-12">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="section-title">Customer reviews</h2>
          <p className="mt-1 text-sm text-muted">
            Real feedback on {productName}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowForm((v) => !v);
            setSuccess(false);
            setError(null);
          }}
          className="btn-outline mt-2 sm:mt-0"
        >
          {showForm ? "Cancel" : "Write a review"}
        </button>
      </div>

      {success && (
        <p className="mt-4 rounded-[5px] border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Thanks — your review is now live.
        </p>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4 rounded-xl border border-gray-3 bg-gray-1 p-5"
        >
          <div>
            <p className="mb-2 text-sm font-medium text-dark">Your rating</p>
            <InteractiveStarRating value={stars} onChange={setStars} />
          </div>
          <div>
            <label htmlFor="review-name" className="mb-1.5 block text-sm font-medium text-dark">
              Name
            </label>
            <input
              id="review-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={60}
              placeholder="How should we show your name?"
              className="w-full rounded-[5px] border border-gray-3 bg-surface px-3 py-2.5 text-sm text-dark outline-none focus:border-brand"
            />
          </div>
          <div>
            <label htmlFor="review-title" className="mb-1.5 block text-sm font-medium text-dark">
              Headline <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              id="review-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              placeholder="Sum it up in a few words"
              className="w-full rounded-[5px] border border-gray-3 bg-surface px-3 py-2.5 text-sm text-dark outline-none focus:border-brand"
            />
          </div>
          <div>
            <label htmlFor="review-comment" className="mb-1.5 block text-sm font-medium text-dark">
              Your review
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
              minLength={10}
              maxLength={2000}
              rows={4}
              placeholder="What did you like? How was the fit and quality?"
              className="w-full resize-y rounded-[5px] border border-gray-3 bg-surface px-3 py-2.5 text-sm text-dark outline-none focus:border-brand"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit review"}
          </button>
        </form>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <div>
          <div className="flex items-end gap-3">
            <p className="text-4xl font-bold text-dark">
              {displaySummary.count > 0
                ? displaySummary.average.toFixed(1)
                : "—"}
            </p>
            <div className="pb-1">
              <StarRating rating={displaySummary.average} size="md" />
              <p className="mt-1 text-xs text-muted">
                {displaySummary.count === 0
                  ? "No reviews yet"
                  : `${displaySummary.count} ${displaySummary.count === 1 ? "rating" : "ratings"}`}
              </p>
            </div>
          </div>

          <ul className="mt-5 space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = displaySummary.distribution[star - 1] ?? 0;
              const pct =
                displaySummary.count > 0
                  ? Math.round((count / displaySummary.count) * 100)
                  : 0;
              const active = filterStars === star;
              return (
                <li key={star}>
                  <button
                    type="button"
                    onClick={() =>
                      setFilterStars((prev) => (prev === star ? null : star))
                    }
                    className={`flex w-full items-center gap-2 rounded-md px-1 py-1 text-left text-xs transition-colors hover:bg-gray-1 ${
                      active ? "bg-brand-light" : ""
                    }`}
                  >
                    <span className="w-10 shrink-0 font-medium text-body">
                      {star} star
                    </span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-gray-2">
                      <span
                        className="block h-full rounded-full bg-brand"
                        style={{ width: `${pct}%` }}
                      />
                    </span>
                    <span className="w-8 shrink-0 text-right text-muted">
                      {pct}%
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {filterStars != null && (
            <button
              type="button"
              onClick={() => setFilterStars(null)}
              className="mt-3 text-xs font-medium text-brand hover:text-brand-dark"
            >
              Clear filter
            </button>
          )}
        </div>

        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-body">
              {visible.length}{" "}
              {visible.length === 1 ? "review" : "reviews"}
              {filterStars != null ? ` · ${filterStars} stars` : ""}
            </p>
            <label className="flex items-center gap-2 text-sm text-muted">
              Sort by
              <select
                value={sort}
                onChange={(e) =>
                  setSort(e.target.value as "newest" | "highest" | "lowest")
                }
                className="rounded-[5px] border border-gray-3 bg-surface px-2 py-1.5 text-sm text-dark"
              >
                <option value="newest">Most recent</option>
                <option value="highest">Highest rated</option>
                <option value="lowest">Lowest rated</option>
              </select>
            </label>
          </div>

          {visible.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-3 bg-gray-1 px-6 py-12 text-center">
              <p className="font-medium text-dark">No reviews yet</p>
              <p className="mt-1 text-sm text-muted">
                Be the first to share how this product worked for you.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-3">
              {visible.map((review) => (
                <li key={review.id} className="py-5 first:pt-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <StarRating rating={review.stars} size="sm" />
                    <span className="text-sm font-semibold text-dark">
                      {review.customer_name}
                    </span>
                    <span className="text-xs text-muted">
                      {formatReviewDate(review.created_at)}
                    </span>
                  </div>
                  {review.title && (
                    <p className="mt-2 text-sm font-semibold text-dark">
                      {review.title}
                    </p>
                  )}
                  <p className="mt-1.5 text-sm leading-relaxed text-body">
                    {review.comment}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
