export function isAdmin(email: string | undefined | null): boolean {
  if (!email) return false;
  const raw = process.env.ADMIN_EMAIL ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .includes(email.toLowerCase());
}
