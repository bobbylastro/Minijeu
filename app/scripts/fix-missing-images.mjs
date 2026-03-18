// Run with: node scripts/fix-missing-images.mjs
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath  = join(__dirname, "../app/origins_data.json");

// Items to fix → array of Wikipedia titles to try in order
const FIXES = {
  "Polo":       ["Polo", "Polo sport", "Horses polo"],
  "Tango":      ["Argentine tango", "Tango", "Tango music"],
  "Jazz":       ["Jazz music", "Jazz (music genre)", "New Orleans jazz", "Louis Armstrong"],
  "K-pop":      ["K-pop", "Korean pop music", "Korean idol", "BTS (band)"],
  "Cumbia":     ["Cumbia", "Cumbia music", "Colombian music", "Vallenato"],
  "Bollywood":  ["Hindi cinema", "Bollywood", "Cinema of India", "Bollywood film"],
  "Holi":       ["Holi", "Festival of colours", "Holi festival India"],
  "La Tomatina":["La Tomatina", "Tomatina", "Buñol festival"],
  "Midsommar":  ["Midsummer", "Midsommar", "Swedish Midsummer", "Midsummer pole"],
  "Carnival":   ["Rio Carnival", "Brazilian Carnival", "Carnival in Rio de Janeiro", "Samba"],
  "Afrobeats":  ["Afrobeats", "Fela Kuti", "Nigerian music", "Highlife (music)"],
};

async function fetchWikiImage(title) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&pithumbsize=500&format=json&origin=*`;
  try {
    const res  = await fetch(url);
    const json = await res.json();
    const pages = json.query?.pages ?? {};
    const page  = Object.values(pages)[0];
    return page?.thumbnail?.source ?? null;
  } catch {
    return null;
  }
}

const data = JSON.parse(readFileSync(dataPath, "utf-8"));
let updated = 0;

for (const item of data) {
  const titles = FIXES[item.name];
  if (!titles) continue;

  process.stdout.write(`Fixing: ${item.name}… `);
  let found = null;
  for (const title of titles) {
    found = await fetchWikiImage(title);
    if (found) { process.stdout.write(`✓ (via "${title}")\n`); break; }
    await new Promise(r => setTimeout(r, 80));
  }
  if (found) {
    item.image_url = found;
    updated++;
  } else {
    process.stdout.write(`✗ no image found\n`);
  }
  await new Promise(r => setTimeout(r, 120));
}

writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log(`\nDone — fixed ${updated}/${Object.keys(FIXES).length} items.`);
