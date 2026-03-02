"use client";
import { memo, useState, useCallback, useEffect, useRef } from "react";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { seededShuffle } from "@/lib/seededRandom";
import { getPartykitHost, isMultiplayerEnabled } from "@/lib/partykitHost";
import { recordMatch, getRecord } from "@/lib/matchHistory";
import MultiplayerScreen from "@/components/MultiplayerScreen";
import OpponentBar from "@/components/OpponentBar";
import NamePromptModal from "@/components/NamePromptModal";
import footballData from "../football_data.json";
import { ensureCustomImages, getCustomImage, GameKey } from "@/lib/customImages";

// ─── Raw data types ─────────────────────────────────────────────────────────────
interface TriviaItem   { question: string; options: string[]; correct: number; flagOptions?: boolean; }
interface StadiumItem  { name: string; team: string; city: string; capacity: number; options: string[]; wiki?: string; }
interface TransferItem { player: string; from: string; to: string; year: number; fee_m: number; flag: string; wiki?: string; flagCode?: string; }
interface PeakItem     { player: string; club: string; season: number; goals: number; flag: string; wiki?: string; flagCode?: string; }

const TRIVIA:    TriviaItem[]   = footballData.trivia    as TriviaItem[];
const STADIUMS:  StadiumItem[]  = footballData.stadiums  as StadiumItem[];
const TRANSFERS: TransferItem[] = footballData.transfers as TransferItem[];
const PEAKS:     PeakItem[]     = (footballData as unknown as { peaks: PeakItem[] }).peaks;

// ─── Round types ────────────────────────────────────────────────────────────────
type RoundType = "trivia" | "stadium" | "transfer" | "peak";
type Screen    = "home" | "game" | "result";
type Mode      = "solo" | "multi";

interface TriviaRound   { type: "trivia";   question: string; options: string[]; correct: number; flagOptions?: boolean; }
interface StadiumRound  { type: "stadium";  name: string; city: string; capacity: number; options: string[]; correct: number; wiki?: string; }
interface TransferRound { type: "transfer"; player: string; from: string; to: string; year: number; flag: string; fee_m: number; wiki?: string; flagCode?: string; }
interface PeakRound     { type: "peak";     player: string; club: string; season: number; goals: number; flag: string; wiki?: string; flagCode?: string; }

type Round = TriviaRound | StadiumRound | TransferRound | PeakRound;

type RoundEntry =
  | { type: "trivia";   round: number; question: string; options: string[]; chosen: number; correct: number; points: number; }
  | { type: "stadium";  round: number; name: string;     options: string[]; chosen: number; correct: number; points: number; }
  | { type: "transfer"; round: number; player: string; guess_m: number; fee_m: number; points: number; accuracy: number; }
  | { type: "peak";     round: number; player: string; guess: number; season: number; goals: number; points: number; diff: number; };

// ─── Constants ──────────────────────────────────────────────────────────────────
const TOTAL       = 8;
const MAX_PTS     = 100;
const MAX_TOTAL   = TOTAL * MAX_PTS; // 1000
const ANSWER_TIME = 12;
const NEXT_TIME   = 3;
const FEE_MAX     = 250;
const PEAK_MIN    = 1990;
const PEAK_MAX    = 2024;

// trivia×2, transfer×2, stadium×2, peak×2
const ROUND_TYPES: RoundType[] = [
  "trivia",   "transfer", "peak",
  "stadium",  "transfer", "trivia",
  "peak",     "stadium",
];

// ─── Helpers ────────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithRng<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function computeTransferScore(guess: number, actual: number): { points: number; accuracy: number } {
  const diff = Math.abs(guess - actual);
  const ratio = diff / actual;
  const accuracy = Math.max(0, Math.round((1 - ratio) * 100));
  let points = 0;
  if      (ratio <= 0.05) points = MAX_PTS;
  else if (ratio <= 0.15) points = Math.round(MAX_PTS * 0.75);
  else if (ratio <= 0.30) points = Math.round(MAX_PTS * 0.50);
  else if (ratio <= 0.50) points = Math.round(MAX_PTS * 0.25);
  return { points, accuracy };
}

function computePeakScore(guess: number, actual: number): { points: number; diff: number } {
  const diff = Math.abs(guess - actual);
  const points = diff === 0 ? MAX_PTS : diff === 1 ? Math.round(MAX_PTS * 0.75) : diff === 2 ? Math.round(MAX_PTS * 0.50) : diff === 3 ? Math.round(MAX_PTS * 0.25) : 0;
  return { points, diff };
}

function seasonLabel(year: number): string {
  return `${year}-${String(year + 1).slice(2)}`;
}

function gradeLabel(pts: number): string {
  const p = pts / MAX_TOTAL;
  if (p >= 0.9)  return "🌟 Legendary";
  if (p >= 0.75) return "🔥 Expert";
  if (p >= 0.55) return "👍 Solid";
  if (p >= 0.35) return "😅 Beginner";
  return "😬 Need more training";
}

