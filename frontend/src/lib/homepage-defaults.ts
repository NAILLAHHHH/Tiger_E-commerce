import { userProductImages as img } from "@/lib/images";
import type { HomepageContent } from "@/types/homepage";

export const defaultHomepageContent: HomepageContent = {
  heroSlides: [
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
      subtitle:
        "Suits, dress shirts, and chinos built for retail and bulk orders.",
      cta: "Browse Catalog",
      href: "/shop?category=formal",
      image: img.suitCollection,
    },
  ],
  heroSecondaryCta: "Bulk pricing",
  heroSecondaryHref: "/wholesale",
  features: [
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
  ],
  categoriesTitle: "Browse by Category",
  newArrivalsTitle: "New Arrivals",
  newArrivalsLimit: 8,
  promoBanners: [
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
  ],
  featuredTitle: "Featured",
  featuredLimit: 4,
  newsletterTitle: "Don't Miss Latest Drops & Bulk Deals",
  newsletterSubtitle:
    "Get notified about new arrivals, restocks, and wholesale price updates.",
  newsletterPlaceholder: "Enter your email",
  newsletterButton: "Subscribe",
};
