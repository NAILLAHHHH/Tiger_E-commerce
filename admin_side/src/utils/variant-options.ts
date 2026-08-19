import type { Core } from '@strapi/strapi';

export type AttributeSeed = {
  name: string;
  code: string;
  display_type: 'select' | 'swatch' | 'text';
  list_position: number;
};

export type AttributeSetSeed = {
  name: string;
  code: string;
  attribute_codes: string[];
};

export const CORE_ATTRIBUTES: AttributeSeed[] = [
  { name: 'Size', code: 'size', display_type: 'select', list_position: 1 },
  { name: 'Color', code: 'color', display_type: 'swatch', list_position: 2 },
  { name: 'Storage', code: 'storage', display_type: 'select', list_position: 3 },
  { name: 'Pack', code: 'pack', display_type: 'select', list_position: 4 },
  { name: 'Weight', code: 'weight', display_type: 'select', list_position: 5 },
];

export const CORE_ATTRIBUTE_SETS: AttributeSetSeed[] = [
  { name: 'Apparel', code: 'apparel', attribute_codes: ['size', 'color'] },
  { name: 'Grocery', code: 'grocery', attribute_codes: ['pack', 'weight'] },
  { name: 'Electronics', code: 'electronics', attribute_codes: ['storage', 'color'] },
];