function generateRounds(seed?: number): Round[] {
  const doShuffle = <T,>(arr: T[], offset: number): T[] =>
    seed !== undefined ? seededShuffle(arr, seed + offset) : shuffle(arr);

  const rng       = seed !== undefined ? mulberry32(seed + 999) : Math.random.bind(Math);
  const trivia    = doShuffle([...TRIVIA],    0).slice(0, 2);
  const stadiums  = doShuffle([...STADIUMS],  1).slice(0, 2);
  const transfers = doShuffle([...TRANSFERS], 2).slice(0, 2);
  const peaks     = doShuffle([...PEAKS],     3).slice(0, 2);

  let ti = 0, sti = 0, tri_i = 0, pi = 0;

  return ROUND_TYPES.map(type => {
    if (type === "trivia") {
      const t = trivia[ti++];
      return { type: "trivia", question: t.question, options: t.options, correct: t.correct, flagOptions: t.flagOptions };
    }
    if (type === "stadium") {
      const s = stadiums[sti++];
      const allOpts = [s.team, ...s.options];
      const shuffled = shuffleWithRng(allOpts, rng);
      const correct = shuffled.indexOf(s.team);
      return { type: "stadium", name: s.name, city: s.city, capacity: s.capacity, options: shuffled, correct, wiki: s.wiki };
    }
    if (type === "transfer") {
      const t = transfers[tri_i++];
      return { type: "transfer", player: t.player, from: t.from, to: t.to, year: t.year, flag: t.flag, fee_m: t.fee_m, wiki: t.wiki, flagCode: t.flagCode };
    }
    // peak
    const p = peaks[pi++];
    return { type: "peak", player: p.player, club: p.club, season: p.season, goals: p.goals, flag: p.flag, wiki: p.wiki, flagCode: p.flagCode };
  });
}

// ─── Round themes & flag map ─────────────────────────────────────────────────────
const ROUND_THEMES = {
  trivia:   { emoji: "🧠", label: "Football Trivia", rgb: [100, 160, 255] as [number, number, number] },
  stadium:  { emoji: "🏟️", label: "Stadium",          rgb: [100, 210, 130] as [number, number, number] },
  transfer: { emoji: "💸", label: "Transfer Fee",     rgb: [255, 165, 50]  as [number, number, number] },
  peak:     { emoji: "📈", label: "Peak Season",      rgb: [180, 100, 255] as [number, number, number] },
} as const;

const COUNTRY_FLAG_CODES: Record<string, string> = {
  "France": "fr", "Croatia": "hr", "Argentina": "ar", "Morocco": "ma",
  "Belgium": "be", "England": "gb-eng", "Brazil": "br", "Netherlands": "nl",
  "Germany": "de", "Spain": "es", "Portugal": "pt", "Italy": "it",
  "Denmark": "dk", "Wales": "gb-wls", "Senegal": "sn", "Turkey": "tr",
  "Uruguay": "uy", "Colombia": "co", "Russia": "ru", "South Korea": "kr",
};

const BANNER_SCATTER = [
  { x: 6,  y: 18, s: "18px", o: 0.08, r: 15  },
  { x: 16, y: 68, s: "22px", o: 0.09, r: -20 },
  { x: 30, y: 12, s: "14px", o: 0.06, r: 30  },
  { x: 46, y: 78, s: "20px", o: 0.07, r: -10 },
  { x: 60, y: 8,  s: "16px", o: 0.07, r: 25  },
  { x: 74, y: 72, s: "14px", o: 0.06, r: -35 },
  { x: 84, y: 22, s: "22px", o: 0.09, r: 10  },
  { x: 93, y: 58, s: "18px", o: 0.08, r: -25 },
  { x: 52, y: 42, s: "16px", o: 0.05, r: 20  },
  { x: 38, y: 52, s: "20px", o: 0.06, r: -15 },
];

function TypeBanner({ type, question }: { type: RoundType; question?: string }) {
  const { emoji, label, rgb } = ROUND_THEMES[type];
  const [r, g, b] = rgb;
  return (
    <div className="ft-type-banner" style={{
      borderBottom: `1px solid rgba(${r},${g},${b},0.25)`,
      background: `linear-gradient(135deg, rgba(${r},${g},${b},0.14) 0%, rgba(${r},${g},${b},0.04) 100%)`,
    }}>
      {BANNER_SCATTER.map((p, i) => (
        <span key={i} aria-hidden="true" style={{
          position: "absolute", left: `${p.x}%`, top: `${p.y}%`,
          fontSize: p.s, opacity: p.o, transform: `rotate(${p.r}deg)`,
          pointerEvents: "none", userSelect: "none", lineHeight: 1,
        }}>{emoji}</span>
      ))}
      <div className="ft-type-banner__top">
        <span className="ft-type-banner__emoji">{emoji}</span>
        <span className="ft-type-banner__label" style={{ color: `rgb(${r},${g},${b})`, textShadow: `0 0 16px rgba(${r},${g},${b},0.5)` }}>
          {label}
        </span>
      </div>
      {question && <div className="ft-type-banner__question">{question}</div>}
    </div>
  );
}

// ─── Wikipedia image hook ────────────────────────────────────────────────────────
const wikiImgCache = new Map<string, string>();

