import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

export async function GET() {
  const sessionClient = await createClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!isAdmin(user?.email)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("clips")
    .select("id, title, game, video_url, thumbnail_url, source, likes_count, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return Response.json({ error: "db_error" }, { status: 500 });
  return Response.json({ clips: data ?? [] });
}
