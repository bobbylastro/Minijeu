"use client";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [tab, setTab]         = useState<"login" | "signup">("login");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fn = tab === "login" ? signIn : signUp;
    const err = await fn(email, password);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      if (tab === "signup") {
        setSuccess(true);
      } else {
        onClose();
      }
    }
  };

  const handleGoogle = async () => {
    setError(null);
    const err = await signInWithGoogle();
    if (err) setError(err);
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <button className="auth-modal__close" onClick={onClose} aria-label="Close">×</button>

        {success ? (
          <div className="auth-modal__success">
            <div className="auth-modal__success-icon">✉️</div>
            <h2>Check your email</h2>
            <p>We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</p>
            <button className="btn-primary" onClick={onClose}>Got it</button>
          </div>
        ) : (
          <>
            <div className="auth-modal__tabs">
              <button
                className={`auth-modal__tab${tab === "login" ? " is-active" : ""}`}
                onClick={() => { setTab("login"); setError(null); }}
              >
                Sign in
              </button>
              <button
                className={`auth-modal__tab${tab === "signup" ? " is-active" : ""}`}
                onClick={() => { setTab("signup"); setError(null); }}
              >
                Sign up
              </button>
            </div>

            <form className="auth-modal__form" onSubmit={handleSubmit}>
              <div className="auth-modal__field">
                <label className="auth-modal__label">Email</label>
                <input
                  className="auth-modal__input"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="auth-modal__field">
                <label className="auth-modal__label">Password</label>
                <input
                  className="auth-modal__input"
                  type="password"
                  required
                  autoComplete={tab === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>

              {error && <div className="auth-modal__error">{error}</div>}

              <button className="btn-primary auth-modal__submit" type="submit" disabled={loading}>
                {loading ? "Please wait…" : tab === "login" ? "Sign in" : "Create account"}
              </button>
            </form>

            <div className="auth-modal__divider"><span>or</span></div>

            <button className="auth-modal__google" onClick={handleGoogle} disabled={loading}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </>
        )}
      </div>
    </div>
  );
}
