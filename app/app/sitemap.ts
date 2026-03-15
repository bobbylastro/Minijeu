import { MetadataRoute } from "next";

const BASE = "https://ultimate-playground.com";
const NOW  = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // ── Homepage ──────────────────────────────────────────────────────────────
    { url: BASE, lastModified: NOW, changeFrequency: "weekly",  priority: 1.0 },

    // ── Category pages ────────────────────────────────────────────────────────
    { url: `${BASE}/world`,      lastModified: NOW, changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE}/sports`,     lastModified: NOW, changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE}/food-games`, lastModified: NOW, changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE}/culture`,    lastModified: NOW, changeFrequency: "monthly", priority: 0.85 },

    // ── World games ───────────────────────────────────────────────────────────
    { url: `${BASE}/citymix`,         lastModified: NOW, changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE}/higher-or-lower`, lastModified: NOW, changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE}/city-origins`,    lastModified: NOW, changeFrequency: "monthly", priority: 0.75 },

    // ── Sports games ──────────────────────────────────────────────────────────
    { url: `${BASE}/football`, lastModified: NOW, changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE}/nba`,      lastModified: NOW, changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE}/career`,   lastModified: NOW, changeFrequency: "monthly", priority: 0.75 },

    // ── Food games ────────────────────────────────────────────────────────────
    { url: `${BASE}/food`, lastModified: NOW, changeFrequency: "monthly", priority: 0.75 },

    // ── Culture games ─────────────────────────────────────────────────────────
    { url: `${BASE}/wcf`, lastModified: NOW, changeFrequency: "monthly", priority: 0.75 },

    // ── Other public pages ────────────────────────────────────────────────────
    { url: `${BASE}/leaderboard`, lastModified: NOW, changeFrequency: "daily", priority: 0.6 },

    // noindex pages (contact, privacy, terms, legal, cookies) intentionally excluded
  ];
}
