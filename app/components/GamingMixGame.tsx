"use client";
import { memo, useState, useEffect, useRef, useCallback } from "react";
import "@/app/gaming-mix/gaming-mix.css";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { getPartykitHost, isMultiplayerEnabled } from "@/lib/partykitHost";
import { seededShuffle } from "@/lib/seededRandom";
import { recordMatch } from "@/lib/matchHistory";
import { useRatingSubmit } from "@/hooks/useRatingSubmit";
import MultiplayerScreen from "@/components/MultiplayerScreen";
import OpponentBar from "@/components/OpponentBar";
import MultiplayerEntryModal from "@/components/MultiplayerEntryModal";
import LeaderboardOverlay from "@/components/LeaderboardOverlay";
import { trackEvent } from "@/lib/analytics";
import RematchZone from "@/components/RematchZone";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Game {
  id: number;
  title: string;
  year: number;
  genre: string;
  studio: string;
  sales: number;
}

type RoundType = "year" | "battle" | "studio" | "older";

interface YearRound   { type: "year";   game: Game; }
interface BattleRound { type: "battle"; games: [Game, Game]; }
interface StudioRound { type: "studio"; game: Game; options: string[]; }
interface OlderRound  { type: "older";  games: [Game, Game]; }
type Round = YearRound | BattleRound | StudioRound | OlderRound;

type Phase = "home" | "playing" | "result";
type Mode  = "solo" | "multi";

// ─── Constants ────────────────────────────────────────────────────────────────
const ROUNDS_PER_GAME = 10;
const YEAR_TIMER      = 30;
const BATTLE_TIMER    = 20;
const STUDIO_TIMER    = 20;
const OLDER_TIMER     = 20;
const YEAR_MIN        = 1990;
const YEAR_MAX        = 2024;
const MAX_SCORE       = ROUNDS_PER_GAME * 100;

