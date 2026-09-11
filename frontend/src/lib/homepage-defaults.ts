import { userProductImages as img } from "@/lib/images";
import type { HomepageContent } from "@/types/homepage";

export const defaultHomepageContent: HomepageContent = {
  heroSlides: [
    {
      tag: "New Collection",
      title: "TygaMart Essentials",
      subtitle:
        "Tees, hoodies, chinos & suits — pick your size and color.",
      cta: "Shop New Arrivals",
      href: "/shop",
      image: img.tygaStyleTeeSet,
    },
    {
      tag: "New Arrivals",
      title: "Fresh Drops",
      subtitle:
        "Mixed-color quarter-zips and everyday layers, in stock now.",
      cta: "Shop now",
      href: "/shop",
      image: img.quarterZipBulkPack,
    },
    {
      tag: "Premium Quality",
      title: "Formal & Tailored",
      subtitle: "Suits, dress shirts, and chinos built to last.",
      cta: "Browse Catalog",
      href: "/shop?category=formal",
      image: img.suitCollection,
    },
  ],
  heroSecondaryCta: "Shop all",
  heroSecondaryHref: "/shop",
  features: [
    {
      title: "Live Inventory",
      description: "Stock synced per size & color",
      icon: "stock",
    },
    {
      title: "Dedicated Support",
      description: "Help with sizes and delivery",
      icon: "support",
    },
    {
      title: "Quality Pieces",
      description: "Everyday and formal apparel",
      icon: "mark",
    },
  ],
  categoriesTitle: "Browse by Category",
  newArrivalsTitle: "New Arrivals",
  newArrivalsLimit: 8,
  promoBanners: [
    {
      label: "Shop",
      title: "Shop Per Piece",
      description: "Pick your size & color. Same quality, no fuss.",
      style: "brand",
    },
    {
      label: "New",
      title: "Fresh arrivals",
      description: "New styles added regularly — check back often.",
      style: "dark",
    },
  ],
  featuredTitle: "Featured",
  featuredLimit: 4,
  newsletterTitle: "Don't Miss Latest Drops",
  newsletterSubtitle:
    "Get notified about new arrivals and restocks.",
  newsletterPlaceholder: "Enter your email",
  newsletterButton: "Subscribe",
};
