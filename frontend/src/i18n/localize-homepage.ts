import type { Locale } from "@/i18n";
import type { HomepageContent } from "@/types/homepage";

/** English homepage / CMS phrases → Kinyarwanda. Unmatched admin copy is left as-is. */
const HOME_RW: Record<string, string> = {
  "New Collection": "Imyenda mishya",
  "TygaMart Essentials": "Ibicuruzwa bya TygaMart",
  "TygaStyle Essentials": "Ibicuruzwa bya TygaMart",
  "Tees, hoodies, chinos & suits — pick your size and color.":
    "T-shirt, hoodies, chinos n'amasuti — hitamo size n'ibara.",
  "Tees, hoodies, chinos & suits — retail per piece or bulk from 10+ units.":
    "T-shirt, hoodies, chinos n'amasuti — hitamo size n'ibara.",
  "Shop New Arrivals": "Gura Imyenda mishya",
  "New Arrivals": "Imyenda mishya",
  "Fresh Drops": "Ibyashyizweho vuba",
  "Mixed-color quarter-zips and everyday layers, in stock now.":
    "Quarter-zips z'amabara atandukanye n'imyenda ya buri munsi, irahari.",
  "Mixed-color quarter-zip packs with tiered pricing for resellers.":
    "Amapaki ya quarter-zip y'amabara atandukanye, ahari ubu.",
  "Shop now": "Gura none",
  "View Wholesale": "Reba isoko",
  Wholesale: "Isoko",
  "Buy in Bulk, Save More": "Ibyashyizweho vuba",
  "Premium Quality": "Ubwiza bwo hejuru",
  "Formal & Tailored": "Imyenda idoze",
  "Suits, dress shirts, and chinos built to last.":
    "Amasuti, amashati y'ikigo, na chinos zihagaze igihe kirekire.",
  "Suits, dress shirts, and chinos built for retail and bulk orders.":
    "Amasuti, amashati y'ikigo, na chinos zihagaze igihe kirekire.",
  "Browse Catalog": "Reba ibicuruzwa",
  "Shop all": "Ibicuruzwa byose",
  "Bulk pricing": "Gura none",
  "Bulk Pricing": "Ibiciro",
  "Tiered rates from 10+ pcs": "Hitamo ingano n'ibara",
  "Live Inventory": "Stock ihari",
  "Stock synced per size & color": "Stock ihujwe n'ingano n'ibara",
  "Dedicated Support": "Ubufasha bwihariye",
  "Help with sizes and delivery": "Ubufasha ku ngano na delivery",
  "Retail & wholesale help": "Ubufasha ku ngano na delivery",
  "Quality Pieces": "Imyenda myiza",
  "Everyday and formal apparel": "Imyenda ya buri munsi n'iyo kuzindukana",
  "Browse by Category": "Shakisha ku cyiciro",
  Shop: "Isoko",
  Retail: "Isoko",
  "Shop Per Piece": "Gura kuri kimwe",
  "Pick your size & color. Same quality, no fuss.":
    "Hitamo ingano n'ibara. Ubwiza bumwe, nta kibazo.",
  "Pick your size & color. Same quality, no minimum order.":
    "Hitamo ingano n'ibara. Ubwiza bumwe, nta kibazo.",
  New: "Bishya",
  "Fresh arrivals": "Ibishya",
  "New styles added regularly — check back often.":
    "Imyenda mishya irashyirwaho kenshi — subira kureba.",
  "Starts from 10 units. Perfect for boutiques & print shops.":
    "Imyenda mishya irashyirwaho kenshi — subira kureba.",
  Featured: "Byatoranijwe",
  "Don't Miss Latest Drops": "Ntuzirebe ibishya",
  "Don't Miss Latest Drops & Bulk Deals": "Ntuzirebe ibishya",
  "Get notified about new arrivals and restocks.":
    "Menyeshwa ibishya.",
  "Get notified about new arrivals, restocks, and wholesale price updates.":
    "Menyeshwa ibishya.",
  "Enter your email": "Andika imeyili yawe",
  Subscribe: "Iyandikishe",
  "Quality apparel": "Imyenda myiza",
};

const HOME_RW_LOWER = new Map(
  Object.entries(HOME_RW).map(([en, rw]) => [en.toLowerCase(), rw]),
);

export function localizeHomeText(text: string, locale: Locale): string {
  if (locale !== "rw" || !text) return text;
  return HOME_RW[text] ?? HOME_RW_LOWER.get(text.toLowerCase()) ?? text;
}

export function localizeHomepage(
  content: HomepageContent,
  locale: Locale,
): HomepageContent {
  if (locale !== "rw") return content;
  const x = (s: string) => localizeHomeText(s, locale);
  return {
    ...content,
    heroSlides: content.heroSlides.map((slide) => ({
      ...slide,
      tag: x(slide.tag),
      title: x(slide.title),
      subtitle: x(slide.subtitle),
      cta: x(slide.cta),
    })),
    heroSecondaryCta: x(content.heroSecondaryCta),
    features: content.features.map((feature) => ({
      ...feature,
      title: x(feature.title),
      description: x(feature.description),
    })),
    categoriesTitle: x(content.categoriesTitle),
    newArrivalsTitle: x(content.newArrivalsTitle),
    promoBanners: content.promoBanners.map((banner) => ({
      ...banner,
      label: x(banner.label),
      title: x(banner.title),
      description: x(banner.description),
    })),
    featuredTitle: x(content.featuredTitle),
    newsletterTitle: x(content.newsletterTitle),
    newsletterSubtitle: x(content.newsletterSubtitle),
    newsletterPlaceholder: x(content.newsletterPlaceholder),
    newsletterButton: x(content.newsletterButton),
  };
}
