import type { NextConfig } from "next";

const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337";
const strapiHost = new URL(strapiUrl).hostname;
const strapiPort = new URL(strapiUrl).port || "1337";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
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
