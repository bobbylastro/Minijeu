import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "*.supabase.co";

const csp = [
  "default-src 'self'",
  // Next.js requires 'unsafe-inline' for hydration scripts
  `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://googleads.g.doubleclick.net https://www.googleadservices.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://upload.wikimedia.org https://flagcdn.com https://${supabaseHost} https://www.google-analytics.com https://www.googletagmanager.com`,
  `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://*.partykit.dev wss://*.partykit.dev https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net`,
  "font-src 'self'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "upload.wikimedia.org" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options",            value: "nosniff" },
          { key: "X-Frame-Options",                   value: "DENY" },
          { key: "Referrer-Policy",                   value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security",         value: "max-age=31536000; includeSubDomains" },
          { key: "Permissions-Policy",                value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
          { key: "Content-Security-Policy",           value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
