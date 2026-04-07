"use client";
import { useEffect, useRef, useState } from "react";
import { usePrivateLobby } from "@/hooks/usePrivateLobby";
import type { GameReadyPayload } from "@/hooks/usePrivateLobby";

const STORAGE_KEY = "minijeu_player_name";

type Step =
  | "name"        // Enter name + choose Quick Match or With Friends
  | "lobby_entry" // Create or Join a room
  | "lobby";      // Waiting room (show code + players)

interface Props {
  gameType: string;
  host: string;
  onQuickMatch: (name: string) => void;
  onLobbyStart: (payload: GameReadyPayload, myName: string) => void;
  onCancel: () => void;
}

export default function MultiplayerEntryModal({
  gameType, host, onQuickMatch, onLobbyStart, onCancel,
}: Props) {
  const [step,      setStep]      = useState<Step>("name");
  const [name,      setName]      = useState("");
  const [joinCode,  setJoinCode]  = useState("");
  const [copied,    setCopied]    = useState(false);
  const [inputErr,  setInputErr]  = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const codeRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setName(saved);
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const saveName = () => {
    const trimmed = name.trim() || "Anonymous";
    localStorage.setItem(STORAGE_KEY, trimmed);
    return trimmed;
  };

  // ── Lobby integration ──────────────────────────────────────────────────────
  const lobby = usePrivateLobby({
    host,
    gameType,
    onGameReady: (payload) => {
      onLobbyStart(payload, saveName());
    },
  });

  const handleQuickMatch = () => {
    onQuickMatch(saveName());
  };

  const handleCreateRoom = () => {
    const n = saveName();
    lobby.createRoom(n);
    setStep("lobby");
  };

  const handleJoinRoom = () => {
    if (joinCode.trim().length < 4) {
      setInputErr("Please enter a 4-character room code.");
      codeRef.current?.focus();
      return;
    }
    setInputErr(null);
    lobby.joinRoom(saveName(), joinCode);
    setStep("lobby");
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(lobby.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleLeave = () => {
    lobby.disconnect();
    setStep("name");
  };

  const handleCancel = () => {
    lobby.disconnect();
    onCancel();
  };

  // ── Render steps ───────────────────────────────────────────────────────────

  // ── Step: name + mode selection ───────────────────────────────────────────
  if (step === "name") return (
    <div className="mp-overlay">
      <div className="mp-overlay__card mp-entry">
        <div className="mp-overlay__icon">⚡</div>
        <div className="mp-overlay__title">Multiplayer</div>

        <div className="name-prompt__field">
          <label className="name-prompt__label" htmlFor="mp-name">Your name</label>
          <input
            ref={inputRef}
            id="mp-name"
            className="name-prompt__input"
            type="text"
            maxLength={20}
            placeholder="Anonymous"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleQuickMatch()}
          />
        </div>

        <div className="mp-mode-grid">
          <button className="mp-mode-card" onClick={handleQuickMatch}>
            <div className="mp-mode-card__icon">🔎</div>
            <div className="mp-mode-card__title">Quick Match</div>
            <div className="mp-mode-card__desc">Find a random opponent online</div>
          </button>
          <button className="mp-mode-card mp-mode-card--friends" onClick={() => setStep("lobby_entry")}>
            <div className="mp-mode-card__icon">👥</div>
            <div className="mp-mode-card__title">Play with Friends</div>
            <div className="mp-mode-card__desc">Private room · up to 8 players</div>
          </button>
        </div>

        <button onClick={handleCancel} className="btn-cancel btn-hover" style={{ marginTop: 4 }}>
          Cancel
        </button>
      </div>
    </div>
  );

  // ── Step: create or join ───────────────────────────────────────────────────
  if (step === "lobby_entry") return (
    <div className="mp-overlay">
      <div className="mp-overlay__card mp-entry">
        <button className="mp-back-btn" onClick={() => setStep("name")}>← Back</button>
        <div className="mp-overlay__icon">👥</div>
        <div className="mp-overlay__title">Play with Friends</div>

        <button className="mp-lobby-action-btn" onClick={handleCreateRoom}>
          <span className="mp-lobby-action-btn__icon">➕</span>
          <span>
            <strong>Create a Room</strong>
            <br />
            <small>Get a code and invite friends</small>
          </span>
        </button>

        <div className="mp-divider">— or join an existing room —</div>

        <div className="mp-join-row">
          <input
            ref={codeRef}
            className="name-prompt__input mp-code-input"
            type="text"
            maxLength={4}
            placeholder="ROOM"
            value={joinCode}
            onChange={e => { setJoinCode(e.target.value.toUpperCase()); setInputErr(null); }}
            onKeyDown={e => e.key === "Enter" && handleJoinRoom()}
          />
          <button className="btn-primary btn-hover mp-join-btn" onClick={handleJoinRoom}>
            Join
          </button>
        </div>
        {inputErr && <div className="mp-input-err">{inputErr}</div>}
        {lobby.status === "error" && lobby.error && (
          <div className="mp-input-err">{lobby.error}</div>
        )}

        <button onClick={handleCancel} className="btn-cancel btn-hover">Cancel</button>
      </div>
    </div>
  );

  // ── Step: lobby waiting room ───────────────────────────────────────────────
  return (
    <div className="mp-overlay">
      <div className="mp-overlay__card mp-lobby-card">
        {/* Code display */}
        <div className="mp-lobby-code-wrap">
          <div className="mp-lobby-code-label">Room Code</div>
          <div className="mp-lobby-code">{lobby.code}</div>
          <button
            className={`mp-lobby-copy-btn${copied ? " mp-lobby-copy-btn--copied" : ""}`}
            onClick={handleCopyCode}
          >
            {copied ? "✓ Copied!" : "Copy Code"}
          </button>
          <div className="mp-lobby-code-hint">Share this code with your friends</div>
        </div>

        {/* Player list */}
        <div className="mp-lobby-players">
          <div className="mp-lobby-players__title">
            Players ({lobby.players.length}/8)
          </div>
          <div className="mp-lobby-players__list">
            {lobby.players.map(p => (
              <div key={p.id} className={`mp-lobby-player${p.id === lobby.hostId ? " mp-lobby-player--host" : ""}${p.id === lobby.myId ? " mp-lobby-player--me" : ""}`}>
                <span className="mp-lobby-player__name">{p.name}</span>
                <div className="mp-lobby-player__badges">
                  {p.id === lobby.hostId && <span className="mp-lobby-player__badge mp-lobby-player__badge--host">Host</span>}
                  {p.id === lobby.myId   && <span className="mp-lobby-player__badge mp-lobby-player__badge--you">You</span>}
                </div>
              </div>
            ))}
            {/* Empty slots */}
            {Array.from({ length: Math.max(0, 2 - lobby.players.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="mp-lobby-player mp-lobby-player--empty">
                <span className="mp-lobby-player__name">Waiting for player…</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mp-overlay__actions">
          {lobby.isHost ? (
            <button
              className="btn-primary btn-hover"
              onClick={lobby.startGame}
              disabled={!lobby.canStart}
              style={{ opacity: lobby.canStart ? 1 : 0.45 }}
            >
              {lobby.canStart ? "Start Game" : `Waiting for players… (${lobby.players.length}/2 min)`}
            </button>
          ) : (
            <div className="mp-lobby-waiting">
              <div className="mp-overlay__dots">
                {[0, 1, 2].map(i => (
                  <div key={i} className="mp-overlay__dot" style={{ animation: `twinkle 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
              <span>Waiting for host to start…</span>
            </div>
          )}
          <button onClick={handleLeave} className="btn-cancel btn-hover">
            Leave Room
          </button>
        </div>

        {lobby.status === "error" && lobby.error && (
          <div className="mp-input-err">{lobby.error}</div>
        )}
      </div>
    </div>
  );
}
