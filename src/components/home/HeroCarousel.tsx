"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { userProductImages as img } from "@/lib/images";

const slides = [
  {
    tag: "New Collection",
    title: "TygaStyle Essentials",
    subtitle:
      "Tees, hoodies, chinos & suits — retail per piece or bulk from 10+ units.",
    cta: "Shop New Arrivals",
    href: "/shop",
    image: img.tygaStyleTeeSet,
  },
  {
    tag: "Wholesale",
    title: "Buy in Bulk, Save More",
    subtitle:
      "Mixed-color quarter-zip packs with tiered pricing for resellers.",
    cta: "View Wholesale",
    href: "/wholesale",
    image: img.quarterZipBulkPack,
  },
  {
    tag: "Premium Quality",
    title: "Formal & Tailored",
    subtitle: "Suits, dress shirts, and chinos built for retail and bulk orders.",
    cta: "Browse Catalog",
    href: "/shop?category=formal",
    image: img.suitCollection,
  },
];

export default function HeroCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setActive((i) => (i + 1) % slides.length),
      6000,
    );
    return () => clearInterval(timer);
  }, []);

  const slide = slides[active];

  return (
    <section className="container-custom py-6 md:py-8">
      <div className="relative overflow-hidden rounded-2xl bg-dark shadow-[var(--shadow-card)]">
        <div className="grid min-h-[420px] md:grid-cols-2 md:min-h-[480px]">
          <div className="relative z-10 flex flex-col justify-center p-8 md:p-12 lg:p-16">
            <span className="mb-3 inline-flex w-fit rounded-full bg-brand-light px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-dark">
              {slide.tag}
            </span>
            <h1 className="text-3xl font-bold leading-tight text-white md:text-4xl lg:text-5xl">
              {slide.title}
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-gray-4 md:text-base">
              {slide.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={slide.href} className="btn-primary">
                {slide.cta}
              </Link>
              <Link
                href="/wholesale"
                className="inline-flex items-center justify-center rounded-[5px] border border-white/25 bg-transparent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:border-brand hover:text-brand"
              >
                Bulk pricing
              </Link>
            </div>

            <div className="mt-10 flex gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => setActive(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === active
                      ? "w-8 bg-brand"
                      : "w-4 bg-dark-4 hover:bg-gray-4"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="relative min-h-[240px] md:min-h-full">
            {slides.map((s, i) => (
              <div
                key={s.title}
                className={`absolute inset-0 transition-opacity duration-700 ${
                  i === active ? "opacity-100" : "opacity-0"
                }`}
              >
                <Image
                  src={s.image}
                  alt={s.title}
                  fill
                  priority={i === 0}
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-dark via-dark/40 to-transparent md:from-dark/80" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
