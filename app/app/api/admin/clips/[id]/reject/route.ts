import { NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { deleteR2Object } from "@/lib/r2";

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

  const { data: sub, error: fetchErr } = await supabase
    .from("clip_submissions")
    .select("id, storage_path, status")
    .eq("id", id)
    .eq("status", "pending")
    .single();

  if (fetchErr || !sub) return Response.json({ error: "not_found" }, { status: 404 });

  // Delete from R2 + mark as rejected
  await Promise.all([
    deleteR2Object(sub.storage_path),
    supabase
      .from("clip_submissions")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", id),
  ]);

  return Response.json({ ok: true });
}
