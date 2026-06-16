import ProductCard from "@/components/shop/ProductCard";
import { getCategories, getProducts } from "@/lib/products";

type Props = {
  searchParams: Promise<{ category?: string }>;
};

export default async function ShopPage({ searchParams }: Props) {
  const { category } = await searchParams;
  const [products, categories] = await Promise.all([
    getProducts({ categorySlug: category }),
    getCategories(),
  ]);

  return (
    <div className="container-custom py-10">
      <div className="mb-8">
        <h1 className="section-title">Shop All</h1>
        <p className="mt-2 text-sm text-muted">
          Per-piece retail or bulk pricing — inventory shown per product.
        </p>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <a
          href="/shop"
          className={`rounded-full px-4 py-1.5 text-sm font-medium ${
            !category
              ? "bg-brand text-white"
              : "bg-gray-1 text-body hover:bg-gray-2"
          }`}
        >
          All
        </a>
        {categories.map((cat) => (
          <a
            key={cat.id}
            href={`/shop?category=${cat.slug}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              category === cat.slug
                ? "bg-brand text-white"
                : "bg-gray-1 text-body hover:bg-gray-2"
            }`}
          >
            {cat.name}
          </a>
        ))}
      </div>

      {products.length === 0 ? (
        <p className="py-16 text-center text-muted">No products in this category.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