export function slugifyOptionCode(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

type AttributeRow = {
  id: number;
  code?: string | null;
  name?: string | null;
  display_type?: string | null;
  list_position?: number | null;
};

type AttributeValueRow = {
  id: number;
  label?: string | null;
  code?: string | null;
  meta?: Record<string, unknown> | null;
  attribute?: AttributeRow | number | null;
};

type OptionValueLike = {
  label?: string | null;
  code?: string | null;
  meta?: { hex?: string } | Record<string, unknown> | null;
  attribute?: {
    name?: string | null;
    code?: string | null;
    display_type?: string | null;
    list_position?: number | null;
  } | null;
};

/** Human-readable option string for audit logs and orders. */
export function optionsLabelFromValues(
  values: OptionValueLike[] | null | undefined,
  fallback?: { size?: string | null; color?: string | null },
): string {
  const parts: string[] = [];

  if (values?.length) {
    const sorted = [...values].sort((a, b) => {
      const ap = Number(a.attribute?.list_position ?? 0);
      const bp = Number(b.attribute?.list_position ?? 0);
      return ap - bp;
    });
    for (const value of sorted) {
      const name = value.attribute?.name ?? value.attribute?.code;
      const label = value.label;
      if (name && label) parts.push(`${name} ${label}`);
      else if (label) parts.push(label);
    }
  }

  if (!parts.length && fallback) {
    if (fallback.size) parts.push(`Size ${fallback.size}`);
    if (fallback.color) parts.push(`Color ${fallback.color}`);
  }

  return parts.join(' · ');
}

export async function ensureAttribute(
  strapi: Core.Strapi,
  seed: AttributeSeed,
): Promise<AttributeRow> {
  const existing = await strapi.db.query('api::attribute.attribute').findOne({
    where: { code: seed.code },
  });
  if (existing) return existing as AttributeRow;

  return (await strapi.db.query('api::attribute.attribute').create({
    data: {
      name: seed.name,
      code: seed.code,
      display_type: seed.display_type,
      list_position: seed.list_position,
    },
  })) as AttributeRow;
}

export async function ensureAttributeValue(
  strapi: Core.Strapi,
  attributeId: number,
  label: string,
  options?: { code?: string; meta?: Record<string, unknown> | null; list_position?: number },
): Promise<AttributeValueRow> {
  const code = options?.code || slugifyOptionCode(label) || 'value';

  const existing = await strapi.db.query('api::attribute-value.attribute-value').findOne({
    where: {
      code,
      attribute: attributeId,
    },
    populate: ['attribute'],
  });

  if (existing) {
    const meta = options?.meta;
    if (meta && JSON.stringify(existing.meta ?? null) !== JSON.stringify(meta)) {
      return (await strapi.db.query('api::attribute-value.attribute-value').update({
        where: { id: existing.id },
        data: { meta },
        populate: ['attribute'],
      })) as AttributeValueRow;
    }
    return existing as AttributeValueRow;
  }

  return (await strapi.db.query('api::attribute-value.attribute-value').create({
    data: {
      label,
      code,
      meta: options?.meta ?? null,
      list_position: options?.list_position ?? 0,
      attribute: attributeId,
    },
    populate: ['attribute'],
  })) as AttributeValueRow;
}

/** Seed Size/Color/Storage/Pack/Weight + Apparel/Grocery/Electronics sets. */
export async function seedCoreAttributes(strapi: Core.Strapi) {
  const byCode = new Map<string, AttributeRow>();

  for (const seed of CORE_ATTRIBUTES) {
    const row = await ensureAttribute(strapi, seed);
    byCode.set(seed.code, row);
  }

  for (const setSeed of CORE_ATTRIBUTE_SETS) {
    const existing = await strapi.db.query('api::attribute-set.attribute-set').findOne({
      where: { code: setSeed.code },
      populate: ['attributes'],
    });

    const attributeIds = setSeed.attribute_codes
      .map((code) => byCode.get(code)?.id)
      .filter((id): id is number => id != null);

    if (existing) {
      await strapi.db.query('api::attribute-set.attribute-set').update({
        where: { id: existing.id },
        data: { name: setSeed.name, attributes: attributeIds },
      });
      continue;
    }

    await strapi.db.query('api::attribute-set.attribute-set').create({
      data: {
        name: setSeed.name,
        code: setSeed.code,
        attributes: attributeIds,
      },
    });
  }
}

/**
 * Copy legacy size/color columns into option_values relations.
 * Safe to run repeatedly — only adds missing links.
 */
export async function migrateLegacyVariantOptions(strapi: Core.Strapi) {
  const sizeAttr = await ensureAttribute(strapi, CORE_ATTRIBUTES[0]);
  const colorAttr = await ensureAttribute(strapi, CORE_ATTRIBUTES[1]);

  const variants = await strapi.db.query('api::product-variant.product-variant').findMany({
    populate: ['option_values', 'product'],
    limit: 2000,
  });

  let linked = 0;

  for (const variant of variants) {
    const current = (variant.option_values as AttributeValueRow[] | undefined) ?? [];
    const currentIds = new Set(current.map((v) => v.id));
    const nextIds = [...currentIds];

    const size = typeof variant.size === 'string' ? variant.size.trim() : '';
    const color = typeof variant.color === 'string' ? variant.color.trim() : '';
    const colorDot =
      typeof variant.color_dot === 'string' && variant.color_dot.trim()
        ? variant.color_dot.trim()
        : null;

    if (size) {
      const value = await ensureAttributeValue(strapi, sizeAttr.id, size);
      if (!currentIds.has(value.id)) {
        nextIds.push(value.id);
        linked += 1;
      }
    }

    if (color) {
      const value = await ensureAttributeValue(strapi, colorAttr.id, color, {
        meta: colorDot ? { hex: colorDot } : null,
      });
      if (!currentIds.has(value.id)) {
        nextIds.push(value.id);
        linked += 1;
      }
    }

    if (nextIds.length !== currentIds.size) {
      await strapi.db.query('api::product-variant.product-variant').update({
        where: { id: variant.id },
        data: { option_values: nextIds },
      });
    }
  }

  if (linked > 0) {
    strapi.log.info(`Linked ${linked} legacy size/color value(s) onto product variants`);
  }
}

/**
 * When staff/CSV still fill size + color, attach matching option_values.
 * Returns ids to set on create/update data.
 */
export async function resolveOptionValueIdsFromLegacy(
  strapi: Core.Strapi,
  data: {
    size?: unknown;
    color?: unknown;
    color_dot?: unknown;
    option_values?: unknown;
  },
): Promise<number[] | null> {
  const existing = data.option_values;
  if (Array.isArray(existing) && existing.length > 0) {
    return null; // caller already set options explicitly
  }

  const size = typeof data.size === 'string' ? data.size.trim() : '';
  const color = typeof data.color === 'string' ? data.color.trim() : '';
  if (!size && !color) return null;

  const sizeAttr = await ensureAttribute(strapi, CORE_ATTRIBUTES[0]);
  const colorAttr = await ensureAttribute(strapi, CORE_ATTRIBUTES[1]);
  const ids: number[] = [];

  if (size) {
    const value = await ensureAttributeValue(strapi, sizeAttr.id, size);
    ids.push(value.id);
  }

  if (color) {
    const hex =
      typeof data.color_dot === 'string' && data.color_dot.trim()
        ? data.color_dot.trim()
        : null;
    const value = await ensureAttributeValue(strapi, colorAttr.id, color, {
      meta: hex ? { hex } : null,
    });
    ids.push(value.id);
  }

  return ids;
}

/** Load option values for audit logging. */
export async function loadVariantOptionValues(
  strapi: Core.Strapi,
  variantId: number,
): Promise<OptionValueLike[]> {
  const variant = await strapi.db.query('api::product-variant.product-variant').findOne({
    where: { id: variantId },
    populate: {
      option_values: {
        populate: ['attribute'],
      },
    },
  });

  return ((variant?.option_values as OptionValueLike[] | undefined) ?? []);
}
