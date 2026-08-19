import type { ProductVariant, VariantOption } from "@/types/database";

export type OptionAxis = {
  code: string;
  name: string;
  display_type: VariantOption["display_type"];
  values: Array<{
    value: string;
    value_code: string;
    meta: VariantOption["meta"];
    image_url?: string | null;
  }>;
};

export function optionValue(
  variant: ProductVariant,
  code: string,
): string | null {
  const match = (variant.options ?? []).find((o) => o.code === code);
  if (match?.value) return match.value;
  if (code === "size" && variant.size) return variant.size;
  if (code === "color" && variant.color) return variant.color;
  return null;
}

export function formatVariantOptions(
  options: VariantOption[] | null | undefined,
  fallback?: { size?: string; color?: string },
): string {
  if (options?.length) {
    return options
      .map((o) => (o.name ? `${o.name} ${o.value}` : o.value))
      .filter(Boolean)
      .join(" · ");
  }

  const parts: string[] = [];
  if (fallback?.color) parts.push(fallback.color);
  if (fallback?.size) parts.push(`Size ${fallback.size}`);
  return parts.join(" · ");
}

export function cartOptionsLabel(item: {
  options?: VariantOption[] | Array<{ name: string; value: string }>;
  size?: string;
  color?: string;
}): string {
  if (item.options?.length) {
    return item.options
      .map((o) => ("name" in o && o.name ? `${o.name} ${o.value}` : o.value))
      .join(" · ");
  }
  return formatVariantOptions(undefined, {
    size: item.size,
    color: item.color,
  });
}

/** Unique option axes across variants, ordered by list_position. */
export function getProductOptionAxes(variants: ProductVariant[]): OptionAxis[] {
  const axisMap = new Map<string, OptionAxis>();

  for (const variant of variants) {
    const options =
      variant.options?.length > 0
        ? variant.options
        : legacyOptionsFromVariant(variant);

    for (const option of options) {
      let axis = axisMap.get(option.code);
      if (!axis) {
        axis = {
          code: option.code,
          name: option.name || option.code,
          display_type: option.display_type,
          values: [],
        };
        axisMap.set(option.code, axis);
      }

      if (!axis.values.some((v) => v.value === option.value)) {
        axis.values.push({
          value: option.value,
          value_code: option.value_code,
          meta: option.meta,
          image_url:
            option.code === "color" || option.display_type === "swatch"
              ? variant.image_url
              : null,
        });
      } else if (
        (option.code === "color" || option.display_type === "swatch") &&
        variant.image_url
      ) {
        const existing = axis.values.find((v) => v.value === option.value);
        if (existing && !existing.image_url) {
          existing.image_url = variant.image_url;
        }
      }
    }
  }

  return [...axisMap.values()];
}

export function legacyOptionsFromVariant(
  variant: ProductVariant,
): VariantOption[] {
  const options: VariantOption[] = [];
  if (variant.size) {
    options.push({
      code: "size",
      name: "Size",
      value: variant.size,
      value_code: variant.size.toLowerCase(),
      display_type: "select",
      list_position: 1,
    });
  }
  if (variant.color) {
    options.push({
      code: "color",
      name: "Color",
      value: variant.color,
      value_code: variant.color.toLowerCase(),
      meta: variant.color_hex ? { hex: variant.color_hex } : null,
      display_type: "swatch",
      list_position: 2,
    });
  }
  return options;
}

export function findVariantForSelection(
  variants: ProductVariant[],
  selection: Record<string, string>,
): ProductVariant | undefined {
  const codes = Object.keys(selection);
  if (!codes.length) {
    return variants.find((v) => (v.options?.length ?? 0) === 0) ?? variants[0];
  }

  return variants.find((variant) =>
    codes.every((code) => optionValue(variant, code) === selection[code]),
  );
}

/** Prefer in-stock size/value when the primary (swatch) axis changes. */
export function adjustSelectionForStock(
  variants: ProductVariant[],
  axes: OptionAxis[],
  selection: Record<string, string>,
  changedCode?: string,
): Record<string, string> {
  const next = { ...selection };

  for (const axis of axes) {
    if (changedCode && axis.code === changedCode) continue;
    const current = next[axis.code];
    const available = axis.values.find((value) => {
      const candidate = { ...next, [axis.code]: value.value };
      const variant = findVariantForSelection(variants, candidate);
      return variant && variant.stock_quantity > 0;
    });
    if (available && available.value !== current) {
      next[axis.code] = available.value;
    }
  }

  return next;
}

export function initialSelection(
  variants: ProductVariant[],
  axes: OptionAxis[],
): Record<string, string> {
  const selection: Record<string, string> = {};
  for (const axis of axes) {
    const firstInStock = axis.values.find((value) => {
      const partial = { ...selection, [axis.code]: value.value };
      // Build partial with remaining defaults
      for (const other of axes) {
        if (other.code === axis.code) continue;
        if (!partial[other.code]) {
          partial[other.code] = other.values[0]?.value ?? "";
        }
      }
      const variant = findVariantForSelection(variants, partial);
      return variant && variant.stock_quantity > 0;
    });
    selection[axis.code] =
      firstInStock?.value ?? axis.values[0]?.value ?? "";
  }
  return selection;
}

export function optionsSnapshot(
  variant: ProductVariant,
): Array<{ name: string; value: string; code: string }> {
  const options =
    variant.options?.length > 0
      ? variant.options
      : legacyOptionsFromVariant(variant);
  return options.map((o) => ({
    name: o.name,
    value: o.value,
    code: o.code,
  }));
}
