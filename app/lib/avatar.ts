const EMOJIS = [
  "🦁","🐯","🦊","🐻","🐼","🦝","🦅","🦋","🐬","🐉",
  "⚡","🔥","🌊","🎯","🏆","💫","🚀","🦄","💎","🌟",
  "🎪","🐺","🦈","🦏","🐸","🦜","🐙","🦉","🐲","🌈",
];

const GRADIENTS = [
  ["#7c3aed","#3b82f6"],
  ["#db2777","#f97316"],
  ["#059669","#3b82f6"],
  ["#d97706","#ef4444"],
  ["#7c3aed","#ec4899"],
  ["#0891b2","#7c3aed"],
  ["#16a34a","#ca8a04"],
  ["#dc2626","#9333ea"],
];

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function getAvatar(userId: string): { emoji: string; from: string; to: string } {
  const h = hashId(userId);
  const emoji = EMOJIS[h % EMOJIS.length];
  const [from, to] = GRADIENTS[(h >> 4) % GRADIENTS.length];
  return { emoji, from, to };
}
