"use client";
import { memo, useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import "@/app/food/food.css";    // reuse identical visual design
import "@/app/globals.css";      // ensure related-games + page-level CSS is bundled
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { getPartykitHost, isMultiplayerEnabled } from "@/lib/partykitHost";
import { seededShuffle } from "@/lib/seededRandom";
import { recordMatch } from "@/lib/matchHistory";
import { useRatingSubmit } from "@/hooks/useRatingSubmit";
import MultiplayerScreen from "@/components/MultiplayerScreen";
import OpponentBar from "@/components/OpponentBar";
import MultiplayerEntryModal from "@/components/MultiplayerEntryModal";
import LeaderboardOverlay from "@/components/LeaderboardOverlay";
import RematchZone from "@/components/RematchZone";
import { trackEvent } from "@/lib/analytics";

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────
interface OriginItem {
  name: string;
  country: string;
  countryCode: string;
  category: string;
  hint: string;
  image_url?: string;
}

type Phase = "home" | "playing" | "result";
type Mode  = "solo" | "multi";

// ─── Constants ────────────────────────────────────────────────────────────────
const ROUNDS_PER_GAME = 10;
const ROUND_SECONDS   = 25;
const INTRO_SECONDS   = 3;
const MAX_SCORE       = ROUNDS_PER_GAME * 100;

function pickItems(items: OriginItem[], n: number, seed?: number): OriginItem[] {
  if (seed !== undefined) return seededShuffle([...items], seed).slice(0, n);
  return [...items].sort(() => Math.random() - 0.5).slice(0, n);
}

// ─── Stars ────────────────────────────────────────────────────────────────────
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

// ─── Item photo ───────────────────────────────────────────────────────────────
function ItemPhoto({ item, className = "" }: { item: OriginItem; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setLoaded(false);
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) setLoaded(true);
  }, [item]);

  if (!item.image_url) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={item.image_url}
      alt={item.name}
      className={`fd-dish-photo${loaded ? " fd-dish-photo--visible" : ""} ${className}`}
      onLoad={() => setLoaded(true)}
      draggable={false}
    />
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
function IntroPopup({ item, round, total, onDismiss }: {
  item: OriginItem; round: number; total: number; onDismiss: () => void;
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
          <ItemPhoto item={item} className="fd-intro-photo" />
        </div>
        <div className="fd-intro-name">{item.name}</div>
        <div className="fd-intro-hint">{item.hint}</div>
        <div className="fd-intro-bar">
          <div className="fd-intro-bar__fill" style={{ animationDuration: `${INTRO_SECONDS}s` }} />
        </div>
        <button className="btn-primary btn-hover fd-intro-guess-btn" onClick={onDismiss}>
          Guess ({countdown}s)
        </button>
      </div>
    </div>
  );
}

// ─── Feedback popup ───────────────────────────────────────────────────────────
const TIMEOUT_AUTO_ADVANCE_MS = 2000;

