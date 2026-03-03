"use client";
import { memo, useState, useCallback, useEffect, useRef } from "react";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { seededShuffle } from "@/lib/seededRandom";
import { getPartykitHost, isMultiplayerEnabled } from "@/lib/partykitHost";
import { recordMatch, getRecord } from "@/lib/matchHistory";
import { useRatingSubmit } from "@/hooks/useRatingSubmit";
import MultiplayerScreen from "@/components/MultiplayerScreen";
import OpponentBar from "@/components/OpponentBar";
import NamePromptModal from "@/components/NamePromptModal";
import wcfData from "@/app/wcf_data.json";
import { ensureCustomImages, getCustomImage } from "@/lib/customImages";

// ─── Types ───────────────────────────────────────────────────────────────────
interface WcfEvent { text: string; year: number; category: string; wiki: string; }
type RoundType = "duel" | "slider" | "order";

interface DuelRound   { type: "duel";   a: WcfEvent; b: WcfEvent; }
interface SliderRound { type: "slider"; event: WcfEvent; }
interface OrderRound  { type: "order";  correct: WcfEvent[]; shuffled: WcfEvent[]; }
type Round = DuelRound | SliderRound | OrderRound;

type RoundResult =
  | { round: number; type: "duel";   a: WcfEvent; b: WcfEvent; picked: "a"|"b"|null; earlier: "a"|"b"; points: number; }
  | { round: number; type: "slider"; event: WcfEvent; guess: number; points: number; }
  | { round: number; type: "order";  correct: WcfEvent[]; placed: string[]; points: number; };

type Screen = "home" | "game" | "result";
type Mode   = "solo" | "multi";

// ─── Constants ────────────────────────────────────────────────────────────────
const TOTAL         = 9;   // 3× each type
const MAX_PTS       = 100;
const MAX_TOTAL     = TOTAL * MAX_PTS;
const ANSWER_TIME   = 15;
const NEXT_TIME     = 3;
const MIN_YEAR      = 1950;
const MAX_YEAR      = 2025;
const INIT_YEAR     = 1990;
const ROUND_PATTERN: RoundType[] = ["duel","slider","order","duel","slider","order","duel","slider","order"];
const ALL_EVENTS: WcfEvent[] = wcfData.events as WcfEvent[];

