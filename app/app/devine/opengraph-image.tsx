import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "PopGuessr — Guess City Populations";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, background: "linear-gradient(135deg, #0a1628 0%, #0f2240 50%, #0a1a2e 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -100, left: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)" }} />
        <div style={{ fontSize: 110, marginBottom: 20, display: "flex" }}>👥</div>
        <div style={{ fontSize: 72, fontWeight: 800, color: "white", letterSpacing: "-2px", lineHeight: 1, marginBottom: 16, display: "flex" }}>
          Pop<span style={{ color: "#3b82f6", marginLeft: 16 }}>Guessr</span>
        </div>
        <div style={{ fontSize: 24, color: "rgba(255,255,255,0.6)", marginBottom: 40, display: "flex" }}>Use the slider — guess city populations worldwide</div>
        <div style={{ background: "linear-gradient(90deg, rgba(59,130,246,0.5), rgba(14,165,233,0.5))", borderRadius: 100, padding: "12px 40px", color: "white", fontSize: 20, fontWeight: 600, display: "flex" }}>ultimate-playground.com/devine</div>
      </div>
    ),
    { ...size }
  );
}
