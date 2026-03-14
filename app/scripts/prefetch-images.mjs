#!/usr/bin/env node
/**
 * Pre-fetches Wikipedia image URLs and writes them directly into the game data JSON files.
 * Run with: node scripts/prefetch-images.mjs
 *
 * After running, each item with a `wiki` field will have an `image_url` field.
 * Components will use `image_url` directly, eliminating all client-side Wikipedia API calls.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../app");

// Same mapping as CareerOrderGame.tsx WIKI_CLUB
const WIKI_CLUB = {
  Ajax:                "AFC Ajax",
  Monaco:              "AS Monaco FC",
  "AS Monaco":         "AS Monaco FC",
  Chelsea:             "Chelsea F.C.",
  Liverpool:           "Liverpool F.C.",
  Arsenal:             "Arsenal F.C.",
  Everton:             "Everton F.C.",
  Southampton:         "Southampton F.C.",
  "Manchester United": "Manchester United F.C.",
  "Manchester City":   "Manchester City F.C.",
  "Tottenham Hotspur": "Tottenham Hotspur F.C.",
  "West Ham United":   "West Ham United F.C.",
  "Leeds United":      "Leeds United F.C.",
  "Queens Park Rangers": "Queens Park Rangers F.C.",
  "Fenerbahçe":        "Fenerbahçe S.K. (football)",
  Galatasaray:         "Galatasaray S.K. (football)",
  Santos:              "Santos FC",
  "São Paulo":         "São Paulo FC",
  Cruzeiro:            "Cruzeiro Esporte Clube",
  Grêmio:              "Grêmio Foot-Ball Porto Alegrense",
  Palmeiras:           "Palmeiras",
  Independiente:       "Club Atlético Independiente",
  Anderlecht:          "R.S.C. Anderlecht",
  Genk:                "K.R.C. Genk",
  Basel:               "FC Basel",
  Fiorentina:          "ACF Fiorentina",
  Udinese:             "Udinese Calcio",
  Mallorca:            "RCD Mallorca",
  Guingamp:            "En Avant de Guingamp",
  "Schalke 04":        "FC Schalke 04",
  "Werder Bremen":     "SV Werder Bremen",
  Molde:               "Molde FK",
  "Red Bull Salzburg": "FC Red Bull Salzburg",
  LAFC:                "Los Angeles FC",
  "Orlando City":      "Orlando City SC",
  "DC United":         "D.C. United",
  "Al-Nassr":          "Al-Nassr FC",
  "Al-Hilal":          "Al-Hilal FC",
  "Al-Sadd":           "Al-Sadd SC",
  "Anzhi Makhachkala": "FC Anzhi Makhachkala",
  "Dinamo Zagreb":     "GNK Dinamo Zagreb",
  "Inter Milan":       "Inter Milan",
  Juventus:            "Juventus FC",
  "Real Madrid":       "Real Madrid CF",
  "Bayern Munich":     "FC Bayern Munich",
  "Paris Saint-Germain": "Paris Saint-Germain F.C.",
  "Inter Miami":       "Inter Miami CF",
  "Borussia Dortmund": "Borussia Dortmund",
  "Lech Poznań":       "Lech Poznań",
  // Additional clubs from career_data
  Cannes:              "AS Cannes",
  Bordeaux:            "FC Girondins de Bordeaux",
  "FC Barcelona":      "FC Barcelona",
  "Sporting CP":       "Sporting CP",
  "LA Galaxy":         "LA Galaxy",
  "Malmö FF":          "Malmö FF",
  "Olympique de Marseille": "Olympique de Marseille",
  "AC Milan":          "A.C. Milan",
  "AS Roma":           "AS Roma",
  PSV:                 "PSV Eindhoven",
  "PSV Eindhoven":     "PSV Eindhoven",
  Benfica:             "S.L. Benfica",
  "FC Porto":          "FC Porto",
  Atletico:            "Club Atlético de Madrid",
  "Atlético Madrid":   "Club Atlético de Madrid",
  "Sevilla FC":        "Sevilla FC",
  "Villarreal CF":     "Villarreal CF",
  Valencia:            "Valencia CF",
  "Valencia CF":       "Valencia CF",
  "Real Betis":        "Real Betis",
  Celtic:              "Celtic F.C.",
  Rangers:             "Rangers F.C.",
};

const DELAY_MS = 400; // polite delay between requests
const cache = new Map();
let requestCount = 0;
let skippedCount = 0;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url) {
  await sleep(DELAY_MS);
  requestCount++;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "UltimatePlayground/1.0 (educational quiz app; image prefetch script)",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function normalizeImgSrc(src) {
  if (!src) return null;
  if (src.startsWith("//")) return "https:" + src;
  if (src.startsWith("/")) return "https://en.wikipedia.org" + src;
  return src;
}

function extractInfboxImgUrl(html) {
  // Try infobox-image or images cells first (most reliable for logos)
  const cellPatterns = [
    /class="[^"]*infobox-image[^"]*"[^>]*>[\s\S]{0,600}?<img[^>]+src="([^"]+)"/i,
    /class="[^"]*images[^"]*"[^>]*>[\s\S]{0,600}?<img[^>]+src="([^"]+)"/i,
  ];
  for (const pat of cellPatterns) {
    const m = html.match(pat);
    if (m) return normalizeImgSrc(m[1]);
  }

  // Fallback: first img with width > 30 inside any infobox/vcard table
  const tableMatch = html.match(
    /<table[^>]*class="[^"]*(?:infobox|vcard)[^"]*"[^>]*>([\s\S]*?)<\/table>/i
  );
  if (tableMatch) {
    const imgRegex = /<img\s[^>]*>/gi;
    let m;
    while ((m = imgRegex.exec(tableMatch[1])) !== null) {
      const tag = m[0];
      const wMatch = tag.match(/width="(\d+)"/i);
      const sMatch = tag.match(/src="([^"]+)"/i);
      if (wMatch && sMatch && parseInt(wMatch[1]) > 30) {
        return normalizeImgSrc(sMatch[1]);
      }
    }
  }
  return null;
}

async function fetchImageUrl(wikiTitle) {
  if (cache.has(wikiTitle)) return cache.get(wikiTitle);

  let url = null;

  // 1) pageimages API (fastest, usually returns thumbnail)
  try {
    const data = await fetchJson(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(wikiTitle)}&prop=pageimages&format=json&pithumbsize=400&origin=*`
    );
    const pages = data?.query?.pages;
    const page = Object.values(pages ?? {})[0];
    if (page?.thumbnail?.source) url = page.thumbnail.source;
  } catch (e) {
    console.warn(`    [pageimages] ${wikiTitle}: ${e.message}`);
  }

  // 2) REST summary API
  if (!url) {
    try {
      const rest = await fetchJson(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`
      );
      url = rest?.originalimage?.source ?? rest?.thumbnail?.source ?? null;
    } catch (e) {
      console.warn(`    [summary] ${wikiTitle}: ${e.message}`);
    }
  }

  // 3) Parse infobox HTML (last resort — heavy, but works for logos)
  if (!url) {
    try {
      const data = await fetchJson(
        `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(wikiTitle)}&prop=text&format=json&origin=*&section=0&redirects=1`
      );
      const html = data?.parse?.text?.["*"] ?? "";
      if (html) url = extractInfboxImgUrl(html);
    } catch (e) {
      console.warn(`    [infobox] ${wikiTitle}: ${e.message}`);
    }
  }

  if (url) {
    console.log(`    ✓ ${wikiTitle}`);
  } else {
    console.warn(`    ✗ No image: "${wikiTitle}"`);
  }

  cache.set(wikiTitle, url);
  return url;
}

/** Adds image_url to every item in the array that has a `wiki` field and no image_url yet. */
async function resolveItems(items, label) {
  let changed = 0;
  const todo = items.filter((item) => item.wiki && !item.image_url);
  console.log(`  → ${label}: ${todo.length} to resolve (${items.length - todo.length} already done)`);
  for (const item of todo) {
    const url = await fetchImageUrl(item.wiki);
    if (url) { item.image_url = url; changed++; }
  }
  return changed;
}

