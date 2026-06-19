export type SellMode = "retail" | "wholesale" | "both";

export type Category = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  sort_order: number;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  sku: string;
  size: string;
  color: string;
  color_hex: string | null;
  stock_quantity: number;
};

export type WholesaleTier = {
  id: string;
  product_id: string;
  min_quantity: number;
  unit_price: number;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  retail_price: number;
  bulk_price: number | null;
  compare_at_price: number | null;
  category_id: string | null;
  image_url: string | null;
  images: string[];
  sell_mode: SellMode;
  moq_wholesale: number;
  is_featured: boolean;
  is_new: boolean;
  category?: Category | null;
  variants?: ProductVariant[];
  wholesale_tiers?: WholesaleTier[];
  total_stock?: number;
};

export type CartItem = {
  productId: string;
  variantId: string;
  name: string;
  slug: string;
  image: string;
  size: string;
  color: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  pricingMode: "retail" | "wholesale";
};

export type PricingMode = "retail" | "wholesale";
