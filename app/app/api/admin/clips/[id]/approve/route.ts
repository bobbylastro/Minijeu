import { NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const sessionClient = await createClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!isAdmin(user?.email)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const supabase = createServiceClient();

  // Fetch submission
  const { data: sub, error: fetchErr } = await supabase
    .from("clip_submissions")
    .select("id, title, game, storage_path, status, submitter_name")
    .eq("id", id)
    .eq("status", "pending")
    .single();

  if (fetchErr || !sub) return Response.json({ error: "not_found" }, { status: 404 });

  // File is already in R2 (storage_path = R2 key set at upload time)
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${sub.storage_path}`;
  const newClipId = crypto.randomUUID();

  const { error: insertErr } = await supabase.from("clips").insert({
    id: newClipId,
    title: sub.title,
    game: sub.game,
    video_url: publicUrl,
    thumbnail_url: null,
    source: "community",
    submitter_name: sub.submitter_name ?? null,
    likes_count: 0,
    status: "approved",
  });

  if (insertErr) {
    console.error("Insert error:", insertErr);
    return Response.json({ error: "db_error" }, { status: 500 });
  }

  await supabase
    .from("clip_submissions")
    .update({ status: "approved", reviewed_at: new Date().toISOString() })
    .eq("id", id);

  return Response.json({ ok: true, clipId: newClipId });
}
