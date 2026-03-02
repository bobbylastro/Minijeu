"use client";
import type { OpponentState } from "@/hooks/useMultiplayer";

interface Props {
  opponent: OpponentState;
  myScore: number;
  maxScore: number;
  myName?: string;
}

export default function OpponentBar({ opponent, myScore, maxScore, myName = "You" }: Props) {
  const myPct  = Math.round((myScore / maxScore) * 100);
  const opPct  = Math.round((opponent.score / maxScore) * 100);
  const leading = myScore >= opponent.score;

  return (
    <div className="opponent-bar">
      {/* Me */}
      <div className="opponent-bar__player">
        <div className="opponent-bar__label">{myName}</div>
        <div className={`opponent-bar__score ${leading ? "opponent-bar__score--leading" : "opponent-bar__score--trailing"}`}>
          {myScore.toLocaleString()}
        </div>
      </div>

      {/* Bars */}
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

      {/* Opponent */}
      <div className="opponent-bar__player">
        <div className="opponent-bar__label-row">
          <div className="opponent-bar__label">{opponent.name}</div>
          {opponent.hasAnswered && <div className="opponent-bar__answered-dot" title="Answered" />}
        </div>
        <div className={`opponent-bar__score ${!leading ? "opponent-bar__score--opp-leading" : "opponent-bar__score--opp-trailing"}`}>
          {opponent.score.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
