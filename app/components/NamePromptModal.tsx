"use client";
import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "minijeu_player_name";

interface Props {
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export default function NamePromptModal({ onConfirm, onCancel }: Props) {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Load saved name on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setName(saved);
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleConfirm = () => {
    const trimmed = name.trim() || "Anonymous";
    localStorage.setItem(STORAGE_KEY, trimmed);
    onConfirm(trimmed);
  };

  return (
    <div className="mp-overlay">
      <div className="mp-overlay__card name-prompt">
        <div className="mp-overlay__icon">⚡</div>
        <div className="mp-overlay__title">Play Multiplayer</div>
        <div className="mp-overlay__sub">Your name will be visible to your opponent</div>

        <div className="name-prompt__field">
          <label className="name-prompt__label" htmlFor="player-name">Your name</label>
          <input
            ref={inputRef}
            id="player-name"
            className="name-prompt__input"
            type="text"
            maxLength={20}
            placeholder="Anonymous"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleConfirm()}
          />
        </div>

        <div className="mp-overlay__actions">
          <button onClick={handleConfirm} className="btn-primary btn-hover">
            Find a Match
          </button>
          <button onClick={onCancel} className="btn-cancel btn-hover">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
