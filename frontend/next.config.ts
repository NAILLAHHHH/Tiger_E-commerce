import type { NextConfig } from "next";

const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337";
const strapi = new URL(strapiUrl);
const strapiHost = strapi.hostname;
const strapiPort = strapi.port || "1337";

/** Strapi Cloud stores uploads on a separate media CDN, not /uploads on the API host. */
const strapiMediaHost = strapiHost.endsWith(".strapiapp.com")
  ? strapiHost.replace(".strapiapp.com", ".media.strapiapp.com")
  : null;

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
      ...(strapiMediaHost
        ? [
            {
              protocol: "https" as const,
              hostname: strapiMediaHost,
              pathname: "/**",
            },
          ]
        : []),
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
