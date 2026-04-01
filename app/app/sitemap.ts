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
    { url: `${BASE}/animals`,    lastModified: NOW, changeFrequency: "monthly", priority: 0.85 },

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
    { url: `${BASE}/wcf`,     lastModified: NOW, changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE}/origins`, lastModified: NOW, changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE}/wealth`,      lastModified: NOW, changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE}/five-clues`,  lastModified: NOW, changeFrequency: "monthly", priority: 0.75 },

    // ── Animals games ─────────────────────────────────────────────────────────
    { url: `${BASE}/wild-battle`, lastModified: NOW, changeFrequency: "monthly", priority: 0.75 },

    // ── Rules pages ───────────────────────────────────────────────────────────
    { url: `${BASE}/football-rules`,        lastModified: NOW, changeFrequency: "monthly", priority: 0.65 },
    { url: `${BASE}/nba-rules`,             lastModified: NOW, changeFrequency: "monthly", priority: 0.65 },
    { url: `${BASE}/career-rules`,          lastModified: NOW, changeFrequency: "monthly", priority: 0.65 },
    { url: `${BASE}/wild-battle-rules`,     lastModified: NOW, changeFrequency: "monthly", priority: 0.65 },
    { url: `${BASE}/food-rules`,            lastModified: NOW, changeFrequency: "monthly", priority: 0.65 },
    { url: `${BASE}/origins-rules`,         lastModified: NOW, changeFrequency: "monthly", priority: 0.65 },
    { url: `${BASE}/higher-or-lower-rules`, lastModified: NOW, changeFrequency: "monthly", priority: 0.65 },
    { url: `${BASE}/citymix-rules`,         lastModified: NOW, changeFrequency: "monthly", priority: 0.65 },
    { url: `${BASE}/city-origins-rules`,    lastModified: NOW, changeFrequency: "monthly", priority: 0.65 },
    { url: `${BASE}/wealth-rules`,          lastModified: NOW, changeFrequency: "monthly", priority: 0.65 },
    { url: `${BASE}/five-clues-rules`,      lastModified: NOW, changeFrequency: "monthly", priority: 0.65 },
    { url: `${BASE}/wcf-rules`,             lastModified: NOW, changeFrequency: "monthly", priority: 0.65 },

    // ── Other public pages ────────────────────────────────────────────────────
    { url: `${BASE}/leaderboard`, lastModified: NOW, changeFrequency: "daily", priority: 0.6 },

    // noindex pages (contact, privacy, terms, legal, cookies) intentionally excluded
  ];
}
