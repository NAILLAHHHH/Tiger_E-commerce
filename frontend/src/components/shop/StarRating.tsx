import clsx from "clsx";

type Props = {
  rating: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** When true, show empty stars for the remainder (always 5 stars). */
  showEmpty?: boolean;
};

const sizeClass = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export default function StarRating({
  rating,
  size = "md",
  className,
  showEmpty = true,
}: Props) {
  const clamped = Math.min(5, Math.max(0, rating));
  const full = Math.floor(clamped);
  const hasHalf = clamped - full >= 0.4 && clamped - full < 0.9;
  const stars = showEmpty ? 5 : Math.ceil(clamped);

  return (
    <div
      className={clsx("inline-flex items-center gap-0.5", className)}
      aria-label={`${clamped.toFixed(1)} out of 5 stars`}
    >
      {Array.from({ length: stars }, (_, i) => {
        const filled = i < full;
        const half = i === full && hasHalf;
        return (
          <StarIcon
            key={i}
            className={sizeClass[size]}
            filled={filled}
            half={half}
          />
        );
      })}
    </div>
  );
}

function StarIcon({
  className,
  filled,
  half,
}: {
  className?: string;
  filled: boolean;
  half?: boolean;
}) {
  if (half) {
    return (
      <span className={clsx("relative inline-block", className)}>
        <svg
          className={clsx("absolute inset-0 text-gray-3", className)}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <svg
          className={clsx("absolute inset-0 text-brand", className)}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
          style={{ clipPath: "inset(0 50% 0 0)" }}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      </span>
    );
  }

  return (
    <svg
      className={clsx(filled ? "text-brand" : "text-gray-3", className)}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

type InteractiveProps = {
  value: number;
  onChange: (stars: number) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function InteractiveStarRating({
  value,
  onChange,
  size = "lg",
  className,
}: InteractiveProps) {
  return (
    <div className={clsx("inline-flex items-center gap-1", className)} role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star === 1 ? "" : "s"}`}
          onClick={() => onChange(star)}
          className="rounded p-0.5 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <StarIcon
            className={sizeClass[size]}
            filled={star <= value}
          />
        </button>
      ))}
    </div>
  );
}
