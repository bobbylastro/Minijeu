import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "What Came First — History & Culture Quiz";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, background: "linear-gradient(135deg, #150a28 0%, #220f40 50%, #150a28 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -100, left: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.25) 0%, transparent 70%)" }} />
        <div style={{ fontSize: 110, marginBottom: 20, display: "flex" }}>⏳</div>
        <div style={{ fontSize: 64, fontWeight: 800, color: "white", letterSpacing: "-2px", lineHeight: 1, marginBottom: 16, display: "flex", textAlign: "center" }}>
          What Came<span style={{ color: "#a855f7", marginLeft: 16 }}>First?</span>
        </div>
        <div style={{ fontSize: 24, color: "rgba(255,255,255,0.6)", marginBottom: 40, display: "flex" }}>History, Science &amp; Culture — Which event came first?</div>
        <div style={{ background: "linear-gradient(90deg, rgba(168,85,247,0.5), rgba(139,92,246,0.5))", borderRadius: 100, padding: "12px 40px", color: "white", fontSize: 20, fontWeight: 600, display: "flex" }}>ultimate-playground.com/wcf</div>
      </div>
    ),
    { ...size }
  );
}
