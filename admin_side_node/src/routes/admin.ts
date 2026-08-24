import type { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";
import { requireAdmin } from "../lib/auth.js";
import { slugify, roundMoney, requirePositivePrice, requireOptionalPositivePrice, requirePositiveStock } from "../lib/utils.js";
import {
  assertOptionValuesMatchKind,
  kindHasAttributeCode,
  requireCategoryKind,
  syncProductsKindForCategory,
  allowedAttributeIdsForProduct,
} from "../lib/catalog.js";
import { logPriceChanges, logStockChange, syncOrderStock } from "../services/orders.js";
import { saveUpload } from "../services/upload.js";
import { mapProduct, productInclude } from "../mappers.js";

const attributeValueInput = z.object({
  id: z.string().optional(),
  label: z.string().min(1),
  meta: z.any().optional().nullable(),
  listPosition: z.number().int().optional(),
});

const attributeInclude = {
  values: { orderBy: { listPosition: "asc" as const } },
};

function uniqueCodes(labels: string[]): string[] {
  const used = new Set<string>();
  return labels.map((label) => {
    const base = slugify(label) || "value";
    let code = base;
    let n = 2;
    while (used.has(code)) {
      code = `${base}-${n}`;
      n += 1;
    }
    used.add(code);
    return code;
  });
}

async function syncAttributeValues(
  attributeId: string,
  values: Array<{
    id?: string;
    label: string;
    meta?: unknown;
    listPosition?: number;
  }>,
) {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.attributeValue.findMany({ where: { attributeId } });
    const incomingIds = new Set(values.map((v) => v.id).filter(Boolean) as string[]);
    const toDelete = existing.filter((row) => !incomingIds.has(row.id));
    if (toDelete.length) {
      await tx.attributeValue.deleteMany({
        where: { id: { in: toDelete.map((row) => row.id) } },
      });
    }

    const codes = uniqueCodes(values.map((v) => v.label));
    for (const value of values) {
      if (value.id && existing.some((row) => row.id === value.id)) {
        await tx.attributeValue.update({
          where: { id: value.id },
          data: { code: `__tmp_${value.id}` },
        });
      }
    }

    for (let i = 0; i < values.length; i += 1) {
      const value = values[i];
      const data = {
        label: value.label.trim(),
        code: codes[i],
        meta:
          value.meta == null
            ? Prisma.JsonNull
            : (value.meta as Prisma.InputJsonValue),
        listPosition: value.listPosition ?? i,
      };
      if (value.id && existing.some((row) => row.id === value.id)) {
        await tx.attributeValue.update({
          where: { id: value.id },
          data,
        });
      } else {
        await tx.attributeValue.create({
          data: { attributeId, ...data },
        });
      }
    }
  });
}

