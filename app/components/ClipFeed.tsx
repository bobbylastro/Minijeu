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

  // Feed state — managed separately from selectedGames to support append
  const [feedClips, setFeedClips] = useState<Clip[]>(() => shuffle(clips));
  const [feedKey, setFeedKey]     = useState(0); // increment → ClipPlayer remounts (full reset)

  // Game filter state
  const [selectedGames, setSelectedGames] = useState<Set<GameSlug>>(new Set());
  const prevGamesRef = useRef<Set<GameSlug>>(new Set());

  // Update feed when filter changes
  useEffect(() => {
    const prev = prevGamesRef.current;
    const curr = selectedGames;

    if (curr.size === 0) {
      // Cleared → full shuffled feed, remount player
      setFeedClips(shuffle(clips));
      setFeedKey((k) => k + 1);
      prevGamesRef.current = new Set();
      return;
    }

    const added   = GAME_SLUGS.filter((g) => curr.has(g) && !prev.has(g));
    const removed = GAME_SLUGS.filter((g) => !curr.has(g) && prev.has(g));

    if (prev.size === 0) {
      // First filter applied → replace with shuffled selection, remount player
      setFeedClips(shuffle(clips.filter((c) => curr.has(c.game as GameSlug))));
      setFeedKey((k) => k + 1);
    } else {
      setFeedClips((current) => {
        let next = [...current];
        if (removed.length > 0) {
          const removedSet = new Set(removed);
          next = next.filter((c) => !removedSet.has(c.game as GameSlug));
        }
        if (added.length > 0) {
          const addedSet = new Set(added);
          const toAdd = shuffle(clips.filter((c) => addedSet.has(c.game as GameSlug)));
          next = [...next, ...toAdd];
        }
        return next;
      });
      // No feedKey change — player keeps its scroll position
    }

    prevGamesRef.current = new Set(curr);
  }, [selectedGames, clips]);

  const [activeClip, setActiveClip] = useState<Clip | null>(clips[0] ?? null);
  const [likedIds, setLikedIds]     = useState<Set<string>>(new Set());
  const [authOpen, setAuthOpen]     = useState(false);

  const handleToggleGame = useCallback((game: GameSlug) => {
    setSelectedGames((prev) => {
      const next = new Set(prev);
      if (next.has(game)) next.delete(game); else next.add(game);
      trackGameFilter(next.has(game) ? null : game);
      return next;
    });
  }, []);

  const handleClearAll = useCallback(() => {
    setSelectedGames(new Set());
  }, []);

  const handleLikeToggle = useCallback(async (clipId: string) => {
    const clip = feedClips.find((c) => c.id === clipId);
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

  return (
    <div className="cf-layout">
      {/* ── Left: game filters ──────────────────────────────────── */}
      <aside className="cf-games-panel">
        <ClipSidebar
          selected={selectedGames}
          onToggle={handleToggleGame}
          onClearAll={handleClearAll}
        />
      </aside>

      {/* ── Center: TikTok-style scroll feed ────────────────────── */}
      <div className="cf-video-area">
        <ClipPlayer
          key={feedKey}
          clips={feedClips}
          likedClipIds={likedIds}
          onLikeToggle={handleLikeToggle}
          onAuthRequired={() => setAuthOpen(true)}
          isLoggedIn={!!user}
          onActiveClipChange={setActiveClip}
        />
      </div>

      {/* ── Right: comments for the active clip ─────────────────── */}
      <aside className="cf-comments-panel">
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
