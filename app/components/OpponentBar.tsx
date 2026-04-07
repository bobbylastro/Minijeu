"use client";
import type { OpponentState } from "@/hooks/useMultiplayer";

interface Props {
  opponents: OpponentState[];
  myScore: number;
  maxScore: number;
  myName?: string;
}

// ── 1v1 view ──────────────────────────────────────────────────────────────────
function DuelBar({ opp, myScore, maxScore, myName }: {
  opp: OpponentState; myScore: number; maxScore: number; myName: string;
}) {
  const myPct  = Math.round((myScore   / maxScore) * 100);
  const opPct  = Math.round((opp.score / maxScore) * 100);
  const leading = myScore >= opp.score;

  return (
    <div className="opponent-bar">
      <div className="opponent-bar__player">
        <div className="opponent-bar__label">{myName}</div>
        <div className={`opponent-bar__score ${leading ? "opponent-bar__score--leading" : "opponent-bar__score--trailing"}`}>
          {myScore.toLocaleString()}
        </div>
      </div>

      <div className="opponent-bar__bars">
        <div className="opponent-bar__track">
          <div
            className={`opponent-bar__fill ${leading ? "opponent-bar__fill--lead-me" : "opponent-bar__fill--trail-me"}`}
            style={{ width: `${myPct}%` }}
          />
        </div>
        <div className="opponent-bar__track" style={{ marginTop: 3 }}>
          <div
            className={`opponent-bar__fill ${!leading ? "opponent-bar__fill--lead-opp" : "opponent-bar__fill--trail-opp"}`}
            style={{ width: `${opPct}%` }}
          />
        </div>
      </div>

      <div className="opponent-bar__player">
        <div className="opponent-bar__label-row">
          <div className="opponent-bar__label">{opp.name}</div>
          {opp.hasAnswered && <div className="opponent-bar__answered-dot" title="Answered" />}
        </div>
        <div className={`opponent-bar__score ${!leading ? "opponent-bar__score--opp-leading" : "opponent-bar__score--opp-trailing"}`}>
          {opp.score.toLocaleString()}
        </div>
      </div>
    </div>
  );
}

// ── Multi-player compact view ─────────────────────────────────────────────────
function MultiBar({ opponents, myScore, maxScore, myName }: Required<Props>) {
  // Build sorted list: me + all opponents
  const all = [
    { id: "me", name: myName, score: myScore, hasAnswered: false, isMe: true },
    ...opponents.map(o => ({ ...o, isMe: false })),
  ].sort((a, b) => b.score - a.score);

  return (
    <div className="opponent-bar opponent-bar--multi">
      {all.map((p, i) => {
        const pct = Math.round((p.score / Math.max(maxScore, 1)) * 100);
        return (
          <div key={p.id} className={`obar-row${p.isMe ? " obar-row--me" : ""}`}>
            <div className="obar-row__rank">{i + 1}</div>
            <div className="obar-row__name">
              {p.name}
              {!p.isMe && (p as OpponentState).hasAnswered && (
                <span className="opponent-bar__answered-dot" title="Answered" />
              )}
            </div>
            <div className="obar-row__bar">
              <div
                className={`obar-row__fill${p.isMe ? " obar-row__fill--me" : ""}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="obar-row__score">{p.score.toLocaleString()}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function OpponentBar({ opponents, myScore, maxScore, myName = "You" }: Props) {
  if (opponents.length === 0) return null;

  if (opponents.length === 1) {
    return <DuelBar opp={opponents[0]} myScore={myScore} maxScore={maxScore} myName={myName} />;
  }

  return <MultiBar opponents={opponents} myScore={myScore} maxScore={maxScore} myName={myName} />;
}
