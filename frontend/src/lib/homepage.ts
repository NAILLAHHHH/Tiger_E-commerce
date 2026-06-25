import { cache } from "react";
import { defaultHomepageContent } from "@/lib/homepage-defaults";
import { shouldUseStrapi } from "@/lib/config";
import { strapiFetch, type StrapiEntity } from "@/lib/strapi/client";
import { resolveStrapiImage } from "@/lib/strapi/mappers";
import type {
  FeatureItem,
  HeroSlide,
  HomepageContent,
  PromoBanner,
} from "@/types/homepage";

const HOMEPAGE_POPULATE =
  "populate[hero_slides][populate]=image&populate[features]=true&populate[promo_banners]=true";

function mapHeroSlide(entity: StrapiEntity): HeroSlide | null {
  const title = entity.title ? String(entity.title) : "";
  if (!title) return null;

  const image =
    resolveStrapiImage(entity.image) ??
    defaultHomepageContent.heroSlides[0]?.image ??
    "/placeholder-product.svg";

  return {
    tag: String(entity.tag ?? ""),
    title,
    subtitle: String(entity.subtitle ?? ""),
    cta: String(entity.cta ?? "Shop now"),
    href: String(entity.href ?? "/shop"),
    image,
  };
}

function mapFeature(entity: StrapiEntity): FeatureItem | null {
  const title = entity.title ? String(entity.title) : "";
  if (!title) return null;

  return {
    title,
    description: String(entity.description ?? entity.desc ?? ""),
    icon: String(entity.icon ?? "✓"),
  };
}

function mapPromoBanner(entity: StrapiEntity): PromoBanner | null {
  const title = entity.title ? String(entity.title) : "";
  if (!title) return null;

  return {
    label: String(entity.label ?? ""),
    title,
    description: String(entity.description ?? ""),
    style: entity.style === "dark" ? "dark" : "brand",
  };
}

function mergeWithDefaults(entity: StrapiEntity | null): HomepageContent {
  if (!entity) return defaultHomepageContent;

  const heroSlides = ((entity.hero_slides as StrapiEntity[] | undefined) ?? [])
    .map(mapHeroSlide)
    .filter((slide): slide is HeroSlide => slide != null);

  const features = ((entity.features as StrapiEntity[] | undefined) ?? [])
    .map(mapFeature)
    .filter((feature): feature is FeatureItem => feature != null);

  const promoBanners = (
    (entity.promo_banners as StrapiEntity[] | undefined) ?? []
  )
    .map(mapPromoBanner)
    .filter((banner): banner is PromoBanner => banner != null);

  return {
    heroSlides: heroSlides.length ? heroSlides : defaultHomepageContent.heroSlides,
    heroSecondaryCta:
      String(entity.hero_secondary_cta ?? "") ||
      defaultHomepageContent.heroSecondaryCta,
    heroSecondaryHref:
      String(entity.hero_secondary_href ?? "") ||
      defaultHomepageContent.heroSecondaryHref,
    features: features.length ? features : defaultHomepageContent.features,
    categoriesTitle:
      String(entity.categories_title ?? "") ||
      defaultHomepageContent.categoriesTitle,
    newArrivalsTitle:
      String(entity.new_arrivals_title ?? "") ||
      defaultHomepageContent.newArrivalsTitle,
    newArrivalsLimit: Number(
      entity.new_arrivals_limit ?? defaultHomepageContent.newArrivalsLimit,
    ),
    promoBanners: promoBanners.length
      ? promoBanners
      : defaultHomepageContent.promoBanners,
    featuredTitle:
      String(entity.featured_title ?? "") || defaultHomepageContent.featuredTitle,
    featuredLimit: Number(
      entity.featured_limit ?? defaultHomepageContent.featuredLimit,
    ),
    newsletterTitle:
      String(entity.newsletter_title ?? "") ||
      defaultHomepageContent.newsletterTitle,
    newsletterSubtitle:
      String(entity.newsletter_subtitle ?? "") ||
      defaultHomepageContent.newsletterSubtitle,
    newsletterPlaceholder:
      String(entity.newsletter_placeholder ?? "") ||
      defaultHomepageContent.newsletterPlaceholder,
    newsletterButton:
      String(entity.newsletter_button ?? "") ||
      defaultHomepageContent.newsletterButton,
  };
}

const fetchStrapiHomepage = cache(async (): Promise<HomepageContent> => {
  const json = await strapiFetch<{ data: StrapiEntity | null }>(
    `/api/homepage?${HOMEPAGE_POPULATE}`,
  );
  return mergeWithDefaults(json.data);
});

export async function getHomepageContent(): Promise<HomepageContent> {
  if (!shouldUseStrapi()) return defaultHomepageContent;

  try {
    return await fetchStrapiHomepage();
  } catch {
    return defaultHomepageContent;
  }
}
