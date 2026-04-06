import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Higher or Lower — City Population Quiz";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, background: "linear-gradient(135deg, #0a1628 0%, #0f2240 50%, #0a1a2e 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -100, right: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,197,94,0.2) 0%, transparent 70%)" }} />
        <div style={{ fontSize: 110, marginBottom: 20, display: "flex" }}>📊</div>
        <div style={{ fontSize: 64, fontWeight: 800, color: "white", letterSpacing: "-2px", lineHeight: 1, marginBottom: 16, display: "flex" }}>
          Higher or<span style={{ color: "#22c55e", marginLeft: 16 }}>Lower?</span>
        </div>
        <div style={{ fontSize: 24, color: "rgba(255,255,255,0.6)", marginBottom: 40, display: "flex" }}>Guess city populations — higher or lower?</div>
        <div style={{ background: "linear-gradient(90deg, rgba(34,197,94,0.5), rgba(16,185,129,0.5))", borderRadius: 100, padding: "12px 40px", color: "white", fontSize: 20, fontWeight: 600, display: "flex" }}>ultimate-playground.com/higher-or-lower</div>
      </div>
    ),
    { ...size }
  );
}
