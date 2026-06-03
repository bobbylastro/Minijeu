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
import { getSeenClipIds, mergeSeenClipIds } from "@/lib/seen-clips";

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

  const [feedClips,    setFeedClips]    = useState<Clip[]>(clips);
  const [selectedGames,setSelectedGames]= useState<Set<GameSlug>>(new Set());
  const [activeClip,   setActiveClip]   = useState<Clip | null>(null);
  const [likedIds,     setLikedIds]     = useState<Set<string>>(new Set());
  const [authOpen,     setAuthOpen]     = useState(false);
  const [gameMenuOpen, setGameMenuOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [feedLoading,  setFeedLoading]  = useState(false);
  const [feedKey,      setFeedKey]      = useState(0);
  const [seenIds,      setSeenIds]      = useState<Set<string>>(() => getSeenClipIds());

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Client-side shuffle after mount (avoids SSR hydration mismatch)
  useEffect(() => {
    setFeedClips(shuffle(clips));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Merge Supabase watch history for logged-in users (cross-device persistence)
  useEffect(() => {
    if (!user) return;
    fetch("/api/clips/seen")
      .then((r) => r.json())
      .then((data: { ids?: string[] }) => {
        if (!data.ids?.length) return;
        mergeSeenClipIds(data.ids);
        setSeenIds((prev) => new Set([...prev, ...data.ids!]));
      })
      .catch(() => {});
  }, [user]);

  // Close overlays when switching layout mode (portrait mobile ↔ other)
  useEffect(() => {
    const isPortraitMobile = () => window.innerWidth <= 768 && window.innerHeight > window.innerWidth;
    let wasPortrait = isPortraitMobile();
    const onResize = () => {
      const nowPortrait = isPortraitMobile();
      if (wasPortrait !== nowPortrait) {
        setGameMenuOpen(false);
        setCommentsOpen(false);
        wasPortrait = nowPortrait;
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Fetch clips for the current game selection and refresh the feed
  const refreshFeed = useCallback(async (games: Set<GameSlug>) => {
    setFeedLoading(true);
    try {
      let fresh: Clip[];
      if (games.size === 0) {
        const res  = await fetch("/api/clips");
        const data = await res.json();
        fresh = shuffle(data.clips ?? []);
      } else {
        const results = await Promise.all(
          Array.from(games).map((g) =>
            fetch(`/api/clips?game=${g}`).then((r) => r.json()).then((d) => d.clips ?? [])
          )
        );
        fresh = shuffle((results.flat() as Clip[]));
      }
      setFeedClips(fresh);
      setFeedKey((k) => k + 1); // remount player at top
    } catch { /* keep existing feed on error */ }
    finally { setFeedLoading(false); }
  }, []);

  const handleToggleGame = useCallback((game: GameSlug) => {
    setSelectedGames((prev) => {
      const next = new Set(prev);
      if (next.has(game)) next.delete(game); else next.add(game);
      trackGameFilter(next.size === 0 ? null : game);

      // Debounce: wait 400ms after last toggle before fetching
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => refreshFeed(next), 400);

      return next;
    });
  }, [refreshFeed]);

  const handleClearAll = useCallback(() => {
    setSelectedGames(new Set());
    if (debounceRef.current) clearTimeout(debounceRef.current);
    refreshFeed(new Set());
  }, [refreshFeed]);

  const handleSelectAll = useCallback(() => {
    const all = new Set(GAME_SLUGS);
    setSelectedGames(all);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    refreshFeed(all);
  }, [refreshFeed]);

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

      {/* Backdrop overlay */}
      <div
        className={`cf-overlay${gameMenuOpen || commentsOpen ? " is-open" : ""}`}
        onClick={closeAll}
      />

      {/* Left: game filters */}
      <aside className={`cf-games-panel${gameMenuOpen ? " is-open" : ""}`}>
        <ClipSidebar
          selected={selectedGames}
          onToggle={handleToggleGame}
          onClearAll={handleClearAll}
          onSelectAll={handleSelectAll}
        />
      </aside>

      {/* Center: video feed */}
      <div className="cf-video-area">
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

        {feedLoading && (
          <div className="cf-feed-loading">
            <span className="cf-feed-loading__spinner" />
          </div>
        )}

        <ClipPlayer
          key={feedKey}
          clips={(() => {
            const unseen = feedClips.filter((c) => !seenIds.has(c.id));
            if (unseen.length > 0) return unseen;
            // All seen → reset, but always exclude liked clips
            return feedClips.filter((c) => !likedIds.has(c.id));
          })()}
          skipSplash={selectedGames.size > 0}
          likedClipIds={likedIds}
          onLikeToggle={handleLikeToggle}
          onAuthRequired={() => setAuthOpen(true)}
          isLoggedIn={!!user}
          onActiveClipChange={setActiveClip}
          onCommentClick={() => setCommentsOpen(true)}
        />
      </div>

      {/* Right: comments */}
      <aside className={`cf-comments-panel${commentsOpen ? " is-open" : ""}`}>
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
