import type { PromoBanner } from "@/types/homepage";

type Props = {
  banners: PromoBanner[];
};

export default function PromoBanners({ banners }: Props) {
  if (!banners.length) return null;

  return (
    <section className="container-custom grid gap-4 py-10 md:grid-cols-2">
      {banners.map((banner) => (
        <div
          key={`${banner.label}-${banner.title}`}
          className={`relative overflow-hidden rounded-xl p-8 text-white ${
            banner.style === "dark"
              ? "bg-dark"
              : "bg-gradient-to-br from-brand to-brand-dark"
          }`}
        >
          <p
            className={`text-xs font-semibold uppercase tracking-wider ${
              banner.style === "dark" ? "text-brand" : "opacity-90"
            }`}
          >
            {banner.label}
          </p>
          <h3 className="mt-2 text-2xl font-bold">{banner.title}</h3>
          <p
            className={`mt-2 max-w-xs text-sm ${
              banner.style === "dark" ? "text-gray-4" : "opacity-90"
            }`}
          >
            {banner.description}
          </p>
        </div>
      ))}
    </section>
  );
}
