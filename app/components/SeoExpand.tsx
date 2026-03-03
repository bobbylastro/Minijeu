"use client";

import { useState } from "react";

export default function SeoExpand({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <div style={{
        maxHeight: expanded ? "2000px" : "0",
        overflow: "hidden",
        transition: "max-height 0.4s ease",
      }}>
        {children}
      </div>
      <button
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
        style={{
          marginTop: "12px",
          fontSize: "13px",
          fontWeight: 600,
          color: "#7c3aed",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          letterSpacing: "0.3px",
        }}
      >
        {expanded ? "See less ↑" : "See more ↓"}
      </button>
    </div>
  );
}
