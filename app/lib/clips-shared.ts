// Shared types and constants — safe to import in both Server and Client Components.

export type GameSlug =
  | "valorant"
  | "apex-legends"
  | "marvel-rivals"
  | "the-finals"
  | "rocket-league"
  | "rainbow-six-siege"
  | "league-of-legends"
  | "cs2"
  | "rust"
  | "gta-v"
  | "minecraft"
  | "overwatch"
  | "arc-raiders";

export interface GameMeta {
  name: string;
  color: string;
  textColor: string;
}

export const GAMES: Record<GameSlug, GameMeta> = {
  "valorant":           { name: "Valorant",            color: "#ff4655", textColor: "#fff" },
  "apex-legends":       { name: "Apex Legends",         color: "#cd4a14", textColor: "#fff" },
  "marvel-rivals":      { name: "Marvel Rivals",        color: "#e62429", textColor: "#fff" },
  "the-finals":         { name: "The Finals",           color: "#f5a623", textColor: "#000" },
  "rocket-league":      { name: "Rocket League",        color: "#1e90ff", textColor: "#fff" },
  "rainbow-six-siege":  { name: "Rainbow Six Siege",    color: "#1c6eb5", textColor: "#fff" },
  "league-of-legends":  { name: "League of Legends",    color: "#c89b3c", textColor: "#000" },
  "cs2":                { name: "CS2",                  color: "#e8a020", textColor: "#000" },
  "rust":               { name: "Rust",                 color: "#b7431e", textColor: "#fff" },
  "gta-v":              { name: "GTA V",                color: "#229954", textColor: "#fff" },
  "minecraft":          { name: "Minecraft",            color: "#5b8c2a", textColor: "#fff" },
  "overwatch":          { name: "Overwatch",            color: "#f99e1a", textColor: "#000" },
  "arc-raiders":        { name: "ARC Raiders",          color: "#00b4d8", textColor: "#000" },
};

export const GAME_SLUGS = Object.keys(GAMES) as GameSlug[];

export function isGameSlug(value: string): value is GameSlug {
  return GAME_SLUGS.includes(value as GameSlug);
}

export interface Clip {
  id: string;
  title: string;
  game: GameSlug;
  videoUrl: string;
  thumbnailUrl: string | null;
  source: "medal" | "twitch" | "local" | "r2" | "pipeline" | "community";
  submitterName?: string | null;
  likesCount: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  clipId: string;
  userId: string;
  username: string;
  body: string;
  likesCount: number;
  userHasLiked: boolean;
  createdAt: string;
}