function useWikiImage(title: string | undefined, gameKey?: GameKey): string | null {
  const [src, setSrc] = useState<string | null>(
    (gameKey && title ? getCustomImage(gameKey, title) : null) ??
    (title && wikiImgCache.has(title) ? wikiImgCache.get(title)! : null)
  );
  useEffect(() => {
    if (!title) return;
    let cancelled = false;
    (async () => {
      await ensureCustomImages();
      if (cancelled) return;
      if (gameKey) {
        const custom = getCustomImage(gameKey, title);
        if (custom) { setSrc(custom); return; }
      }
      if (wikiImgCache.has(title)) { setSrc(wikiImgCache.get(title)!); return; }
      try {
        const data = await (await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=400&origin=*`
        )).json();
        if (cancelled) return;
        const pages = data?.query?.pages as Record<string, { thumbnail?: { source: string } }> | undefined;
        const page = Object.values(pages ?? {})[0];
        if (page?.thumbnail?.source) {
          wikiImgCache.set(title, page.thumbnail.source);
          setSrc(page.thumbnail.source);
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [title, gameKey]);
  return src;
}

function WikiImg({ title, alt, className, gameKey }: { title?: string; alt: string; className?: string; gameKey?: GameKey }) {
  const src = useWikiImage(title, gameKey);
  if (!src) return <div className={`ft-img-placeholder ${className ?? ""}`} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} loading="lazy" />;
}

function FlagImg({ code, alt }: { code?: string; alt: string }) {
  if (!code) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`https://flagcdn.com/w80/${code}.png`} alt={alt} className="ft-flag-img" loading="lazy" />;
}

// ─── Stars ──────────────────────────────────────────────────────────────────────
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

// ─── ProgressBar ────────────────────────────────────────────────────────────────
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

// ─── AnswerTimer ────────────────────────────────────────────────────────────────
function AnswerTimer({ timeLeft, total }: { timeLeft: number; total: number }) {
  const urgent = timeLeft <= 3;
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

// ─── FeeSlider ──────────────────────────────────────────────────────────────────
function FeeSlider({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pos = value / FEE_MAX;

  const getNewValue = useCallback((clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const p = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onChange(Math.round(p * FEE_MAX));
  }, [onChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    getNewValue(e.clientX);
    const onMove = (ev: MouseEvent) => getNewValue(ev.clientX);
    const onUp   = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    getNewValue(e.touches[0].clientX);
    const onMove = (ev: TouchEvent) => getNewValue(ev.touches[0].clientX);
    const onEnd  = () => { window.removeEventListener("touchmove", onMove); window.removeEventListener("touchend", onEnd); };
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onEnd);
  };

  return (
    <div className="pop-slider">
      <div ref={trackRef} onMouseDown={handleMouseDown} onTouchStart={handleTouchStart}
        className={`pop-slider__track ${disabled ? "pop-slider__track--disabled" : "pop-slider__track--active"}`}>
        <div className="pop-slider__fill" style={{ width: `${pos * 100}%`, transition: disabled ? "none" : "width 0.05s" }} />
        <div className={`pop-slider__thumb ${disabled ? "pop-slider__thumb--disabled" : "pop-slider__thumb--active"}`}
          style={{ left: `${pos * 100}%` }} />
      </div>
      <div className="pop-slider__ticks">
        {[0, 50, 100, 150, 200, 250].map(t => (
          <div key={t} className="pop-slider__tick" style={{ left: `${(t / FEE_MAX) * 100}%` }}>€{t}M</div>
        ))}
      </div>
    </div>
  );
}

// ─── PeakSlider ─────────────────────────────────────────────────────────────────
function PeakSlider({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pos = (value - PEAK_MIN) / (PEAK_MAX - PEAK_MIN);

  const getNewValue = useCallback((clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const p = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onChange(Math.round(p * (PEAK_MAX - PEAK_MIN)) + PEAK_MIN);
  }, [onChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    getNewValue(e.clientX);
    const onMove = (ev: MouseEvent) => getNewValue(ev.clientX);
    const onUp   = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    getNewValue(e.touches[0].clientX);
    const onMove = (ev: TouchEvent) => getNewValue(ev.touches[0].clientX);
    const onEnd  = () => { window.removeEventListener("touchmove", onMove); window.removeEventListener("touchend", onEnd); };
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onEnd);
  };

  return (
    <div className="pop-slider">
      <div ref={trackRef} onMouseDown={handleMouseDown} onTouchStart={handleTouchStart}
        className={`pop-slider__track ${disabled ? "pop-slider__track--disabled" : "pop-slider__track--active"}`}>
        <div className="pop-slider__fill" style={{ width: `${pos * 100}%`, transition: disabled ? "none" : "width 0.05s" }} />
        <div className={`pop-slider__thumb ${disabled ? "pop-slider__thumb--disabled" : "pop-slider__thumb--active"}`}
          style={{ left: `${pos * 100}%` }} />
      </div>
      <div className="pop-slider__ticks">
        {[1990, 1995, 2000, 2005, 2010, 2015, 2020].map(y => (
          <div key={y} className="pop-slider__tick" style={{ left: `${((y - PEAK_MIN) / (PEAK_MAX - PEAK_MIN)) * 100}%` }}>{y}</div>
        ))}
      </div>
    </div>
  );
}

// ─── MCQOptions ─────────────────────────────────────────────────────────────────
function MCQOptions({ options, chosen, correct, onChoice, flagOptions }: {
  options: string[];
  chosen: number | null;
  correct: number;
  onChoice: (i: number) => void;
  flagOptions?: boolean;
}) {
  return (
    <div className="ft-options-grid">
      {options.map((opt, i) => {
        let cls = "ft-option";
        if (chosen !== null) {
          if (i === correct)                          cls += " ft-option--correct";
          else if (i === chosen && chosen !== correct) cls += " ft-option--wrong";
          else                                         cls += " ft-option--disabled";
        }
        const flagCode = flagOptions ? COUNTRY_FLAG_CODES[opt] : undefined;
        return (
          <button key={i} className={cls} onClick={() => chosen === null && onChoice(i)} disabled={chosen !== null}>
            <span className="ft-option__letter">{String.fromCharCode(65 + i)}</span>
            {flagCode && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`https://flagcdn.com/w40/${flagCode}.png`} alt="" className="ft-option__flag" loading="lazy" />
            )}
            <span className="ft-option__text">{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── FeedbackRow ─────────────────────────────────────────────────────────────────
function FeedbackRow({ correct, points, canNext, onNext, isLastRound, nextCountdown, isWaiting, mode }: {
  correct: boolean;
  points: number;
  canNext: boolean;
  onNext: () => void;
  isLastRound: boolean;
  nextCountdown: number | null;
  isWaiting: boolean;
  mode: "solo" | "multi";
}) {
  return (
    <div className={`ft-feedback-row ft-feedback-row--${correct ? "correct" : "wrong"}`}>
      <span className="ft-feedback-row__text">
        {correct ? `✓ Correct! +${points}` : "✗ Wrong! +0"}
      </span>
      {isWaiting && mode === "multi" && (
        <span className="ft-feedback-row__waiting"><span className="waiting-dot" />Waiting…</span>
      )}
      {canNext && (
        <button onClick={onNext} className="ft-feedback-row__btn">
          {isLastRound ? "Results →" : nextCountdown !== null ? `Next (${nextCountdown}s)` : "Next →"}
        </button>
      )}
    </div>
  );
}

// ─── ResultCard ─────────────────────────────────────────────────────────────────
function FtResultCard({ entry }: { entry: RoundEntry }) {
  if (entry.type === "trivia") {
    const correct = entry.chosen === entry.correct;
    const color   = correct ? "#00ffa0" : "#ff6b6b";
    return (
      <div className="result-card">
        <div className="result-card__body" style={{ flex: 1 }}>
          <div className="result-card__title-row">
            <span className="ft-result-badge ft-result-badge--trivia">Trivia</span>
            <span className="result-card__city-name" style={{ fontSize: 13 }}>{entry.question}</span>
          </div>
          <div className="result-card__stats">
            {correct ? "✓ " : "✗ "}{entry.options[entry.correct]}
          </div>
        </div>
        <div className="result-card__score">
          <div className="result-card__points" style={{ color }}>{entry.points}</div>
          <div className="result-card__pts-label">pts</div>
        </div>
      </div>
    );
  }

  if (entry.type === "stadium") {
    const correct = entry.chosen === entry.correct;
    const color   = correct ? "#00ffa0" : "#ff6b6b";
    return (
      <div className="result-card">
        <div className="result-card__body" style={{ flex: 1 }}>
          <div className="result-card__title-row">
            <span className="ft-result-badge ft-result-badge--stadium">Stadium</span>
            <span className="result-card__city-name" style={{ fontSize: 13 }}>{entry.name}</span>
          </div>
          <div className="result-card__stats">
            {correct ? "✓ " : "✗ "}{entry.options[entry.correct]}
          </div>
        </div>
        <div className="result-card__score">
          <div className="result-card__points" style={{ color }}>{entry.points}</div>
          <div className="result-card__pts-label">pts</div>
        </div>
      </div>
    );
  }

  if (entry.type === "transfer") {
    const color = entry.accuracy >= 85 ? "#00ffa0" : entry.accuracy >= 60 ? "#f0c040" : "#ff6b6b";
    return (
      <div className="result-card">
        <div className="result-card__body" style={{ flex: 1 }}>
          <div className="result-card__title-row">
            <span className="ft-result-badge ft-result-badge--transfer">Transfer</span>
            <span className="result-card__city-name" style={{ fontSize: 13 }}>{entry.player}</span>
          </div>
          <div className="result-card__stats">
            Actual: <span className="result-card__actual">€{entry.fee_m}M</span>
            {" · "}Guess: <span style={{ color }}>€{entry.guess_m}M</span>
          </div>
        </div>
        <div className="result-card__score">
          <div className="result-card__points" style={{ color }}>{entry.points}</div>
          <div className="result-card__pts-label">pts</div>
        </div>
      </div>
    );
  }

  if (entry.type === "peak") {
    const color = entry.diff === 0 ? "#00ffa0" : entry.diff <= 2 ? "#f0c040" : "#ff6b6b";
    return (
      <div className="result-card">
        <div className="result-card__body" style={{ flex: 1 }}>
          <div className="result-card__title-row">
            <span className="ft-result-badge ft-result-badge--peak">Peak</span>
            <span className="result-card__city-name" style={{ fontSize: 13 }}>{entry.player}</span>
          </div>
          <div className="result-card__stats">
            Peak: <span className="result-card__actual">{seasonLabel(entry.season)}</span>
            {" · "}Guess: <span style={{ color }}>{seasonLabel(entry.guess)}</span>
          </div>
        </div>
        <div className="result-card__score">
          <div className="result-card__points" style={{ color }}>{entry.points}</div>
          <div className="result-card__pts-label">pts</div>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Main ───────────────────────────────────────────────────────────────────────
export default function Football() {
  const [screen, setScreen]             = useState<Screen>("home");
  const [mode, setMode]                 = useState<Mode>("solo");
  const [rounds, setRounds]             = useState<Round[]>([]);
  const [qNum, setQNum]                 = useState(1);
  const [chosen, setChosen]             = useState<number | null>(null);   // MCQ choice
  const [revealed, setRevealed]         = useState(false);                  // transfer/peak submitted
  const [feeGuess, setFeeGuess]         = useState(100);
  const [peakGuess, setPeakGuess]       = useState(2010);
  const [transferResult, setTransferResult] = useState<{ guess_m: number; points: number; accuracy: number } | null>(null);
  const [peakResult, setPeakResult]     = useState<{ guess: number; points: number; diff: number } | null>(null);
  const [totalScore, setTotalScore]     = useState(0);
  const [roundResults, setRoundResults] = useState<RoundEntry[]>([]);
  const [roundOver, setRoundOver]       = useState(false);
  const [multiWaiting, setMultiWaiting] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [answerTimeLeft, setAnswerTimeLeft] = useState<number | null>(null);
  const [nextCountdown, setNextCountdown]   = useState<number | null>(null);

  // Refs
  const roundsRef         = useRef<Round[]>([]);
  const answerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answerTimeoutRef  = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const nextIntervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextTimeoutRef    = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const chosenRef         = useRef<number | null>(null);
  const revealedRef       = useRef(false);
  const feeGuessRef       = useRef(100);
  const peakGuessRef      = useRef(2010);
  const qNumRef           = useRef(1);

  const currentRound = rounds[qNum - 1] ?? null;
  const isLastRound  = qNum >= TOTAL;
  const answered     = currentRound?.type === "transfer" || currentRound?.type === "peak" ? revealed : chosen !== null;
  const canClickNext = mode === "solo" ? answered : roundOver && !multiWaiting;

  // Keep refs in sync
  chosenRef.current  = chosen;
  revealedRef.current = revealed;
  feeGuessRef.current = feeGuess;
  peakGuessRef.current = peakGuess;
  qNumRef.current    = qNum;

  const clearTimers = useCallback(() => {
    clearInterval(answerIntervalRef.current!);
    clearTimeout(answerTimeoutRef.current!);
    answerIntervalRef.current = null;
    answerTimeoutRef.current  = null;
    setAnswerTimeLeft(null);
  }, []);

  const resetRound = useCallback(() => {
    setChosen(null); chosenRef.current = null;
    setRevealed(false); revealedRef.current = false;
    setFeeGuess(100); feeGuessRef.current = 100;
    setPeakGuess(2010); peakGuessRef.current = 2010;
    setTransferResult(null);
    setPeakResult(null);
    setRoundOver(false);
    setMultiWaiting(false);
  }, []);

  // ── Multiplayer callbacks ────────────────────────────────────────────────────
  const onMpGameStart = useCallback((seed: number) => {
    const newRounds = generateRounds(seed);
    roundsRef.current = newRounds;
    setRounds(newRounds);
    setQNum(1); qNumRef.current = 1;
    setTotalScore(0);
    setRoundResults([]);
    setChosen(null); chosenRef.current = null;
    setRevealed(false); revealedRef.current = false;
    setFeeGuess(100); feeGuessRef.current = 100;
    setPeakGuess(2010); peakGuessRef.current = 2010;
    setTransferResult(null);
    setPeakResult(null);
    setRoundOver(false);
    setMultiWaiting(false);
    setScreen("game");
  }, []);

  const onMpRoundEnd  = useCallback(() => { setRoundOver(true); }, []);

  const onMpNextRound = useCallback((round: number) => {
    setQNum(round + 1);
    setChosen(null); chosenRef.current = null;
    setRevealed(false); revealedRef.current = false;
    setFeeGuess(100); feeGuessRef.current = 100;
    setPeakGuess(2010); peakGuessRef.current = 2010;
    setTransferResult(null);
    setPeakResult(null);
    setRoundOver(false);
    setMultiWaiting(false);
  }, []);

  const onMpGameEnd = useCallback(() => { setScreen("result"); }, []);

  const mp = useMultiplayer({
    gameType: "football",
    host: getPartykitHost(),
    onGameStart:        onMpGameStart,
    onOpponentAnswered: useCallback(() => {}, []),
    onRoundEnd:         onMpRoundEnd,
    onNextRound:        onMpNextRound,
    onGameEnd:          onMpGameEnd,
  });

  // Record match outcome
  useEffect(() => {
    if (screen !== "result" || mode !== "multi" || !mp.opponent) return;
    const result = totalScore > mp.opponent.score ? "win" : totalScore < mp.opponent.score ? "loss" : "tie";
    recordMatch(mp.opponent.name, result);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // ── Answer timer (multi) ──────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== "multi" || screen !== "game") return;

    let timeLeft = ANSWER_TIME;
    setAnswerTimeLeft(timeLeft);
    answerIntervalRef.current = setInterval(() => { timeLeft--; setAnswerTimeLeft(timeLeft); }, 1000);

    answerTimeoutRef.current = setTimeout(() => {
      clearInterval(answerIntervalRef.current!);
      answerIntervalRef.current = null;
      setAnswerTimeLeft(0);

      const round = roundsRef.current[qNumRef.current - 1];
      if (!round) return;

      if (round.type === "transfer") {
        if (revealedRef.current) return;
        revealedRef.current = true;
        setRevealed(true);
        setTransferResult({ guess_m: feeGuessRef.current, points: 0, accuracy: 0 });
        setRoundResults(prev => [...prev, {
          type: "transfer", round: qNumRef.current,
          player: round.player, guess_m: feeGuessRef.current, fee_m: round.fee_m, points: 0, accuracy: 0,
        }]);
        mp.submitAnswer(feeGuessRef.current, 0);
      } else if (round.type === "peak") {
        if (revealedRef.current) return;
        revealedRef.current = true;
        setRevealed(true);
        setPeakResult({ guess: peakGuessRef.current, points: 0, diff: Math.abs(peakGuessRef.current - round.season) });
        setRoundResults(prev => [...prev, {
          type: "peak", round: qNumRef.current,
          player: round.player, guess: peakGuessRef.current, season: round.season, goals: round.goals, points: 0, diff: Math.abs(peakGuessRef.current - round.season),
        }]);
        mp.submitAnswer(peakGuessRef.current, 0);
      } else {
        if (chosenRef.current !== null) return;
        const wrongChoice = round.correct === 0 ? 1 : 0;
        chosenRef.current = wrongChoice;
        setChosen(wrongChoice);
        if (round.type === "trivia") {
          setRoundResults(prev => [...prev, { type: "trivia", round: qNumRef.current, question: round.question, options: round.options, chosen: wrongChoice, correct: round.correct, points: 0 }]);
        } else if (round.type === "stadium") {
          setRoundResults(prev => [...prev, { type: "stadium", round: qNumRef.current, name: round.name, options: round.options, chosen: wrongChoice, correct: round.correct, points: 0 }]);
        }
        mp.submitAnswer(-1, 0);
      }
    }, ANSWER_TIME * 1000);

    return () => {
      clearInterval(answerIntervalRef.current!);
      clearTimeout(answerTimeoutRef.current!);
      answerIntervalRef.current = null;
      answerTimeoutRef.current  = null;
      setAnswerTimeLeft(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, screen, qNum]);

  // ── Next-round countdown (multi) ─────────────────────────────────────────────
  useEffect(() => {
    if (!roundOver || mode !== "multi") return;
    let countdown = NEXT_TIME;
    setNextCountdown(countdown);
    nextIntervalRef.current = setInterval(() => { countdown--; setNextCountdown(countdown); }, 1000);
    nextTimeoutRef.current  = setTimeout(() => {
      clearInterval(nextIntervalRef.current!);
      nextIntervalRef.current = null;
      setNextCountdown(null);
      setMultiWaiting(prev => { if (!prev) mp.readyForNext(); return true; });
    }, NEXT_TIME * 1000);
    return () => {
      clearInterval(nextIntervalRef.current!);
      clearTimeout(nextTimeoutRef.current!);
      nextIntervalRef.current = null;
      nextTimeoutRef.current  = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundOver]);

  // ── Game actions ─────────────────────────────────────────────────────────────
  const startSolo = useCallback(() => {
    setMode("solo");
    const newRounds = generateRounds();
    roundsRef.current = newRounds;
    setRounds(newRounds);
    setQNum(1); qNumRef.current = 1;
    setTotalScore(0);
    setRoundResults([]);
    resetRound();
    setScreen("game");
  }, [resetRound]);

  const startMulti = () => { mp.disconnect(); setMode("multi"); setShowNamePrompt(true); };

  const handleNewOpponent = () => { mp.disconnect(); setMode("multi"); setScreen("home"); setShowNamePrompt(true); };
  const handleBackToMenu  = () => { mp.disconnect(); setMode("solo");  setScreen("home"); };

  const handleMCQChoice = (i: number) => {
    if (chosen !== null || !currentRound) return;
    const cr = currentRound;
    if (cr.type !== "trivia" && cr.type !== "stadium") return;
    clearTimers();
    const correct = i === cr.correct;
    const pts     = correct ? MAX_PTS : 0;
    setChosen(i); chosenRef.current = i;
    if (correct) setTotalScore(s => s + MAX_PTS);
    if (cr.type === "trivia") {
      setRoundResults(prev => [...prev, { type: "trivia", round: qNum, question: cr.question, options: cr.options, chosen: i, correct: cr.correct, points: pts }]);
    } else {
      setRoundResults(prev => [...prev, { type: "stadium", round: qNum, name: cr.name, options: cr.options, chosen: i, correct: cr.correct, points: pts }]);
    }
    if (mode === "multi") mp.submitAnswer(i, pts);
  };


  const handleTransferSubmit = () => {
    if (revealed || !currentRound || currentRound.type !== "transfer") return;
    clearTimers();
    const { points, accuracy } = computeTransferScore(feeGuessRef.current, currentRound.fee_m);
    setRevealed(true); revealedRef.current = true;
    setTransferResult({ guess_m: feeGuessRef.current, points, accuracy });
    setTotalScore(s => s + points);
    setRoundResults(prev => [...prev, {
      type: "transfer", round: qNum, player: currentRound.player,
      guess_m: feeGuessRef.current, fee_m: currentRound.fee_m, points, accuracy,
    }]);
    if (mode === "multi") mp.submitAnswer(feeGuessRef.current, points);
  };

  const handlePeakSubmit = () => {
    if (revealed || !currentRound || currentRound.type !== "peak") return;
    clearTimers();
    const { points, diff } = computePeakScore(peakGuessRef.current, currentRound.season);
    setRevealed(true); revealedRef.current = true;
    setPeakResult({ guess: peakGuessRef.current, points, diff });
    setTotalScore(s => s + points);
    setRoundResults(prev => [...prev, {
      type: "peak", round: qNum, player: currentRound.player,
      guess: peakGuessRef.current, season: currentRound.season, goals: currentRound.goals, points, diff,
    }]);
    if (mode === "multi") mp.submitAnswer(peakGuessRef.current, points);
  };

  const handleNext = () => {
    if (mode === "multi") {
      clearInterval(nextIntervalRef.current!);
      clearTimeout(nextTimeoutRef.current!);
      nextIntervalRef.current = null;
      nextTimeoutRef.current  = null;
      setNextCountdown(null);
      setMultiWaiting(true);
      mp.readyForNext();
      return;
    }
    if (isLastRound) { setScreen("result"); return; }
    setQNum(n => n + 1);
    resetRound();
  };

  // ── Result helpers ────────────────────────────────────────────────────────────
  const pct           = totalScore / MAX_TOTAL;
  const scoreBarGrade = pct >= 0.75 ? "excellent" : pct >= 0.5 ? "good" : "poor";
  const myCircleClass  = mode === "multi" && mp.opponent
    ? totalScore > mp.opponent.score ? "score-circle--win" : "score-circle--neutral"
    : "score-circle--solo";
  const oppCircleClass = mode === "multi" && mp.opponent
    ? mp.opponent.score > totalScore ? "score-circle--win" : "score-circle--lose" : "";
  const myValueColor  = mode === "multi" && mp.opponent
    ? totalScore > mp.opponent.score ? "score-circle__value--green" : "score-circle__value--gold"
    : "score-circle__value--gold";
  const oppValueColor = mode === "multi" && mp.opponent
    ? mp.opponent.score > totalScore ? "score-circle__value--green" : "score-circle__value--red" : "";

  // Feedback row state
  const feedbackCorrect =
    currentRound?.type === "trivia" || currentRound?.type === "stadium"
      ? chosen === (currentRound as { correct: number }).correct
      : false; // transfer and peak use inline reveal, not FeedbackRow
  const feedbackIsWaiting = mode === "multi" && answered && (!roundOver || multiWaiting);

  // ── Render ────────────────────────────────────────────────────────────────────
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

      <div className="game-wrapper">
        <Stars />
        <div className="glow-orb glow-orb--purple" />
        <div className="glow-orb glow-orb--orange" />

        {/* ── HOME ───────────────────────────────────────────────────────────── */}
        {screen === "home" && (
          <div className="home-screen">
            <div className="home-emoji">⚽</div>
            <h1 className="home-title">
              Football<span className="accent">Quiz</span>
            </h1>
            <p className="home-subtitle">Trivia, stadiums, transfers & peak seasons</p>

            <div className="how-it-works">
              <div className="how-it-works__title">How it works</div>
              {[
                ["🧠", "Trivia: 4-choice football culture questions"],
                ["🏟️", "Stadium: which club plays here?"],
                ["💸", "Transfer: guess the transfer fee (slider)"],
                ["📈", "Peak Season: guess a player's best scoring season"],
              ].map(([icon, text]) => (
                <div key={text as string} className="how-it-works__item">
                  <span className="how-it-works__icon">{icon}</span>
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

        {/* ── GAME ───────────────────────────────────────────────────────────── */}
        {screen === "game" && currentRound && (
          <div className="ft-container">
            {mode === "multi" && mp.opponent && (
              <OpponentBar opponent={mp.opponent} myScore={totalScore} maxScore={MAX_TOTAL} />
            )}

            <ProgressBar current={qNum} total={TOTAL} score={totalScore} />

            {mode === "multi" && answerTimeLeft !== null && !answered && (
              <AnswerTimer timeLeft={answerTimeLeft} total={ANSWER_TIME} />
            )}

            {/* ── Trivia ───────────────────────────────────────────────────── */}
            {currentRound.type === "trivia" && (
              <div className="ft-question-card">
                <TypeBanner type="trivia" question={currentRound.question} />
                <MCQOptions
                  options={currentRound.options}
                  chosen={chosen}
                  correct={currentRound.correct}
                  onChoice={handleMCQChoice}
                  flagOptions={currentRound.flagOptions}
                />
              </div>
            )}

            {/* ── Stadium ──────────────────────────────────────────────────── */}
            {currentRound.type === "stadium" && (
              <div className="ft-question-card">
                <TypeBanner type="stadium" question="Which club calls this stadium home?" />
                <div className="ft-stadium-img-wrap">
                  <WikiImg title={currentRound.wiki} alt={currentRound.name} className="ft-stadium-img" gameKey="football_stadiums" />
                </div>
                <div className="ft-stadium-header">
                  <div className="ft-stadium-name">{currentRound.name}</div>
                  <div className="ft-stadium-details">
                    <span>👥 {currentRound.capacity.toLocaleString()} seats</span>
                  </div>
                </div>
                <MCQOptions
                  options={currentRound.options}
                  chosen={chosen}
                  correct={currentRound.correct}
                  onChoice={handleMCQChoice}
                />
              </div>
            )}

            {/* ── Transfer ─────────────────────────────────────────────────── */}
            {currentRound.type === "transfer" && (
              <div className="ft-transfer-card">
                <TypeBanner type="transfer" question="How much did this transfer cost?" />
                <div className="ft-player-hero">
                  <WikiImg title={currentRound.wiki} alt={currentRound.player} className="ft-player-img" gameKey="football_players" />
                  <div className="ft-player-hero__info">
                    <div className="ft-transfer-player">
                      <FlagImg code={currentRound.flagCode} alt={currentRound.player} />
                      <span className="ft-transfer-name">{currentRound.player}</span>
                      <span className="ft-transfer-year">({currentRound.year})</span>
                    </div>
                    <div className="ft-transfer-move">
                      <span className="ft-transfer-club">{currentRound.from}</span>
                      <span className="ft-transfer-arrow">→</span>
                      <span className="ft-transfer-club">{currentRound.to}</span>
                    </div>
                  </div>
                </div>

                {!revealed && (
                  <>
                    <div className="ft-fee-display">€{feeGuess}M</div>
                    <FeeSlider value={feeGuess} onChange={v => { setFeeGuess(v); feeGuessRef.current = v; }} disabled={false} />
                    <button onClick={handleTransferSubmit} className="btn-submit btn-hover-sm">Submit Guess</button>
                  </>
                )}

                {revealed && transferResult && (
                  <div className="reveal-section">
                    <div className="actual-pop-box">
                      <div className="actual-pop-box__label">💰 Actual Transfer Fee</div>
                      <div className="actual-pop-box__value">€{currentRound.fee_m}M</div>
                    </div>
                    <div className="guess-box">
                      <span className="guess-box__label">Your guess</span>
                      <span className="guess-box__value">€{transferResult.guess_m}M</span>
                    </div>

                    {transferResult.points === 0 && transferResult.accuracy === 0 ? (
                      <div className="accuracy-points">
                        <div className="accuracy-points__stat">
                          <div className="accuracy-points__label">Result</div>
                          <div className="accuracy-points__value" style={{ color: "#ff6b6b" }}>Time&apos;s up!</div>
                        </div>
                        <div className="accuracy-points__divider" />
                        <div className="accuracy-points__stat">
                          <div className="accuracy-points__label">Points</div>
                          <div className="accuracy-points__value" style={{ color: "#ff6b6b" }}>+0</div>
                        </div>
                      </div>
                    ) : (
                      <div className="accuracy-points">
                        <div className="accuracy-points__stat">
                          <div className="accuracy-points__label">Accuracy</div>
                          <div className="accuracy-points__value" style={{
                            color: transferResult.accuracy >= 85 ? "#00ffa0" : transferResult.accuracy >= 60 ? "#f0c040" : "#ff6b6b"
                          }}>{transferResult.accuracy}%</div>
                        </div>
                        <div className="accuracy-points__divider" />
                        <div className="accuracy-points__stat">
                          <div className="accuracy-points__label">Points</div>
                          <div className="accuracy-points__value" style={{
                            color: transferResult.accuracy >= 85 ? "#00ffa0" : transferResult.accuracy >= 60 ? "#f0c040" : "#ff6b6b"
                          }}>+{transferResult.points}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Peak Season ──────────────────────────────────────────────── */}
            {currentRound.type === "peak" && (
              <div className="ft-transfer-card">
                <TypeBanner type="peak" question={`In which season did ${currentRound.player} score the most goals?`} />
                <div className="ft-player-hero">
                  <WikiImg title={currentRound.wiki} alt={currentRound.player} className="ft-player-img" gameKey="football_players" />
                  <div className="ft-player-hero__info">
                    <div className="ft-transfer-player">
                      <FlagImg code={currentRound.flagCode} alt={currentRound.player} />
                      <span className="ft-transfer-name">{currentRound.player}</span>
                    </div>
                    <div className="ft-transfer-move">
                      <span className="ft-transfer-club">{currentRound.club}</span>
                    </div>
                  </div>
                </div>

                {!revealed && (
                  <>
                    <div className="ft-fee-display">{seasonLabel(peakGuess)}</div>
                    <PeakSlider value={peakGuess} onChange={v => { setPeakGuess(v); peakGuessRef.current = v; }} disabled={false} />
                    <button onClick={handlePeakSubmit} className="btn-submit btn-hover-sm">Submit Guess</button>
                  </>
                )}

                {revealed && peakResult && (
                  <div className="reveal-section">
                    <div className="actual-pop-box">
                      <div className="actual-pop-box__label">📈 Peak Season</div>
                      <div className="actual-pop-box__value">{seasonLabel(currentRound.season)}</div>
                    </div>
                    <div className="guess-box">
                      <span className="guess-box__label">Goals that season</span>
                      <span className="guess-box__value">{currentRound.goals} goals</span>
                    </div>
                    <div className="accuracy-points">
                      <div className="accuracy-points__stat">
                        <div className="accuracy-points__label">Your guess</div>
                        <div className="accuracy-points__value" style={{
                          color: peakResult.diff === 0 ? "#00ffa0" : peakResult.diff <= 2 ? "#f0c040" : "#ff6b6b"
                        }}>{seasonLabel(peakResult.guess)}</div>
                      </div>
                      <div className="accuracy-points__divider" />
                      <div className="accuracy-points__stat">
                        <div className="accuracy-points__label">Points</div>
                        <div className="accuracy-points__value" style={{
                          color: peakResult.diff === 0 ? "#00ffa0" : peakResult.diff <= 2 ? "#f0c040" : "#ff6b6b"
                        }}>+{peakResult.points}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* FeedbackRow for MCQ rounds (trivia / stadium) */}
            {answered && currentRound.type !== "transfer" && currentRound.type !== "peak" && (
              <FeedbackRow
                correct={feedbackCorrect}
                points={feedbackCorrect ? MAX_PTS : 0}
                canNext={canClickNext}
                onNext={handleNext}
                isLastRound={isLastRound}
                nextCountdown={nextCountdown}
                isWaiting={feedbackIsWaiting}
                mode={mode}
              />
            )}

            {/* Next button for transfer / peak rounds */}
            {(currentRound.type === "transfer" || currentRound.type === "peak") && revealed && (canClickNext || feedbackIsWaiting) && (
              <div className="ft-feedback-row ft-feedback-row--transfer">
                {feedbackIsWaiting && (
                  <span className="ft-feedback-row__waiting"><span className="waiting-dot" />Waiting…</span>
                )}
                {canClickNext && (
                  <button onClick={handleNext} className="ft-feedback-row__btn">
                    {isLastRound ? "Results →" : nextCountdown !== null ? `Next (${nextCountdown}s)` : "Next →"}
                  </button>
                )}
              </div>
            )}

          </div>
        )}

        {/* ── RESULT ─────────────────────────────────────────────────────────── */}
        {screen === "result" && (
          <div className="citymix-result-screen">
            <div className="result-emoji--pop">
              {pct >= 0.75 ? "🏆" : pct >= 0.5 ? "⚽" : "😅"}
            </div>
            <h1 className="result-title--pop">
              {mode === "multi" ? "Results" : "Final Score"}
            </h1>

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
                ? totalScore > mp.opponent.score ? "🏆 You won!"
                  : totalScore < mp.opponent.score ? "😅 You lost…"
                  : "🤝 It's a tie!"
                : gradeLabel(totalScore)}
            </div>

            {mode === "solo" && (
              <div className="result-score-bar result-score-bar--popguessr">
                <div className={`result-score-bar__fill result-score-bar__fill--${scoreBarGrade}`}
                  style={{ width: `${pct * 100}%` }} />
              </div>
            )}

            <div className="round-breakdown">
              <div className="round-breakdown__header">Round Breakdown</div>
              <div className="round-breakdown__list">
                {roundResults.map((entry, i) => <FtResultCard key={i} entry={entry} />)}
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
                {mp.myWantsRematch ? (
                  <div className="waiting-indicator"><span className="waiting-dot" />Waiting for opponent…</div>
                ) : (
                  <button onClick={mp.requestRematch} className="btn-rematch btn-hover">⚡ Rematch</button>
                )}
              </div>
            )}

            {mode === "multi" && mp.opponent ? (
              <div className="result-buttons--pop">
                <button onClick={handleNewOpponent} className="btn-result-outline btn-hover-sm">🔄 New Opponent</button>
                <button onClick={handleBackToMenu}  className="btn-result-ghost  btn-hover-sm">← Menu</button>
              </div>
            ) : (
              <div className="result-buttons--pop">
                <button onClick={startSolo}  className="btn-result-primary btn-hover-sm">Play Solo</button>
                {isMultiplayerEnabled() && <button onClick={startMulti} className="btn-result-outline btn-hover-sm">⚡ Multiplayer</button>}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
