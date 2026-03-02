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

// ─── Types ─────────────────────────────────────────────────────────────────────
interface City { name: string; country: string; flag: string; flag2x: string; population: number; image: string; }
type RoundType = "binary" | "slider";
type Screen = "home" | "game" | "result";
type Mode = "solo" | "multi";
interface FeedbackState { correct: boolean; text: string; }
interface SliderResult { city: City; guess: number; points: number; accuracy: number; }
type RoundEntry =
  | { type: "binary"; round: number; cityA: City; cityB: City; chosenIdx: 0|1; correct: boolean; points: number }
  | { type: "slider"; round: number; city: City; guess: number; points: number; accuracy: number };

import citiesData from "../cities.json";
const allCities: City[] = citiesData as City[];

// ─── Constants ─────────────────────────────────────────────────────────────────
const TOTAL       = 10;
const MAX_POINTS  = 1000;
const MAX_TOTAL   = TOTAL * MAX_POINTS;
const CITIES_NEEDED = 15; // 10 for binary pairs + 5 for slider
const SLIDER_MIN  = 100_000;
const SLIDER_MAX  = 35_000_000;
const ANSWER_TIME  = 7;
const NEXT_TIME    = 3;
const RESULT_TIME  = 15;

// ─── Helpers ───────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function sliderToPopulation(pos: number) {
  const logMin = Math.log10(SLIDER_MIN), logMax = Math.log10(SLIDER_MAX);
  return Math.round(Math.pow(10, logMin + pos * (logMax - logMin)));
}
function populationToSlider(pop: number) {
  const logMin = Math.log10(SLIDER_MIN), logMax = Math.log10(SLIDER_MAX);
  return (Math.log10(pop) - logMin) / (logMax - logMin);
}
function formatPopFull(n: number) { return n.toLocaleString("en-US"); }
function formatPop(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString("en-US");
}
function computeScore(guess: number, actual: number): { points: number; accuracy: number } {
  const ratio = Math.min(guess, actual) / Math.max(guess, actual);
  const accuracy = Math.round(ratio * 100);
  let points = 0;
  if      (ratio >= 0.99) points = MAX_POINTS;
  else if (ratio >= 0.9)  points = Math.round(700 + (ratio - 0.9)  / 0.09 * 300);
  else if (ratio >= 0.75) points = Math.round(400 + (ratio - 0.75) / 0.15 * 300);
  else if (ratio >= 0.5)  points = Math.round(100 + (ratio - 0.5)  / 0.25 * 300);
  else                    points = Math.round(ratio / 0.5 * 100);
  return { points, accuracy };
}
function gradeLabel(pts: number) {
  const p = pts / MAX_TOTAL;
  if (p >= 0.9)  return "🌟 Legendary";
  if (p >= 0.75) return "🔥 Expert";
  if (p >= 0.55) return "👍 Decent";
  if (p >= 0.35) return "😅 Beginner";
  return "😬 Budding Geographer";
}
const MID_POP = sliderToPopulation(0.5);
const POSITIVE = ["Excellent!", "Well done!", "Perfect!", "Correct!"];
const NEGATIVE  = ["Wrong!", "Not this time…", "Bad answer!", "Oops!"];

// Round type: odd qNum (1,3,5,7,9) = binary; even (2,4,6,8,10) = slider
const roundType = (qNum: number): RoundType => qNum % 2 === 1 ? "binary" : "slider";
// 0-based index within binary/slider group
const binaryIndex = (qNum: number) => Math.floor((qNum - 1) / 2);
const sliderIndex = (qNum: number) => Math.floor((qNum - 1) / 2);

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
          left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size,
          opacity: s.opacity, animation: `twinkle ${2 + s.delay}s ease-in-out infinite`,
          animationDelay: `${s.delay}s`,
        }} />
      ))}
    </div>
  );
});

