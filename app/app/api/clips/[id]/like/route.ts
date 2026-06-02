import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clipId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if the like already exists
  const { data: existing } = await supabase
    .from("clip_likes")
    .select("clip_id")
    .eq("clip_id", clipId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    // Unlike: remove the row and decrement
    await supabase.from("clip_likes").delete().eq("clip_id", clipId).eq("user_id", user.id);
    await supabase.rpc("decrement_likes", { clip_id: clipId });
    return NextResponse.json({ liked: false });
  }

  // Like: insert the row and increment
  await supabase.from("clip_likes").insert({ clip_id: clipId, user_id: user.id });
  await supabase.rpc("increment_likes", { clip_id: clipId });
  return NextResponse.json({ liked: true });
}
