"use client";
import { memo, useState, useEffect, useRef, useCallback } from "react";
import rawData from "@/app/animals_data.json";
import "@/app/wild-battle/wild-battle.css";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { getPartykitHost, isMultiplayerEnabled } from "@/lib/partykitHost";
import { useRatingSubmit } from "@/hooks/useRatingSubmit";
import { recordMatch } from "@/lib/matchHistory";
import RematchZone from "@/components/RematchZone";
import MultiplayerScreen from "@/components/MultiplayerScreen";
import OpponentBar from "@/components/OpponentBar";
import NamePromptModal from "@/components/NamePromptModal";
import RelatedGames from "@/components/RelatedGames";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Animal {
  name: string;
  hint: string;   // used as weight/speed/value display after reveal
  wiki: string;
}

interface RawBattle {
  animal1: Animal;
  animal2: Animal;
  winner: "animal1" | "animal2";
  explanation: string;
}

interface RawComparison {
  questionEmoji: string;
  questionText: string;
  animal1: Animal;
  animal2: Animal;
  winner: "animal1" | "animal2";
  explanation: string;
}

interface RawSlider {
  question: string;
  min: number;
  max: number;
  step: number;
  answer: number;
  unit: string;
  explanation: string;
}

interface BattleQuestion      { type: "battle";     data: RawBattle     }
interface ComparisonQuestion  { type: "comparison"; data: RawComparison }
interface SliderQuestion      { type: "slider";     data: RawSlider     }
type Question = BattleQuestion | ComparisonQuestion | SliderQuestion;
type Phase    = "home" | "playing" | "result";
type Mode     = "solo" | "multi";

// ─── Constants ─────────────────────────────────────────────────────────────────
const BATTLES_PER_GAME     = 7;
const COMPARISONS_PER_GAME = 2;
const SLIDERS_PER_GAME     = 1;
const ROUNDS_PER_GAME      = BATTLES_PER_GAME + COMPARISONS_PER_GAME + SLIDERS_PER_GAME; // 10
const MAX_SCORE            = ROUNDS_PER_GAME * 100;

// ─── Seeded random ─────────────────────────────────────────────────────────────
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

// ─── Question generation ───────────────────────────────────────────────────────
function generateQuestions(count: number, seed?: number): Question[] {
  const rand = seed !== undefined ? seededRandom(seed) : Math.random;
  const fn   = seed !== undefined ? rand : Math.random;

  const battles     = seededShuffle([...rawData.battles],     fn).slice(0, BATTLES_PER_GAME);
  const comparisons = seededShuffle([...rawData.comparisons], fn).slice(0, COMPARISONS_PER_GAME);
  const sliders     = seededShuffle([...rawData.sliders],     fn).slice(0, SLIDERS_PER_GAME);

  const questions: Question[] = [
    ...battles.map(d     => ({ type: "battle"     as const, data: d as RawBattle     })),
    ...comparisons.map(d => ({ type: "comparison" as const, data: d as RawComparison })),
    ...sliders.map(d     => ({ type: "slider"     as const, data: d as RawSlider     })),
  ];

  return seededShuffle(questions, fn).slice(0, count);
}

// ─── Slider scoring ─────────────────────────────────────────────────────────────
function sliderScore(guess: number, answer: number): number {
  const pct = Math.abs(guess - answer) / answer;
  if (pct === 0)   return 100;
  if (pct <= 0.05) return 90;
  if (pct <= 0.10) return 75;
  if (pct <= 0.20) return 50;
  if (pct <= 0.40) return 25;
  return 0;
}

// ─── Streak helpers ─────────────────────────────────────────────────────────────
function getMultiplier(streak: number): number {
  if (streak >= 10) return 2;
  if (streak >= 5)  return 1.5;
  return 1;
}

function getPercentile(correct: number): string {
  if (correct >= 10) return "Top 1%";
  if (correct >= 8)  return "Top 10%";
  if (correct >= 6)  return "Top 30%";
  if (correct >= 4)  return "Top 55%";
  return "Top 80%";
}