// ─── ProgressBar ───────────────────────────────────────────────────────────────
function ProgressBar({ current, total, score }: { current: number; total: number; score: number }) {
  return (
    <div className="progress-bar">
      <div className="progress-bar__header">
        <span className="progress-bar__question">Round {current}/{total}</span>
        <div className="progress-bar__stat">
          <div className="progress-bar__stat-label">Points</div>
          <div className="progress-bar__stat-value" style={{ color: "#f0c040" }}>{score.toLocaleString()}</div>
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

// ─── CityCard ──────────────────────────────────────────────────────────────────
const CityCard = memo(function CityCard({ city, onClick, showResult, isWinner, disabled }: {
  city: City; onClick: () => void; showResult: boolean; isWinner: boolean; disabled: boolean;
}) {
  const cls = [
    "city-card",
    disabled ? "city-card--disabled" : "city-card--active",
    showResult && isWinner  ? "city-card--winner" : "",
    showResult && !isWinner ? "city-card--loser"  : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={cls} onClick={!disabled ? onClick : undefined}>
      <img src={city.image} alt={city.name} className="city-card__img" />
      <div className="city-card__overlay" />
      {showResult && isWinner && <div className="city-card__winner-pulse" />}
      <div className="city-card__content">
        <div className="city-card__name">{city.name}</div>
        <div className="city-card__country-row">
          <img src={city.flag} srcSet={`${city.flag} 1x, ${city.flag2x} 2x`}
            alt={city.country} width={20} height={14} className="city-card__flag" />
          <span className="city-card__country-name">{city.country}</span>
        </div>
        {showResult && (
          <div className={`city-card__population ${isWinner ? "city-card__population--winner" : "city-card__population--loser"}`}>
            {city.population.toLocaleString("en-US")} inhabitants
          </div>
        )}
      </div>
      {!showResult && !disabled && <div className="city-card__choose-badge">Choose</div>}
      {showResult && <div className="city-card__result-icon">{isWinner ? "🏆" : "❌"}</div>}
    </div>
  );
});

// ─── PopSlider ─────────────────────────────────────────────────────────────────
function PopSlider({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pos = populationToSlider(value);

  const getNewValue = useCallback((clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    onChange(sliderToPopulation(Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))));
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
        {[500_000, 1_000_000, 2_000_000, 5_000_000, 10_000_000, 20_000_000].map(t => (
          <div key={t} className="pop-slider__tick" style={{ left: `${populationToSlider(t) * 100}%` }}>{formatPop(t)}</div>
        ))}
      </div>
    </div>
  );
}

// ─── Result cards ──────────────────────────────────────────────────────────────
function BinaryResultCard({ entry }: { entry: Extract<RoundEntry, { type: "binary" }> }) {
  const winner = entry.cityA.population > entry.cityB.population ? 0 : 1;
  const winCity  = winner === 0 ? entry.cityA : entry.cityB;
  const loseCity = winner === 0 ? entry.cityB : entry.cityA;
  const color = entry.correct ? "#00ffa0" : "#ff6b6b";
  return (
    <div className="result-card">
      <img src={winCity.image} alt={winCity.name} className="result-card__img" />
      <div className="result-card__body">
        <div className="result-card__title-row">
          <span className="result-card__round-badge result-card__round-badge--vs">VS</span>
          <img src={winCity.flag} alt={winCity.country} width={14} height={10} className="result-card__flag" />
          <span className="result-card__city-name">{winCity.name}</span>
          <span className="result-card__city-vs">vs {loseCity.name}</span>
        </div>
        <div className="result-card__stats">
          {entry.correct ? "Correct pick ✓" : `Should have picked ${winCity.name}`}
        </div>
      </div>
      <div className="result-card__score">
        <div className="result-card__points" style={{ color }}>{entry.points}</div>
        <div className="result-card__pts-label">pts</div>
      </div>
    </div>
  );
}

function SliderResultCard({ entry }: { entry: Extract<RoundEntry, { type: "slider" }> }) {
  const color = entry.accuracy >= 90 ? "#00ffa0" : entry.accuracy >= 70 ? "#f0c040" : "#ff6b6b";
  return (
    <div className="result-card">
      <img src={entry.city.image} alt={entry.city.name} className="result-card__img" />
      <div className="result-card__body">
        <div className="result-card__title-row">
          <span className="result-card__round-badge result-card__round-badge--guess">GUESS</span>
          <img src={entry.city.flag} alt={entry.city.country} width={14} height={10} className="result-card__flag" />
          <span className="result-card__city-name">{entry.city.name}</span>
        </div>
        <div className="result-card__stats">
          Actual: <span className="result-card__actual">{formatPopFull(entry.city.population)}</span>
          {" · "}Guess: <span style={{ color }}>{formatPopFull(entry.guess)}</span>
        </div>
      </div>
      <div className="result-card__score">
        <div className="result-card__points" style={{ color }}>{entry.points}</div>
        <div className="result-card__pts-label">pts</div>
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function CityMix() {
  const [screen, setScreen]               = useState<Screen>("home");
  const [mode, setMode]                   = useState<Mode>("solo");
  const [cityPool, setCityPool]           = useState<City[]>([]);
  const [qNum, setQNum]                   = useState(1);
  // Binary
  const [chosen, setChosen]               = useState<0 | 1 | null>(null);
  const [feedback, setFeedback]           = useState<FeedbackState | null>(null);
  // Slider
  const [guess, setGuess]                 = useState(MID_POP);
  const [revealed, setRevealed]           = useState(false);
  const [sliderResult, setSliderResult]   = useState<SliderResult | null>(null);
  // Shared
  const [totalScore, setTotalScore]       = useState(0);
  const [roundResults, setRoundResults]   = useState<RoundEntry[]>([]);
  const [roundOver, setRoundOver]         = useState(false);
  const [multiWaiting, setMultiWaiting]   = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [answerTimeLeft, setAnswerTimeLeft]   = useState<number | null>(null);
  const [nextCountdown, setNextCountdown]     = useState<number | null>(null);
  const [resultCountdown, setResultCountdown] = useState<number | null>(null);

  // Refs
  const cityPoolRef       = useRef<City[]>([]);
  const answerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answerTimeoutRef  = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const nextIntervalRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextTimeoutRef     = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const resultIntervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultTimeoutRef   = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const winnerRef         = useRef<0 | 1>(0);
  const guessRef          = useRef(MID_POP);
  const currentCityRef    = useRef<City | null>(null);
  const revealedRef       = useRef(false);
  const chosenRef         = useRef<0 | 1 | null>(null);
  const qNumRef           = useRef(1);

  // Derived from qNum
  const rType   = roundType(qNum);
  const bi      = binaryIndex(qNum);
  const si      = sliderIndex(qNum);
  const cityA   = cityPool[bi * 2]     ?? null;
  const cityB   = cityPool[bi * 2 + 1] ?? null;
  const sCity   = cityPool[10 + si]    ?? null;
  const winner: 0|1 = (cityA && cityB) ? (cityA.population > cityB.population ? 0 : 1) : 0;

  // Keep refs fresh
  winnerRef.current      = winner;
  guessRef.current       = guess;
  currentCityRef.current = rType === "slider" ? sCity : null;
  revealedRef.current    = revealed;
  chosenRef.current      = chosen;
  qNumRef.current        = qNum;

  const answered     = rType === "binary" ? chosen !== null : revealed;
  const canClickNext = mode === "solo" ? answered : roundOver && !multiWaiting;
  const isLastRound  = qNum >= TOTAL;

  // ── Reset round state ────────────────────────────────────────────────────────
  const resetRound = useCallback(() => {
    setChosen(null); setFeedback(null);
    setGuess(MID_POP); setRevealed(false); setSliderResult(null);
    setRoundOver(false); setMultiWaiting(false);
    revealedRef.current = false; chosenRef.current = null;
  }, []);

  // ── Multiplayer callbacks ────────────────────────────────────────────────────
  const onMpGameStart = useCallback((seed: number) => {
    const pool = seededShuffle(allCities, seed).slice(0, CITIES_NEEDED);
    cityPoolRef.current = pool;
    setCityPool(pool);
    setTotalScore(0); setQNum(1); setRoundResults([]);
    setChosen(null); setFeedback(null);
    setGuess(MID_POP); setRevealed(false); setSliderResult(null);
    setRoundOver(false); setMultiWaiting(false);
    revealedRef.current = false; chosenRef.current = null;
    setScreen("game");
  }, []);

  const onMpRoundEnd  = useCallback(() => { setRoundOver(true); }, []);

  const onMpNextRound = useCallback((round: number) => {
    setQNum(round + 1);
    setChosen(null); setFeedback(null);
    setGuess(MID_POP); setRevealed(false); setSliderResult(null);
    setRoundOver(false); setMultiWaiting(false);
    revealedRef.current = false; chosenRef.current = null;
  }, []);

  const onMpGameEnd = useCallback(() => { setScreen("result"); }, []);

  const mp = useMultiplayer({
    gameType: "citymix",
    host: getPartykitHost(),
    onGameStart: onMpGameStart,
    onOpponentAnswered: useCallback(() => {}, []),
    onRoundEnd: onMpRoundEnd,
    onNextRound: onMpNextRound,
    onGameEnd: onMpGameEnd,
  });

  const { submitRating, ratingResult } = useRatingSubmit("citymix");

  // Record match result + ELO rating
  useEffect(() => {
    if (screen !== "result" || mode !== "multi" || !mp.opponent) return;
    const result = totalScore > mp.opponent.score ? "win" : totalScore < mp.opponent.score ? "loss" : "tie";
    recordMatch(mp.opponent.name, result);
    submitRating(totalScore, mp.opponent.score);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // ── Answer timer (multi) ─────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== "multi" || screen !== "game") return;

    const currentRoundType = roundType(qNumRef.current);
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

      if (currentRoundType === "binary") {
        if (chosenRef.current !== null) return;
        const wrongIdx = (winnerRef.current === 0 ? 1 : 0) as 0 | 1;
        chosenRef.current = wrongIdx;
        const pool = cityPoolRef.current;
        const bIdx = binaryIndex(qNumRef.current);
        const cA = pool[bIdx * 2]; const cB = pool[bIdx * 2 + 1];
        setChosen(wrongIdx);
        setFeedback({ correct: false, text: "Time's up!" });
        if (cA && cB) {
          setRoundResults(prev => [...prev, {
            type: "binary", round: qNumRef.current,
            cityA: cA, cityB: cB, chosenIdx: wrongIdx, correct: false, points: 0,
          }]);
        }
        mp.submitAnswer(-1, 0);
      } else {
        if (revealedRef.current) return;
        revealedRef.current = true;
        const city = currentCityRef.current;
        if (!city) return;
        const res: SliderResult = { city, guess: guessRef.current, points: 0, accuracy: 0 };
        setSliderResult(res);
        setRoundResults(prev => [...prev, {
          type: "slider", round: qNumRef.current,
          city, guess: guessRef.current, points: 0, accuracy: 0,
        }]);
        setRevealed(true);
        mp.submitAnswer(guessRef.current, 0);
      }
    }, ANSWER_TIME * 1000);

    return () => {
      clearInterval(answerIntervalRef.current!);
      clearTimeout(answerTimeoutRef.current!);
      answerIntervalRef.current = null;
      answerTimeoutRef.current = null;
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
    nextTimeoutRef.current = setTimeout(() => {
      clearInterval(nextIntervalRef.current!);
      nextIntervalRef.current = null;
      setNextCountdown(null);
      setMultiWaiting(prev => { if (!prev) mp.readyForNext(); return true; });
    }, NEXT_TIME * 1000);

    return () => {
      clearInterval(nextIntervalRef.current!);
      clearTimeout(nextTimeoutRef.current!);
      nextIntervalRef.current = null;
      nextTimeoutRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundOver]);

  // ── Result screen timeout (multi) ────────────────────────────────────────────
  useEffect(() => {
    if (screen !== "result" || mode !== "multi") return;

    let countdown = RESULT_TIME;
    setResultCountdown(countdown);
    resultIntervalRef.current = setInterval(() => { countdown--; setResultCountdown(countdown); }, 1000);
    resultTimeoutRef.current = setTimeout(() => {
      clearInterval(resultIntervalRef.current!);
      resultIntervalRef.current = null;
      setResultCountdown(null);
      mp.disconnect();
      setMode("solo");
      setScreen("home");
    }, RESULT_TIME * 1000);

    return () => {
      clearInterval(resultIntervalRef.current!);
      clearTimeout(resultTimeoutRef.current!);
      resultIntervalRef.current = null;
      resultTimeoutRef.current = null;
      setResultCountdown(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, mode]);

  // ── Game actions ─────────────────────────────────────────────────────────────
  const startSolo = () => {
    setMode("solo");
    const pool = shuffle(allCities).slice(0, CITIES_NEEDED);
    cityPoolRef.current = pool;
    setCityPool(pool);
    setTotalScore(0); setQNum(1); setRoundResults([]);
    resetRound();
    setScreen("game");
  };

  const startMulti = () => { mp.disconnect(); setMode("multi"); setShowNamePrompt(true); };

  const clearResultCountdown = () => {
    clearInterval(resultIntervalRef.current!);
    clearTimeout(resultTimeoutRef.current!);
    resultIntervalRef.current = null;
    resultTimeoutRef.current = null;
    setResultCountdown(null);
  };

  const handleNewOpponent = () => {
    clearResultCountdown();
    mp.disconnect();
    setMode("multi");
    setScreen("home");
    setShowNamePrompt(true);
  };

  const handleRequestRematch = () => {
    clearResultCountdown();
    mp.requestRematch();
  };

  const handleBackToMenu = () => {
    mp.disconnect();
    setMode("solo");
    setScreen("home");
  };

  const handleBinaryChoice = (i: 0 | 1) => {
    if (chosen !== null) return;
    clearInterval(answerIntervalRef.current!);
    clearTimeout(answerTimeoutRef.current!);
    answerIntervalRef.current = null;
    answerTimeoutRef.current = null;
    setAnswerTimeLeft(null);

    const correct = i === winner;
    const pts     = correct ? MAX_POINTS : 0;
    setChosen(i);
    setFeedback({
      correct,
      text: correct
        ? POSITIVE[Math.floor(Math.random() * POSITIVE.length)]
        : NEGATIVE[Math.floor(Math.random() * NEGATIVE.length)],
    });
    if (correct) setTotalScore(s => s + MAX_POINTS);
    if (cityA && cityB) {
      setRoundResults(prev => [...prev, {
        type: "binary", round: qNum, cityA, cityB, chosenIdx: i, correct, points: pts,
      }]);
    }
    if (mode === "multi") mp.submitAnswer(i, pts);
  };

  const handleSliderSubmit = () => {
    if (revealedRef.current || !sCity) return;
    revealedRef.current = true;
    clearInterval(answerIntervalRef.current!);
    clearTimeout(answerTimeoutRef.current!);
    answerIntervalRef.current = null;
    answerTimeoutRef.current = null;
    setAnswerTimeLeft(null);

    const { points, accuracy } = computeScore(guess, sCity.population);
    const res: SliderResult = { city: sCity, guess, points, accuracy };
    setSliderResult(res);
    setRoundResults(prev => [...prev, { type: "slider", round: qNum, city: sCity, guess, points, accuracy }]);
    setTotalScore(prev => prev + points);
    setRevealed(true);
    if (mode === "multi") mp.submitAnswer(guess, points);
  };

  const handleNext = () => {
    if (mode === "multi") {
      clearInterval(nextIntervalRef.current!);
      clearTimeout(nextTimeoutRef.current!);
      nextIntervalRef.current = null;
      nextTimeoutRef.current = null;
      setNextCountdown(null);
      setMultiWaiting(true);
      mp.readyForNext();
      return;
    }
    if (qNum >= TOTAL) { setScreen("result"); return; }
    setQNum(n => n + 1);
    resetRound();
  };

  // ── Result helpers ───────────────────────────────────────────────────────────
  const pct           = totalScore / MAX_TOTAL;
  const scoreBarGrade = pct >= 0.75 ? "excellent" : pct >= 0.5 ? "good" : "poor";
  const myCircleClass = mode === "multi" && mp.opponent
    ? totalScore > mp.opponent.score ? "score-circle--win" : "score-circle--neutral"
    : "score-circle--solo";
  const oppCircleClass = mode === "multi" && mp.opponent
    ? mp.opponent.score > totalScore ? "score-circle--win" : "score-circle--lose" : "";
  const myValueColor = mode === "multi" && mp.opponent
    ? totalScore > mp.opponent.score ? "score-circle__value--green" : "score-circle__value--gold"
    : "score-circle__value--gold";
  const oppValueColor = mode === "multi" && mp.opponent
    ? mp.opponent.score > totalScore ? "score-circle__value--green" : "score-circle__value--red" : "";

  // ── Render ───────────────────────────────────────────────────────────────────
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

        {/* ── HOME ─────────────────────────────────────────────────────────── */}
        {screen === "home" && (
          <div className="home-screen">
            <div className="home-emoji">🌍</div>
            <h1 className="home-title">
              City<span className="accent">Mix</span>
            </h1>
            <p className="home-subtitle">The ultimate city population challenge</p>

            <div className="how-it-works">
              <div className="how-it-works__title">How it works</div>
              {[
                ["🏙️", "Odd rounds: pick which city has more people"],
                ["🎚️", "Even rounds: slide to guess the exact population"],
                ["🎯", "Each round scores up to 1,000 points"],
                ["🏆", "10 rounds — max score 10,000"],
              ].map(([icon, text]) => (
                <div key={text as string} className="how-it-works__item">
                  <span className="how-it-works__icon">{icon}</span>
                  <span className="how-it-works__text">{text as string}</span>
                </div>
              ))}
            </div>

            <div className="home-buttons">
              <button onClick={startSolo}  className="btn-primary btn-hover">Solo</button>
              {isMultiplayerEnabled() && <button onClick={startMulti} className="btn-outline btn-hover">⚡ Multiplayer</button>}
            </div>
          </div>
        )}

        {/* ── GAME ─────────────────────────────────────────────────────────── */}
        {screen === "game" && (
          <div className="citymix-container">
            {mode === "multi" && mp.opponent && (
              <OpponentBar opponent={mp.opponent} myScore={totalScore} maxScore={MAX_TOTAL} />
            )}

            <ProgressBar current={qNum} total={TOTAL} score={totalScore} />

            {mode === "multi" && answerTimeLeft !== null && !answered && (
              <AnswerTimer timeLeft={answerTimeLeft} total={ANSWER_TIME} />
            )}

            <div style={{ textAlign: "center" }}>
              <span className="round-type-pill">
                {rType === "binary" ? "🏙️ Which city is bigger?" : "🎚️ Guess the population"}
              </span>
            </div>

            {/* ── Binary round ─────────────────────────────────────────────── */}
            {rType === "binary" && cityA && cityB && (
              <>
                <div className="cards-row">
                  <CityCard city={cityA} onClick={() => handleBinaryChoice(0)}
                    showResult={chosen !== null} isWinner={winner === 0} disabled={chosen !== null} />
                  <CityCard city={cityB} onClick={() => handleBinaryChoice(1)}
                    showResult={chosen !== null} isWinner={winner === 1} disabled={chosen !== null} />
                </div>
                {chosen === null && <div className="vs-badge">VS</div>}

                {feedback && (
                  <div className="feedback">
                    <div className={`feedback__text ${feedback.correct ? "feedback__text--correct" : "feedback__text--wrong"}`}>
                      {feedback.correct ? "✓ " : "✗ "}{feedback.text}
                      {feedback.correct && <span className="feedback__bonus">+1,000</span>}
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
              </>
            )}

            {/* ── Slider round ─────────────────────────────────────────────── */}
            {rType === "slider" && sCity && (
              <div className="city-photo-card">
                <div className="city-photo">
                  <img src={sCity.image} alt={sCity.name} className="city-photo__img" />
                  <div className="city-photo__overlay" />
                  <div className="city-photo__info">
                    <div className="city-photo__name">{sCity.name}</div>
                    <div className="city-photo__country-row">
                      <img src={sCity.flag} srcSet={`${sCity.flag} 1x, ${sCity.flag2x} 2x`}
                        alt={sCity.country} width={20} height={14} className="city-photo__flag" />
                      <span className="city-photo__country-name">{sCity.country}</span>
                    </div>
                  </div>
                </div>

                <div className="slider-panel">
                  <div className="slider-panel__question">
                    What is the population of{" "}
                    <span className="slider-panel__question--city">{sCity.name}</span>?
                  </div>

                  {!revealed && (
                    <>
                      <div className="pop-display">{formatPopFull(guess)}</div>
                      <PopSlider value={guess} onChange={setGuess} disabled={false} />
                      <button onClick={handleSliderSubmit} className="btn-submit btn-hover-sm">Submit Guess</button>
                    </>
                  )}

                  {revealed && sliderResult && (
                    <div className="reveal-section">
                      <div className="actual-pop-box">
                        <div className="actual-pop-box__label">🏙️ Actual Population</div>
                        <div className="actual-pop-box__value">{formatPopFull(sCity.population)}</div>
                      </div>
                      <div className="guess-box">
                        <span className="guess-box__label">Your guess</span>
                        <span className="guess-box__value">{formatPopFull(sliderResult.guess)}</span>
                      </div>

                      {mode === "multi" && !roundOver && (
                        <div className="waiting-indicator" style={{ marginBottom: 14 }}>
                          <span className="waiting-dot" />Waiting for opponent…
                        </div>
                      )}
                      {mode === "multi" && multiWaiting && (
                        <div className="waiting-indicator" style={{ marginBottom: 14 }}>
                          <span className="waiting-dot" />Opponent is submitting…
                        </div>
                      )}

                      {canClickNext && (
                        <>
                          <button onClick={handleNext} className="btn-next-wide btn-hover-sm">
                            {isLastRound ? "See Final Results →" : "Next →"}
                          </button>
                          {nextCountdown !== null && (
                            <div className="next-countdown">
                              Continuing in <span className="next-countdown__num">{nextCountdown}</span>s…
                            </div>
                          )}
                        </>
                      )}

                      {sliderResult.points === 0 && sliderResult.accuracy === 0 ? (
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
                            <div className="accuracy-points__value" style={{ color: sliderResult.accuracy >= 90 ? "#00ffa0" : sliderResult.accuracy >= 70 ? "#f0c040" : "#ff6b6b" }}>
                              {sliderResult.accuracy}%
                            </div>
                          </div>
                          <div className="accuracy-points__divider" />
                          <div className="accuracy-points__stat">
                            <div className="accuracy-points__label">Points</div>
                            <div className="accuracy-points__value" style={{ color: sliderResult.accuracy >= 90 ? "#00ffa0" : sliderResult.accuracy >= 70 ? "#f0c040" : "#ff6b6b" }}>
                              +{sliderResult.points}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── RESULT ───────────────────────────────────────────────────────── */}
        {screen === "result" && (
          <div className="citymix-result-screen">
            {mode === "multi" && mp.opponent ? (
              <div className="result-header-multi">
                <div className="result-score-side">
                  <div className="result-score-side__label">You</div>
                  <div className={`result-score-side__value ${myValueColor}`}>{totalScore.toLocaleString()}</div>
                  <div className="result-score-side__total">/ {MAX_TOTAL.toLocaleString()}</div>
                </div>
                <div className="result-header-multi__center">
                  <div className="result-emoji--pop">{pct >= 0.75 ? "🏆" : pct >= 0.5 ? "🎯" : "🗺️"}</div>
                  <h1 className="result-title--pop">Results</h1>
                </div>
                <div className="result-score-side">
                  <div className="result-score-side__label">Opp.</div>
                  <div className={`result-score-side__value ${oppValueColor}`}>{mp.opponent.score.toLocaleString()}</div>
                  <div className="result-score-side__total">/ {MAX_TOTAL.toLocaleString()}</div>
                </div>
              </div>
            ) : (
              <>
                <div className="result-emoji--pop">
                  {pct >= 0.75 ? "🏆" : pct >= 0.5 ? "🎯" : "🗺️"}
                </div>
                <h1 className="result-title--pop">Final Score</h1>
                <div className="score-circle score-circle--md score-circle--solo" style={{ margin: "20px auto" }}>
                  <div className="score-circle__value score-circle__value--md score-circle__value--gold">{totalScore.toLocaleString()}</div>
                  <div className="score-circle__total score-circle__total--md">/ {MAX_TOTAL.toLocaleString()}</div>
                </div>
              </>
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
                {roundResults.map((entry, i) =>
                  entry.type === "binary"
                    ? <BinaryResultCard key={i} entry={entry} />
                    : <SliderResultCard key={i} entry={entry} />
                )}
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
                  <button onClick={handleRequestRematch} className="btn-rematch btn-hover">⚡ Rematch</button>
                )}
              </div>
            )}

            {mode === "multi" && mp.opponent ? (
              <>
                <div className="result-buttons--pop">
                  <button onClick={handleNewOpponent} className="btn-result-outline btn-hover-sm">🔄 New Opponent</button>
                  <button onClick={handleBackToMenu}  className="btn-result-ghost  btn-hover-sm">← Menu</button>
                </div>
                {resultCountdown !== null && (
                  <div className="next-countdown" style={{ marginTop: 8 }}>
                    Returning to menu in <span className="next-countdown__num">{resultCountdown}</span>s…
                  </div>
                )}
              </>
            ) : (
              <div className="result-buttons--pop">
                <button onClick={startSolo}  className="btn-result-primary btn-hover-sm">Solo</button>
                {isMultiplayerEnabled() && <button onClick={startMulti} className="btn-result-outline btn-hover-sm">⚡ Multiplayer</button>}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
