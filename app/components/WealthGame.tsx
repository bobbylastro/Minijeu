"use client";
import { memo, useState, useEffect, useRef, useCallback } from "react";
import rawData from "@/app/wealth_data.json";
import "@/app/wealth/wealth.css";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { getPartykitHost, isMultiplayerEnabled } from "@/lib/partykitHost";
import { useRatingSubmit } from "@/hooks/useRatingSubmit";
import { recordMatch } from "@/lib/matchHistory";
import RematchZone from "@/components/RematchZone";
import MultiplayerScreen from "@/components/MultiplayerScreen";
import OpponentBar from "@/components/OpponentBar";
import MultiplayerEntryModal from "@/components/MultiplayerEntryModal";
import LeaderboardOverlay from "@/components/LeaderboardOverlay";
import RelatedGames from "@/components/RelatedGames";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Celebrity {
  name: string;
  worth: number;       // net worth in $M
  displayWorth: string;
  category: string;
  hint: string;
  image: string;
  wiki?: string;       // Wikipedia page title (defaults to name)
}

interface DuelQuestion {
  type: "duel";
  left: Celebrity;
  right: Celebrity;
}

interface EstimationQuestion {
  type: "estimation";
  celebrity: Celebrity;
  options: { label: string; value: number }[];
  correctIdx: number;
}

type Question = DuelQuestion | EstimationQuestion;
type Phase = "home" | "playing" | "result";
type Mode  = "solo" | "multi";

// ─── Constants ────────────────────────────────────────────────────────────────
const ALL_CELEBS      = rawData as Celebrity[];
const ROUNDS_PER_GAME = 10;
const MAX_SCORE       = ROUNDS_PER_GAME * 100;
const FEEDBACK_DELAY  = 1500; // ms before auto-advancing in solo wrong-answer case

// ─── Seeded random ────────────────────────────────────────────────────────────
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function seededShuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Question generation ──────────────────────────────────────────────────────
function makeEstimationOptions(celeb: Celebrity, rand: () => number): { label: string; value: number }[] {
  const correct = celeb.worth;
  // One option 5-10x higher, one 5-10x lower
  const higherMult = 5 + Math.floor(rand() * 5); // 5-9
  const lowerDiv   = 5 + Math.floor(rand() * 5); // 5-9
  const higher = Math.round((correct * higherMult) / 1000) * 1000 || correct * higherMult;
  const lower  = Math.max(1, Math.round((correct / lowerDiv) / 100) * 100);

  const formatW = (v: number): string => {
    if (v >= 1000) return `$${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}B`;
    return `$${v}M`;
  };

  const opts = [
    { label: formatW(correct), value: correct },
    { label: formatW(higher),  value: higher  },
    { label: formatW(lower),   value: lower   },
  ];

  // Shuffle options
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return opts;
}

function generateQuestions(count: number, seed?: number): Question[] {
  const rand = seed !== undefined ? seededRandom(seed) : Math.random;
  const randFn = seed !== undefined ? rand : Math.random;

  const shuffled = seed !== undefined
    ? seededShuffle([...ALL_CELEBS], rand)
    : [...ALL_CELEBS].sort(() => Math.random() - 0.5);

  const questions: Question[] = [];
  let idx = 0;

  for (let i = 0; i < count; i++) {
    const isEstimation = randFn() < 0.2; // 20% estimation

    if (isEstimation && idx < shuffled.length) {
      const celeb = shuffled[idx++];
      const opts  = makeEstimationOptions(celeb, randFn);
      const correctIdx = opts.findIndex(o => o.value === celeb.worth);
      questions.push({ type: "estimation", celebrity: celeb, options: opts, correctIdx });
    } else {
      // Duel: pick two with appropriate ratio
      const round = i;
      let left: Celebrity | null = null;
      let right: Celebrity | null = null;
      let attempts = 0;

      while (attempts < 30 && idx + 1 < shuffled.length) {
        const a = shuffled[idx];
        const b = shuffled[idx + 1];
        const ratio = Math.max(a.worth, b.worth) / Math.min(a.worth, b.worth);

        let valid = false;
        if (round < 3 && ratio > 5) valid = true;
        else if (round >= 3 && round <= 6 && ratio >= 2 && ratio <= 20) valid = true;
        else if (round > 6 && ratio >= 1.5 && ratio <= 3) valid = true;
        else if (ratio >= 1.3) valid = true; // fallback

        if (valid) {
          left  = a;
          right = b;
          idx  += 2;
          break;
        }
        // Try shifting
        idx++;
        attempts++;
      }

      if (!left || !right) {
        // Fallback: just pick next two
        left  = shuffled[Math.min(idx,     shuffled.length - 1)];
        right = shuffled[Math.min(idx + 1, shuffled.length - 1)];
        idx  += 2;
      }

      questions.push({ type: "duel", left, right });
    }
  }

  return questions;
}

