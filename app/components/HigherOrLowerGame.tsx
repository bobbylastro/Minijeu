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
import NamePromptModal from "@/components/NamePromptModal";
import countriesData from "@/app/countries.json";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Country {
  name: string;
  flag: string;
  continent: string;
  area: number;
  population: number;
  gdp: number;
  gdp_pc: number;
  life_exp: number;
  coastline: number;
}

function flagToCode(emoji: string): string {
  return [...emoji]
    .map(c => String.fromCharCode((c.codePointAt(0) ?? 0) - 127397))
    .join("")
    .toLowerCase();
}
function flagUrl(emoji: string): string {
  return `https://flagcdn.com/w160/${flagToCode(emoji)}.png`;
}

type MetricKey = "population" | "area" | "gdp" | "gdp_pc" | "life_exp" | "coastline";

interface Metric {
  key: MetricKey;
  question: string;
  format: (v: number) => string;
  unit: string;
  emoji: string;
  rgb: [number, number, number];
  description: string;
}

interface Round {
  countryA: Country;
  countryB: Country;
  metric: Metric;
}

interface RoundEntry {
  round: number;
  countryA: Country;
  countryB: Country;
  metric: Metric;
  chosenIdx: 0 | 1;
  correct: boolean;
  points: number;
}

type Screen = "home" | "game" | "result";
type Mode   = "solo" | "multi";

const allCountries: Country[] = countriesData as Country[];

// ─── Constants ─────────────────────────────────────────────────────────────────
const TOTAL       = 10;
const MAX_TOTAL   = TOTAL;
const ANSWER_TIME = 7;
const NEXT_TIME   = 3;

