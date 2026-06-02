import { NextRequest, NextResponse } from "next/server";
import { getClips, isGameSlug } from "@/lib/clips";

export async function GET(req: NextRequest) {
  const game = req.nextUrl.searchParams.get("game");

  if (game && !isGameSlug(game)) {
    return NextResponse.json({ error: "Invalid game slug" }, { status: 400 });
  }

  const clips = await getClips({ game: game && isGameSlug(game) ? game : undefined });
  return NextResponse.json({ clips });
}
