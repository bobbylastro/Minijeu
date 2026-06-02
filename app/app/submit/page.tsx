"use client";
import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { GAMES, GAME_SLUGS } from "@/lib/clips-shared";
import { useAuth } from "@/hooks/useAuth";

const AuthModal = dynamic(() => import("@/components/AuthModal"), { ssr: false });

type State = "idle" | "submitting" | "success" | "error";

const MAX_SIZE_BYTES = 200 * 1024 * 1024; // 200 MB
const ALLOWED_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime", "video/x-matroska", "video/avi"]);
const ALLOWED_EXTS = /\.(mp4|webm|mov|mkv|avi)$/i;

function errMsg(code: string): string {
  const map: Record<string, string> = {
    auth_required:  "You must be signed in to submit a clip.",
    rate_limit:     "You've reached the 2 clips/day limit. Try again tomorrow.",
    invalid_game:   "Please select a valid game.",
    invalid_title:  "Title must be between 3 and 80 characters.",
    invalid_file:   "Unsupported file type. Use MP4, WebM, MOV or MKV.",
    file_too_large: "File exceeds the 200 MB limit.",
    not_configured: "Submissions are temporarily unavailable. Try again later.",
    default:        "Something went wrong. Please try again.",
  };
  return map[code] ?? map.default;
}

