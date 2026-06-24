import type { NextConfig } from "next";

const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337";
const strapiHost = new URL(strapiUrl).hostname;
const strapiPort = new URL(strapiUrl).port || "1337";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    // Next.js 16 blocks localhost/private IPs (SSRF protection). Required for local Strapi.
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
    remotePatterns: [
      {
        protocol: "http",
        hostname: strapiHost,
        port: strapiPort,
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: strapiHost,
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
