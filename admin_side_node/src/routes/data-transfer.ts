import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAdmin } from "../lib/auth.js";
import {
  parseBoolean,
  parseCsv,
  parseInteger,
  parseNumber,
  rowsToCsv,
} from "../lib/csv.js";
import { slugify, roundMoney, requirePositivePrice, requireOptionalPositivePrice } from "../lib/utils.js";
import { logStockChange, nextOrderReference } from "../services/orders.js";

const CONTENT_TYPES = {
  categories: {
    key: "categories",
    label: "Categories",
    description: "Shop sections",
    exportHeaders: ["name", "link_name", "list_position"],
    templateHeaders: ["name", "list_position"],
    templateExample: { name: "T-Shirts", list_position: "1" },
  },
  products: {
    key: "products",
    label: "Products",
    description: "Catalog items (add SKUs via variants)",
    exportHeaders: [
      "name",
      "link_name",
      "description",
      "highlight_on_homepage",
      "mark_as_new",
      "category_name",
    ],
    templateHeaders: [
      "name",
      "description",
      "highlight_on_homepage",
      "mark_as_new",
      "category_name",
    ],
    templateExample: {
      name: "Classic Tiger Tee",
      description: "Soft cotton tee",
      highlight_on_homepage: "false",
      mark_as_new: "true",
      category_name: "T-Shirts",
    },
  },
  "product-variants": {
    key: "product-variants",
    label: "Product variants",
    description: "One row per SKU",
    exportHeaders: [
      "item_code",
      "size",
      "color",
      "color_dot",
      "price_for_one",
      "price_for_bulk",
      "min_quantity_for_bulk",
      "how_many_left",
      "product_name",
    ],
    templateHeaders: [
      "item_code",
      "size",
      "color",
      "color_dot",
      "price_for_one",
      "price_for_bulk",
      "min_quantity_for_bulk",
      "how_many_left",
      "product_name",
    ],
    templateExample: {
      item_code: "Tiger-Tee-M-Black",
      size: "M",
      color: "Black",
      color_dot: "#000000",
      price_for_one: "15000",
      price_for_bulk: "12000",
      min_quantity_for_bulk: "10",
      how_many_left: "25",
      product_name: "Classic Tiger Tee",
    },
  },
  orders: {
    key: "orders",
    label: "Orders",
    description: "One row per line item",
    exportHeaders: [
      "order_reference",
      "customer_name",
      "phone",
      "delivery_address",
      "customer_notes",
      "order_status",
      "subtotal",
      "total",
      "product_name",
      "size",
      "color",
      "item_code",
      "how_many",
      "price_each",
      "bought_as",
      "row_total",
      "image_url",
      "created_at",
    ],
    templateHeaders: [
      "order_group",
      "customer_name",
      "phone",
      "delivery_address",
      "customer_notes",
      "order_status",
      "subtotal",
      "total",
      "product_name",
      "size",
      "color",
      "item_code",
      "how_many",
      "price_each",
      "bought_as",
      "row_total",
      "image_url",
    ],
    templateExample: {
      order_group: "1",
      customer_name: "Jean Mukamana",
      phone: "+250788123456",
      delivery_address: "Kigali",
      customer_notes: "",
      order_status: "placed",
      subtotal: "30000",
      total: "30000",
      product_name: "Classic Tiger Tee",
      size: "M",
      color: "Black",
      item_code: "Tiger-Tee-M-Black",
      how_many: "2",
      price_each: "15000",
      bought_as: "one_piece",
      row_total: "30000",
      image_url: "",
    },
  },
  "inventory-movements": {
    key: "inventory-movements",
    label: "Stock movements",
    description: "Export-only audit log",
    exportHeaders: [
      "created_at",
      "movement_type",
      "item_code",
      "product_name",
      "options_label",
      "quantity_delta",
      "quantity_before",
      "quantity_after",
      "source",
      "reason",
    ],
    templateHeaders: [] as string[],
    templateExample: null as null,
    exportOnly: true,
  },
  "price-histories": {
    key: "price-histories",
    label: "Price changes",
    description: "Export-only audit log",
    exportHeaders: [
      "created_at",
      "price_field",
      "item_code",
      "product_name",
      "options_label",
      "price_before",
      "price_after",
      "source",
      "reason",
    ],
    templateHeaders: [] as string[],
    templateExample: null as null,
    exportOnly: true,
  },
} as const;

type ContentKey = keyof typeof CONTENT_TYPES;

