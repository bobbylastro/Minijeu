import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { deleteR2Object, urlToR2Key } from "@/lib/r2";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionClient = await createClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!isAdmin(user?.email)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceClient();

  // Fetch clip to get R2 URLs before deleting
  const { data: clip } = await supabase
    .from("clips")
    .select("id, video_url, thumbnail_url")
    .eq("id", id)
    .single();

  if (!clip) return Response.json({ error: "not_found" }, { status: 404 });

  // Delete from R2 (fire-and-forget errors — don't block on storage failures)
  const videoKey = urlToR2Key(clip.video_url);
  const thumbKey = clip.thumbnail_url ? urlToR2Key(clip.thumbnail_url) : null;
  await Promise.allSettled([
    videoKey ? deleteR2Object(videoKey) : Promise.resolve(),
    thumbKey ? deleteR2Object(thumbKey) : Promise.resolve(),
  ]);

  // Delete all related rows (no FK cascade defined on clip_id columns)
  await Promise.all([
    supabase.from("clip_likes").delete().eq("clip_id", id),
    supabase.from("clip_comments").delete().eq("clip_id", id),
    supabase.from("clip_watch_events").delete().eq("clip_id", id),
    supabase.from("clip_scores").delete().eq("clip_id", id),
  ]);

  // Finally delete the clip itself
  const { error } = await supabase.from("clips").delete().eq("id", id);
  if (error) return Response.json({ error: "db_error" }, { status: 500 });

  return Response.json({ ok: true });
}
