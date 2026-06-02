import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "*.supabase.co";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://www.google-analytics.com https://googleads.g.doubleclick.net https://www.googleadservices.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://${supabaseHost} https://www.google-analytics.com https://www.googletagmanager.com`,
  "media-src 'self' https://clips.ultimate-playground.com",
  `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://clips.ultimate-playground.com https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net`,
  "font-src 'self'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const DELETED_ROUTES = [
  "/animal-locator",
  "/animal-locator-rules",
  "/animals",
  "/career",
  "/career-rules",
  "/city-origins",
  "/city-origins-rules",
  "/citymix",
  "/citymix-rules",
  "/culture",
  "/devine",
  "/five-clues",
  "/five-clues-rules",
  "/food",
  "/food-games",
  "/food-rules",
  "/football",
  "/football-rules",
  "/game-tournament",
  "/game-tournament-rules",
  "/gaming",
  "/gaming-mix",
  "/gaming-mix-rules",
  "/higher-or-lower",
  "/higher-or-lower-rules",
  "/hotel-price",
  "/hotel-price-rules",
  "/leaderboard",
  "/nba",
  "/nba-rules",
  "/origins",
  "/origins-rules",
  "/profile",
  "/sports",
  "/wcf",
  "/wcf-rules",
  "/wealth",
  "/wealth-rules",
  "/wild-battle",
  "/wild-battle-rules",
  "/world",
  "/admin",
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: supabaseHost },
    ],
  },
  async redirects() {
    const staticRedirects = DELETED_ROUTES.map((source) => ({
      source,
      destination: "/",
      permanent: true,
    }));
    return [
      ...staticRedirects,
      { source: "/blog/:path*", destination: "/", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/clips/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options",    value: "nosniff" },
          { key: "X-Frame-Options",           value: "DENY" },
          { key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "Permissions-Policy",        value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
          { key: "Content-Security-Policy",   value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
