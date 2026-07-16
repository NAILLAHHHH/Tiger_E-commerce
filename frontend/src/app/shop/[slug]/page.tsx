import ProductDetailClient from "@/components/shop/ProductDetailClient";
import ProductReviews from "@/components/shop/ProductReviews";
import { getProductBySlug } from "@/lib/products";
import {
  getRatingSummaryForProduct,
  getReviewsForProduct,
} from "@/lib/reviews";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const [reviews, summary] = await Promise.all([
    getReviewsForProduct(product.id),
    getRatingSummaryForProduct(product.id),
  ]);

  return (
    <div className="container-custom py-10">
      <nav className="mb-6 text-sm text-muted">
        <Link href="/" className="hover:text-brand">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/shop" className="hover:text-brand">
          Shop
        </Link>
        <span className="mx-2">/</span>
        <span className="text-dark">{product.name}</span>
      </nav>

      <ProductDetailClient product={product} ratingSummary={summary} />

      <div className="mt-14">
        <ProductReviews
          productId={product.id}
          productName={product.name}
          initialReviews={reviews}
          initialSummary={summary}
        />
      </div>
    </div>
  );
}
