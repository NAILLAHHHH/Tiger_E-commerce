type SeedCategory = {
  name: string;
  slug: string;
  image_url: string;
  sort_order: number;
};

type SeedVariant = {
  sku: string;
  size: string;
  color: string;
  color_hex?: string;
  stock_quantity: number;
};

type SeedTier = {
  min_quantity: number;
  unit_price: number;
};

type SeedProduct = {
  name: string;
  slug: string;
  description: string;
  retail_price: number;
  bulk_price?: number;
  compare_at_price?: number;
  category_slug: string;
  image_url: string;
  sell_mode: "retail" | "wholesale" | "both";
  moq_wholesale: number;
  is_featured: boolean;
  is_new: boolean;
  variants: SeedVariant[];
  wholesale_tiers?: SeedTier[];
};

export const seedCategories: SeedCategory[] = [
  { name: "T-Shirts", slug: "t-shirts", image_url: "/products/21-tygastyle-tee-set.png", sort_order: 1 },
  { name: "Hoodies & Knitwear", slug: "hoodies", image_url: "/products/01-grey-zip-hoodie.png", sort_order: 2 },
  { name: "Pants", slug: "pants", image_url: "/products/16-navy-chino-pants.png", sort_order: 3 },
  { name: "Formal & Suits", slug: "formal", image_url: "/products/13-suit-collection.png", sort_order: 4 },
  { name: "Jackets", slug: "jackets", image_url: "/products/18-bomber-jacket.png", sort_order: 5 },
];

export const seedProducts: SeedProduct[] = [
  {
    name: "Heather Grey Zip Hoodie",
    slug: "heather-grey-zip-hoodie",
    description: "Oversized heather grey zip hoodie with kangaroo pockets. Relaxed streetwear fit.",
    retail_price: 64.99,
    bulk_price: 44.99,
    compare_at_price: 79.99,
    category_slug: "hoodies",
    image_url: "/products/01-grey-zip-hoodie.png",
    sell_mode: "both",
    moq_wholesale: 10,
    is_featured: true,
    is_new: true,
    variants: [
      { sku: "GZ-HGY-M", size: "M", color: "Heather Grey", color_hex: "#A8A29E", stock_quantity: 28 },
      { sku: "GZ-HGY-L", size: "L", color: "Heather Grey", color_hex: "#A8A29E", stock_quantity: 22 },
    ],
    wholesale_tiers: [{ min_quantity: 10, unit_price: 44.99 }],
  },
  {
    name: "Quarter-Zip Bulk Color Pack",
    slug: "quarter-zip-bulk-color-pack",
    description: "Wholesale pack of quarter-zip pullovers in mixed colors.",
    retail_price: 699.99,
    bulk_price: 28.99,
    category_slug: "hoodies",
    image_url: "/products/03-quarter-zip-bulk-pack.png",
    sell_mode: "both",
    moq_wholesale: 24,
    is_featured: true,
    is_new: false,
    variants: [
      { sku: "BZ-MIX-M", size: "M", color: "Mixed", color_hex: "#737373", stock_quantity: 200 },
    ],
    wholesale_tiers: [
      { min_quantity: 24, unit_price: 28.99 },
      { min_quantity: 48, unit_price: 24.99 },
    ],
  },
  {
    name: "Navy Chino Pants",
    slug: "navy-chino-pants",
    description: "Classic navy chino pants with a tailored fit.",
    retail_price: 54.99,
    bulk_price: 36.99,
    category_slug: "pants",
    image_url: "/products/16-navy-chino-pants.png",
    sell_mode: "both",
    moq_wholesale: 15,
    is_featured: true,
    is_new: false,
    variants: [
      { sku: "CH-NVY-32", size: "32", color: "Navy", color_hex: "#1E3A5F", stock_quantity: 30 },
      { sku: "CH-NVY-34", size: "34", color: "Navy", color_hex: "#1E3A5F", stock_quantity: 25 },
    ],
    wholesale_tiers: [{ min_quantity: 15, unit_price: 36.99 }],
  },
  {
    name: "TygaStyle Tee Set",
    slug: "tygastyle-tee-set",
    description: "Graphic tee set — retail and bulk available.",
    retail_price: 24.99,
    bulk_price: 18.99,
    category_slug: "t-shirts",
    image_url: "/products/21-tygastyle-tee-set.png",
    sell_mode: "both",
    moq_wholesale: 12,
    is_featured: true,
    is_new: true,
    variants: [
      { sku: "TS-BLK-M", size: "M", color: "Black", color_hex: "#0A0A0A", stock_quantity: 62 },
      { sku: "TS-BLK-L", size: "L", color: "Black", color_hex: "#0A0A0A", stock_quantity: 48 },
    ],
    wholesale_tiers: [
      { min_quantity: 12, unit_price: 18.99 },
      { min_quantity: 36, unit_price: 15.99 },
    ],
  },
  {
    name: "Suit Collection — Tan",
    slug: "suit-collection-tan",
    description: "Two-piece tan suit. Formal wholesale available.",
    retail_price: 349.99,
    bulk_price: 249.99,
    category_slug: "formal",
    image_url: "/products/13-suit-collection.png",
    sell_mode: "both",
    moq_wholesale: 5,
    is_featured: false,
    is_new: false,
    variants: [
      { sku: "ST-TAN-40R", size: "40R", color: "Tan", color_hex: "#C4A574", stock_quantity: 8 },
    ],
    wholesale_tiers: [{ min_quantity: 5, unit_price: 249.99 }],
  },
  {
    name: "Bomber Jacket",
    slug: "bomber-jacket",
    description: "Classic bomber jacket in black.",
    retail_price: 89.99,
    category_slug: "jackets",
    image_url: "/products/18-bomber-jacket.png",
    sell_mode: "retail",
    moq_wholesale: 10,
    is_featured: true,
    is_new: true,
    variants: [
      { sku: "BM-BLK-M", size: "M", color: "Black", color_hex: "#0A0A0A", stock_quantity: 15 },
    ],
  },
];
