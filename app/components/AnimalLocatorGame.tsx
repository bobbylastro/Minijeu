"use client";
import { memo, useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import "@/app/food/food.css";
import "@/app/animal-locator/animal-locator.css";
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

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), { ssr: false });

// ─── Types ───────────────────────────────────────────────────────────────────
interface Animal {
  name: string;
  country: string;
  countryCode: string;
  type: string;
  hint: string;
  wiki: string;
  image_url?: string | null;
}

type Phase = "home" | "playing" | "result";
type Mode  = "solo" | "multi";

// ─── Constants ───────────────────────────────────────────────────────────────
const ROUNDS_PER_GAME = 10;
const ROUND_SECONDS   = 25;
const INTRO_SECONDS   = 3;
const MAX_SCORE       = ROUNDS_PER_GAME * 100;

const TYPE_ICONS: Record<string, string> = {
  Mammal: "🐾", Bird: "🐦", Reptile: "🦎", Amphibian: "🐸", Fish: "🐟",
};

function typeBadgeClass(type: string) {
  return `al-type-badge al-type-badge--${type.toLowerCase()}`;
}

function pickAnimals(animals: Animal[], n: number, seed?: number): Animal[] {
  if (seed !== undefined) return seededShuffle([...animals], seed).slice(0, n);
  return [...animals].sort(() => Math.random() - 0.5).slice(0, n);
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

// ─── Animal photo (with wiki proxy fallback) ─────────────────────────────────
function AnimalPhoto({ animal, className = "" }: { animal: Animal; className?: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => { setLoaded(false); setFailed(false); }, [animal]);

  const src = animal.image_url
    ? animal.image_url
    : `/api/wiki-image?title=${encodeURIComponent(animal.wiki)}`;

  if (failed) return (
    <div className="al-photo-fallback">
      <span className="al-photo-fallback__emoji">{TYPE_ICONS[animal.type] ?? "🐾"}</span>
      <span>{animal.name}</span>
    </div>
  );
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={animal.name}
      className={`fd-dish-photo${loaded ? " fd-dish-photo--visible" : ""} ${className}`}
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
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
function IntroPopup({ animal, round, total, onDismiss }: {
  animal: Animal; round: number; total: number; onDismiss: () => void;
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
        <div className="fd-intro-photo-wrap al-photo-wrap">
          <AnimalPhoto animal={animal} className="fd-intro-photo" />
        </div>
        <span className={typeBadgeClass(animal.type)}>
          {TYPE_ICONS[animal.type] ?? "🐾"} {animal.type}
        </span>
        <div className="fd-intro-name">{animal.name}</div>
        <div className="fd-intro-hint">{animal.hint}</div>
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

function FeedbackPopup({ animal, clickedCode, onNext, isLast, multiWaiting, opponentTimeLeft }: {
  animal: Animal; clickedCode: string | null; onNext: () => void; isLast: boolean;
  multiWaiting: boolean; opponentTimeLeft?: number;
}) {
  const isCorrect = clickedCode === animal.countryCode;
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
          {!isCorrect && <span className="fd-feedback-card__label">It was </span>}
          <strong>{animal.country}</strong>
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
            {multiWaiting ? waitLabel : isLast ? "See Results →" : "Next Animal →"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Home screen ──────────────────────────────────────────────────────────────
function HomeScreen({ onSolo, onMulti }: { onSolo: () => void; onMulti: () => void }) {
  return (
    <div className="game-wrapper theme-safari">
      <div className="glow-orb glow-orb--orange" />
      <div className="glow-orb glow-orb--purple" />
      <Stars />
      <div className="home-screen">
        <div className="home-emoji">🌍</div>
        <p className="home-title">Animal <span className="accent">Locator</span></p>
        <p className="home-subtitle">An animal appears — click its home country on the map</p>

        <div className="how-it-works">
          <div className="how-it-works__title">How it works</div>
          {[
            ["🦁", `${ROUNDS_PER_GAME} rounds — a new animal every round`],
            ["🗺️", "Click the right country on the world map"],
            ["⏱️", `${ROUND_SECONDS} seconds per animal — be quick!`],
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
    <div className="game-wrapper theme-safari">
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
export default function AnimalLocatorGame({ initialData }: { initialData: Animal[] }) {
  const [phase, setPhase]               = useState<Phase>("home");
  const [mode, setMode]                 = useState<Mode>("solo");
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [animals, setAnimals]           = useState<Animal[]>([]);
  const [round, setRound]               = useState(0);
  const [score, setScore]               = useState(0);
  const [clickedCode, setClickedCode]   = useState<string | null>(null);
  const [pendingCountry, setPendingCountry] = useState<{ alpha2: string; name: string } | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<{ name: string; alpha2: string } | null>(null);
  const [showAnimalZoom, setShowAnimalZoom] = useState(false);
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

  const currentAnimal = animals[round] ?? null;

  // ── Multiplayer callbacks ──────────────────────────────────────────────────
  const onMpGameStart = useCallback((seed: number) => {
    setAnimals(seededShuffle([...initialData], seed).slice(0, ROUNDS_PER_GAME));
    setRound(0); setScore(0); setClickedCode(null); setPendingCountry(null);
    setRevealed(false); setMultiWaiting(false); setShowIntro(true);
    setPhase("playing");
  }, [initialData]);

  const onMpGameSync = useCallback((round: number, _seed: number, myScore: number, alreadyAnswered: boolean) => {
    setRound(round); setScore(myScore); setClickedCode(null); setPendingCountry(null);
    setRevealed(alreadyAnswered); setMultiWaiting(alreadyAnswered);
    setShowIntro(!alreadyAnswered); setPhase("playing");
  }, []);

  const onMpOpponentAnswered = useCallback(() => {}, []);
  const onMpRoundEnd = useCallback((_scores: Record<string, number>) => {}, []);

  const onMpNextRound = useCallback((nextRound: number) => {
    setMultiWaiting(false); setRound(nextRound); setClickedCode(null);
    setPendingCountry(null); setRevealed(false); setShowIntro(true);
  }, []);

  const onMpGameEnd = useCallback((_scores: Record<string, number>) => {
    setMultiWaiting(false); setPhase("result");
  }, []);

  const mp = useMultiplayer({
    gameType: "animal-locator",
    host: getPartykitHost(),
    onGameStart:        onMpGameStart,
    onGameSync:         onMpGameSync,
    onOpponentAnswered: onMpOpponentAnswered,
    onRoundEnd:         onMpRoundEnd,
    onNextRound:        onMpNextRound,
    onGameEnd:          onMpGameEnd,
  });
  useEffect(() => { mpRef.current = mp; });

  const { submitRating } = useRatingSubmit("animal-locator");

  useEffect(() => {
    if (phase !== "result" || mode !== "multi" || !mp.opponent) return;
    const result = score > mp.opponent.score ? "win" : score < mp.opponent.score ? "loss" : "tie";
    recordMatch(mp.opponent.name, result);
    submitRating(score, mp.opponent.score);
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
    const pts = alpha2 && currentAnimal && alpha2 === currentAnimal.countryCode ? 100 : 0;
    setScore(s => s + pts);
    if (modeRef.current === "multi") mpRef.current?.submitAnswer(alpha2, pts);
  }, [currentAnimal, stopTimer]);

  useEffect(() => {
    if (phase !== "playing" || showIntro) return;
    revealedRef.current = false;
    setTimeLeft(ROUND_SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { if (!revealedRef.current) reveal(null); stopTimer(); return 0; }
        return t - 1;
      });
    }, 1000);
    return stopTimer;
  }, [phase, round, showIntro, reveal, stopTimer]);

  // ── Game flow ──────────────────────────────────────────────────────────────
  function startSolo() {
    setMode("solo");
    setAnimals(pickAnimals(initialData, ROUNDS_PER_GAME));
    setRound(0); setScore(0); setClickedCode(null); setPendingCountry(null);
    setRevealed(false); setMultiWaiting(false); setShowIntro(true);
    setPhase("playing");
  }

  function startMulti() { mp.disconnect(); setMode("multi"); setShowNamePrompt(true); }
  function dismissIntro() { setShowIntro(false); }

  const nextRound = useCallback(() => {
    if (modeRef.current === "multi") { setMultiWaiting(true); mpRef.current?.readyForNext(); return; }
    setRound(r => {
      if (r + 1 >= ROUNDS_PER_GAME) { setPhase("result"); return r; }
      return r + 1;
    });
    setClickedCode(null); setPendingCountry(null); setRevealed(false); setShowIntro(true);
  }, []);

  function backToHome() { mp.disconnect(); setMode("solo"); setPhase("home"); }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (phase === "home") return (
    <>
      <HomeScreen onSolo={startSolo} onMulti={startMulti} />
      {showNamePrompt && (
        <MultiplayerEntryModal
          gameType="animal-locator"
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
        score={score} oppScore={mp.opponent?.score ?? null} mode={mode} onReplay={backToHome}
        rematchZone={mode === "multi" && mp.opponent ? (
          <RematchZone
            opponent={mp.opponent} myWantsRematch={mp.myWantsRematch}
            series={mp.series} onRematch={mp.requestRematch}
          />
        ) : undefined}
      />
      {mp.finalLeaderboard && (
        <LeaderboardOverlay leaderboard={mp.finalLeaderboard} onClose={() => { mp.disconnect(); backToHome(); }} />
      )}
    </>
  );

  if (!currentAnimal) return null;

  return (
    <div className="fd-game-wrapper">
      {/* Top bar */}
      <div className="fd-topbar">
        <div className="fd-topbar__round">Round {round + 1} / {ROUNDS_PER_GAME}</div>
        <div className="fd-topbar__score">⭐ {score} pts</div>
        {!showIntro && !revealed && <TimerRing seconds={timeLeft} total={ROUND_SECONDS} />}
      </div>

      {mode === "multi" && (
        <OpponentBar opponents={mp.opponents} myScore={score} maxScore={MAX_SCORE} />
      )}

      {/* Full-screen map */}
      <div className="fd-map-full">
        <LeafletMap
          key={round}
          correctCode={currentAnimal.countryCode}
          clickedCode={clickedCode}
          pendingCode={pendingCountry?.alpha2 ?? null}
          revealed={revealed}
          disabled={showIntro}
          onCountryClick={(alpha2, name) => {
            if (!revealed && !showIntro) {
              if (!isTouchRef.current) reveal(alpha2);
              else setPendingCountry({ alpha2, name });
            }
          }}
          onCountryHover={setHoveredCountry}
        />

        {/* Animal card — bottom-left overlay */}
        {!showIntro && (
          <div className="fd-dish-card fd-dish-card--clickable" onClick={() => setShowAnimalZoom(true)}>
            <div className="fd-dish-card__photo-wrap al-photo-wrap">
              <AnimalPhoto animal={currentAnimal} />
              <div className="fd-dish-card__zoom-hint">🔍</div>
            </div>
            <div className="al-card-info">
              <span className={typeBadgeClass(currentAnimal.type)}>
                {TYPE_ICONS[currentAnimal.type] ?? "🐾"} {currentAnimal.type}
              </span>
              <div className="fd-dish-name">{currentAnimal.name}</div>
              <div className="fd-dish-hint">{currentAnimal.hint}</div>
            </div>
          </div>
        )}

        {/* Animal zoom popup */}
        {showAnimalZoom && (
          <div className="fd-popup-backdrop fd-popup-backdrop--dim" onClick={() => setShowAnimalZoom(false)}>
            <div className="fd-dish-zoom-card" onClick={e => e.stopPropagation()}>
              <div className="fd-dish-zoom-card__photo al-photo-wrap">
                <AnimalPhoto animal={currentAnimal} />
              </div>
              <div className="fd-dish-zoom-card__info">
                <span className={typeBadgeClass(currentAnimal.type)}>
                  {TYPE_ICONS[currentAnimal.type] ?? "🐾"} {currentAnimal.type}
                </span>
                <div className="fd-dish-zoom-card__name">{currentAnimal.name}</div>
                <div className="fd-dish-zoom-card__hint">{currentAnimal.hint}</div>
              </div>
              <button className="fd-dish-zoom-card__close" onClick={() => setShowAnimalZoom(false)}>✕</button>
            </div>
          </div>
        )}

        {/* Country hover tooltip */}
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
        <IntroPopup animal={currentAnimal} round={round} total={ROUNDS_PER_GAME} onDismiss={dismissIntro} />
      )}

      {/* Feedback popup */}
      {revealed && (
        <FeedbackPopup
          animal={currentAnimal} clickedCode={clickedCode} onNext={nextRound}
          isLast={round + 1 >= ROUNDS_PER_GAME} multiWaiting={multiWaiting}
          opponentTimeLeft={mode === "multi" ? timeLeft : undefined}
        />
      )}

      <MultiplayerScreen
        status={mp.status} botCountdown={mp.botCountdown} onCancel={backToHome}
        onPlayBot={mp.playVsBot} onContinueSolo={() => { setMode("solo"); mp.disconnect(); }}
      />

      {/* Mobile confirm bar */}
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