export async function registerAdminRoutes(app: FastifyInstance) {
  app.post("/api/admin/login", async (request, reply) => {
    const body = z
      .object({ email: z.string().email(), password: z.string().min(1) })
      .parse(request.body);

    const user = await prisma.adminUser.findUnique({
      where: { email: body.email.toLowerCase() },
    });
    if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
      return reply.code(401).send({ error: "Invalid email or password" });
    }

    const token = await reply.jwtSign({
      sub: user.id,
      email: user.email,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isOwner: user.isOwner,
      },
    };
  });

  app.get("/api/admin/me", { preHandler: requireAdmin }, async (request) => {
    const payload = request.user as { sub: string };
    const user = await prisma.adminUser.findUnique({ where: { id: payload.sub } });
    return {
      user: user
        ? {
            id: user.id,
            email: user.email,
            name: user.name,
            isOwner: user.isOwner,
          }
        : null,
    };
  });

  // —— Staff users ——
  app.get("/api/admin/users", { preHandler: requireAdmin }, async () => {
    const rows = await prisma.adminUser.findMany({
      orderBy: [{ isOwner: "desc" }, { createdAt: "asc" }],
      select: {
        id: true,
        email: true,
        name: true,
        isOwner: true,
        createdAt: true,
      },
    });
    return { data: rows };
  });

  app.post("/api/admin/users", { preHandler: requireAdmin }, async (request, reply) => {
    const body = z
      .object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().optional().nullable(),
      })
      .parse(request.body);

    const email = body.email.toLowerCase().trim();
    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (existing) {
      return reply.code(400).send({ error: "A user with that email already exists." });
    }

    const row = await prisma.adminUser.create({
      data: {
        email,
        name: body.name?.trim() || null,
        passwordHash: await bcrypt.hash(body.password, 10),
        isOwner: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        isOwner: true,
        createdAt: true,
      },
    });
    return { data: row };
  });

  app.patch("/api/admin/users/:id", { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = z
      .object({
        name: z.string().optional().nullable(),
        password: z.string().min(8).optional(),
      })
      .parse(request.body);

    const target = await prisma.adminUser.findUnique({ where: { id } });
    if (!target) return reply.code(404).send({ error: "Not found" });

    // Owner password is controlled by ADMIN_PASSWORD env — don't override via UI
    if (target.isOwner && body.password) {
      return reply.code(400).send({
        error:
          "Owner password is set from ADMIN_PASSWORD in the server environment — update env and restart.",
      });
    }

    const row = await prisma.adminUser.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name?.trim() || null } : {}),
        ...(body.password
          ? { passwordHash: await bcrypt.hash(body.password, 10) }
          : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        isOwner: true,
        createdAt: true,
      },
    });
    return { data: row };
  });

  app.delete("/api/admin/users/:id", { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const payload = request.user as { sub: string };
    const target = await prisma.adminUser.findUnique({ where: { id } });
    if (!target) return reply.code(404).send({ error: "Not found" });
    if (target.isOwner) {
      return reply.code(400).send({ error: "The permanent owner account cannot be deleted." });
    }
    if (target.id === payload.sub) {
      return reply.code(400).send({ error: "You cannot delete your own account while signed in." });
    }
    await prisma.adminUser.delete({ where: { id } });
    return { ok: true };
  });

  app.get("/api/admin/dashboard", { preHandler: requireAdmin }, async () => {
    const [
      products,
      variants,
      orders,
      lowStockCount,
      publishedProducts,
      draftProducts,
      publishedCategories,
      draftCategories,
      categories,
      reviewsHidden,
      revenueAgg,
      recentOrders,
      lowStockVariants,
      recentMovements,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.productVariant.count(),
      prisma.order.count(),
      prisma.productVariant.count({ where: { howManyLeft: { lte: 5 } } }),
      prisma.product.count({ where: { published: true } }),
      prisma.product.count({ where: { published: false } }),
      prisma.category.count({ where: { published: true } }),
      prisma.category.count({ where: { published: false } }),
      prisma.category.count(),
      prisma.review.count({ where: { showOnWebsite: false } }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { orderStatus: { not: "cancelled" } },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { items: true },
      }),
      prisma.productVariant.findMany({
        where: { howManyLeft: { lte: 5 } },
        include: { product: true },
        orderBy: { howManyLeft: "asc" },
        take: 8,
      }),
      prisma.inventoryMovement.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
    ]);

    const orderStatusCounts = await prisma.order.groupBy({
      by: ["orderStatus"],
      _count: { _all: true },
    });
    const statuses = Object.fromEntries(
      orderStatusCounts.map((row) => [row.orderStatus, row._count._all]),
    ) as Record<string, number>;

    return {
      products,
      variants,
      orders,
      categories,
      lowStock: lowStockCount,
      publishedProducts,
      draftProducts,
      publishedCategories,
      draftCategories,
      reviewsHidden,
      revenue: revenueAgg._sum.total ?? 0,
      openOrders:
        (statuses.placed || 0) + (statuses.paid || 0) + (statuses.pending || 0),
      orderStatusCounts: statuses,
      recentOrders,
      lowStockVariants,
      recentMovements,
    };
  });

  // —— Categories ——
  app.get("/api/admin/categories", { preHandler: requireAdmin }, async () => {
    const rows = await prisma.category.findMany({
      include: { attributeSet: true },
      orderBy: { listPosition: "asc" },
    });
    return { data: rows };
  });

  app.post("/api/admin/categories", { preHandler: requireAdmin }, async (request) => {
    const body = z
      .object({
        name: z.string().min(1),
        listPosition: z.number().int().optional(),
        photoUrl: z.string().optional().nullable(),
        published: z.boolean().optional(),
        attributeSetId: z.string().min(1),
      })
      .parse(request.body);

    const row = await prisma.category.create({
      data: {
        name: body.name,
        linkName: slugify(body.name),
        listPosition: body.listPosition ?? 0,
        photoUrl: body.photoUrl ?? null,
        published: body.published ?? false,
        attributeSetId: body.attributeSetId,
      },
      include: { attributeSet: true },
    });
    return { data: row };
  });

  app.patch("/api/admin/categories/:id", { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = z
      .object({
        name: z.string().min(1).optional(),
        listPosition: z.number().int().optional(),
        photoUrl: z.string().optional().nullable(),
        published: z.boolean().optional(),
        attributeSetId: z.string().min(1).optional(),
      })
      .parse(request.body);
    try {
      const row = await prisma.category.update({
        where: { id },
        data: {
          ...body,
          ...(body.name ? { linkName: slugify(body.name) } : {}),
        },
        include: { attributeSet: true },
      });
      if (body.attributeSetId) {
        await syncProductsKindForCategory(id, body.attributeSetId);
      }
      return { data: row };
    } catch {
      return reply.code(404).send({ error: "Not found" });
    }
  });

  app.delete("/api/admin/categories/:id", { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await prisma.category.delete({ where: { id } });
      return { ok: true };
    } catch {
      return reply.code(404).send({ error: "Not found" });
    }
  });

  // —— Options / values / kinds ——
  app.get("/api/admin/attributes", { preHandler: requireAdmin }, async () => {
    const rows = await prisma.attribute.findMany({
      include: { values: { orderBy: { listPosition: "asc" } } },
      orderBy: { listPosition: "asc" },
    });
    return { data: rows };
  });

  app.post("/api/admin/attributes", { preHandler: requireAdmin }, async (request, reply) => {
    const body = z
      .object({
        name: z.string().min(1),
        displayType: z.enum(["select", "swatch", "text"]).optional(),
        listPosition: z.number().int().optional(),
        values: z.array(attributeValueInput).optional(),
      })
      .parse(request.body);

    const values = (body.values ?? []).filter((v) => v.label.trim());
    if (!values.length) {
      return reply.code(400).send({
        error: "Add at least one value when creating an option.",
      });
    }

    const codes = uniqueCodes(values.map((v) => v.label));
    const row = await prisma.attribute.create({
      data: {
        name: body.name,
        code: slugify(body.name),
        displayType: body.displayType ?? "select",
        listPosition: body.listPosition ?? 0,
        values: {
          create: values.map((value, i) => ({
            label: value.label.trim(),
            code: codes[i],
            meta: value.meta ?? undefined,
            listPosition: value.listPosition ?? i,
          })),
        },
      },
      include: attributeInclude,
    });
    return { data: row };
  });

  app.patch("/api/admin/attributes/:id", { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = z
      .object({
        name: z.string().min(1).optional(),
        displayType: z.enum(["select", "swatch", "text"]).optional(),
        listPosition: z.number().int().optional(),
        values: z.array(attributeValueInput).optional(),
      })
      .parse(request.body);

    const existing = await prisma.attribute.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "Not found" });

    if (body.values) {
      const values = body.values.filter((v) => v.label.trim());
      if (!values.length) {
        return reply.code(400).send({
          error: "An option needs at least one value.",
        });
      }
      await syncAttributeValues(id, values);
    }

    const row = await prisma.attribute.update({
      where: { id },
      data: {
        ...(body.name ? { name: body.name, code: slugify(body.name) } : {}),
        ...(body.displayType ? { displayType: body.displayType } : {}),
        ...(body.listPosition != null ? { listPosition: body.listPosition } : {}),
      },
      include: attributeInclude,
    });
    return { data: row };
  });

  app.delete("/api/admin/attributes/:id", { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await prisma.attribute.delete({ where: { id } });
      return { ok: true };
    } catch {
      return reply.code(404).send({ error: "Not found" });
    }
  });

  app.post("/api/admin/attribute-values", { preHandler: requireAdmin }, async (request) => {
    const body = z
      .object({
        attributeId: z.string(),
        label: z.string().min(1),
        meta: z.any().optional().nullable(),
        listPosition: z.number().int().optional(),
      })
      .parse(request.body);
    const row = await prisma.attributeValue.create({
      data: {
        attributeId: body.attributeId,
        label: body.label,
        code: slugify(body.label),
        meta: body.meta ?? undefined,
        listPosition: body.listPosition ?? 0,
      },
    });
    return { data: row };
  });

  app.patch(
    "/api/admin/attribute-values/:id",
    { preHandler: requireAdmin },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = z
        .object({
          label: z.string().min(1).optional(),
          meta: z.any().optional().nullable(),
          listPosition: z.number().int().optional(),
        })
        .parse(request.body);
      try {
        const row = await prisma.attributeValue.update({
          where: { id },
          data: {
            ...body,
            ...(body.label ? { code: slugify(body.label) } : {}),
            ...(body.meta === null ? { meta: undefined } : {}),
          },
        });
        return { data: row };
      } catch {
        return reply.code(404).send({ error: "Not found" });
      }
    },
  );

  app.delete(
    "/api/admin/attribute-values/:id",
    { preHandler: requireAdmin },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      try {
        await prisma.attributeValue.delete({ where: { id } });
        return { ok: true };
      } catch {
        return reply.code(404).send({ error: "Not found" });
      }
    },
  );

  app.get("/api/admin/attribute-sets", { preHandler: requireAdmin }, async () => {
    const rows = await prisma.attributeSet.findMany({
      include: { attributes: { include: { attribute: true } } },
      orderBy: { name: "asc" },
    });
    return { data: rows };
  });

  app.post("/api/admin/attribute-sets", { preHandler: requireAdmin }, async (request) => {
    const body = z
      .object({
        name: z.string().min(1),
        attributeIds: z.array(z.string()).optional(),
      })
      .parse(request.body);
    const row = await prisma.attributeSet.create({
      data: {
        name: body.name,
        code: slugify(body.name),
        attributes: body.attributeIds?.length
          ? {
              create: body.attributeIds.map((attributeId) => ({ attributeId })),
            }
          : undefined,
      },
      include: { attributes: { include: { attribute: true } } },
    });
    return { data: row };
  });

  app.patch(
    "/api/admin/attribute-sets/:id",
    { preHandler: requireAdmin },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = z
        .object({
          name: z.string().min(1).optional(),
          attributeIds: z.array(z.string()).optional(),
        })
        .parse(request.body);
      try {
        if (body.attributeIds) {
          await prisma.attributeSetMember.deleteMany({ where: { attributeSetId: id } });
          await prisma.attributeSetMember.createMany({
            data: body.attributeIds.map((attributeId) => ({
              attributeSetId: id,
              attributeId,
            })),
          });
        }
        const row = await prisma.attributeSet.update({
          where: { id },
          data: {
            ...(body.name
              ? { name: body.name, code: slugify(body.name) }
              : {}),
          },
          include: { attributes: { include: { attribute: true } } },
        });
        return { data: row };
      } catch {
        return reply.code(404).send({ error: "Not found" });
      }
    },
  );

  app.delete(
    "/api/admin/attribute-sets/:id",
    { preHandler: requireAdmin },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const inUse = await prisma.category.count({ where: { attributeSetId: id } });
      if (inUse) {
        return reply.code(400).send({
          error:
            "Reassign or delete categories that use this product kind first.",
        });
      }
      try {
        await prisma.attributeSet.delete({ where: { id } });
        return { ok: true };
      } catch {
        return reply.code(404).send({ error: "Not found" });
      }
    },
  );

  // —— Products ——
  app.get("/api/admin/products", { preHandler: requireAdmin }, async () => {
    const rows = await prisma.product.findMany({
      include: productInclude,
      orderBy: { updatedAt: "desc" },
    });
    return { data: rows.map(mapProduct) };
  });

  app.post("/api/admin/products", { preHandler: requireAdmin }, async (request, reply) => {
    const body = z
      .object({
        name: z.string().min(1),
        description: z.string().optional().nullable(),
        photoUrl: z.string().optional().nullable(),
        categoryId: z.string().min(1),
        highlightOnHomepage: z.boolean().optional(),
        markAsNew: z.boolean().optional(),
        published: z.boolean().optional(),
      })
      .parse(request.body);

    let attributeSetId: string;
    try {
      attributeSetId = await requireCategoryKind(body.categoryId);
    } catch (e) {
      return reply.code(400).send({ error: (e as Error).message });
    }

    const row = await prisma.product.create({
      data: {
        name: body.name,
        linkName: slugify(body.name),
        description: body.description ?? null,
        photoUrl: body.photoUrl ?? null,
        categoryId: body.categoryId,
        attributeSetId,
        highlightOnHomepage: body.highlightOnHomepage ?? false,
        markAsNew: body.markAsNew ?? false,
        published: body.published ?? false,
      },
      include: productInclude,
    });
    return { data: mapProduct(row) };
  });

  app.patch("/api/admin/products/:id", { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = z
      .object({
        name: z.string().min(1).optional(),
        description: z.string().optional().nullable(),
        photoUrl: z.string().optional().nullable(),
        categoryId: z.string().min(1).optional(),
        highlightOnHomepage: z.boolean().optional(),
        markAsNew: z.boolean().optional(),
        published: z.boolean().optional(),
      })
      .parse(request.body);

    let attributeSetId: string | undefined;
    try {
      attributeSetId = body.categoryId
        ? await requireCategoryKind(body.categoryId)
        : undefined;
    } catch (e) {
      return reply.code(400).send({ error: (e as Error).message });
    }

    const row = await prisma.product.update({
      where: { id },
      data: {
        ...body,
        ...(body.name ? { linkName: slugify(body.name) } : {}),
        ...(attributeSetId ? { attributeSetId } : {}),
      },
      include: productInclude,
    });
    return { data: mapProduct(row) };
  });

  app.delete("/api/admin/products/:id", { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await prisma.product.delete({ where: { id } });
      return { ok: true };
    } catch {
      return reply.code(404).send({ error: "Not found" });
    }
  });

  // —— Variants ——
  app.get("/api/admin/variants", { preHandler: requireAdmin }, async () => {
    const rows = await prisma.productVariant.findMany({
      include: {
        product: true,
        optionValues: {
          include: { attributeValue: { include: { attribute: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
    return { data: rows };
  });

  app.post("/api/admin/variants", { preHandler: requireAdmin }, async (request, reply) => {
    const body = z
      .object({
        productId: z.string(),
        itemCode: z.string().min(1),
        priceForOne: z.number(),
        priceForBulk: z.number().optional().nullable(),
        minQuantityForBulk: z.number().int().optional(),
        howManyLeft: z.number().int().optional(),
        photoUrl: z.string().optional().nullable(),
        attributeValueIds: z.array(z.string()).optional(),
        size: z.string().optional().nullable(),
        color: z.string().optional().nullable(),
        reason: z.string().optional(),
      })
      .parse(request.body);

    const valueIds = [...(body.attributeValueIds ?? [])];

    // Auto-link size/color shortcuts only when this product's kind includes them
    if (body.size || body.color) {
      const ensure = async (
        attrCode: string,
        attrName: string,
        label: string,
        meta?: object,
      ) => {
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
        const value = await prisma.attributeValue.upsert({
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
        valueIds.push(value.id);
      };
      if (body.size && (await kindHasAttributeCode(body.productId, "size"))) {
        await ensure("size", "Size", body.size);
      }
      if (body.color && (await kindHasAttributeCode(body.productId, "color"))) {
        await ensure("color", "Color", body.color);
      }
    }

    const uniqueIds = [...new Set(valueIds)];

    let priceForOne: number;
    let priceForBulk: number | null;
    let stock: number;
    try {
      priceForOne = requirePositivePrice(body.priceForOne, "Price for one");
      priceForBulk = requireOptionalPositivePrice(
        body.priceForBulk,
        "Bulk price",
      );
      stock = requirePositiveStock(body.howManyLeft ?? 1);
      await allowedAttributeIdsForProduct(body.productId);
      await assertOptionValuesMatchKind(body.productId, uniqueIds);
    } catch (e) {
      return reply.code(400).send({ error: (e as Error).message });
    }

    const row = await prisma.productVariant.create({
      data: {
        productId: body.productId,
        itemCode: body.itemCode,
        priceForOne,
        priceForBulk,
        minQuantityForBulk: body.minQuantityForBulk ?? 10,
        howManyLeft: stock,
        photoUrl: body.photoUrl ?? null,
        size: body.size ?? null,
        color: body.color ?? null,
        optionValues: {
          create: uniqueIds.map((attributeValueId) => ({ attributeValueId })),
        },
      },
    });

    if (stock > 0) {
      await logStockChange({
        variantId: row.id,
        before: 0,
        after: stock,
        reason: body.reason || "Initial stock when variant was created",
        movementType: "initial",
      });
    }

    return { data: row };
  });

  app.patch("/api/admin/variants/:id", { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = z
      .object({
        priceForOne: z.number().optional(),
        priceForBulk: z.number().optional().nullable(),
        minQuantityForBulk: z.number().int().optional(),
        howManyLeft: z.number().int().optional(),
        photoUrl: z.string().optional().nullable(),
        attributeValueIds: z.array(z.string()).optional(),
        size: z.string().optional().nullable(),
        color: z.string().optional().nullable(),
        itemCode: z.string().min(1).optional(),
        reason: z.string().optional(),
      })
      .parse(request.body);

    const previous = await prisma.productVariant.findUnique({ where: { id } });
    if (!previous) return reply.code(404).send({ error: "Not found" });

    const stockChanging =
      body.howManyLeft != null && body.howManyLeft !== previous.howManyLeft;
    let nextStock: number | undefined;
    const priceChanging =
      (body.priceForOne != null &&
        roundMoney(body.priceForOne) !== previous.priceForOne) ||
      (body.priceForBulk !== undefined &&
        (body.priceForBulk == null
          ? previous.priceForBulk != null
          : roundMoney(body.priceForBulk) !== previous.priceForBulk));

    if ((stockChanging || priceChanging) && !body.reason?.trim()) {
      return reply
        .code(400)
        .send({ error: "Please enter a reason when changing stock or price." });
    }

    let nextPriceForOne: number | undefined;
    let nextPriceForBulk: number | null | undefined;
    try {
      if (body.priceForOne != null) {
        nextPriceForOne = requirePositivePrice(body.priceForOne, "Price for one");
      }
      if (body.priceForBulk !== undefined) {
        nextPriceForBulk = requireOptionalPositivePrice(
          body.priceForBulk,
          "Bulk price",
        );
      }
      if (stockChanging) {
        nextStock = requirePositiveStock(body.howManyLeft!);
      }
    } catch (e) {
      return reply.code(400).send({ error: (e as Error).message });
    }

    // Keep size/color shortcuts in sync with Options values when edited
    const valueIds = [...(body.attributeValueIds ?? [])];
    if (body.size !== undefined || body.color !== undefined) {
      const ensure = async (
        attrCode: string,
        attrName: string,
        label: string,
        meta?: object,
      ) => {
        if (!label.trim()) return;
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
        const value = await prisma.attributeValue.upsert({
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
        valueIds.push(value.id);
      };
      const size = body.size !== undefined ? body.size : previous.size;
      const color = body.color !== undefined ? body.color : previous.color;
      if (size && (await kindHasAttributeCode(previous.productId, "size"))) {
        await ensure("size", "Size", size);
      }
      if (color && (await kindHasAttributeCode(previous.productId, "color"))) {
        await ensure("color", "Color", color);
      }
    }

    if (body.attributeValueIds || body.size !== undefined || body.color !== undefined) {
      const uniqueIds = [...new Set(valueIds)];
      try {
        await assertOptionValuesMatchKind(previous.productId, uniqueIds);
      } catch (e) {
        return reply.code(400).send({ error: (e as Error).message });
      }
      if (uniqueIds.length || body.attributeValueIds) {
        await prisma.productVariantOptionValue.deleteMany({ where: { variantId: id } });
        if (uniqueIds.length) {
          await prisma.productVariantOptionValue.createMany({
            data: uniqueIds.map((attributeValueId) => ({
              variantId: id,
              attributeValueId,
            })),
          });
        }
      }
    }

    const row = await prisma.productVariant.update({
      where: { id },
      data: {
        ...(body.itemCode ? { itemCode: body.itemCode } : {}),
        ...(nextPriceForOne != null ? { priceForOne: nextPriceForOne } : {}),
        ...(body.priceForBulk !== undefined
          ? { priceForBulk: nextPriceForBulk ?? null }
          : {}),
        ...(body.minQuantityForBulk != null
          ? { minQuantityForBulk: body.minQuantityForBulk }
          : {}),
        ...(nextStock != null ? { howManyLeft: nextStock } : {}),
        ...(body.photoUrl !== undefined ? { photoUrl: body.photoUrl } : {}),
        ...(body.size !== undefined ? { size: body.size } : {}),
        ...(body.color !== undefined ? { color: body.color } : {}),
      },
    });

    if (stockChanging) {
      await logStockChange({
        variantId: id,
        before: previous.howManyLeft,
        after: row.howManyLeft,
        reason: body.reason!,
      });
    }
    if (priceChanging) {
      await logPriceChanges({
        variantId: id,
        before: {
          priceForOne: previous.priceForOne,
          priceForBulk: previous.priceForBulk,
        },
        after: {
          priceForOne: row.priceForOne,
          priceForBulk: row.priceForBulk,
        },
        reason: body.reason!,
      });
    }

    return { data: row };
  });

  app.delete("/api/admin/variants/:id", { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await prisma.productVariant.delete({ where: { id } });
      return { ok: true };
    } catch {
      return reply.code(404).send({ error: "Not found" });
    }
  });

  // —— Orders ——
  app.get("/api/admin/orders", { preHandler: requireAdmin }, async () => {
    const rows = await prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return { data: rows };
  });

  app.patch("/api/admin/orders/:id", { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = z
      .object({
        orderStatus: z.enum([
          "placed",
          "paid",
          "pending",
          "completed",
          "cancelled",
        ]),
      })
      .parse(request.body);

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: "Not found" });

    const row = await prisma.order.update({
      where: { id },
      data: { orderStatus: body.orderStatus },
      include: { items: true },
    });
    await syncOrderStock(id);
    return { data: row };
  });

  app.get("/api/admin/inventory-movements", { preHandler: requireAdmin }, async () => {
    const rows = await prisma.inventoryMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return { data: rows };
  });

  app.get("/api/admin/price-histories", { preHandler: requireAdmin }, async () => {
    const rows = await prisma.priceHistory.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return { data: rows };
  });

  // —— Homepage ——
  app.get("/api/admin/homepage", { preHandler: requireAdmin }, async () => {
    const row = await prisma.homepage.findFirst({ orderBy: { updatedAt: "desc" } });
    return { data: row?.data ?? null };
  });

  app.patch("/api/admin/homepage", { preHandler: requireAdmin }, async (request) => {
    const body = z.object({ data: z.any() }).parse(request.body);
    const existing = await prisma.homepage.findFirst({ orderBy: { updatedAt: "desc" } });
    const row = existing
      ? await prisma.homepage.update({
          where: { id: existing.id },
          data: { data: body.data },
        })
      : await prisma.homepage.create({ data: { data: body.data } });
    return { data: row.data };
  });

  // —— Reviews ——
  app.get("/api/admin/reviews", { preHandler: requireAdmin }, async () => {
    const rows = await prisma.review.findMany({
      include: { product: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return { data: rows };
  });

  app.patch("/api/admin/reviews/:id", { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = z
      .object({
        showOnWebsite: z.boolean().optional(),
        stars: z.number().int().min(1).max(5).optional(),
        title: z.string().optional().nullable(),
        comment: z.string().optional(),
      })
      .parse(request.body);
    try {
      const row = await prisma.review.update({
        where: { id },
        data: body,
        include: { product: true },
      });
      return { data: row };
    } catch {
      return reply.code(404).send({ error: "Not found" });
    }
  });

  app.delete("/api/admin/reviews/:id", { preHandler: requireAdmin }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await prisma.review.delete({ where: { id } });
      return { ok: true };
    } catch {
      return reply.code(404).send({ error: "Not found" });
    }
  });

  // —— Media upload ——
  app.post("/api/admin/upload", { preHandler: requireAdmin }, async (request, reply) => {
    const file = await request.file();
    if (!file) return reply.code(400).send({ error: "No file uploaded" });
    const saved = await saveUpload({
      filename: file.filename,
      mimetype: file.mimetype,
      file: file.file,
    });
    return { data: saved };
  });
}
