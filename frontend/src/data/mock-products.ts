import { userProductImages as img } from "@/lib/images";
import type {
  Category,
  Product,
  ProductVariant,
} from "@/types/database";

type WholesaleTier = {
  id: string;
  product_id: string;
  min_quantity: number;
  unit_price: number;
};

const categories: Category[] = [
  {
    id: "cat-1",
    name: "T-Shirts",
    slug: "t-shirts",
    image_url: img.tygaStyleTeeSet,
    sort_order: 1,
  },
  {
    id: "cat-2",
    name: "Hoodies & Knitwear",
    slug: "hoodies",
    image_url: img.greyZipHoodie,
    sort_order: 2,
  },
  {
    id: "cat-3",
    name: "Pants",
    slug: "pants",
    image_url: img.navyChinoPants,
    sort_order: 3,
  },
  {
    id: "cat-4",
    name: "Formal & Suits",
    slug: "formal",
    image_url: img.suitCollection,
    sort_order: 4,
  },
  {
    id: "cat-5",
    name: "Jackets",
    slug: "jackets",
    image_url: img.bomberJacket,
    sort_order: 5,
  },
];

const variants: Array<
  Omit<ProductVariant, "per_piece_price" | "bulk_price" | "bulk_minimum" | "image_url">
> = [
  { id: "v-1", product_id: "p-1", sku: "GZ-HGY-M", size: "M", color: "Heather Grey", color_hex: "#A8A29E", stock_quantity: 28 },
  { id: "v-2", product_id: "p-2", sku: "WT-WHT-32", size: "32", color: "White", color_hex: "#FAFAFA", stock_quantity: 20 },
  { id: "v-3", product_id: "p-3", sku: "BZ-MIX-M", size: "M", color: "Mixed", color_hex: "#737373", stock_quantity: 200 },
  { id: "v-4", product_id: "p-4", sku: "WP-WHT-32", size: "32", color: "White", color_hex: "#FAFAFA", stock_quantity: 18 },
  { id: "v-5", product_id: "p-5", sku: "QZ-GRN-M", size: "M", color: "Forest Green", color_hex: "#166534", stock_quantity: 22 },
  { id: "v-6", product_id: "p-6", sku: "TB-TAN-32", size: "32", color: "Tan", color_hex: "#C4A574", stock_quantity: 16 },
  { id: "v-7", product_id: "p-7", sku: "DP-BLU-32", size: "32", color: "Royal Blue", color_hex: "#2563EB", stock_quantity: 20 },
  { id: "v-8", product_id: "p-8", sku: "QZ-BLK-M", size: "M", color: "Black", color_hex: "#0A0A0A", stock_quantity: 30 },
  { id: "v-9", product_id: "p-9", sku: "QZ-CRM-M", size: "M", color: "Cream", color_hex: "#F5F0E6", stock_quantity: 25 },
  { id: "v-10", product_id: "p-10", sku: "QZ-BLK-M2", size: "M", color: "Black", color_hex: "#0A0A0A", stock_quantity: 40 },
  { id: "v-11", product_id: "p-11", sku: "QZ-BLK-L", size: "L", color: "Black", color_hex: "#0A0A0A", stock_quantity: 35 },
  { id: "v-12", product_id: "p-12", sku: "HD-BLK-M", size: "M", color: "Black", color_hex: "#0A0A0A", stock_quantity: 24 },
  { id: "v-13", product_id: "p-13", sku: "ST-TAN-40R", size: "40R", color: "Tan", color_hex: "#C4A574", stock_quantity: 8 },
  { id: "v-14", product_id: "p-14", sku: "JN-BLK-32", size: "32", color: "Black", color_hex: "#0A0A0A", stock_quantity: 40 },
  { id: "v-15", product_id: "p-15", sku: "CG-CRM-32", size: "32", color: "Cream", color_hex: "#F5F0E6", stock_quantity: 18 },
  { id: "v-16", product_id: "p-16", sku: "CH-NVY-32", size: "32", color: "Navy", color_hex: "#1E3A5F", stock_quantity: 30 },
  { id: "v-17", product_id: "p-17", sku: "DS-WHT-M", size: "M", color: "White", color_hex: "#FAFAFA", stock_quantity: 45 },
  { id: "v-18", product_id: "p-18", sku: "BM-BLK-M", size: "M", color: "Black", color_hex: "#0A0A0A", stock_quantity: 15 },
  { id: "v-19", product_id: "p-19", sku: "DS-WHT-L", size: "L", color: "White", color_hex: "#FAFAFA", stock_quantity: 38 },
  { id: "v-20", product_id: "p-20", sku: "TE-WHT-M", size: "M", color: "White", color_hex: "#FAFAFA", stock_quantity: 55 },
  { id: "v-21", product_id: "p-21", sku: "TS-BLK-M", size: "M", color: "Black", color_hex: "#0A0A0A", stock_quantity: 62 },
];

