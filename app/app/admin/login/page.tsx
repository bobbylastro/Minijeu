"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const [email, setEmail]   = useState("");
  const [sent,  setSent]    = useState(false);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/admin/clips`,
      },
    });

    setLoading(false);
    if (authError) {
      setError(authError.message);
    } else {
      setSent(true);
    }
  }

  return (
    <main className="submit-page">
      <div className="submit-card">
        <div className="submit-card__header">
          <h1 className="submit-card__title">Admin access</h1>
          <p className="submit-card__sub">
            {sent
              ? "Check your inbox — click the link to sign in."
              : "Enter your email to receive a sign-in link."}
          </p>
        </div>

        {!sent && (
          <form className="submit-form" onSubmit={handleSubmit} noValidate>
            <div className="submit-field">
              <label className="submit-label" htmlFor="admin-email">Email</label>
              <input
                id="admin-email"
                className="submit-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={loading}
                autoFocus
              />
            </div>

            {error && <p className="submit-error">{error}</p>}

            <button
              type="submit"
              className="btn-primary submit-submit"
              disabled={loading || !email}
            >
              {loading ? <><span className="submit-spinner" />Sending…</> : "Send magic link"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
