import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Sports Games — Football & NBA Quizzes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "linear-gradient(135deg, #0f0c29 0%, #1a1040 50%, #0f172a 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", top: -100, left: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -80, right: -80, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)" }} />

        <div style={{ fontSize: 100, marginBottom: 24, display: "flex" }}>⚽🏀</div>

        <div style={{ fontSize: 72, fontWeight: 800, color: "white", letterSpacing: "-2px", lineHeight: 1, marginBottom: 16, display: "flex" }}>
          Sports Games
        </div>
        <div style={{ fontSize: 28, color: "rgba(255,255,255,0.6)", marginBottom: 40, display: "flex" }}>
          Football, NBA, CareerOrder — Solo &amp; Multiplayer
        </div>
        <div style={{ background: "linear-gradient(90deg, rgba(124,58,237,0.6), rgba(59,130,246,0.6))", borderRadius: 100, padding: "12px 40px", color: "white", fontSize: 20, fontWeight: 600, display: "flex" }}>
          ultimate-playground.com/sports
        </div>
      </div>
    ),
    { ...size }
  );
}
