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
  async rewrites() {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.clooveai.com";
    // Handle both cases: base URL with and without /api suffix
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
