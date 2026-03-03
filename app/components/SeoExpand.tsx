"use client";

import { useState } from "react";

export default function SeoExpand({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="seo-expand">
      <div className={`seo-expand__body ${expanded ? "seo-expand__body--open" : ""}`}>
        {children}
      </div>
      <button
        className="seo-expand__toggle"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        {expanded ? "See less ↑" : "See more ↓"}
      </button>
    </div>
  );
}
