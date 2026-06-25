import ProductCard from "@/components/shop/ProductCard";
import type { Product } from "@/types/database";

type Props = {
  product: Product;
};

/** Wholesale catalog card — bulk price shown first. */
export default function WholesaleProductCard({ product }: Props) {
  return <ProductCard product={product} emphasis="wholesale" />;
}
