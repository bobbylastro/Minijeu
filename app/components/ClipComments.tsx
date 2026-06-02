"use client";
import { useState, useEffect, useRef } from "react";
import type { Comment } from "@/lib/clips-shared";
import { trackCommentPost, trackCommentLike } from "@/lib/analytics";

interface Props {
  clipId: string;
  isLoggedIn: boolean;
  onAuthRequired: () => void;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ClipComments({ clipId, isLoggedIn, onAuthRequired }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [text,     setText]     = useState("");
  const [posting,  setPosting]  = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/clips/${clipId}/comments`)
      .then((r) => r.json())
      .then(({ comments: c }) => setComments(c ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [clipId]);

  const submit = async () => {
    if (!isLoggedIn) { onAuthRequired(); return; }
    if (!text.trim() || posting) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/clips/${clipId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text.trim() }),
      });
      if (res.ok) {
        const { comment } = await res.json();
        setComments((prev) => [...prev, comment]);
        setText("");
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        trackCommentPost(clipId, "");
      }
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (commentId: string) => {
    if (!isLoggedIn) { onAuthRequired(); return; }
    // Optimistic update
    const comment = comments.find((c) => c.id === commentId);
    const wasLiked = comment?.userHasLiked ?? false;
    setComments((prev) => prev.map((c) =>
      c.id !== commentId ? c : {
        ...c,
        userHasLiked: !c.userHasLiked,
        likesCount: c.userHasLiked ? c.likesCount - 1 : c.likesCount + 1,
      }
    ));
    trackCommentLike(commentId, !wasLiked);
    try {
      await fetch(`/api/comments/${commentId}/like`, { method: "POST" });
    } catch {
      // Revert on error
      setComments((prev) => prev.map((c) =>
        c.id !== commentId ? c : {
          ...c,
          userHasLiked: !c.userHasLiked,
          likesCount: c.userHasLiked ? c.likesCount - 1 : c.likesCount + 1,
        }
      ));
    }
  };

  return (
    <section className="cc-wrap">
      <h3 className="cc-title">Comments {!loading && <span>({comments.length})</span>}</h3>

      <div className="cc-list">
        {loading ? (
          <p className="cc-loading">Loading…</p>
        ) : comments.length === 0 ? (
          <p className="cc-empty">No comments yet. Be the first!</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="cc-comment">
              <div className="cc-comment__header">
                <span className="cc-comment__user">{c.username}</span>
                <span className="cc-comment__time">{timeAgo(c.createdAt)}</span>
              </div>
              <p className="cc-comment__body">{c.body}</p>
              <div className="cc-comment__footer">
                <button
                  className={`cc-like-btn${c.userHasLiked ? " is-liked" : ""}`}
                  onClick={() => toggleLike(c.id)}
                  aria-label={c.userHasLiked ? "Unlike comment" : "Like comment"}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill={c.userHasLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  {c.likesCount > 0 && <span>{c.likesCount}</span>}
                </button>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="cc-form">
        <textarea
          className="cc-form__input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isLoggedIn ? "Add a comment…" : "Sign in to comment"}
          maxLength={500}
          rows={2}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
          }}
          onClick={() => { if (!isLoggedIn) onAuthRequired(); }}
          readOnly={!isLoggedIn}
        />
        <button
          className="cc-form__submit"
          onClick={submit}
          disabled={posting || !text.trim()}
        >
          {posting ? "…" : "Post"}
        </button>
      </div>
    </section>
  );
}