// ─── Solo "Top X%" percentile ────────────────────────────────────────────────
function getPercentile(soloCorrect: number): string {
  if (soloCorrect >= 10) return "Top 1%";
  if (soloCorrect >= 8)  return "Top 10%";
  if (soloCorrect >= 6)  return "Top 30%";
  if (soloCorrect >= 4)  return "Top 55%";
  return "Top 80%";
}

// ─── Streak helpers ───────────────────────────────────────────────────────────
function getMultiplier(streak: number): number {
  if (streak >= 10) return 2;
  if (streak >= 5)  return 1.5;
  return 1;
}

// ─── Stars background ─────────────────────────────────────────────────────────
const STARS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2 + 0.5,
  opacity: Math.random() * 0.3 + 0.1,
  delay: Math.random() * 4,
}));

const Stars = memo(function Stars() {
  return (
    <div className="stars-layer">
      {STARS.map(s => (
        <div key={s.id} className="star" style={{
          left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size,
          opacity: s.opacity, animationDelay: `${s.delay}s`,
        }} />
      ))}
    </div>
  );
});

// ─── CelebPhoto sub-component ─────────────────────────────────────────────────
// Images are served through our own /api/wiki-image proxy so Wikimedia's
// hotlink protection never triggers in the user's browser.
function CelebPhoto({ celeb, className = "", initClassName = "" }: {
  celeb: Celebrity;
  className?: string;
  initClassName?: string;
}) {
  const [step, setStep] = useState(0);
  const title = celeb.wiki ?? celeb.name;

  // Reset on celebrity change
  useEffect(() => { setStep(0); }, [celeb.image, title]);

  // Try stored URL first (faster), then Wikipedia title lookup.
  // Local paths (/images/...) are served directly; only Wikimedia URLs go through the proxy.
  const urls = [
    celeb.image
      ? celeb.image.startsWith('/')
        ? celeb.image
        : `/api/wiki-image?url=${encodeURIComponent(celeb.image)}`
      : null,
    `/api/wiki-image?title=${encodeURIComponent(title)}`,
  ].filter((u): u is string => u !== null);

  const src = step < urls.length ? urls[step] : null;

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={celeb.name}
        className={className}
        draggable={false}
        loading="lazy"
        onError={() => setStep(s => s + 1)}
      />
    );
  }
  return (
    <div className={initClassName}>
      {celeb.name[0]}
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
        <div className="home-emoji">💰</div>
        <p className="home-title">Who&apos;s <span className="accent">Richer?</span></p>
        <p className="home-subtitle">Compare celebrity net worths — pick the wealthier one or guess their fortune</p>

        <div className="how-it-works">
          <div className="how-it-works__title">How it works</div>
          {[
            ["💰", "Two celebrities appear — tap the one worth more"],
            ["💡", "Some rounds ask you to estimate their total fortune"],
            ["🔥", "Build a streak for score multipliers (×1.5, ×2)"],
            ["🏆", "Solo: 10 questions, then see your score. Multi: real-time duel"],
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
function ResultScreen({
  score, oppScore, mode, soloCorrect, soloStreak, onReplay, rematchZone,
}: {
  score: number;
  oppScore: number | null;
  mode: Mode;
  soloCorrect: number;
  soloStreak: number;
  onReplay: () => void;
  rematchZone?: React.ReactNode;
}) {
  const [shared, setShared] = useState(false);
  const isMulti  = mode === "multi" && oppScore !== null;
  const pct      = (score / MAX_SCORE) * 100;
  const iWon     = isMulti && score > oppScore!;
  const tied     = isMulti && score === oppScore!;
  const percentile = getPercentile(soloCorrect);

  const myClass = isMulti
    ? (iWon ? "score-circle--win" : tied ? "score-circle--neutral" : "score-circle--lose")
    : (pct >= 80 ? "score-circle--win" : pct >= 50 ? "score-circle--neutral" : "score-circle--lose");
  const oppClass = isMulti
    ? (!iWon && !tied ? "score-circle--win" : tied ? "score-circle--neutral" : "score-circle--lose")
    : "";

  async function handleShare() {
    const text = `🤑 Who's Richer? — I got ${soloCorrect}/10 correct!\nCan you beat me? ultimate-playground.com/wealth`;
    if (typeof navigator.share === "function") {
      try { await navigator.share({ text }); return; } catch { /* fallback */ }
    }
    try {
      await navigator.clipboard.writeText(text);
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    } catch { /* silent */ }
  }

  return (
    <div className="game-wrapper">
      <Stars />
      <div className="glow-orb glow-orb--purple" />
      <div className="glow-orb glow-orb--orange" />
      <div className="wl-result">
        <div className="wl-result__title">
          {isMulti ? (iWon ? "You win! 🏆" : tied ? "It's a tie! 🤝" : "You lose! 😅") : "Game Over! 🤑"}
        </div>

        {isMulti ? (
          <>
            <div className="wl-result__score">
              {score}<span className="wl-result__max">/{MAX_SCORE}</span>
            </div>
            <div className="wl-result__found">
              {soloCorrect}/{ROUNDS_PER_GAME} correct
            </div>
            <div className="wl-result__vs">
              <div className={`wl-result__vs-score ${iWon ? "wl-result__vs-score--win" : "wl-result__vs-score--loss"}`}>
                {iWon ? "You win! 🏆" : tied ? "It's a tie! 🤝" : "You lose 😢"}
              </div>
              <div className="wl-result__vs-detail">
                You: {score} pts · Opp: {oppScore} pts
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="wl-result__score">
              {score}<span className="wl-result__max">/{MAX_SCORE}</span>
            </div>
            <div className="wl-result__found">
              {soloCorrect}/{ROUNDS_PER_GAME} correct
              {soloStreak >= 3 && <span style={{ marginLeft: "10px", color: "#ff6b35" }}>🔥 {soloStreak} streak</span>}
            </div>
          </>
        )}

        <div className="result-score-bar" style={{ width: "100%" }}>
          <div
            className={`result-score-bar__fill ${pct >= 70 ? "result-score-bar__fill--excellent" : pct >= 40 ? "result-score-bar__fill--good" : "result-score-bar__fill--poor"}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {rematchZone}

        <button className="btn-primary btn-hover" onClick={onReplay}>Play Again</button>
        {!isMulti && (
          <button className={`wl-share-btn${shared ? " wl-share-btn--copied" : ""}`} onClick={handleShare}>
            {shared ? "✓ Copied!" : "Share 🤑"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── DuelCard ─────────────────────────────────────────────────────────────────
function DuelCard({
  celeb, revealed, isCorrect, isSelected, isRicher, onClick, disabled,
}: {
  celeb: Celebrity;
  revealed: boolean;
  isCorrect: boolean;
  isSelected: boolean;
  isRicher: boolean;
  onClick: () => void;
  disabled: boolean;
}) {
  let cardClass = "wl-card";
  if (revealed) {
    if (isRicher) cardClass += " wl-card--correct";
    else if (isSelected && !isCorrect) cardClass += " wl-card--wrong";
    else if (!isSelected) cardClass += " wl-card--dimmed";
    cardClass += " wl-card--disabled";
  } else if (disabled) {
    cardClass += " wl-card--disabled";
  }

  return (
    <div className={cardClass} onClick={!revealed && !disabled ? onClick : undefined}>
      {revealed && isRicher && <div className="wl-badge--richer">Richer ✓</div>}
      <div className="wl-card__photo-wrap">
        <CelebPhoto
          celeb={celeb}
          className="wl-card__photo"
          initClassName="wl-card__photo wl-card__photo--initials"
        />
        <div className="wl-card__photo-gradient" />
      </div>
      <div className="wl-card__info">
        <div className="wl-card__name">{celeb.name}</div>
        <div className="wl-card__hint">{celeb.hint}</div>
        <div className={`wl-card__worth${revealed ? " wl-card__worth--revealed" : ""}`}>
          {celeb.displayWorth}
        </div>
      </div>
    </div>
  );
}

// ─── Main game component ──────────────────────────────────────────────────────
export default function WealthGame() {
  const [phase, setPhase]             = useState<Phase>("home");
  const [mode, setMode]               = useState<Mode>("solo");
  const [showNamePrompt, setShowNamePrompt] = useState(false);

  // Questions
  const [questions, setQuestions]     = useState<Question[]>([]);
  const [round, setRound]             = useState(0);

  // Scoring
  const [score, setScore]             = useState(0);
  const [soloCorrect, setSoloCorrect] = useState(0);
  const [streak, setStreak]           = useState(0);
  const [bestStreak, setBestStreak]   = useState(0);

  // Answer state
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null); // duel: 0=left,1=right; estimation: option idx
  const [revealed, setRevealed]       = useState(false);
  const [multiWaiting, setMultiWaiting] = useState(false);

  // Refs to avoid stale closures
  const modeRef      = useRef<Mode>("solo");
  const mpRef        = useRef<ReturnType<typeof useMultiplayer> | null>(null);
  const revealedRef  = useRef(false);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  const { submitRating } = useRatingSubmit("wealth");

  const currentQ = questions[round] ?? null;

  // ── Multiplayer callbacks ─────────────────────────────────────────────────
  const onMpGameStart = useCallback((seed: number) => {
    const qs = generateQuestions(ROUNDS_PER_GAME, seed);
    setQuestions(qs);
    setRound(0);
    setScore(0);
    setSoloCorrect(0);
    setStreak(0);
    setBestStreak(0);
    setSelectedIdx(null);
    setRevealed(false);
    revealedRef.current = false;
    setMultiWaiting(false);
    setPhase("playing");
  }, []);

  const onMpOpponentAnswered = useCallback(() => {}, []);

  const onMpRoundEnd = useCallback((_scores: Record<string, number>) => {}, []);

  const onMpNextRound = useCallback((nextRound: number) => {
    setMultiWaiting(false);
    setRound(nextRound);
    setSelectedIdx(null);
    setRevealed(false);
    revealedRef.current = false;
  }, []);

  const onMpGameEnd = useCallback((scores: Record<string, number>) => {
    setMultiWaiting(false);
    setPhase("result");
    const myId  = mpRef.current?.myId;
    const opp   = mpRef.current?.opponent;
    if (myId && opp) {
      const myScore  = scores[myId]    ?? 0;
      const oppScore = scores[opp.id]  ?? 0;
      submitRating(myScore, oppScore);
      recordMatch(opp.name, myScore > oppScore ? "win" : myScore < oppScore ? "loss" : "tie");
    }
  }, [submitRating]);

  const mp = useMultiplayer({
    gameType: "wealth",
    host: getPartykitHost(),
    onGameStart:        onMpGameStart,
    onOpponentAnswered: onMpOpponentAnswered,
    onRoundEnd:         onMpRoundEnd,
    onNextRound:        onMpNextRound,
    onGameEnd:          onMpGameEnd,
  });
  useEffect(() => { mpRef.current = mp; });

  // ── Answer logic ──────────────────────────────────────────────────────────
  const handleAnswer = useCallback((choiceIdx: number) => {
    if (revealedRef.current || !currentQ) return;
    revealedRef.current = true;

    let isCorrect = false;
    if (currentQ.type === "duel") {
      const richer = currentQ.left.worth >= currentQ.right.worth ? 0 : 1;
      isCorrect = choiceIdx === richer;
    } else {
      isCorrect = choiceIdx === currentQ.correctIdx;
    }

    const multiplier = modeRef.current === "solo" ? getMultiplier(streak) : 1;
    const pts = isCorrect ? Math.round(100 * multiplier) : 0;

    setSelectedIdx(choiceIdx);
    setRevealed(true);

    if (modeRef.current === "multi") {
      mpRef.current?.submitAnswer(String(choiceIdx), pts);
      setMultiWaiting(true);
    } else {
      // Solo: update streak
      if (isCorrect) {
        const newStreak = streak + 1;
        setStreak(newStreak);
        setBestStreak(b => Math.max(b, newStreak));
        setSoloCorrect(c => c + 1);
        setScore(s => s + pts);
      } else {
        // Wrong answer in solo — show feedback, user clicks Next to continue
        setStreak(0);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQ, streak]);

  // ── Next round (multi) ────────────────────────────────────────────────────
  const handleNext = useCallback(() => {
    if (modeRef.current === "multi") {
      setMultiWaiting(true);
      mpRef.current?.readyForNext();
      return;
    }
    // Solo: check if game is over
    if (round + 1 >= ROUNDS_PER_GAME) {
      setPhase("result");
      return;
    }
    setRound(round + 1);
    setSelectedIdx(null);
    setRevealed(false);
    revealedRef.current = false;
  }, [round]);

  // ── Game flow ─────────────────────────────────────────────────────────────
  function startSolo() {
    setMode("solo");
    setQuestions(generateQuestions(ROUNDS_PER_GAME));
    setRound(0);
    setScore(0);
    setSoloCorrect(0);
    setStreak(0);
    setBestStreak(0);
    setSelectedIdx(null);
    setRevealed(false);
    revealedRef.current = false;
    setMultiWaiting(false);
    setPhase("playing");
  }

  function startMulti() {
    mp.disconnect();
    setMode("multi");
    setShowNamePrompt(true);
  }

  function backToHome() {
    mp.disconnect();
    setMode("solo");
    setPhase("home");
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (phase === "home") return (
    <>
      <HomeScreen onSolo={startSolo} onMulti={startMulti} />
      {showNamePrompt && (
        <MultiplayerEntryModal
          gameType="wealth"
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
        soloCorrect={soloCorrect}
        soloStreak={bestStreak}
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
      <RelatedGames currentSlug="/wealth" />
      {mp.finalLeaderboard && (
        <LeaderboardOverlay
          leaderboard={mp.finalLeaderboard}
          onClose={() => { mp.disconnect(); backToHome(); }}
        />
      )}
    </>
  );

  if (!currentQ) return null;

  // ── Question rendering ────────────────────────────────────────────────────
  const isMulti     = mode === "multi";
  const multiplier  = getMultiplier(streak);
  const showStreak  = !isMulti && streak >= 3;

  const isDuel = currentQ.type === "duel";

  // Duel: which side is richer?
  const richerSide = isDuel
    ? (currentQ.left.worth >= currentQ.right.worth ? 0 : 1)
    : -1;

  // Feedback: was the answer correct?
  const answerCorrect = selectedIdx !== null
    ? (isDuel ? selectedIdx === richerSide : selectedIdx === (currentQ as EstimationQuestion).correctIdx)
    : false;

  return (
    <div className="wl-wrapper">
      {/* Progress bar */}
      <div className="wl-progress-area">
        <div className="progress-bar">
          <div className="progress-bar__header">
            <span className="progress-bar__question">
              {isMulti ? "Round" : "Question"} {round + 1}/{ROUNDS_PER_GAME}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {showStreak && (
                <div className="wl-streak">
                  🔥 {streak}
                  {multiplier > 1 && <span className="wl-streak__multiplier">×{multiplier}</span>}
                </div>
              )}
              <div className="progress-bar__stat">
                <div className="progress-bar__stat-label">Score</div>
                <div className="progress-bar__stat-value" style={{ color: "#f0c040" }}>{score}</div>
              </div>
            </div>
          </div>
          <div className="progress-bar__track">
            <div className="progress-bar__fill" style={{ width: `${(round / ROUNDS_PER_GAME) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Opponent bar */}
      {isMulti && (
        <OpponentBar opponents={mp.opponents} myScore={score} maxScore={MAX_SCORE} />
      )}

      {/* Main question area — flex:1, no scroll */}
      <div className="wl-main">
        {isDuel ? (
          <div className="wl-question">
            <div className="wl-question__label">💰 Who is richer?</div>
            <div className="wl-duel">
              <DuelCard
                celeb={(currentQ as DuelQuestion).left}
                revealed={revealed}
                isCorrect={answerCorrect}
                isSelected={selectedIdx === 0}
                isRicher={richerSide === 0}
                onClick={() => handleAnswer(0)}
                disabled={revealed || multiWaiting}
              />
              <div className="wl-vs">VS</div>
              <DuelCard
                celeb={(currentQ as DuelQuestion).right}
                revealed={revealed}
                isCorrect={answerCorrect}
                isSelected={selectedIdx === 1}
                isRicher={richerSide === 1}
                onClick={() => handleAnswer(1)}
                disabled={revealed || multiWaiting}
              />
            </div>
          </div>
        ) : (
          // Estimation question
          <div className="wl-question">
            <div className="wl-question__label">💵 How rich is this celebrity?</div>
            <div className="wl-estimation">
              <CelebPhoto
                celeb={(currentQ as EstimationQuestion).celebrity}
                className="wl-estimation__photo"
                initClassName="wl-estimation__photo wl-estimation__photo--initials"
              />
              <div className="wl-estimation__name">{(currentQ as EstimationQuestion).celebrity.name}</div>
              <div className="wl-estimation__hint">{(currentQ as EstimationQuestion).celebrity.hint}</div>
              <div className="wl-options">
                {(currentQ as EstimationQuestion).options.map((opt, idx) => {
                  let cls = "wl-option";
                  if (revealed) {
                    cls += " wl-option--disabled";
                    if (idx === (currentQ as EstimationQuestion).correctIdx) cls += " wl-option--correct";
                    else if (idx === selectedIdx) cls += " wl-option--wrong";
                  }
                  return (
                    <button
                      key={idx}
                      className={cls}
                      onClick={() => !revealed && !multiWaiting && handleAnswer(idx)}
                      disabled={revealed || multiWaiting}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action bar — always visible at the bottom, stable height */}
      <div className="wl-action-bar">
        {revealed ? (
          <div className="wl-feedback">
            <div className="wl-feedback__left">
              <span className="wl-feedback__icon">{answerCorrect ? "✅" : "❌"}</span>
              <span className={`wl-feedback__text ${answerCorrect ? "feedback__text--correct" : "feedback__text--wrong"}`}>
                {answerCorrect ? "Correct!" : "Wrong!"}
              </span>
              <span className="wl-feedback__pts">
                {answerCorrect
                  ? <>+{Math.round(100 * (mode === "solo" ? getMultiplier(streak - 1 < 0 ? 0 : streak) : 1))} pts{multiplier > 1 && !isMulti ? <span className="wl-streak__multiplier" style={{ marginLeft: 4 }}>×{multiplier}</span> : null}</>
                  : "+0 pts"}
              </span>
            </div>
            <button
              className="btn-next btn-hover-sm"
              onClick={handleNext}
              disabled={multiWaiting}
            >
              {multiWaiting
                ? <span className="wl-waiting"><span className="waiting-dot" /><span className="waiting-dot" /><span className="waiting-dot" /> Waiting…</span>
                : round + 1 >= ROUNDS_PER_GAME ? "See Results →"
                : "Next →"}
            </button>
          </div>
        ) : (
          <div className="wl-action-bar__hint">Tap to answer</div>
        )}
      </div>

      {/* Multiplayer overlay */}
      <MultiplayerScreen
        status={mp.status}
        botCountdown={mp.botCountdown}
        onCancel={backToHome}
        onPlayBot={mp.playVsBot}
        onContinueSolo={() => { setMode("solo"); mp.disconnect(); }}
      />
    </div>
  );
}
