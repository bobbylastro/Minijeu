/**
 * Analytics — GA4 custom events for Ultimate Playground clip viewer.
 * Respects cookie consent: silently dropped if GA4 isn't loaded.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function track(event: string, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  window.gtag("event", event, params);
}

// ─── Clip events ─────────────────────────────────────────────────────────────

/** Fired when a clip enters the viewport and starts playing */
export function trackClipView(clipId: string, game: string): void {
  track("clip_view", { clip_id: clipId, game });
}

/** Fired when a clip is liked or unliked */
export function trackClipLike(clipId: string, game: string, liked: boolean): void {
  track("clip_like", { clip_id: clipId, game, liked });
}

/** Fired when the share button is clicked */
export function trackClipShare(clipId: string, game: string): void {
  track("clip_share", { clip_id: clipId, game });
}

// ─── Comment events ───────────────────────────────────────────────────────────

/** Fired when a comment is posted */
export function trackCommentPost(clipId: string, game: string): void {
  track("comment_post", { clip_id: clipId, game });
}

/** Fired when a comment is liked or unliked */
export function trackCommentLike(commentId: string, liked: boolean): void {
  track("comment_like", { comment_id: commentId, liked });
}

// ─── Navigation events ────────────────────────────────────────────────────────

/** Fired when the user filters by a game (or clears filters) */
export function trackGameFilter(game: string | null): void {
  track("game_filter", { game: game ?? "all" });
}

// ─── Auth events ──────────────────────────────────────────────────────────────

export function trackSignUp(method: "email" | "google"): void {
  track("sign_up", { method });
}

export function trackLogin(method: "email" | "google"): void {
  track("login", { method });
}

// ─── Submit events ────────────────────────────────────────────────────────────

/** Fired when a user submits a clip */
export function trackClipSubmit(game: string): void {
  track("clip_submit", { game });
}
