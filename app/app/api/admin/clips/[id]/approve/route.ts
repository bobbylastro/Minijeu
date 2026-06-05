import { NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { isGameSlug } from "@/lib/clips-shared";
import { uploadToR2, deleteR2Object } from "@/lib/r2";

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
    .select("id, title, game, submitter_name, storage_path, status")
    .eq("id", id)
    .eq("status", "pending")
    .single();

  if (fetchErr || !sub) return Response.json({ error: "not_found" }, { status: 404 });

  const game = isGameSlug(sub.game) ? sub.game : "other";
  const ext = sub.storage_path.split(".").pop() ?? "mp4";
  const newClipId = crypto.randomUUID();
  const destPath = `${game}/${newClipId}.${ext}`;

  // Download from private bucket
  const { data: fileData, error: dlErr } = await supabase.storage
    .from("clip-submissions")
    .download(sub.storage_path);

  if (dlErr || !fileData) {
    console.error("Download error:", dlErr);
    return Response.json({ error: "download_failed" }, { status: 500 });
  }

  // Upload to R2 (zero egress, same bucket as pipeline clips)
  try {
    await uploadToR2(destPath, fileData, `video/${ext}`);
  } catch (err) {
    console.error("R2 upload error:", err);
    return Response.json({ error: "upload_failed" }, { status: 500 });
  }

  const publicUrl = `${process.env.R2_PUBLIC_URL}/${destPath}`;

  // Insert into clips table
  const { error: insertErr } = await supabase.from("clips").insert({
    id: newClipId,
    title: sub.title,
    game: sub.game,
    video_url: publicUrl,
    thumbnail_url: null,
    source: "community",
    likes_count: 0,
    status: "approved",
  });

  if (insertErr) {
    console.error("Insert error:", insertErr);
    await deleteR2Object(destPath);
    return Response.json({ error: "db_error" }, { status: 500 });
  }

  // Mark submission as approved + delete source file
  await Promise.all([
    supabase
      .from("clip_submissions")
      .update({ status: "approved", reviewed_at: new Date().toISOString() })
      .eq("id", id),
    supabase.storage.from("clip-submissions").remove([sub.storage_path]),
  ]);

  return Response.json({ ok: true, clipId: newClipId });
}
