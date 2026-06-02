import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { deleteR2Object, urlToR2Key } from "@/lib/r2";

export async function POST(req: Request) {
  const sessionClient = await createClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!isAdmin(user?.email)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const { ids }: { ids: string[] } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return Response.json({ error: "no ids" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Fetch all clips to get R2 URLs before deleting
  const { data: clips } = await supabase
    .from("clips")
    .select("id, video_url, thumbnail_url")
    .in("id", ids);

  if (clips && clips.length > 0) {
    // Delete R2 files for all clips
    const r2Keys = clips.flatMap((c) => {
      const keys: string[] = [];
      const vk = urlToR2Key(c.video_url);
      if (vk) keys.push(vk);
      const tk = c.thumbnail_url ? urlToR2Key(c.thumbnail_url) : null;
      if (tk) keys.push(tk);
      return keys;
    });
    await Promise.allSettled(r2Keys.map((k) => deleteR2Object(k)));

    // Delete all related rows in one batch per table
    // (clip_comments cascade-deletes comment_likes at DB level)
    await Promise.all([
      supabase.from("clip_likes").delete().in("clip_id", ids),
      supabase.from("clip_comments").delete().in("clip_id", ids),
      supabase.from("clip_watch_events").delete().in("clip_id", ids),
      supabase.from("clip_scores").delete().in("clip_id", ids),
    ]);

    await supabase.from("clips").delete().in("id", ids);
  }

  return Response.json({ deleted: clips?.length ?? 0 });
}
