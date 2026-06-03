import { ImageResponse } from "next/og";
import { GAMES } from "@/lib/clips-shared";

export const runtime = "edge";

const GAME_COLORS = [
  "#ff4655", "#cd4a14", "#e62429", "#f5a623", "#1e90ff",
  "#1c6eb5", "#c89b3c", "#e8a020", "#b7431e", "#229954",
  "#5b8c2a", "#f99e1a", "#00b4d8",
];

async function loadFont(): Promise<ArrayBuffer | null> {
  try {
    const cssRes = await fetch(
      "https://fonts.googleapis.com/css2?family=Bebas+Neue",
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );
    const css = await cssRes.text();
    const match = css.match(/src:\s*url\(([^)]+)\)/);
    if (!match) return null;
    const fontRes = await fetch(match[1]);
    return fontRes.arrayBuffer();
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gameSlug = searchParams.get("game");
  const game = gameSlug && gameSlug in GAMES ? GAMES[gameSlug as keyof typeof GAMES] : null;

  const fontData = await loadFont();
  const fonts = fontData
    ? [{ name: "BebasNeue", data: fontData, weight: 400 as const, style: "normal" as const }]
    : [];

  if (game) {
    return new ImageResponse(
      <ArticleOG gameName={game.name} gameColor={game.color} fontData={fontData} />,
      { width: 1200, height: 630, fonts }
    );
  }

  return new ImageResponse(
    <DefaultOG fontData={fontData} />,
    { width: 1200, height: 630, fonts }
  );
}

function DefaultOG({ fontData }: { fontData: ArrayBuffer | null }) {
  const ff = fontData ? "BebasNeue" : "sans-serif";
  return (
    <div style={{ width: "1200px", height: "630px", background: "#0a0a0f", display: "flex",
      flexDirection: "column", alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden", fontFamily: ff }}>
      <div style={{ position: "absolute", width: "600px", height: "600px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",
        top: "-200px", left: "-100px", display: "flex" }} />
      <div style={{ position: "absolute", width: "500px", height: "500px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(168,85,247,0.14) 0%, transparent 70%)",
        bottom: "-150px", right: "-80px", display: "flex" }} />
      <div style={{ width: "48px", height: "48px",
        background: "linear-gradient(135deg, #6366f1, #a855f7)", borderRadius: "10px",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "22px", fontWeight: 900, color: "#fff", letterSpacing: "-1px",
        marginBottom: "24px" }}>UP</div>
      <div style={{ fontSize: "88px", fontWeight: 400, color: "#ffffff",
        letterSpacing: "4px", lineHeight: 1, textAlign: "center", display: "flex" }}>
        ULTIMATE PLAYGROUND
      </div>
      <div style={{ width: "80px", height: "3px",
        background: "linear-gradient(90deg, #6366f1, #a855f7)",
        margin: "20px 0", borderRadius: "2px", display: "flex" }} />
      <div style={{ fontSize: "28px", color: "rgba(255,255,255,0.6)",
        letterSpacing: "2px", textAlign: "center", display: "flex" }}>
        THE BEST GAMING CLIPS, RIGHT NOW
      </div>
      <div style={{ display: "flex", gap: "8px", marginTop: "48px" }}>
        {GAME_COLORS.map((color, i) => (
          <div key={i} style={{ width: "56px", height: "6px", background: color,
            borderRadius: "3px", opacity: 0.85, display: "flex" }} />
        ))}
      </div>
      <div style={{ position: "absolute", bottom: "28px", right: "36px",
        fontSize: "18px", color: "rgba(255,255,255,0.25)", letterSpacing: "1px",
        display: "flex" }}>ultimate-playground.com</div>
    </div>
  );
}

function ArticleOG({ gameName, gameColor, fontData }: {
  gameName: string;
  gameColor: string;
  fontData: ArrayBuffer | null;
}) {
  const ff = fontData ? "BebasNeue" : "sans-serif";
  return (
    <div style={{ width: "1200px", height: "630px", background: "#0a0a0f", display: "flex",
      flexDirection: "column", justifyContent: "flex-end",
      position: "relative", overflow: "hidden", fontFamily: ff }}>
      {/* Game color ambient glow */}
      <div style={{ position: "absolute", width: "700px", height: "700px", borderRadius: "50%",
        background: `radial-gradient(circle, ${gameColor}28 0%, transparent 65%)`,
        top: "-250px", right: "-150px", display: "flex" }} />
      <div style={{ position: "absolute", width: "400px", height: "400px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
        bottom: "-100px", left: "-80px", display: "flex" }} />

      {/* Top branding */}
      <div style={{ position: "absolute", top: "44px", left: "56px",
        display: "flex", alignItems: "center", gap: "14px" }}>
        <div style={{ width: "36px", height: "36px",
          background: "linear-gradient(135deg, #6366f1, #a855f7)", borderRadius: "8px",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "16px", fontWeight: 900, color: "#fff" }}>UP</div>
        <div style={{ fontSize: "22px", color: "rgba(255,255,255,0.5)",
          letterSpacing: "2px", display: "flex" }}>ULTIMATE PLAYGROUND</div>
      </div>

      {/* Game badge */}
      <div style={{ position: "absolute", top: "44px", right: "56px",
        background: gameColor, borderRadius: "6px", padding: "6px 16px",
        fontSize: "20px", color: "#fff", letterSpacing: "2px", display: "flex" }}>
        {gameName.toUpperCase()}
      </div>

      {/* Bottom content */}
      <div style={{ padding: "0 56px 56px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ fontSize: "18px", color: "rgba(255,255,255,0.45)",
          letterSpacing: "3px", display: "flex" }}>GAMING BLOG</div>
        <div style={{ fontSize: "64px", color: "#ffffff", letterSpacing: "2px",
          lineHeight: 1.05, display: "flex", maxWidth: "900px" }}>
          THE BEST {gameName.toUpperCase()} CLIPS &amp; HIGHLIGHTS
        </div>
        {/* Game color bar */}
        <div style={{ width: "80px", height: "4px", background: gameColor,
          borderRadius: "2px", marginTop: "4px", display: "flex" }} />
      </div>
    </div>
  );
}
