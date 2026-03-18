// Run with: node scripts/fetch-origins-images.mjs
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath  = join(__dirname, "../app/origins_data.json");

// Map item name → better Wikipedia search title when the name alone is ambiguous
const WIKI_TITLE_OVERRIDES = {
  "Tennis":              "Tennis",
  "Rugby":               "Rugby union",
  "Cricket":             "Cricket",
  "Golf":                "Golf",
  "Baseball":            "Baseball",
  "Basketball":          "Basketball",
  "Ice Hockey":          "Ice hockey",
  "Sumo":                "Sumo",
  "Judo":                "Judo",
  "Taekwondo":           "Taekwondo",
  "Karate":              "Karate",
  "Pétanque":            "Pétanque",
  "Table Tennis":        "Table tennis",
  "Skiing":              "Skiing",
  "Kung Fu":             "Chinese martial arts",
  "Polo":                "Polo (sport)",
  "Tango":               "Tango (dance)",
  "Flamenco":            "Flamenco",
  "Reggae":              "Reggae",
  "Samba":               "Samba",
  "Jazz":                "Jazz",
  "Waltz":               "Waltz",
  "Opera":               "Opera",
  "Ballet":              "Ballet",
  "Fado":                "Fado",
  "Salsa":               "Salsa (dance)",
  "K-pop":               "K-pop",
  "Cumbia":              "Cumbia",
  "Capoeira":            "Capoeira",
  "Bollywood":           "Bollywood",
  "Oktoberfest":         "Oktoberfest",
  "Halloween":           "Halloween",
  "Día de los Muertos":  "Day of the Dead",
  "Holi":                "Holi",
  "Hanami":              "Hanami",
  "La Tomatina":         "La Tomatina",
  "Midsommar":           "Midsummer in Sweden",
  "Chinese New Year":    "Chinese New Year",
  "Diwali":              "Diwali",
  "Carnival":            "Carnival in Rio de Janeiro",
  "Carnival of Venice":  "Carnival of Venice",
  "Running of the Bulls":"Running of the bulls",
  "Chess":               "Chess",
  "Playing Cards":       "Playing card",
  "Lego":                "Lego",
  "Origami":             "Origami",
  "Sauna":               "Sauna",
  "Yoga":                "Yoga",
  "Manga":               "Manga",
  "Breakdancing":        "Breakdancing",
  "Polka":               "Polka",
  "Bungee Jumping":      "Bungee jumping",
  "Afrobeats":           "Afrobeats",
  "Tattoo (cultural)":   "Tā moko",
  "Ikebana":             "Ikebana",
  "Acupuncture":         "Acupuncture",
  "Dominoes":            "Dominoes",
  "Lacrosse":            "Lacrosse",
  "Beer":                "Beer",
  "Morse Code":          "Morse code",
  "Printing Press":      "Printing press",
  "Champagne":           "Champagne",
  "Sushi (Edo-style)":   "Sushi",
  "Kite":                "Kite",
  "Sabre Fencing":       "Fencing",
  "Martial Arts (Wrestling)": "Ancient Olympic Games",
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
  const wikiTitle = WIKI_TITLE_OVERRIDES[item.name] ?? item.name;
  process.stdout.write(`Fetching: ${item.name} (${wikiTitle})… `);
  const src = await fetchWikiImage(wikiTitle);
  if (src) {
    item.image_url = src;
    process.stdout.write(`✓\n`);
    updated++;
  } else {
    process.stdout.write(`✗ (keeping old)\n`);
  }
  // gentle throttle
  await new Promise(r => setTimeout(r, 120));
}

writeFileSync(dataPath, JSON.stringify(data, null, 2));
console.log(`\nDone — updated ${updated}/${data.length} image URLs.`);
