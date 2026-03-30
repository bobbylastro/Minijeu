// Run with: node scripts/fetch-wealth-images.mjs
// 1) For celebs without a stored image URL: resolves one from Wikipedia pageimages API
// 2) Downloads all images locally to public/images/wealth/
// 3) Updates wealth_data.json with local /images/wealth/<file> paths

import { readFileSync, writeFileSync, createWriteStream, mkdirSync, statSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join, extname } from "path";
import https from "https";
import http from "http";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath  = join(__dirname, "../app/wealth_data.json");
const outputDir = join(__dirname, "../public/images/wealth");

mkdirSync(outputDir, { recursive: true });

const data = JSON.parse(readFileSync(dataPath, "utf-8"));

function sanitizeFilename(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function resolveWikiUrl(title) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=500&origin=*`;
  return new Promise((resolve) => {
    https.get(url, {
      headers: { "User-Agent": "UltimatePlayground/1.0 (https://ultimate-playground.com)" }
    }, (res) => {
      let body = "";
      res.on("data", d => body += d);
      res.on("end", () => {
        try {
          const j = JSON.parse(body);
          const page = Object.values(j?.query?.pages ?? {})[0];
          resolve(page?.thumbnail?.source ?? null);
        } catch { resolve(null); }
      });
    }).on("error", () => resolve(null));
  });
}

function downloadFile(url, dest, retries = 3) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    const file = createWriteStream(dest);
    const req = protocol.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "image/webp,image/*,*/*;q=0.8",
        "Referer": "https://en.wikipedia.org/",
      }
    }, async (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.destroy();
        try { await downloadFile(res.headers.location, dest, retries); resolve(); }
        catch (e) { reject(e); }
        return;
      }
      if (res.statusCode === 429) {
        file.destroy();
        if (retries > 0) {
          console.log("    rate limited, waiting 8s...");
          await sleep(8000);
          try { await downloadFile(url, dest, retries - 1); resolve(); }
          catch (e) { reject(e); }
        } else {
          reject(new Error("HTTP 429 (rate limited)"));
        }
        return;
      }
      if (res.statusCode !== 200) {
        file.destroy();
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on("finish", () => {
        file.close(() => {
          try {
            const size = statSync(dest).size;
            if (size === 0) reject(new Error("Empty file"));
            else resolve();
          } catch (e) { reject(e); }
        });
      });
      file.on("error", reject);
    });
    req.on("error", reject);
    req.setTimeout(20000, () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

async function run() {
  const updated = [];
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const celeb of data) {
    // Determine the image URL to use
    let imageUrl = celeb.image && celeb.image.startsWith("http") ? celeb.image : null;

    // If no stored URL, look it up from Wikipedia
    if (!imageUrl) {
      const wikiTitle = celeb.wiki ?? celeb.name;
      process.stdout.write(`  [lookup] ${celeb.name} (${wikiTitle})... `);
      imageUrl = await resolveWikiUrl(wikiTitle);
      if (imageUrl) {
        console.log(`found URL`);
      } else {
        console.log(`no image on Wikipedia`);
        updated.push(celeb);
        failed++;
        continue;
      }
      await sleep(500);
    }

    // Determine local filename
    const ext = extname(imageUrl.split("?")[0].split("/").pop() ?? "") || ".jpg";
    const filename = sanitizeFilename(celeb.name) + ext;
    const destPath = join(outputDir, filename);
    const localPath = `/images/wealth/${filename}`;

    // Skip if already downloaded and we already have the local path
    if (celeb.image && celeb.image.startsWith("/images/")) {
      updated.push(celeb);
      skipped++;
      continue;
    }

    // Skip if file already exists and is non-empty
    if (existsSync(destPath) && statSync(destPath).size > 0) {
      console.log(`  [skip]   ${celeb.name} — already on disk`);
      updated.push({ ...celeb, image: localPath });
      downloaded++;
      continue;
    }

    process.stdout.write(`  [dl]     ${celeb.name}... `);
    try {
      await downloadFile(imageUrl, destPath);
      const size = statSync(destPath).size;
      console.log(`✓ (${Math.round(size / 1024)}KB)`);
      updated.push({ ...celeb, image: localPath });
      downloaded++;
    } catch (err) {
      console.log(`✗ ${err.message}`);
      updated.push(celeb);
      failed++;
    }

    // Polite delay between downloads
    await sleep(1200);
  }

  writeFileSync(dataPath, JSON.stringify(updated, null, 2));
  console.log(`\n✅ Done: ${downloaded} downloaded/kept, ${failed} failed, ${skipped} already local`);
  console.log(`Updated: ${dataPath}`);
}

run().catch(console.error);
