"use client";
import { memo, useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import rawDishes from "@/app/food_data.json";
import "@/app/food/food.css";

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), { ssr: false });

// ─── Types ───────────────────────────────────────────────────────────────────
interface Dish {
  name: string;
  country: string;
  countryCode: string;
  wiki: string;
  hint: string;
  image_url?: string;
}

type Phase = "home" | "playing" | "result";

// ─── Constants ───────────────────────────────────────────────────────────────
const ALL_DISHES = rawDishes as Dish[];
const ROUNDS_PER_GAME = 10;
const ROUND_SECONDS = 30;
const INTRO_SECONDS = 3;

function pickDishes(n: number): Dish[] {
  return [...ALL_DISHES].sort(() => Math.random() - 0.5).slice(0, n);
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

// ─── Dish photo ───────────────────────────────────────────────────────────────
function DishPhoto({ dish, className = "" }: { dish: Dish; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => setLoaded(false), [dish]);
  if (!dish.image_url) {
    return <div className={`fd-dish-photo fd-dish-photo--placeholder ${className}`} />;
  }
  return (
    <>
      {!loaded && <div className={`fd-dish-photo fd-dish-photo--placeholder ${className}`} />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={dish.image_url}
        alt={dish.name}
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
function IntroPopup({ dish, round, total, onDismiss }: {
  dish: Dish; round: number; total: number; onDismiss: () => void;
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
          <DishPhoto dish={dish} className="fd-intro-photo" />
        </div>
        <div className="fd-intro-name">{dish.name}</div>
        <div className="fd-intro-hint">{dish.hint}</div>
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
function FeedbackPopup({ dish, clickedCode, onNext, isLast }: {
  dish: Dish; clickedCode: string | null; onNext: () => void; isLast: boolean;
}) {
  const isCorrect = clickedCode === dish.countryCode;
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
          <strong>{dish.country}</strong>
        </div>
        <div className="fd-feedback-card__pts">
          {isCorrect ? "+100 pts ⭐" : "+0 pts"}
        </div>
        <button className="btn-next btn-hover-sm fd-feedback-card__btn" onClick={onNext}>
          {isLast ? "See Results →" : "Next Dish →"}
        </button>
      </div>
    </div>
  );
}

// ─── Home screen ──────────────────────────────────────────────────────────────
function HomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="game-wrapper">
      <div className="glow-orb glow-orb--purple" style={{ top: "15%", left: "20%" }} />
      <div className="glow-orb glow-orb--orange" style={{ bottom: "20%", right: "15%" }} />
      <Stars />
      <div className="home-screen">
        <div className="fd-home-card">
          <div className="fd-home-emoji">🍽️</div>
          <h1 className="home-title">Food <span className="home-title--pop accent">Origins</span></h1>
          <p className="home-subtitle">A dish appears — click on the map to find its country of origin.</p>
          <div className="fd-home-meta">
            <span>🗺️ {ROUNDS_PER_GAME} rounds</span>
            <span>⏱️ {ROUND_SECONDS}s per dish</span>
            <span>🌍 World map</span>
          </div>
          <button className="btn-primary btn-hover" onClick={onStart}>Play Solo</button>
        </div>
      </div>
    </div>
  );
}

// ─── Result screen ────────────────────────────────────────────────────────────
function ResultScreen({ score, onReplay }: { score: number; onReplay: () => void }) {
  const max = ROUNDS_PER_GAME * 100;
  const pct = (score / max) * 100;
  const cls = pct >= 80 ? "score-circle--win" : pct >= 50 ? "score-circle--neutral" : "score-circle--lose";
  return (
    <div className="game-wrapper">
      <Stars />
      <div className="home-screen">
        <div className="fd-home-card">
          <div className="fd-home-emoji">🏆</div>
          <h2 className="home-title" style={{ fontSize: "1.6rem" }}>Game Over!</h2>
          <div className={`score-circle score-circle--lg ${cls}`}>
            <span className="score-circle__value">{score}</span>
            <span className="score-circle__label">/ {max}</span>
          </div>
          <div className="result-score-bar" style={{ margin: "1rem 0" }}>
            <div
              className={`result-score-bar__fill ${pct >= 80 ? "result-score-bar__fill--excellent" : pct >= 50 ? "result-score-bar__fill--good" : "result-score-bar__fill--poor"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <button className="btn-primary btn-hover" onClick={onReplay} style={{ marginTop: "0.5rem" }}>Play Again</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main game ────────────────────────────────────────────────────────────────
export default function FoodOriginGame() {
  const [phase, setPhase] = useState<Phase>("home");
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [clickedCode, setClickedCode] = useState<string | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<{ name: string; alpha2: string } | null>(null);
  const [showDishZoom, setShowDishZoom] = useState(false);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [showIntro, setShowIntro] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentDish = dishes[round] ?? null;

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const reveal = useCallback((alpha2: string | null) => {
    stopTimer();
    setClickedCode(alpha2);
    setRevealed(true);
    const pts = alpha2 && currentDish && alpha2 === currentDish.countryCode ? 100 : 0;
    setScore(s => s + pts);
  }, [currentDish, stopTimer]);

  // Timer — only runs when not in intro and not revealed
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

  function startGame() {
    setDishes(pickDishes(ROUNDS_PER_GAME));
    setRound(0);
    setScore(0);
    setClickedCode(null);
    setRevealed(false);
    setShowIntro(true);
    setPhase("playing");
  }

  function dismissIntro() {
    setShowIntro(false);
  }

  function nextRound() {
    if (round + 1 >= ROUNDS_PER_GAME) { setPhase("result"); return; }
    setRound(r => r + 1);
    setClickedCode(null);
    setRevealed(false);
    setShowIntro(true);
  }

  if (phase === "home") return <HomeScreen onStart={startGame} />;
  if (phase === "result") return <ResultScreen score={score} onReplay={() => setPhase("home")} />;
  if (!currentDish) return null;

  return (
    <div className="fd-game-wrapper">
      {/* Top bar */}
      <div className="fd-topbar">
        <div className="fd-topbar__round">Round {round + 1} / {ROUNDS_PER_GAME}</div>
        <div className="fd-topbar__score">⭐ {score} pts</div>
        {!showIntro && !revealed && <TimerRing seconds={timeLeft} total={ROUND_SECONDS} />}
      </div>

      {/* Full-screen map */}
      <div className="fd-map-full">
        <LeafletMap
          key={round}
          correctCode={currentDish.countryCode}
          clickedCode={clickedCode}
          revealed={revealed}
          disabled={showIntro}
          onCountryClick={(alpha2, name) => { if (!revealed && !showIntro) reveal(alpha2); }}
          onCountryHover={setHoveredCountry}
        />

        {/* Dish card — bottom-left reminder */}
        {!showIntro && (
          <div className="fd-dish-card fd-dish-card--clickable" onClick={() => setShowDishZoom(true)}>
            <div className="fd-dish-card__photo-wrap">
              <DishPhoto dish={currentDish} />
              <div className="fd-dish-card__zoom-hint">🔍</div>
            </div>
            <div className="fd-dish-card__info">
              <div className="fd-dish-name">{currentDish.name}</div>
              <div className="fd-dish-hint">{currentDish.hint}</div>
            </div>
          </div>
        )}

        {/* Dish zoom popup */}
        {showDishZoom && (
          <div className="fd-popup-backdrop fd-popup-backdrop--dim" onClick={() => setShowDishZoom(false)}>
            <div className="fd-dish-zoom-card" onClick={e => e.stopPropagation()}>
              <div className="fd-dish-zoom-card__photo">
                <DishPhoto dish={currentDish} />
              </div>
              <div className="fd-dish-zoom-card__info">
                <div className="fd-dish-zoom-card__name">{currentDish.name}</div>
                <div className="fd-dish-zoom-card__hint">{currentDish.hint}</div>
              </div>
              <button className="fd-dish-zoom-card__close" onClick={() => setShowDishZoom(false)}>✕</button>
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
        ) : (
          <div className="fd-map-tooltip">
            {showIntro ? "" : "Click on a country to answer"}
          </div>
        )}
      </div>

      {/* Intro popup */}
      {showIntro && (
        <IntroPopup
          dish={currentDish}
          round={round}
          total={ROUNDS_PER_GAME}
          onDismiss={dismissIntro}
        />
      )}

      {/* Feedback popup */}
      {revealed && (
        <FeedbackPopup
          dish={currentDish}
          clickedCode={clickedCode}
          onNext={nextRound}
          isLast={round + 1 >= ROUNDS_PER_GAME}
        />
      )}
    </div>
  );
}
