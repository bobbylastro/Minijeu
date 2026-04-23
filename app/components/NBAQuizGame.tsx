"use client";
import { memo, useState, useCallback, useEffect, useRef } from "react";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { seededShuffle } from "@/lib/seededRandom";
import { getPartykitHost, isMultiplayerEnabled } from "@/lib/partykitHost";
import { recordMatch } from "@/lib/matchHistory";
import RematchZone from "@/components/RematchZone";
import { useRatingSubmit } from "@/hooks/useRatingSubmit";
import MultiplayerScreen from "@/components/MultiplayerScreen";
import OpponentBar from "@/components/OpponentBar";
import MultiplayerEntryModal from "@/components/MultiplayerEntryModal";
import LeaderboardOverlay from "@/components/LeaderboardOverlay";
import { trackEvent } from "@/lib/analytics";
// ─── Raw data types ─────────────────────────────────────────────────────────────
interface TriviaItem   { question: string; options: string[]; correct: number; }
interface ArenaItem    { name: string; team: string; city: string; capacity: number; options: string[]; wiki?: string; image_url?: string; }
interface ContractItem { player: string; team: string; year: number; total_m: number; flag: string; wiki?: string; flagCode?: string; image_url?: string; }
interface SalaryItem   { player: string; team: string; annual_m: number; flag: string; wiki?: string; flagCode?: string; image_url?: string; }
interface PeakItem     { player: string; team: string; season: number; ppg: number; flag: string; wiki?: string; flagCode?: string; image_url?: string; }

interface RawNBAData {
  trivia: TriviaItem[];
  arenas: ArenaItem[];
  contracts: ContractItem[];
  salaries: SalaryItem[];
  peaks: PeakItem[];
  team_logos?: Record<string, string>;
}

// ─── Round types ────────────────────────────────────────────────────────────────
type RoundType = "trivia" | "arena" | "contract" | "salary" | "peak";
type Screen    = "home" | "game" | "result";
type Mode      = "solo" | "multi";

interface TriviaRound   { type: "trivia";   question: string; options: string[]; correct: number; }
interface ArenaRound    { type: "arena";    name: string; city: string; capacity: number; options: string[]; correct: number; wiki?: string; image_url?: string; }
interface ContractRound { type: "contract"; player: string; team: string; year: number; flag: string; total_m: number; wiki?: string; flagCode?: string; image_url?: string; }
interface SalaryRound   { type: "salary";   playerA: SalaryItem; playerB: SalaryItem; correct: 0 | 1; }
interface PeakRound     { type: "peak";     player: string; team: string; season: number; ppg: number; flag: string; wiki?: string; flagCode?: string; image_url?: string; }

type Round = TriviaRound | ArenaRound | ContractRound | SalaryRound | PeakRound;

type RoundEntry =
  | { type: "trivia";   round: number; question: string; options: string[]; chosen: number; correct: number; points: number; }
  | { type: "arena";    round: number; name: string;     options: string[]; chosen: number; correct: number; points: number; }
  | { type: "contract"; round: number; player: string; guess_m: number; total_m: number; points: number; accuracy: number; }
  | { type: "salary";   round: number; playerA: SalaryItem; playerB: SalaryItem; chosen: 0 | 1; correct: 0 | 1; points: number; }
  | { type: "peak";     round: number; player: string; guess: number; season: number; ppg: number; points: number; diff: number; };

// ─── Constants ──────────────────────────────────────────────────────────────────
const TOTAL         = 10;
const MAX_PTS       = 100;
const MAX_TOTAL     = TOTAL * MAX_PTS; // 1000
const ANSWER_TIME   = 12;
const NEXT_TIME     = 3;
const CONTRACT_MAX  = 350;
const PEAK_MIN      = 1960;
const PEAK_MAX      = 2024;