export default function SubmitPage() {
  const { user, loading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [game, setGame] = useState("");
  const [handle, setHandle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const pickFile = (f: File) => {
    if (!ALLOWED_TYPES.has(f.type) && !ALLOWED_EXTS.test(f.name)) {
      setError("Unsupported file type. Use MP4, WebM, MOV or MKV.");
      return;
    }
    if (f.size > MAX_SIZE_BYTES) {
      setError("File exceeds the 200 MB limit.");
      return;
    }
    setError("");
    setFile(f);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) pickFile(f);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !game || !title.trim()) return;

    setState("submitting");
    setError("");

    try {
      // Step 1 — validate metadata + get signed upload URL
      const prepareRes = await fetch("/api/clips/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          game,
          submitterName: handle.trim() || null,
          filename: file.name,
          fileType: file.type,
          fileSize: file.size,
          honeypot: (document.getElementById("sub-hp") as HTMLInputElement)?.value ?? "",
        }),
      });

      if (!prepareRes.ok) {
        const { error: code } = await prepareRes.json().catch(() => ({ error: "default" }));
        setError(errMsg(code));
        setState("error");
        return;
      }

      const { submissionId, signedUrl } = await prepareRes.json();

      // Step 2 — upload file directly to Supabase Storage
      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "video/mp4" },
      });

      if (!uploadRes.ok) {
        setError("Upload failed. Please try again.");
        setState("error");
        return;
      }

      // Step 3 — confirm submission
      const confirmRes = await fetch("/api/clips/submit/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId }),
      });

      if (!confirmRes.ok) {
        setError("Could not finalize submission. Please try again.");
        setState("error");
        return;
      }

      setState("success");
    } catch {
      setError("Network error. Please check your connection and try again.");
      setState("error");
    }
  }

  // ── Auth loading ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="submit-page">
        <div className="submit-card">
          <div className="adm-loading">
            <span className="waiting-dot" /><span className="waiting-dot" /><span className="waiting-dot" />
          </div>
        </div>
      </main>
    );
  }

  // ── Not logged in ─────────────────────────────────────────────────────────
  if (!user) {
    return (
      <main className="submit-page">
        <div className="submit-card">
          <div className="submit-card__header">
            <h1 className="submit-card__title">Submit a clip</h1>
            <p className="submit-card__sub">
              You need an account to submit clips.
            </p>
          </div>
          <div className="submit-auth-gate">
            <p className="submit-auth-gate__text">
              Sign in or create a free account to share your best moments with the community.
            </p>
            <button className="btn-primary" onClick={() => setAuthOpen(true)}>
              Sign in / Create account
            </button>
          </div>
        </div>
        {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      </main>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (state === "success") {
    return (
      <main className="submit-page">
        <div className="submit-success">
          <div className="submit-success__icon">🎮</div>
          <h1 className="submit-success__title">Clip received!</h1>
          <p className="submit-success__desc">
            We&apos;ll review it shortly. If it gets approved, it&apos;ll appear in the feed automatically.
          </p>
          <div className="submit-success__actions">
            <button className="btn-primary" onClick={() => { setState("idle"); setFile(null); setTitle(""); setGame(""); setHandle(""); }}>
              Submit another
            </button>
            <Link href="/" className="btn-outline">Back to feed</Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <main className="submit-page">
      <div className="submit-card">
        <div className="submit-card__header">
          <h1 className="submit-card__title">Submit a clip</h1>
          <p className="submit-card__sub">
            Share your best moment. Clips are reviewed before going live.
          </p>
        </div>

        <form className="submit-form" onSubmit={handleSubmit} noValidate>
          {/* Honeypot */}
          <input
            id="sub-hp"
            type="text"
            name="website"
            autoComplete="off"
            tabIndex={-1}
            aria-hidden="true"
            style={{ position: "absolute", left: "-9999px", opacity: 0, pointerEvents: "none" }}
          />

          {/* Game */}
          <div className="submit-field">
            <label className="submit-label" htmlFor="sub-game">Game *</label>
            <select
              id="sub-game"
              className="submit-select"
              value={game}
              onChange={(e) => setGame(e.target.value)}
              required
              disabled={state === "submitting"}
            >
              <option value="">Select a game…</option>
              {GAME_SLUGS.map((slug) => (
                <option key={slug} value={slug}>
                  {GAMES[slug].name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="submit-field">
            <label className="submit-label" htmlFor="sub-title">Clip title *</label>
            <input
              id="sub-title"
              className="submit-input"
              type="text"
              placeholder="e.g. 4K clutch on Haven"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              minLength={3}
              maxLength={80}
              required
              disabled={state === "submitting"}
            />
            <span className="submit-counter">{title.length}/80</span>
          </div>

          {/* Handle */}
          <div className="submit-field">
            <label className="submit-label" htmlFor="sub-handle">
              In-game name <span className="submit-optional">(optional)</span>
            </label>
            <input
              id="sub-handle"
              className="submit-input"
              type="text"
              placeholder="e.g. xXProGamerXx"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              maxLength={50}
              disabled={state === "submitting"}
            />
          </div>

          {/* File */}
          <div className="submit-field">
            <label className="submit-label">Video file *</label>
            <div
              className={`submit-dropzone${dragOver ? " is-over" : ""}${file ? " has-file" : ""}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
            >
              <input
                ref={fileRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/x-matroska,.mp4,.webm,.mov,.mkv,.avi"
                className="submit-file-input"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); }}
                disabled={state === "submitting"}
              />
              {file ? (
                <>
                  <span className="submit-dropzone__icon">🎬</span>
                  <span className="submit-dropzone__name">{file.name}</span>
                  <span className="submit-dropzone__size">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                  <span className="submit-dropzone__change">Click to change</span>
                </>
              ) : (
                <>
                  <span className="submit-dropzone__icon">📁</span>
                  <span className="submit-dropzone__cta">Drop your clip here or click to browse</span>
                  <span className="submit-dropzone__hint">MP4, WebM, MOV, MKV — max 200 MB</span>
                </>
              )}
            </div>
          </div>

          {/* Error */}
          {(error || state === "error") && (
            <p className="submit-error">{error || errMsg("default")}</p>
          )}

          <button
            type="submit"
            className="btn-primary submit-submit"
            disabled={state === "submitting" || !file || !game || title.trim().length < 3}
          >
            {state === "submitting" ? (
              <><span className="submit-spinner" />Uploading…</>
            ) : (
              "Submit clip"
            )}
          </button>

          <p className="submit-fine-print">
            By submitting, you confirm you own the rights to this clip and agree to our{" "}
            <Link href="/terms">Terms of Service</Link>.
            Max 2 submissions per day.
          </p>
        </form>
      </div>
    </main>
  );
}
