"use client";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
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

interface LiveClip {
  id: string;
  title: string;
  game: string;
  video_url: string;
  thumbnail_url: string | null;
  source: string;
  likes_count: number;
  created_at: string;
}

type Tab = "pending" | "approved" | "rejected" | "live";
type SortOrder = "newest" | "oldest";

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
  const [tab, setTab]             = useState<Tab>("live");
  const [subs, setSubs]           = useState<Submission[]>([]);
  const [liveClips, setLiveClips] = useState<LiveClip[]>([]);
  const [loading, setLoading]     = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [previewClip, setPreviewClip]     = useState<LiveClip | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  // Bulk selection + filters
  const [selectedIds, setSelectedIds]     = useState<Set<string>>(new Set());
  const [gameFilter, setGameFilter]       = useState<string>("all");
  const [sortOrder, setSortOrder]         = useState<SortOrder>("newest");
  const [bulkDeleting, setBulkDeleting]   = useState(false);
  const [confirmBulk, setConfirmBulk]     = useState(false);

  const loadSubmissions = useCallback(async (status: "pending" | "approved" | "rejected") => {
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

  const loadLiveClips = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/clips/live");
      if (!res.ok) throw new Error("forbidden");
      const { clips } = await res.json();
      setLiveClips(clips ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSelectedIds(new Set());
    setGameFilter("all");
    if (tab === "live") loadLiveClips();
    else loadSubmissions(tab);
  }, [tab, loadSubmissions, loadLiveClips]);

  // Derived: available game filter options
  const availableGames = useMemo(() => {
    const games = new Set(liveClips.map((c) => c.game));
    return Array.from(games).sort();
  }, [liveClips]);

  // Derived: filtered + sorted clips
  const filteredClips = useMemo(() => {
    let clips = liveClips;
    if (gameFilter !== "all") clips = clips.filter((c) => c.game === gameFilter);
    return [...clips].sort((a, b) => {
      const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return sortOrder === "newest" ? diff : -diff;
    });
  }, [liveClips, gameFilter, sortOrder]);

  const allFilteredSelected =
    filteredClips.length > 0 && filteredClips.every((c) => selectedIds.has(c.id));

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredClips.forEach((c) => next.delete(c.id));
      } else {
        filteredClips.forEach((c) => next.add(c.id));
      }
      return next;
    });
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function act(id: string, action: "approve" | "reject") {
    setActioning(id);
    try {
      const res = await fetch(`/api/admin/clips/${id}/${action}`, { method: "POST" });
      if (res.ok) setSubs((prev) => prev.filter((s) => s.id !== id));
    } finally {
      setActioning(null);
    }
  }

  async function deleteClip(id: string) {
    setActioning(id);
    setConfirmDelete(null);
    try {
      const res = await fetch(`/api/admin/clips/${id}`, { method: "DELETE" });
      if (res.ok) {
        setLiveClips((prev) => prev.filter((c) => c.id !== id));
        setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
      }
    } finally {
      setActioning(null);
    }
  }

  async function bulkDelete() {
    setBulkDeleting(true);
    setConfirmBulk(false);
    const ids = Array.from(selectedIds);
    try {
      const res = await fetch("/api/admin/clips/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (res.ok) {
        setLiveClips((prev) => prev.filter((c) => !selectedIds.has(c.id)));
        setSelectedIds(new Set());
      }
    } finally {
      setBulkDeleting(false);
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "live",     label: "Live clips" },
    { key: "pending",  label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];

  return (
    <main className="adm-page">
      <div className="adm-header">
        <h1 className="adm-title">Admin</h1>
        <div className="adm-filters">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              className={`adm-filter-btn${tab === key ? " is-active" : ""}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="adm-loading">
          <span className="waiting-dot" /><span className="waiting-dot" /><span className="waiting-dot" />
        </div>
      ) : tab === "live" ? (
        liveClips.length === 0 ? (
          <div className="adm-empty">No live clips.</div>
        ) : (
          <>
            {/* ── Toolbar ─────────────────────────────────────────── */}
            <div className="adm-toolbar">
              <div className="adm-toolbar__left">
                <label className="adm-select-all">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAll}
                  />
                  <span>
                    {allFilteredSelected ? "Deselect all" : "Select all"}
                    {filteredClips.length !== liveClips.length && ` (${filteredClips.length} visible)`}
                  </span>
                </label>

                {selectedIds.size > 0 && (
                  confirmBulk ? (
                    <div className="adm-bulk-confirm">
                      <span>Delete {selectedIds.size} clip{selectedIds.size > 1 ? "s" : ""}?</span>
                      <button
                        className="adm-bulk-del-btn adm-bulk-del-btn--confirm"
                        onClick={bulkDelete}
                        disabled={bulkDeleting}
                      >
                        {bulkDeleting ? "Deleting…" : "Yes, delete"}
                      </button>
                      <button
                        className="adm-bulk-cancel-btn"
                        onClick={() => setConfirmBulk(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className="adm-bulk-del-btn"
                      onClick={() => setConfirmBulk(true)}
                      disabled={bulkDeleting}
                    >
                      Delete selected ({selectedIds.size})
                    </button>
                  )
                )}
              </div>

              <div className="adm-toolbar__right">
                {/* Game filter */}
                <div className="adm-game-filters">
                  <button
                    className={`adm-game-btn${gameFilter === "all" ? " is-active" : ""}`}
                    onClick={() => setGameFilter("all")}
                  >
                    All
                  </button>
                  {availableGames.map((slug) => {
                    const game = isGameSlug(slug) ? GAMES[slug] : null;
                    return (
                      <button
                        key={slug}
                        className={`adm-game-btn${gameFilter === slug ? " is-active" : ""}`}
                        onClick={() => setGameFilter(slug)}
                        style={gameFilter === slug && game ? { background: game.color + "33", borderColor: game.color + "88", color: game.color } : undefined}
                      >
                        {game?.name ?? slug}
                      </button>
                    );
                  })}
                </div>

                {/* Sort */}
                <button
                  className="adm-sort-btn"
                  onClick={() => setSortOrder((o) => o === "newest" ? "oldest" : "newest")}
                >
                  {sortOrder === "newest" ? "↓ Newest" : "↑ Oldest"}
                </button>
              </div>
            </div>

            <div className="adm-grid">
              {filteredClips.map((clip) => {
                const game      = isGameSlug(clip.game) ? GAMES[clip.game] : null;
                const busy      = actioning === clip.id;
                const confirming = confirmDelete === clip.id;
                const selected  = selectedIds.has(clip.id);
                return (
                  <div key={clip.id} className={`adm-card${selected ? " is-selected" : ""}`}>
                    <div className="adm-card__video-wrap">
                      {clip.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={clip.thumbnail_url}
                          alt={clip.title}
                          className="adm-card__thumb"
                        />
                      ) : (
                        <div
                          className="adm-card__no-preview"
                          style={{ background: game ? game.color + "33" : undefined }}
                        >
                          {game?.name ?? clip.game}
                        </div>
                      )}
                      <label className="adm-card__checkbox">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleSelect(clip.id)}
                        />
                      </label>
                    </div>

                    <div className="adm-card__body">
                      <div className="adm-card__badges">
                        {game ? (
                          <span
                            className="adm-card__game-badge"
                            style={{ background: game.color, color: game.textColor }}
                          >
                            {game.name}
                          </span>
                        ) : (
                          <span className="adm-card__game-badge" style={{ background: "#555", color: "#fff" }}>
                            {clip.game}
                          </span>
                        )}
                        <span className="adm-card__time">{timeAgo(clip.created_at)}</span>
                      </div>
                      <p className="adm-card__title">{clip.title}</p>
                      <p className="adm-card__ip">{clip.likes_count} like{clip.likes_count !== 1 ? "s" : ""} · {clip.source}</p>
                    </div>

                    <div className="adm-card__actions">
                      {confirming ? (
                        <>
                          <span className="adm-confirm-label">Delete?</span>
                          <button
                            className="adm-btn adm-btn--reject"
                            onClick={() => deleteClip(clip.id)}
                            disabled={busy}
                          >
                            {busy ? "…" : "Yes, delete"}
                          </button>
                          <button
                            className="adm-btn adm-btn--approve"
                            onClick={() => setConfirmDelete(null)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="adm-btn adm-btn--approve"
                            onClick={() => setPreviewClip(clip)}
                          >
                            ▶ Preview
                          </button>
                          <button
                            className="adm-btn adm-btn--reject"
                            onClick={() => setConfirmDelete(clip.id)}
                            disabled={busy}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )
      ) : subs.length === 0 ? (
        <div className="adm-empty">No {tab} submissions.</div>
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

                {tab === "pending" && (
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

      {/* ── Video preview modal ───────────────────────────────────────── */}
      {previewClip && (
        <div
          className="adm-preview-overlay"
          onClick={() => { setPreviewClip(null); previewVideoRef.current?.pause(); }}
          onKeyDown={(e) => { if (e.key === "Escape") { setPreviewClip(null); previewVideoRef.current?.pause(); } }}
          tabIndex={-1}
        >
          <div className="adm-preview-box" onClick={(e) => e.stopPropagation()}>
            <div className="adm-preview-header">
              <span className="adm-preview-title">{previewClip.title}</span>
              <button
                className="adm-preview-close"
                onClick={() => { setPreviewClip(null); previewVideoRef.current?.pause(); }}
              >
                ×
              </button>
            </div>
            <video
              ref={previewVideoRef}
              className="adm-preview-video"
              src={previewClip.video_url}
              controls
              autoPlay
              playsInline
              preload="auto"
            />
          </div>
        </div>
      )}
    </main>
  );
}
