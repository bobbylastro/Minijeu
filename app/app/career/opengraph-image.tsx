import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "CareerOrder — Rebuild Footballer Career Timelines";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "linear-gradient(135deg, #0a0a1f 0%, #12124a 50%, #0f172a 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", top: -100, left: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -80, right: -80, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)" }} />

        <div style={{ fontSize: 110, marginBottom: 20, display: "flex" }}>🔀</div>

        <div style={{ fontSize: 72, fontWeight: 800, color: "white", letterSpacing: "-2px", lineHeight: 1, marginBottom: 16, display: "flex" }}>
          Career<span style={{ color: "#8b5cf6", marginLeft: 16 }}>Order</span>
        </div>
        <div style={{ fontSize: 26, color: "rgba(255,255,255,0.6)", marginBottom: 40, textAlign: "center", display: "flex" }}>
          Rebuild footballer career timelines — club by club
        </div>
        <div style={{ background: "linear-gradient(90deg, rgba(139,92,246,0.5), rgba(99,102,241,0.5))", borderRadius: 100, padding: "12px 40px", color: "white", fontSize: 20, fontWeight: 600, display: "flex" }}>
          ultimate-playground.com/career
        </div>
      </div>
    ),
    { ...size }
  );
}
