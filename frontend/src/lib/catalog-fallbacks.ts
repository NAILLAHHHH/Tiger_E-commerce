/** Local image paths when Strapi media is not uploaded yet. */
export const productImageBySlug: Record<string, string> = {
  "heather-grey-zip-hoodie": "/products/01-grey-zip-hoodie.png",
  "quarter-zip-bulk-color-pack": "/products/03-quarter-zip-bulk-pack.png",
  "navy-chino-pants": "/products/16-navy-chino-pants.png",
  "tygastyle-tee-set": "/products/21-tygastyle-tee-set.png",
  "suit-collection-tan": "/products/13-suit-collection.png",
  "bomber-jacket": "/products/18-bomber-jacket.png",
};

export const categoryImageBySlug: Record<string, string> = {
  "t-shirts": "/products/21-tygastyle-tee-set.png",
  hoodies: "/products/01-grey-zip-hoodie.png",
  pants: "/products/16-navy-chino-pants.png",
  formal: "/products/13-suit-collection.png",
  jackets: "/products/18-bomber-jacket.png",
};

export function fallbackProductImage(slug: string): string | null {
  return productImageBySlug[slug] ?? null;
}

export function fallbackCategoryImage(slug: string): string | null {
  return categoryImageBySlug[slug] ?? null;
}
