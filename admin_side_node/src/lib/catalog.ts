import { prisma } from "../db.js";

export async function findAttributeSetByLabel(label: string) {
  const code = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return prisma.attributeSet.findFirst({
    where: {
      OR: [
        { name: { equals: label, mode: "insensitive" } },
        { code },
      ],
    },
  });
}

export async function requireCategoryKind(
  categoryId: string,
): Promise<string> {
  const cat = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!cat) throw new Error("Category not found.");
  if (!cat.attributeSetId) {
    throw new Error(
      "That category has no product kind. Edit the category and choose a kind first.",
    );
  }
  return cat.attributeSetId;
}

export async function syncProductsKindForCategory(
  categoryId: string,
  attributeSetId: string,
): Promise<void> {
  await prisma.product.updateMany({
    where: { categoryId },
    data: { attributeSetId },
  });
}

async function kindMembersForProduct(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      attributeSet: {
        include: { attributes: { include: { attribute: true } } },
      },
      category: {
        include: {
          attributeSet: {
            include: { attributes: { include: { attribute: true } } },
          },
        },
      },
    },
  });
  if (!product) throw new Error("Product not found.");
  return (
    product.attributeSet?.attributes ??
    product.category?.attributeSet?.attributes ??
    []
  );
}

export async function allowedAttributeIdsForProduct(
  productId: string,
): Promise<Set<string>> {
  const members = await kindMembersForProduct(productId);
  if (!members.length) {
    throw new Error(
      "This product needs a category with a product kind before you add options.",
    );
  }
  return new Set(members.map((m) => m.attributeId));
}

export async function kindHasAttributeCode(
  productId: string,
  code: string,
): Promise<boolean> {
  const members = await kindMembersForProduct(productId);
  return members.some((m) => m.attribute.code === code);
}

export async function assertOptionValuesMatchKind(
  productId: string,
  valueIds: string[],
): Promise<void> {
  if (!valueIds.length) return;
  const allowed = await allowedAttributeIdsForProduct(productId);
  const values = await prisma.attributeValue.findMany({
    where: { id: { in: valueIds } },
    select: { id: true, attributeId: true, label: true },
  });
  const extra = values.find((v) => !allowed.has(v.attributeId));
  if (extra) {
    throw new Error(
      `Option value "${extra.label}" does not belong to this product's kind.`,
    );
  }
}
