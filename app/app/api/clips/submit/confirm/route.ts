import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

async function triggerCompressionWorkflow(r2Key: string): Promise<void> {
  const token = process.env.GITHUB_PAT;
  const repo  = process.env.GITHUB_COMPRESSION_REPO; // e.g. "bobbylastro/my-pipeline-repo"
  if (!token || !repo) return; // silently skip if not configured

  await fetch(`https://api.github.com/repos/${repo}/actions/workflows/compress-submission.yml/dispatches`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ref: "main", inputs: { r2_key: r2Key } }),
  });
}

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

  // Fetch the submission to get the R2 key before updating status
  const { data: sub, error: fetchErr } = await supabase
    .from("clip_submissions")
    .select("storage_path")
    .eq("id", submissionId)
    .eq("status", "uploading")
    .single();

  if (fetchErr || !sub) return Response.json({ error: "not_found" }, { status: 404 });

  const { error } = await supabase
    .from("clip_submissions")
    .update({ status: "pending" })
    .eq("id", submissionId)
    .eq("status", "uploading");

  if (error) {
    console.error("Confirm error:", error);
    return Response.json({ error: "db_error" }, { status: 500 });
  }

  // Fire-and-forget: trigger GitHub Action to compress the clip immediately
  triggerCompressionWorkflow(sub.storage_path).catch((e) =>
    console.error("GitHub Action trigger failed:", e)
  );

  return Response.json({ ok: true });
}
