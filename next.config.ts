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
    new Set([...defaultDevOrigins, ...localIpv4Origins, ...extraOrigins])
  );
}

const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://images.unsplash.com https://*.public.blob.vercel-storage.com",
  "font-src 'self' data:",
  "connect-src 'self' ws: wss:",
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
    // Keep multipart bodies intact through proxy so the API can return proper upload errors.
    proxyClientMaxBodySize: "25mb",
  },

  allowedDevOrigins: getAllowedDevOrigins(),

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
