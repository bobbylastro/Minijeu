import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "app", "custom_images.json");

const DEFAULTS = {
  wcf: {}, career_clubs: {}, career_players: {},
  football_players: {}, football_stadiums: {},
  nba_players: {}, nba_arenas: {},
};

function readData() {
  try {
    const stored = JSON.parse(readFileSync(DATA_PATH, "utf-8"));
    // Merge so all keys are always present even if the file predates new game types
    return { ...DEFAULTS, ...stored };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function GET() {
  return NextResponse.json(readData());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = readData();

  if (body.game && body.key !== undefined && body.url !== undefined) {
    if (!data[body.game]) data[body.game] = {};
    if (body.url === "") {
      delete data[body.game][body.key];
    } else {
      data[body.game][body.key] = body.url;
    }
    writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
}