async function ensureOptionValue(
  attrCode: string,
  attrName: string,
  label: string,
  meta?: object,
) {
  const attr = await prisma.attribute.upsert({
    where: { code: attrCode },
    create: {
      name: attrName,
      code: attrCode,
      displayType: attrCode === "color" ? "swatch" : "select",
      listPosition: attrCode === "size" ? 1 : 2,
    },
    update: {},
  });
  return prisma.attributeValue.upsert({
    where: {
      attributeId_code: { attributeId: attr.id, code: slugify(label) },
    },
    create: {
      attributeId: attr.id,
      label,
      code: slugify(label),
      meta: meta ?? undefined,
    },
    update: { meta: meta ?? undefined },
  });
}

async function exportRows(key: ContentKey) {
  if (key === "categories") {
    const rows = await prisma.category.findMany({ orderBy: { listPosition: "asc" } });
    return rows.map((c) => ({
      name: c.name,
      link_name: c.linkName,
      list_position: c.listPosition,
    }));
  }
  if (key === "products") {
    const rows = await prisma.product.findMany({
      include: { category: true },
      orderBy: { name: "asc" },
    });
    return rows.map((p) => ({
      name: p.name,
      link_name: p.linkName,
      description: p.description ?? "",
      highlight_on_homepage: p.highlightOnHomepage ? "true" : "false",
      mark_as_new: p.markAsNew ? "true" : "false",
      category_name: p.category?.name ?? "",
    }));
  }
  if (key === "product-variants") {
    const rows = await prisma.productVariant.findMany({
      include: { product: true },
      orderBy: { itemCode: "asc" },
    });
    return rows.map((v) => ({
      item_code: v.itemCode,
      size: v.size ?? "",
      color: v.color ?? "",
      color_dot: v.colorDot ?? "",
      price_for_one: v.priceForOne,
      price_for_bulk: v.priceForBulk ?? "",
      min_quantity_for_bulk: v.minQuantityForBulk,
      how_many_left: v.howManyLeft,
      product_name: v.product.name,
    }));
  }
  if (key === "orders") {
    const orders = await prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    const out: Array<Record<string, unknown>> = [];
    for (const order of orders) {
      if (!order.items.length) {
        out.push({
          order_reference: order.orderReference,
          customer_name: order.customerName,
          phone: order.phone,
          delivery_address: order.deliveryAddress ?? "",
          customer_notes: order.customerNotes ?? "",
          order_status: order.orderStatus,
          subtotal: order.subtotal,
          total: order.total,
          product_name: "",
          size: "",
          color: "",
          item_code: "",
          how_many: "",
          price_each: "",
          bought_as: "",
          row_total: "",
          image_url: "",
          created_at: order.createdAt.toISOString(),
        });
        continue;
      }
      for (const item of order.items) {
        out.push({
          order_reference: order.orderReference,
          customer_name: order.customerName,
          phone: order.phone,
          delivery_address: order.deliveryAddress ?? "",
          customer_notes: order.customerNotes ?? "",
          order_status: order.orderStatus,
          subtotal: order.subtotal,
          total: order.total,
          product_name: item.productName,
          size: item.size ?? "",
          color: item.color ?? "",
          item_code: item.itemCode ?? "",
          how_many: item.howMany,
          price_each: item.priceEach,
          bought_as: item.boughtAs,
          row_total: item.rowTotal,
          image_url: item.imageUrl ?? "",
          created_at: order.createdAt.toISOString(),
        });
      }
    }
    return out;
  }
  if (key === "inventory-movements") {
    const rows = await prisma.inventoryMovement.findMany({
      orderBy: { createdAt: "asc" },
    });
    return rows.map((r) => ({
      created_at: r.createdAt.toISOString(),
      movement_type: r.movementType,
      item_code: r.itemCode ?? "",
      product_name: r.productName ?? "",
      options_label: r.optionsLabel ?? "",
      quantity_delta: r.quantityDelta,
      quantity_before: r.quantityBefore,
      quantity_after: r.quantityAfter,
      source: r.source,
      reason: r.reason ?? "",
    }));
  }
  const rows = await prisma.priceHistory.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map((r) => ({
    created_at: r.createdAt.toISOString(),
    price_field: r.priceField,
    item_code: r.itemCode ?? "",
    product_name: r.productName ?? "",
    options_label: r.optionsLabel ?? "",
    price_before: r.priceBefore ?? "",
    price_after: r.priceAfter ?? "",
    source: r.source,
    reason: r.reason ?? "",
  }));
}

