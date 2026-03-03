"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [consent, setConsent] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const stored = localStorage.getItem("cookie_consent");
    setConsent(stored ?? null);
  }, []);

  function accept() {
    localStorage.setItem("cookie_consent", "accepted");
    window.dispatchEvent(new Event("consent_update"));
    setConsent("accepted");
  }

  function refuse() {
    localStorage.setItem("cookie_consent", "refused");
    setConsent("refused");
  }

  if (consent !== null) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      background: "rgba(10, 8, 28, 0.97)",
      borderTop: "1px solid rgba(124, 58, 237, 0.3)",
      backdropFilter: "blur(12px)",
      padding: "14px 24px",
      display: "flex",
      alignItems: "center",
      gap: "20px",
      flexWrap: "wrap",
    }}>
      <p style={{
        flex: 1,
        minWidth: "200px",
        fontSize: "13px",
        color: "rgba(255,255,255,0.65)",
        lineHeight: 1.6,
        margin: 0,
      }}>
        We use cookies to improve your experience, analyze traffic, and display ads.
        You can accept or refuse non-essential cookies.{" "}
        <Link href="/cookies" style={{ color: "#818cf8", textDecoration: "underline" }}>
          Learn more
        </Link>
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
        <Link href="/cookies" style={{
          fontSize: "13px",
          color: "rgba(255,255,255,0.45)",
          textDecoration: "underline",
          textUnderlineOffset: "2px",
          padding: "8px 4px",
        }}>
          Settings
        </Link>
        <button onClick={refuse} style={{
          fontSize: "13px",
          fontWeight: 600,
          fontFamily: "inherit",
          color: "rgba(255,255,255,0.75)",
          background: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: "8px",
          padding: "8px 18px",
          cursor: "pointer",
        }}>
          Refuse
        </button>
        <button onClick={accept} style={{
          fontSize: "13px",
          fontWeight: 700,
          fontFamily: "inherit",
          color: "#1a0800",
          background: "linear-gradient(135deg, #f0c040, #ff8c42)",
          border: "none",
          borderRadius: "50px",
          padding: "8px 20px",
          cursor: "pointer",
        }}>
          Accept
        </button>
      </div>
    </div>
  );
}
