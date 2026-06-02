// Server-only data access layer — do NOT import this in Client Components.
import fs from "fs";
import path from "path";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Clip, Comment, GameSlug } from "@/lib/clips-shared";
export type { Clip, Comment, GameSlug };
export { GAMES, GAME_SLUGS, isGameSlug } from "@/lib/clips-shared";
import { GAME_SLUGS } from "@/lib/clips-shared";

// ---------------------------------------------------------------------------
// Local fallback — scans public/clips/<game>/ for video files
// ---------------------------------------------------------------------------

const VIDEO_EXTS = new Set([".mp4", ".webm", ".mov", ".mkv"]);

function getLocalClips(): Clip[] {
  const clips: Clip[] = [];
  const base = path.join(process.cwd(), "public", "clips");

  for (const slug of GAME_SLUGS) {
    const dir = path.join(base, slug);
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter(
      (f) => VIDEO_EXTS.has(path.extname(f).toLowerCase()) && !f.startsWith(".")
    );

    for (const file of files) {
      const stem = path.basename(file, path.extname(file));
      const title = stem.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      clips.push({
        id: `local-${slug}-${stem}`,
        title,
        game: slug,
        videoUrl: `/clips/${slug}/${file}`,
        thumbnailUrl: null,
        source: "local",
        likesCount: 0,
        createdAt: new Date(0).toISOString(),
      });
    }
  }

  return clips;
}

// ---------------------------------------------------------------------------
// Scoring helpers
// ---------------------------------------------------------------------------

interface ClipScore {
  clip_id: string;
  view_count: number;
  avg_watch_ratio: number;
  score: number;
}

// Recency boost: clips uploaded recently rank higher
function recencyBoost(createdAt: string): number {
  const ageHours = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
  return 1 / (1 + ageHours * 0.005); // half-life ~200h (~8 days)
}

// Global score: completion rate × popularity × recency
function computeScore(s: ClipScore, createdAt: string): number {
  const pop = Math.log(s.view_count + 2); // log scale popularity
  return s.avg_watch_ratio * 8 + pop * 1.5 + recencyBoost(createdAt) * 2;
}

// ---------------------------------------------------------------------------
// Data access
// ---------------------------------------------------------------------------

export interface GetClipsOptions {
  userId?: string; // if set, personalise the feed
  game?: GameSlug;
}

export async function getClips(opts: GetClipsOptions = {}): Promise<Clip[]> {
  const supabase = createServiceClient();

  // Clips + user prefs in parallel
  let clipsQuery = supabase
    .from("clips")
    .select("id, title, game, video_url, thumbnail_url, source, likes_count, created_at")
    .limit(20);
  if (opts.game) clipsQuery = clipsQuery.eq("game", opts.game);

  const [{ data: clipsData, error: clipsError }, gamePrefs] = await Promise.all([
    clipsQuery,
    opts.userId ? getUserGamePrefs(supabase, opts.userId) : Promise.resolve({} as Record<string, number>),
  ]);

  if (clipsError || !clipsData || clipsData.length === 0) {
    const fallback = shuffleArray(getLocalClips());
    return opts.game ? fallback.filter((c) => c.game === opts.game) : fallback;
  }

  // Fetch scores (needs clip IDs)
  const { data: scoresData } = await supabase
    .from("clip_scores")
    .select("clip_id, view_count, avg_watch_ratio, score")
    .in("clip_id", clipsData.map((c) => c.id));

  const scoresMap = new Map<string, ClipScore>();
  for (const s of scoresData ?? []) scoresMap.set(s.clip_id, s);

  // Compute final score per clip
  const scored = clipsData.map((row) => {
    const s = scoresMap.get(row.id) ?? { clip_id: row.id, view_count: 0, avg_watch_ratio: 0, score: 0 };
    const base = computeScore(s, row.created_at);
    // Personal boost: up to +4 for preferred games (0-1 range scaled)
    const pref = gamePrefs[row.game] ?? 0;
    const final = base + pref * 4;
    return { clip: rowToClip(row), score: final };
  });

  // Sort by score descending, shuffle ties slightly for freshness
  scored.sort((a, b) => b.score - a.score + (Math.random() * 0.2 - 0.1));

  return scored.map((s) => s.clip);
}

// User's average watch ratio per game (0–1), normalised
async function getUserGamePrefs(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string
): Promise<Record<string, number>> {
  // Get last 100 watch events for this user
  const { data } = await supabase
    .from("clip_watch_events")
    .select("clip_id, watch_ratio, clips(game)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (!data || data.length === 0) return {};

  // Aggregate average watch ratio per game
  const totals: Record<string, { sum: number; count: number }> = {};
  for (const row of data) {
    const game: string = row.clips?.game ?? "unknown";
    if (!totals[game]) totals[game] = { sum: 0, count: 0 };
    totals[game].sum += row.watch_ratio;
    totals[game].count += 1;
  }

  const prefs: Record<string, number> = {};
  for (const [game, { sum, count }] of Object.entries(totals)) {
    prefs[game] = sum / count; // avg ratio 0-1
  }

  return prefs;
}

export async function getClipById(id: string): Promise<Clip | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("clips")
    .select("id, title, game, video_url, thumbnail_url, source, likes_count, created_at")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return rowToClip(data);
}

export async function getComments(clipId: string, userId?: string): Promise<Comment[]> {
  const supabase = await createClient();

  const commentsPromise = supabase
    .from("clip_comments")
    .select("id, clip_id, user_id, username, body, likes_count, created_at")
    .eq("clip_id", clipId)
    .order("created_at", { ascending: true });

  const likesPromise = userId
    ? supabase.from("comment_likes").select("comment_id").eq("user_id", userId)
    : Promise.resolve({ data: [] as { comment_id: string }[] | null });

  const [{ data, error }, { data: userLikes }] = await Promise.all([commentsPromise, likesPromise]);

  if (error || !data) return [];

  const likedSet = new Set((userLikes ?? []).map((l) => l.comment_id));
  return data.map((row) => ({
    id: row.id,
    clipId: row.clip_id,
    userId: row.user_id,
    username: row.username,
    body: row.body,
    likesCount: row.likes_count ?? 0,
    userHasLiked: likedSet.has(row.id),
    createdAt: row.created_at,
  }));
}

export async function getUserLike(clipId: string, userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clip_likes")
    .select("clip_id")
    .eq("clip_id", clipId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rowToClip(row: {
  id: string;
  title: string;
  game: string;
  video_url: string;
  thumbnail_url: string | null;
  source: string;
  likes_count: number;
  created_at: string;
}): Clip {
  return {
    id: row.id,
    title: row.title,
    game: row.game as GameSlug,
    videoUrl: row.video_url,
    thumbnailUrl: row.thumbnail_url,
    source: (row.source ?? "local") as Clip["source"],
    likesCount: row.likes_count ?? 0,
    createdAt: row.created_at,
  };
}
