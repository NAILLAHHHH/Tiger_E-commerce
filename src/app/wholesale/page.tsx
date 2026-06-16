import ProductCard from "@/components/shop/ProductCard";
import { formatPrice } from "@/lib/pricing";
import { getWholesaleProducts } from "@/lib/products";

export default async function WholesalePage() {
  const products = await getWholesaleProducts();

  return (
    <div className="container-custom py-10">
      <div className="mb-10 rounded-2xl bg-dark p-8 text-white md:p-12">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">
          Wholesale program
        </p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">
          Buy in bulk, save on every unit
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-4">
          Tiered pricing for boutiques, resellers, and print shops. Each SKU
          tracks size, color, and stock in real time — no overselling.
        </p>
        <ul className="mt-6 grid gap-2 text-sm text-gray-4 sm:grid-cols-3">
          <li>✓ MOQ from 10 pieces</li>
          <li>✓ Automatic tier discounts</li>
          <li>✓ Mix sizes & colors per order</li>
        </ul>
      </div>

      <h2 className="section-title mb-6">Wholesale catalog</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-gray-3 bg-gray-1 p-6">
        <h3 className="font-semibold text-dark">Example savings</h3>
        <p className="mt-2 text-sm text-muted">
          Classic Cotton Tee: retail {formatPrice(24.99)} → bulk 36+ at{" "}
          {formatPrice(15.99)}/pc (36% off)
        </p>
      </div>
    </div>
  );
}
