import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Called by the GitHub Action compression script after a clip has been
// compressed and re-uploaded to R2.
// Updates storage_path on clip_submissions and video_url on clips (if approved).
export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-ingest-key");
  if (apiKey !== process.env.INGEST_API_KEY) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const { old_key, new_key } = await req.json() as { old_key?: string; new_key?: string };
  if (!old_key || !new_key) {
    return Response.json({ error: "missing_fields" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const r2Base   = process.env.R2_PUBLIC_URL!;
  const oldUrl   = `${r2Base}/${old_key}`;
  const newUrl   = `${r2Base}/${new_key}`;

  // Update the submission record (pre-approval)
  await supabase
    .from("clip_submissions")
    .update({ storage_path: new_key })
    .eq("storage_path", old_key);

  // Update the live clip record (post-approval, if it was approved before compression ran)
  await supabase
    .from("clips")
    .update({ video_url: newUrl })
    .eq("video_url", oldUrl);

  return Response.json({ ok: true });
}
