export type SeedHeroSlide = {
  tag: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  image: string;
};

export type SeedFeatureItem = {
  title: string;
  description: string;
  icon: string;
};

export type SeedPromoBanner = {
  label: string;
  title: string;
  description: string;
  style: "brand" | "dark";
};

export type SeedHomepageScalars = {
  hero_secondary_cta: string;
  hero_secondary_href: string;
  categories_title: string;
  new_arrivals_title: string;
  new_arrivals_limit: number;
  featured_title: string;
  featured_limit: number;
  newsletter_title: string;
  newsletter_subtitle: string;
  newsletter_placeholder: string;
  newsletter_button: string;
};

export const seedHomepageScalars: SeedHomepageScalars = {
  hero_secondary_cta: "Bulk pricing",
  hero_secondary_href: "/wholesale",
  categories_title: "Browse by Category",
  new_arrivals_title: "New Arrivals",
  new_arrivals_limit: 8,
  featured_title: "Featured",
  featured_limit: 4,
  newsletter_title: "Don't Miss Latest Drops & Bulk Deals",
  newsletter_subtitle:
    "Get notified about new arrivals, restocks, and wholesale price updates.",
  newsletter_placeholder: "Enter your email",
  newsletter_button: "Subscribe",
};

export const seedHeroSlides: SeedHeroSlide[] = [
  {
    tag: "New Collection",
    title: "TygaStyle Essentials",
    subtitle:
      "Tees, hoodies, chinos & suits — retail per piece or bulk from 10+ units.",
    cta: "Shop New Arrivals",
    href: "/shop",
    image: "/products/21-tygastyle-tee-set.png",
  },
  {
    tag: "Wholesale",
    title: "Buy in Bulk, Save More",
    subtitle:
      "Mixed-color quarter-zip packs with tiered pricing for resellers.",
    cta: "View Wholesale",
    href: "/wholesale",
    image: "/products/03-quarter-zip-bulk-pack.png",
  },
  {
    tag: "Premium Quality",
    title: "Formal & Tailored",
    subtitle:
      "Suits, dress shirts, and chinos built for retail and bulk orders.",
    cta: "Browse Catalog",
    href: "/shop?category=formal",
    image: "/products/13-suit-collection.png",
  },
];

export const seedFeatures: SeedFeatureItem[] = [
  {
    title: "Bulk Pricing",
    description: "Tiered rates from 10+ pcs",
    icon: "📦",
  },
  {
    title: "Live Inventory",
    description: "Stock synced per size & color",
    icon: "✓",
  },
  {
    title: "Dedicated Support",
    description: "Retail & wholesale help",
    icon: "💬",
  },
];

export const seedPromoBanners: SeedPromoBanner[] = [
  {
    label: "Retail",
    title: "Shop Per Piece",
    description: "Pick your size & color. Same quality, no minimum order.",
    style: "brand",
  },
  {
    label: "Wholesale",
    title: "Up to 40% Off Bulk",
    description: "MOQ from 10 units. Perfect for boutiques & print shops.",
    style: "dark",
  },
];
