export type GameKey =
  | "wcf"
  | "career_clubs" | "career_players"
  | "football_players" | "football_stadiums"
  | "nba_players"  | "nba_arenas" | "nba_teams";

export function ensureCustomImages(): Promise<void> {
  return Promise.resolve();
}

export function getCustomImage(_game: GameKey, _key: string): string | null {
  return null;
}
