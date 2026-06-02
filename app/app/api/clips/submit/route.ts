import { NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isGameSlug } from "@/lib/clips-shared";

export const maxDuration = 30;

const DAILY_LIMIT = 2;
const MAX_SIZE = 200 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "video/mp4", "video/webm", "video/quicktime",
  "video/x-matroska", "video/avi", "video/x-msvideo",
]);
const ALLOWED_EXTS = /\.(mp4|webm|mov|mkv|avi)$/i;

function getIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function err(msg: string, status: number) {
  return Response.json({ error: msg }, { status });
}

export async function POST(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return err("not_configured", 503);
  }

  // Auth required
  const sessionClient = await createClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user) return err("auth_required", 401);

  let body: {
    title?: string;
    game?: string;
    submitterName?: string | null;
    filename?: string;
    fileType?: string;
    fileSize?: number;
    honeypot?: string;
  };

  try {
    body = await req.json();
  } catch {
    return err("invalid_body", 400);
  }

  // Honeypot — bots fill this, humans don't
  if (body.honeypot) {
    // Return 200 to not reveal detection
    return Response.json({ ok: true });
  }

  // Validate title
  const title = (body.title ?? "").trim();
  if (title.length < 3 || title.length > 80) return err("invalid_title", 400);

  // Validate game
  const game = body.game ?? "";
  if (!isGameSlug(game)) return err("invalid_game", 400);

  // Validate file metadata
  const filename = body.filename ?? "";
  const fileType = body.fileType ?? "";
  const fileSize = body.fileSize ?? 0;

  if (!ALLOWED_TYPES.has(fileType) && !ALLOWED_EXTS.test(filename)) {
    return err("invalid_file", 400);
  }
  if (fileSize > MAX_SIZE || fileSize < 1024 * 10) {
    return err("file_too_large", 400);
  }

  const supabase = createServiceClient();
  const ip = getIP(req);

  // Rate limit: 2 submissions per 24h per user
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const { count } = await supabase
    .from("clip_submissions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("status", ["uploading", "pending", "approved"])
    .gte("created_at", since);

  if ((count ?? 0) >= DAILY_LIMIT) return err("rate_limit", 429);

  // Generate signed upload URL (client uploads directly to Supabase Storage)
  const ext = filename.split(".").pop()?.toLowerCase() ?? "mp4";
  const storagePath = `${crypto.randomUUID()}.${ext}`;

  const { data: uploadData, error: urlError } = await supabase.storage
    .from("clip-submissions")
    .createSignedUploadUrl(storagePath);

  if (urlError || !uploadData) {
    console.error("Storage error:", urlError);
    return err("storage_error", 500);
  }

  // Create the submission record (status: uploading until confirmed)
  const { data: submission, error: dbError } = await supabase
    .from("clip_submissions")
    .insert({
      title,
      game,
      submitter_name: body.submitterName || null,
      submitter_ip: ip,
      user_id: user.id,
      storage_path: storagePath,
      status: "uploading",
    })
    .select("id")
    .single();

  if (dbError || !submission) {
    console.error("DB error:", dbError);
    return err("db_error", 500);
  }

  return Response.json({
    submissionId: submission.id,
    signedUrl: uploadData.signedUrl,
  });
}
