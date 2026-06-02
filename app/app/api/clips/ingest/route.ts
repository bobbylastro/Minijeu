import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { isGameSlug } from "@/lib/clips-shared";

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-ingest-key");
  if (apiKey !== process.env.INGEST_API_KEY) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, game, filename, source = "r2" } = body;

  if (!title || !game || !filename) {
    return Response.json({ error: "missing_fields" }, { status: 400 });
  }

  if (!isGameSlug(game)) {
    return Response.json({ error: "invalid_game" }, { status: 400 });
  }

  const publicUrl = process.env.R2_PUBLIC_URL;
  const videoUrl = `${publicUrl}/${game}/${filename}`;

  const supabase = createServiceClient();

  // Skip if this URL already exists
  const { data: existing } = await supabase
    .from("clips")
    .select("id")
    .eq("video_url", videoUrl)
    .maybeSingle();

  if (existing) {
    return Response.json({ ok: true, skipped: true });
  }

  const { data, error } = await supabase.from("clips").insert({
    title,
    game,
    video_url: videoUrl,
    thumbnail_url: null,
    source,
    likes_count: 0,
  }).select("id").single();

  if (error) {
    console.error("Ingest error:", error);
    return Response.json({ error: "db_error" }, { status: 500 });
  }

  return Response.json({ ok: true, clipId: data.id });
}