async function importRows(key: ContentKey, csvText: string) {
  const { rows } = parseCsv(csvText);
  const result = { created: 0, updated: 0, skipped: 0, errors: [] as string[] };

  if (key === "categories") {
    for (const [i, row] of rows.entries()) {
      try {
        const name = row.name?.trim();
        if (!name) {
          result.skipped += 1;
          continue;
        }
        const existing = await prisma.category.findFirst({ where: { name } });
        if (existing) {
          await prisma.category.update({
            where: { id: existing.id },
            data: { listPosition: parseInteger(row.list_position, existing.listPosition) },
          });
          result.updated += 1;
        } else {
          await prisma.category.create({
            data: {
              name,
              linkName: slugify(name),
              listPosition: parseInteger(row.list_position, 0),
              published: true,
            },
          });
          result.created += 1;
        }
      } catch (e) {
        result.errors.push(`Row ${i + 2}: ${(e as Error).message}`);
      }
    }
    return result;
  }

  if (key === "products") {
    for (const [i, row] of rows.entries()) {
      try {
        const name = row.name?.trim();
        if (!name) {
          result.skipped += 1;
          continue;
        }
        let categoryId: string | null = null;
        if (row.category_name?.trim()) {
          const cat = await prisma.category.findFirst({
            where: { name: row.category_name.trim() },
          });
          categoryId = cat?.id ?? null;
        }
        const data = {
          description: row.description || null,
          highlightOnHomepage: parseBoolean(row.highlight_on_homepage),
          markAsNew: parseBoolean(row.mark_as_new),
          categoryId,
        };
        const existing = await prisma.product.findFirst({ where: { name } });
        if (existing) {
          await prisma.product.update({ where: { id: existing.id }, data });
          result.updated += 1;
        } else {
          await prisma.product.create({
            data: {
              name,
              linkName: slugify(name),
              published: true,
              ...data,
            },
          });
          result.created += 1;
        }
      } catch (e) {
        result.errors.push(`Row ${i + 2}: ${(e as Error).message}`);
      }
    }
    return result;
  }

  if (key === "product-variants") {
    for (const [i, row] of rows.entries()) {
      try {
        const itemCode = row.item_code?.trim();
        const productName = row.product_name?.trim();
        if (!itemCode || !productName) {
          result.skipped += 1;
          continue;
        }
        const product = await prisma.product.findFirst({ where: { name: productName } });
        if (!product) {
          result.errors.push(`Row ${i + 2}: product "${productName}" not found`);
          continue;
        }

        const valueIds: string[] = [];
        if (row.size?.trim()) {
          valueIds.push((await ensureOptionValue("size", "Size", row.size.trim())).id);
        }
        if (row.color?.trim()) {
          valueIds.push(
            (
              await ensureOptionValue(
                "color",
                "Color",
                row.color.trim(),
                row.color_dot?.trim() ? { hex: row.color_dot.trim() } : undefined,
              )
            ).id,
          );
        }

        const stock = parseInteger(row.how_many_left, 0);
        let priceForOne: number;
        let priceForBulk: number | null;
        try {
          priceForOne = requirePositivePrice(
            parseNumber(row.price_for_one, 0),
            "price_for_one",
          );
          const bulkRaw = row.price_for_bulk?.trim();
          priceForBulk = bulkRaw
            ? requireOptionalPositivePrice(parseNumber(bulkRaw, 0), "price_for_bulk")
            : null;
        } catch (e) {
          result.errors.push(`Row ${i + 2}: ${(e as Error).message}`);
          continue;
        }
        const existing = await prisma.productVariant.findUnique({ where: { itemCode } });

        if (existing) {
          const before = existing.howManyLeft;
          await prisma.productVariantOptionValue.deleteMany({
            where: { variantId: existing.id },
          });
          await prisma.productVariant.update({
            where: { id: existing.id },
            data: {
              productId: product.id,
              priceForOne,
              priceForBulk,
              minQuantityForBulk: parseInteger(row.min_quantity_for_bulk, 10),
              howManyLeft: stock,
              size: row.size?.trim() || null,
              color: row.color?.trim() || null,
              colorDot: row.color_dot?.trim() || null,
              optionValues: {
                create: [...new Set(valueIds)].map((attributeValueId) => ({
                  attributeValueId,
                })),
              },
            },
          });
          if (stock !== before) {
            await logStockChange({
              variantId: existing.id,
              before,
              after: stock,
              reason: "CSV import",
              source: "import",
              movementType: "import",
            });
          }
          result.updated += 1;
        } else {
          const created = await prisma.productVariant.create({
            data: {
              productId: product.id,
              itemCode,
              priceForOne,
              priceForBulk,
              minQuantityForBulk: parseInteger(row.min_quantity_for_bulk, 10),
              howManyLeft: stock,
              size: row.size?.trim() || null,
              color: row.color?.trim() || null,
              colorDot: row.color_dot?.trim() || null,
              optionValues: {
                create: [...new Set(valueIds)].map((attributeValueId) => ({
                  attributeValueId,
                })),
              },
            },
          });
          if (stock > 0) {
            await logStockChange({
              variantId: created.id,
              before: 0,
              after: stock,
              reason: "CSV import",
              source: "import",
              movementType: "import",
            });
          }
          result.created += 1;
        }
      } catch (e) {
        result.errors.push(`Row ${i + 2}: ${(e as Error).message}`);
      }
    }
    return result;
  }

  if (key === "orders") {
    const groups = new Map<string, typeof rows>();
    for (const row of rows) {
      const keyName =
        row.order_group?.trim() ||
        row.order_reference?.trim() ||
        `${row.customer_name}-${row.phone}-${row.total}`;
      const list = groups.get(keyName) ?? [];
      list.push(row);
      groups.set(keyName, list);
    }

    for (const [, groupRows] of groups) {
      try {
        const head = groupRows[0];
        const ref =
          head.order_reference?.trim() || (await nextOrderReference());
        const existing = await prisma.order.findUnique({
          where: { orderReference: ref },
        });
        if (existing) {
          result.skipped += 1;
          continue;
        }

        const items = groupRows
          .filter((r) => r.product_name?.trim())
          .map((r) => {
            const howMany = parseInteger(r.how_many, 1);
            const priceEach = roundMoney(parseNumber(r.price_each, 0));
            return {
              productName: r.product_name.trim(),
              itemCode: r.item_code?.trim() || null,
              size: r.size?.trim() || null,
              color: r.color?.trim() || null,
              howMany,
              priceEach,
              boughtAs:
                r.bought_as === "many_pieces" ? ("many_pieces" as const) : ("one_piece" as const),
              rowTotal: roundMoney(parseNumber(r.row_total, howMany * priceEach)),
              imageUrl: r.image_url?.trim() || null,
            };
          });

        await prisma.order.create({
          data: {
            orderReference: ref,
            customerName: head.customer_name?.trim() || "Customer",
            phone: head.phone?.trim() || "",
            deliveryAddress: head.delivery_address?.trim() || null,
            customerNotes: head.customer_notes?.trim() || null,
            orderStatus: (["placed", "paid", "pending", "completed", "cancelled"].includes(
              head.order_status,
            )
              ? head.order_status
              : "placed") as
              | "placed"
              | "paid"
              | "pending"
              | "completed"
              | "cancelled",
            subtotal: roundMoney(parseNumber(head.subtotal, 0)),
            total: roundMoney(parseNumber(head.total, 0)),
            items: { create: items },
          },
        });
        result.created += 1;
      } catch (e) {
        result.errors.push((e as Error).message);
      }
    }
    return result;
  }

  result.errors.push("This content type is export-only");
  return result;
}

