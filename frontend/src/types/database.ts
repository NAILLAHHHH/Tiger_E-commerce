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
};

export type ColorOption = {
  color: string;
  color_hex: string | null;
  /** Product photo for this color — used as the swatch thumbnail */
  image_url: string | null;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  sku: string;
  size: string;
  color: string;
  color_hex: string | null;
  image_url: string | null;
  /** More photos for this color (angles, details) */
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
  variants?: ProductVariant[];
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
