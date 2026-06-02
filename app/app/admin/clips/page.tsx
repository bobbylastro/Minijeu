import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import AdminClipsDashboard from "@/components/AdminClipsDashboard";

export const metadata = { title: "Admin — Clip submissions" };

export default async function AdminClipsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");
  if (!isAdmin(user.email)) redirect("/");

  return <AdminClipsDashboard />;
}
