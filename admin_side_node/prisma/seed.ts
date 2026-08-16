import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { seedCategories, seedProducts } from "../data/seed.ts";
import {
  seedFeatures,
  seedHeroSlides,
  seedHomepageScalars,
  seedPromoBanners,
} from "../data/seed-homepage.ts";
import { ensureBootstrapAdmin } from "../src/lib/bootstrap-admin.ts";

const prisma = new PrismaClient();

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function ensureAttribute(
  name: string,
  code: string,
  displayType: "select" | "swatch" | "text",
  listPosition: number,
) {
  return prisma.attribute.upsert({
    where: { code },
    create: { name, code, displayType, listPosition },
    update: { name, displayType, listPosition },
  });
}

async function ensureValue(
  attributeId: string,
  label: string,
  meta?: object | null,
) {
  const code = slugify(label);
  return prisma.attributeValue.upsert({
    where: { attributeId_code: { attributeId, code } },
    create: { attributeId, label, code, meta: meta ?? undefined },
    update: { label, meta: meta ?? undefined },
  });
}

async function main() {
  const owner = await ensureBootstrapAdmin();
  console.log(`Permanent owner: ${owner.email}`);

  const size = await ensureAttribute("Size", "size", "select", 1);
  const color = await ensureAttribute("Color", "color", "swatch", 2);
  const storage = await ensureAttribute("Storage", "storage", "select", 3);
  const pack = await ensureAttribute("Pack", "pack", "select", 4);
  const weight = await ensureAttribute("Weight", "weight", "select", 5);

  const apparel = await prisma.attributeSet.upsert({
    where: { code: "apparel" },
    create: { name: "Apparel", code: "apparel" },
    update: { name: "Apparel" },
  });
  const grocery = await prisma.attributeSet.upsert({
    where: { code: "grocery" },
    create: { name: "Grocery", code: "grocery" },
    update: { name: "Grocery" },
  });
  const electronics = await prisma.attributeSet.upsert({
    where: { code: "electronics" },
    create: { name: "Electronics", code: "electronics" },
    update: { name: "Electronics" },
  });

  for (const [setId, attrs] of [
    [apparel.id, [size.id, color.id]],
    [grocery.id, [pack.id, weight.id]],
    [electronics.id, [storage.id, color.id]],
  ] as Array<[string, string[]]>) {
    for (const attributeId of attrs) {
      await prisma.attributeSetMember.upsert({
        where: {
          attributeSetId_attributeId: { attributeSetId: setId, attributeId },
        },
        create: { attributeSetId: setId, attributeId },
        update: {},
      });
    }
  }

  if (process.env.SEED_DATA === "false") {
    console.log("SEED_DATA=false — skipped catalog seed");
    return;
  }

  const existingProducts = await prisma.product.count();
  if (existingProducts > 0) {
    console.log("Catalog already seeded — skipping products");
  } else {
    const categoryMap = new Map<string, string>();
    for (const cat of seedCategories) {
      const row = await prisma.category.create({
        data: {
          name: cat.name,
          linkName: cat.link_name,
          photoUrl: cat.photo,
          listPosition: cat.list_position,
          published: true,
        },
      });
      categoryMap.set(cat.link_name, row.id);
    }

    for (const product of seedProducts) {
      const created = await prisma.product.create({
        data: {
          name: product.name,
          linkName: product.link_name,
          description: product.description,
          photoUrl: product.photo,
          videoUrl: product.video ?? null,
          highlightOnHomepage: product.highlight_on_homepage,
          markAsNew: product.mark_as_new,
          published: true,
          categoryId: categoryMap.get(product.category_link_name) ?? null,
          attributeSetId: apparel.id,
        },
      });

      for (const variant of product.variants) {
        const sizeValue = await ensureValue(size.id, variant.size);
        const colorValue = await ensureValue(
          color.id,
          variant.color,
          variant.color_dot ? { hex: variant.color_dot } : null,
        );

        await prisma.productVariant.create({
          data: {
            productId: created.id,
            itemCode: variant.item_code,
            priceForOne: variant.price_for_one,
            priceForBulk: variant.price_for_bulk ?? null,
            minQuantityForBulk: variant.min_quantity_for_bulk ?? 10,
            howManyLeft: variant.how_many_left,
            photoUrl: variant.photo ?? product.photo,
            extraPhotoUrls: variant.color_photos ?? [],
            size: variant.size,
            color: variant.color,
            colorDot: variant.color_dot ?? null,
            optionValues: {
              create: [
                { attributeValueId: sizeValue.id },
                { attributeValueId: colorValue.id },
              ],
            },
          },
        });
      }
    }
    console.log(`Seeded ${seedProducts.length} products`);
  }

  const homepageCount = await prisma.homepage.count();
  if (homepageCount === 0) {
    await prisma.homepage.create({
      data: {
        data: {
          ...seedHomepageScalars,
          hero_slides: seedHeroSlides,
          features: seedFeatures,
          promo_banners: seedPromoBanners,
        },
      },
    });
    console.log("Seeded homepage");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
