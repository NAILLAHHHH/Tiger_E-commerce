"use client";

import { useMemo, useState } from "react";
import StarRating, {
  InteractiveStarRating,
} from "@/components/shop/StarRating";
import { summarizeReviews } from "@/lib/reviews";
import { useT } from "@/i18n/LocaleProvider";
import type { ProductReview, RatingSummary } from "@/types/database";

type Props = {
  productId: string;
  productName: string;
  initialReviews: ProductReview[];
  initialSummary: RatingSummary;
};

function formatReviewDate(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale === "rw" ? "rw-RW" : "en", {
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
  const { t, locale } = useT();
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
        throw new Error(json.error ?? t("reviews.submitError"));
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
      setError(err instanceof Error ? err.message : t("reviews.genericError"));
    } finally {
      setSubmitting(false);
    }
  };

  const displaySummary = summary.count > 0 ? summary : initialSummary;

  return (
    <section id="reviews" className="scroll-mt-28 border-t border-gray-3 pt-12">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="section-title">{t("reviews.title")}</h2>
          <p className="mt-1 text-sm text-muted">
            {t("reviews.realFeedback", { name: productName })}
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
          {showForm ? t("reviews.cancel") : t("reviews.write")}
        </button>
      </div>

      {success && (
        <p className="mt-4 rounded-[5px] border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {t("reviews.thanks")}
        </p>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4 rounded-xl border border-gray-3 bg-gray-1 p-5"
        >
          <div>
            <p className="mb-2 text-sm font-medium text-dark">{t("reviews.yourRating")}</p>
            <InteractiveStarRating value={stars} onChange={setStars} />
          </div>
          <div>
            <label htmlFor="review-name" className="mb-1.5 block text-sm font-medium text-dark">
              {t("reviews.name")}
            </label>
            <input
              id="review-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={60}
              placeholder={t("reviews.namePlaceholder")}
              className="w-full rounded-[5px] border border-gray-3 bg-surface px-3 py-2.5 text-sm text-dark outline-none focus:border-brand"
            />
          </div>
          <div>
            <label htmlFor="review-title" className="mb-1.5 block text-sm font-medium text-dark">
              {t("reviews.headline")}{" "}
              <span className="font-normal text-muted">{t("reviews.optional")}</span>
            </label>
            <input
              id="review-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              placeholder={t("reviews.headlinePlaceholder")}
              className="w-full rounded-[5px] border border-gray-3 bg-surface px-3 py-2.5 text-sm text-dark outline-none focus:border-brand"
            />
          </div>
          <div>
            <label htmlFor="review-comment" className="mb-1.5 block text-sm font-medium text-dark">
              {t("reviews.yourReview")}
            </label>
            <textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
              minLength={10}
              maxLength={2000}
              rows={4}
              placeholder={t("reviews.commentPlaceholder")}
              className="w-full resize-y rounded-[5px] border border-gray-3 bg-surface px-3 py-2.5 text-sm text-dark outline-none focus:border-brand"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary disabled:opacity-50"
          >
            {submitting ? t("reviews.submitting") : t("reviews.submit")}
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
                  ? t("reviews.noYet")
                  : `${displaySummary.count} ${displaySummary.count === 1 ? t("reviews.rating") : t("reviews.ratings")}`}
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
                      {t("reviews.star", { n: star })}
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
              {t("reviews.clearFilter")}
            </button>
          )}
        </div>

        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-body">
              {visible.length}{" "}
              {visible.length === 1 ? t("reviews.review") : t("reviews.reviews")}
              {filterStars != null ? ` ${t("reviews.starsFilter", { n: filterStars })}` : ""}
            </p>
            <label className="flex items-center gap-2 text-sm text-muted">
              {t("reviews.sortBy")}
              <select
                value={sort}
                onChange={(e) =>
                  setSort(e.target.value as "newest" | "highest" | "lowest")
                }
                className="rounded-[5px] border border-gray-3 bg-surface px-2 py-1.5 text-sm text-dark"
              >
                <option value="newest">{t("reviews.newest")}</option>
                <option value="highest">{t("reviews.highest")}</option>
                <option value="lowest">{t("reviews.lowest")}</option>
              </select>
            </label>
          </div>

          {visible.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-3 bg-gray-1 px-6 py-12 text-center">
              <p className="font-medium text-dark">{t("reviews.noYet")}</p>
              <p className="mt-1 text-sm text-muted">
                {t("reviews.emptyHint")}
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
                      {formatReviewDate(review.created_at, locale)}
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
