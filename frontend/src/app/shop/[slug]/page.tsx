import ProductDetailClient from "@/components/shop/ProductDetailClient";
import { getProductBySlug } from "@/lib/products";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

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

      <ProductDetailClient product={product} />
    </div>
  );
}
