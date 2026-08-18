export type Category = {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  sort_order: number;
};

export type GalleryItem = {
  type: "image" | "video";
  url: string;
  /** Option value this media belongs to (usually a color) — syncs pickers from the gallery */
  color?: string;
  option_code?: string;
  option_value?: string;
};

export type ColorOption = {
  color: string;
  color_hex: string | null;
  /** Product photo for this color — used as the swatch thumbnail */
  image_url: string | null;
};

export type VariantOption = {
  code: string;
  name: string;
  value: string;
  value_code: string;
  meta?: { hex?: string } | null;
  display_type: "select" | "swatch" | "text";
  list_position?: number;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  sku: string;
  /** Dynamic options (Size, Color, Storage, Pack…). Prefer this over size/color. */
  options: VariantOption[];
  /** Convenience: Size option value, or legacy field */
  size: string;
  /** Convenience: Color option value, or legacy field */
  color: string;
  color_hex: string | null;
  image_url: string | null;
  /** More photos for this look (angles, details) */
  color_images?: string[];
  per_piece_price: number;
  bulk_price: number | null;
  bulk_minimum: number;
  stock_quantity: number;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  /** Optional product showcase video (same for all colors) */
  video_url?: string | null;
  is_featured: boolean;
  is_new: boolean;
  category_id: string | null;
  category?: Category | null;
  attribute_set?: { id: string; name: string; code: string } | null;
  variants?: ProductVariant[];
  total_stock?: number;
  /** Average star rating (1–5) when reviews exist */
  rating_average?: number | null;
  rating_count?: number;
};

export type ProductReview = {
  id: string;
  product_id: string;
  customer_name: string;
  stars: number;
  title: string | null;
  comment: string;
  created_at: string;
};

export type RatingSummary = {
  average: number;
  count: number;
  /** Counts for stars 1 through 5 */
  distribution: [number, number, number, number, number];
};

export type CartItem = {
  productId: string;
  variantId: string;
  name: string;
  slug: string;
  image: string;
  options: Array<{ name: string; value: string; code?: string }>;
  /** Legacy convenience fields derived from options */
  size: string;
  color: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  pricingMode: "retail" | "wholesale";
};

export type PricingMode = "retail" | "wholesale";
