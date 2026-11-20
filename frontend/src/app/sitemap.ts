import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://tygamart.rw"; // Replace with your actual domain

  // 1. Static public pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/wholesale`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/data-usage`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // 2. Dynamic product pages (/shop/[slug])
  // Uncomment and connect to your Supabase/Neon client to fetch your product slugs:
  /*
  const { data: products } = await supabase.from('products').select('slug, updated_at')
  
  const productRoutes: MetadataRoute.Sitemap = (products ?? []).map((product) => ({
    url: `${baseUrl}/shop/${product.slug}`,
    lastModified: new Date(product.updated_at || new Date()),
    changeFrequency: "weekly",
    priority: 0.7,
  }))
  */

  return [
    ...staticRoutes,
    // ...productRoutes, // Uncomment this once you add your database query above
  ];
}
