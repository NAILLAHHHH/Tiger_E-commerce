import { prisma } from "../db.js";
import { optionsLabel, roundMoney } from "../lib/utils.js";

const RESERVE_STATUSES = new Set([
  "placed",
  "paid",
  "pending",
  "completed",
]);

export async function syncOrderStock(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return null;

  const shouldDeduct = RESERVE_STATUSES.has(order.orderStatus);
  const wasDeducted = order.stockDeducted;

  if (shouldDeduct && !wasDeducted) {
    for (const item of order.items) {
      if (!item.itemCode || item.howMany <= 0) continue;
      const variant = await prisma.productVariant.findUnique({
        where: { itemCode: item.itemCode },
      });
      if (!variant) continue;
      await prisma.productVariant.update({
        where: { id: variant.id },
        data: {
          howManyLeft: Math.max(0, variant.howManyLeft - item.howMany),
        },
      });
    }
    return prisma.order.update({
      where: { id: orderId },
      data: { stockDeducted: true },
    });
  }

  if (order.orderStatus === "cancelled" && wasDeducted) {
    for (const item of order.items) {
      if (!item.itemCode || item.howMany <= 0) continue;
      const variant = await prisma.productVariant.findUnique({
        where: { itemCode: item.itemCode },
      });
      if (!variant) continue;
      await prisma.productVariant.update({
        where: { id: variant.id },
        data: { howManyLeft: variant.howManyLeft + item.howMany },
      });
    }
    return prisma.order.update({
      where: { id: orderId },
      data: { stockDeducted: false },
    });
  }

  return order;
}

export async function nextOrderReference() {
  const day = new Date();
  const y = day.getFullYear();
  const m = String(day.getMonth() + 1).padStart(2, "0");
  const d = String(day.getDate()).padStart(2, "0");
  const prefix = `TW-${y}${m}${d}-`;
  const count = await prisma.order.count({
    where: { orderReference: { startsWith: prefix } },
  });
  return `${prefix}${String(count + 1).padStart(4, "0")}`;
}

export async function logStockChange(opts: {
  variantId: string;
  before: number;
  after: number;
  reason: string;
  source?: "admin" | "import" | "system" | "api";
  movementType?: "restock" | "adjustment" | "import" | "initial" | "count";
}) {
  const before = Math.max(0, Math.round(opts.before));
  const after = Math.max(0, Math.round(opts.after));
  const delta = after - before;
  if (delta === 0 && opts.movementType !== "count") return;

  const variant = await prisma.productVariant.findUnique({
    where: { id: opts.variantId },
    include: {
      product: true,
      optionValues: {
        include: { attributeValue: { include: { attribute: true } } },
      },
    },
  });
  if (!variant) return;

  const movementType =
    opts.movementType ??
    (after > before ? "restock" : "adjustment");

  await prisma.inventoryMovement.create({
    data: {
      movementType,
      quantityDelta: delta,
      quantityBefore: before,
      quantityAfter: after,
      itemCode: variant.itemCode,
      optionsLabel: optionsLabel(
        variant.optionValues.map((ov) => ({
          label: ov.attributeValue.label,
          attribute: ov.attributeValue.attribute,
        })),
        { size: variant.size, color: variant.color },
      ),
      productName: variant.product.name,
      reason: opts.reason,
      source: opts.source ?? "admin",
      variantId: variant.id,
    },
  });
}

export async function logPriceChanges(opts: {
  variantId: string;
  before: { priceForOne: number; priceForBulk: number | null };
  after: { priceForOne: number; priceForBulk: number | null };
  reason: string;
}) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: opts.variantId },
    include: {
      product: true,
      optionValues: {
        include: { attributeValue: { include: { attribute: true } } },
      },
    },
  });
  if (!variant) return;

  const label = optionsLabel(
    variant.optionValues.map((ov) => ({
      label: ov.attributeValue.label,
      attribute: ov.attributeValue.attribute,
    })),
    { size: variant.size, color: variant.color },
  );

  const fields: Array<{
    field: "price_for_one" | "price_for_bulk";
    before: number | null;
    after: number | null;
  }> = [
    {
      field: "price_for_one",
      before: roundMoney(opts.before.priceForOne),
      after: roundMoney(opts.after.priceForOne),
    },
    {
      field: "price_for_bulk",
      before:
        opts.before.priceForBulk == null
          ? null
          : roundMoney(opts.before.priceForBulk),
      after:
        opts.after.priceForBulk == null
          ? null
          : roundMoney(opts.after.priceForBulk),
    },
  ];

  for (const row of fields) {
    if (row.before === row.after) continue;
    await prisma.priceHistory.create({
      data: {
        priceField: row.field,
        priceBefore: row.before,
        priceAfter: row.after,
        itemCode: variant.itemCode,
        optionsLabel: label,
        productName: variant.product.name,
        reason: opts.reason,
        source: "admin",
        variantId: variant.id,
      },
    });
  }
}