// ─── Wikipedia image cache + hook ─────────────────────────────────────────────
const wikiImgCache = new Map<string, string>();
function useWikiImage(title: string): string | null {
  const [src, setSrc] = useState<string | null>(
    getCustomImage("wcf", title) ?? wikiImgCache.get(title) ?? null
  );
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await ensureCustomImages();
      if (cancelled) return;
      const customUrl = getCustomImage("wcf", title);
      if (customUrl) { setSrc(customUrl); return; }
      const cached = wikiImgCache.get(title);
      if (cached) { setSrc(cached); return; }
      try {
        const r = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=400&origin=*`);
        if (cancelled) return;
        const data = await r.json();
        if (cancelled) return;
        const pages = data?.query?.pages as Record<string, { thumbnail?: { source: string } }> | undefined;
        if (!pages) return;
        const page = Object.values(pages)[0];
        if (page?.thumbnail?.source) { wikiImgCache.set(title, page.thumbnail.source); setSrc(page.thumbnail.source); }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [title]);
  return src;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateRounds(seed?: number): Round[] {
  const events = seed !== undefined ? seededShuffle([...ALL_EVENTS], seed) : shuffle([...ALL_EVENTS]);
  const used = new Set<number>();
  function pickEvent(excludeYears = new Set<number>()): WcfEvent | null {
    for (let i = 0; i < events.length; i++) {
      if (!used.has(i) && !excludeYears.has(events[i].year)) { used.add(i); return events[i]; }
    }
    for (let i = 0; i < events.length; i++) { // fallback: ignore year conflict
      if (!used.has(i)) { used.add(i); return events[i]; }
    }
    return null;
  }
  const rounds: Round[] = [];
  for (const type of ROUND_PATTERN) {
    if (type === "slider") {
      const event = pickEvent(); if (event) rounds.push({ type: "slider", event });
    } else if (type === "duel") {
      const a = pickEvent(); if (!a) break;
      const b = pickEvent(new Set([a.year])); if (!b) break;
      rounds.push({ type: "duel", a, b });
    } else {
      const picked: WcfEvent[] = []; const usedYears = new Set<number>();
      for (let i = 0; i < 4; i++) {
        const e = pickEvent(usedYears); if (!e) break;
        picked.push(e); usedYears.add(e.year);
      }
      if (picked.length === 4) {
        const correct = [...picked].sort((a, b) => a.year - b.year);
        rounds.push({ type: "order", correct, shuffled: picked });
      }
    }
  }
  return rounds;
}

function sliderScore(guess: number, actual: number) { return Math.max(0, 100 - Math.abs(guess - actual) * 5); }
function orderScore(placed: string[], correct: WcfEvent[]) {
  const n = placed.reduce((acc, t, i) => acc + (t === correct[i].text ? 1 : 0), 0);
  return Math.round((n / 4) * 100);
}

function gradeLabel(pts: number): string {
  const p = pts / MAX_TOTAL;
  if (p >= 0.9)  return "🧠 Historian";
  if (p >= 0.75) return "🔥 Expert";
  if (p >= 0.55) return "👍 Solid";
  if (p >= 0.35) return "😅 Beginner";
  return "😬 Need to read more";
}

// ─── Stars ────────────────────────────────────────────────────────────────────
const STARS = Array.from({ length: 80 }, (_, i) => ({
  id: i, x: Math.random() * 100, y: Math.random() * 100,
  size: Math.random() * 2 + 0.5, opacity: Math.random() * 0.6 + 0.1, delay: Math.random() * 4,
}));
const Stars = memo(function Stars() {
  return (
    <div className="stars-layer">
      {STARS.map(s => (
        <div key={s.id} className="star" style={{
          left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size,
          opacity: s.opacity, animation: `twinkle ${2 + s.delay}s ease-in-out infinite`,
          animationDelay: `${s.delay}s`,
        }} />
      ))}
    </div>
  );
});

// ─── ProgressBar ──────────────────────────────────────────────────────────────
function ProgressBar({ current, total, score }: { current: number; total: number; score: number }) {
  return (
    <div className="progress-bar">
      <div className="progress-bar__header">
        <span className="progress-bar__question">Round {current}/{total}</span>
        <div className="progress-bar__stat">
          <div className="progress-bar__stat-label">Points</div>
          <div className="progress-bar__stat-value" style={{ color: "#f0c040" }}>{score}</div>
        </div>
      </div>
      <div className="progress-bar__track">
        <div className="progress-bar__fill" style={{ width: `${(current / total) * 100}%` }} />
      </div>
    </div>
  );
}

// ─── AnswerTimer ──────────────────────────────────────────────────────────────
function AnswerTimer({ timeLeft, total }: { timeLeft: number; total: number }) {
  const urgent = timeLeft <= 5;
  return (
    <div className="answer-timer">
      <div className="answer-timer__header">
        <span className="answer-timer__label">Time to answer</span>
        <span className={`answer-timer__count answer-timer__count--${urgent ? "urgent" : "normal"}`}>{timeLeft}s</span>
      </div>
      <div className="answer-timer__track">
        <div className={`answer-timer__fill answer-timer__fill--${urgent ? "urgent" : "normal"}`}
          style={{ width: `${(timeLeft / total) * 100}%` }} />
      </div>
    </div>
  );
}

// ─── Shared: category badge + event image ─────────────────────────────────────
const BADGE_CLASS: Record<string, string> = {
  tech: "wcf-badge--tech", sports: "wcf-badge--sports", culture: "wcf-badge--culture",
  history: "wcf-badge--history", science: "wcf-badge--science",
};
function CatBadge({ category }: { category: string }) {
  return <span className={`wcf-cat-badge ${BADGE_CLASS[category] ?? ""}`}>{category}</span>;
}
function EventImg({ wiki, alt, className }: { wiki: string; alt: string; className?: string }) {
  const src = useWikiImage(wiki);
  if (src) return <img src={src} alt={alt} className={`wcf-event-img${className ? ` ${className}` : ""}`} draggable={false} />;
  return <div className="wcf-event-img-placeholder" />;
}

// ─── DUEL ROUND ───────────────────────────────────────────────────────────────
function DuelCard({ event, side, earlierSide, answered, onClick }: {
  event: WcfEvent; side: "a"|"b"; earlierSide: "a"|"b"; answered: boolean; onClick: () => void;
}) {
  const isEarlier = answered && side === earlierSide;
  let cls = "wcf-card";
  if (answered) cls += isEarlier ? " wcf-card--answered wcf-card--earlier" : " wcf-card--answered wcf-card--later";
  return (
    <div className={cls} onClick={answered ? undefined : onClick}>
      <CatBadge category={event.category} />
      <EventImg wiki={event.wiki} alt={event.text} />
      <span className="wcf-card__text">{event.text}</span>
      {answered ? (
        <>
          <span className="wcf-card__year">{event.year}</span>
          <span className="wcf-card__verdict">{isEarlier ? "✓ Earlier" : "✗ Later"}</span>
        </>
      ) : (
        <span className="wcf-card__year wcf-card__year--hidden">???</span>
      )}
    </div>
  );
}

// ─── SLIDER ROUND ─────────────────────────────────────────────────────────────
function SliderRoundView({ event, value, answered, sliderScore: pts, onChange }: {
  event: WcfEvent; value: number; answered: boolean; sliderScore: number; onChange: (v: number) => void;
}) {
  const color = answered ? (pts >= 75 ? "#00ffa0" : pts >= 40 ? "#f0c040" : "#ff6b6b") : "#f0c040";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="wcf-slider-card">
        <EventImg wiki={event.wiki} alt={event.text} />
        <div className="wcf-slider-card__body">
          <CatBadge category={event.category} />
          <span className="wcf-slider-card__text">{event.text}</span>
        </div>
      </div>
      <div className="wcf-slider-zone">
        <div className="wcf-slider-question">In which year did this happen?</div>
        <div className="wcf-slider-year-display" style={{ color }}>{value}</div>
        {!answered && (
          <>
            <input
              type="range" min={MIN_YEAR} max={MAX_YEAR} value={value}
              onChange={e => onChange(Number(e.target.value))}
              className="wcf-slider-input"
            />
            <div className="wcf-slider-range-labels"><span>{MIN_YEAR}</span><span>{MAX_YEAR}</span></div>
          </>
        )}
        {answered && (
          <div className="wcf-slider-result">
            Answer: <strong>{event.year}</strong>
            {value !== event.year && <> · You guessed {value} ({Math.abs(value - event.year)} year{Math.abs(value - event.year) > 1 ? "s" : ""} off)</>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ORDER ROUND ──────────────────────────────────────────────────────────────
function OrderRoundView({
  round, submitted, placed, draggingText, draggingFromSlot, dragOverSlot,
  slotRefs, onSlotDragStart,
}: {
  round: OrderRound;
  submitted: boolean;
  placed: (string | null)[];
  draggingText: string | null;
  draggingFromSlot: number | null;
  dragOverSlot: number | null;
  slotRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  onSlotDragStart: (text: string, fromSlot: number, e: React.MouseEvent | React.TouchEvent, el: HTMLElement) => void;
}) {
  const getDisplayed = (i: number) => draggingFromSlot === i ? null : placed[i];
  const eventByText = (text: string) => round.shuffled.find(e => e.text === text) ?? round.correct.find(e => e.text === text) ?? null;

  return (
    <>
      {/* Numbered slots */}
      <div>
        <div className="wcf-prompt">Drag into chronological order</div>
        <div style={{ height: 8 }} />
        <div className="wcf-order-slots">
          {placed.map((_, i) => {
            const text = getDisplayed(i);
            const event = text ? eventByText(text) : null;
            const isOver = dragOverSlot === i;
            let cls = "wcf-order-slot";
            if (submitted && text !== null) {
              cls += text === round.correct[i].text ? " wcf-order-slot--correct" : " wcf-order-slot--wrong";
            } else if (text !== null) {
              cls += " wcf-order-slot--filled";
            }
            if (!submitted && isOver) cls += " wcf-order-slot--drag-over";
            return (
              <div
                key={i}
                className={cls}
                ref={el => { slotRefs.current[i] = el; }}
                onMouseDown={e => { if (submitted || !text) return; e.preventDefault(); onSlotDragStart(text, i, e, e.currentTarget); }}
                onTouchStart={e => { if (submitted || !text) return; onSlotDragStart(text, i, e, e.currentTarget); }}
              >
                <div className="wcf-order-slot-num">{i + 1}</div>
                {event !== null && text !== null ? (
                  <>
                    {submitted && <span className="wcf-order-slot-verdict">{text === round.correct[i].text ? "✓" : "✗"}</span>}
                    <div className="wcf-order-slot-img-wrap">
                      <EventImg wiki={event.wiki} alt={event.text} />
                    </div>
                    <span className="wcf-order-slot-text">{event.text}</span>
                    {submitted && <span className="wcf-order-slot-year">{event.year}</span>}
                  </>
                ) : (
                  <span className="wcf-order-slot-empty-hint">drop here</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pool — only shown while there are unplaced events */}
      {!submitted && placed.some(p => p === null) && (
        <div>
          <div className="wcf-order-pool-label">Available events</div>
          <div style={{ height: 4 }} />
          <div className="wcf-order-pool">
            {round.shuffled
              .filter(e => !placed.includes(e.text) || (draggingFromSlot !== null && draggingText === e.text))
              .filter(e => !(draggingText === e.text && draggingFromSlot === null))
              .map(event => (
                <div
                  key={event.text}
                  className={`wcf-order-chip${draggingText === event.text && draggingFromSlot === null ? " wcf-order-chip--dragging" : ""}`}
                  onMouseDown={e => { e.preventDefault(); onSlotDragStart(event.text, -1, e, e.currentTarget); }}
                  onTouchStart={e => { onSlotDragStart(event.text, -1, e, e.currentTarget); }}
                >
                  <div className="wcf-order-chip-img-wrap">
                    <EventImg wiki={event.wiki} alt={event.text} />
                  </div>
                  <span className="wcf-order-chip-text">{event.text}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </>
  );
}

// ─── ResultCard ───────────────────────────────────────────────────────────────
function ResultCard({ entry }: { entry: RoundResult }) {
  const color = entry.points >= MAX_PTS ? "#00ffa0" : entry.points >= 50 ? "#f0c040" : "#ff6b6b";
  let detail = "";
  if (entry.type === "duel") {
    const earlier = entry.earlier === "a" ? entry.a : entry.b;
    const later   = entry.earlier === "a" ? entry.b : entry.a;
    detail = `${earlier.year} ${earlier.text.slice(0, 30)} → ${later.year}`;
  } else if (entry.type === "slider") {
    detail = `${entry.event.text.slice(0, 40)} · Answer: ${entry.event.year}`;
  } else {
    const n = entry.placed.reduce((acc, t, i) => acc + (t === entry.correct[i].text ? 1 : 0), 0);
    detail = `${n}/4 correct · ${entry.correct.map(e => e.year).join(" → ")}`;
  }
  return (
    <div className="wcf-result-card">
      <div className="wcf-result-card__info">
        <span className={`wcf-result-card__type-badge wcf-type-badge wcf-type-badge--${entry.type}`}>{entry.type}</span>
        <span className="wcf-result-card__detail">{detail}</span>
      </div>
      <div className="wcf-result-card__score">
        <div className="wcf-result-card__pts" style={{ color }}>{entry.points}</div>
        <div className="wcf-result-card__label">pts</div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function WhatCameFirst() {
  const [screen, setScreen]         = useState<Screen>("home");
  const [mode, setMode]             = useState<Mode>("solo");
  const [rounds, setRounds]         = useState<Round[]>([]);
  const [qNum, setQNum]             = useState(1);
  const [totalScore, setTotalScore] = useState(0);
  const [results, setResults]       = useState<RoundResult[]>([]);
  const [answered, setAnswered]     = useState(false);

  // Per-round state
  const [duelPick, setDuelPick]         = useState<"a"|"b"|null>(null);
  const [sliderValue, setSliderValue]   = useState(INIT_YEAR);
  const [orderPlaced, setOrderPlaced]   = useState<(string|null)[]>([null, null, null, null]);
  const [draggingText, setDraggingText] = useState<string|null>(null);
  const [draggingFromSlot, setDraggingFromSlot] = useState<number|null>(null);
  const [dragOverSlot, setDragOverSlot]         = useState<number|null>(null);

  // Multiplayer
  const [roundOver, setRoundOver]               = useState(false);
  const [multiWaiting, setMultiWaiting]         = useState(false);
  const [showNamePrompt, setShowNamePrompt]     = useState(false);
  const [answerTimeLeft, setAnswerTimeLeft]     = useState<number|null>(null);
  const [nextCountdown, setNextCountdown]       = useState<number|null>(null);

  // Refs
  const roundsRef         = useRef<Round[]>([]);
  const answeredRef       = useRef(false);
  const qNumRef           = useRef(1);
  const sliderRef         = useRef(INIT_YEAR);
  const orderPlacedRef    = useRef<(string|null)[]>([null, null, null, null]);
  const slotRefs          = useRef<(HTMLDivElement|null)[]>([]);
  const ghostRef          = useRef<HTMLElement|null>(null);
  const answerIntervalRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const answerTimeoutRef  = useRef<ReturnType<typeof setTimeout>|null>(null);
  const nextIntervalRef   = useRef<ReturnType<typeof setInterval>|null>(null);
  const nextTimeoutRef    = useRef<ReturnType<typeof setTimeout>|null>(null);

  const currentRound = rounds[qNum - 1] ?? null;
  const isLastRound  = qNum >= TOTAL;
  const canClickNext = mode === "solo" ? answered : roundOver && !multiWaiting;
  const feedbackIsWaiting = mode === "multi" && answered && (!roundOver || multiWaiting);
  const allOrderPlaced = orderPlaced.every(p => p !== null);
  const showSubmitBtn = !answered && currentRound && (currentRound.type === "slider" || currentRound.type === "order");
  const canSubmit = !answered && (currentRound?.type === "slider" || allOrderPlaced);

  answeredRef.current   = answered;
  qNumRef.current       = qNum;
  sliderRef.current     = sliderValue;
  orderPlacedRef.current = orderPlaced;

  // ── Drag & drop (order round) ───────────────────────────────────────────────
  function getSlotAtPoint(x: number, y: number): number | null {
    for (let i = 0; i < slotRefs.current.length; i++) {
      const el = slotRefs.current[i];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return i;
    }
    return null;
  }

  const startDrag = useCallback((
    text: string, fromSlot: number, clientX: number, clientY: number, sourceEl: HTMLElement,
  ) => {
    if (answeredRef.current) return;
    const ghost = sourceEl.cloneNode(true) as HTMLElement;
    const w = sourceEl.offsetWidth, h = sourceEl.offsetHeight;
    ghost.className = (ghost.className ?? "") + " wcf-drag-ghost";
    Object.assign(ghost.style, { width: `${w}px`, height: `${h}px`, left: `${clientX-w/2}px`, top: `${clientY-h/2}px` });
    document.body.appendChild(ghost);
    ghostRef.current = ghost;
    setDraggingText(text); setDraggingFromSlot(fromSlot); setDragOverSlot(null);
    let lastOver: number|null = null, done = false;
    const onMove = (cx: number, cy: number) => {
      if (ghostRef.current) { ghostRef.current.style.left = `${cx-w/2}px`; ghostRef.current.style.top = `${cy-h/2}px`; }
      const slot = getSlotAtPoint(cx, cy);
      if (slot !== lastOver) { lastOver = slot; setDragOverSlot(slot); }
    };
    const onEnd = (cx: number, cy: number) => {
      if (done) return; done = true;
      ghostRef.current?.remove(); ghostRef.current = null;
      const target = getSlotAtPoint(cx, cy);
      setOrderPlaced(prev => {
        const next = [...prev];
        if (target !== null) {
          const displaced = next[target];
          next[target] = text;
          if (fromSlot >= 0) next[fromSlot] = displaced ?? null;
        } else {
          if (fromSlot >= 0) next[fromSlot] = null;
        }
        return next;
      });
      setDraggingText(null); setDraggingFromSlot(null); setDragOverSlot(null);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend",  onTouchEnd);
    };
    const onMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const onMouseUp   = (e: MouseEvent) => onEnd(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); };
    const onTouchEnd  = (e: TouchEvent) => onEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend",  onTouchEnd);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => { ghostRef.current?.remove(); }, []);

  // ── Submit logic ───────────────────────────────────────────────────────────
  const doSubmit = useCallback((result: RoundResult) => {
    if (answeredRef.current) return 0;
    answeredRef.current = true;
    setAnswered(true);
    setTotalScore(s => s + result.points);
    setResults(prev => [...prev, result]);
    return result.points;
  }, []);

  const clearTimers = useCallback(() => {
    clearInterval(answerIntervalRef.current!); clearTimeout(answerTimeoutRef.current!);
    answerIntervalRef.current = null; answerTimeoutRef.current = null;
    setAnswerTimeLeft(null);
  }, []);

  const resetRound = useCallback(() => {
    setAnswered(false); answeredRef.current = false;
    setDuelPick(null);
    setSliderValue(INIT_YEAR); sliderRef.current = INIT_YEAR;
    setOrderPlaced([null, null, null, null]); orderPlacedRef.current = [null, null, null, null];
    setDraggingText(null); setDraggingFromSlot(null); setDragOverSlot(null);
    setRoundOver(false); setMultiWaiting(false);
  }, []);

  // ── Pick handler (duel) ────────────────────────────────────────────────────
  const handleDuelPick = (side: "a"|"b") => {
    if (answered || !currentRound || currentRound.type !== "duel") return;
    clearTimers();
    const earlier: "a"|"b" = currentRound.a.year <= currentRound.b.year ? "a" : "b";
    const points = side === earlier ? MAX_PTS : 0;
    setDuelPick(side);
    const pts = doSubmit({ round: qNumRef.current, type: "duel", a: currentRound.a, b: currentRound.b, picked: side, earlier, points });
    if (mode === "multi") mp.submitAnswer(0, pts);
  };

  // ── Submit handler (slider & order) ───────────────────────────────────────
  const handleSubmit = () => {
    if (answered || !currentRound) return;
    clearTimers();
    if (currentRound.type === "slider") {
      const points = sliderScore(sliderRef.current, currentRound.event.year);
      const pts = doSubmit({ round: qNumRef.current, type: "slider", event: currentRound.event, guess: sliderRef.current, points });
      if (mode === "multi") mp.submitAnswer(0, pts);
    } else if (currentRound.type === "order") {
      const placed = orderPlacedRef.current;
      const remaining = currentRound.shuffled.map(e => e.text).filter(t => !placed.includes(t));
      let ri = 0;
      const final = placed.map(t => t ?? (remaining[ri++] ?? ""));
      const points = orderScore(final, currentRound.correct);
      const pts = doSubmit({ round: qNumRef.current, type: "order", correct: currentRound.correct, placed: final, points });
      setOrderPlaced(final); orderPlacedRef.current = final;
      if (mode === "multi") mp.submitAnswer(0, pts);
    }
  };

  // ── Multiplayer callbacks ──────────────────────────────────────────────────
  const onMpGameStart = useCallback((seed: number) => {
    const newRounds = generateRounds(seed);
    roundsRef.current = newRounds;
    setRounds(newRounds);
    setQNum(1); qNumRef.current = 1;
    setTotalScore(0); setResults([]);
    resetRound();
    setScreen("game");
  }, [resetRound]);

  const onMpRoundEnd  = useCallback(() => setRoundOver(true), []);
  const onMpNextRound = useCallback((round: number) => {
    setQNum(round + 1); qNumRef.current = round + 1;
    resetRound();
  }, [resetRound]);
  const onMpGameEnd = useCallback(() => setScreen("result"), []);

  const mp = useMultiplayer({
    gameType: "wcf",
    host: getPartykitHost(),
    onGameStart:        onMpGameStart,
    onOpponentAnswered: useCallback(() => {}, []),
    onRoundEnd:         onMpRoundEnd,
    onNextRound:        onMpNextRound,
    onGameEnd:          onMpGameEnd,
  });

  const { submitRating, ratingResult } = useRatingSubmit("wcf");

  // Record match outcome + ELO rating
  useEffect(() => {
    if (screen !== "result" || mode !== "multi" || !mp.opponent) return;
    recordMatch(mp.opponent.name, totalScore > mp.opponent.score ? "win" : totalScore < mp.opponent.score ? "loss" : "tie");
    submitRating(totalScore, mp.opponent.score);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // ── Answer timer (multi) ───────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== "multi" || screen !== "game") return;
    let timeLeft = ANSWER_TIME;
    setAnswerTimeLeft(timeLeft);
    answerIntervalRef.current = setInterval(() => { timeLeft--; setAnswerTimeLeft(timeLeft); }, 1000);
    answerTimeoutRef.current  = setTimeout(() => {
      clearInterval(answerIntervalRef.current!); answerIntervalRef.current = null; setAnswerTimeLeft(0);
      const round = roundsRef.current[qNumRef.current - 1];
      if (!round || answeredRef.current) return;
      if (round.type === "duel") {
        const earlier: "a"|"b" = round.a.year <= round.b.year ? "a" : "b";
        const pts = doSubmit({ round: qNumRef.current, type: "duel", a: round.a, b: round.b, picked: null, earlier, points: 0 });
        mp.submitAnswer(0, pts);
      } else if (round.type === "slider") {
        const points = sliderScore(sliderRef.current, round.event.year);
        const pts = doSubmit({ round: qNumRef.current, type: "slider", event: round.event, guess: sliderRef.current, points });
        mp.submitAnswer(0, pts);
      } else {
        const placed = orderPlacedRef.current;
        const remaining = round.shuffled.map(e => e.text).filter(t => !placed.includes(t));
        let ri = 0; const final = placed.map(t => t ?? (remaining[ri++] ?? ""));
        const points = orderScore(final, round.correct);
        const pts = doSubmit({ round: qNumRef.current, type: "order", correct: round.correct, placed: final, points });
        setOrderPlaced(final); mp.submitAnswer(0, pts);
      }
    }, ANSWER_TIME * 1000);
    return () => { clearInterval(answerIntervalRef.current!); clearTimeout(answerTimeoutRef.current!); answerIntervalRef.current = null; answerTimeoutRef.current = null; setAnswerTimeLeft(null); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, screen, qNum]);

  // ── Next-round countdown (multi) ──────────────────────────────────────────
  useEffect(() => {
    if (!roundOver || mode !== "multi") return;
    let countdown = NEXT_TIME;
    setNextCountdown(countdown);
    nextIntervalRef.current = setInterval(() => { countdown--; setNextCountdown(countdown); }, 1000);
    nextTimeoutRef.current  = setTimeout(() => {
      clearInterval(nextIntervalRef.current!); nextIntervalRef.current = null;
      setNextCountdown(null);
      setMultiWaiting(prev => { if (!prev) mp.readyForNext(); return true; });
    }, NEXT_TIME * 1000);
    return () => { clearInterval(nextIntervalRef.current!); clearTimeout(nextTimeoutRef.current!); nextIntervalRef.current = null; nextTimeoutRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundOver]);

  // ── Solo game actions ──────────────────────────────────────────────────────
  const startSolo = useCallback(() => {
    setMode("solo");
    const newRounds = generateRounds();
    roundsRef.current = newRounds;
    setRounds(newRounds);
    setQNum(1); qNumRef.current = 1;
    setTotalScore(0); setResults([]);
    resetRound();
    setScreen("game");
  }, [resetRound]);

  const startMulti   = () => { mp.disconnect(); setMode("multi"); setShowNamePrompt(true); };
  const handleNewOpp = () => { mp.disconnect(); setMode("multi"); setScreen("home"); setShowNamePrompt(true); };
  const handleMenu   = () => { mp.disconnect(); setMode("solo"); setScreen("home"); };

  const handleNext = () => {
    if (mode === "multi") {
      clearInterval(nextIntervalRef.current!); clearTimeout(nextTimeoutRef.current!);
      nextIntervalRef.current = null; nextTimeoutRef.current = null;
      setNextCountdown(null); setMultiWaiting(true); mp.readyForNext(); return;
    }
    if (isLastRound) { setScreen("result"); return; }
    const nextQ = qNum + 1;
    setQNum(nextQ); qNumRef.current = nextQ;
    resetRound();
  };

  const handleSlotDragStart = (text: string, fromSlot: number, e: React.MouseEvent | React.TouchEvent, el: HTMLElement) => {
    const { clientX, clientY } = e.type.startsWith("touch")
      ? (e as React.TouchEvent).touches[0]
      : (e as React.MouseEvent);
    startDrag(text, fromSlot, clientX, clientY, el);
  };

  // ── Result helpers ─────────────────────────────────────────────────────────
  const pct           = totalScore / MAX_TOTAL;
  const scoreBarGrade = pct >= 0.75 ? "excellent" : pct >= 0.5 ? "good" : "poor";
  const myCircleClass = mode === "multi" && mp.opponent
    ? totalScore > mp.opponent.score ? "score-circle--win" : "score-circle--neutral" : "score-circle--solo";
  const oppCircleClass = mode === "multi" && mp.opponent
    ? mp.opponent.score > totalScore ? "score-circle--win" : "score-circle--lose" : "";
  const myValueColor  = mode === "multi" && mp.opponent
    ? totalScore > mp.opponent.score ? "score-circle__value--green" : "score-circle__value--gold" : "score-circle__value--gold";
  const oppValueColor = mode === "multi" && mp.opponent
    ? mp.opponent.score > totalScore ? "score-circle__value--green" : "score-circle__value--red" : "";

  const last = results[results.length - 1];
  const lastPts = last?.points ?? 0;
  const lastColor = lastPts >= MAX_PTS ? "#00ffa0" : lastPts >= 50 ? "#f0c040" : "#ff6b6b";
  const typeLabel = currentRound?.type === "duel" ? "Duel — Which came first?"
    : currentRound?.type === "slider" ? "Slider — Find the year"
    : "Order — Chronological order";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {showNamePrompt && (
        <NamePromptModal
          onConfirm={name => { setShowNamePrompt(false); mp.joinQueue(name); }}
          onCancel={() => { setShowNamePrompt(false); setMode("solo"); }}
        />
      )}
      <MultiplayerScreen
        status={mp.status}
        onCancel={() => { mp.leaveQueue(); setMode("solo"); setScreen("home"); }}
        onContinueSolo={() => { mp.disconnect(); setMode("solo"); setMultiWaiting(false); }}
      />

      <div className="game-wrapper theme-culture">
        <Stars />
        <div className="glow-orb glow-orb--purple" />
        <div className="glow-orb glow-orb--orange" />

        {/* ── HOME ────────────────────────────────────────────────────────── */}
        {screen === "home" && (
          <div className="home-screen">
            <div className="home-emoji">⏳</div>
            <div className="home-title">What Came<span className="accent">First?</span></div>
            <p className="home-subtitle">History, science, culture & tech across time</p>
            <div className="how-it-works">
              <div className="how-it-works__title">How it works</div>
              {[
                ["🥊", "Duel — pick which of 2 events happened first"],
                ["📅", "Slider — guess the exact year of an event"],
                ["🔀", "Order — drag 4 events into chronological order"],
                ["🏆", "9 rounds · max 900 pts"],
              ].map(([icon, text]) => (
                <div key={text as string} className="how-it-works__item">
                  <span className="how-it-works__icon">{icon as string}</span>
                  <span className="how-it-works__text">{text as string}</span>
                </div>
              ))}
            </div>
            <div className="home-buttons">
              <button onClick={startSolo}  className="btn-primary btn-hover">Play Solo</button>
              {isMultiplayerEnabled() && <button onClick={startMulti} className="btn-outline btn-hover">⚡ Multiplayer</button>}
            </div>
          </div>
        )}

        {/* ── GAME ────────────────────────────────────────────────────────── */}
        {screen === "game" && currentRound && (
          <div className="wcf-container">
            {mode === "multi" && mp.opponent && (
              <OpponentBar opponent={mp.opponent} myScore={totalScore} maxScore={MAX_TOTAL} />
            )}
            <ProgressBar current={qNum} total={TOTAL} score={totalScore} />
            {mode === "multi" && answerTimeLeft !== null && !answered && (
              <AnswerTimer timeLeft={answerTimeLeft} total={ANSWER_TIME} />
            )}

            {/* Round type badge */}
            <div className="wcf-round-header">
              <span className={`wcf-type-badge wcf-type-badge--${currentRound.type}`}>{typeLabel}</span>
            </div>

            {/* Round content */}
            {currentRound.type === "duel" && (() => {
              const earlier: "a"|"b" = currentRound.a.year <= currentRound.b.year ? "a" : "b";
              return (
                <div className="wcf-duel">
                  <DuelCard event={currentRound.a} side="a" earlierSide={earlier} answered={answered} onClick={() => handleDuelPick("a")} />
                  <div className="wcf-vs">VS</div>
                  <DuelCard event={currentRound.b} side="b" earlierSide={earlier} answered={answered} onClick={() => handleDuelPick("b")} />
                </div>
              );
            })()}

            {currentRound.type === "slider" && (
              <SliderRoundView
                event={currentRound.event}
                value={sliderValue}
                answered={answered}
                sliderScore={answered ? sliderScore(sliderValue, currentRound.event.year) : 0}
                onChange={v => { setSliderValue(v); sliderRef.current = v; }}
              />
            )}

            {currentRound.type === "order" && (
              <OrderRoundView
                round={currentRound}
                submitted={answered}
                placed={orderPlaced}
                draggingText={draggingText}
                draggingFromSlot={draggingFromSlot}
                dragOverSlot={dragOverSlot}
                slotRefs={slotRefs}
                onSlotDragStart={handleSlotDragStart}
              />
            )}

            {/* Submit button (slider + order) */}
            {showSubmitBtn && (
              <div className="wcf-submit-row">
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="btn-submit btn-hover-sm"
                  style={{ opacity: canSubmit ? 1 : 0.38 }}
                >
                  {currentRound.type === "order" && !allOrderPlaced
                    ? `${orderPlaced.filter(p => p === null).length} event${orderPlaced.filter(p => p === null).length > 1 ? "s" : ""} left`
                    : "Submit →"}
                </button>
              </div>
            )}

            {/* Feedback row */}
            {answered && last && (
              <div className="wcf-feedback">
                <div>
                  <div className="wcf-feedback__score" style={{ color: lastColor }}>+{lastPts} pts</div>
                  <div className="wcf-feedback__detail">
                    {last.type === "slider" && `${last.points} pts — ${Math.abs(last.guess - last.event.year)} year${Math.abs(last.guess - last.event.year) !== 1 ? "s" : ""} off`}
                    {last.type === "duel" && (last.picked === null ? "Time's up!" : last.points === MAX_PTS ? "Correct! 🎉" : "Wrong answer")}
                    {last.type === "order" && `${last.placed.reduce((acc, t, i) => acc + (t === last.correct[i].text ? 1 : 0), 0)}/4 in the right position`}
                  </div>
                </div>
                {feedbackIsWaiting && (
                  <div className="wcf-waiting-badge"><span className="waiting-dot" />Waiting…</div>
                )}
                {canClickNext && (
                  <button onClick={handleNext} className="wcf-feedback__btn">
                    {isLastRound ? "Results →" : nextCountdown !== null ? `Next (${nextCountdown}s)` : "Next →"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── RESULT ──────────────────────────────────────────────────────── */}
        {screen === "result" && (
          <div className="citymix-result-screen">
            <div className="result-emoji--pop">{pct >= 0.75 ? "🏆" : pct >= 0.5 ? "🧠" : "😅"}</div>
            <h1 className="result-title--pop">{mode === "multi" ? "Results" : "Final Score"}</h1>
            {mode === "multi" && mp.opponent ? (
              <div className="score-circles">
                <div className={`score-circle score-circle--md ${myCircleClass}`}>
                  <div className="score-circle__label">You</div>
                  <div className={`score-circle__value score-circle__value--md ${myValueColor}`}>{totalScore}</div>
                  <div className="score-circle__total score-circle__total--md">/ {MAX_TOTAL}</div>
                </div>
                <div className={`score-circle score-circle--md ${oppCircleClass}`}>
                  <div className="score-circle__label">Opp.</div>
                  <div className={`score-circle__value score-circle__value--md ${oppValueColor}`}>{mp.opponent.score}</div>
                  <div className="score-circle__total score-circle__total--md">/ {MAX_TOTAL}</div>
                </div>
              </div>
            ) : (
              <div className="score-circle score-circle--md score-circle--solo" style={{ margin: "20px auto" }}>
                <div className="score-circle__value score-circle__value--md score-circle__value--gold">{totalScore}</div>
                <div className="score-circle__total score-circle__total--md">/ {MAX_TOTAL}</div>
              </div>
            )}
            <div className="result-grade--pop">
              {mode === "multi" && mp.opponent
                ? totalScore > mp.opponent.score ? "🏆 You won!" : totalScore < mp.opponent.score ? "😅 You lost…" : "🤝 It's a tie!"
                : gradeLabel(totalScore)}
            </div>

            {mode === "multi" && ratingResult && (
              <div className="rating-delta">
                <span className={`rating-delta__pts ${ratingResult.won ? "rating-delta__pts--pos" : "rating-delta__pts--neg"}`}>
                  {ratingResult.won ? "+" : ""}{ratingResult.pointsDelta} pts
                </span>
                <span className="rating-delta__rank">{ratingResult.rank.emoji} {ratingResult.rank.name} · {ratingResult.newPoints.toLocaleString()} pts total</span>
              </div>
            )}

            {mode === "solo" && (
              <div className="result-score-bar result-score-bar--popguessr">
                <div className={`result-score-bar__fill result-score-bar__fill--${scoreBarGrade}`} style={{ width: `${pct * 100}%` }} />
              </div>
            )}
            <div className="round-breakdown">
              <div className="round-breakdown__header">Round Breakdown</div>
              <div className="round-breakdown__list">
                {results.map((entry, i) => <ResultCard key={i} entry={entry} />)}
              </div>
            </div>
            {mode === "multi" && mp.opponent && (
              <div className="rematch-zone">
                {(() => {
                  const rec = getRecord(mp.opponent.name);
                  if (!rec) return null;
                  return (
                    <div className="rematch-record">
                      vs <span className="rematch-record__name">{mp.opponent.name}</span>:{" "}
                      <span className="rematch-record__win">{rec.wins}W</span>{" "}
                      <span className="rematch-record__loss">{rec.losses}L</span>{" "}
                      <span className="rematch-record__tie">{rec.ties}T</span>
                    </div>
                  );
                })()}
                {mp.opponent.wantsRematch && !mp.myWantsRematch && (
                  <div className="rematch-notice">⚡ Opponent wants a rematch!</div>
                )}
                {mp.myWantsRematch
                  ? <div className="waiting-indicator"><span className="waiting-dot" />Waiting for opponent…</div>
                  : <button onClick={mp.requestRematch} className="btn-rematch btn-hover">⚡ Rematch</button>
                }
              </div>
            )}
            {mode === "multi" && mp.opponent ? (
              <div className="result-buttons--pop">
                <button onClick={handleNewOpp} className="btn-result-outline btn-hover-sm">🔄 New Opponent</button>
                <button onClick={handleMenu}   className="btn-result-ghost  btn-hover-sm">← Menu</button>
              </div>
            ) : (
              <div className="result-buttons--pop">
                <button onClick={startSolo}  className="btn-result-primary btn-hover-sm">Play Again</button>
                {isMultiplayerEnabled() && <button onClick={startMulti} className="btn-result-outline btn-hover-sm">⚡ Multiplayer</button>}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
