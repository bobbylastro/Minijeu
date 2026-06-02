import { createServiceClient } from "@/lib/supabase/server";
import { isGameSlug, GAME_SLUGS } from "@/lib/clips-shared";

export const revalidate = 300; // cache 5 min

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ popularity: [] });
  }

  try {
    const supabase = createServiceClient();

    // Sum watch time per game by joining clip_scores with clips
    const { data, error } = await supabase
      .from("clip_scores")
      .select("clip_id, total_watch_s, view_count, clips(game)")
      .order("total_watch_s", { ascending: false });

    if (error || !data) return Response.json({ popularity: [] });

    // Aggregate per game
    const gameStats: Record<string, { totalWatchS: number; viewCount: number }> = {};

    for (const row of data) {
      const game = (row.clips as { game?: string } | null)?.game;
      if (!game || !isGameSlug(game)) continue;
      if (!gameStats[game]) gameStats[game] = { totalWatchS: 0, viewCount: 0 };
      gameStats[game].totalWatchS += row.total_watch_s ?? 0;
      gameStats[game].viewCount  += row.view_count ?? 0;
    }

    // Build sorted list — games with no data get a score of 0
    const popularity = GAME_SLUGS
      .map((slug) => ({
        game: slug,
        totalWatchS: gameStats[slug]?.totalWatchS ?? 0,
        viewCount:   gameStats[slug]?.viewCount ?? 0,
      }))
      .sort((a, b) => b.totalWatchS - a.totalWatchS);

    return Response.json({ popularity });
  } catch {
    return Response.json({ popularity: [] });
  }
}
