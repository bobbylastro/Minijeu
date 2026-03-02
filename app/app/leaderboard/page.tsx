"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getRank } from "@/lib/ranks";

const GAME_TABS = [
  { key: "football",       label: "⚽ Football" },
  { key: "nba",            label: "🏀 NBA" },
  { key: "career",         label: "🔀 Career" },
  { key: "wcf",            label: "⏳ WhatCameFirst" },
  { key: "citymix",        label: "🌍 CityMix" },
  { key: "higher-or-lower", label: "📊 Higher or Lower" },
];

interface RatingRow {
  user_id: string;
  points: number;
  wins: number;
  losses: number;
  rank_floor: number;
  profiles: { username: string; avatar_url: string | null };
}

export default function LeaderboardPage() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState(GAME_TABS[0].key);
  const [rows, setRows]           = useState<RatingRow[]>([]);
  const [loading, setLoading]     = useState(true);

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
    fetchLeaderboard(activeTab);
  }, [activeTab, fetchLeaderboard]);

  const myRank = user ? rows.findIndex(r => r.user_id === user.id) : -1;
  const myRow  = myRank !== -1 ? rows[myRank] : null;

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-page__header">
        <h1 className="leaderboard-page__title">🏆 Leaderboard</h1>
        <p className="leaderboard-page__subtitle">Top 50 players by game — earn points in multiplayer matches</p>
      </div>

      {/* Tab bar */}
      <div className="leaderboard-tabs">
        {GAME_TABS.map(t => (
          <button
            key={t.key}
            className={`leaderboard-tab${activeTab === t.key ? " is-active" : ""}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
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
                const tier    = getRank(row.points);
                const isMe    = user?.id === row.user_id;
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
