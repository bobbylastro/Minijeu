import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "FootballQuiz — Trivia, Transfers & Stadiums";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "linear-gradient(135deg, #0a1f0a 0%, #0d2d0d 50%, #0f172a 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", top: -100, left: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.2) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -80, right: -80, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)" }} />

        <div style={{ fontSize: 110, marginBottom: 20, display: "flex" }}>⚽</div>

        <div style={{ fontSize: 72, fontWeight: 800, color: "white", letterSpacing: "-2px", lineHeight: 1, marginBottom: 16, display: "flex" }}>
          Football<span style={{ color: "#22c55e", marginLeft: 16 }}>Quiz</span>
        </div>
        <div style={{ display: "flex", gap: 16, marginBottom: 40 }}>
          {["Trivia", "Stadiums", "Transfers", "Salaries", "Peak Seasons"].map((tag) => (
            <div key={tag} style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 100, padding: "6px 18px", color: "rgba(255,255,255,0.8)", fontSize: 18, display: "flex" }}>
              {tag}
            </div>
          ))}
        </div>
        <div style={{ background: "linear-gradient(90deg, rgba(34,197,94,0.5), rgba(16,185,129,0.5))", borderRadius: 100, padding: "12px 40px", color: "white", fontSize: 20, fontWeight: 600, display: "flex" }}>
          ultimate-playground.com/football
        </div>
      </div>
    ),
    { ...size }
  );
}
