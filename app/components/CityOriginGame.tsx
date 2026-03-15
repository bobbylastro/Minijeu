"use client";
import { memo, useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import rawCities from "@/app/cities.json";
import "@/app/food/food.css";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { getPartykitHost, isMultiplayerEnabled } from "@/lib/partykitHost";
import { seededShuffle } from "@/lib/seededRandom";
import MultiplayerScreen from "@/components/MultiplayerScreen";
import OpponentBar from "@/components/OpponentBar";
import NamePromptModal from "@/components/NamePromptModal";

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), { ssr: false });

// ─── Types ───────────────────────────────────────────────────────────────────
interface City {
  name: string;
  country: string;
  flag: string;
  population: number;
  image: string;
}

type Phase = "home" | "playing" | "result";
type Mode  = "solo" | "multi";

// ─── Constants ───────────────────────────────────────────────────────────────
const ALL_CITIES = (rawCities as City[]).filter(c => c.country && c.image && c.flag);
const ROUNDS_PER_GAME = 10;
const ROUND_SECONDS   = 30;
const INTRO_SECONDS   = 3;
const MAX_SCORE       = ROUNDS_PER_GAME * 100;

function getAlpha2(city: City): string {
  return city.flag.match(/\/([a-z]{2})\.png/)?.[1]?.toUpperCase() ?? "";
}

function formatPop(pop: number): string {
  if (pop >= 1_000_000) return `~${(pop / 1_000_000).toFixed(1)} million inhabitants`;
  return `~${Math.round(pop / 1_000)}K inhabitants`;
}

function pickCities(n: number, seed?: number): City[] {
  if (seed !== undefined) return seededShuffle([...ALL_CITIES], seed).slice(0, n);
  return [...ALL_CITIES].sort(() => Math.random() - 0.5).slice(0, n);
}

// ─── Stars ───────────────────────────────────────────────────────────────────
const STARS = Array.from({ length: 60 }, (_, i) => ({
  id: i, x: Math.random() * 100, y: Math.random() * 100,
  size: Math.random() * 2 + 0.5, opacity: Math.random() * 0.3 + 0.1, delay: Math.random() * 4,
}));
const Stars = memo(function Stars() {
  return (
    <div className="stars-layer">
      {STARS.map(s => (
        <div key={s.id} className="star" style={{
          left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size,
          opacity: s.opacity, animationDelay: `${s.delay}s`,
        }} />
      ))}
    </div>
  );
});

