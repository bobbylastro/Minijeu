"use client";
import type { LeaderboardEntry } from "@/hooks/useMultiplayer";

const MEDALS = ["🥇", "🥈", "🥉"];

interface Props {
  leaderboard: LeaderboardEntry[];
  onClose: () => void;
}

export default function LeaderboardOverlay({ leaderboard, onClose }: Props) {
  const maxScore = Math.max(...leaderboard.map(e => e.score), 1);

  return (
    <div className="lb-overlay">
      <div className="lb-card">
        <div className="lb-header">
          <div className="lb-header__icon">🏆</div>
          <div className="lb-header__title">Final Rankings</div>
          <div className="lb-header__sub">{leaderboard.length} players</div>
        </div>

        <div className="lb-list">
          {leaderboard.map((entry, i) => {
            const pct = Math.round((entry.score / maxScore) * 100);
            const medal = MEDALS[entry.rank - 1] ?? null;
            return (
              <div
                key={entry.id}
                className={`lb-row${entry.isMe ? " lb-row--me" : ""}${entry.rank === 1 ? " lb-row--winner" : ""}`}
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="lb-row__rank">
                  {medal ?? <span className="lb-row__rank-num">{entry.rank}</span>}
                </div>
                <div className="lb-row__info">
                  <div className="lb-row__name">
                    {entry.name}
                    {entry.isMe && <span className="lb-row__you-badge">You</span>}
                  </div>
                  <div className="lb-row__bar-wrap">
                    <div className="lb-row__bar">
                      <div
                        className={`lb-row__bar-fill${entry.rank === 1 ? " lb-row__bar-fill--gold" : entry.isMe ? " lb-row__bar-fill--me" : ""}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="lb-row__score">{entry.score.toLocaleString()}</div>
              </div>
            );
          })}
        </div>

        <button className="lb-close-btn btn-primary btn-hover" onClick={onClose}>
          Back to Menu
        </button>
      </div>
    </div>
  );
}