export async function registerDataTransferRoutes(app: FastifyInstance) {
  app.get(
    "/api/admin/data-transfer/content-types",
    { preHandler: requireAdmin },
    async () => ({
      data: Object.values(CONTENT_TYPES).map((ct) => ({
        key: ct.key,
        label: ct.label,
        description: ct.description,
        exportOnly: "exportOnly" in ct && ct.exportOnly === true,
      })),
    }),
  );

  app.get(
    "/api/admin/data-transfer/template/:contentType",
    { preHandler: requireAdmin },
    async (request, reply) => {
      const { contentType } = request.params as { contentType: string };
      const config = CONTENT_TYPES[contentType as ContentKey];
      if (!config || !config.templateHeaders.length) {
        return reply.code(400).send({ error: "No template for this type" });
      }
      const csv = rowsToCsv(
        [...config.templateHeaders],
        config.templateExample ? [config.templateExample] : [],
      );
      reply.header("Content-Type", "text/csv; charset=utf-8");
      reply.header(
        "Content-Disposition",
        `attachment; filename="${contentType}-template.csv"`,
      );
      return csv;
    },
  );

  app.get(
    "/api/admin/data-transfer/export/:contentType",
    { preHandler: requireAdmin },
    async (request, reply) => {
      const { contentType } = request.params as { contentType: string };
      const config = CONTENT_TYPES[contentType as ContentKey];
      if (!config) return reply.code(404).send({ error: "Unknown content type" });
      const rows = await exportRows(contentType as ContentKey);
      const csv = rowsToCsv([...config.exportHeaders], rows);
      return {
        data: {
          format: "csv",
          count: rows.length,
          filename: `${contentType}-export.csv`,
          mimeType: "text/csv",
          content: csv,
        },
      };
    },
  );

  app.post(
    "/api/admin/data-transfer/import/:contentType",
    { preHandler: requireAdmin },
    async (request, reply) => {
      const { contentType } = request.params as { contentType: string };
      const config = CONTENT_TYPES[contentType as ContentKey];
      if (!config) return reply.code(404).send({ error: "Unknown content type" });
      if ("exportOnly" in config && config.exportOnly) {
        return reply.code(400).send({ error: "Export-only content type" });
      }
      const body = z.object({ csv: z.string().min(1) }).parse(request.body);
      const data = await importRows(contentType as ContentKey, body.csv);
      return { data };
    },
  );
}
