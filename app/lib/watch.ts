// Client-side watch tracking helpers

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("up_session_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("up_session_id", id);
  }
  return id;
}

export async function sendWatchEvent(
  clipId: string,
  watchedSeconds: number,
  watchRatio: number,
  userId?: string
): Promise<void> {
  if (watchedSeconds < 1) return; // ignore accidental glances
  try {
    await fetch("/api/clips/watch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clipId,
        watchedSeconds: Math.min(watchedSeconds, 600), // cap at 10min
        watchRatio: Math.min(Math.max(watchRatio, 0), 1),
        sessionId: userId ? null : getSessionId(),
      }),
      keepalive: true, // fires even if page is unloading
    });
  } catch {
    // fire-and-forget, never throw
  }
}
