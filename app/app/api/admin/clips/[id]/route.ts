import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionClient = await createClient();
  const { data: { user } } = await sessionClient.auth.getUser();
  if (!isAdmin(user?.email)) {
    return Response.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createServiceClient();

  const { error } = await supabase.from("clips").delete().eq("id", id);
  if (error) return Response.json({ error: "db_error" }, { status: 500 });

  return Response.json({ ok: true });
}