const wholesaleTiers: WholesaleTier[] = [
  { id: "w-1", product_id: "p-3", min_quantity: 24, unit_price: 28.99 },
  { id: "w-2", product_id: "p-3", min_quantity: 48, unit_price: 24.99 },
  { id: "w-3", product_id: "p-21", min_quantity: 12, unit_price: 18.99 },
  { id: "w-4", product_id: "p-21", min_quantity: 36, unit_price: 15.99 },
  { id: "w-5", product_id: "p-1", min_quantity: 10, unit_price: 44.99 },
  { id: "w-6", product_id: "p-16", min_quantity: 15, unit_price: 36.99 },
  { id: "w-7", product_id: "p-14", min_quantity: 12, unit_price: 32.99 },
  { id: "w-8", product_id: "p-13", min_quantity: 5, unit_price: 249.99 },
];

/** 21 products — one per user-provided photo, no extra images */
const products: Array<
  Omit<Product, "variants" | "total_stock"> & {
    category_id: string;
    retail_price: number;
    compare_at_price?: number | null;
    sell_mode?: string;
    moq_wholesale?: number;
    images?: string[];
  }
> = [
  {
    id: "p-1",
    name: "Heather Grey Zip Hoodie",
    slug: "heather-grey-zip-hoodie",
    description: "Oversized heather grey zip hoodie with kangaroo pockets. Relaxed streetwear fit.",
    retail_price: 64.99,
    compare_at_price: 79.99,
    category_id: "cat-2",
    image_url: img.greyZipHoodie,
    images: [],
    sell_mode: "both",
    moq_wholesale: 10,
    is_featured: true,
    is_new: true,
  },
  {
    id: "p-2",
    name: "White Straight Trousers",
    slug: "white-straight-trousers",
    description: "Crisp white straight-leg trousers. Clean minimalist profile with black leather shoes styling.",
    retail_price: 54.99,
    compare_at_price: null,
    category_id: "cat-3",
    image_url: img.whiteTrousersSide,
    images: [],
    sell_mode: "both",
    moq_wholesale: 10,
    is_featured: false,
    is_new: false,
  },
  {
    id: "p-3",
    name: "Quarter-Zip Bulk Color Pack",
    slug: "quarter-zip-bulk-color-pack",
    description: "Wholesale pack of quarter-zip pullovers in mixed colors — black, olive, sage, mustard, cream, and grey.",
    retail_price: 699.99,
    compare_at_price: null,
    category_id: "cat-2",
    image_url: img.quarterZipBulkPack,
    images: [],
    sell_mode: "both",
    moq_wholesale: 24,
    is_featured: true,
    is_new: false,
  },
  {
    id: "p-4",
    name: "White Dress Pants",
    slug: "white-dress-pants",
    description: "Formal white dress pants with sharp front crease. Slim tailored fit.",
    retail_price: 59.99,
    compare_at_price: null,
    category_id: "cat-3",
    image_url: img.whiteDressPants,
    images: [],
    sell_mode: "both",
    moq_wholesale: 12,
    is_featured: false,
    is_new: true,
  },
  {
    id: "p-5",
    name: "Forest Green Quarter-Zip",
    slug: "forest-green-quarter-zip",
    description: "Ribbed forest green quarter-zip layered over a striped dress shirt. Smart-casual essential.",
    retail_price: 54.99,
    compare_at_price: 69.99,
    category_id: "cat-2",
    image_url: img.greenQuarterZip,
    images: [],
    sell_mode: "both",
    moq_wholesale: 10,
    is_featured: true,
    is_new: true,
  },
  {
    id: "p-6",
    name: "Tan Bootcut Dress Pants",
    slug: "tan-bootcut-dress-pants",
    description: "Warm tan bootcut dress pants with pressed crease. Pairs with white shirt and leather belt.",
    retail_price: 64.99,
    compare_at_price: null,
    category_id: "cat-3",
    image_url: img.tanBootcutPants,
    images: [],
    sell_mode: "both",
    moq_wholesale: 15,
    is_featured: false,
    is_new: false,
  },
  {
    id: "p-7",
    name: "Dress Pants — Blue & Tan",
    slug: "dress-pants-blue-tan",
    description: "Tailored dress pants available in royal blue and tan. Slim fit with front crease.",
    retail_price: 54.99,
    compare_at_price: null,
    category_id: "cat-3",
    image_url: img.dressPantsBlueTan,
    images: [],
    sell_mode: "both",
    moq_wholesale: 15,
    is_featured: true,
    is_new: false,
  },
  {
    id: "p-8",
    name: "Black Quarter-Zip — Office",
    slug: "black-quarter-zip-office",
    description: "Black ribbed quarter-zip over dress shirt and tie. Pleated charcoal trousers.",
    retail_price: 54.99,
    compare_at_price: 69.99,
    category_id: "cat-2",
    image_url: img.blackQuarterZipOffice,
    images: [],
    sell_mode: "both",
    moq_wholesale: 10,
    is_featured: true,
    is_new: false,
  },
  {
    id: "p-9",
    name: "Cream Ribbed Quarter-Zip",
    slug: "cream-ribbed-quarter-zip",
    description: "Cream ribbed quarter-zip sweater over white dress shirt and black tie.",
    retail_price: 54.99,
    compare_at_price: null,
    category_id: "cat-2",
    image_url: img.creamQuarterZip,
    images: [],
    sell_mode: "both",
    moq_wholesale: 10,
    is_featured: false,
    is_new: true,
  },
  {
    id: "p-10",
    name: "Black Quarter-Zip — Folded",
    slug: "black-quarter-zip-folded",
    description: "Black rib-knit quarter-zip pullover. Premium folded presentation for retail display.",
    retail_price: 49.99,
    compare_at_price: null,
    category_id: "cat-2",
    image_url: img.blackQuarterZipFolded,
    images: [],
    sell_mode: "both",
    moq_wholesale: 10,
    is_featured: false,
    is_new: false,
  },
  {
    id: "p-11",
    name: "Black Quarter-Zip Set",
    slug: "black-quarter-zip-set",
    description: "Black ribbed quarter-zip — lifestyle and product views. Charcoal trouser pairing.",
    retail_price: 54.99,
    compare_at_price: null,
    category_id: "cat-2",
    image_url: img.blackQuarterZipSet,
    images: [],
    sell_mode: "both",
    moq_wholesale: 10,
    is_featured: false,
    is_new: false,
  },
  {
    id: "p-12",
    name: "Black Oversized Zip Hoodie",
    slug: "black-oversized-zip-hoodie",
    description: "Oversized black zip hoodie with dropped shoulders. Streetwear fit over wide-leg denim.",
    retail_price: 69.99,
    compare_at_price: 85,
    category_id: "cat-2",
    image_url: img.blackOversizedHoodie,
    images: [],
    sell_mode: "both",
    moq_wholesale: 10,
    is_featured: true,
    is_new: true,
  },
  {
    id: "p-13",
    name: "Premium Suit Collection",
    slug: "premium-suit-collection",
    description: "Two-piece slim suits in tan, cream, and powder blue. Full formal collection display.",
    retail_price: 299.99,
    compare_at_price: 399.99,
    category_id: "cat-4",
    image_url: img.suitCollection,
    images: [],
    sell_mode: "both",
    moq_wholesale: 5,
    is_featured: true,
    is_new: false,
  },
  {
    id: "p-14",
    name: "Slim Black Jeans",
    slug: "slim-black-jeans",
    description: "Deep black denim with TygaStyle red embroidery on coin pocket. Five-pocket slim fit.",
    retail_price: 59.99,
    compare_at_price: 74.99,
    category_id: "cat-3",
    image_url: img.blackJeans,
    images: [],
    sell_mode: "both",
    moq_wholesale: 12,
    is_featured: true,
    is_new: false,
  },
  {
    id: "p-15",
    name: "Cream Cargo Pants",
    slug: "cream-cargo-pants",
    description: "Slim cargo pants with TygaStyle branded inner waistband and custom button detail.",
    retail_price: 49.99,
    compare_at_price: null,
    category_id: "cat-3",
    image_url: img.creamCargoPants,
    images: [],
    sell_mode: "both",
    moq_wholesale: 12,
    is_featured: false,
    is_new: true,
  },
  {
    id: "p-16",
    name: "Navy Slim Chino Pants",
    slug: "navy-slim-chino-pants",
    description: "Navy slim-fit chinos with TygaStyle embroidered waistband. Stretch cotton twill.",
    retail_price: 49.99,
    compare_at_price: null,
    category_id: "cat-3",
    image_url: img.navyChinoPants,
    images: [],
    sell_mode: "both",
    moq_wholesale: 15,
    is_featured: false,
    is_new: true,
  },
  {
    id: "p-17",
    name: "Dress Shirt — Collar Detail",
    slug: "dress-shirt-collar-detail",
    description: "White dress shirt with TygaStyle crown logo on inner collar. Contrast trim detail.",
    retail_price: 44.99,
    compare_at_price: null,
    category_id: "cat-4",
    image_url: img.dressShirtCollar,
    images: [],
    sell_mode: "both",
    moq_wholesale: 10,
    is_featured: false,
    is_new: true,
  },
  {
    id: "p-18",
    name: "MA-1 Bomber Jacket",
    slug: "ma1-bomber-jacket",
    description: "Classic bomber with orange lining, ribbed cuffs, and TygaStyle sleeve embroidery.",
    retail_price: 89.99,
    compare_at_price: 110,
    category_id: "cat-5",
    image_url: img.bomberJacket,
    images: [],
    sell_mode: "both",
    moq_wholesale: 10,
    is_featured: true,
    is_new: true,
  },
  {
    id: "p-19",
    name: "Classic White Dress Shirt",
    slug: "classic-white-dress-shirt",
    description: "Crisp white dress shirt with contrast inner collar and TygaStyle crown chest logo.",
    retail_price: 44.99,
    compare_at_price: 55,
    category_id: "cat-4",
    image_url: img.whiteDressShirt,
    images: [],
    sell_mode: "both",
    moq_wholesale: 10,
    is_featured: true,
    is_new: false,
  },
  {
    id: "p-20",
    name: "TygaStyle Cotton Tee — Neck Detail",
    slug: "tygastyle-cotton-tee-neck-detail",
    description: "Premium white cotton tee with red TygaStyle neck tape and woven tiger crown label.",
    retail_price: 24.99,
    compare_at_price: 32,
    category_id: "cat-1",
    image_url: img.teeNeckTag,
    images: [],
    sell_mode: "both",
    moq_wholesale: 12,
    is_featured: false,
    is_new: true,
  },
  {
    id: "p-21",
    name: "TygaStyle Signature Tee Set",
    slug: "tygastyle-signature-tee-set",
    description: "Black and navy TygaStyle tees with chest logo. Raglan sleeve navy option. Tag detail included.",
    retail_price: 29.99,
    compare_at_price: 39.99,
    category_id: "cat-1",
    image_url: img.tygaStyleTeeSet,
    images: [],
    sell_mode: "both",
    moq_wholesale: 12,
    is_featured: true,
    is_new: true,
  },
];

