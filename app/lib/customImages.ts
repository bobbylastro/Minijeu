// Client-side cache for admin-managed custom image URLs.
// Fetches /api/admin once per page load; returns null until loaded.

export type GameKey =
  | "wcf"
  | "career_clubs" | "career_players"
  | "football_players" | "football_stadiums"
  | "nba_players"  | "nba_arenas";

type Cache = { loaded: boolean } & Record<GameKey, Record<string, string>>;

const cache: Cache = {
  loaded: false,
  wcf: {}, career_clubs: {}, career_players: {},
  football_players: {}, football_stadiums: {},
  nba_players: {}, nba_arenas: {},
};

let loadPromise: Promise<void> | null = null;

export function ensureCustomImages(): Promise<void> {
  if (cache.loaded) return Promise.resolve();
  if (loadPromise) return loadPromise;
  loadPromise = fetch("/api/admin")
    .then(r => r.json())
    .then((data: Partial<Record<GameKey, Record<string, string>>>) => {
      for (const key of Object.keys(cache) as Array<keyof Cache>) {
        if (key === "loaded") continue;
        if (data[key]) Object.assign(cache[key], data[key]);
      }
      cache.loaded = true;
    })
    .catch(() => { cache.loaded = true; });
  return loadPromise;
}

export function getCustomImage(game: GameKey, key: string): string | null {
  return cache[game]?.[key] ?? null;
}
