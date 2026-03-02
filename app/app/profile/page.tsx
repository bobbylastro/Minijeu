"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getAvatar } from "@/lib/avatar";
import { getRank, RANKS } from "@/lib/ranks";

interface RatingRow {
  user_id: string;
  game_type: string;
  points: number;
  wins: number;
  losses: number;
}

const GAME_LABELS: Record<string, string> = {
  football:         "⚽ Football",
  nba:              "🏀 NBA",
  career:           "🔀 Career",
  wcf:              "⏳ WhatCameFirst",
  citymix:          "🌍 CityMix",
  "higher-or-lower": "📊 Higher or Lower",
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading, refreshProfile } = useAuth();

  const [ratings, setRatings]         = useState<RatingRow[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [saveError, setSaveError]     = useState<string | null>(null);
  const [saving, setSaving]           = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  // Fetch all ratings for this user
  useEffect(() => {
    if (!user) return;
    Promise.all(
      Object.keys(GAME_LABELS).map(g =>
        fetch(`/api/ratings/${g}`).then(r => r.json())
      )
    ).then(results => {
      const rows: RatingRow[] = [];
      results.forEach((res, i) => {
        const gameType = Object.keys(GAME_LABELS)[i];
        const entry = (res.leaderboard as RatingRow[])?.find((r: RatingRow) => r.user_id === user.id);
        if (entry) rows.push({ ...entry, game_type: gameType });
      });
      setRatings(rows);
    });
  }, [user]);

  if (loading || !user || !profile) {
    return (
      <div className="profile-page">
        <div className="leaderboard-loading">
          <div className="waiting-indicator">
            {[0,1,2].map(i => <div key={i} className="waiting-dot" style={{ animationDelay: `${i * 0.2}s` }} />)}
          </div>
        </div>
      </div>
    );
  }

  const avatar = getAvatar(user.id);
  const totalWins   = ratings.reduce((s, r) => s + r.wins, 0);
  const totalLosses = ratings.reduce((s, r) => s + r.losses, 0);
  const bestRank    = ratings.length
    ? getRank(Math.max(...ratings.map(r => r.points)))
    : getRank(0);

  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: newUsername }),
    });
    setSaving(false);
    if (res.ok) {
      await refreshProfile();
      setEditingName(false);
    } else {
      const { error } = await res.json();
      setSaveError(error ?? "Something went wrong");
    }
  };

  return (
    <div className="profile-page">

      {/* ── Avatar + identity ─────────────────────────────────────── */}
      <div className="profile-card">
        <div
          className="profile-avatar"
          style={{ background: `linear-gradient(135deg, ${avatar.from}, ${avatar.to})` }}
        >
          {avatar.emoji}
        </div>

        {/* Username */}
        {editingName ? (
          <form className="profile-username-form" onSubmit={handleSaveUsername}>
            <input
              className="auth-modal__input profile-username-input"
              type="text"
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
              minLength={2}
              maxLength={20}
              autoFocus
              required
            />
            {saveError && <div className="auth-modal__error">{saveError}</div>}
            <div className="profile-username-actions">
              <button className="btn-primary" type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
              <button className="btn-outline" type="button" onClick={() => { setEditingName(false); setSaveError(null); }}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-identity">
            <h1 className="profile-username">{profile.username}</h1>
            <button
              className="profile-edit-btn"
              onClick={() => { setNewUsername(profile.username); setEditingName(true); }}
            >
              ✏️ Edit username
            </button>
          </div>
        )}

        {/* Email (read-only) */}
        <div className="profile-email">{user.email}</div>

        {/* Best rank badge */}
        <div className="profile-best-rank">
          <span className="leaderboard-tier-badge leaderboard-tier-badge--lg">
            {bestRank.emoji} {bestRank.name}
          </span>
          <span className="profile-best-rank__label">Best rank</span>
        </div>
      </div>

      {/* ── Overall stats ─────────────────────────────────────────── */}
      <div className="profile-stats">
        <div className="profile-stat">
          <div className="profile-stat__value profile-stat__value--win">{totalWins}</div>
          <div className="profile-stat__label">Wins</div>
        </div>
        <div className="profile-stat">
          <div className="profile-stat__value profile-stat__value--loss">{totalLosses}</div>
          <div className="profile-stat__label">Losses</div>
        </div>
        <div className="profile-stat">
          <div className="profile-stat__value">{totalWins + totalLosses}</div>
          <div className="profile-stat__label">Games</div>
        </div>
        <div className="profile-stat">
          <div className="profile-stat__value">
            {totalWins + totalLosses > 0
              ? `${Math.round((totalWins / (totalWins + totalLosses)) * 100)}%`
              : "—"}
          </div>
          <div className="profile-stat__label">Win rate</div>
        </div>
      </div>

      {/* ── Per-game ratings ──────────────────────────────────────── */}
      {ratings.length > 0 && (
        <div className="profile-ratings">
          <h2 className="profile-section-title">Ratings by game</h2>
          <div className="profile-ratings-grid">
            {ratings.map(r => {
              const rank = getRank(r.points);
              const nextRank = RANKS.find(rk => rk.minPoints > r.points);
              const pct = nextRank
                ? ((r.points - rank.minPoints) / (nextRank.minPoints - rank.minPoints)) * 100
                : 100;
              return (
                <div key={r.game_type} className="profile-game-card">
                  <div className="profile-game-card__header">
                    <span className="profile-game-card__name">{GAME_LABELS[r.game_type]}</span>
                    <span className="leaderboard-tier-badge">{rank.emoji} {rank.name}</span>
                  </div>
                  <div className="profile-game-card__points">{r.points.toLocaleString()} pts</div>
                  <div className="profile-game-card__bar-wrap">
                    <div className="profile-game-card__bar" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="profile-game-card__wl">
                    <span className="leaderboard-td--win">{r.wins}W</span>
                    <span className="leaderboard-td--loss">{r.losses}L</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {ratings.length === 0 && (
        <div className="profile-no-games">
          No multiplayer games yet — play a game to earn your first rating!
        </div>
      )}

    </div>
  );
}