// ─── City photo ───────────────────────────────────────────────────────────────
function CityPhoto({ city, className = "" }: { city: City; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => setLoaded(false), [city]);
  return (
    <>
      {!loaded && <div className={`fd-dish-photo fd-dish-photo--placeholder ${className}`} />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={city.image}
        alt={city.name}
        className={`fd-dish-photo${loaded ? " fd-dish-photo--visible" : ""} ${className}`}
        onLoad={() => setLoaded(true)}
        draggable={false}
      />
    </>
  );
}

// ─── Timer ring ───────────────────────────────────────────────────────────────
function TimerRing({ seconds, total }: { seconds: number; total: number }) {
  const r = 17;
  const circ = 2 * Math.PI * r;
  const pct = seconds / total;
  const color = pct > 0.5 ? "#00ffa0" : pct > 0.25 ? "#f0c040" : "#ff6b6b";
  return (
    <svg className="fd-timer-ring" viewBox="0 0 46 46">
      <circle cx="23" cy="23" r={r} stroke="#ffffff18" strokeWidth="4" fill="none" />
      <circle
        cx="23" cy="23" r={r} stroke={color} strokeWidth="4" fill="none"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
        transform="rotate(-90 23 23)"
        style={{ transition: "stroke-dashoffset 1s linear, stroke 0.4s" }}
      />
      <text x="23" y="23" textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize="13" fontWeight="bold">{seconds}</text>
    </svg>
  );
}

// ─── Intro popup ──────────────────────────────────────────────────────────────
function IntroPopup({ city, round, total, onDismiss }: {
  city: City; round: number; total: number; onDismiss: () => void;
}) {
  const [countdown, setCountdown] = useState(INTRO_SECONDS);

  useEffect(() => {
    setCountdown(INTRO_SECONDS);
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(interval); onDismiss(); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  return (
    <div className="fd-popup-backdrop" onClick={onDismiss}>
      <div className="fd-intro-card" onClick={e => e.stopPropagation()}>
        <div className="fd-intro-round">Round {round + 1} / {total}</div>
        <div className="fd-intro-photo-wrap">
          <CityPhoto city={city} className="fd-intro-photo" />
        </div>
        <div className="fd-intro-name">{city.name}</div>
        <div className="fd-intro-hint">{formatPop(city.population)}</div>
        <div className="fd-intro-bar">
          <div
            className="fd-intro-bar__fill"
            style={{ animationDuration: `${INTRO_SECONDS}s` }}
          />
        </div>
        <button className="btn-primary btn-hover fd-intro-guess-btn" onClick={onDismiss}>
          Guess ({countdown}s)
        </button>
      </div>
    </div>
  );
}

// ─── Feedback popup ───────────────────────────────────────────────────────────
function FeedbackPopup({ city, clickedCode, onNext, isLast, multiWaiting }: {
  city: City; clickedCode: string | null; onNext: () => void; isLast: boolean; multiWaiting: boolean;
}) {
  const isCorrect = clickedCode === getAlpha2(city);
  const isTimeout = !clickedCode;

  return (
    <div className="fd-popup-backdrop fd-popup-backdrop--dim">
      <div className={`fd-feedback-card fd-feedback-card--${isCorrect ? "correct" : isTimeout ? "timeout" : "wrong"}`}>
        <div className="fd-feedback-card__icon">
          {isCorrect ? "✅" : isTimeout ? "⏱️" : "❌"}
        </div>
        <div className={`fd-feedback-card__verdict feedback__text ${isCorrect ? "feedback__text--correct" : "feedback__text--wrong"}`}>
          {isCorrect ? "Correct!" : isTimeout ? "Time's up!" : "Wrong!"}
        </div>
        <div className="fd-feedback-card__country">
          {!isCorrect && <span className="fd-feedback-card__label">It was </span>}
          <strong>{city.country}</strong>
        </div>
        <div className="fd-feedback-card__pts">
          {isCorrect ? "+100 pts ⭐" : "+0 pts"}
        </div>
        <button
          className="btn-next btn-hover-sm fd-feedback-card__btn"
          onClick={onNext}
          disabled={multiWaiting}
        >
          {multiWaiting
            ? "Waiting for opponent…"
            : isLast ? "See Results →" : "Next City →"}
        </button>
      </div>
    </div>
  );
}

// ─── Home screen ──────────────────────────────────────────────────────────────
function HomeScreen({ onSolo, onMulti }: { onSolo: () => void; onMulti: () => void }) {
  return (
    <div className="game-wrapper">
      <div className="glow-orb glow-orb--purple" />
      <div className="glow-orb glow-orb--orange" />
      <Stars />
      <div className="home-screen">
        <div className="home-emoji">🏙️</div>
        <h1 className="home-title">City <span className="accent">Mapper</span></h1>
        <p className="home-subtitle">A city photo appears — click the map to find its country</p>

        <div className="how-it-works">
          <div className="how-it-works__title">How it works</div>
          {[
            ["🏙️", `${ROUNDS_PER_GAME} rounds — a new city every round`],
            ["🗺️", "Click the right country on the world map"],
            ["⏱️", `${ROUND_SECONDS} seconds per city — be quick!`],
            ["⭐", "100 pts per correct answer — max 1000 pts"],
          ].map(([icon, text]) => (
            <div key={text as string} className="how-it-works__item">
              <span className="how-it-works__icon">{icon}</span>
              <span className="how-it-works__text">{text as string}</span>
            </div>
          ))}
        </div>

        <div className="home-buttons">
          <button className="btn-primary btn-hover" onClick={onSolo}>Play Solo</button>
          {isMultiplayerEnabled() && (
            <button className="btn-outline btn-hover" onClick={onMulti}>⚡ Multiplayer</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Result screen ────────────────────────────────────────────────────────────
function ResultScreen({ score, oppScore, mode, onReplay }: {
  score: number; oppScore: number | null; mode: Mode; onReplay: () => void;
}) {
  const pct = (score / MAX_SCORE) * 100;
  const isMulti = mode === "multi" && oppScore !== null;
  const iWon = isMulti && score > oppScore!;
  const tied = isMulti && score === oppScore!;

  const myClass = isMulti
    ? (iWon ? "score-circle--win" : tied ? "score-circle--neutral" : "score-circle--lose")
    : (pct >= 80 ? "score-circle--win" : pct >= 50 ? "score-circle--neutral" : "score-circle--lose");
  const oppClass = isMulti
    ? (!iWon && !tied ? "score-circle--win" : tied ? "score-circle--neutral" : "score-circle--lose")
    : "";

  return (
    <div className="game-wrapper">
      <Stars />
      <div className="home-screen">
        <div className="home-emoji">
          {isMulti ? (iWon ? "🏆" : tied ? "🤝" : "😅") : (pct >= 80 ? "🏆" : pct >= 50 ? "🙂" : "😅")}
        </div>
        <h2 className="home-title" style={{ fontSize: "1.6rem" }}>
          {isMulti ? (iWon ? "You win!" : tied ? "It's a tie!" : "You lose!") : "Game Over!"}
        </h2>

        {isMulti ? (
          <div className="fd-result-scores">
            <div className={`score-circle score-circle--md ${myClass}`}>
              <span className="score-circle__label">You</span>
              <span className="score-circle__value">{score}</span>
              <span className="score-circle__label">/ {MAX_SCORE}</span>
            </div>
            <div className={`score-circle score-circle--md ${oppClass}`}>
              <span className="score-circle__label">Opp.</span>
              <span className="score-circle__value">{oppScore}</span>
              <span className="score-circle__label">/ {MAX_SCORE}</span>
            </div>
          </div>
        ) : (
          <>
            <div className={`score-circle score-circle--lg ${myClass}`}>
              <span className="score-circle__value">{score}</span>
              <span className="score-circle__label">/ {MAX_SCORE}</span>
            </div>
            <div className="result-score-bar" style={{ margin: "1rem 0" }}>
              <div
                className={`result-score-bar__fill ${pct >= 80 ? "result-score-bar__fill--excellent" : pct >= 50 ? "result-score-bar__fill--good" : "result-score-bar__fill--poor"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </>
        )}

        <button className="btn-primary btn-hover" onClick={onReplay} style={{ marginTop: "0.5rem" }}>
          Play Again
        </button>
      </div>
    </div>
  );
}

// ─── Main game ────────────────────────────────────────────────────────────────
export default function CityOriginGame() {
  const [phase, setPhase]               = useState<Phase>("home");
  const [mode, setMode]                 = useState<Mode>("solo");
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [cities, setCities]             = useState<City[]>([]);
  const [round, setRound]               = useState(0);
  const [score, setScore]               = useState(0);
  const [clickedCode, setClickedCode]   = useState<string | null>(null);
  const [pendingCountry, setPendingCountry] = useState<{ alpha2: string; name: string } | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<{ name: string; alpha2: string } | null>(null);
  const [showCityZoom, setShowCityZoom] = useState(false);
  const [timeLeft, setTimeLeft]         = useState(ROUND_SECONDS);
  const [showIntro, setShowIntro]       = useState(false);
  const [revealed, setRevealed]         = useState(false);
  const [multiWaiting, setMultiWaiting] = useState(false);

  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const modeRef    = useRef<Mode>("solo");
  const isTouchRef = useRef(false);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => {
    isTouchRef.current = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  }, []);

  const currentCity = cities[round] ?? null;

  // ── Multiplayer callbacks ──────────────────────────────────────────────────
  const onMpGameStart = useCallback((seed: number) => {
    setCities(seededShuffle([...ALL_CITIES], seed).slice(0, ROUNDS_PER_GAME));
    setRound(0);
    setScore(0);
    setClickedCode(null);
    setPendingCountry(null);
    setRevealed(false);
    setMultiWaiting(false);
    setShowIntro(true);
    setPhase("playing");
  }, []);

  const onMpOpponentAnswered = useCallback(() => {}, []);
  const onMpRoundEnd = useCallback((_scores: Record<string, number>) => {}, []);

  const onMpNextRound = useCallback((nextRound: number) => {
    setMultiWaiting(false);
    setRound(nextRound);
    setClickedCode(null);
    setPendingCountry(null);
    setRevealed(false);
    setShowIntro(true);
  }, []);

  const onMpGameEnd = useCallback((_scores: Record<string, number>) => {
    setMultiWaiting(false);
    setPhase("result");
  }, []);

  const mp = useMultiplayer({
    gameType: "citymap",
    host: getPartykitHost(),
    onGameStart:        onMpGameStart,
    onOpponentAnswered: onMpOpponentAnswered,
    onRoundEnd:         onMpRoundEnd,
    onNextRound:        onMpNextRound,
    onGameEnd:          onMpGameEnd,
  });

  // ── Timer ──────────────────────────────────────────────────────────────────
  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const reveal = useCallback((alpha2: string | null) => {
    stopTimer();
    setClickedCode(alpha2);
    setRevealed(true);
    const pts = alpha2 && currentCity && alpha2 === getAlpha2(currentCity) ? 100 : 0;
    setScore(s => s + pts);
    if (modeRef.current === "multi") mp.submitAnswer(alpha2, pts);
  }, [currentCity, stopTimer, mp]);

  useEffect(() => {
    if (phase !== "playing" || revealed || showIntro) return;
    setTimeLeft(ROUND_SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { reveal(null); return 0; }
        return t - 1;
      });
    }, 1000);
    return stopTimer;
  }, [phase, round, revealed, showIntro, reveal, stopTimer]);

  // ── Game flow ──────────────────────────────────────────────────────────────
  function startSolo() {
    setMode("solo");
    setCities(pickCities(ROUNDS_PER_GAME));
    setRound(0);
    setScore(0);
    setClickedCode(null);
    setPendingCountry(null);
    setRevealed(false);
    setMultiWaiting(false);
    setShowIntro(true);
    setPhase("playing");
  }

  function startMulti() {
    mp.disconnect();
    setMode("multi");
    setShowNamePrompt(true);
  }

  function dismissIntro() { setShowIntro(false); }

  function nextRound() {
    if (modeRef.current === "multi") {
      setMultiWaiting(true);
      mp.readyForNext();
      return;
    }
    if (round + 1 >= ROUNDS_PER_GAME) { setPhase("result"); return; }
    setRound(r => r + 1);
    setClickedCode(null);
    setPendingCountry(null);
    setRevealed(false);
    setShowIntro(true);
  }

  function backToHome() {
    mp.disconnect();
    setMode("solo");
    setPhase("home");
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (phase === "home") return (
    <>
      <HomeScreen onSolo={startSolo} onMulti={startMulti} />
      {showNamePrompt && (
        <NamePromptModal
          onConfirm={name => { setShowNamePrompt(false); mp.joinQueue(name); }}
          onCancel={() => { setShowNamePrompt(false); setMode("solo"); }}
        />
      )}
      <MultiplayerScreen status={mp.status} onCancel={backToHome} />
    </>
  );

  if (phase === "result") return (
    <ResultScreen
      score={score}
      oppScore={mp.opponent?.score ?? null}
      mode={mode}
      onReplay={backToHome}
    />
  );

  if (!currentCity) return null;

  const correctCode = getAlpha2(currentCity);

  return (
    <div className="fd-game-wrapper">
      {/* Top bar */}
      <div className="fd-topbar">
        <div className="fd-topbar__round">Round {round + 1} / {ROUNDS_PER_GAME}</div>
        <div className="fd-topbar__score">⭐ {score} pts</div>
        {!showIntro && !revealed && <TimerRing seconds={timeLeft} total={ROUND_SECONDS} />}
      </div>

      {/* Opponent bar */}
      {mode === "multi" && mp.opponent && (
        <OpponentBar opponent={mp.opponent} myScore={score} maxScore={MAX_SCORE} />
      )}

      {/* Full-screen map */}
      <div className="fd-map-full">
        <LeafletMap
          key={round}
          correctCode={correctCode}
          clickedCode={clickedCode}
          pendingCode={pendingCountry?.alpha2 ?? null}
          revealed={revealed}
          disabled={showIntro}
          onCountryClick={(alpha2, name) => {
            if (!revealed && !showIntro) {
              if (!isTouchRef.current) {
                reveal(alpha2);
              } else if (pendingCountry?.alpha2 === alpha2) {
                reveal(alpha2);
                setPendingCountry(null);
              } else {
                setPendingCountry({ alpha2, name });
              }
            }
          }}
          onCountryHover={setHoveredCountry}
        />

        {/* City card — bottom-left reminder */}
        {!showIntro && (
          <div className="fd-dish-card fd-dish-card--clickable" onClick={() => setShowCityZoom(true)}>
            <div className="fd-dish-card__photo-wrap">
              <CityPhoto city={currentCity} />
              <div className="fd-dish-card__zoom-hint">🔍</div>
            </div>
            <div className="fd-dish-card__info">
              <div className="fd-dish-name">{currentCity.name}</div>
              <div className="fd-dish-hint">{formatPop(currentCity.population)}</div>
            </div>
          </div>
        )}

        {/* City zoom popup */}
        {showCityZoom && (
          <div className="fd-popup-backdrop fd-popup-backdrop--dim" onClick={() => setShowCityZoom(false)}>
            <div className="fd-dish-zoom-card" onClick={e => e.stopPropagation()}>
              <div className="fd-dish-zoom-card__photo">
                <CityPhoto city={currentCity} />
              </div>
              <div className="fd-dish-zoom-card__info">
                <div className="fd-dish-zoom-card__name">{currentCity.name}</div>
                <div className="fd-dish-zoom-card__hint">{formatPop(currentCity.population)}</div>
              </div>
              <button className="fd-dish-zoom-card__close" onClick={() => setShowCityZoom(false)}>✕</button>
            </div>
          </div>
        )}

        {/* Country tooltip */}
        {hoveredCountry ? (
          <div className="fd-country-tag">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="fd-country-tag__flag"
              src={`https://flagcdn.com/w40/${hoveredCountry.alpha2.toLowerCase()}.png`}
              alt={hoveredCountry.name}
            />
            <span className="fd-country-tag__name">{hoveredCountry.name}</span>
          </div>
        ) : pendingCountry && !revealed ? (
          <div className="fd-country-tag fd-country-tag--pending">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="fd-country-tag__flag"
              src={`https://flagcdn.com/w40/${pendingCountry.alpha2.toLowerCase()}.png`}
              alt={pendingCountry.name}
            />
            <span className="fd-country-tag__name">{pendingCountry.name}</span>
            <span className="fd-country-tag__confirm">Tap again to confirm</span>
          </div>
        ) : (
          <div className="fd-map-tooltip">
            {showIntro ? "" : "Click on a country to answer"}
          </div>
        )}
      </div>

      {/* Intro popup */}
      {showIntro && (
        <IntroPopup
          city={currentCity}
          round={round}
          total={ROUNDS_PER_GAME}
          onDismiss={dismissIntro}
        />
      )}

      {/* Feedback popup */}
      {revealed && (
        <FeedbackPopup
          city={currentCity}
          clickedCode={clickedCode}
          onNext={nextRound}
          isLast={round + 1 >= ROUNDS_PER_GAME}
          multiWaiting={multiWaiting}
        />
      )}

      {/* Multiplayer overlay */}
      <MultiplayerScreen
        status={mp.status}
        onCancel={backToHome}
        onContinueSolo={() => { setMode("solo"); }}
      />
    </div>
  );
}
