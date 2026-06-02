/**
 * Lists all video files in R2 and registers them in Supabase via /api/clips/ingest.
 * Run once: node scripts/ingest-r2.mjs
 * Idempotent — skips clips already in the database.
 */

import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const R2_ACCOUNT_ID    = "04b6deea0b051f8adfb8273b37d9861f";
const R2_ACCESS_KEY_ID = "7e76b677b8add44f69a6ef6ad66da91a";
const R2_SECRET        = "1cc1639e7b87d88f391cf42f236074c1f5eea96d927114057a314840ed43442b";
const R2_BUCKET        = "clips";
const INGEST_API_KEY   = "ingest_up_2026_secret";
const APP_URL          = "http://localhost:3000";

const VIDEO_EXTS = new Set([".mp4", ".webm", ".mov", ".mkv"]);

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET },
});

async function listAllObjects() {
  const objects = [];
  let continuationToken;
  do {
    const cmd = new ListObjectsV2Command({
      Bucket: R2_BUCKET,
      ContinuationToken: continuationToken,
    });
    const res = await s3.send(cmd);
    for (const obj of res.Contents ?? []) {
      if (obj.Key) objects.push(obj.Key);
    }
    continuationToken = res.NextContinuationToken;
  } while (continuationToken);
  return objects;
}

function titleFromFilename(filename) {
  const stem = filename.replace(/\.[^.]+$/, "");
  return stem.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function extOf(filename) {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot).toLowerCase() : "";
}

async function ingest(game, filename, title) {
  const res = await fetch(`${APP_URL}/api/clips/ingest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ingest-key": INGEST_API_KEY,
    },
    body: JSON.stringify({ title, game, filename }),
  });
  return res.json();
}

async function main() {
  console.log("Listing R2 objects…");
  const keys = await listAllObjects();
  console.log(`Found ${keys.length} objects`);

  let inserted = 0;
  let skipped  = 0;
  let errors   = 0;

  for (const key of keys) {
    const parts = key.split("/");
    if (parts.length !== 2) continue;             // skip if not <game>/<file>

    const [game, filename] = parts;
    if (!filename || !VIDEO_EXTS.has(extOf(filename))) continue;

    const title = titleFromFilename(filename);
    const result = await ingest(game, filename, title);

    if (result.skipped) {
      skipped++;
      console.log(`  skip  ${key}`);
    } else if (result.ok) {
      inserted++;
      console.log(`  ✓     ${key} → ${result.clipId}`);
    } else {
      errors++;
      console.error(`  ✗     ${key}`, result.error);
    }
  }

  console.log(`\nDone — inserted: ${inserted}, skipped: ${skipped}, errors: ${errors}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
