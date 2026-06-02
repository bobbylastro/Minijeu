"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import type { Clip, GameSlug } from "@/lib/clips-shared";
import { GAME_SLUGS } from "@/lib/clips-shared";
import ClipPlayer from "@/components/ClipPlayer";
import ClipSidebar from "@/components/ClipSidebar";
import ClipComments from "@/components/ClipComments";
import { useAuth } from "@/hooks/useAuth";
import { trackClipLike, trackGameFilter } from "@/lib/analytics";

const AuthModal = dynamic(() => import("@/components/AuthModal"), { ssr: false });

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Props {
  clips: Clip[];
}

export default function ClipFeed({ clips }: Props) {
  const { user } = useAuth();

  const seenIdsRef = useRef<Set<string>>(new Set());

  const [feedClips, setFeedClips] = useState<Clip[]>(() => {
    const initial = shuffle(clips);
    for (const c of initial) seenIdsRef.current.add(c.id);
    return initial;
  });

  const [selectedGames, setSelectedGames] = useState<Set<GameSlug>>(new Set());
  const prevGamesRef   = useRef<Set<GameSlug>>(new Set());
  const [activeClip,   setActiveClip]   = useState<Clip | null>(clips[0] ?? null);
  const [likedIds,     setLikedIds]     = useState<Set<string>>(new Set());
  const [authOpen,     setAuthOpen]     = useState(false);
  const [gameMenuOpen, setGameMenuOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);

  // Close panels on desktop resize
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768) {
        setGameMenuOpen(false);
        setCommentsOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Update feed when filter changes — never remounts the player
  useEffect(() => {
    const prev = prevGamesRef.current;
    const curr = selectedGames;

    const added   = GAME_SLUGS.filter((g) => curr.has(g) && !prev.has(g));
    const removed = GAME_SLUGS.filter((g) => !curr.has(g) && prev.has(g));

    setFeedClips((current) => {
      let next = [...current];

      if (removed.length > 0) {
        const removedSet = new Set(removed);
        const activeIdx  = activeClip ? next.findIndex((c) => c.id === activeClip.id) : -1;
        next = next.filter((c, i) => {
          if (!removedSet.has(c.game as GameSlug)) return true;
          if (i <= activeIdx) return true;
          return false;
        });
      }

      let toAdd: Clip[] = [];
      if (added.length > 0) {
        const addedSet = new Set(added);
        toAdd = clips.filter((c) => addedSet.has(c.game as GameSlug) && !seenIdsRef.current.has(c.id));
      } else if (curr.size === 0 && prev.size > 0) {
        toAdd = clips.filter((c) => !seenIdsRef.current.has(c.id));
      }

      if (toAdd.length > 0) {
        for (const c of toAdd) seenIdsRef.current.add(c.id);
        const activeIdx = activeClip ? next.findIndex((c) => c.id === activeClip.id) : -1;
        const played    = next.slice(0, activeIdx + 1);
        const remaining = next.slice(activeIdx + 1);
        next = [...played, ...shuffle([...remaining, ...toAdd])];
      }

      return next;
    });

    prevGamesRef.current = new Set(curr);
  }, [selectedGames, clips, activeClip]);

  const handleToggleGame = useCallback((game: GameSlug) => {
    setSelectedGames((prev) => {
      const next = new Set(prev);
      if (next.has(game)) next.delete(game); else next.add(game);
      trackGameFilter(next.size === 0 ? null : game);
      return next;
    });
  }, []);

  const handleClearAll = useCallback(() => {
    setSelectedGames(new Set());
  }, []);

  const handleLikeToggle = useCallback(async (clipId: string) => {
    const clip     = feedClips.find((c) => c.id === clipId);
    const wasLiked = likedIds.has(clipId);
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(clipId)) next.delete(clipId); else next.add(clipId);
      return next;
    });
    trackClipLike(clipId, clip?.game ?? "unknown", !wasLiked);
    try {
      await fetch(`/api/clips/${clipId}/like`, { method: "POST" });
    } catch {
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (next.has(clipId)) next.delete(clipId); else next.add(clipId);
        return next;
      });
    }
  }, [feedClips, likedIds]);

  const closeAll = useCallback(() => {
    setGameMenuOpen(false);
    setCommentsOpen(false);
  }, []);

  return (
    <div className="cf-layout">

      {/* ── Backdrop overlay (mobile) ───────────────────────────── */}
      <div
        className={`cf-overlay${gameMenuOpen || commentsOpen ? " is-open" : ""}`}
        onClick={closeAll}
      />

      {/* ── Left: game filters ──────────────────────────────────── */}
      <aside className={`cf-games-panel${gameMenuOpen ? " is-open" : ""}`}>
        <ClipSidebar
          selected={selectedGames}
          onToggle={handleToggleGame}
          onClearAll={handleClearAll}
        />
      </aside>

      {/* ── Center: TikTok-style scroll feed ────────────────────── */}
      <div className="cf-video-area">

        {/* Burger button — mobile only */}
        <button
          className="cf-burger-btn"
          onClick={() => setGameMenuOpen((v) => !v)}
          aria-label="Game filters"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="6"  x2="21" y2="6"  />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <ClipPlayer
          clips={feedClips}
          likedClipIds={likedIds}
          onLikeToggle={handleLikeToggle}
          onAuthRequired={() => setAuthOpen(true)}
          isLoggedIn={!!user}
          onActiveClipChange={setActiveClip}
          onCommentClick={() => setCommentsOpen(true)}
        />
      </div>

      {/* ── Right: comments ─────────────────────────────────────── */}
      <aside className={`cf-comments-panel${commentsOpen ? " is-open" : ""}`}>
        {/* Mobile handle + close */}
        <div className="cf-sheet-handle" />
        <div className="cf-sheet-header">
          <span className="cf-sheet-header__title">Comments</span>
          <button className="cf-sheet-close" onClick={() => setCommentsOpen(false)} aria-label="Close">×</button>
        </div>

        {activeClip ? (
          <ClipComments
            clipId={activeClip.id}
            isLoggedIn={!!user}
            onAuthRequired={() => setAuthOpen(true)}
          />
        ) : (
          <p className="cf-sidebar-empty">Scroll to a clip to see comments.</p>
        )}
      </aside>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </div>
  );
}