function steamCover(id: number) {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/header.jpg`;
}

function yearScore(guessed: number, actual: number): number {
  const diff = Math.abs(guessed - actual);
  if (diff === 0) return 100;
  if (diff === 1) return 80;
  if (diff === 2) return 60;
  if (diff === 3) return 40;
  if (diff === 4) return 20;
  return 0;
}

function yearPtsClass(pts: number): string {
  if (pts === 100) return "gm-year-reveal__pts--perfect";
  if (pts >= 60)   return "gm-year-reveal__pts--great";
  if (pts >= 20)   return "gm-year-reveal__pts--ok";
  return "gm-year-reveal__pts--miss";
}

// ─── Build rounds ─────────────────────────────────────────────────────────────
// Distribution: 3 Year + 3 Battle + 2 Studio + 2 Older = 10 rounds
function buildRounds(games: Game[], seed?: number): Round[] {
  const allStudios = [...new Set(games.map(g => g.studio))];

  function doShuffle<T>(arr: T[], s?: number): T[] {
    return s !== undefined ? seededShuffle([...arr], s) : [...arr].sort(() => Math.random() - 0.5);
  }

  const shuffled = doShuffle(games, seed);

  // Each type draws from its own slice — 3+6+2+4 = 15 unique slots
  const forYear   = shuffled.slice(0, 3);
  const forBattle = shuffled.slice(3, 9);   // 3 pairs
  const forStudio = shuffled.slice(9, 11);  // 2 studio rounds
  const forOlder  = shuffled.slice(11, 15); // 2 pairs

  const yearRounds: YearRound[] = forYear.map(g => ({ type: "year", game: g }));

  const battleRounds: BattleRound[] = [0, 1, 2].map(i => ({
    type: "battle" as const,
    games: [forBattle[i * 2], forBattle[i * 2 + 1]] as [Game, Game],
  }));

  const studioRounds: StudioRound[] = forStudio.map((g, idx) => {
    const wrong = doShuffle(
      allStudios.filter(s => s !== g.studio),
      seed != null ? seed + idx * 37 + 100 : undefined,
    ).slice(0, 3);
    const options = doShuffle([...wrong, g.studio], seed != null ? seed + idx * 37 + 200 : undefined);
    return { type: "studio" as const, game: g, options };
  });

  const olderRounds: OlderRound[] = [0, 1].map(i => ({
    type: "older" as const,
    games: [forOlder[i * 2], forOlder[i * 2 + 1]] as [Game, Game],
  }));

  const all: Round[] = [...yearRounds, ...battleRounds, ...studioRounds, ...olderRounds];
  return doShuffle(all, seed != null ? seed + 9999 : undefined);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STARS = Array.from({ length: 60 }, (_, i) => ({
  id: i, x: Math.random() * 100, y: Math.random() * 100,
  size: Math.random() * 2 + 0.5, opacity: Math.random() * 0.3 + 0.1, delay: Math.random() * 4,
}));
const Stars = memo(function Stars() {
  return (
    <div className="stars-layer" style={{ position: "absolute", inset: 0, zIndex: 0 }}>
      {STARS.map(s => (
        <div key={s.id} className="star" style={{
          left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size,
          opacity: s.opacity, animationDelay: `${s.delay}s`,
        }} />
      ))}
    </div>
  );
});

function TimerRing({ seconds, total }: { seconds: number; total: number }) {
  const r = 17; const circ = 2 * Math.PI * r;
  const pct   = seconds / total;
  const color = pct > 0.5 ? "#38bdf8" : pct > 0.25 ? "#fbbf24" : "#fb7185";
  return (
    <svg className="gm-timer" width={46} height={46} viewBox="0 0 46 46">
      <circle cx="23" cy="23" r={r} stroke="#ffffff18" strokeWidth="4" fill="none" />
      <circle cx="23" cy="23" r={r} stroke={color} strokeWidth="4" fill="none"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round" transform="rotate(-90 23 23)"
        style={{ transition: "stroke-dashoffset 1s linear, stroke 0.4s" }}
      />
      <text x="23" y="23" textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize="13" fontWeight="bold">{seconds}</text>
    </svg>
  );
}

// ─── Home screen ──────────────────────────────────────────────────────────────
function HomeScreen({ onSolo, onMulti }: { onSolo: () => void; onMulti: () => void }) {
  return (
    <div className="gm-home-wrapper">
      <div className="gm-glow" />
      <Stars />
      <div className="home-screen" style={{ position: "relative", zIndex: 1 }}>
        <div className="home-emoji">🎮</div>
        <p className="home-title">Gaming <span className="accent">Mix</span></p>
        <p className="home-subtitle">4 game types — test your gaming knowledge</p>

        <div className="how-it-works">
          <div className="how-it-works__title">How it works</div>
          {[
            ["📅", "Release Year — slide to guess when the game launched"],
            ["💰", "Best Seller — which game sold more copies?"],
            ["🏢", "Studio Guess — pick the developer from 4 options"],
            ["📆", "Timeline Duel — which game is older?"],
            ["🔀", `${ROUNDS_PER_GAME} rounds, 4 types mixed randomly`],
            ["⭐", "Up to 100 pts per round — max 1000 pts"],
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
  const pct    = (score / MAX_SCORE) * 100;
  const isMulti = mode === "multi" && oppScore !== null;
  const iWon    = isMulti && score > oppScore!;
  const tied    = isMulti && score === oppScore!;

  const myClass  = isMulti ? (iWon ? "score-circle--win" : tied ? "score-circle--neutral" : "score-circle--lose")
    : (pct >= 80 ? "score-circle--win" : pct >= 50 ? "score-circle--neutral" : "score-circle--lose");
  const oppClass = isMulti ? (!iWon && !tied ? "score-circle--win" : tied ? "score-circle--neutral" : "score-circle--lose") : "";

  return (
    <div className="gm-home-wrapper">
      <div className="gm-glow" />
      <Stars />
      <div className="home-screen" style={{ position: "relative", zIndex: 1 }}>
        <div className="home-emoji">
          {isMulti ? (iWon ? "🏆" : tied ? "🤝" : "😅") : (pct >= 80 ? "🏆" : pct >= 50 ? "🙂" : "😅")}
        </div>
        <h2 className="home-title" style={{ fontSize: "1.6rem" }}>
          {isMulti ? (iWon ? "You win!" : tied ? "It's a tie!" : "You lose!") : (pct >= 80 ? "Excellent!" : pct >= 50 ? "Well Done!" : "Keep Playing!")}
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
              <div className={`result-score-bar__fill ${pct >= 80 ? "result-score-bar__fill--excellent" : pct >= 50 ? "result-score-bar__fill--good" : "result-score-bar__fill--poor"}`}
                style={{ width: `${pct}%` }} />
            </div>
          </>
        )}

        {rematchZone}
        <button className="btn-primary btn-hover" onClick={onReplay} style={{ marginTop: "0.5rem" }}>Play Again</button>
      </div>
    </div>
  );
}

// ─── Release Year Round ───────────────────────────────────────────────────────
function YearRoundComp({ game, onSubmit, revealed, guessedYear }: {
  game: Game;
  onSubmit: (year: number) => void;
  revealed: boolean;
  guessedYear: number | null;
}) {
  const [sliderVal, setSliderVal] = useState(Math.round((YEAR_MIN + YEAR_MAX) / 2));
  const [coverLoaded, setCoverLoaded] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);

  useEffect(() => {
    setSliderVal(Math.round((YEAR_MIN + YEAR_MAX) / 2));
    setCoverLoaded(false);
    setCoverFailed(false);
  }, [game]);

  const diff = guessedYear != null ? Math.abs(guessedYear - game.year) : 0;
  const pts  = guessedYear != null ? yearScore(guessedYear, game.year) : 0;

  return (
    <div className="gm-play-area">
      <div className="gm-year-card">
        {!coverFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={steamCover(game.id)}
            alt={game.title}
            className="gm-year-card__cover"
            style={{ opacity: coverLoaded ? 1 : 0, transition: "opacity 0.4s" }}
            onLoad={() => setCoverLoaded(true)}
            onError={() => setCoverFailed(true)}
            draggable={false}
          />
        ) : (
          <div className="gm-year-card__cover" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "3rem" }}>🎮</span>
          </div>
        )}

        <div className="gm-year-card__body">
          <span className="gm-genre-badge">🎮 {game.genre}</span>
          <div className="gm-year-card__title">{game.title}</div>
          <div className="gm-year-card__meta">{game.studio}</div>

          {!revealed ? (
            <div className="gm-year-slider">
              <div className="gm-year-slider__label">When was this game released?</div>
              <div className="gm-year-slider__value">{sliderVal}</div>
              <input
                type="range"
                className="gm-year-slider__track"
                min={YEAR_MIN}
                max={YEAR_MAX}
                value={sliderVal}
                onChange={e => setSliderVal(+e.target.value)}
              />
              <div className="gm-year-slider__range">
                <span>{YEAR_MIN}</span><span>{YEAR_MAX}</span>
              </div>
            </div>
          ) : (
            <div className="gm-year-reveal">
              <div className="gm-year-reveal__result">
                {guessedYear === game.year
                  ? `🎯 Exact! Released in ${game.year}`
                  : `Released in ${game.year} — you guessed ${guessedYear}`}
              </div>
              {guessedYear !== game.year && diff > 0 && (
                <div className="gm-year-reveal__diff">
                  {diff === 1 ? "Just 1 year off!" : `${diff} years off`}
                </div>
              )}
              <div className={`gm-year-reveal__pts ${yearPtsClass(pts)}`}>
                {pts > 0 ? `+${pts} pts` : "0 pts"}
              </div>
            </div>
          )}
        </div>
      </div>

      {!revealed && (
        <button className="gm-next-btn" onClick={() => onSubmit(sliderVal)}>
          Lock in {sliderVal} →
        </button>
      )}
    </div>
  );
}

// ─── Best Seller Battle Round ─────────────────────────────────────────────────
function BattleRoundComp({ games, onSubmit, revealed, pickedIndex }: {
  games: [Game, Game];
  onSubmit: (index: 0 | 1) => void;
  revealed: boolean;
  pickedIndex: 0 | 1 | null;
}) {
  const winnerIndex = games[0].sales >= games[1].sales ? 0 : 1;
  const isCorrect   = pickedIndex === winnerIndex;

  function cardClass(i: 0 | 1): string {
    if (!revealed) return "";
    if (i === winnerIndex && i === pickedIndex) return "gm-battle-card--correct-pick";
    if (i !== winnerIndex && i === pickedIndex) return "gm-battle-card--wrong-pick";
    if (i === winnerIndex)                      return "gm-battle-card--winner";
    return "gm-battle-card--loser";
  }

  function salesClass(i: 0 | 1): string {
    if (!revealed) return "gm-battle-card__sales--hidden";
    return i === winnerIndex ? "gm-battle-card__sales--winner" : "gm-battle-card__sales--loser";
  }

  return (
    <div className="gm-play-area">
      <div className="gm-battle-label">Best Seller Battle</div>
      <div className="gm-battle-question">Which game sold more copies?</div>

      <div className="gm-battle-cards-wrap">
        <div className="gm-battle-cards">
          {games.map((game, i) => {
            const idx = i as 0 | 1;
            return (
              <button
                key={game.id}
                className={`gm-battle-card ${cardClass(idx)}`}
                onClick={() => !revealed && onSubmit(idx)}
                disabled={revealed}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={steamCover(game.id)}
                  alt={game.title}
                  className="gm-battle-card__cover"
                  draggable={false}
                />
                <div className="gm-battle-card__body">
                  <span className="gm-genre-badge" style={{ fontSize: "9px", padding: "2px 6px" }}>{game.genre}</span>
                  <div className="gm-battle-card__title">{game.title}</div>
                  <div className="gm-battle-card__studio">{game.studio}</div>
                  <div className={`gm-battle-card__sales ${salesClass(idx)}`}>
                    {revealed ? `${game.sales}M` : "?"}
                    {revealed && <span className="gm-battle-card__sales-label">copies sold</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {!revealed && <div className="gm-battle-vs">VS</div>}
      </div>

      {revealed && (
        <div className="gm-battle-result">
          <div className={`gm-battle-result__verdict ${isCorrect ? "gm-battle-result__verdict--correct" : "gm-battle-result__verdict--wrong"}`}>
            {pickedIndex === null ? "Time's up!" : isCorrect ? "Correct! 🎯" : "Wrong!"}
          </div>
          <div className={`gm-battle-result__pts ${isCorrect ? "gm-battle-result__pts--correct" : "gm-battle-result__pts--wrong"}`}>
            {isCorrect ? "+100 pts" : "+0 pts"}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Studio Guess Round ───────────────────────────────────────────────────────
function StudioRoundComp({ game, options, onSubmit, revealed, picked }: {
  game: Game;
  options: string[];
  onSubmit: (studio: string) => void;
  revealed: boolean;
  picked: string | null;
}) {
  const [coverLoaded, setCoverLoaded] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);
  useEffect(() => { setCoverLoaded(false); setCoverFailed(false); }, [game]);

  const isCorrect = picked === game.studio;

  function btnClass(opt: string): string {
    if (!revealed) return "gm-mcq-btn";
    if (opt === game.studio) return "gm-mcq-btn gm-mcq-btn--correct";
    if (opt === picked)      return "gm-mcq-btn gm-mcq-btn--wrong";
    return "gm-mcq-btn gm-mcq-btn--dim";
  }

  return (
    <div className="gm-play-area">
      <div className="gm-year-card">
        {!coverFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={steamCover(game.id)}
            alt={game.title}
            className="gm-year-card__cover"
            style={{ opacity: coverLoaded ? 1 : 0, transition: "opacity 0.4s" }}
            onLoad={() => setCoverLoaded(true)}
            onError={() => setCoverFailed(true)}
            draggable={false}
          />
        ) : (
          <div className="gm-year-card__cover" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "3rem" }}>🎮</span>
          </div>
        )}
        <div className="gm-year-card__body">
          <span className="gm-genre-badge">🎮 {game.genre}</span>
          <div className="gm-year-card__title">{game.title}</div>
          <div className="gm-year-card__meta" style={{ color: "rgba(167,139,250,0.6)", fontWeight: 700 }}>
            Which studio developed this game?
          </div>
        </div>
      </div>

      <div className="gm-mcq-options">
        {options.map(opt => (
          <button
            key={opt}
            className={btnClass(opt)}
            onClick={() => !revealed && onSubmit(opt)}
            disabled={revealed}
          >
            {opt}
          </button>
        ))}
      </div>

      {revealed && (
        <div className="gm-year-reveal">
          <div className="gm-year-reveal__result">
            {picked === null
              ? `Time's up! It was ${game.studio}`
              : isCorrect
              ? "Correct! 🎯"
              : `Wrong! It was ${game.studio}`}
          </div>
          <div className={`gm-year-reveal__pts ${isCorrect ? "gm-year-reveal__pts--perfect" : "gm-year-reveal__pts--miss"}`}>
            {isCorrect ? "+100 pts" : "+0 pts"}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Timeline Duel Round ──────────────────────────────────────────────────────
