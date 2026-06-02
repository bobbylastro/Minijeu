"use client";
import { useEffect, useState, useCallback } from "react";
import { GAMES, isGameSlug } from "@/lib/clips-shared";

interface Submission {
  id: string;
  title: string;
  game: string;
  submitter_name: string | null;
  submitter_ip: string;
  storage_path: string;
  status: string;
  created_at: string;
  previewUrl: string | null;
}

type Filter = "pending" | "approved" | "rejected";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AdminClipsDashboard() {
  const [filter, setFilter] = useState<Filter>("pending");
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  const load = useCallback(async (status: Filter) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/clips?status=${status}`);
      if (!res.ok) throw new Error("forbidden");
      const { submissions } = await res.json();
      setSubs(submissions ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(filter); }, [filter, load]);

  async function act(id: string, action: "approve" | "reject") {
    setActioning(id);
    try {
      const res = await fetch(`/api/admin/clips/${id}/${action}`, { method: "POST" });
      if (res.ok) setSubs((prev) => prev.filter((s) => s.id !== id));
    } finally {
      setActioning(null);
    }
  }

  return (
    <main className="adm-page">
      <div className="adm-header">
        <h1 className="adm-title">Clip submissions</h1>
        <div className="adm-filters">
          {(["pending", "approved", "rejected"] as Filter[]).map((f) => (
            <button
              key={f}
              className={`adm-filter-btn${filter === f ? " is-active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="adm-loading">
          <span className="waiting-dot" /><span className="waiting-dot" /><span className="waiting-dot" />
        </div>
      ) : subs.length === 0 ? (
        <div className="adm-empty">No {filter} submissions.</div>
      ) : (
        <div className="adm-grid">
          {subs.map((sub) => {
            const game = isGameSlug(sub.game) ? GAMES[sub.game] : null;
            const busy = actioning === sub.id;
            return (
              <div key={sub.id} className="adm-card">
                <div className="adm-card__video-wrap">
                  {sub.previewUrl ? (
                    <video
                      className="adm-card__video"
                      src={sub.previewUrl}
                      controls
                      muted
                      preload="metadata"
                    />
                  ) : (
                    <div className="adm-card__no-preview">No preview</div>
                  )}
                </div>

                <div className="adm-card__body">
                  <div className="adm-card__badges">
                    {game && (
                      <span
                        className="adm-card__game-badge"
                        style={{ background: game.color, color: game.textColor }}
                      >
                        {game.name}
                      </span>
                    )}
                    <span className="adm-card__time">{timeAgo(sub.created_at)}</span>
                  </div>
                  <p className="adm-card__title">{sub.title}</p>
                  {sub.submitter_name && (
                    <p className="adm-card__handle">by {sub.submitter_name}</p>
                  )}
                  <p className="adm-card__ip">{sub.submitter_ip}</p>
                </div>

                {filter === "pending" && (
                  <div className="adm-card__actions">
                    <button
                      className="adm-btn adm-btn--approve"
                      onClick={() => act(sub.id, "approve")}
                      disabled={busy}
                    >
                      {busy ? "…" : "✓ Approve"}
                    </button>
                    <button
                      className="adm-btn adm-btn--reject"
                      onClick={() => act(sub.id, "reject")}
                      disabled={busy}
                    >
                      {busy ? "…" : "✕ Reject"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