// ─── Format helpers ────────────────────────────────────────────────────────────
function formatPop(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M`;
  return `${(n / 1_000).toFixed(0)}K`;
}
function formatArea(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M km²`;
  return `${n.toLocaleString("en-US")} km²`;
}
function formatGDP(n: number): string {
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}T`;
  return `$${n}B`;
}
function formatGDPpc(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}
function formatLifeExp(n: number): string {
  return `${n} yrs`;
}
function formatCoastline(n: number): string {
  if (n === 0) return "Landlocked";
  return `${n.toLocaleString("en-US")} km`;
}

// ─── Metrics ───────────────────────────────────────────────────────────────────
const METRICS: Metric[] = [
  { key: "population", question: "Which country has more people?",      format: formatPop,       unit: "Population",     emoji: "👥", rgb: [100,180,255], description: "Total number of people living in the country" },
  { key: "area",       question: "Which country has a larger area?",    format: formatArea,      unit: "Area",           emoji: "🗺️", rgb: [100,210,130], description: "Total land surface in km²" },
  { key: "gdp",        question: "Which country has a higher GDP?",     format: formatGDP,       unit: "GDP",            emoji: "💰", rgb: [240,192,64],  description: "Total economic output in billions of USD" },
  { key: "gdp_pc",     question: "Which has higher GDP per capita?",    format: formatGDPpc,     unit: "GDP per capita", emoji: "💵", rgb: [80,220,180],  description: "GDP divided by population — wealth per person" },
  { key: "life_exp",   question: "Which has a higher life expectancy?", format: formatLifeExp,   unit: "Life Expectancy",emoji: "🏥", rgb: [255,120,160], description: "Average life expectancy at birth, in years" },
  { key: "coastline",  question: "Which has a longer coastline?",       format: formatCoastline, unit: "Coastline",      emoji: "🌊", rgb: [80,200,255],  description: "Total length of the country's sea border" },
];

// ─── Scatter positions for metric banner background ────────────────────────────
const SCATTER_POS = [
  { x:  4, y:  8, r: -15, o: 0.09, s: 32 },
  { x: 74, y:  4, r:  25, o: 0.07, s: 48 },
  { x: 14, y: 62, r:  10, o: 0.08, s: 40 },
  { x: 83, y: 55, r: -30, o: 0.10, s: 36 },
  { x: 50, y: 74, r:   5, o: 0.06, s: 44 },
  { x: 62, y:  8, r: -20, o: 0.08, s: 38 },
  { x: 28, y: 38, r:  15, o: 0.07, s: 52 },
  { x: 88, y: 24, r: -10, o: 0.09, s: 30 },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Seedable PRNG (Mulberry32) — ensures both players get the same metric order
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gradeLabel(pts: number): string {
  const p = pts / MAX_TOTAL;
  if (p >= 0.9)  return "🌟 Legendary";
  if (p >= 0.75) return "🔥 Expert";
  if (p >= 0.55) return "👍 Decent";
  if (p >= 0.35) return "😅 Beginner";
  return "😬 Budding Geographer";
}

function generateRounds(seed?: number): Round[] {
  const countries = seed !== undefined
    ? seededShuffle(allCountries, seed).slice(0, TOTAL * 2)
    : shuffle(allCountries).slice(0, TOTAL * 2);

  const rand = seed !== undefined ? mulberry32(seed + 999) : Math.random.bind(Math);
  const rounds: Round[] = [];

  for (let i = 0; i < TOTAL; i++) {
    const countryA = countries[i * 2];
    const countryB = countries[i * 2 + 1];

    const validMetrics = METRICS.filter(m => {
      const a = countryA[m.key];
      const b = countryB[m.key];
      if (a === b) return false;
      if (m.key === "coastline" && a === 0 && b === 0) return false;
      return true;
    });

    const pool = validMetrics.length > 0 ? validMetrics : METRICS;
    const metric = pool[Math.floor(rand() * pool.length)];
    rounds.push({ countryA, countryB, metric });
  }

  return rounds;
}

// ─── Stars ─────────────────────────────────────────────────────────────────────
const STARS = Array.from({ length: 80 }, (_, i) => ({
  id: i, x: Math.random() * 100, y: Math.random() * 100,
  size: Math.random() * 2 + 0.5, opacity: Math.random() * 0.6 + 0.1, delay: Math.random() * 4,
}));

const Stars = memo(function Stars() {
  return (
    <div className="stars-layer">
      {STARS.map(s => (
        <div key={s.id} className="star" style={{
          left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size,
          opacity: s.opacity,
          animation: `twinkle ${2 + s.delay}s ease-in-out infinite`,
          animationDelay: `${s.delay}s`,
        }} />
      ))}
    </div>
  );
});

// ─── ProgressBar ───────────────────────────────────────────────────────────────
function ProgressBar({ current, total, correct, answered }: { current: number; total: number; correct: number; answered: number }) {
  return (
    <div className="progress-bar">
      <div className="progress-bar__header">
        <span className="progress-bar__question">Round {current}/{total}</span>
        <div className="progress-bar__stat">
          <div className="progress-bar__stat-label">Score</div>
          <div className="progress-bar__stat-value" style={{ color: "#f0c040" }}>{correct}/{answered}</div>
        </div>
      </div>
      <div className="progress-bar__track">
        <div className="progress-bar__fill" style={{ width: `${(current / total) * 100}%` }} />
      </div>
    </div>
  );
}

// ─── AnswerTimer ───────────────────────────────────────────────────────────────
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

// ─── CountryCard ───────────────────────────────────────────────────────────────
function CountryCard({ country, metric, onClick, showResult, isWinner, disabled }: {
  country: Country;
  metric: Metric;
  onClick: () => void;
  showResult: boolean;
  isWinner: boolean;
  disabled: boolean;
}) {
  const cls = [
    "hl-card",
    disabled ? "hl-card--disabled" : "hl-card--active",
    showResult && isWinner  ? "hl-card--winner" : "",
    showResult && !isWinner ? "hl-card--loser"  : "",
  ].filter(Boolean).join(" ");

  const value = country[metric.key];

  return (
    <div className={cls} onClick={!disabled ? onClick : undefined}>
      {showResult && (
        <div className="hl-card__result-icon">{isWinner ? "🏆" : "✗"}</div>
      )}
      <img
        src={flagUrl(country.flag)}
        alt={country.name}
        className="hl-card__flag-img"
        width={96}
        height={64}
      />
      <div className="hl-card__name">{country.name}</div>
      <div className="hl-card__continent">{country.continent}</div>
      {showResult && (
        <div className={`hl-card__value ${isWinner ? "hl-card__value--winner" : "hl-card__value--loser"}`}>
          {metric.format(value)}
        </div>
      )}
      {!showResult && !disabled && (
        <div className="hl-card__choose">Choose</div>
      )}
    </div>
  );
}

// ─── HLResultCard ──────────────────────────────────────────────────────────────
function HLResultCard({ entry }: { entry: RoundEntry }) {
  const color = entry.correct ? "#00ffa0" : "#ff6b6b";
  const isAWinner = entry.countryA[entry.metric.key] > entry.countryB[entry.metric.key];
  const winCountry  = isAWinner ? entry.countryA : entry.countryB;
  const loseCountry = isAWinner ? entry.countryB : entry.countryA;

  return (
    <div className="result-card">
      <img
        src={flagUrl(winCountry.flag)}
        alt={winCountry.name}
        className="result-card__img"
        width={48}
        height={32}
      />
      <div className="result-card__body">
        <div className="result-card__title-row">
          <span className="result-card__round-badge result-card__round-badge--vs">H/L</span>
          <span className="result-card__city-name">{winCountry.name}</span>
          <span className="result-card__city-vs">vs {loseCountry.name}</span>
        </div>
        <div className="result-card__stats">
          {entry.metric.emoji} {entry.metric.unit}:{" "}
          <span className="result-card__actual">{entry.metric.format(winCountry[entry.metric.key])}</span>
          {" vs "}
          {entry.metric.format(loseCountry[entry.metric.key])}
        </div>
      </div>
      <div className="result-card__score">
        <div className="result-card__points" style={{ color }}>{entry.correct ? "+1" : "0"}</div>
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function HigherOrLower() {
  const [screen, setScreen]             = useState<Screen>("home");
  const [mode, setMode]                 = useState<Mode>("solo");
  const [rounds, setRounds]             = useState<Round[]>([]);
  const [qNum, setQNum]                 = useState(1);
  const [chosen, setChosen]             = useState<0 | 1 | null>(null);
  const [totalScore, setTotalScore]     = useState(0);
  const [roundResults, setRoundResults] = useState<RoundEntry[]>([]);
  const [roundOver, setRoundOver]       = useState(false);
  const [multiWaiting, setMultiWaiting] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [answerTimeLeft, setAnswerTimeLeft] = useState<number | null>(null);
  const [nextCountdown, setNextCountdown]   = useState<number | null>(null);

  // Refs — keep mutable values accessible inside timer callbacks
  const roundsRef         = useRef<Round[]>([]);
  const answerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answerTimeoutRef  = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const nextIntervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextTimeoutRef    = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const winnerRef         = useRef<0 | 1>(0);
  const chosenRef         = useRef<0 | 1 | null>(null);
  const qNumRef           = useRef(1);

  const currentRound = rounds[qNum - 1] ?? null;
  const isLastRound  = qNum >= TOTAL;

  const winner: 0 | 1 = currentRound
    ? currentRound.countryA[currentRound.metric.key] >= currentRound.countryB[currentRound.metric.key] ? 0 : 1
    : 0;

  // Keep refs fresh every render
  winnerRef.current = winner;
  chosenRef.current = chosen;
  qNumRef.current   = qNum;

  const answered     = chosen !== null;
  const canClickNext = mode === "solo" ? answered : roundOver && !multiWaiting;

  // ── Multiplayer callbacks ─────────────────────────────────────────────────
  const onMpGameStart = useCallback((seed: number) => {
    const newRounds = generateRounds(seed);
    roundsRef.current = newRounds;
    setRounds(newRounds);
    setQNum(1);
    setChosen(null);
    setTotalScore(0);
    setRoundResults([]);
    setRoundOver(false);
    setMultiWaiting(false);
    chosenRef.current = null;
    qNumRef.current   = 1;
    setScreen("game");
  }, []);

  const onMpRoundEnd  = useCallback(() => { setRoundOver(true); }, []);

  const onMpNextRound = useCallback((round: number) => {
    setQNum(round + 1);
    setChosen(null);
    setRoundOver(false);
    setMultiWaiting(false);
    chosenRef.current = null;
  }, []);

  const onMpGameEnd = useCallback(() => { setScreen("result"); }, []);

  const mp = useMultiplayer({
    gameType: "higher-or-lower",
    host: getPartykitHost(),
    onGameStart:        onMpGameStart,
    onOpponentAnswered: useCallback(() => {}, []),
    onRoundEnd:         onMpRoundEnd,
    onNextRound:        onMpNextRound,
    onGameEnd:          onMpGameEnd,
  });

  const { submitRating, ratingResult } = useRatingSubmit("higher-or-lower");

  // Record match outcome + ELO rating
  useEffect(() => {
    if (screen !== "result" || mode !== "multi" || !mp.opponent) return;
    const result = totalScore > mp.opponent.score ? "win" : totalScore < mp.opponent.score ? "loss" : "tie";
    recordMatch(mp.opponent.name, result);
    submitRating(totalScore, mp.opponent.score);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // ── Answer timer (multi only) ─────────────────────────────────────────────
  useEffect(() => {
    if (mode !== "multi" || screen !== "game") return;

    let timeLeft = ANSWER_TIME;
    setAnswerTimeLeft(timeLeft);

    answerIntervalRef.current = setInterval(() => {
      timeLeft--;
      setAnswerTimeLeft(timeLeft);
    }, 1000);

    answerTimeoutRef.current = setTimeout(() => {
      clearInterval(answerIntervalRef.current!);
      answerIntervalRef.current = null;
      setAnswerTimeLeft(0);

      if (chosenRef.current !== null) return; // already answered
      const round    = roundsRef.current[qNumRef.current - 1];
      const wrongIdx = (winnerRef.current === 0 ? 1 : 0) as 0 | 1;
      chosenRef.current = wrongIdx;
      setChosen(wrongIdx);
      if (round) {
        setRoundResults(prev => [...prev, {
          round: qNumRef.current,
          countryA: round.countryA,
          countryB: round.countryB,
          metric: round.metric,
          chosenIdx: wrongIdx,
          correct: false,
          points: 0,
        }]);
      }
      mp.submitAnswer(-1, 0);
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

  // ── Next-round countdown (multi) ──────────────────────────────────────────
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

  // ── Game actions ──────────────────────────────────────────────────────────
  const startSolo = useCallback(() => {
    setMode("solo");
    const newRounds = generateRounds();
    roundsRef.current = newRounds;
    setRounds(newRounds);
    setQNum(1);
    setChosen(null);
    setTotalScore(0);
    setRoundResults([]);
    setRoundOver(false);
    setMultiWaiting(false);
    chosenRef.current = null;
    setScreen("game");
  }, []);

  const startMulti = () => { mp.disconnect(); setMode("multi"); setShowNamePrompt(true); };

  const handleNewOpponent = () => {
    mp.disconnect();
    setMode("multi");
    setScreen("home");
    setShowNamePrompt(true);
  };

  const handleBackToMenu = () => {
    mp.disconnect();
    setMode("solo");
    setScreen("home");
  };

  const handleChoice = (i: 0 | 1) => {
    if (chosen !== null || !currentRound) return;

    clearInterval(answerIntervalRef.current!);
    clearTimeout(answerTimeoutRef.current!);
    answerIntervalRef.current = null;
    answerTimeoutRef.current  = null;
    setAnswerTimeLeft(null);

    const correct = i === winner;
    const pts     = correct ? 1 : 0;
    setChosen(i);
    chosenRef.current = i;
    if (correct) setTotalScore(s => s + 1);
    setRoundResults(prev => [...prev, {
      round: qNum,
      countryA: currentRound.countryA,
      countryB: currentRound.countryB,
      metric:   currentRound.metric,
      chosenIdx: i,
      correct,
      points: pts,
    }]);
    if (mode === "multi") mp.submitAnswer(i, pts);
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
    setChosen(null);
  };

  // ── Result helpers ────────────────────────────────────────────────────────
  const pct            = totalScore / MAX_TOTAL;
  const scoreBarGrade  = pct >= 0.75 ? "excellent" : pct >= 0.5 ? "good" : "poor";
  const myCircleClass  = mode === "multi" && mp.opponent
    ? totalScore > mp.opponent.score ? "score-circle--win" : "score-circle--neutral"
    : "score-circle--solo";
  const oppCircleClass = mode === "multi" && mp.opponent
    ? mp.opponent.score > totalScore ? "score-circle--win" : "score-circle--lose" : "";
  const myValueColor   = mode === "multi" && mp.opponent
    ? totalScore > mp.opponent.score ? "score-circle__value--green" : "score-circle__value--gold"
    : "score-circle__value--gold";
  const oppValueColor  = mode === "multi" && mp.opponent
    ? mp.opponent.score > totalScore ? "score-circle__value--green" : "score-circle__value--red" : "";

  // ── Render ────────────────────────────────────────────────────────────────
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
        botCountdown={mp.botCountdown}
        onCancel={() => { mp.leaveQueue(); setMode("solo"); setScreen("home"); }}
        onPlayBot={mp.playVsBot}
        onContinueSolo={() => { mp.disconnect(); setMode("solo"); setMultiWaiting(false); }}
      />

      <div className="game-wrapper">
        <Stars />
        <div className="glow-orb glow-orb--purple" />
        <div className="glow-orb glow-orb--orange" />

        {/* ── HOME ─────────────────────────────────────────────────────────── */}
        {screen === "home" && (
          <div className="home-screen">
            <div className="home-emoji">📊</div>
            <div className="home-title">
              Higher or <span className="accent">Lower</span>
            </div>
            <p className="home-subtitle">Compare countries across 6 different metrics</p>

            <div className="how-it-works">
              <div className="how-it-works__title">How it works</div>
              {[
                ["📊", "Each round, two countries are compared on a random metric"],
                ["🌍", "Population, GDP, area, life expectancy, coastline and more"],
                ["👆", "Click the country you think ranks higher"],
                ["🏆", "10 rounds — 1 point per correct answer"],
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

        {/* ── GAME ─────────────────────────────────────────────────────────── */}
        {screen === "game" && currentRound && (
          <div className="hl-container">
            {mode === "multi" && mp.opponent && (
              <OpponentBar opponent={mp.opponent} myScore={totalScore} maxScore={MAX_TOTAL} />
            )}

            <ProgressBar current={qNum} total={TOTAL} correct={totalScore} answered={roundResults.length} />

            {mode === "multi" && answerTimeLeft !== null && !answered && (
              <AnswerTimer timeLeft={answerTimeLeft} total={ANSWER_TIME} />
            )}

            {(() => {
              const [r, g, b] = currentRound.metric.rgb;
              return (
                <div className={`hl-metric-banner${chosen !== null ? " hl-metric-banner--answered" : ""}`} style={{
                  borderColor: `rgba(${r},${g},${b},0.4)`,
                  background:  `linear-gradient(135deg, rgba(${r},${g},${b},0.13) 0%, rgba(${r},${g},${b},0.04) 100%)`,
                  boxShadow:   `0 0 40px rgba(${r},${g},${b},0.08) inset, 0 4px 24px rgba(0,0,0,0.3)`,
                }}>
                  <div className="hl-metric-banner__scatter" aria-hidden="true">
                    {SCATTER_POS.map((p, i) => (
                      <span key={i} style={{
                        position: "absolute", left: `${p.x}%`, top: `${p.y}%`,
                        fontSize: p.s, opacity: p.o,
                        transform: `rotate(${p.r}deg)`,
                        pointerEvents: "none", userSelect: "none", lineHeight: 1,
                      }}>
                        {currentRound.metric.emoji}
                      </span>
                    ))}
                  </div>

                  <div className="hl-metric-help">
                    <span className="hl-metric-help__icon">?</span>
                    <div className="hl-metric-help__tooltip">{currentRound.metric.description}</div>
                  </div>

                  <div className="hl-metric-banner__emoji">{currentRound.metric.emoji}</div>
                  <div className="hl-metric-banner__name" style={{ color: `rgb(${r},${g},${b})`, textShadow: `0 0 30px rgba(${r},${g},${b},0.5)` }}>
                    {currentRound.metric.unit}
                  </div>
                  <div className="hl-metric-banner__question">{currentRound.metric.question}</div>
                </div>
              );
            })()}

            <div className="hl-cards-row">
              <CountryCard
                country={currentRound.countryA}
                metric={currentRound.metric}
                onClick={() => handleChoice(0)}
                showResult={chosen !== null}
                isWinner={winner === 0}
                disabled={chosen !== null}
              />
              <div className="hl-vs-divider">VS</div>
              <CountryCard
                country={currentRound.countryB}
                metric={currentRound.metric}
                onClick={() => handleChoice(1)}
                showResult={chosen !== null}
                isWinner={winner === 1}
                disabled={chosen !== null}
              />
            </div>

            {chosen !== null && (
              <div className="feedback">
                <div className={`feedback__text ${chosen === winner ? "feedback__text--correct" : "feedback__text--wrong"}`}>
                  {chosen === winner
                    ? `✓ Correct! +1`
                    : `✗ Wrong! ${winner === 0 ? currentRound.countryA.name : currentRound.countryB.name} was higher`}
                </div>

                {mode === "multi" && !roundOver && (
                  <div className="waiting-indicator"><span className="waiting-dot" />Waiting for opponent…</div>
                )}
                {mode === "multi" && multiWaiting && (
                  <div className="waiting-indicator"><span className="waiting-dot" />Opponent is choosing…</div>
                )}

                {canClickNext && (
                  <>
                    <button onClick={handleNext} className="btn-next btn-hover">
                      {isLastRound ? "See results →" : "Next →"}
                    </button>
                    {nextCountdown !== null && (
                      <div className="next-countdown">
                        Continuing in <span className="next-countdown__num">{nextCountdown}</span>s…
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── RESULT ───────────────────────────────────────────────────────── */}
        {screen === "result" && (
          <div className="citymix-result-screen">
            <div className="result-emoji--pop">
              {pct >= 0.75 ? "🏆" : pct >= 0.5 ? "🎯" : "🗺️"}
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
                <div className="score-circle__value score-circle__value--md score-circle__value--gold">
                  {totalScore}
                </div>
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
                {roundResults.map((entry, i) => <HLResultCard key={i} entry={entry} />)}
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
    </>
  );
}