function OlderRoundComp({ games, onSubmit, revealed, pickedIndex }: {
  games: [Game, Game];
  onSubmit: (index: 0 | 1) => void;
  revealed: boolean;
  pickedIndex: 0 | 1 | null;
}) {
  // older = lower year (released earlier)
  const olderIndex = games[0].year <= games[1].year ? 0 : 1;
  const isCorrect  = pickedIndex === olderIndex;

  function cardClass(i: 0 | 1): string {
    if (!revealed) return "gm-battle-card--older";
    if (i === olderIndex && i === pickedIndex) return "gm-battle-card--correct-pick";
    if (i !== olderIndex && i === pickedIndex) return "gm-battle-card--wrong-pick";
    if (i === olderIndex)                      return "gm-battle-card--winner";
    return "gm-battle-card--loser";
  }

  function yearClass(i: 0 | 1): string {
    if (!revealed) return "gm-battle-card__year--hidden";
    return i === olderIndex ? "gm-battle-card__year--winner" : "gm-battle-card__year--loser";
  }

  return (
    <div className="gm-play-area">
      <div className="gm-battle-label gm-battle-label--older">Timeline Duel</div>
      <div className="gm-battle-question">Which game came out FIRST?</div>

      <div className="gm-battle-cards-wrap">
        <div className="gm-battle-cards">
          {games.map((game, i) => {
            const idx = i as 0 | 1;
            return (
              <button
                key={game.id}
                className={`gm-battle-card ${cardClass(idx)}`}
                onClick={() => !revealed && onSubmit(idx)}
                disabled={revealed}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={steamCover(game.id)}
                  alt={game.title}
                  className="gm-battle-card__cover"
                  draggable={false}
                />
                <div className="gm-battle-card__body">
                  <span className="gm-genre-badge" style={{ fontSize: "9px", padding: "2px 6px" }}>{game.genre}</span>
                  <div className="gm-battle-card__title">{game.title}</div>
                  <div className="gm-battle-card__studio">{game.studio}</div>
                  <div className={`gm-battle-card__year ${yearClass(idx)}`}>
                    {revealed ? game.year : "?"}
                    {revealed && <span className="gm-battle-card__sales-label">release year</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {!revealed && <div className="gm-battle-vs" style={{ color: "rgba(251,191,36,0.5)" }}>VS</div>}
      </div>

      {revealed && (
        <div className="gm-battle-result">
          <div className={`gm-battle-result__verdict ${isCorrect ? "gm-battle-result__verdict--correct" : "gm-battle-result__verdict--wrong"}`}>
            {pickedIndex === null ? "Time's up!" : isCorrect ? "Correct! 🎯" : "Wrong!"}
          </div>
          <div className={`gm-battle-result__pts ${isCorrect ? "gm-battle-result__pts--correct" : "gm-battle-result__pts--wrong"}`}>
            {isCorrect ? "+100 pts" : "+0 pts"}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main game ────────────────────────────────────────────────────────────────
interface GamingMixData { games: Game[] }

const TYPE_LABEL: Record<RoundType, string> = {
  year:   "📅 Release Year",
  battle: "💰 Best Seller",
  studio: "🏢 Studio Guess",
  older:  "📆 Timeline Duel",
};
const TYPE_CLASS: Record<RoundType, string> = {
  year:   "gm-topbar__type--year",
  battle: "gm-topbar__type--battle",
  studio: "gm-topbar__type--studio",
  older:  "gm-topbar__type--older",
};
const TIMER_FOR: Record<RoundType, number> = {
  year:   YEAR_TIMER,
  battle: BATTLE_TIMER,
  studio: STUDIO_TIMER,
  older:  OLDER_TIMER,
};

export default function GamingMixGame({ initialData }: { initialData: GamingMixData }) {
  const [phase, setPhase]               = useState<Phase>("home");
  const [mode, setMode]                 = useState<Mode>("solo");
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [rounds, setRounds]             = useState<Round[]>([]);
  const [round, setRound]               = useState(0);
  const [score, setScore]               = useState(0);
  const [revealed, setRevealed]         = useState(false);
  const [guessedYear, setGuessedYear]   = useState<number | null>(null);
  const [pickedBattle, setPickedBattle] = useState<0 | 1 | null>(null);
  const [pickedStudio, setPickedStudio] = useState<string | null>(null);
  const [pickedOlder, setPickedOlder]   = useState<0 | 1 | null>(null);
  const [timeLeft, setTimeLeft]         = useState(YEAR_TIMER);
  const [multiWaiting, setMultiWaiting] = useState(false);

  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const modeRef     = useRef<Mode>("solo");
  const mpRef       = useRef<ReturnType<typeof useMultiplayer> | null>(null);
  const revealedRef = useRef(false);

  useEffect(() => { modeRef.current = mode; }, [mode]);

  const currentRound = rounds[round] ?? null;
  const currentTimer = currentRound ? TIMER_FOR[currentRound.type] : YEAR_TIMER;

  const resetAnswers = useCallback(() => {
    setGuessedYear(null);
    setPickedBattle(null);
    setPickedStudio(null);
    setPickedOlder(null);
  }, []);

  // ── Multiplayer callbacks ──────────────────────────────────────────────────
  const onMpGameStart = useCallback((seed: number) => {
    trackEvent("game_start", { game_type: "gaming-mix", mode: "multi" });
    setRounds(buildRounds(initialData.games, seed));
    setRound(0); setScore(0); setRevealed(false); resetAnswers();
    setMultiWaiting(false); setPhase("playing");
  }, [initialData, resetAnswers]);

  const onMpGameSync = useCallback((round: number, _seed: number, myScore: number, alreadyAnswered: boolean) => {
    setRound(round); setScore(myScore); setRevealed(alreadyAnswered);
    setMultiWaiting(alreadyAnswered); resetAnswers();
    setPhase("playing");
  }, [resetAnswers]);

  const onMpNextRound = useCallback((nextRound: number) => {
    setMultiWaiting(false); setRound(nextRound);
    setRevealed(false); resetAnswers();
  }, [resetAnswers]);

  const onMpGameEnd = useCallback(() => {
    setMultiWaiting(false); setPhase("result");
  }, []);

  const mp = useMultiplayer({
    gameType: "gaming-mix",
    host: getPartykitHost(),
    onGameStart:        onMpGameStart,
    onGameSync:         onMpGameSync,
    onOpponentAnswered: useCallback(() => {}, []),
    onRoundEnd:         useCallback(() => {}, []),
    onNextRound:        onMpNextRound,
    onGameEnd:          onMpGameEnd,
  });
  useEffect(() => { mpRef.current = mp; });

  const { submitRating } = useRatingSubmit("gaming-mix");

  useEffect(() => {
    if (phase !== "result" || mode !== "multi" || !mp.opponent) return;
    const result = score > mp.opponent.score ? "win" : score < mp.opponent.score ? "loss" : "tie";
    recordMatch(mp.opponent.name, result);
    submitRating(score, mp.opponent.score);
  }, [phase, mode, score, mp.opponent, submitRating]);

  // ── Analytics: track game completion ─────────────────────────────────────────
  useEffect(() => {
    if (phase !== "result") return;
    trackEvent("game_complete", {
      game_type: "gaming-mix",
      mode: mode as "solo" | "multi",
      final_score: score,
      max_score: MAX_SCORE,
      score_pct: Math.round((score / MAX_SCORE) * 100),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Scroll to top on every phase transition so the SEO section below never shows
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [phase]);

  // ── Timer ──────────────────────────────────────────────────────────────────
  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const revealWithAnswer = useCallback((pts: number, extra: {
    year?: number; battle?: 0 | 1; studio?: string; older?: 0 | 1;
  }) => {
    if (modeRef.current !== "multi") stopTimer();
    revealedRef.current = true;
    setRevealed(true);
    if (extra.year   != null) setGuessedYear(extra.year);
    if (extra.battle != null) setPickedBattle(extra.battle);
    if (extra.studio != null) setPickedStudio(extra.studio);
    if (extra.older  != null) setPickedOlder(extra.older);
    setScore(s => s + pts);
    const answerStr = extra.year != null ? String(extra.year)
      : extra.battle != null ? String(extra.battle)
      : extra.studio != null ? extra.studio
      : extra.older  != null ? String(extra.older)
      : "timeout";
    if (modeRef.current === "multi") mpRef.current?.submitAnswer(answerStr, pts);
  }, [stopTimer]);

  useEffect(() => {
    if (phase !== "playing" || !currentRound) return;
    revealedRef.current = false;
    setTimeLeft(currentTimer);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (!revealedRef.current) {
            revealedRef.current = true;
            setRevealed(true);
            if (modeRef.current === "multi") mpRef.current?.submitAnswer("timeout", 0);
          }
          stopTimer();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return stopTimer;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, round]);

  // ── Game flow ──────────────────────────────────────────────────────────────
  function startSolo() {
    trackEvent("game_start", { game_type: "gaming-mix", mode: "solo" });
    setMode("solo");
    setRounds(buildRounds(initialData.games));
    setRound(0); setScore(0); setRevealed(false); resetAnswers();
    setMultiWaiting(false); setPhase("playing");
  }

  function startMulti() { mp.disconnect(); setMode("multi"); setShowNamePrompt(true); }

  const nextRound = useCallback(() => {
    if (modeRef.current === "multi") { setMultiWaiting(true); mpRef.current?.readyForNext(); return; }
    setRound(r => {
      if (r + 1 >= ROUNDS_PER_GAME) { setPhase("result"); return r; }
      return r + 1;
    });
    setRevealed(false); resetAnswers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function backToHome() { mp.disconnect(); setMode("solo"); setPhase("home"); }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (phase === "home") return (
    <>
      <HomeScreen onSolo={startSolo} onMulti={startMulti} />
      {showNamePrompt && (
        <MultiplayerEntryModal
          gameType="gaming-mix"
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

  if (!currentRound) return null;

  const waitLabel = "Waiting for opponent…";

  return (
    <div className="gm-wrapper">
      <div className="gm-glow" />

      {/* Top bar */}
      <div className="gm-topbar">
        <div className="gm-topbar__round">Round {round + 1} / {ROUNDS_PER_GAME}</div>
        <div className="gm-topbar__score">⭐ {score} pts</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className={`gm-topbar__type ${TYPE_CLASS[currentRound.type]}`}>
            {TYPE_LABEL[currentRound.type]}
          </span>
          {!revealed && <TimerRing seconds={timeLeft} total={currentTimer} />}
        </div>
      </div>

      {mode === "multi" && (
        <OpponentBar opponents={mp.opponents} myScore={score} maxScore={MAX_SCORE} />
      )}

      {/* Round content */}
      {currentRound.type === "year" && (
        <YearRoundComp
          game={currentRound.game}
          onSubmit={year => revealWithAnswer(yearScore(year, currentRound.game.year), { year })}
          revealed={revealed}
          guessedYear={guessedYear}
        />
      )}

      {currentRound.type === "battle" && (
        <BattleRoundComp
          games={currentRound.games}
          onSubmit={idx => {
            const winner = currentRound.games[0].sales >= currentRound.games[1].sales ? 0 : 1;
            revealWithAnswer(idx === winner ? 100 : 0, { battle: idx });
          }}
          revealed={revealed}
          pickedIndex={pickedBattle}
        />
      )}

      {currentRound.type === "studio" && (
        <StudioRoundComp
          game={currentRound.game}
          options={currentRound.options}
          onSubmit={studio => revealWithAnswer(studio === currentRound.game.studio ? 100 : 0, { studio })}
          revealed={revealed}
          picked={pickedStudio}
        />
      )}

      {currentRound.type === "older" && (
        <OlderRoundComp
          games={currentRound.games}
          onSubmit={idx => {
            const older = currentRound.games[0].year <= currentRound.games[1].year ? 0 : 1;
            revealWithAnswer(idx === older ? 100 : 0, { older: idx });
          }}
          revealed={revealed}
          pickedIndex={pickedOlder}
        />
      )}

      {/* Next button — shown after reveal */}
      {revealed && (
        <div style={{ position: "fixed", bottom: 24, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 200 }}>
          <button
            className="gm-next-btn"
            onClick={nextRound}
            disabled={multiWaiting}
          >
            {multiWaiting ? waitLabel : round + 1 >= ROUNDS_PER_GAME ? "See Results →" : "Next Round →"}
          </button>
        </div>
      )}

      <MultiplayerScreen
        status={mp.status} botCountdown={mp.botCountdown} onCancel={backToHome}
        onPlayBot={mp.playVsBot} onContinueSolo={() => { setMode("solo"); mp.disconnect(); }}
      />
    </div>
  );
}