function attachRelations(items: Omit<Product, "variants" | "total_stock">[]): Product[] {
  return items.map((product) => {
    const productVariants = variants.filter((v) => v.product_id === product.id);
    const productTiers = wholesaleTiers
      .filter((t) => t.product_id === product.id)
      .sort((a, b) => a.min_quantity - b.min_quantity);
    const bulkPrice = productTiers[0]?.unit_price ?? null;
    const bulkMin = productTiers[0]?.min_quantity ?? 10;

    const mappedVariants = productVariants.map((v) => ({
      ...v,
      image_url: product.image_url,
      per_piece_price:
        (v as ProductVariant).per_piece_price ??
        (product as { retail_price?: number }).retail_price ??
        0,
      bulk_price:
        (v as ProductVariant).bulk_price ?? bulkPrice,
      bulk_minimum:
        (v as ProductVariant).bulk_minimum ?? bulkMin,
    }));

    const total_stock = mappedVariants.reduce(
      (sum, v) => sum + v.stock_quantity,
      0,
    );

    return {
      ...product,
      category: categories.find((c) => c.id === product.category_id) ?? null,
      variants: mappedVariants,
      total_stock,
    };
  });
}

export const mockCategories = categories;
export const mockProducts = attachRelations(products);

export function getMockProductBySlug(slug: string): Product | null {
  return mockProducts.find((p) => p.slug === slug) ?? null;
}

export function getMockProductsByCategory(categorySlug: string): Product[] {
  return mockProducts.filter((p) => p.category?.slug === categorySlug);
}
