import { NextRequest } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

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

  const { error } = await supabase
    .from("clips")
    .update({ status: "approved" })
    .eq("id", id)
    .eq("status", "pending");

  if (error) return Response.json({ error: "db_error" }, { status: 500 });
  return Response.json({ ok: true });
}
