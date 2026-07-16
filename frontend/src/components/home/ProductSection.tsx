import ProductCard from "@/components/shop/ProductCard";
import Link from "next/link";
import type { Product, RatingSummary } from "@/types/database";

type Props = {
  title: string;
  products: Product[];
  viewAllHref?: string;
  ratings?: Record<string, RatingSummary>;
};

export default function ProductSection({
  title,
  products,
  viewAllHref,
  ratings,
}: Props) {
  return (
    <section className="container-custom py-14">
      <div className="mb-8 flex items-end justify-between">
        <h2 className="section-title">{title}</h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-sm font-medium text-brand hover:text-brand-dark"
          >
            View all →
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            rating={ratings?.[product.id]}
          />
        ))}
      </div>
    </section>
  );
}
