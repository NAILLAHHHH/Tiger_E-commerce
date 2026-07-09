"use client";

import Image from "next/image";
import { resolveProductImage } from "@/lib/images";
import type { ColorOption } from "@/types/database";

type Props = {
  colors: ColorOption[];
  selected: string;
  onSelect: (color: string) => void;
  /** Compact dots-only style for product cards */
  compact?: boolean;
  /** Stack compact swatches vertically (for card right edge) */
  vertical?: boolean;
  className?: string;
};

function SwatchThumb({
  option,
  compact = false,
}: {
  option: ColorOption;
  compact?: boolean;
}) {
  const size = compact ? 22 : 20;

  if (option.image_url) {
    return (
      <span
        className="relative block shrink-0 overflow-hidden rounded-full bg-gray-1"
        style={{ width: size, height: size }}
      >
        <Image
          src={resolveProductImage(option.image_url)}
          alt={option.color}
          width={size}
          height={size}
          className="h-full w-full object-cover object-center"
          sizes={`${size}px`}
        />
      </span>
    );
  }

  return (
    <span
      className="block shrink-0 rounded-full border border-gray-3"
      style={{
        width: size,
        height: size,
        backgroundColor: option.color_hex ?? "#ccc",
      }}
    />
  );
}

export default function ColorSwatches({
  colors,
  selected,
  onSelect,
  compact = false,
  vertical = false,
  className = "",
}: Props) {
  if (colors.length <= 1) return null;

  if (compact) {
    const visible = colors.slice(0, 4);
    const overflow = colors.length - visible.length;

    return (
      <div
        className={`flex gap-1.5 ${
          vertical ? "flex-col items-center" : "flex-wrap items-center"
        } ${className}`}
        onClick={(e) => e.preventDefault()}
        onKeyDown={(e) => e.stopPropagation()}
        role="list"
        aria-label="Available colors"
      >
        {visible.map((c) => (
          <button
            key={c.color}
            type="button"
            role="listitem"
            aria-label={c.color}
            aria-pressed={selected === c.color}
            title={c.color}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect(c.color);
            }}
            className={`rounded-full border-2 p-0 transition-transform hover:scale-110 ${
              selected === c.color
                ? "border-brand ring-2 ring-brand/40"
                : "border-white/90 shadow-sm"
            }`}
          >
            <SwatchThumb option={c} compact />
          </button>
        ))}
        {overflow > 0 && (
          <span className="text-[10px] text-white/90 drop-shadow">
            +{overflow}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <p className="mb-2 text-sm font-medium text-dark">Color</p>
      <div className="flex flex-wrap gap-2">
        {colors.map((c) => (
          <button
            key={c.color}
            type="button"
            onClick={() => onSelect(c.color)}
            className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors ${
              selected === c.color
                ? "border-brand bg-brand/5 text-brand"
                : "border-gray-3 text-body hover:border-brand/50"
            }`}
          >
            <SwatchThumb option={c} />
            {c.color}
          </button>
        ))}
      </div>
    </div>
  );
}