function FeedbackPopup({ item, clickedCode, onNext, isLast, multiWaiting, opponentTimeLeft }: {
  item: OriginItem; clickedCode: string | null; onNext: () => void; isLast: boolean;
  multiWaiting: boolean; opponentTimeLeft?: number;
}) {
  const isCorrect = clickedCode === item.countryCode;
  const isTimeout = !clickedCode;
  const [autoCountdown, setAutoCountdown] = useState(Math.round(TIMEOUT_AUTO_ADVANCE_MS / 1000));

  useEffect(() => {
    if (!isTimeout) return;
    const start = Date.now();
    const tick = setInterval(() => {
      const remaining = Math.ceil((TIMEOUT_AUTO_ADVANCE_MS - (Date.now() - start)) / 1000);
      setAutoCountdown(Math.max(0, remaining));
    }, 200);
    const advance = setTimeout(onNext, TIMEOUT_AUTO_ADVANCE_MS);
    return () => { clearInterval(tick); clearTimeout(advance); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimeout]);

  const waitLabel = opponentTimeLeft != null && opponentTimeLeft > 0
    ? `Opponent has ${opponentTimeLeft}s left…`
    : "Waiting for opponent…";

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
          {!isCorrect && <span className="fd-feedback-card__label">It was invented in </span>}
          <strong>{item.country}</strong>
        </div>
        <div className="fd-feedback-card__pts">
          {isCorrect ? "+100 pts ⭐" : "+0 pts"}
        </div>
        {isTimeout ? (
          <div className="fd-feedback-card__auto">
            {multiWaiting ? waitLabel : `Next in ${autoCountdown}s…`}
          </div>
        ) : (
          <button
            className="btn-next btn-hover-sm fd-feedback-card__btn"
            onClick={onNext}
            disabled={multiWaiting}
          >
            {multiWaiting ? waitLabel : isLast ? "See Results →" : "Next →"}
          </button>
        )}
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
        <div className="home-emoji">🌐</div>
        <p className="home-title">Origins <span className="accent">Quiz</span></p>
        <p className="home-subtitle">An icon of culture appears — click the map to find its country of origin</p>

        <div className="how-it-works">
          <div className="how-it-works__title">How it works</div>
          {[
            ["🌐", `${ROUNDS_PER_GAME} rounds — a new origin challenge every round`],
            ["🗺️", "Click the right country on the world map"],
            ["⏱️", `${ROUND_SECONDS} seconds per round — be quick!`],
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
function ResultScreen({ score, oppScore, mode, onReplay, rematchZone }: {
  score: number; oppScore: number | null; mode: Mode; onReplay: () => void; rematchZone?: React.ReactNode;
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
          {isMulti ? (iWon ? "You win!" : tied ? "It's a tie!" : "You lose!") : (pct >= 80 ? "Excellent!" : pct >= 50 ? "Well Done!" : "Keep Practicing!")}
        </h2>

        {isMulti ? (
          <div className="fd-result-scores">
            <div className={`score-circle score-circle--md ${myClass}`}>
              <span className="score-circle__label">You</span>
              <span className={`score-circle__value score-circle__value--md ${iWon ? "score-circle__value--green" : "score-circle__value--gold"}`}>{score}</span>
              <span className="score-circle__total score-circle__total--md">/ {MAX_SCORE}</span>
            </div>
            <div className={`score-circle score-circle--md ${oppClass}`}>
              <span className="score-circle__label">Opp.</span>
              <span className={`score-circle__value score-circle__value--md ${!iWon && !tied ? "score-circle__value--green" : "score-circle__value--gold"}`}>{oppScore}</span>
              <span className="score-circle__total score-circle__total--md">/ {MAX_SCORE}</span>
            </div>
          </div>
        ) : (
          <>
            <div className={`score-circle score-circle--lg ${myClass}`}>
              <span className={`score-circle__value score-circle__value--lg ${pct >= 80 ? "score-circle__value--green" : "score-circle__value--gold"}`}>{score}</span>
              <span className="score-circle__total score-circle__total--lg">/ {MAX_SCORE}</span>
            </div>
            <div className="result-score-bar" style={{ margin: "1rem 0" }}>
              <div
                className={`result-score-bar__fill ${pct >= 80 ? "result-score-bar__fill--excellent" : pct >= 50 ? "result-score-bar__fill--good" : "result-score-bar__fill--poor"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </>
        )}

        {rematchZone}

        <button className="btn-primary btn-hover" onClick={onReplay} style={{ marginTop: "0.5rem" }}>
          Play Again
        </button>
      </div>
    </div>
  );
}

// ─── Main game ────────────────────────────────────────────────────────────────
export default function OriginsGame({ initialData }: { initialData: OriginItem[] }) {
  const [phase, setPhase]               = useState<Phase>("home");
  const [mode, setMode]                 = useState<Mode>("solo");
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [items, setItems]               = useState<OriginItem[]>([]);
  const [round, setRound]               = useState(0);
  const [score, setScore]               = useState(0);
  const [clickedCode, setClickedCode]   = useState<string | null>(null);
  const [pendingCountry, setPendingCountry] = useState<{ alpha2: string; name: string } | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<{ name: string; alpha2: string } | null>(null);
  const [showItemZoom, setShowItemZoom] = useState(false);
  const [timeLeft, setTimeLeft]         = useState(ROUND_SECONDS);
  const [showIntro, setShowIntro]       = useState(false);
  const [revealed, setRevealed]         = useState(false);
  const [multiWaiting, setMultiWaiting] = useState(false);

  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const modeRef     = useRef<Mode>("solo");
  const isTouchRef  = useRef(false);
  const mpRef       = useRef<ReturnType<typeof useMultiplayer> | null>(null);
  const revealedRef = useRef(false);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => {
    isTouchRef.current = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  }, []);

  const currentItem = items[round] ?? null;

  // ── Multiplayer callbacks ──────────────────────────────────────────────────
  const onMpGameStart = useCallback((seed: number) => {
    trackEvent("game_start", { game_type: "origins", mode: "multi" });
    setItems(seededShuffle([...initialData], seed).slice(0, ROUNDS_PER_GAME));
    setRound(0);
    setScore(0);
    setClickedCode(null);
    setPendingCountry(null);
    setRevealed(false);
    setMultiWaiting(false);
    setShowIntro(true);
    setPhase("playing");
  }, [initialData]);

  const onMpGameSync = useCallback((round: number, _seed: number, myScore: number, alreadyAnswered: boolean) => {
    setRound(round);
    setScore(myScore);
    setClickedCode(null);
    setPendingCountry(null);
    setRevealed(alreadyAnswered);
    setMultiWaiting(alreadyAnswered);
    setShowIntro(!alreadyAnswered);
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
    gameType: "origins",
    host: getPartykitHost(),
    onGameStart:        onMpGameStart,
    onGameSync:         onMpGameSync,
    onOpponentAnswered: onMpOpponentAnswered,
    onRoundEnd:         onMpRoundEnd,
    onNextRound:        onMpNextRound,
    onGameEnd:          onMpGameEnd,
  });
  useEffect(() => { mpRef.current = mp; });

  const { submitRating } = useRatingSubmit("origins");

  // Record match outcome + ELO rating when result screen is shown
  useEffect(() => {
    if (phase !== "result" || mode !== "multi" || !mp.opponent) return;
    const result = score > mp.opponent.score ? "win" : score < mp.opponent.score ? "loss" : "tie";
    recordMatch(mp.opponent.name, result);
    submitRating(score, mp.opponent.score);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Analytics: track game completion ─────────────────────────────────────────
  useEffect(() => {
    if (phase !== "result") return;
    trackEvent("game_complete", {
      game_type: "origins",
      mode: mode as "solo" | "multi",
      final_score: score,
      max_score: MAX_SCORE,
      score_pct: Math.round((score / MAX_SCORE) * 100),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Timer ──────────────────────────────────────────────────────────────────
  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const reveal = useCallback((alpha2: string | null) => {
    if (modeRef.current !== "multi") stopTimer();
    revealedRef.current = true;
    setClickedCode(alpha2);
    setRevealed(true);
    const pts = alpha2 && currentItem && alpha2 === currentItem.countryCode ? 100 : 0;
    setScore(s => s + pts);
    if (modeRef.current === "multi") mpRef.current?.submitAnswer(alpha2, pts);
  }, [currentItem, stopTimer]);

  useEffect(() => {
    if (phase !== "playing" || showIntro) return;
    revealedRef.current = false;
    setTimeLeft(ROUND_SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (!revealedRef.current) reveal(null);
          stopTimer();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return stopTimer;
  }, [phase, round, showIntro, reveal, stopTimer]);

  // ── Game flow ──────────────────────────────────────────────────────────────
  function startSolo() {
    trackEvent("game_start", { game_type: "origins", mode: "solo" });
    setMode("solo");
    setItems(pickItems(initialData, ROUNDS_PER_GAME));
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

  const nextRound = useCallback(() => {
    if (modeRef.current === "multi") {
      setMultiWaiting(true);
      mpRef.current?.readyForNext();
      return;
    }
    setRound(r => {
      if (r + 1 >= ROUNDS_PER_GAME) { setPhase("result"); return r; }
      return r + 1;
    });
    setClickedCode(null);
    setPendingCountry(null);
    setRevealed(false);
    setShowIntro(true);
  }, []);

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
        <MultiplayerEntryModal
          gameType="origins"
          host={getPartykitHost()}
          onQuickMatch={name => { setShowNamePrompt(false); mp.joinQueue(name); }}
          onLobbyStart={(payload, myName) => {
            setShowNamePrompt(false);
            mp.joinFromLobby(payload.gameId, payload.seed, myName, payload.totalPlayers, payload.playerNames);
          }}
          onCancel={() => { setShowNamePrompt(false); setMode("solo"); }}
        />
      )}
      <MultiplayerScreen status={mp.status} botCountdown={mp.botCountdown} onCancel={backToHome} onPlayBot={mp.playVsBot} />
    </>
  );

  if (phase === "result") return (
    <>
      <ResultScreen
        score={score}
        oppScore={mp.opponent?.score ?? null}
        mode={mode}
        onReplay={backToHome}
        rematchZone={mode === "multi" && mp.opponent ? (
          <RematchZone
            opponent={mp.opponent}
            myWantsRematch={mp.myWantsRematch}
            series={mp.series}
            onRematch={mp.requestRematch}
          />
        ) : undefined}
      />
      {mp.finalLeaderboard && (
        <LeaderboardOverlay
          leaderboard={mp.finalLeaderboard}
          onClose={() => { mp.disconnect(); backToHome(); }}
        />
      )}
    </>
  );

  if (!currentItem) return null;

  return (
    <div className="fd-game-wrapper">
      {/* Top bar */}
      <div className="fd-topbar">
        <div className="fd-topbar__round">Round {round + 1} / {ROUNDS_PER_GAME}</div>
        <div className="fd-topbar__score">⭐ {score} pts</div>
        {!showIntro && !revealed && <TimerRing seconds={timeLeft} total={ROUND_SECONDS} />}
      </div>

      {/* Opponent bar */}
      {mode === "multi" && (
        <OpponentBar opponents={mp.opponents} myScore={score} maxScore={MAX_SCORE} />
      )}

      {/* Full-screen map */}
      <div className="fd-map-full">
        <LeafletMap
          key={round}
          correctCode={currentItem.countryCode}
          clickedCode={clickedCode}
          pendingCode={pendingCountry?.alpha2 ?? null}
          revealed={revealed}
          disabled={showIntro}
          onCountryClick={(alpha2, name) => {
            if (!revealed && !showIntro) {
              if (!isTouchRef.current) {
                reveal(alpha2);
              } else {
                setPendingCountry({ alpha2, name });
              }
            }
          }}
          onCountryHover={setHoveredCountry}
        />

        {/* Item card — bottom-left */}
        {!showIntro && (
          <div className="fd-dish-card fd-dish-card--clickable" onClick={() => setShowItemZoom(true)}>
            <div className="fd-dish-card__photo-wrap">
              <ItemPhoto item={currentItem} />
              <div className="fd-dish-card__zoom-hint">🔍</div>
            </div>
            <div className="fd-dish-card__info">
              <div className="fd-dish-name">{currentItem.name}</div>
              <div className="fd-dish-hint">{currentItem.category}</div>
            </div>
          </div>
        )}

        {/* Item zoom popup */}
        {showItemZoom && (
          <div className="fd-popup-backdrop fd-popup-backdrop--dim" onClick={() => setShowItemZoom(false)}>
            <div className="fd-dish-zoom-card" onClick={e => e.stopPropagation()}>
              <div className="fd-dish-zoom-card__photo">
                <ItemPhoto item={currentItem} />
              </div>
              <div className="fd-dish-zoom-card__info">
                <div className="fd-dish-zoom-card__name">{currentItem.name}</div>
                <div className="fd-dish-zoom-card__hint">{currentItem.hint}</div>
              </div>
              <button className="fd-dish-zoom-card__close" onClick={() => setShowItemZoom(false)}>✕</button>
            </div>
          </div>
        )}

        {/* Hover tooltip (desktop) */}
        {hoveredCountry && !pendingCountry ? (
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
          item={currentItem}
          round={round}
          total={ROUNDS_PER_GAME}
          onDismiss={dismissIntro}
        />
      )}

      {/* Feedback popup */}
      {revealed && (
        <FeedbackPopup
          item={currentItem}
          clickedCode={clickedCode}
          onNext={nextRound}
          isLast={round + 1 >= ROUNDS_PER_GAME}
          multiWaiting={multiWaiting}
          opponentTimeLeft={mode === "multi" ? timeLeft : undefined}
        />
      )}

      {/* Multiplayer overlay */}
      <MultiplayerScreen
        status={mp.status}
        botCountdown={mp.botCountdown}
        onCancel={backToHome}
        onPlayBot={mp.playVsBot}
        onContinueSolo={() => { setMode("solo"); mp.disconnect(); }}
      />

      {/* Confirm bar — mobile touch */}
      {pendingCountry && !revealed && !showIntro && (
        <div className="fd-confirm-bar">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="fd-confirm-bar__flag"
            src={`https://flagcdn.com/w40/${pendingCountry.alpha2.toLowerCase()}.png`}
            alt={pendingCountry.name}
          />
          <div className="fd-confirm-bar__body">
            <div className="fd-confirm-bar__name">{pendingCountry.name}</div>
            <div className="fd-confirm-bar__hint">Tap to confirm your answer</div>
          </div>
          <button
            className="fd-confirm-bar__btn"
            onClick={() => { reveal(pendingCountry.alpha2); setPendingCountry(null); }}
          >
            Confirm ✓
          </button>
        </div>
      )}
    </div>
  );
}
