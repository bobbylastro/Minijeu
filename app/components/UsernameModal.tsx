"use client";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface UsernameModalProps {
  onClose: () => void;
}

export default function UsernameModal({ onClose }: UsernameModalProps) {
  const { refreshProfile } = useAuth();
  const [username, setUsername] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    if (res.ok) {
      await refreshProfile();
      onClose();
    } else {
      const { error: msg } = await res.json();
      setError(msg ?? "Something went wrong");
    }
    setLoading(false);
  };

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        <h2 className="auth-modal__title">Choose your username</h2>
        <p className="auth-modal__subtitle">This is how other players will see you on the leaderboard.</p>

        <form className="auth-modal__form" onSubmit={handleSubmit}>
          <div className="auth-modal__field">
            <label className="auth-modal__label">Username</label>
            <input
              className="auth-modal__input"
              type="text"
              required
              minLength={2}
              maxLength={20}
              pattern="[a-zA-Z0-9_\-]+"
              title="Letters, numbers, _ and - only"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="CoolPlayer99"
              autoFocus
            />
          </div>

          {error && <div className="auth-modal__error">{error}</div>}

          <button className="btn-primary auth-modal__submit" type="submit" disabled={loading || username.length < 2}>
            {loading ? "Saving…" : "Save username"}
          </button>
        </form>
      </div>
    </div>
  );
}
