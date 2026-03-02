import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { POINTS_WIN, POINTS_LOSS, getRank, getRankFloor } from "@/lib/ranks";

const VALID_GAME_TYPES = ["football", "nba", "career", "wcf", "citymix", "higher-or-lower"];

// GET /api/ratings/[gameType] — top 50 leaderboard
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ gameType: string }> }
) {
  const { gameType } = await params;
  if (!VALID_GAME_TYPES.includes(gameType)) {
    return NextResponse.json({ error: "Invalid game type" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ratings")
    .select("*, profiles(username, avatar_url)")
    .eq("game_type", gameType)
    .order("points", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ leaderboard: data ?? [] });
}

// POST /api/ratings/[gameType] — each player submits their own result independently
// Body: { myScore: number, opponentScore: number }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ gameType: string }> }
) {
  const { gameType } = await params;
  if (!VALID_GAME_TYPES.includes(gameType)) {
    return NextResponse.json({ error: "Invalid game type" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const { myScore, opponentScore } = body;

  if (typeof myScore !== "number" || typeof opponentScore !== "number") {
    return NextResponse.json({ error: "Invalid scores" }, { status: 400 });
  }

  const won = myScore > opponentScore;

  const service = createServiceClient();

  // Fetch current rating
  const { data: current } = await service
    .from("ratings")
    .select("*")
    .eq("user_id", user.id)
    .eq("game_type", gameType)
    .single();

  const currentPoints = current?.points ?? 0;
  const currentFloor  = current?.rank_floor ?? 0;

  // Calculate new points
  const newPoints = won
    ? currentPoints + POINTS_WIN
    : Math.max(currentPoints - POINTS_LOSS, currentFloor);

  const newFloor = won
    ? Math.max(currentFloor, getRankFloor(newPoints))
    : currentFloor;

  const pointsDelta = newPoints - currentPoints;

  // Upsert rating
  await service.from("ratings").upsert(
    {
      user_id:    user.id,
      game_type:  gameType,
      points:     newPoints,
      wins:       (current?.wins ?? 0) + (won ? 1 : 0),
      losses:     (current?.losses ?? 0) + (won ? 0 : 1),
      rank_floor: newFloor,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,game_type" }
  );

  // Insert match entry only for the winner (avoids duplicates)
  if (won) {
    await service.from("matches").insert({
      game_type:    gameType,
      winner_id:    user.id,
      loser_id:     null,
      winner_score: myScore,
      loser_score:  opponentScore,
      points_delta: POINTS_WIN,
    });
  }

  return NextResponse.json({
    success: true,
    won,
    pointsDelta,
    newPoints,
    rank: getRank(newPoints),
  });
}
