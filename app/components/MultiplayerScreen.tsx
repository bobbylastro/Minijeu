"use client";
import type { MultiplayerStatus } from "@/hooks/useMultiplayer";

interface Props {
  status: MultiplayerStatus;
  botCountdown?: number | null;
  onCancel: () => void;
  onPlayBot?: () => void;
  onContinueSolo?: () => void;
}

export default function MultiplayerScreen({ status, botCountdown, onCancel, onPlayBot, onContinueSolo }: Props) {
  if (status === "idle" || status === "playing" || status === "finished") return null;

  const content: Record<string, { icon: string; title: string; sub: string }> = {
    connecting:    { icon: "🔌", title: "Connecting…",          sub: "Connecting to server…"       },
    waiting:       { icon: "⏳", title: "Finding an opponent",   sub: "Waiting for another player…" },
    matched:       { icon: "⚡", title: "Opponent found!",       sub: "Game is starting…"           },
    opponent_left: { icon: "😢", title: "Opponent disconnected", sub: "Your opponent left the game." },
  };

  const { icon, title, sub } = content[status] ?? content.connecting;

  const showBotCountdown = status === "waiting" && botCountdown !== null && botCountdown !== undefined;

  return (
    <div className="mp-overlay">
      <div className="mp-overlay__card">
        <div className="mp-overlay__icon">{icon}</div>
        <div className="mp-overlay__title">{title}</div>
        <div className="mp-overlay__sub">
          {showBotCountdown
            ? `No opponent found. A bot will join in ${botCountdown}s…`
            : sub}
        </div>

        {status === "waiting" && (
          <div className="mp-overlay__dots">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="mp-overlay__dot"
                style={{ animation: `twinkle 1.2s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
        )}

        {showBotCountdown && onPlayBot && (
          <button onClick={onPlayBot} className="btn-primary btn-hover" style={{ marginTop: 8 }}>
            Play vs Bot now
          </button>
        )}

        {status === "opponent_left" ? (
          <div className="mp-overlay__actions">
            {onContinueSolo && (
              <button onClick={onContinueSolo} className="btn-primary btn-hover">
                Continue Solo
              </button>
            )}
            <button onClick={onCancel} className="btn-cancel btn-hover">
              Back to Menu
            </button>
          </div>
        ) : (status === "waiting" || status === "connecting") ? (
          <button onClick={onCancel} className="btn-cancel btn-hover">
            Cancel
          </button>
        ) : null}
      </div>
    </div>
  );
}