// ─── Stars background ───────────────────────────────────────────────────────────
const STARS = Array.from({ length: 55 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2 + 0.5,
  opacity: Math.random() * 0.25 + 0.05,
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

// ─── AnimalPhoto ────────────────────────────────────────────────────────────────
const ANIMAL_EMOJIS: Record<string, string> = {
  "Lion": "🦁", "African Lion": "🦁", "Brown Bear": "🐻", "Grizzly Bear": "🐻",
  "Polar Bear": "🐻‍❄️", "Tiger": "🐯", "Gorilla": "🦍", "Silverback Gorilla": "🦍",
  "Hippopotamus": "🦛", "Nile Crocodile": "🐊", "Saltwater Crocodile": "🐊",
  "Killer Whale": "🐋", "Great White Shark": "🦈", "Bull Shark": "🦈",
  "Wolverine": "🦡", "Gray Wolf": "🐺", "Cape Buffalo": "🐃", "Jaguar": "🐆",
  "Honey Badger": "🦡", "King Cobra": "🐍", "Reticulated Python": "🐍",
  "Green Anaconda": "🐍", "African Elephant": "🐘", "White Rhinoceros": "🦏",
  "Komodo Dragon": "🦎", "Golden Eagle": "🦅", "Peregrine Falcon": "🦅",
  "Black Caiman": "🐊", "Moose": "🫎", "Spotted Hyena": "🐺", "Cheetah": "🐆",
  "Sperm Whale": "🐳", "Giant Squid": "🦑", "Cassowary": "🦃", "Wild Boar": "🐗",
  "Leopard": "🐆", "Chimpanzee": "🐒", "Pronghorn": "🦌", "Ostrich": "🦤",
  "Kangaroo": "🦘", "Sailfish": "🐟", "Mako Shark": "🦈",
  "Koi Fish": "🐠", "African Grey Parrot": "🦜", "Dung Beetle": "🐛",
  "Leafcutter Ant": "🐜", "Mantis Shrimp": "🦐", "Pistol Shrimp": "🦐",
  "Bowhead Whale": "🐳", "Giant Tortoise": "🐢", "Greenland Shark": "🦈",
  "Leatherback Turtle": "🐢",
  "African Wild Dog": "🦊", "Black Mamba": "🐍", "Mountain Lion": "🦁",
  "Nile Monitor": "🦎", "Walrus": "🦭", "Tiger Shark": "🦈",
  "Lynx": "🐈", "Mandrill": "🐒", "Snow Leopard": "🐆",
  "Bison": "🦬", "Black Bear": "🐻", "Caiman": "🐊", "Gaboon Viper": "🐍",
  "Bobcat": "🐈‍⬛", "Baboon": "🐒", "Harpy Eagle": "🦅", "American Alligator": "🐊",
  "North American Porcupine": "🦔", "Puma": "🦁", "Monitor Lizard": "🦎",
};

function AnimalPhoto({ animal, className = "", emojiClassName = "" }: {
  animal: Animal;
  className?: string;
  emojiClassName?: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [animal.wiki]);

  const src = `/api/wiki-image?title=${encodeURIComponent(animal.wiki)}`;
  const emoji = ANIMAL_EMOJIS[animal.name] ?? "🐾";

  if (!failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={animal.name}
        className={className}
        draggable={false}
        onError={() => setFailed(true)}
      />
    );
  }
  return <div className={emojiClassName}>{emoji}</div>;
}

// ─── Home screen ────────────────────────────────────────────────────────────────
function HomeScreen({ onSolo, onMulti }: { onSolo: () => void; onMulti: () => void }) {
  return (
    <div className="game-wrapper theme-safari">
      <div className="glow-orb glow-orb--orange" />
      <div className="glow-orb glow-orb--purple" />
      <div className="home-screen">
        <div className="home-emoji">🦁</div>
        <p className="home-title">Wild <span className="accent">Battle</span></p>
        <p className="home-subtitle">Animal face-offs — pick the winner, compare stats, estimate records</p>

        <div className="how-it-works">
          <div className="how-it-works__title">How it works</div>
          {[
            ["🥊", "Two animals face off — pick the winner in a fight"],
            ["⚡", "Speed, weight, bite force, lifespan — always a duel"],
            ["📏", "Slider rounds — estimate wild animal records"],
            ["🔥", "Build a streak for ×1.5 and ×2 score multipliers"],
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

// ─── Result screen ──────────────────────────────────────────────────────────────
function ResultScreen({
  score, oppScore, mode, soloCorrect, soloStreak, onReplay, rematchZone,
}: {
  score: number; oppScore: number | null; mode: Mode;
  soloCorrect: number; soloStreak: number;
  onReplay: () => void; rematchZone?: React.ReactNode;
}) {
  const [shared, setShared] = useState(false);
  const isMulti = mode === "multi" && oppScore !== null;
  const pct     = (score / MAX_SCORE) * 100;
  const iWon    = isMulti && score > oppScore!;
  const tied    = isMulti && score === oppScore!;

  async function handleShare() {
    const text = `🦁 Wild Battle — I got ${soloCorrect}/10 correct!\nTest your animal knowledge: ultimate-playground.com/wild-battle`;
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
    <div className="game-wrapper theme-safari">
      <div className="glow-orb glow-orb--orange" />
      <div className="glow-orb glow-orb--purple" />
      <div className="wb-result">
        <div className="wb-result__title">
          {isMulti
            ? (iWon ? "You win! 🏆" : tied ? "It's a tie! 🤝" : "You lose! 😅")
            : "Game Over! 🦁"}
        </div>
        <div className="wb-result__score">
          {score}<span className="wb-result__max">/{MAX_SCORE}</span>
        </div>
        <div className="wb-result__found">
          {soloCorrect}/{ROUNDS_PER_GAME} correct
          {!isMulti && soloStreak >= 3 && (
            <span style={{ marginLeft: 10, color: "#fb923c" }}>🔥 {soloStreak} streak</span>
          )}
          {!isMulti && (
            <span style={{ marginLeft: 10, color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>
              · {getPercentile(soloCorrect)}
            </span>
          )}
        </div>
        {isMulti && (
          <div className="wb-result__vs">
            <div className={`wb-result__vs-score ${iWon ? "wb-result__vs-score--win" : "wb-result__vs-score--loss"}`}>
              {iWon ? "You win! 🏆" : tied ? "It's a tie! 🤝" : "You lose 😢"}
            </div>
            <div className="wb-result__vs-detail">You: {score} pts · Opp: {oppScore} pts</div>
          </div>
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
          <button className={`wb-share-btn${shared ? " wb-share-btn--copied" : ""}`} onClick={handleShare}>
            {shared ? "✓ Copied!" : "Share 🐾"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── DuelCard ───────────────────────────────────────────────────────────────────
function DuelCard({
  animal, revealed, isWinner, isSelected, showHint, onClick, disabled,
}: {
  animal: Animal;
  revealed: boolean;
  isWinner: boolean;
  isSelected: boolean;
  showHint: boolean;
  onClick: () => void;
  disabled: boolean;
}) {
  let cls = "wb-card";
  if (revealed) {
    if (isWinner)       cls += " wb-card--winner";
    else if (isSelected) cls += " wb-card--loser wb-card--selected-wrong";
    else                 cls += " wb-card--loser";
    cls += " wb-card--disabled";
  } else if (disabled) {
    cls += " wb-card--disabled";
  }

  return (
    <div className={cls} onClick={!revealed && !disabled ? onClick : undefined}>
      {revealed && isWinner && <div className="wb-badge--winner">Winner 🏆</div>}
      <div className="wb-card__photo-wrap">
        <AnimalPhoto
          animal={animal}
          className="wb-card__photo"
          emojiClassName="wb-card__photo wb-card__photo--initials"
        />
        <div className="wb-card__photo-gradient" />
      </div>
      <div className="wb-card__info">
        <div className="wb-card__name">{animal.name}</div>
        <div className={`wb-card__hint-stat${showHint ? " wb-card__hint-stat--visible" : ""}`}>
          {animal.hint}
        </div>
      </div>
    </div>
  );
}

// ─── Verdict overlay ────────────────────────────────────────────────────────────
function Verdict({
  correct, pts, explanation, multiplier, isMulti, isSlider, sliderPts,
}: {
  correct: boolean; pts: number; explanation: string;
  multiplier: number; isMulti: boolean; isSlider: boolean; sliderPts: number;
}) {
  return (
    <div className={`wb-verdict wb-verdict--${correct ? "correct" : "wrong"}`}>
      <div className="wb-verdict__icon">{correct ? "✅" : "❌"}</div>
      <div className="wb-verdict__label">{correct ? "Correct!" : "Wrong!"}</div>
      {isSlider && (
        <div className="wb-verdict__pts">
          {sliderPts > 0 ? `+${sliderPts} pts` : "+0 pts"}
          {sliderPts === 100 && <span className="wb-verdict__bonus"> · Perfect! 🎯</span>}
        </div>
      )}
      {!isSlider && (
        <div className="wb-verdict__pts">
          {correct ? `+${pts} pts` : "+0 pts"}
          {correct && multiplier > 1 && !isMulti && (
            <span className="wb-verdict__bonus"> · ×{multiplier} streak!</span>
          )}
        </div>
      )}
      <div className="wb-verdict__explanation">{explanation}</div>
    </div>
  );
}

// ─── Main game component ────────────────────────────────────────────────────────
export default function WildBattleGame() {
  const [phase, setPhase]               = useState<Phase>("home");
  const [mode, setMode]                 = useState<Mode>("solo");
  const [showNamePrompt, setShowNamePrompt] = useState(false);

  const [questions, setQuestions]       = useState<Question[]>([]);
  const [round, setRound]               = useState(0);

  const [score, setScore]               = useState(0);
  const [soloCorrect, setSoloCorrect]   = useState(0);
  const [streak, setStreak]             = useState(0);
  const [bestStreak, setBestStreak]     = useState(0);

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [revealed, setRevealed]         = useState(false);
  const [multiWaiting, setMultiWaiting] = useState(false);
  const [sliderValue, setSliderValue]   = useState(0);

  const modeRef     = useRef<Mode>("solo");
  const mpRef       = useRef<ReturnType<typeof useMultiplayer> | null>(null);
  const revealedRef = useRef(false);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  const { submitRating } = useRatingSubmit("wild-battle");
  const currentQ = questions[round] ?? null;

  // Init slider value when question changes
  useEffect(() => {
    if (currentQ?.type === "slider") {
      const { min, max, step } = currentQ.data;
      const mid = Math.round((min + max) / 2 / step) * step;
      setSliderValue(mid);
    }
  }, [round, currentQ]);

  // ── Multiplayer callbacks ────────────────────────────────────────────────────
  const onMpGameStart = useCallback((seed: number) => {
    const qs = generateQuestions(ROUNDS_PER_GAME, seed);
    setQuestions(qs);
    setRound(0); setScore(0); setSoloCorrect(0); setStreak(0); setBestStreak(0);
    setSelectedAnswer(null); setRevealed(false); revealedRef.current = false;
    setMultiWaiting(false);
    setPhase("playing");
  }, []);

  const onMpNextRound = useCallback((nextRound: number) => {
    setMultiWaiting(false);
    setRound(nextRound);
    setSelectedAnswer(null); setRevealed(false); revealedRef.current = false;
  }, []);

  const onMpGameEnd = useCallback((scores: Record<string, number>) => {
    setMultiWaiting(false);
    setPhase("result");
    const myId = mpRef.current?.myId;
    const opp  = mpRef.current?.opponent;
    if (myId && opp) {
      const myScore  = scores[myId]   ?? 0;
      const oppScore = scores[opp.id] ?? 0;
      submitRating(myScore, oppScore);
      recordMatch(opp.name, myScore > oppScore ? "win" : myScore < oppScore ? "loss" : "tie");
    }
  }, [submitRating]);

  const mp = useMultiplayer({
    gameType: "wild-battle",
    host: getPartykitHost(),
    onGameStart:        onMpGameStart,
    onOpponentAnswered: useCallback(() => {}, []),
    onRoundEnd:         useCallback(() => {}, []),
    onNextRound:        onMpNextRound,
    onGameEnd:          onMpGameEnd,
  });
  useEffect(() => { mpRef.current = mp; });

  // ── Answer logic ─────────────────────────────────────────────────────────────
  const handleAnswer = useCallback((value: number) => {
    if (revealedRef.current || !currentQ) return;
    revealedRef.current = true;

    let isCorrect = false;
    let pts = 0;

    if (currentQ.type === "battle" || currentQ.type === "comparison") {
      const winnerIdx = currentQ.data.winner === "animal1" ? 0 : 1;
      isCorrect = value === winnerIdx;
      const multiplier = modeRef.current === "solo" ? getMultiplier(streak) : 1;
      pts = isCorrect ? Math.round(100 * multiplier) : 0;
    } else {
      pts = sliderScore(value, currentQ.data.answer);
      isCorrect = pts >= 50;
    }

    setSelectedAnswer(value);
    setRevealed(true);

    if (modeRef.current === "multi") {
      mpRef.current?.submitAnswer(String(value), pts);
      setMultiWaiting(true);
    } else {
      if (isCorrect || currentQ.type === "slider") {
        if (isCorrect) {
          const newStreak = streak + 1;
          setStreak(newStreak);
          setBestStreak(b => Math.max(b, newStreak));
          setSoloCorrect(c => c + 1);
        } else {
          setStreak(0);
        }
        setScore(s => s + pts);
      } else {
        setStreak(0);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQ, streak]);

  const handleNext = useCallback(() => {
    if (modeRef.current === "multi") {
      setMultiWaiting(true);
      mpRef.current?.readyForNext();
      return;
    }
    if (round + 1 >= ROUNDS_PER_GAME) { setPhase("result"); return; }
    setRound(round + 1);
    setSelectedAnswer(null); setRevealed(false); revealedRef.current = false;
  }, [round]);

  // ── Game flow ──────────────────────────────────────────────────────────────
  function startSolo() {
    setMode("solo");
    setQuestions(generateQuestions(ROUNDS_PER_GAME));
    setRound(0); setScore(0); setSoloCorrect(0); setStreak(0); setBestStreak(0);
    setSelectedAnswer(null); setRevealed(false); revealedRef.current = false;
    setMultiWaiting(false);
    setPhase("playing");
  }

  function startMulti() { mp.disconnect(); setMode("multi"); setShowNamePrompt(true); }
  function backToHome()  { mp.disconnect(); setMode("solo");  setPhase("home"); }

  // ── Screens ─────────────────────────────────────────────────────────────────
  if (phase === "home") return (
    <>
      <HomeScreen onSolo={startSolo} onMulti={startMulti} />
      {showNamePrompt && (
        <NamePromptModal
          onConfirm={name => { setShowNamePrompt(false); mp.joinQueue(name); }}
          onCancel={() => { setShowNamePrompt(false); setMode("solo"); }}
        />
      )}
      <MultiplayerScreen status={mp.status} botCountdown={mp.botCountdown} onCancel={backToHome} onPlayBot={mp.playVsBot} />
    </>
  );

  if (phase === "result") return (
    <>
      <ResultScreen
        score={score} oppScore={mp.opponent?.score ?? null}
        mode={mode} soloCorrect={soloCorrect} soloStreak={bestStreak}
        onReplay={backToHome}
        rematchZone={mode === "multi" && mp.opponent ? (
          <RematchZone
            opponent={mp.opponent} myWantsRematch={mp.myWantsRematch}
            series={mp.series} onRematch={mp.requestRematch}
          />
        ) : undefined}
      />
      <RelatedGames currentSlug="/wild-battle" />
    </>
  );

  if (!currentQ) return null;

  // ── Playing ───────────────────────────────────────────────────────────────
  const isMulti    = mode === "multi";
  const multiplier = getMultiplier(streak);
  const showStreak = !isMulti && streak >= 3;

  // Compute verdict data
  let answerCorrect = false;
  let feedbackPts   = 0;

  if (revealed && selectedAnswer !== null) {
    if (currentQ.type === "battle" || currentQ.type === "comparison") {
      const winnerIdx = currentQ.data.winner === "animal1" ? 0 : 1;
      answerCorrect = selectedAnswer === winnerIdx;
      feedbackPts = answerCorrect ? Math.round(100 * (isMulti ? 1 : multiplier)) : 0;
    } else {
      feedbackPts = sliderScore(selectedAnswer, currentQ.data.answer);
      answerCorrect = feedbackPts >= 50;
    }
  }

  const qLabel =
    currentQ.type === "battle"     ? "Who wins the fight?" :
    currentQ.type === "comparison" ? currentQ.data.questionText :
    currentQ.data.question;

  const isDuel = currentQ.type === "battle" || currentQ.type === "comparison";

  // Mood badge: visual context per question type
  const mood: { icon: string; label: string; color: string; glow: string } = (() => {
    if (currentQ.type === "battle") {
      return { icon: "🥊", label: "FIGHT!", color: "rgba(239,68,68,0.85)", glow: "rgba(239,68,68,0.35)" };
    }
    if (currentQ.type === "slider") {
      return { icon: "📏", label: "ESTIMATE", color: "rgba(139,92,246,0.85)", glow: "rgba(139,92,246,0.35)" };
    }
    // comparison — derive from emoji
    const e = currentQ.data.questionEmoji;
    if (e === "⚡") return { icon: "⚡", label: "SPEED",      color: "rgba(234,179,8,0.85)",   glow: "rgba(234,179,8,0.35)"   };
    if (e === "⚖️") return { icon: "⚖️", label: "WEIGHT",     color: "rgba(59,130,246,0.85)",  glow: "rgba(59,130,246,0.35)"  };
    if (e === "🦷") return { icon: "🦷", label: "BITE FORCE", color: "rgba(249,115,22,0.85)",  glow: "rgba(249,115,22,0.35)"  };
    if (e === "⏳") return { icon: "⏳", label: "LIFESPAN",   color: "rgba(168,85,247,0.85)",  glow: "rgba(168,85,247,0.35)"  };
    if (e === "💪") return { icon: "💪", label: "STRENGTH",   color: "rgba(34,197,94,0.85)",   glow: "rgba(34,197,94,0.35)"   };
    if (e === "🏊") return { icon: "🏊", label: "DEPTH",      color: "rgba(6,182,212,0.85)",   glow: "rgba(6,182,212,0.35)"   };
    return { icon: e, label: "COMPARE", color: "rgba(249,115,22,0.85)", glow: "rgba(249,115,22,0.35)" };
  })();

  return (
    <div className="wb-wrapper">
      {/* Progress */}
      <div className="wb-progress-area">
        <div className="progress-bar">
          <div className="progress-bar__header">
            <span className="progress-bar__question">
              {isMulti ? "Round" : "Question"} {round + 1}/{ROUNDS_PER_GAME}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {showStreak && (
                <div className="wb-streak">
                  🔥 {streak}
                  {multiplier > 1 && <span className="wb-streak__multiplier">×{multiplier}</span>}
                </div>
              )}
              <div className="progress-bar__stat">
                <div className="progress-bar__stat-label">Score</div>
                <div className="progress-bar__stat-value" style={{ color: "#fb923c" }}>{score}</div>
              </div>
            </div>
          </div>
          <div className="progress-bar__track">
            <div className="progress-bar__fill" style={{ width: `${(round / ROUNDS_PER_GAME) * 100}%` }} />
          </div>
        </div>
      </div>

      {isMulti && mp.opponent && (
        <OpponentBar opponent={mp.opponent} myScore={score} maxScore={MAX_SCORE} />
      )}

      {/* Question area (relative so verdict overlay can be absolute inside) */}
      <div className="wb-main">
        {/* ── DUEL (battle + comparison) ──────────────────────────── */}
        {isDuel && (
          <div className="wb-question">
            <div className="wb-mood-badge" style={{ background: mood.color, boxShadow: `0 0 18px ${mood.glow}` }}>
              <span className="wb-mood-badge__icon">{mood.icon}</span>
              <span className="wb-mood-badge__label">{mood.label}</span>
            </div>
            <div className="wb-question__label">{qLabel}</div>
            <div className="wb-battle">
              <DuelCard
                animal={currentQ.data.animal1}
                revealed={revealed}
                isWinner={currentQ.data.winner === "animal1"}
                isSelected={selectedAnswer === 0}
                showHint={revealed}
                onClick={() => handleAnswer(0)}
                disabled={revealed || multiWaiting}
              />
              <div className="wb-fight">
                <div className="wb-fight__bolt">⚡</div>
                <div className="wb-fight__text">VS</div>
              </div>
              <DuelCard
                animal={currentQ.data.animal2}
                revealed={revealed}
                isWinner={currentQ.data.winner === "animal2"}
                isSelected={selectedAnswer === 1}
                showHint={revealed}
                onClick={() => handleAnswer(1)}
                disabled={revealed || multiWaiting}
              />
            </div>
          </div>
        )}

        {/* ── SLIDER ──────────────────────────────────────────────── */}
        {currentQ.type === "slider" && (() => {
          const { min, max, step, answer, unit } = currentQ.data;
          const pctFill = ((sliderValue - min) / (max - min)) * 100;
          return (
            <div className="wb-question">
              <div className="wb-mood-badge" style={{ background: mood.color, boxShadow: `0 0 18px ${mood.glow}` }}>
                <span className="wb-mood-badge__icon">{mood.icon}</span>
                <span className="wb-mood-badge__label">{mood.label}</span>
              </div>
              <div className="wb-slider">
                <div className="wb-slider__question">{currentQ.data.question}</div>
                <div className={`wb-slider__value-display${revealed ? " wb-slider__value-display--locked" : ""}`}>
                  {revealed ? (selectedAnswer ?? sliderValue) : sliderValue}{unit}
                </div>
                <div className="wb-slider__track-wrap">
                  <div className="wb-slider__range">
                    <input
                      type="range"
                      className="wb-slider__input"
                      min={min} max={max} step={step}
                      value={sliderValue}
                      disabled={revealed || multiWaiting}
                      onChange={e => setSliderValue(Number(e.target.value))}
                      style={{
                        background: `linear-gradient(to right, #f97316 0%, #f97316 ${pctFill}%, rgba(255,255,255,0.12) ${pctFill}%, rgba(255,255,255,0.12) 100%)`,
                      }}
                    />
                  </div>
                  <div className="wb-slider__labels">
                    <span>{min}{unit}</span>
                    <span>{max}{unit}</span>
                  </div>
                </div>
                {revealed && (
                  <div className="wb-slider__correct-marker">
                    ✓ Answer: <span>{answer}{unit}</span>
                  </div>
                )}
                {!revealed && (
                  <button
                    className="wb-slider__lock-btn"
                    onClick={() => handleAnswer(sliderValue)}
                    disabled={multiWaiting}
                  >
                    Lock In 🔒
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── VERDICT OVERLAY ─────────────────────────────────────── */}
        {revealed && selectedAnswer !== null && (
          <Verdict
            correct={answerCorrect}
            pts={feedbackPts}
            explanation={currentQ.data.explanation}
            multiplier={multiplier}
            isMulti={isMulti}
            isSlider={currentQ.type === "slider"}
            sliderPts={feedbackPts}
          />
        )}
      </div>

      {/* Action bar */}
      <div className="wb-action-bar">
        {revealed ? (
          <div className="wb-feedback">
            <div className="wb-feedback__left">
              <span className="wb-feedback__icon">{answerCorrect ? "✅" : "❌"}</span>
              <span className={`wb-feedback__text ${answerCorrect ? "feedback__text--correct" : "feedback__text--wrong"}`}>
                {answerCorrect ? "Correct!" : "Wrong!"}
              </span>
            </div>
            <button
              className="btn-next btn-hover-sm"
              onClick={handleNext}
              disabled={multiWaiting}
            >
              {multiWaiting
                ? <span className="wb-waiting"><span className="waiting-dot"/><span className="waiting-dot"/><span className="waiting-dot"/> Waiting…</span>
                : round + 1 >= ROUNDS_PER_GAME ? "See Results →"
                : "Next →"}
            </button>
          </div>
        ) : (
          <div className="wb-action-bar__hint">
            {currentQ.type === "slider" ? "Drag to your estimate, then lock in" : "Tap a card to answer"}
          </div>
        )}
      </div>

      <MultiplayerScreen
        status={mp.status} botCountdown={mp.botCountdown}
        onCancel={backToHome} onPlayBot={mp.playVsBot}
        onContinueSolo={() => { setMode("solo"); mp.disconnect(); }}
      />
    </div>
  );
}
