import CategoryGrid from "@/components/home/CategoryGrid";
import FeaturesBar from "@/components/home/FeaturesBar";
import HeroCarousel from "@/components/home/HeroCarousel";
import Newsletter from "@/components/home/Newsletter";
import ProductSection from "@/components/home/ProductSection";
import PromoBanners from "@/components/home/PromoBanners";
import { getHomepageContent } from "@/lib/homepage";
import {
  getCategories,
  getNewArrivals,
  getProducts,
} from "@/lib/products";

export default async function HomePage() {
  const homepage = await getHomepageContent();

  const [categories, newArrivals, featured] = await Promise.all([
    getCategories(),
    getNewArrivals(homepage.newArrivalsLimit),
    getProducts({ featured: true, limit: homepage.featuredLimit }),
  ]);

  return (
    <>
      <HeroCarousel
        slides={homepage.heroSlides}
        secondaryCta={homepage.heroSecondaryCta}
        secondaryHref={homepage.heroSecondaryHref}
      />
      <FeaturesBar features={homepage.features} />
      <CategoryGrid categories={categories} title={homepage.categoriesTitle} />
      <ProductSection
        title={homepage.newArrivalsTitle}
        products={newArrivals}
        viewAllHref="/shop"
      />
      <PromoBanners banners={homepage.promoBanners} />
      <ProductSection
        title={homepage.featuredTitle}
        products={featured}
        viewAllHref="/shop"
      />
      <Newsletter
        title={homepage.newsletterTitle}
        subtitle={homepage.newsletterSubtitle}
        placeholder={homepage.newsletterPlaceholder}
        buttonText={homepage.newsletterButton}
      />
    </>
  );
}
