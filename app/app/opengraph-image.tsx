import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Ultimate Playground — Free Online Quiz & Mini Games";
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
        {/* Background glow orbs */}
        <div
          style={{
            position: "absolute",
            top: -100,
            left: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            right: -80,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)",
          }}
        />

        {/* Category pills */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 40,
          }}
        >
          {["⚽ Sports", "🌍 Geography", "🦁 Animals", "🍽️ Food", "🧠 Culture"].map((label) => (
            <div
              key={label}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 100,
                padding: "6px 16px",
                color: "rgba(255,255,255,0.7)",
                fontSize: 18,
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Main title */}
        <div
          style={{
            fontSize: 80,
            fontWeight: 800,
            color: "white",
            letterSpacing: "-2px",
            lineHeight: 1,
            marginBottom: 20,
            display: "flex",
          }}
        >
          Ultimate{" "}
          <span
            style={{
              backgroundImage: "linear-gradient(90deg, #f97316, #ec4899)",
              backgroundClip: "text",
              color: "transparent",
              marginLeft: 20,
            }}
          >
            Playground
          </span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 28,
            color: "rgba(255,255,255,0.6)",
            fontWeight: 400,
            marginBottom: 48,
            letterSpacing: "0.5px",
          }}
        >
          Free Online Quiz & Mini Games — Solo or Multiplayer
        </div>

        {/* Bottom CTA bar */}
        <div
          style={{
            background: "linear-gradient(90deg, rgba(124,58,237,0.6), rgba(59,130,246,0.6))",
            borderRadius: 100,
            padding: "14px 48px",
            color: "white",
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: "0.5px",
          }}
        >
          ultimate-playground.com
        </div>
      </div>
    ),
    { ...size }
  );
}
