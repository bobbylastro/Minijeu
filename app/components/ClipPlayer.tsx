"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import type { Clip } from "@/lib/clips-shared";
import { GAMES } from "@/lib/clips-shared";
import { sendWatchEvent } from "@/lib/watch";
import { trackClipView, trackClipShare } from "@/lib/analytics";

interface Props {
  clips: Clip[];
  likedClipIds: Set<string>;
  onLikeToggle: (clipId: string) => void;
  onAuthRequired: () => void;
  isLoggedIn: boolean;
  onActiveClipChange: (clip: Clip | null) => void;
}

export default function ClipPlayer({
  clips,
  likedClipIds,
  onLikeToggle,
  onAuthRequired,
  isLoggedIn,
  onActiveClipChange,
}: Props) {
  const scrollRef          = useRef<HTMLDivElement>(null);
  const videoRefs          = useRef<Map<string, HTMLVideoElement>>(new Map());
  const progressRefs       = useRef<Map<string, HTMLDivElement>>(new Map());
  const activeIdRef        = useRef<string | null>(null);
  const playStartRef       = useRef<Map<string, number>>(new Map()); // clipId → play start timestamp
  const autoScrollRef      = useRef(true);
  const autoScrollDoneRef  = useRef<Set<string>>(new Set());
  const autoScrollCountRef = useRef(0); // consecutive auto-scrolls, resets on user interaction

  const [activeId,    setActiveId]    = useState<string | null>(clips[0]?.id ?? null);
  const [muted,       setMuted]       = useState(true);
  const [toastId,     setToastId]     = useState<string | null>(null);
  const [autoScroll,  setAutoScrollUI] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const v = localStorage.getItem("up_autoscroll");
    return v === null ? true : v === "true";
  });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs in sync for stable event listeners
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  const resetAutoScrollCount = useCallback(() => {
    autoScrollCountRef.current = 0;
  }, []);

  const toggleAutoScroll = useCallback(() => {
    const next = !autoScrollRef.current;
    autoScrollRef.current = next;
    autoScrollDoneRef.current.clear();
    autoScrollCountRef.current = 0;
    localStorage.setItem("up_autoscroll", String(next));
    setAutoScrollUI(next);
  }, []);

  // ── Looping peek ─────────────────────────────────────────────────────────
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let stopped = false;
    let isPeeking = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const onUserScroll = () => {
      if (isPeeking) return;
      stopped = true;
      timers.forEach(clearTimeout);
      container.style.scrollSnapType = "";
      container.removeEventListener("scroll", onUserScroll);
    };
    container.addEventListener("scroll", onUserScroll);

    const runPeek = () => {
      if (stopped) return;
      isPeeking = true;
      container.style.scrollSnapType = "none";
      container.scrollTo({ top: Math.round(container.clientHeight * 0.5), behavior: "smooth" });

      timers.push(setTimeout(() => {
        if (stopped) { container.style.scrollSnapType = ""; isPeeking = false; return; }
        container.scrollTo({ top: 0, behavior: "smooth" });
        timers.push(setTimeout(() => {
          isPeeking = false;
          if (stopped) { container.style.scrollSnapType = ""; return; }
          container.style.scrollSnapType = "";
          timers.push(setTimeout(runPeek, 2000));
        }, 800));
      }, 1500));
    };

    timers.push(setTimeout(runPeek, 1000));

    return () => {
      stopped = true;
      timers.forEach(clearTimeout);
      container.style.scrollSnapType = "";
      container.removeEventListener("scroll", onUserScroll);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── IntersectionObserver: autoplay + active tracking ─────────────────────
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.clipId;
          if (!id) continue;

          if (id === "__splash__") {
            if (entry.isIntersecting) setActiveId("__splash__");
            continue;
          }

          const video = videoRefs.current.get(id);
          if (entry.isIntersecting) {
            playStartRef.current.set(id, Date.now());
            autoScrollDoneRef.current.delete(id);
            video?.play().catch(() => {});
            setActiveId(id);
            const clip = clips.find((c) => c.id === id);
            if (clip) trackClipView(id, clip.game);
          } else {
            // Record watch time before pausing
            const startTs = playStartRef.current.get(id);
            if (startTs) {
              const watchedSec = (Date.now() - startTs) / 1000;
              const ratio = video?.duration ? Math.min(watchedSec / video.duration, 1) : 0;
              playStartRef.current.delete(id);
              sendWatchEvent(id, watchedSec, ratio);
            }
            if (video) { video.pause(); video.currentTime = 0; }
          }
        }
      },
      { root: container, threshold: 0.7 }
    );

    container.querySelectorAll("[data-clip-id]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [clips]);

  // ── Navigate between clips (used by keyboard + auto-scroll) ─────────────
  const navigateClip = useCallback((dir: 1 | -1) => {
    const container = scrollRef.current;
    if (!container) return;
    const items = Array.from(container.querySelectorAll<HTMLElement>("[data-clip-id]"));
    const cur   = activeIdRef.current ?? "__splash__";
    const idx   = items.findIndex((el) => el.dataset.clipId === cur);
    // If not found (stale ref), default to splash (0) so ArrowDown goes to clip 1
    const from  = idx === -1 ? 0 : idx;
    const next  = items[from + dir];
    if (next) next.scrollIntoView({ behavior: "smooth" });
  }, []);

  // ── Progress bars + auto-scroll on timeupdate ────────────────────────────
  useEffect(() => {
    const cleanups: (() => void)[] = [];

    for (const [id, video] of videoRefs.current) {
      const handler = () => {
        // Progress bar
        const bar = progressRefs.current.get(id);
        if (bar && video.duration) {
          bar.style.width = `${(video.currentTime / video.duration) * 100}%`;
        }
        // Auto-scroll: fire when ≤0.4s remain, once per play
        if (
          autoScrollRef.current &&
          video.duration &&
          video.duration - video.currentTime <= 0.4 &&
          !autoScrollDoneRef.current.has(id)
        ) {
          autoScrollDoneRef.current.add(id);
          autoScrollCountRef.current += 1;
          if (autoScrollCountRef.current >= 10) {
            // Pause instead of navigating — resumes when user interacts
            video.pause();
          } else {
            navigateClip(1);
          }
        }
      };
      video.addEventListener("timeupdate", handler);
      cleanups.push(() => video.removeEventListener("timeupdate", handler));
    }

    return () => cleanups.forEach((fn) => fn());
  }, [clips, navigateClip]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === " ") {
        e.preventDefault();
        resetAutoScrollCount();
        const video = videoRefs.current.get(activeIdRef.current ?? "");
        if (video) { if (video.paused) { video.play().catch(() => {}); } else { video.pause(); } }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        resetAutoScrollCount();
        navigateClip(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        resetAutoScrollCount();
        navigateClip(-1);
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [navigateClip, resetAutoScrollCount]);

  // ── Sync muted ────────────────────────────────────────────────────────────
  useEffect(() => {
    videoRefs.current.forEach((v) => { v.muted = muted; });
  }, [muted]);

  // ── Reset + notify parent ─────────────────────────────────────────────────
  // activeId resets happen via feedKey (ClipPlayer remounts) — no effect needed here

  useEffect(() => {
    if (activeId === "__splash__") { onActiveClipChange?.(null); return; }
    onActiveClipChange?.(clips.find((c) => c.id === activeId) ?? null);
  }, [activeId, clips, onActiveClipChange]);

  // ── Share ─────────────────────────────────────────────────────────────────
  const handleShare = useCallback((clipId: string) => {
    resetAutoScrollCount();
    const url = `${window.location.origin}/?clip=${clipId}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setToastId(clipId);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastId(null), 2000);
    const clip = clips.find((c) => c.id === clipId);
    trackClipShare(clipId, clip?.game ?? "unknown");
  }, [clips, resetAutoScrollCount]);

  const handleLike = useCallback(
    (clipId: string) => {
      resetAutoScrollCount();
      if (!isLoggedIn) { onAuthRequired(); return; }
      onLikeToggle(clipId);
    },
    [isLoggedIn, onAuthRequired, onLikeToggle, resetAutoScrollCount]
  );

  const togglePlay = (id: string) => {
    resetAutoScrollCount();
    const v = videoRefs.current.get(id);
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); } else { v.pause(); }
  };

  if (clips.length === 0) {
    return <div className="cp-empty">No clips available yet. Check back soon!</div>;
  }

  return (
    <>
      {/* Auto-scroll toggle */}
      <button
        className={`cp-autoscroll-btn${autoScroll ? " is-on" : ""}`}
        onClick={toggleAutoScroll}
        aria-label={autoScroll ? "Disable auto-scroll" : "Enable auto-scroll"}
        title={autoScroll ? "Auto-scroll ON" : "Auto-scroll OFF"}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 4 15 12 5 20 5 4" />
          <line x1="19" y1="5" x2="19" y2="19" />
        </svg>
        <span className="cp-autoscroll-label">{autoScroll ? "Auto" : "Auto"}</span>
      </button>

      {/* Mute/unmute */}
      <button
        className="cp-mute-btn"
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? "Unmute" : "Mute"}
      >
        {muted ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        )}
      </button>

      <div className="cp-scroll-feed" ref={scrollRef}>
        {/* ── Splash intro slide ───────────────────────────────── */}
        <div className="cp-feed-item cp-splash" data-clip-id="__splash__">
          <div className="cp-splash__orb cp-splash__orb--a" />
          <div className="cp-splash__orb cp-splash__orb--b" />
          <div className="cp-splash__orb cp-splash__orb--c" />

          <div className="cp-splash__content">
            <p className="cp-splash__eyebrow">Ultimate Playground</p>
            <h2 className="cp-splash__headline">
              The best gaming clips,<br />curated for you
            </h2>
            <p className="cp-splash__sub">
              Valorant · Apex · Marvel Rivals · The Finals · Rocket League · R6
            </p>
            <div className="cp-splash__shortcuts">
              <span className="cp-splash__shortcut"><kbd>Space</kbd> Play / Pause</span>
              <span className="cp-splash__shortcut"><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
            </div>
          </div>

          <div className="cp-splash__bottom-fade">
            <div className="cp-scroll-mouse">
              <div className="cp-scroll-mouse__wheel" />
            </div>
            <span className="cp-splash__scroll-cta">Scroll down</span>
          </div>
        </div>

        {/* ── Clip items ───────────────────────────────────────── */}
        {clips.map((clip) => {
          const game  = GAMES[clip.game];
          const liked = likedClipIds.has(clip.id);

          return (
            <div key={clip.id} className="cp-feed-item" data-clip-id={clip.id}>
              <video
                ref={(el) => {
                  if (el) { videoRefs.current.set(clip.id, el); el.muted = muted; }
                  else videoRefs.current.delete(clip.id);
                }}
                className="cp-feed-video"
                loop
                playsInline
                preload="metadata"
                poster={clip.thumbnailUrl ?? undefined}
                onClick={() => togglePlay(clip.id)}
              >
                <source src={clip.videoUrl} />
              </video>

              {/* Progress bar */}
              <div className="cp-progress-track">
                <div
                  className="cp-progress-fill"
                  ref={(el) => {
                    if (el) progressRefs.current.set(clip.id, el);
                    else progressRefs.current.delete(clip.id);
                  }}
                />
              </div>

              {/* Game badge */}
              <span
                className="cp-feed-badge"
                style={{ background: game.color, color: game.textColor }}
              >
                {game.name}
              </span>

              {/* Bottom-left: title */}
              <div className="cp-feed-bottom">
                <p className="cp-feed-title">{clip.title}</p>
              </div>

              {/* Right column: like + share */}
              <div className="cp-feed-actions">
                <button
                  className={`cp-feed-like${liked ? " is-liked" : ""}`}
                  onClick={() => handleLike(clip.id)}
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  <span>{clip.likesCount + (liked ? 1 : 0)}</span>
                </button>

                <div className="cp-share-wrap">
                  {toastId === clip.id && (
                    <span className="cp-share-toast">✓ Copied!</span>
                  )}
                  <button
                    className="cp-feed-share"
                    onClick={() => handleShare(clip.id)}
                    aria-label="Copy link"
                  >
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
