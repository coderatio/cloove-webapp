import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  additionalPrecacheEntries: [{ url: "/offline", revision: Date.now().toString() }],
});

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'clooveai.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'africanfabs.com',
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async rewrites() {
    // Use server-only var for the proxy destination (no NEXT_PUBLIC_ needed for rewrites).
    // Falls back to production API when not set.
    const baseUrl = process.env.API_BASE_URL || "https://api.clooveai.com";
    const destinationBase = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

    return [
      {
        source: "/api/:path*",
        destination: `${destinationBase}/:path*`,
      },
    ];
  },
} as NextConfig;

export default withSerwist(nextConfig);
