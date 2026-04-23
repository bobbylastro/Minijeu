/**
 * Analytics utility — wraps GA4 custom events.
 * All events respect cookie consent: if GA4 isn't loaded, calls are silently dropped.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// ─── Event definitions ──────────────────────────────────────────────────────

export type GameType =
  | "hotel-price"
  | "football"
  | "nba"
  | "career"
  | "wild-battle"
  | "animal-locator"
  | "food"
  | "origins"
  | "city-origins"
  | "wcf"
  | "five-clues"
  | "citymix"
  | "higher-or-lower"
  | "gaming-mix"
  | "game-tournament"
  | "wealth"
  | "devine"
  | "city-guessr";

export type GameMode = "solo" | "multi" | "bot";

interface GameStartParams {
  game_type: GameType;
  mode: GameMode;
}

interface GameCompleteParams {
  game_type: GameType;
  mode: GameMode;
  final_score: number;
  max_score: number;
  /** 0–100 */
  score_pct: number;
}

interface GameAbandonParams {
  game_type: GameType;
  mode: GameMode;
  /** Round number the player was on when they quit (1-based) */
  round_at: number;
}

interface RoundCompleteParams {
  game_type: GameType;
  mode: GameMode;
  round: number;        // 1-based
  question_type: string; // "trivia" | "stadium" | "transfer" | "peak" | "price_slider" | etc.
  correct: boolean;
  points: number;
}

type EventMap = {
  game_start:    GameStartParams;
  game_complete: GameCompleteParams;
  game_abandon:  GameAbandonParams;
  round_complete: RoundCompleteParams;
};

// ─── Core helper ────────────────────────────────────────────────────────────

export function trackEvent<K extends keyof EventMap>(
  event: K,
  params: EventMap[K],
): void {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  window.gtag("event", event, params);
}
