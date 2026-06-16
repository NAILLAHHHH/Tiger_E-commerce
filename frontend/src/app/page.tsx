import CategoryGrid from "@/components/home/CategoryGrid";
import FeaturesBar from "@/components/home/FeaturesBar";
import HeroCarousel from "@/components/home/HeroCarousel";
import Newsletter from "@/components/home/Newsletter";
import ProductSection from "@/components/home/ProductSection";
import PromoBanners from "@/components/home/PromoBanners";
import {
  getCategories,
  getNewArrivals,
  getProducts,
} from "@/lib/products";

export default async function HomePage() {
  const [categories, newArrivals, featured] = await Promise.all([
    getCategories(),
    getNewArrivals(8),
    getProducts({ featured: true, limit: 4 }),
  ]);

  return (
    <>
      <HeroCarousel />
      <FeaturesBar />
      <CategoryGrid categories={categories} />
      <ProductSection
        title="New Arrivals"
        products={newArrivals}
        viewAllHref="/shop"
      />
      <PromoBanners />
      <ProductSection
        title="Featured"
        products={featured}
        viewAllHref="/shop"
      />
      <Newsletter />
    </>
  );
}
