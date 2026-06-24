export type HeroSlide = {
  tag: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  image: string;
};

export type FeatureItem = {
  title: string;
  description: string;
  icon: string;
};

export type PromoBanner = {
  label: string;
  title: string;
  description: string;
  style: "brand" | "dark";
};

export type HomepageContent = {
  heroSlides: HeroSlide[];
  heroSecondaryCta: string;
  heroSecondaryHref: string;
  features: FeatureItem[];
  categoriesTitle: string;
  newArrivalsTitle: string;
  newArrivalsLimit: number;
  promoBanners: PromoBanner[];
  featuredTitle: string;
  featuredLimit: number;
  newsletterTitle: string;
  newsletterSubtitle: string;
  newsletterPlaceholder: string;
  newsletterButton: string;
};
