/**
 * Returns the correct PartyKit host for the current environment:
 * - GitHub Codespaces (browser URL): auto-derives the forwarded port-1999 URL
 * - Local dev / VS Code port-forwarding: 127.0.0.1:1999 (explicit IPv4 to avoid
 *   browsers that resolve "localhost" as ::1 when PartyKit only binds on IPv4)
 * - Production: NEXT_PUBLIC_PARTYKIT_HOST env var
 */
export function getPartykitHost(): string {
  if (typeof window !== "undefined") {
    // GitHub Codespaces forwarded URL pattern: {codespace-name}-{port}.app.github.dev
    const match = window.location.hostname.match(/^(.+)-(\d+)\.app\.github\.dev$/);
    if (match) {
      return `${match[1]}-1999.app.github.dev`;
    }
  }
  // Use explicit IPv4 address as fallback: avoids issues where the browser
  // resolves "localhost" to ::1 (IPv6) while PartyKit only listens on 0.0.0.0 (IPv4).
  return process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "127.0.0.1:1999";
}

/**
 * Returns true if multiplayer is available in the current environment:
 * - Development (Codespaces / local): always enabled
 * - Production: only if NEXT_PUBLIC_PARTYKIT_HOST is explicitly set
 */
export function isMultiplayerEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_PARTYKIT_HOST) return true;
  if (process.env.NODE_ENV === "development") return true;
  return false;
}
