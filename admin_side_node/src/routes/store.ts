import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db.js";
import { mapCategory, mapProduct, mapReview, productInclude } from "../mappers.js";
import {
  nextOrderReference,
  syncOrderStock,
} from "../services/orders.js";
import { roundMoney, requirePositivePrice } from "../lib/utils.js";

export async function registerStoreRoutes(app: FastifyInstance) {
  app.get("/api/health", async () => ({ ok: true, engine: "tiger-node" }));

  app.get("/api/categories", async () => {
    const rows = await prisma.category.findMany({
      where: { published: true },
      include: { attributeSet: true },
      orderBy: { listPosition: "asc" },
    });
    return { data: rows.map(mapCategory) };
  });

  app.get("/api/products", async (request) => {
    const q = request.query as {
      featured?: string;
      category?: string;
      slug?: string;
      limit?: string;
    };

    const rows = await prisma.product.findMany({
      where: {
        published: true,
        ...(q.featured === "true" ? { highlightOnHomepage: true } : {}),
        ...(q.slug ? { linkName: q.slug } : {}),
        ...(q.category
          ? { category: { linkName: q.category, published: true } }
          : {}),
      },
      include: productInclude,
      orderBy: { createdAt: "desc" },
      take: q.limit ? Number(q.limit) : undefined,
    });

    return { data: rows.map(mapProduct) };
  });

  app.get("/api/products/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const row = await prisma.product.findFirst({
      where: { linkName: slug, published: true },
      include: productInclude,
    });
    if (!row) return reply.code(404).send({ error: "Not found" });
    return { data: mapProduct(row) };
  });

  app.get("/api/homepage", async () => {
    const row = await prisma.homepage.findFirst({ orderBy: { createdAt: "asc" } });
    return { data: row?.data ?? null };
  });

  app.get("/api/reviews", async (request) => {
    const q = request.query as { productId?: string; productSlug?: string };
    const rows = await prisma.review.findMany({
      where: {
        showOnWebsite: true,
        ...(q.productId ? { productId: q.productId } : {}),
        ...(q.productSlug
          ? { product: { linkName: q.productSlug } }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return { data: rows.map(mapReview) };
  });

  app.post("/api/reviews", async (request, reply) => {
    const body = z
      .object({
        productId: z.string().optional(),
        productSlug: z.string().optional(),
        customer_name: z.string().min(1),
        stars: z.number().int().min(1).max(5),
        title: z.string().optional().nullable(),
        comment: z.string().min(1),
      })
      .parse(request.body);

    const product = body.productId
      ? await prisma.product.findUnique({ where: { id: body.productId } })
      : body.productSlug
        ? await prisma.product.findUnique({ where: { linkName: body.productSlug } })
        : null;

    if (!product) return reply.code(400).send({ error: "Product required" });

    const review = await prisma.review.create({
      data: {
        productId: product.id,
        customerName: body.customer_name.trim(),
        stars: body.stars,
        title: body.title?.trim() || null,
        comment: body.comment.trim(),
        showOnWebsite: true,
      },
    });

    return { data: mapReview(review) };
  });

  app.post("/api/orders", async (request, reply) => {
    const body = z
      .object({
        customer_name: z.string().min(1),
        phone: z.string().min(1),
        delivery_address: z.string().optional().nullable(),
        customer_notes: z.string().optional().nullable(),
        order_status: z
          .enum(["placed", "paid", "pending", "completed", "cancelled"])
          .optional(),
        subtotal: z.number(),
        total: z.number(),
        what_they_ordered: z.array(
          z.object({
            product_name: z.string(),
            item_code: z.string().optional().nullable(),
            size: z.string().optional().nullable(),
            color: z.string().optional().nullable(),
            options_snapshot: z.any().optional().nullable(),
            how_many: z.number().int().positive(),
            price_each: z.number().positive(),
            bought_as: z.enum(["one_piece", "many_pieces"]).optional(),
            row_total: z.number().positive(),
            image_url: z.string().optional().nullable(),
          }),
        ),
      })
      .parse(request.body);

    const order = await prisma.order.create({
      data: {
        orderReference: await nextOrderReference(),
        customerName: body.customer_name.trim(),
        phone: body.phone.trim(),
        deliveryAddress: body.delivery_address?.trim() || null,
        customerNotes: body.customer_notes?.trim() || null,
        orderStatus: body.order_status ?? "placed",
        subtotal: roundMoney(body.subtotal),
        total: roundMoney(body.total),
        items: {
          create: body.what_they_ordered.map((item) => ({
            productName: item.product_name,
            itemCode: item.item_code ?? null,
            size: item.size ?? null,
            color: item.color ?? null,
            optionsSnapshot: item.options_snapshot ?? null,
            howMany: item.how_many,
            priceEach: requirePositivePrice(item.price_each, "Line price"),
            boughtAs: item.bought_as ?? "one_piece",
            rowTotal: requirePositivePrice(item.row_total, "Line total"),
            imageUrl: item.image_url ?? null,
          })),
        },
      },
      include: { items: true },
    });

    await syncOrderStock(order.id);

    return {
      data: {
        id: order.id,
        documentId: order.id,
        order_reference: order.orderReference,
        order_number: order.orderReference,
      },
    };
  });

  app.get("/api/orders/by-reference/:ref", async (request, reply) => {
    const { ref } = request.params as { ref: string };
    const order = await prisma.order.findUnique({
      where: { orderReference: decodeURIComponent(ref).trim() },
      include: { items: true },
    });
    if (!order) return reply.code(404).send({ error: "Not found" });

    return {
      data: {
        order_reference: order.orderReference,
        customer_name: order.customerName,
        phone: order.phone,
        delivery_address: order.deliveryAddress,
        customer_notes: order.customerNotes,
        order_status: order.orderStatus,
        subtotal: order.subtotal,
        total: order.total,
        createdAt: order.createdAt.toISOString(),
        what_they_ordered: order.items.map((item) => ({
          product_name: item.productName,
          size: item.size,
          color: item.color,
          options_snapshot: item.optionsSnapshot,
          item_code: item.itemCode,
          how_many: item.howMany,
          price_each: item.priceEach,
          bought_as: item.boughtAs,
          row_total: item.rowTotal,
          image_url: item.imageUrl,
        })),
      },
    };
  });

  app.post("/api/orders/:id/mark-paid", async (request, reply) => {
    const { id } = request.params as { id: string };
    const order = await prisma.order.findFirst({
      where: { OR: [{ id }, { orderReference: id }] },
    });
    if (!order) return reply.code(404).send({ error: "Not found" });

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { orderStatus: "paid" },
    });
    await syncOrderStock(updated.id);
    return { data: { id: updated.id, order_status: updated.orderStatus } };
  });
}
