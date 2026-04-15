"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getRank } from "@/lib/ranks";

// ─── Category + game structure ────────────────────────────────────────────────
// IMPORTANT: when adding a new game, add it here + in /api/ratings/[gameType]/route.ts
interface GameEntry   { key: string; label: string }
interface CategoryDef {
  key: string; label: string;
  color: string; bg: string; // accent + tinted bg for active state
  games: GameEntry[];
}

const CATEGORIES: CategoryDef[] = [
  {
    key: "sports", label: "⚽ Sports",
    color: "#4ade80", bg: "rgba(74,222,128,0.12)",
    games: [
      { key: "football",  label: "⚽ Football" },
      { key: "nba",       label: "🏀 NBA" },
      { key: "career",    label: "🔀 Career Order" },
    ],
  },
  {
    key: "geography", label: "🌍 Geography",
    color: "#38bdf8", bg: "rgba(56,189,248,0.12)",
    games: [
      { key: "citymix",          label: "🌍 CityMix" },
      { key: "higher-or-lower",  label: "📊 Higher or Lower" },
      { key: "citymap",          label: "🏙️ City Origins" },
      { key: "hotel-price",      label: "🏨 Hotel Price" },
    ],
  },
  {
    key: "culture", label: "🎭 Culture",
    color: "#a78bfa", bg: "rgba(167,139,250,0.12)",
    games: [
      { key: "wcf",        label: "⏳ What Came First" },
      { key: "origins",    label: "🌐 Origins" },
      { key: "wealth",     label: "💰 Wealth" },
      { key: "five-clues", label: "🕵️ Five Clues" },
    ],
  },
  {
    key: "food", label: "🍜 Food",
    color: "#fb923c", bg: "rgba(251,146,60,0.12)",
    games: [
      { key: "food", label: "🍜 Food Origins" },
    ],
  },
  {
    key: "animals", label: "🦁 Animals",
    color: "#f59e0b", bg: "rgba(245,158,11,0.12)",
    games: [
      { key: "wild-battle",     label: "🦁 Wild Battle" },
      { key: "animal-locator",  label: "🗺️ Animal Locator" },
    ],
  },
  {
    key: "gaming", label: "🎮 Gaming",
    color: "#e879f9", bg: "rgba(232,121,249,0.12)",
    games: [
      { key: "gaming-mix", label: "🎮 Gaming Mix" },
    ],
  },
];

interface RatingRow {
  user_id:    string;
  points:     number;
  wins:       number;
  losses:     number;
  rank_floor: number;
  profiles:   { username: string; avatar_url: string | null };
}

export default function LeaderboardPage() {
  const { user, profile } = useAuth();

  const [activeCatKey,  setActiveCatKey]  = useState(CATEGORIES[0].key);
  const [activeGameKey, setActiveGameKey] = useState(CATEGORIES[0].games[0].key);
  const [rows,    setRows]    = useState<RatingRow[]>([]);
  const [loading, setLoading] = useState(true);

  const activeCat  = CATEGORIES.find(c => c.key === activeCatKey)!;
  const activeGame = activeCat.games.find(g => g.key === activeGameKey) ?? activeCat.games[0];

  const fetchLeaderboard = useCallback(async (gameType: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ratings/${gameType}`);
      const { leaderboard } = await res.json();
      setRows(leaderboard ?? []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard(activeGame.key);
  }, [activeGame.key, fetchLeaderboard]);

  function selectCategory(cat: CategoryDef) {
    setActiveCatKey(cat.key);
    setActiveGameKey(cat.games[0].key);
  }

  const myRank = user ? rows.findIndex(r => r.user_id === user.id) : -1;
  const myRow  = myRank !== -1 ? rows[myRank] : null;

  return (
    <div className="leaderboard-page">

      {/* Header */}
      <div className="leaderboard-page__header">
        <h1 className="leaderboard-page__title">🏆 Leaderboard</h1>
        <p className="leaderboard-page__subtitle">Top 50 players per game</p>
        <div className="leaderboard-mp-note">
          🎮 Multiplayer only — rankings are earned in online matches against real players
        </div>
      </div>

      {/* Category pills */}
      <div className="leaderboard-cat-row">
        {CATEGORIES.map(cat => {
          const isActive = cat.key === activeCatKey;
          return (
            <button
              key={cat.key}
              className={`leaderboard-cat-btn${isActive ? " is-active" : ""}`}
              style={isActive ? { background: cat.bg, borderColor: cat.color, color: cat.color } : {}}
              onClick={() => selectCategory(cat)}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Game pills (within selected category) */}
      <div className="leaderboard-game-row">
        {activeCat.games.map(game => {
          const isActive = game.key === activeGame.key;
          return (
            <button
              key={game.key}
              className={`leaderboard-game-btn${isActive ? " is-active" : ""}`}
              style={isActive ? { background: activeCat.bg, borderColor: activeCat.color, color: activeCat.color } : {}}
              onClick={() => setActiveGameKey(game.key)}
            >
              {game.label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="leaderboard-table-wrap">
        {loading ? (
          <div className="leaderboard-loading">
            <div className="waiting-indicator">
              {[0,1,2].map(i => <div key={i} className="waiting-dot" style={{ animationDelay: `${i * 0.2}s` }} />)}
            </div>
          </div>
        ) : rows.length === 0 ? (
          <div className="leaderboard-empty">No players yet — be the first!</div>
        ) : (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th className="leaderboard-th leaderboard-th--rank">Rank</th>
                <th className="leaderboard-th leaderboard-th--num">#</th>
                <th className="leaderboard-th leaderboard-th--player">Player</th>
                <th className="leaderboard-th leaderboard-th--pts">Points</th>
                <th className="leaderboard-th leaderboard-th--wl">W</th>
                <th className="leaderboard-th leaderboard-th--wl">L</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const tier = getRank(row.points);
                const isMe = user?.id === row.user_id;
                return (
                  <tr key={row.user_id} className={`leaderboard-row${isMe ? " leaderboard-row--me" : ""}`}>
                    <td className="leaderboard-td leaderboard-td--rank">
                      <span className="leaderboard-tier-badge" title={tier.name}>
                        {tier.emoji} {tier.name}
                      </span>
                    </td>
                    <td className="leaderboard-td leaderboard-td--num">
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                    </td>
                    <td className="leaderboard-td leaderboard-td--player">
                      <span className="leaderboard-username">
                        {row.profiles?.username ?? "Unknown"}
                        {isMe && <span className="leaderboard-you-tag">you</span>}
                      </span>
                    </td>
                    <td className="leaderboard-td leaderboard-td--pts">
                      <strong>{row.points.toLocaleString()}</strong>
                    </td>
                    <td className="leaderboard-td leaderboard-td--wl leaderboard-td--win">{row.wins}</td>
                    <td className="leaderboard-td leaderboard-td--wl leaderboard-td--loss">{row.losses}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Sticky "your row" if outside top 50 */}
      {myRow && myRank >= 50 && (
        <div className="leaderboard-my-row">
          <span className="leaderboard-my-row__label">Your rank</span>
          <span className="leaderboard-tier-badge">{getRank(myRow.points).emoji} {getRank(myRow.points).name}</span>
          <span className="leaderboard-username">{profile?.username}</span>
          <span><strong>#{myRank + 1}</strong></span>
          <span><strong>{myRow.points.toLocaleString()} pts</strong></span>
          <span className="leaderboard-td--win">{myRow.wins}W</span>
          <span className="leaderboard-td--loss">{myRow.losses}L</span>
        </div>
      )}
    </div>
  );
}
