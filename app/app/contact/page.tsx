"use client";
import { useState } from "react";
import type { Metadata } from "next";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to send");
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again or email us directly.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page">
      <div className="contact-card">

        {sent ? (
          <div className="contact-success">
            <div className="contact-success__icon">✉️</div>
            <h2 className="contact-success__title">Message sent!</h2>
            <p className="contact-success__body">
              Thanks for reaching out. We'll get back to you as soon as possible.
            </p>
            <button className="btn-outline" onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}>
              Send another message
            </button>
          </div>
        ) : (
          <>
            <div className="contact-card__header">
              <h1 className="contact-card__title">Contact us</h1>
              <p className="contact-card__subtitle">A question, a suggestion, a bug? We're listening.</p>
            </div>

            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="contact-form__row">
                <div className="contact-form__field">
                  <label className="contact-form__label">Name</label>
                  <input
                    className="contact-form__input"
                    type="text"
                    name="name"
                    required
                    placeholder="Your name"
                    value={form.name}
                    onChange={handleChange}
                  />
                </div>
                <div className="contact-form__field">
                  <label className="contact-form__label">Email</label>
                  <input
                    className="contact-form__input"
                    type="email"
                    name="email"
                    required
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="contact-form__field">
                <label className="contact-form__label">Subject</label>
                <select
                  className="contact-form__input contact-form__select"
                  name="subject"
                  required
                  value={form.subject}
                  onChange={handleChange}
                >
                  <option value="" disabled>Choose a topic…</option>
                  <option value="bug">🐛 Bug report</option>
                  <option value="suggestion">💡 Suggestion</option>
                  <option value="question">❓ Question</option>
                  <option value="partnership">🤝 Partnership</option>
                  <option value="other">💬 Other</option>
                </select>
              </div>

              <div className="contact-form__field">
                <label className="contact-form__label">Message</label>
                <textarea
                  className="contact-form__input contact-form__textarea"
                  name="message"
                  required
                  placeholder="Tell us more…"
                  rows={5}
                  value={form.message}
                  onChange={handleChange}
                />
              </div>

              {error && (
                <p style={{ color: "#ff6b6b", fontSize: "13px", marginBottom: "8px" }}>{error}</p>
              )}
              <button className="btn-primary contact-form__submit" type="submit" disabled={loading}>
                {loading ? "Sending…" : "Send message"}
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  );
}
