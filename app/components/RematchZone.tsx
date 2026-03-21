"use client";
import type { OpponentState, SessionSeries } from "@/hooks/useMultiplayer";
import { getRecord } from "@/lib/matchHistory";

interface Props {
  opponent: OpponentState;
  myWantsRematch: boolean;
  series: SessionSeries;
  onRematch: () => void;
}

export default function RematchZone({ opponent, myWantsRematch, series, onRematch }: Props) {
  const totalGames = series.me + series.opp + series.ties;
  const rec = getRecord(opponent.name);

  return (
    <div className="rematch-zone">
      {/* Session series — shown from the 1st rematch onwards (after ≥1 game) */}
      {totalGames > 0 && (
        <div className="rematch-series">
          <span className="rematch-series__label">Session</span>
          <span className="rematch-series__score">
            <span className="rematch-series__me">{series.me}</span>
            <span className="rematch-series__sep"> – </span>
            <span className="rematch-series__opp">{series.opp}</span>
          </span>
          {series.ties > 0 && (
            <span className="rematch-series__ties">{series.ties} tie{series.ties > 1 ? "s" : ""}</span>
          )}
        </div>
      )}

      {/* All-time record vs this opponent */}
      {rec && (
        <div className="rematch-record">
          Overall vs <span className="rematch-record__name">{opponent.name}</span>:{" "}
          <span className="rematch-record__win">{rec.wins}W</span>{" "}
          <span className="rematch-record__loss">{rec.losses}L</span>{" "}
          <span className="rematch-record__tie">{rec.ties}T</span>
        </div>
      )}

      {/* Opponent wants rematch notice */}
      {opponent.wantsRematch && !myWantsRematch && (
        <div className="rematch-notice">⚡ {opponent.name} wants a rematch!</div>
      )}

      {/* Rematch button / waiting */}
      {myWantsRematch ? (
        <div className="waiting-indicator">
          <span className="waiting-dot" />Waiting for {opponent.name}…
        </div>
      ) : (
        <button onClick={onRematch} className="btn-rematch btn-hover">
          ⚡ Rematch
        </button>
      )}
    </div>
  );
}
