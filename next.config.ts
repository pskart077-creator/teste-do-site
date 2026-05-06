import os from "node:os";
import type { NextConfig } from "next";

const defaultDevOrigins = ["localhost", "127.0.0.1", "::1", "[::1]"];

function getAllowedDevOrigins() {
  const localIpv4Origins = Object.values(os.networkInterfaces())
    .flatMap((networkInterface) => networkInterface ?? [])
    .filter((address) => address.family === "IPv4" && !address.internal)
    .map((address) => address.address);

  const extraOrigins = (process.env.ALLOWED_DEV_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return Array.from(
    new Set([...defaultDevOrigins, ...localIpv4Origins, ...extraOrigins]),
  );
}

const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect.facebook.net",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://images.unsplash.com https://*.public.blob.vercel-storage.com https://www.facebook.com https://*.facebook.com",
  "font-src 'self' data:",
  "connect-src 'self' ws: wss: https://www.facebook.com https://*.facebook.com https://connect.facebook.net",
  "frame-src 'self' https://www.youtube.com https://player.vimeo.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,

  experimental: {
    proxyClientMaxBodySize: "25mb",
  },

  ...(process.env.NODE_ENV === "development"
    ? {
        allowedDevOrigins: getAllowedDevOrigins(),
      }
    : {}),

  outputFileTracingExcludes: {
    "/*": [
      "./.git/**",
      "./.next/cache/**",
      "./node_modules/.cache/**",

      "./public/uploads/**",
      "./public/**/*.zip",
      "./public/**/*.rar",
      "./public/**/*.7z",
      "./public/**/*.mp4",
      "./public/**/*.mov",
      "./public/**/*.avi",
      "./public/**/*.mkv",
      "./public/**/*.psd",
      "./public/**/*.ai",
      "./public/**/*.fig",

      "./node_modules/prisma/**",
      "./node_modules/@prisma/engines/**",
      "./node_modules/@prisma/debug/**",
      "./node_modules/@prisma/engines-version/**",
      "./node_modules/@prisma/fetch-engine/**",
      "./node_modules/@prisma/get-platform/**",

      "./node_modules/@next/swc-*/**",
      "./node_modules/@swc/core-*/**",
      "./node_modules/@esbuild/**",
      "./node_modules/typescript/**",
    ],
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
    localPatterns: [
      {
        pathname: "/assets/img/**",
      },
      {
        pathname: "/uploads/news/**",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;