import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ ids: [] });

  const { data } = await supabase
    .from("clip_watch_events")
    .select("clip_id")
    .eq("user_id", user.id);

  const ids = [...new Set((data ?? []).map((r: { clip_id: string }) => r.clip_id))];
  return Response.json({ ids });
}
