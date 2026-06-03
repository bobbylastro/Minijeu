const KEY = "up_seen_clips";
const MAX = 500;

export function getSeenClipIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch { return new Set(); }
}

export function markClipSeen(clipId: string): void {
  if (typeof window === "undefined") return;
  try {
    const ids = getSeenClipIds();
    if (ids.has(clipId)) return;
    const arr = [...ids, clipId];
    localStorage.setItem(KEY, JSON.stringify(arr.slice(-MAX)));
  } catch {}
}

export function mergeSeenClipIds(idsToMerge: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const ids = getSeenClipIds();
    for (const id of idsToMerge) ids.add(id);
    const arr = [...ids];
    localStorage.setItem(KEY, JSON.stringify(arr.slice(-MAX)));
  } catch {}
}
