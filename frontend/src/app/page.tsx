import CategoryGrid from "@/components/home/CategoryGrid";
import FeaturesBar from "@/components/home/FeaturesBar";
import HeroCarousel from "@/components/home/HeroCarousel";
import Newsletter from "@/components/home/Newsletter";
import ProductSection from "@/components/home/ProductSection";
import PromoBanners from "@/components/home/PromoBanners";
import ContactCta from "@/components/layout/ContactCta";
import { getHomepageContent } from "@/lib/homepage";
import {
  getCategories,
  getNewArrivals,
  getProducts,
} from "@/lib/products";
import { getRatingSummaries } from "@/lib/reviews";

export default async function HomePage() {
  const homepage = await getHomepageContent();

  const [categories, newArrivals, featured, ratings] = await Promise.all([
    getCategories(),
    getNewArrivals(homepage.newArrivalsLimit),
    getProducts({ featured: true, limit: homepage.featuredLimit }),
    getRatingSummaries(),
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
        ratings={ratings}
      />
      <PromoBanners banners={homepage.promoBanners} />
      <ProductSection
        title={homepage.featuredTitle}
        products={featured}
        viewAllHref="/shop"
        ratings={ratings}
      />
      <Newsletter
        title={homepage.newsletterTitle}
        subtitle={homepage.newsletterSubtitle}
        placeholder={homepage.newsletterPlaceholder}
        buttonText={homepage.newsletterButton}
      />
      <section className="container-custom pb-14">
        <ContactCta />
      </section>
    </>
  );
}
