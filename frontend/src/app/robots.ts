import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://tygamart.rw"; // Replace with your actual domain

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/cart", "/order/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
