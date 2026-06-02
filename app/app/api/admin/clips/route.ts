import { NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

export async function GET(req: NextRequest) {
  // Auth check
  const sessionClient = await createClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!isAdmin(user?.email)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const supabase = createServiceClient();
  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? "pending";

  const { data, error } = await supabase
    .from("clip_submissions")
    .select("id, title, game, submitter_name, submitter_ip, storage_path, status, created_at")
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: "db_error" }, { status: 500 });

  // Generate signed preview URLs (1hr validity)
  const submissions = await Promise.all(
    (data ?? []).map(async (row) => {
      const { data: signed } = await supabase.storage
        .from("clip-submissions")
        .createSignedUrl(row.storage_path, 3600);
      return { ...row, previewUrl: signed?.signedUrl ?? null };
    })
  );

  return Response.json({ submissions });
}
