"use client";
import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import type { Clip } from "@/lib/clips-shared";
import { GAMES } from "@/lib/clips-shared";
import { sendWatchEvent } from "@/lib/watch";
import { trackClipView, trackClipShare } from "@/lib/analytics";
import { markClipSeen } from "@/lib/seen-clips";

interface Props {
  clips: Clip[];
  likedClipIds: Set<string>;
  onLikeToggle: (clipId: string) => void;
  onAuthRequired: () => void;
  isLoggedIn: boolean;
  onActiveClipChange: (clip: Clip | null) => void;
  onCommentClick?: () => void;
  scrollToClipId?: string | null;
  onScrolledToClip?: () => void;
  skipSplash?: boolean;
  onFeedExhausted?: () => void;
}

export default function ClipPlayer({
  clips,
  likedClipIds,
  onLikeToggle,
  onAuthRequired,
  isLoggedIn,
  onActiveClipChange,
  onCommentClick,
  scrollToClipId,
  onScrolledToClip,
  skipSplash,
  onFeedExhausted,
}: Props) {
  const scrollRef          = useRef<HTMLDivElement>(null);
  const splashRef          = useRef<HTMLDivElement>(null);
  const videoRefs          = useRef<Map<string, HTMLVideoElement>>(new Map());
  const isMobile           = typeof window !== "undefined" && window.innerWidth <= 768;
  const bgVideoRefs        = useRef<Map<string, HTMLVideoElement>>(new Map());
  const progressRefs       = useRef<Map<string, HTMLDivElement>>(new Map());
  const activeIdRef        = useRef<string | null>(null);
  const playStartRef       = useRef<Map<string, number>>(new Map()); // clipId → play start timestamp
  const autoScrollRef      = useRef(true);
  const autoScrollDoneRef  = useRef<Set<string>>(new Set());
  const autoScrollCountRef = useRef(0); // consecutive auto-scrolls, resets on user interaction
  const splashPassedRef    = useRef(false);
  const isPeekingRef       = useRef(false);
  const feedExhaustedRef   = useRef(false);

  // Strip reset-cycle suffix so tracking/seen always use the canonical clip ID
  const baseId = (id: string) => id.includes("__r") ? id.slice(0, id.lastIndexOf("__r")) : id;

  const [activeId,    setActiveId]    = useState<string | null>(clips[0]?.id ?? null);
  const [splashPassed, setSplashPassed] = useState(false);
  const [muted,       setMuted]       = useState(false);
  const [toastId,     setToastId]     = useState<string | null>(null);
  const [autoScroll,  setAutoScrollUI] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const v = localStorage.getItem("up_autoscroll");
    return v === null ? true : v === "true";
  });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs in sync for stable event listeners
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  // Reset exhaustion guard when new clips are appended (feed grew)
  const prevClipsLenRef = useRef(clips.length);
  useEffect(() => {
    if (clips.length > prevClipsLenRef.current) feedExhaustedRef.current = false;
    prevClipsLenRef.current = clips.length;
  }, [clips.length]);

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
    if (skipSplash) return; // splash is skipped, no peek needed
    const container = scrollRef.current;
    if (!container) return;

    let stopped = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const stopPeek = () => {
      if (stopped) return;
      stopped = true;
      timers.forEach(clearTimeout);
      container.style.scrollSnapType = "";
      isPeekingRef.current = false;
    };

    // Detect only genuine user input — programmatic scrollTo() won't fire wheel/touch
    const onWheel     = () => stopPeek();
    const onTouch     = () => stopPeek();
    const onKey       = (e: KeyboardEvent) => {
      if (["ArrowDown", "ArrowUp", " "].includes(e.key)) stopPeek();
    };
    container.addEventListener("wheel",      onWheel, { capture: true, passive: true });
    container.addEventListener("touchstart", onTouch, { capture: true, passive: true });
    document.addEventListener("keydown",     onKey,   { capture: true });

    const runPeek = () => {
      if (stopped) return;
      isPeekingRef.current = true;
      container.style.scrollSnapType = "none";
      container.scrollTo({ top: Math.round(container.clientHeight * 0.5), behavior: "smooth" });

      timers.push(setTimeout(() => {
        if (stopped) { container.style.scrollSnapType = ""; isPeekingRef.current = false; return; }
        container.scrollTo({ top: 0, behavior: "smooth" });
        timers.push(setTimeout(() => {
          if (stopped) { container.style.scrollSnapType = ""; isPeekingRef.current = false; return; }
          isPeekingRef.current = false;
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
      isPeekingRef.current = false;
      container.removeEventListener("wheel",      onWheel, { capture: true });
      container.removeEventListener("touchstart", onTouch, { capture: true });
      document.removeEventListener("keydown",     onKey,   { capture: true });
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
            if (entry.isIntersecting) {
              setActiveId("__splash__");
            } else if (!splashPassedRef.current && !isPeekingRef.current) {
              // Only collapse if user actually scrolled (not during peek animation)
              splashPassedRef.current = true;
              setSplashPassed(true);
            }
            continue;
          }

          const video   = videoRefs.current.get(id);
          const bgVideo = bgVideoRefs.current.get(id);
          if (entry.isIntersecting) {
            // Mark as seen immediately (any pixel visible, ratio ≥ 0)
            markClipSeen(baseId(id));

            // Autoplay + tracking only at 70% visibility
            if (entry.intersectionRatio >= 0.7) {
              playStartRef.current.set(id, Date.now());
              autoScrollDoneRef.current.delete(id);
              if (video) {
                video.play().catch(() => {
                  video.muted = true;
                  setMuted(true);
                  video.play().catch(() => {});
                });
              }
              bgVideo?.play().catch(() => {});
              setActiveId(id);
              const clip = clips.find((c) => c.id === id);
              if (clip) trackClipView(baseId(id), clip.game);

              // Trigger silent reset when the last clip in the feed is reached
              if (onFeedExhausted && !feedExhaustedRef.current && id === clips[clips.length - 1]?.id) {
                feedExhaustedRef.current = true;
                onFeedExhausted();
              }

              // Preload the next clip
              const idx = clips.findIndex((c) => c.id === id);
              const next = clips[idx + 1];
              if (next) {
                const nextVideo = videoRefs.current.get(next.id);
                if (nextVideo && nextVideo.preload === "none") nextVideo.preload = "metadata";
              }
            }
          } else {
            // Record watch time before pausing
            const startTs = playStartRef.current.get(id);
            if (startTs) {
              const watchedSec = (Date.now() - startTs) / 1000;
              const ratio = video?.duration ? Math.min(watchedSec / video.duration, 1) : 0;
              playStartRef.current.delete(id);
              sendWatchEvent(baseId(id), watchedSec, ratio);
            }
            if (video) { video.pause(); video.currentTime = 0; }
            if (bgVideo) { bgVideo.pause(); bgVideo.currentTime = 0; }
            // Restore preplay overlay so thumbnail shows again on next scroll-to
            const preplay = container.querySelector<HTMLElement>(`[data-clip-preplay="${id}"]`);
            if (preplay) preplay.style.opacity = "1";
          }
        }
      },
      { root: container, threshold: [0, 0.7] }
    );

    container.querySelectorAll("[data-clip-id]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [clips]);

  // ── Navigate between clips (used by keyboard + auto-scroll) ─────────────
  const navigateClip = useCallback((dir: 1 | -1, fromId?: string) => {
    const container = scrollRef.current;
    if (!container) return;
    const items = Array.from(container.querySelectorAll<HTMLElement>("[data-clip-id]"));
    const cur   = fromId ?? activeIdRef.current ?? "__splash__";
    const idx   = items.findIndex((el) => el.dataset.clipId === cur);
    // If not found (stale ref), default to splash (0) so ArrowDown goes to clip 1
    const from  = idx === -1 ? 0 : idx;
    const next  = items[from + dir];
    // offsetTop is relative to offsetParent (not the scroll container), so use
    // getBoundingClientRect to get the true position within the container.
    if (next) {
      const top = next.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
      container.scrollTo({ top, behavior: "smooth" });
    }
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
            video.pause();
          } else {
            const c = scrollRef.current;
            if (c) {
              // If the splash is still in the DOM at full height, collapse it now
              // before starting the smooth scroll. Without this, the CSS smooth-scroll
              // animation races with the splash-collapse useLayoutEffect: that effect
              // reads the stale mid-animation scrollTop and resets us back to clip 1.
              // By collapsing first (instant, invisible to the user), the smooth scroll
              // then runs uncontested from the correct base position.
              const splash = splashRef.current;
              if (splash && splash.offsetHeight > 0) {
                const splashH = splash.offsetHeight;
                c.style.overflowAnchor = "none";
                splash.style.height = "0";
                splash.style.minHeight = "0";
                splash.style.overflow = "hidden";
                splash.style.scrollSnapAlign = "none";
                splash.style.scrollSnapStop = "unset";
                c.scrollTo({ top: Math.max(0, c.scrollTop - splashH), behavior: "instant" });
                c.style.overflowAnchor = "";
                splashPassedRef.current = true;
              }
              c.scrollTo({ top: c.scrollTop + c.clientHeight, behavior: "smooth" });
            }
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
        const video   = videoRefs.current.get(activeIdRef.current ?? "");
        const bgVideo = bgVideoRefs.current.get(activeIdRef.current ?? "");
        if (video) {
          if (video.paused) { video.play().catch(() => {}); bgVideo?.play().catch(() => {}); }
          else              { video.pause(); bgVideo?.pause(); }
        }
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
  useEffect(() => {
    if (activeId === "__splash__") { onActiveClipChange?.(null); return; }
    onActiveClipChange?.(clips.find((c) => c.id === activeId) ?? null);
  }, [activeId, clips, onActiveClipChange]);

  // ── Skip splash on mount (when a game filter is active) ─────────────────
  useEffect(() => {
    if (!skipSplash || !scrollRef.current) return;
    const container = scrollRef.current;
    requestAnimationFrame(() => {
      const splash = container.querySelector<HTMLElement>('[data-clip-id="__splash__"]');
      if (splash) container.scrollTo({ top: splash.offsetHeight, behavior: "instant" });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Collapse splash once passed (can't scroll back) ──────────────────────
  useLayoutEffect(() => {
    if (!splashPassed || !splashRef.current || !scrollRef.current) return;
    const splash = splashRef.current;
    const container = scrollRef.current;
    const splashHeight = splash.offsetHeight;
    // Disable scroll anchoring so browser doesn't auto-adjust scrollTop
    container.style.overflowAnchor = "none";
    // Collapse the splash out of the scroll flow
    splash.style.height = "0";
    splash.style.minHeight = "0";
    splash.style.overflow = "hidden";
    splash.style.scrollSnapAlign = "none";
    splash.style.scrollSnapStop = "unset";
    // Compensate scrollTop so visual position stays on current clip
    container.scrollTo({ top: Math.max(0, container.scrollTop - splashHeight), behavior: "instant" });
    container.style.overflowAnchor = "";
  }, [splashPassed]);

  // ── External scroll-to (used by filter to skip non-matching clips) ─────────
  useEffect(() => {
    if (!scrollToClipId || !scrollRef.current) return;
    const container = scrollRef.current;
    const el = container.querySelector<HTMLElement>(`[data-clip-id="${scrollToClipId}"]`);
    if (el) {
      const top = el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
      container.scrollTo({ top, behavior: "smooth" });
      onScrolledToClip?.();
    }
  }, [scrollToClipId, onScrolledToClip]);

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

  // ── 2× speed on right-side hold ──────────────────────────────────────────
  const speed2xTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [speed2xId,     setSpeed2xId]     = useState<string | null>(null);
  const wasSpeed2xRef   = useRef(false);

  const startSpeed2x = useCallback((e: React.PointerEvent, clipId: string) => {
    // Only right half, skip if target is a button
    if ((e.target as HTMLElement).closest("button")) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (e.clientX < rect.left + rect.width / 2) return;

    speed2xTimerRef.current = setTimeout(() => {
      const v = videoRefs.current.get(clipId);
      if (v) v.playbackRate = 2;
      setSpeed2xId(clipId);
    }, 200);
  }, []);

  const stopSpeed2x = useCallback((clipId: string) => {
    if (speed2xTimerRef.current) {
      clearTimeout(speed2xTimerRef.current);
      speed2xTimerRef.current = null;
    }
    if (speed2xId === clipId) {
      wasSpeed2xRef.current = true;
      setTimeout(() => { wasSpeed2xRef.current = false; }, 0);
    }
    const v = videoRefs.current.get(clipId);
    if (v) v.playbackRate = 1;
    setSpeed2xId(null);
  }, [speed2xId]);

  const togglePlay = (id: string) => {
    if (wasSpeed2xRef.current) return;
    resetAutoScrollCount();
    const v  = videoRefs.current.get(id);
    const bg = bgVideoRefs.current.get(id);
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); bg?.play().catch(() => {}); }
    else          { v.pause(); bg?.pause(); }
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
        <div className="cp-feed-item cp-splash" data-clip-id="__splash__" ref={splashRef}>
          <div className="cp-splash__orb cp-splash__orb--a" />
          <div className="cp-splash__orb cp-splash__orb--b" />
          <div className="cp-splash__orb cp-splash__orb--c" />

          <div className="cp-splash__content">
            <p className="cp-splash__eyebrow">Ultimate Playground</p>
            <p className="cp-splash__headline">
              The best gaming clips,<br />curated for you
            </p>

            <div className="cp-splash__shortcuts">
              <span className="cp-splash__shortcut"><kbd>Space</kbd> Play / Pause</span>
              <span className="cp-splash__shortcut"><kbd>↑</kbd><kbd>↓</kbd> or scroll</span>
            </div>
          </div>

          <div className="cp-splash__scroll">
            <div className="cp-scroll-mouse">
              <div className="cp-scroll-mouse__wheel" />
            </div>
            <span className="cp-splash__scroll-cta">Scroll down</span>
          </div>

          {/* Bottom gradient fade */}
          <div className="cp-splash__bottom-fade" />
        </div>

        {/* ── Clip items ───────────────────────────────────────── */}
        {clips.map((clip, index) => {
          const game  = GAMES[clip.game] ?? { name: clip.game, color: "#555", textColor: "#fff" };
          const liked = likedClipIds.has(clip.id);

          return (
            <div
              key={clip.id}
              className="cp-feed-item"
              data-clip-id={clip.id}
              onPointerDown={(e) => startSpeed2x(e, clip.id)}
              onPointerUp={() => stopSpeed2x(clip.id)}
              onPointerLeave={() => stopSpeed2x(clip.id)}
              onPointerCancel={() => stopSpeed2x(clip.id)}
            >
              {speed2xId === clip.id && (
                <div className="cp-speed-badge">2×</div>
              )}

              {/* Blurred ambient background — desktop only (mobile: too GPU-intensive) */}
              {!isMobile && (
                <video
                  ref={(el) => {
                    if (el) bgVideoRefs.current.set(clip.id, el);
                    else bgVideoRefs.current.delete(clip.id);
                  }}
                  className="cp-feed-bg-blur"
                  muted
                  loop
                  playsInline
                  preload="none"
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <source src={clip.videoUrl} />
                </video>
              )}

              {/* Thumbnail/color overlay — visible before first play, hidden once video plays */}
              <div
                className="cp-feed-preplay"
                data-clip-preplay={clip.id}
                style={clip.thumbnailUrl
                  ? { backgroundImage: `url("${clip.thumbnailUrl}")` }
                  : { background: `linear-gradient(180deg, ${game.color}55 0%, rgba(0,0,0,0.85) 100%)` }
                }
              />

              <video
                ref={(el) => {
                  if (el) { videoRefs.current.set(clip.id, el); el.muted = muted; }
                  else videoRefs.current.delete(clip.id);
                }}
                className="cp-feed-video"
                loop
                playsInline
                preload={index === 0 ? "metadata" : "none"}
                poster={clip.thumbnailUrl ?? undefined}
                onClick={() => togglePlay(clip.id)}
                onPlay={() => {
                  const preplay = scrollRef.current?.querySelector<HTMLElement>(`[data-clip-preplay="${clip.id}"]`);
                  if (preplay) preplay.style.opacity = "0";
                }}
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

              {/* Right column: comment (mobile) + like + share */}
              <div className="cp-feed-actions">
                {/* Comment button */}
                <button
                  className="cp-feed-comment"
                  onClick={onCommentClick}
                  aria-label="Comments"
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </button>

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
