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

  // Preview URLs point directly to R2 (storage_path is now a R2 key)
  const r2Base = process.env.R2_PUBLIC_URL ?? "";
  const submissions = (data ?? []).map((row) => ({
    ...row,
    previewUrl: row.storage_path ? `${r2Base}/${row.storage_path}` : null,
  }));

  return Response.json({ submissions });
}
