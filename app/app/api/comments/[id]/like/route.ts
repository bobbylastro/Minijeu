import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: commentId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: existing } = await supabase
    .from("comment_likes")
    .select("comment_id")
    .eq("comment_id", commentId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("comment_likes").delete().eq("comment_id", commentId).eq("user_id", user.id);
    await supabase.rpc("decrement_comment_likes", { p_comment_id: commentId });
    return Response.json({ liked: false });
  }

  await supabase.from("comment_likes").insert({ comment_id: commentId, user_id: user.id });
  await supabase.rpc("increment_comment_likes", { p_comment_id: commentId });
  return Response.json({ liked: true });
}
