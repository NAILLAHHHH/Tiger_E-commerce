import Link from "next/link";
import type { Category } from "@/types/database";
import Image from "next/image";

export default function CategoryGrid({
  categories,
}: {
  categories: Category[];
}) {
  return (
    <section className="container-custom py-14">
      <h2 className="section-title mb-8">Browse by Category</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/shop?category=${cat.slug}`}
            className="group relative overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-soft)]"
          >
            <div className="relative aspect-square">
              {cat.image_url && (
                <Image
                  src={cat.image_url}
                  alt={cat.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="25vw"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-dark/70 via-dark/20 to-transparent" />
              <span className="absolute bottom-4 left-4 text-lg font-semibold text-white">
                {cat.name}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