/** Resolves club/team logo URLs into a `logos` object keyed by display name. */
async function resolveLogos(names, existingLogos, wikiMapping, label) {
  let changed = 0;
  const todo = [...names].filter((n) => !existingLogos[n]);
  console.log(`  → ${label}: ${todo.length} to resolve (${names.size - todo.length} already done)`);
  for (const name of todo) {
    const wikiTitle = wikiMapping[name] ?? name;
    const url = await fetchImageUrl(wikiTitle);
    if (url) { existingLogos[name] = url; changed++; }
  }
  return changed;
}

async function main() {
  console.log("🖼  Pre-fetching Wikipedia images into game data JSON files\n");
  let totalChanged = 0;

  // ── football_data.json ────────────────────────────────────────────────────
  {
    const path = join(DATA_DIR, "football_data.json");
    const data = JSON.parse(readFileSync(path, "utf8"));
    console.log("⚽  football_data.json");
    totalChanged += await resolveItems(data.transfers, "transfers");
    totalChanged += await resolveItems(data.stadiums, "stadiums");
    totalChanged += await resolveItems(data.salaries, "salaries");
    totalChanged += await resolveItems(data.peaks, "peaks");
    writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
    console.log("  ✅ Saved\n");
  }

  // ── nba_data.json ─────────────────────────────────────────────────────────
  {
    const path = join(DATA_DIR, "nba_data.json");
    const data = JSON.parse(readFileSync(path, "utf8"));
    console.log("🏀  nba_data.json");
    totalChanged += await resolveItems(data.arenas, "arenas");
    totalChanged += await resolveItems(data.contracts, "contracts");
    totalChanged += await resolveItems(data.salaries, "salaries");
    totalChanged += await resolveItems(data.peaks, "peaks");

    // Team logos referenced in peaks/contracts
    if (!data.team_logos) data.team_logos = {};
    const teamNames = new Set([
      ...data.peaks.map((p) => p.team),
      ...data.contracts.map((p) => p.team),
    ].filter(Boolean));
    // NBA team Wikipedia titles are usually just the team name
    totalChanged += await resolveLogos(teamNames, data.team_logos, {}, "team logos");

    writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
    console.log("  ✅ Saved\n");
  }

  // ── career_data.json ──────────────────────────────────────────────────────
  {
    const path = join(DATA_DIR, "career_data.json");
    const data = JSON.parse(readFileSync(path, "utf8"));
    console.log("🏃  career_data.json");
    totalChanged += await resolveItems(data.players, "players");

    // Club logos
    if (!data.club_logos) data.club_logos = {};
    const allClubs = new Set(data.players.flatMap((p) => p.clubs ?? []));
    totalChanged += await resolveLogos(allClubs, data.club_logos, WIKI_CLUB, "club logos");

    writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
    console.log("  ✅ Saved\n");
  }

  // ── wcf_data.json ─────────────────────────────────────────────────────────
  {
    const path = join(DATA_DIR, "wcf_data.json");
    const data = JSON.parse(readFileSync(path, "utf8"));
    console.log("📅  wcf_data.json");
    totalChanged += await resolveItems(data.events, "events");
    writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
    console.log("  ✅ Saved\n");
  }

  // ── food_data.json ────────────────────────────────────────────────────────
  {
    const path = join(DATA_DIR, "food_data.json");
    const data = JSON.parse(readFileSync(path, "utf8"));
    console.log("🍽️  food_data.json");
    totalChanged += await resolveItems(data, "dishes");
    writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
    console.log("  ✅ Saved\n");
  }

  console.log(
    `✅ Done! ${totalChanged} image URLs added. Total Wikipedia requests: ${requestCount}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