// trivia×2, contract×2, salary×2, arena×2, peak×2
const ROUND_TYPES: RoundType[] = [
  "trivia",   "contract", "salary",
  "peak",     "arena",    "contract",
  "trivia",   "salary",   "peak",     "arena",
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

function computeContractScore(guess: number, actual: number): { points: number; accuracy: number } {
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

function generateRounds(data: RawNBAData, seed?: number): Round[] {
  const doShuffle = <T,>(arr: T[], offset: number): T[] =>
    seed !== undefined ? seededShuffle(arr, seed + offset) : shuffle(arr);

  const rng       = seed !== undefined ? mulberry32(seed + 999) : Math.random.bind(Math);
  const trivia    = doShuffle([...data.trivia],    0).slice(0, 2);
  const arenas    = doShuffle([...data.arenas],    1).slice(0, 2);
  const contracts = doShuffle([...data.contracts], 2).slice(0, 2);
  const salaries  = doShuffle([...data.salaries],  3);
  const peaks     = doShuffle([...data.peaks],     4).slice(0, 2);

  let ti = 0, ai = 0, ci = 0, sai = 0, pi = 0;

  return ROUND_TYPES.map(type => {
    if (type === "trivia") {
      const t = trivia[ti++];
      return { type: "trivia", question: t.question, options: t.options, correct: t.correct };
    }
    if (type === "arena") {
      const a = arenas[ai++];
      const allOpts = [a.team, ...a.options];
      const shuffled = shuffleWithRng(allOpts, rng);
      const correct = shuffled.indexOf(a.team);
      return { type: "arena", name: a.name, city: a.city, capacity: a.capacity, options: shuffled, correct, wiki: a.wiki };
    }
    if (type === "contract") {
      const c = contracts[ci++];
      return { type: "contract", player: c.player, team: c.team, year: c.year, flag: c.flag, total_m: c.total_m, wiki: c.wiki, flagCode: c.flagCode };
    }
    if (type === "peak") {
      const p = peaks[pi++];
      return { type: "peak", player: p.player, team: p.team, season: p.season, ppg: p.ppg, flag: p.flag, wiki: p.wiki, flagCode: p.flagCode };
    }
    // salary
    const pA = salaries[sai * 2];
    const pB = salaries[sai * 2 + 1];
    sai++;
    const correct: 0 | 1 = pA.annual_m >= pB.annual_m ? 0 : 1;
    return { type: "salary", playerA: pA, playerB: pB, correct };
  });
}

// ─── Round themes ────────────────────────────────────────────────────────────────
const ROUND_THEMES = {
  trivia:   { emoji: "🧠", label: "NBA Trivia",      rgb: [100, 160, 255] as [number, number, number] },
  arena:    { emoji: "🏟️", label: "Arena",            rgb: [100, 210, 130] as [number, number, number] },
  contract: { emoji: "💸", label: "Contract Value",   rgb: [255, 165, 50]  as [number, number, number] },
  salary:   { emoji: "💰", label: "Who earns more?",  rgb: [240, 192, 64]  as [number, number, number] },
  peak:     { emoji: "📈", label: "Peak Season",      rgb: [180, 100, 255] as [number, number, number] },
} as const;

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

// ─── Wikipedia image ─────────────────────────────────────────────────────────────
function WikiImg({ title, alt, className, imageUrl }: { title?: string; alt: string; className?: string; imageUrl?: string | null }) {
  const [failed, setFailed] = useState(false);
  const src = failed ? null
    : imageUrl ? imageUrl
    : title    ? `/api/wiki-image?title=${encodeURIComponent(title)}`
    : null;
  if (!src) return <div className={`ft-img-placeholder ${className ?? ""}`} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} loading="lazy" onError={() => setFailed(true)} />;
}

// ─── NBA Team logo: parse Wikipedia infobox (same approach as CareerOrderGame) ──
const WIKI_TEAM: Record<string, string> = {
  "Philadelphia 76ers":   "Philadelphia 76ers",
  "Brooklyn Nets":        "Brooklyn Nets",
  "New Orleans Jazz":     "New Orleans Jazz",
  "Philadelphia Warriors":"Philadelphia Warriors",
};

function teamLogoSrc(team: string, teamLogos?: Record<string, string>): string {
  const prefetched = teamLogos?.[team] ?? null;
  if (prefetched) return prefetched;
  const wikiTitle = WIKI_TEAM[team] ?? team;
  return `/api/wiki-image?title=${encodeURIComponent(wikiTitle)}`;
}

function TeamLogoImg({ team, teamLogos }: { team: string; teamLogos?: Record<string, string> }) {
  const [failed, setFailed] = useState(false);
  if (!failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={teamLogoSrc(team, teamLogos)} alt={team} className="ft-team-logo" draggable={false} loading="lazy" onError={() => setFailed(true)} />;
  }
  return <div className="ft-team-logo-placeholder">{team[0]}</div>;
}

function FlagImg({ code, alt }: { code?: string; alt: string }) {
  if (!code) return null;
  return <img src={`/flags/${code}_w80.png`} alt={alt} className="ft-flag-img" loading="lazy" width={80} height={60} />;
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

// ─── ContractSlider ──────────────────────────────────────────────────────────────
function ContractSlider({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pos = value / CONTRACT_MAX;

  const getNewValue = useCallback((clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const p = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onChange(Math.round(p * CONTRACT_MAX));
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
        {[0, 100, 200, 300, 350].map(t => (
          <div key={t} className="pop-slider__tick" style={{ left: `${(t / CONTRACT_MAX) * 100}%` }}>${t}M</div>
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
        {[1960, 1970, 1980, 1990, 2000, 2010, 2020].map(y => (
          <div key={y} className="pop-slider__tick" style={{ left: `${((y - PEAK_MIN) / (PEAK_MAX - PEAK_MIN)) * 100}%` }}>{y}</div>
        ))}
      </div>
    </div>
  );
}

// ─── MCQOptions ─────────────────────────────────────────────────────────────────
function MCQOptions({ options, chosen, correct, onChoice }: {
  options: string[];
  chosen: number | null;
  correct: number;
  onChoice: (i: number) => void;
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
        return (
          <button key={i} className={cls} onClick={() => chosen === null && onChoice(i)} disabled={chosen !== null}>
            <span className="ft-option__letter">{String.fromCharCode(65 + i)}</span>
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
function NbaResultCard({ entry }: { entry: RoundEntry }) {
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

  if (entry.type === "arena") {
    const correct = entry.chosen === entry.correct;
    const color   = correct ? "#00ffa0" : "#ff6b6b";
    return (
      <div className="result-card">
        <div className="result-card__body" style={{ flex: 1 }}>
          <div className="result-card__title-row">
            <span className="ft-result-badge ft-result-badge--arena">Arena</span>
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

  if (entry.type === "contract") {
    const color = entry.accuracy >= 85 ? "#00ffa0" : entry.accuracy >= 60 ? "#f0c040" : "#ff6b6b";
    return (
      <div className="result-card">
        <div className="result-card__body" style={{ flex: 1 }}>
          <div className="result-card__title-row">
            <span className="ft-result-badge ft-result-badge--contract">Contract</span>
            <span className="result-card__city-name" style={{ fontSize: 13 }}>{entry.player}</span>
          </div>
          <div className="result-card__stats">
            Actual: <span className="result-card__actual">${entry.total_m}M</span>
            {" · "}Guess: <span style={{ color }}>${entry.guess_m}M</span>
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

  // salary
  const correct = entry.chosen === entry.correct;
  const color   = correct ? "#00ffa0" : "#ff6b6b";
  const winner  = entry.correct === 0 ? entry.playerA : entry.playerB;
  return (
    <div className="result-card">
      <div className="result-card__body" style={{ flex: 1 }}>
        <div className="result-card__title-row">
          <span className="ft-result-badge ft-result-badge--salary">Salary</span>
          <span className="result-card__city-name" style={{ fontSize: 13 }}>
            {entry.playerA.player} vs {entry.playerB.player}
          </span>
        </div>
        <div className="result-card__stats">
          {correct ? "✓ " : "✗ "}{winner.player} earns ${winner.annual_m}M/yr
        </div>
      </div>
      <div className="result-card__score">
        <div className="result-card__points" style={{ color }}>{entry.points}</div>
        <div className="result-card__pts-label">pts</div>
      </div>
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────────
export default function NbaQuiz({ initialData }: { initialData: RawNBAData }) {
  const [screen, setScreen]             = useState<Screen>("home");
  const [mode, setMode]                 = useState<Mode>("solo");
  const [rounds, setRounds]             = useState<Round[]>([]);
  const [qNum, setQNum]                 = useState(1);
  const [chosen, setChosen]             = useState<number | null>(null);
  const [revealed, setRevealed]         = useState(false);
  const [contractGuess, setContractGuess]   = useState(150);
  const [peakGuess, setPeakGuess]       = useState(1995);
  const [contractResult, setContractResult] = useState<{ guess_m: number; points: number; accuracy: number } | null>(null);
  const [peakResult, setPeakResult]     = useState<{ guess: number; points: number; diff: number } | null>(null);
  const [totalScore, setTotalScore]     = useState(0);
  const [roundResults, setRoundResults] = useState<RoundEntry[]>([]);
  const [roundOver, setRoundOver]       = useState(false);
  const [multiWaiting, setMultiWaiting] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [answerTimeLeft, setAnswerTimeLeft] = useState<number | null>(null);
  const [nextCountdown, setNextCountdown]   = useState<number | null>(null);

  // Refs
  const roundsRef           = useRef<Round[]>([]);
  const answerIntervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const answerTimeoutRef    = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const nextIntervalRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextTimeoutRef      = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const chosenRef           = useRef<number | null>(null);
  const revealedRef         = useRef(false);
  const contractGuessRef    = useRef(150);
  const peakGuessRef        = useRef(1995);
  const qNumRef             = useRef(1);

  const currentRound = rounds[qNum - 1] ?? null;
  const isLastRound  = qNum >= TOTAL;
  const answered     = currentRound?.type === "contract" || currentRound?.type === "peak" ? revealed : chosen !== null;
  const canClickNext = mode === "solo" ? answered : roundOver && !multiWaiting;

  // Keep refs in sync
  chosenRef.current        = chosen;
  revealedRef.current      = revealed;
  contractGuessRef.current = contractGuess;
  peakGuessRef.current     = peakGuess;
  qNumRef.current          = qNum;

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
    setContractGuess(150); contractGuessRef.current = 150;
    setPeakGuess(1995); peakGuessRef.current = 1995;
    setContractResult(null);
    setPeakResult(null);
    setRoundOver(false);
    setMultiWaiting(false);
  }, []);

  // ── Multiplayer callbacks ────────────────────────────────────────────────────
  const onMpGameStart = useCallback((seed: number) => {
    trackEvent("game_start", { game_type: "nba", mode: "multi" });
    const newRounds = generateRounds(initialData, seed);
    roundsRef.current = newRounds;
    setRounds(newRounds);
    setQNum(1); qNumRef.current = 1;
    setTotalScore(0);
    setRoundResults([]);
    setChosen(null); chosenRef.current = null;
    setRevealed(false); revealedRef.current = false;
    setContractGuess(150); contractGuessRef.current = 150;
    setPeakGuess(1995); peakGuessRef.current = 1995;
    setContractResult(null);
    setPeakResult(null);
    setRoundOver(false);
    setMultiWaiting(false);
    setScreen("game");
  }, [initialData]);

  const onMpRoundEnd  = useCallback(() => { setRoundOver(true); }, []);

  const onMpNextRound = useCallback((round: number) => {
    setQNum(round + 1);
    setChosen(null); chosenRef.current = null;
    setRevealed(false); revealedRef.current = false;
    setContractGuess(150); contractGuessRef.current = 150;
    setPeakGuess(1995); peakGuessRef.current = 1995;
    setContractResult(null);
    setPeakResult(null);
    setRoundOver(false);
    setMultiWaiting(false);
  }, []);

  const onMpGameEnd = useCallback(() => { setScreen("result"); }, []);

  const mp = useMultiplayer({
    gameType: "nba",
    host: getPartykitHost(),
    onGameStart:        onMpGameStart,
    onOpponentAnswered: useCallback(() => {}, []),
    onRoundEnd:         onMpRoundEnd,
    onNextRound:        onMpNextRound,
    onGameEnd:          onMpGameEnd,
  });

  const { submitRating, ratingResult } = useRatingSubmit("nba");

  // Record match outcome + ELO rating
  useEffect(() => {
    if (screen !== "result" || mode !== "multi" || !mp.opponent) return;
    const result = totalScore > mp.opponent.score ? "win" : totalScore < mp.opponent.score ? "loss" : "tie";
    recordMatch(mp.opponent.name, result);
    submitRating(totalScore, mp.opponent.score);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // ── Analytics: track game completion ─────────────────────────────────────────
  useEffect(() => {
    if (screen !== "result") return;
    trackEvent("game_complete", {
      game_type: "nba",
      mode: mode as "solo" | "multi",
      final_score: totalScore,
      max_score: MAX_TOTAL,
      score_pct: Math.round((totalScore / MAX_TOTAL) * 100),
    });
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

      if (round.type === "contract") {
        if (revealedRef.current) return;
        revealedRef.current = true;
        setRevealed(true);
        setContractResult({ guess_m: contractGuessRef.current, points: 0, accuracy: 0 });
        setRoundResults(prev => [...prev, {
          type: "contract", round: qNumRef.current,
          player: round.player, guess_m: contractGuessRef.current, total_m: round.total_m, points: 0, accuracy: 0,
        }]);
        mp.submitAnswer(contractGuessRef.current, 0);
      } else if (round.type === "peak") {
        if (revealedRef.current) return;
        revealedRef.current = true;
        setRevealed(true);
        setPeakResult({ guess: peakGuessRef.current, points: 0, diff: Math.abs(peakGuessRef.current - round.season) });
        setRoundResults(prev => [...prev, {
          type: "peak", round: qNumRef.current,
          player: round.player, guess: peakGuessRef.current, season: round.season, ppg: round.ppg, points: 0, diff: Math.abs(peakGuessRef.current - round.season),
        }]);
        mp.submitAnswer(peakGuessRef.current, 0);
      } else {
        if (chosenRef.current !== null) return;
        const wrongChoice = round.type === "salary" ? (round.correct === 0 ? 1 : 0) : (round.correct === 0 ? 1 : 0);
        chosenRef.current = wrongChoice;
        setChosen(wrongChoice);
        if (round.type === "trivia") {
          setRoundResults(prev => [...prev, { type: "trivia", round: qNumRef.current, question: round.question, options: round.options, chosen: wrongChoice, correct: round.correct, points: 0 }]);
        } else if (round.type === "arena") {
          setRoundResults(prev => [...prev, { type: "arena", round: qNumRef.current, name: round.name, options: round.options, chosen: wrongChoice, correct: round.correct, points: 0 }]);
        } else if (round.type === "salary") {
          const sal = round as SalaryRound;
          setRoundResults(prev => [...prev, { type: "salary", round: qNumRef.current, playerA: sal.playerA, playerB: sal.playerB, chosen: wrongChoice as 0|1, correct: sal.correct, points: 0 }]);
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
    trackEvent("game_start", { game_type: "nba", mode: "solo" });
    setMode("solo");
    const newRounds = generateRounds(initialData);
    roundsRef.current = newRounds;
    setRounds(newRounds);
    setQNum(1); qNumRef.current = 1;
    setTotalScore(0);
    setRoundResults([]);
    resetRound();
    setScreen("game");
  }, [resetRound, initialData]);

  const startMulti = () => { mp.disconnect(); setMode("multi"); setShowNamePrompt(true); };

  const handleNewOpponent = () => { mp.disconnect(); setMode("multi"); setScreen("home"); setShowNamePrompt(true); };
  const handleBackToMenu  = () => { mp.disconnect(); setMode("solo");  setScreen("home"); };

  const handleMCQChoice = (i: number) => {
    if (chosen !== null || !currentRound) return;
    const cr = currentRound;
    if (cr.type !== "trivia" && cr.type !== "arena") return;
    clearTimers();
    const correct = i === cr.correct;
    const pts     = correct ? MAX_PTS : 0;
    setChosen(i); chosenRef.current = i;
    if (correct) setTotalScore(s => s + MAX_PTS);
    if (cr.type === "trivia") {
      setRoundResults(prev => [...prev, { type: "trivia", round: qNum, question: cr.question, options: cr.options, chosen: i, correct: cr.correct, points: pts }]);
    } else {
      setRoundResults(prev => [...prev, { type: "arena", round: qNum, name: cr.name, options: cr.options, chosen: i, correct: cr.correct, points: pts }]);
    }
    if (mode === "multi") mp.submitAnswer(i, pts);
  };

  const handleSalaryChoice = (i: 0 | 1) => {
    if (chosen !== null || !currentRound || currentRound.type !== "salary") return;
    const cr = currentRound;
    clearTimers();
    const correct = i === cr.correct;
    const pts     = correct ? MAX_PTS : 0;
    setChosen(i); chosenRef.current = i;
    if (correct) setTotalScore(s => s + MAX_PTS);
    setRoundResults(prev => [...prev, { type: "salary", round: qNum, playerA: cr.playerA, playerB: cr.playerB, chosen: i, correct: cr.correct, points: pts }]);
    if (mode === "multi") mp.submitAnswer(i, pts);
  };

  const handleContractSubmit = () => {
    if (revealed || !currentRound || currentRound.type !== "contract") return;
    clearTimers();
    const { points, accuracy } = computeContractScore(contractGuessRef.current, currentRound.total_m);
    setRevealed(true); revealedRef.current = true;
    setContractResult({ guess_m: contractGuessRef.current, points, accuracy });
    setTotalScore(s => s + points);
    setRoundResults(prev => [...prev, {
      type: "contract", round: qNum, player: currentRound.player,
      guess_m: contractGuessRef.current, total_m: currentRound.total_m, points, accuracy,
    }]);
    if (mode === "multi") mp.submitAnswer(contractGuessRef.current, points);
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
      guess: peakGuessRef.current, season: currentRound.season, ppg: currentRound.ppg, points, diff,
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
  const pct            = totalScore / MAX_TOTAL;
  const scoreBarGrade  = pct >= 0.75 ? "excellent" : pct >= 0.5 ? "good" : "poor";
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

  const feedbackCorrect =
    currentRound?.type === "trivia" || currentRound?.type === "arena"
      ? chosen === (currentRound as { correct: number }).correct
      : currentRound?.type === "salary"
      ? (chosen as 0 | 1) === currentRound.correct
      : false;
  const feedbackIsWaiting = mode === "multi" && answered && (!roundOver || multiWaiting);

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      {showNamePrompt && (
        <MultiplayerEntryModal
          gameType="nba"
          host={getPartykitHost()}
          onQuickMatch={name => { setShowNamePrompt(false); mp.joinQueue(name); }}
          onLobbyStart={(payload, myName) => {
            setShowNamePrompt(false);
            mp.joinFromLobby(payload.gameId, payload.seed, myName, payload.totalPlayers, payload.playerNames);
          }}
          onCancel={() => { setShowNamePrompt(false); setMode("solo"); }}
        />
      )}
      <MultiplayerScreen
        status={mp.status}
        botCountdown={mp.botCountdown}
        onCancel={() => { mp.leaveQueue(); setMode("solo"); setScreen("home"); }}
        onPlayBot={mp.playVsBot}
        onContinueSolo={() => { mp.disconnect(); setMode("solo"); setMultiWaiting(false); }}
      />

      <div className="game-wrapper theme-sport">
        <Stars />
        <div className="glow-orb glow-orb--purple" />
        <div className="glow-orb glow-orb--orange" />

        {/* ── HOME ───────────────────────────────────────────────────────────── */}
        {screen === "home" && (
          <div className="home-screen">
            <div className="home-emoji">🏀</div>
            <div className="home-title">
              NBA<span className="accent">Quiz</span>
            </div>
            <p className="home-subtitle">Arenas, contracts, salaries & trivia</p>

            <div className="how-it-works">
              <div className="how-it-works__title">How it works</div>
              {[
                ["🧠", "Trivia: 4-choice NBA culture questions"],
                ["🏟️", "Arena: which team plays here?"],
                ["💸", "Contract: guess the total contract value (slider)"],
                ["💰", "Salary: which player earns more?"],
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
            {mode === "multi" && (
              <OpponentBar opponents={mp.opponents} myScore={totalScore} maxScore={MAX_TOTAL} />
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
                />
              </div>
            )}

            {/* ── Arena ────────────────────────────────────────────────────── */}
            {currentRound.type === "arena" && (
              <div className="ft-question-card">
                <TypeBanner type="arena" question="Which NBA team calls this arena home?" />
                <div className="ft-stadium-img-wrap">
                  <WikiImg title={currentRound.wiki} alt={currentRound.name} className="ft-stadium-img" imageUrl={currentRound.image_url} />
                </div>
                <div className="ft-stadium-header">
                  <div className="ft-stadium-name">{currentRound.name}</div>
                  <div className="ft-stadium-details">
                    <span>📍 {currentRound.city}</span>
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

            {/* ── Contract ─────────────────────────────────────────────────── */}
            {currentRound.type === "contract" && (
              <div className="ft-transfer-card">
                <TypeBanner type="contract" question="What was the total value of this contract?" />
                <div className="ft-player-hero">
                  <WikiImg title={currentRound.wiki} alt={currentRound.player} className="ft-player-img" imageUrl={currentRound.image_url} />
                  <div className="ft-player-hero__info">
                    <div className="ft-transfer-player">
                      <FlagImg code={currentRound.flagCode} alt={currentRound.player} />
                      <span className="ft-transfer-name">{currentRound.player}</span>
                      <span className="ft-transfer-year">({currentRound.year})</span>
                    </div>
                    <div className="ft-transfer-move">
                      <div className="ft-team-logo-wrap"><TeamLogoImg team={currentRound.team} teamLogos={initialData.team_logos} /></div>
                      <span className="ft-transfer-club">{currentRound.team}</span>
                    </div>
                  </div>
                </div>

                {!revealed && (
                  <>
                    <div className="ft-fee-display">${contractGuess}M</div>
                    <ContractSlider value={contractGuess} onChange={v => { setContractGuess(v); contractGuessRef.current = v; }} disabled={false} />
                    <button onClick={handleContractSubmit} className="btn-submit btn-hover-sm">Submit Guess</button>
                  </>
                )}

                {revealed && contractResult && (
                  <div className="reveal-section">
                    <div className="actual-pop-box">
                      <div className="actual-pop-box__label">💸 Actual Contract Value</div>
                      <div className="actual-pop-box__value">${currentRound.total_m}M</div>
                    </div>
                    <div className="guess-box">
                      <span className="guess-box__label">Your guess</span>
                      <span className="guess-box__value">${contractResult.guess_m}M</span>
                    </div>

                    {contractResult.points === 0 && contractResult.accuracy === 0 ? (
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
                            color: contractResult.accuracy >= 85 ? "#00ffa0" : contractResult.accuracy >= 60 ? "#f0c040" : "#ff6b6b"
                          }}>{contractResult.accuracy}%</div>
                        </div>
                        <div className="accuracy-points__divider" />
                        <div className="accuracy-points__stat">
                          <div className="accuracy-points__label">Points</div>
                          <div className="accuracy-points__value" style={{
                            color: contractResult.accuracy >= 85 ? "#00ffa0" : contractResult.accuracy >= 60 ? "#f0c040" : "#ff6b6b"
                          }}>+{contractResult.points}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Salary ───────────────────────────────────────────────────── */}
            {currentRound.type === "salary" && (
              <div className="ft-question-card">
                <TypeBanner type="salary" />
                <div className="ft-salary-row">
                  {([currentRound.playerA, currentRound.playerB] as const).map((player, i) => {
                    let cls = "ft-salary-card";
                    if (chosen !== null) {
                      if (i === currentRound.correct)         cls += " ft-salary-card--winner";
                      else if (i === chosen)                  cls += " ft-salary-card--loser";
                      else                                    cls += " ft-salary-card--disabled";
                    } else {
                      cls += " ft-salary-card--active";
                    }
                    return (
                      <div key={i} className={cls} onClick={() => chosen === null && handleSalaryChoice(i as 0 | 1)}>
                        <WikiImg title={player.wiki} alt={player.player} className="ft-salary-photo" imageUrl={player.image_url} />
                        <FlagImg code={player.flagCode} alt={player.player} />
                        <div className="ft-salary-player">{player.player}</div>
                        <div className="ft-salary-team-wrap">
                          <TeamLogoImg team={player.team} teamLogos={initialData.team_logos} />
                          <span className="ft-salary-team">{player.team}</span>
                        </div>
                        {chosen !== null && (
                          <div className="ft-salary-amount">${player.annual_m}M/yr</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Peak Season ──────────────────────────────────────────────── */}
            {currentRound.type === "peak" && (
              <div className="ft-transfer-card">
                <TypeBanner type="peak" question={`In which season did ${currentRound.player} average the most points?`} />
                <div className="ft-player-hero">
                  <WikiImg title={currentRound.wiki} alt={currentRound.player} className="ft-player-img" imageUrl={currentRound.image_url} />
                  <div className="ft-player-hero__info">
                    <div className="ft-transfer-player">
                      <FlagImg code={currentRound.flagCode} alt={currentRound.player} />
                      <span className="ft-transfer-name">{currentRound.player}</span>
                    </div>
                    <div className="ft-transfer-move">
                      <div className="ft-team-logo-wrap"><TeamLogoImg team={currentRound.team} teamLogos={initialData.team_logos} /></div>
                      <span className="ft-transfer-club">{currentRound.team}</span>
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
                      <span className="guess-box__label">PPG that season</span>
                      <span className="guess-box__value">{currentRound.ppg} pts/game</span>
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

            {/* FeedbackRow for MCQ rounds (trivia / arena / salary) */}
            {answered && currentRound.type !== "contract" && currentRound.type !== "peak" && (
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

            {/* Next button for contract / peak rounds */}
            {(currentRound.type === "contract" || currentRound.type === "peak") && revealed && (canClickNext || feedbackIsWaiting) && (
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
              {pct >= 0.75 ? "🏆" : pct >= 0.5 ? "🏀" : "😅"}
            </div>
            <p className="result-title--pop">
              {mode === "multi" ? "Results" : "Final Score"}
            </p>

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
                <div className={`result-score-bar__fill result-score-bar__fill--${scoreBarGrade}`}
                  style={{ width: `${pct * 100}%` }} />
              </div>
            )}

            <div className="round-breakdown">
              <div className="round-breakdown__header">Round Breakdown</div>
              <div className="round-breakdown__list">
                {roundResults.map((entry, i) => <NbaResultCard key={i} entry={entry} />)}
              </div>
            </div>

            {mode === "multi" && mp.opponent && (
              <RematchZone
                opponent={mp.opponent}
                myWantsRematch={mp.myWantsRematch}
                series={mp.series}
                onRematch={mp.requestRematch}
              />
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
      {mp.finalLeaderboard && (
        <LeaderboardOverlay
          leaderboard={mp.finalLeaderboard}
          onClose={() => { mp.disconnect(); handleBackToMenu(); }}
        />
      )}
    </>
  );
}
