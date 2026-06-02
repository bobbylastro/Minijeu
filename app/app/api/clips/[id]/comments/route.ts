import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getComments } from "@/lib/clips";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clipId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const comments = await getComments(clipId, user?.id);
  return NextResponse.json({ comments });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clipId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const text = typeof body?.body === "string" ? body.body.trim() : "";
  if (!text || text.length > 500) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Fetch username from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  const username = profile?.username ?? "User";

  const { data, error } = await supabase
    .from("clip_comments")
    .insert({ clip_id: clipId, user_id: user.id, username, body: text })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }

  return NextResponse.json({
    comment: {
      id: data.id,
      clipId: data.clip_id,
      userId: data.user_id,
      username: data.username,
      body: data.body,
      createdAt: data.created_at,
    },
  });
}
