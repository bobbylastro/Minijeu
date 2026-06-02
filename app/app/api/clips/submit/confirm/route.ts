import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  let body: { submissionId?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  const { submissionId } = body;
  if (!submissionId) return Response.json({ error: "missing_id" }, { status: 400 });

  const supabase = createServiceClient();

  const { error } = await supabase
    .from("clip_submissions")
    .update({ status: "pending" })
    .eq("id", submissionId)
    .eq("status", "uploading");

  if (error) {
    console.error("Confirm error:", error);
    return Response.json({ error: "db_error" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
