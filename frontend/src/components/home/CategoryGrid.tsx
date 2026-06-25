import Link from "next/link";
import type { Category } from "@/types/database";
import Image from "next/image";
import { resolveProductImage } from "@/lib/images";

export default function CategoryGrid({
  categories,
  title,
}: {
  categories: Category[];
  title: string;
}) {
  return (
    <section className="container-custom py-14">
      <h2 className="section-title mb-8">{title}</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {categories.map((cat) => {
          const image = resolveProductImage(cat.image_url);
          return (
          <Link
            key={cat.id}
            href={`/shop?category=${cat.slug}`}
            className="group relative overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-soft)]"
          >
            <div className="relative aspect-square bg-gray-1">
              <Image
                src={image}
                alt={cat.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark/70 via-dark/20 to-transparent" />
              <span className="absolute bottom-4 left-4 text-lg font-semibold text-white">
                {cat.name}
              </span>
            </div>
          </Link>
          );
        })}
      </div>
    </section>
  );
}
