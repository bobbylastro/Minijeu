import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Map game key → subfolder under public/images/
const GAME_FOLDERS: Record<string, string> = {
  wcf:                "wcf",
  career_clubs:       "career",
  career_players:     "career",
  football_players:   "football",
  football_stadiums:  "football",
  nba_players:        "nba",
  nba_arenas:         "nba",
};

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const game = form.get("game") as string | null;
    const key  = form.get("key")  as string | null;

    if (!file || !game || !key) {
      return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
    }

    const folder   = GAME_FOLDERS[game] ?? game;
    const ext      = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const slug     = key.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const filename = `${slug}.${ext}`;

    const dir = path.join(process.cwd(), "public", "images", folder);
    await mkdir(dir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, filename), buffer);

    return NextResponse.json({ ok: true, url: `/images/${folder}/${filename}` });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ ok: false, error: "Upload failed" }, { status: 500 });
  }
}
