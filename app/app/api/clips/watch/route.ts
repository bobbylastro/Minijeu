import { NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  let body: {
    clipId?: string;
    watchedSeconds?: number;
    watchRatio?: number;
    sessionId?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  const { clipId, watchedSeconds, watchRatio, sessionId } = body;

  if (!clipId || typeof watchedSeconds !== "number" || typeof watchRatio !== "number") {
    return Response.json({ error: "missing_fields" }, { status: 400 });
  }
  if (watchedSeconds < 1 || watchedSeconds > 600) {
    return Response.json({ ok: true }); // silently ignore out-of-range
  }

  // Get user id from session (may be null for anonymous)
  const sessionClient = await createClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  const userId = user?.id ?? null;

  const supabase = createServiceClient();

  // Insert watch event
  await supabase.from("clip_watch_events").insert({
    clip_id: clipId,
    user_id: userId,
    session_id: userId ? null : (sessionId ?? null),
    watched_seconds: watchedSeconds,
    watch_ratio: watchRatio,
  });

  // Upsert clip_scores (running average)
  await supabase.rpc("upsert_clip_score", {
    p_clip_id: clipId,
    p_watched_seconds: watchedSeconds,
    p_watch_ratio: watchRatio,
  });

  return Response.json({ ok: true });
}
