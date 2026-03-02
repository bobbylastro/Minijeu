const STORAGE_KEY = "minijeu_match_history";

export interface MatchRecord {
  wins: number;
  losses: number;
  ties: number;
}

function load(): Record<string, MatchRecord> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function recordMatch(opponentName: string, result: "win" | "loss" | "tie") {
  const h = load();
  if (!h[opponentName]) h[opponentName] = { wins: 0, losses: 0, ties: 0 };
  if (result === "win") h[opponentName].wins++;
  else if (result === "loss") h[opponentName].losses++;
  else h[opponentName].ties++;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(h));
}

export function getRecord(opponentName: string): MatchRecord | null {
  const h = load();
  return h[opponentName] ?? null;
}
