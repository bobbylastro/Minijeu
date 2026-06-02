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

  // Track all clip IDs ever added to the feed — never re-add them
  const seenIdsRef = useRef<Set<string>>(new Set());

  const [feedClips, setFeedClips] = useState<Clip[]>(() => {
    const initial = shuffle(clips);
    for (const c of initial) seenIdsRef.current.add(c.id);
    return initial;
  });

  const [selectedGames, setSelectedGames] = useState<Set<GameSlug>>(new Set());
  const prevGamesRef   = useRef<Set<GameSlug>>(new Set());
  const [activeClip, setActiveClip] = useState<Clip | null>(clips[0] ?? null);
  const [likedIds,   setLikedIds]   = useState<Set<string>>(new Set());
  const [authOpen,   setAuthOpen]   = useState(false);

  // Update feed when filter changes — never remounts the player
  useEffect(() => {
    const prev = prevGamesRef.current;
    const curr = selectedGames;

    const added   = GAME_SLUGS.filter((g) => curr.has(g) && !prev.has(g));
    const removed = GAME_SLUGS.filter((g) => !curr.has(g) && prev.has(g));

    setFeedClips((current) => {
      let next = [...current];

      // Remove clips of deselected games that are after the active clip
      if (removed.length > 0) {
        const removedSet  = new Set(removed);
        const activeIdx   = activeClip ? next.findIndex((c) => c.id === activeClip.id) : -1;
        next = next.filter((c, i) => {
          if (!removedSet.has(c.game as GameSlug)) return true; // keep other games
          if (i <= activeIdx) return true;                       // keep already-played clips
          return false;
        });
      }

      // Inject unseen clips for newly added games (or clear-all)
      // Shuffle new clips INTO the remaining (unplayed) portion of the feed
      let toAdd: Clip[] = [];
      if (added.length > 0) {
        const addedSet = new Set(added);
        toAdd = clips.filter((c) => addedSet.has(c.game as GameSlug) && !seenIdsRef.current.has(c.id));
      } else if (curr.size === 0 && prev.size > 0) {
        toAdd = clips.filter((c) => !seenIdsRef.current.has(c.id));
      }

      if (toAdd.length > 0) {
        for (const c of toAdd) seenIdsRef.current.add(c.id);
        const activeIdx  = activeClip ? next.findIndex((c) => c.id === activeClip.id) : -1;
        const played     = next.slice(0, activeIdx + 1);
        const remaining  = next.slice(activeIdx + 1);
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
