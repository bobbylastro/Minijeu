"use client";
import { memo, useState, useEffect, useRef, useCallback } from "react";
import rawData from "@/app/wealth_data.json";
import "@/app/wealth/wealth.css";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { getPartykitHost, isMultiplayerEnabled } from "@/lib/partykitHost";
import { useRatingSubmit } from "@/hooks/useRatingSubmit";
import MultiplayerScreen from "@/components/MultiplayerScreen";
import OpponentBar from "@/components/OpponentBar";
import NamePromptModal from "@/components/NamePromptModal";
import RelatedGames from "@/components/RelatedGames";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Celebrity {
  name: string;
  worth: number;       // net worth in $M
  displayWorth: string;
  category: string;
  hint: string;
  image: string;
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
  if (soloCorrect >= 20) return "Top 1%";
  if (soloCorrect >= 15) return "Top 5%";
  if (soloCorrect >= 10) return "Top 15%";
  if (soloCorrect >= 7)  return "Top 30%";
  if (soloCorrect >= 4)  return "Top 50%";
  return "Top 75%";
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
function CelebPhoto({ celeb, className = "", initClassName = "" }: {
  celeb: Celebrity;
  className?: string;
  initClassName?: string;
}) {
  const [err, setErr] = useState(false);
  // Reset error when celebrity changes
  useEffect(() => { setErr(false); }, [celeb.name]);

  if (!err && celeb.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={celeb.image}
        alt={celeb.name}
        className={className}
        onError={() => setErr(true)}
        draggable={false}
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
            ["🏆", "Solo: survive as long as possible. Multi: 10 rounds"],
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
  score, oppScore, mode, soloCorrect, soloStreak, onReplay,
}: {
  score: number;
  oppScore: number | null;
  mode: Mode;
  soloCorrect: number;
  soloStreak: number;
  onReplay: () => void;
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
    const text = `🤑 Who's Richer? — I answered ${soloCorrect} right in a row!\nCan you beat me? ultimate-playground.com/wealth`;
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
      <div className="home-screen">
        <div className="home-emoji">
          {isMulti ? (iWon ? "🏆" : tied ? "🤝" : "😅") : (pct >= 80 ? "🏆" : pct >= 50 ? "🙂" : "😅")}
        </div>
        <h2 className="home-title" style={{ fontSize: "1.6rem" }}>
          {isMulti
            ? (iWon ? "You win!" : tied ? "It&apos;s a tie!" : "You lose!")
            : (pct >= 80 ? "Outstanding!" : pct >= 50 ? "Well Done!" : "Keep Practicing!")}
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
              <span className={`score-circle__value score-circle__value--lg ${pct >= 80 ? "score-circle__value--green" : "score-circle__value--gold"}`}>{soloCorrect}</span>
              <span className="score-circle__total score-circle__total--lg">correct</span>
            </div>
            <div className="wl-result-percentile">{percentile}</div>
            <div className="wl-result-label">of players</div>
            {soloStreak >= 3 && (
              <div className="wl-result-streak">🔥 Best streak: {soloStreak} in a row</div>
            )}
          </>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "center", marginTop: "0.5rem" }}>
          <button className="btn-primary btn-hover" onClick={onReplay}>Play Again</button>
          {!isMulti && (
            <button className={`wl-share-btn${shared ? " wl-share-btn--copied" : ""}`} onClick={handleShare}>
              {shared ? "✓ Copied!" : "Share 🤑"}
            </button>
          )}
        </div>
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
      <CelebPhoto
        celeb={celeb}
        className="wl-card__photo"
        initClassName="wl-card__photo wl-card__photo--initials"
      />
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
    // Submit rating
    const myId = mpRef.current?.myId;
    const oppId = mpRef.current?.opponent?.id;
    if (myId && oppId) {
      const myScore  = scores[myId]  ?? 0;
      const oppScore = scores[oppId] ?? 0;
      submitRating(myScore, oppScore);
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
        // Wrong = game over in solo — show feedback then result
        setStreak(0);
        setScore(s => s + 0);
        setTimeout(() => {
          setPhase("result");
        }, FEEDBACK_DELAY);
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
    // Solo: advance (only called after correct answers)
    setRound(r => {
      const next = r + 1;
      setQuestions(prev => {
        if (next >= prev.length) {
          // Need more questions
          const extra = generateQuestions(10);
          return [...prev, ...extra];
        }
        return prev;
      });
      return next;
    });
    setSelectedIdx(null);
    setRevealed(false);
    revealedRef.current = false;
  }, []);

  // ── Game flow ─────────────────────────────────────────────────────────────
  function startSolo() {
    setMode("solo");
    setQuestions(generateQuestions(20));
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
        <NamePromptModal
          onConfirm={name => { setShowNamePrompt(false); mp.joinQueue(name); }}
          onCancel={() => { setShowNamePrompt(false); setMode("solo"); }}
        />
      )}
      <MultiplayerScreen status={mp.status} onCancel={backToHome} />
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
      />
      <RelatedGames currentSlug="/wealth" />
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
      {/* Top bar */}
      <div className="wl-topbar">
        <div className="wl-topbar__left">
          {isMulti
            ? <span className="wl-topbar__round">Round {round + 1} / {ROUNDS_PER_GAME}</span>
            : <span className="wl-topbar__round">#{soloCorrect + 1}</span>
          }
          {showStreak && (
            <div className="wl-streak">
              🔥 {streak}
              {multiplier > 1 && (
                <span className="wl-streak__multiplier">×{multiplier}</span>
              )}
            </div>
          )}
        </div>
        <span className="wl-topbar__score">
          {isMulti ? `⭐ ${score} pts` : `✅ ${soloCorrect} correct`}
        </span>
      </div>

      {/* Opponent bar */}
      {isMulti && mp.opponent && (
        <OpponentBar opponent={mp.opponent} myScore={score} maxScore={MAX_SCORE} />
      )}

      {/* Main question area */}
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

        {/* Feedback section (shown after answering) */}
        {revealed && (
          <div className="wl-feedback">
            <div className="wl-feedback__icon">
              {answerCorrect ? "✅" : "❌"}
            </div>
            <div className={`wl-feedback__text feedback__text ${answerCorrect ? "feedback__text--correct" : "feedback__text--wrong"}`}>
              {answerCorrect ? "Correct!" : "Wrong!"}
            </div>
            <div className="wl-feedback__pts">
              {answerCorrect
                ? `+${Math.round(100 * (mode === "solo" ? getMultiplier(streak - 1 < 0 ? 0 : streak) : 1))} pts${multiplier > 1 && !isMulti ? ` (×${multiplier})` : ""}`
                : "+0 pts"}
            </div>
            {showStreak && answerCorrect && streak >= 5 && (
              <div className="wl-feedback__streak">🔥 {streak} streak!</div>
            )}
            {/* Next button */}
            {answerCorrect && (
              <button
                className="btn-next btn-hover-sm wl-feedback__next-btn"
                onClick={handleNext}
                disabled={multiWaiting}
              >
                {multiWaiting
                  ? <span className="wl-waiting"><span className="waiting-dot" /><span className="waiting-dot" /><span className="waiting-dot" /> Waiting…</span>
                  : isMulti && round + 1 >= ROUNDS_PER_GAME ? "See Results →"
                  : "Next →"}
              </button>
            )}
            {!answerCorrect && isMulti && (
              <button
                className="btn-next btn-hover-sm wl-feedback__next-btn"
                onClick={handleNext}
                disabled={multiWaiting}
              >
                {multiWaiting
                  ? <span className="wl-waiting"><span className="waiting-dot" /><span className="waiting-dot" /><span className="waiting-dot" /> Waiting…</span>
                  : round + 1 >= ROUNDS_PER_GAME ? "See Results →" : "Next →"}
              </button>
            )}
            {!answerCorrect && !isMulti && (
              <div className="wl-feedback__pts" style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.78rem" }}>
                Game over…
              </div>
            )}
          </div>
        )}
      </div>

      {/* Multiplayer overlay */}
      <MultiplayerScreen
        status={mp.status}
        onCancel={backToHome}
        onContinueSolo={() => { setMode("solo"); mp.disconnect(); }}
      />
    </div>
  );
}
