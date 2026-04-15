"use client";
import { memo, useState, useEffect, useRef, useCallback } from "react";
import "@/app/hotel-price/hotel-price.css";
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

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface Hotel {
  id: string;
  name: string;
  city: string;
  country: string;
  countryCode: string;
  tier: "luxury" | "mid" | "budget";
  stars: number | null;
  reviewScore: number | null;
  priceUsd: number;
  roomSizeSqm: number | null;
  roomSizeFt: number | null;
  amenities: string[];
  images: string[];
}

interface SliderQuestion { type: "price_slider"; data: Hotel }
interface BattleQuestion { type: "price_battle"; data: { hotel1: Hotel; hotel2: Hotel } }
type Question = SliderQuestion | BattleQuestion;
type Phase    = "home" | "playing" | "result";
type Mode     = "solo" | "multi";

// ─── Constants ─────────────────────────────────────────────────────────────────
const SLIDERS_PER_GAME = 7;
const BATTLES_PER_GAME = 3;
const ROUNDS_PER_GAME  = SLIDERS_PER_GAME + BATTLES_PER_GAME; // 10
const MAX_SCORE        = ROUNDS_PER_GAME * 100;                // 1000

// Logarithmic price scale: $15 → $2500
const LOG_MIN = Math.log(15);
const LOG_MAX = Math.log(2500);

function posToPrice(pos: number): number {
  return Math.round(Math.exp(LOG_MIN + (pos / 100) * (LOG_MAX - LOG_MIN)));
}
function priceToPos(price: number): number {
  const clamped = Math.max(15, Math.min(price, 2500));
  return Math.round(((Math.log(clamped) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 100);
}

function formatPrice(n: number): string {
  return "$" + n.toLocaleString("en-US");
}

const TIER_RANK: Record<string, number> = { budget: 0, mid: 1, luxury: 2 };

// ─── Scoring ───────────────────────────────────────────────────────────────────
function priceSliderScore(guess: number, answer: number): number {
  const ratio = Math.max(guess, answer) / Math.min(guess, answer);
  if (ratio <= 1.05) return 100;
  if (ratio <= 1.12) return 90;
  if (ratio <= 1.22) return 75;
  if (ratio <= 1.40) return 50;
  if (ratio <= 1.70) return 25;
  return 0;
}

function sliderVerdictClass(pts: number): string {
  if (pts >= 75) return "hp-slider-verdict--excellent";
  if (pts >= 25) return "hp-slider-verdict--good";
  return "hp-slider-verdict--poor";
}

function sliderVerdictLabel(pts: number): string {
  if (pts === 100) return "Perfect! 🎯";
  if (pts >= 90)  return "Excellent! ✨";
  if (pts >= 75)  return "Very close!";
  if (pts >= 50)  return "Not bad!";
  if (pts >= 25)  return "Wide of the mark";
  return "Way off! 😅";
}

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

// ─── Streak / multiplier ───────────────────────────────────────────────────────
function getMultiplier(streak: number): number {
  if (streak >= 10) return 2;
  if (streak >= 5)  return 1.5;
  return 1;
}

function CountryFlag({ code }: { code: string }) {
  if (!code || code.length !== 2) return <span>🌍</span>;
  const lc = code.toLowerCase();
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/w40/${lc}.png`}
      srcSet={`https://flagcdn.com/w40/${lc}.png 1x, https://flagcdn.com/w80/${lc}.png 2x`}
      width={20} height={15}
      alt={code}
      style={{ display: "inline-block", verticalAlign: "middle", borderRadius: 2 }}
    />
  );
}

const AMENITY_ICONS: Record<string, string> = {
  pool: "🏊", spa: "💆", "hot tub": "🛁", jacuzzi: "🛁", sauna: "🔥",
  wifi: "📶", "free wifi": "📶", gym: "💪", "fitness": "💪",
  restaurant: "🍽️", bar: "🍸", breakfast: "🥞",
  parking: "🅿️", balcony: "🌿", "sea view": "🌊", "ocean view": "🌊",
  rooftop: "🏙️", "room service": "🛎️", concierge: "🎩",
  "pet friendly": "🐾", terrace: "🌿",
};
function amenityIcon(amenity: string): string {
  const key = amenity.toLowerCase();
  for (const [k, v] of Object.entries(AMENITY_ICONS)) {
    if (key.includes(k)) return v + " ";
  }
  return "✓ ";
}

// ─── Question generation ───────────────────────────────────────────────────────
function generateQuestions(hotels: Hotel[], seed?: number): Question[] {
  if (hotels.length < 5) return [];
  const rand = seededRandom(seed ?? Math.floor(Math.random() * 1e9));
  const shuffled = seededShuffle([...hotels], rand);

  const questions: Question[] = [];
  const usedIds = new Set<string>();

  // Sliders: first SLIDERS_PER_GAME hotels
  const sliderHotels = shuffled.slice(0, SLIDERS_PER_GAME);
  sliderHotels.forEach(h => { usedIds.add(h.id); questions.push({ type: "price_slider", data: h }); });

  // Battles: pairs of hotels from same/adjacent tiers with reasonable price diff
  const remaining = shuffled.filter(h => !usedIds.has(h.id));
  const battlePairs: [Hotel, Hotel][] = [];
  const battleUsed = new Set<string>();

  for (let i = 0; i < remaining.length && battlePairs.length < BATTLES_PER_GAME; i++) {
    if (battleUsed.has(remaining[i].id)) continue;
    for (let j = i + 1; j < remaining.length; j++) {
      if (battleUsed.has(remaining[j].id)) continue;
      const h1 = remaining[i], h2 = remaining[j];
      const tierDiff = Math.abs(TIER_RANK[h1.tier] - TIER_RANK[h2.tier]);
      if (tierDiff > 1) continue;
      const ratio = Math.max(h1.priceUsd, h2.priceUsd) / Math.min(h1.priceUsd, h2.priceUsd);
      if (ratio < 1.20 || ratio > 5.0) continue;
      battlePairs.push([h1, h2]);
      battleUsed.add(h1.id);
      battleUsed.add(h2.id);
      break;
    }
  }
  // Fill remaining if needed (relaxed constraints)
  const leftover = remaining.filter(h => !battleUsed.has(h.id));
  for (let i = 0; i + 1 < leftover.length && battlePairs.length < BATTLES_PER_GAME; i += 2) {
    if (leftover[i].priceUsd !== leftover[i + 1].priceUsd) {
      battlePairs.push([leftover[i], leftover[i + 1]]);
    }
  }

  battlePairs.forEach(([h1, h2]) =>
    questions.push({ type: "price_battle", data: { hotel1: h1, hotel2: h2 } })
  );

  return seededShuffle(questions, rand);
}

// ─── Stars background ───────────────────────────────────────────────────────────
// Fixed seed so SSR and client produce identical values (no hydration mismatch)
const _starRand = seededRandom(42);
const STARS_BG = Array.from({ length: 45 }, (_, i) => ({
  id: i,
  x: _starRand() * 100,
  y: _starRand() * 100,
  size: _starRand() * 1.8 + 0.5,
  opacity: _starRand() * 0.20 + 0.04,
  delay: _starRand() * 4,
}));

const StarsBg = memo(function StarsBg() {
  return (
    <div className="stars-layer">
      {STARS_BG.map(s => (
        <div key={s.id} className="star" style={{
          left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size,
          opacity: s.opacity, animationDelay: `${s.delay}s`,
        }} />
      ))}
    </div>
  );
});

// ─── HotelImage ────────────────────────────────────────────────────────────────
function proxyUrl(src: string): string {
  return `/api/hotel-img?url=${encodeURIComponent(src)}`;
}

function HotelImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src]);
  if (!failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={proxyUrl(src)} alt={alt} className={className ?? "hp-card__img"}
        draggable={false} onError={() => setFailed(true)} />
    );
  }
  return <div className="hp-card__img-fallback">🏨</div>;
}

// ─── Slider Gallery (full-width with overlays) ──────────────────────────────────
function SliderGallery({ hotel, resetKey, showTier = false }: { hotel: Hotel; resetKey: number; showTier?: boolean }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => { setIdx(0); }, [resetKey]);

  const images = hotel.images.length > 0 ? hotel.images : [];
  const count  = images.length;
  const src    = images[idx];

  const hasSize = hotel.roomSizeSqm || hotel.roomSizeFt;
  const sizeStr = hasSize
    ? `📐 ${hotel.roomSizeFt ? `${hotel.roomSizeFt} ft²` : ""}${hotel.roomSizeSqm && hotel.roomSizeFt ? " · " : ""}${hotel.roomSizeSqm ? `${hotel.roomSizeSqm} m²` : ""}`
    : null;

  // Swipe support
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd   = (e: React.TouchEvent) => {
    if (touchStartX.current === null || count <= 1) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) < 40) return; // ignore small movements
    setIdx(i => dx < 0 ? (i + 1) % count : (i - 1 + count) % count);
    touchStartX.current = null;
  };

  return (
    <div className="hp-gallery" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {src ? (
        <HotelImage src={src} alt={hotel.name} className="hp-gallery__img" />
      ) : (
        <div className="hp-gallery__fallback">🏨</div>
      )}

      {/* Gradients for overlay readability */}
      <div className="hp-gallery__grad-top" />
      <div className="hp-gallery__grad-bot" />

      {/* Top-left: name + meta */}
      <div className="hp-gallery__info">
        <div className="hp-gallery__name">{hotel.name}</div>
        <div className="hp-gallery__meta">
          <span className="hp-gallery__location">
            <CountryFlag code={hotel.countryCode} />
            {hotel.city}, {hotel.country}
          </span>
          {hotel.stars !== null && hotel.stars > 0 && (
            <span className="hp-gallery__stars">
              {"★".repeat(hotel.stars)}
              <span className="hp-gallery__stars-empty">{"★".repeat(5 - hotel.stars)}</span>
            </span>
          )}
          {hotel.reviewScore && (
            <span className="hp-gallery__review">⭐ {hotel.reviewScore.toFixed(1)}</span>
          )}
          {showTier && (
            <span className="hp-gallery__review" style={{
              color: hotel.tier === "luxury" ? "#e8c068" : hotel.tier === "mid" ? "#7dd3fc" : "#86efac",
              background: hotel.tier === "luxury" ? "rgba(200,145,58,0.30)" : hotel.tier === "mid" ? "rgba(56,189,248,0.22)" : "rgba(74,222,128,0.20)",
            }}>
              {hotel.tier === "luxury" ? "✦ Luxury" : hotel.tier === "mid" ? "◆ Mid-range" : "◇ Budget"}
            </span>
          )}
        </div>
      </div>

      {/* Bottom-right: room size */}
      {sizeStr && <div className="hp-gallery__size">{sizeStr}</div>}

      {/* Nav buttons */}
      {count > 1 && (
        <button className="hp-gallery__btn hp-gallery__btn--prev"
          onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + count) % count); }}>‹</button>
      )}
      {count > 1 && (
        <button className="hp-gallery__btn hp-gallery__btn--next"
          onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % count); }}>›</button>
      )}

      {/* Dots */}
      {count > 1 && (
        <div className="hp-gallery__dots">
          {images.map((_, i) => (
            <button key={i}
              className={`hp-gallery__dot${i === idx ? " hp-gallery__dot--active" : ""}`}
              onClick={e => { e.stopPropagation(); setIdx(i); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Home Screen ─────────────────────────────────────────────────────────────────
function HomeScreen({ onSolo, onMulti }: { onSolo: () => void; onMulti: () => void }) {
  return (
    <div className="game-wrapper theme-hotel">
      <StarsBg />
      <div className="glow-orb glow-orb--orange" />
      <div className="glow-orb glow-orb--purple" />
      <div className="home-screen">
        <div className="home-emoji">🏨</div>
        <p className="home-title">Hotel <span className="accent">Price</span></p>
        <p className="home-subtitle">Guess the nightly rate from hotel photos & amenities</p>

        <div className="how-it-works">
          <div className="how-it-works__title">How it works</div>
          {[
            ["🖼️", "Browse hotel photos from cities around the world"],
            ["💰", "Slide to guess the price per night in USD"],
            ["⚔️", "Battle rounds: which hotel costs more?"],
            ["🎯", "Get within 5% for a perfect 100-point score"],
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

// ─── Result Screen ────────────────────────────────────────────────────────────────
function ResultScreen({
  score, oppScore, mode, soloCorrect, onReplay, rematchZone,
}: {
  score: number; oppScore: number | null; mode: Mode;
  soloCorrect: number; onReplay: () => void; rematchZone?: React.ReactNode;
}) {
  const [shared, setShared] = useState(false);
  const isMulti = mode === "multi" && oppScore !== null;
  const pct     = (score / MAX_SCORE) * 100;
  const iWon    = isMulti && score > oppScore!;
  const tied    = isMulti && score === oppScore!;

  async function handleShare() {
    const text = `🏨 Hotel Price — I scored ${score}/${MAX_SCORE}!\nGuess hotel prices from NYC to Bali: ultimate-playground.com/hotel-price`;
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
    <div className="game-wrapper theme-hotel">
      <StarsBg />
      <div className="glow-orb glow-orb--orange" />
      <div className="glow-orb glow-orb--purple" />
      <div className="hp-result">
        <div className="hp-result__title">
          {isMulti
            ? (iWon ? "You win! 🏆" : tied ? "It&apos;s a tie! 🤝" : "You lose! 😅")
            : "Game Over! 🏨"}
        </div>
        <div className="hp-result__score">
          {score}<span className="hp-result__max">/{MAX_SCORE}</span>
        </div>
        <div className="hp-result__correct">
          {soloCorrect}/{ROUNDS_PER_GAME} rounds scored
        </div>
        {isMulti && (
          <div className="hp-result__vs">
            <div className={`hp-result__vs-score ${iWon ? "hp-result__vs-score--win" : "hp-result__vs-score--loss"}`}>
              {iWon ? "You win! 🏆" : tied ? "It&apos;s a tie! 🤝" : "You lose 😢"}
            </div>
            <div className="hp-result__vs-detail">You: {score} pts · Opp: {oppScore} pts</div>
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
          <button className={`hp-share-btn${shared ? " hp-share-btn--copied" : ""}`} onClick={handleShare}>
            {shared ? "✓ Copied!" : "Share 🏨"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Battle Card ───────────────────────────────────────────────────────────────
function BattleCard({
  hotel, revealed, isWinner, isSelected, onClick, disabled,
}: {
  hotel: Hotel;
  revealed: boolean;
  isWinner: boolean;
  isSelected: boolean;
  onClick: () => void;
  disabled: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const touchStartX = useRef<number | null>(null);
  useEffect(() => { setImgFailed(false); setImgIdx(0); }, [hotel.id]);

  const images = hotel.images;
  const count  = images.length;
  const src    = images[imgIdx];

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd   = (e: React.TouchEvent) => {
    if (touchStartX.current === null || count <= 1) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) < 40) return;
    setImgIdx(i => dx < 0 ? (i + 1) % count : (i - 1 + count) % count);
    touchStartX.current = null;
  };

  let cls = "hp-card";
  if (revealed) {
    if (isWinner)        cls += " hp-card--winner";
    else if (isSelected) cls += " hp-card--loser hp-card--selected-wrong";
    else                 cls += " hp-card--loser";
    cls += " hp-card--disabled";
  } else if (disabled) {
    cls += " hp-card--disabled";
  } else if (isSelected) {
    cls += " hp-card--pending";
  }

  return (
    <div className={cls}
      onClick={!revealed && !disabled ? onClick : undefined}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Image fills the card */}
      {src && !imgFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={proxyUrl(src)} alt={hotel.name} className="hp-card__img"
          draggable={false} onError={() => setImgFailed(true)} />
      ) : (
        <div className="hp-card__img-fallback">🏨</div>
      )}

      {/* Gradients for overlay readability */}
      <div className="hp-gallery__grad-top" />
      <div className="hp-card__img-gradient" />

      {/* Winner badge */}
      {revealed && isWinner && <div className="hp-card__winner-badge">Most Expensive 💰</div>}

      {/* Top-left: name + location + stars */}
      <div className="hp-gallery__info">
        <div className="hp-gallery__name">{hotel.name}</div>
        <div className="hp-gallery__meta">
          <span className="hp-gallery__location">
            <CountryFlag code={hotel.countryCode} /> {hotel.city}
          </span>
          {hotel.stars !== null && hotel.stars > 0 && (
            <span className="hp-gallery__stars">
              {"★".repeat(hotel.stars)}
              <span className="hp-gallery__stars-empty">{"★".repeat(5 - hotel.stars)}</span>
            </span>
          )}
        </div>
      </div>

      {/* Bottom-left: price when revealed */}
      {revealed && (
        <div className="hp-card__price-overlay">
          {formatPrice(hotel.priceUsd)}
          <span className="hp-card__price-label"> / night</span>
        </div>
      )}

      {/* Bottom-right: room size */}
      {hotel.roomSizeSqm !== null && (
        <div className="hp-gallery__size">
          {hotel.roomSizeSqm} m² · {hotel.roomSizeFt} ft²
        </div>
      )}

      {/* Gallery nav arrows */}
      {count > 1 && (
        <button className="hp-gallery__btn hp-gallery__btn--prev"
          onClick={e => { e.stopPropagation(); setImgIdx(i => (i - 1 + count) % count); }}>‹</button>
      )}
      {count > 1 && (
        <button className="hp-gallery__btn hp-gallery__btn--next"
          onClick={e => { e.stopPropagation(); setImgIdx(i => (i + 1) % count); }}>›</button>
      )}

      {/* Dots */}
      {count > 1 && (
        <div className="hp-gallery__dots">
          {images.map((_, i) => (
            <button key={i}
              className={`hp-gallery__dot${i === imgIdx ? " hp-gallery__dot--active" : ""}`}
              onClick={e => { e.stopPropagation(); setImgIdx(i); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function HotelPriceGame({ initialData }: { initialData: Hotel[] }) {
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
  const [pendingAnswer, setPendingAnswer]   = useState<number | null>(null);
  const [revealed, setRevealed]         = useState(false);
  const [multiWaiting, setMultiWaiting] = useState(false);

  // Slider state: position 0-100 on log scale
  const [sliderPos, setSliderPos]       = useState(50);
  const [sliderLocked, setSliderLocked] = useState(false);
  const [sliderPts, setSliderPts]       = useState(0);

  const modeRef     = useRef<Mode>("solo");
  const mpRef       = useRef<ReturnType<typeof useMultiplayer> | null>(null);
  const revealedRef = useRef(false);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  const { submitRating } = useRatingSubmit("hotel-price");
  const currentQ = questions[round] ?? null;

  // Reset slider on new round
  useEffect(() => {
    setSliderPos(50);
    setSliderLocked(false);
    setSliderPts(0);
  }, [round, phase]);

  // ── Multiplayer callbacks ────────────────────────────────────────────────────
  const onMpGameStart = useCallback((seed: number) => {
    const qs = generateQuestions(initialData, seed);
    setQuestions(qs);
    setRound(0); setScore(0); setSoloCorrect(0); setStreak(0); setBestStreak(0);
    setSelectedAnswer(null); setPendingAnswer(null); setRevealed(false); revealedRef.current = false;
    setMultiWaiting(false);
    setPhase("playing");
  }, [initialData]);

  const onMpNextRound = useCallback((nextRound: number) => {
    setMultiWaiting(false);
    setRound(nextRound);
    setSelectedAnswer(null); setPendingAnswer(null); setRevealed(false); revealedRef.current = false;
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
    gameType: "hotel-price",
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

    let pts = 0;
    let isCorrect = false;

    if (currentQ.type === "price_slider") {
      const priceGuess = posToPrice(value); // value is sliderPos here
      pts = priceSliderScore(priceGuess, currentQ.data.priceUsd);
      isCorrect = pts >= 50;
      setSliderPts(pts);
      if (modeRef.current === "multi") {
        mpRef.current?.submitAnswer(String(priceGuess), pts);
        setMultiWaiting(true);
      } else {
        setScore(s => s + pts);
        if (isCorrect) {
          const newStreak = streak + 1;
          setStreak(newStreak);
          setBestStreak(b => Math.max(b, newStreak));
          setSoloCorrect(c => c + 1);
        } else {
          setStreak(0);
        }
      }
    } else {
      // price_battle: value = 0 (hotel1) or 1 (hotel2)
      const h1 = currentQ.data.hotel1, h2 = currentQ.data.hotel2;
      const correctIdx = h1.priceUsd >= h2.priceUsd ? 0 : 1;
      isCorrect = value === correctIdx;
      const multiplier = modeRef.current === "solo" ? getMultiplier(streak) : 1;
      pts = isCorrect ? Math.round(100 * multiplier) : 0;
      if (modeRef.current === "multi") {
        mpRef.current?.submitAnswer(String(value), pts);
        setMultiWaiting(true);
      } else {
        setScore(s => s + pts);
        if (isCorrect) {
          const newStreak = streak + 1;
          setStreak(newStreak);
          setBestStreak(b => Math.max(b, newStreak));
          setSoloCorrect(c => c + 1);
        } else {
          setStreak(0);
        }
      }
    }

    setSelectedAnswer(value);
    setRevealed(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQ, streak, sliderPos]);

  const handleSliderSubmit = useCallback(() => {
    setSliderLocked(true);
    handleAnswer(sliderPos);
  }, [sliderPos, handleAnswer]);

  const handleBattleConfirm = useCallback(() => {
    if (pendingAnswer !== null) handleAnswer(pendingAnswer);
  }, [pendingAnswer, handleAnswer]);

  const handleNext = useCallback(() => {
    if (modeRef.current === "multi") {
      setMultiWaiting(true);
      mpRef.current?.readyForNext();
      return;
    }
    if (round + 1 >= ROUNDS_PER_GAME) { setPhase("result"); return; }
    setRound(round + 1);
    setSelectedAnswer(null); setPendingAnswer(null); setRevealed(false); revealedRef.current = false;
  }, [round]);

  // ── Game flow ──────────────────────────────────────────────────────────────
  function startSolo() {
    if (initialData.length < 5) return;
    setMode("solo");
    setQuestions(generateQuestions(initialData));
    setRound(0); setScore(0); setSoloCorrect(0); setStreak(0); setBestStreak(0);
    setSelectedAnswer(null); setRevealed(false); revealedRef.current = false;
    setMultiWaiting(false);
    setPhase("playing");
  }

  function startMulti() { mp.disconnect(); setMode("multi"); setShowNamePrompt(true); }
  function backToHome()  { mp.disconnect(); setMode("solo"); setPhase("home"); }

  // ── Empty data state ───────────────────────────────────────────────────────
  if (phase === "home" && initialData.length < 5) {
    return (
      <div className="game-wrapper theme-hotel">
        <StarsBg />
        <div className="glow-orb glow-orb--orange" />
        <div className="glow-orb glow-orb--purple" />
        <div className="home-screen">
          <div className="hp-empty">
            <div className="hp-empty__icon">🏗️</div>
            <div className="hp-empty__title">Coming Soon</div>
            <div className="hp-empty__text">
              Hotel Price is currently loading its data. Check back shortly — we&apos;re collecting real hotel prices from cities around the world.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Screens ─────────────────────────────────────────────────────────────────
  if (phase === "home") return (
    <>
      <HomeScreen onSolo={startSolo} onMulti={startMulti} />
      {showNamePrompt && (
        <MultiplayerEntryModal
          gameType="hotel-price"
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
        score={score} oppScore={mp.opponent?.score ?? null}
        mode={mode} soloCorrect={soloCorrect}
        onReplay={backToHome}
        rematchZone={mode === "multi" && mp.opponent ? (
          <RematchZone
            opponent={mp.opponent} myWantsRematch={mp.myWantsRematch}
            series={mp.series} onRematch={mp.requestRematch}
          />
        ) : undefined}
      />
      <RelatedGames currentSlug="/hotel-price" />
      {mp.finalLeaderboard && (
        <LeaderboardOverlay
          leaderboard={mp.finalLeaderboard}
          onClose={() => { mp.disconnect(); backToHome(); }}
        />
      )}
    </>
  );

  if (!currentQ) return null;

  // ── Playing ────────────────────────────────────────────────────────────────
  const isMulti      = mode === "multi";
  const multiplier   = getMultiplier(streak);
  const showStreak   = !isMulti && streak >= 3;
  const displayPrice = posToPrice(sliderPos);

  // Compute battle feedback values
  let battleCorrect = false;
  let battlePts     = 0;
  if (revealed && currentQ.type === "price_battle" && selectedAnswer !== null) {
    const h1 = currentQ.data.hotel1, h2 = currentQ.data.hotel2;
    const correctIdx = h1.priceUsd >= h2.priceUsd ? 0 : 1;
    battleCorrect = selectedAnswer === correctIdx;
    battlePts = battleCorrect ? Math.round(100 * (isMulti ? 1 : multiplier)) : 0;
  }

  return (
    <div className="hp-wrapper">
      <div className="glow-orb glow-orb--orange" />
      <div className="glow-orb glow-orb--purple" />

      {/* Progress */}
      <div className="hp-progress-area">
        <div className="progress-bar">
          <div className="progress-bar__header">
            <span className="progress-bar__question">
              {isMulti ? "Round" : "Question"} {round + 1}/{ROUNDS_PER_GAME}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {showStreak && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 5,
                  fontSize: "0.88rem", fontWeight: 800, color: "#e8c068",
                  background: "rgba(0,0,0,0.25)", border: "1px solid rgba(200,145,58,0.25)",
                  borderRadius: "20px", padding: "4px 12px",
                }}>
                  🔥 {streak}
                  {multiplier > 1 && (
                    <span style={{ fontSize: "0.76rem", fontWeight: 800, color: "#e8c068", background: "rgba(255,255,255,0.12)", borderRadius: "10px", padding: "1px 7px", marginLeft: 2 }}>
                      ×{multiplier}
                    </span>
                  )}
                </div>
              )}
              <div className="progress-bar__stat">
                <div className="progress-bar__stat-label">Score</div>
                <div className="progress-bar__stat-value" style={{ color: "#e8c068" }}>{score}</div>
              </div>
            </div>
          </div>
          <div className="progress-bar__track">
            <div className="progress-bar__fill" style={{ width: `${(round / ROUNDS_PER_GAME) * 100}%` }} />
          </div>
        </div>
      </div>

      {isMulti && (
        <OpponentBar opponents={mp.opponents} myScore={score} maxScore={MAX_SCORE} />
      )}

      {/* Main question area */}
      <div className="hp-main">

        {/* ── SLIDER ROUND ──────────────────────────────────────── */}
        {currentQ.type === "price_slider" && (() => {
          const hotel = currentQ.data;
          return (
            <>
              <div className="hp-round-badge" style={{ marginBottom: 4 }}>
                <span className="hp-round-badge__icon">💰</span>
                <span className="hp-round-badge__label">Guess the price per night</span>
              </div>
              <div className="hp-slider-round">

                {/* Full-width gallery with overlays */}
                <SliderGallery hotel={hotel} resetKey={round} showTier={revealed} />

                {/* Amenities strip */}
                {hotel.amenities.length > 0 && (
                  <div className="hp-amenities-strip">
                    {hotel.amenities.slice(0, 8).map(a => (
                      <span key={a} className="hp-amenities-strip__chip">{amenityIcon(a)}{a}</span>
                    ))}
                  </div>
                )}

                {/* Slider */}
                <div className="hp-slider-controls">
                  <div className={`hp-price-display${sliderLocked ? " hp-price-display--locked" : ""}`}>
                    {formatPrice(displayPrice)}
                    <span className="hp-price-display__unit">/ night</span>
                  </div>

                  {revealed ? (
                    <>
                      <div className={`hp-slider-verdict ${sliderVerdictClass(sliderPts)}`}>
                        <span className="hp-slider-verdict__correct">{sliderVerdictLabel(sliderPts)}</span>
                        <span className="hp-slider-verdict__pts">
                          Actual: {formatPrice(hotel.priceUsd)} · +{sliderPts} pts
                        </span>
                      </div>
                      {/* Desktop only: Next button in place of Confirm */}
                      <button className="hp-slider__lock-btn hp-slider__next-desktop" onClick={handleNext}>
                        {round + 1 >= ROUNDS_PER_GAME ? "See Results" : "Next →"}
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="hp-slider__track-wrap">
                        <div className="hp-slider__range">
                          <input
                            type="range"
                            min={0} max={100}
                            value={sliderPos}
                            onChange={e => setSliderPos(Number(e.target.value))}
                            disabled={sliderLocked || multiWaiting}
                            className="hp-slider__input"
                          />
                        </div>
                        <div className="hp-slider__labels">
                          <span>$15</span><span>$50</span><span>$200</span><span>$750</span><span>$2,500</span>
                        </div>
                      </div>
                      {!sliderLocked && !multiWaiting && (
                        /* Desktop only: Confirm in slider-controls */
                        <button className="hp-slider__lock-btn hp-slider__confirm-desktop" onClick={handleSliderSubmit}>
                          Confirm — {formatPrice(displayPrice)}/night
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          );
        })()}

        {/* ── BATTLE ROUND ──────────────────────────────────────── */}
        {currentQ.type === "price_battle" && (() => {
          const { hotel1, hotel2 } = currentQ.data;
          const correctIdx = hotel1.priceUsd >= hotel2.priceUsd ? 0 : 1;
          return (
            <div className="hp-battle-round">
              <div className="hp-round-badge">
                <span className="hp-round-badge__icon">⚔️</span>
                <span className="hp-round-badge__label">Battle</span>
              </div>
              <div className="hp-battle-question">Which hotel costs more per night?</div>
              <div className="hp-battle">
                <BattleCard
                  hotel={hotel1}
                  revealed={revealed}
                  isWinner={correctIdx === 0}
                  isSelected={revealed ? selectedAnswer === 0 : pendingAnswer === 0}
                  onClick={() => setPendingAnswer(0)}
                  disabled={revealed || multiWaiting}
                />
                <div className="hp-vs-divider">
                  <div className="hp-vs-divider__icon">💰</div>
                  <div className="hp-vs-divider__text">VS</div>
                </div>
                <BattleCard
                  hotel={hotel2}
                  revealed={revealed}
                  isWinner={correctIdx === 1}
                  isSelected={revealed ? selectedAnswer === 1 : pendingAnswer === 1}
                  onClick={() => setPendingAnswer(1)}
                  disabled={revealed || multiWaiting}
                />
              </div>

              {pendingAnswer !== null && !revealed && !multiWaiting && (
                <button className="hp-slider__lock-btn hp-battle__confirm-desktop" onClick={handleBattleConfirm}>
                  Confirm Selection
                </button>
              )}

              {revealed && (
                <div className={`hp-verdict hp-verdict--${battleCorrect ? "correct" : "wrong"}`}>
                  <div className="hp-verdict__icon">{battleCorrect ? "✅" : "❌"}</div>
                  <div className="hp-verdict__label">{battleCorrect ? "Correct!" : "Wrong!"}</div>
                  <div className="hp-verdict__pts">
                    {battleCorrect ? `+${battlePts} pts` : "+0 pts"}
                    {battleCorrect && multiplier > 1 && !isMulti && (
                      <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.55)", marginLeft: 6 }}>
                        · ×{multiplier} streak!
                      </span>
                    )}
                  </div>
                  <div className="hp-verdict__prices">
                    {[hotel1, hotel2].map((h, idx) => {
                      const isSelected = selectedAnswer === idx;
                      const isCorrect  = idx === correctIdx;
                      let cls = "hp-verdict__price-row";
                      if (isSelected && isCorrect)  cls += " hp-verdict__price-row--correct";
                      if (isSelected && !isCorrect) cls += " hp-verdict__price-row--wrong";
                      return (
                        <div key={h.id} className={cls}>
                          <span className="hp-verdict__price-name">{h.name}</span>
                          <span className="hp-verdict__price-val">{formatPrice(h.priceUsd)}<span className="hp-verdict__price-night">/night</span></span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Action bar */}
      <div className={`hp-action-bar${(!revealed && currentQ.type === "price_slider") || (!revealed && currentQ.type === "price_battle" && pendingAnswer !== null) ? " hp-action-bar--mobile-confirm" : ""}`}>
        {!revealed && !multiWaiting && currentQ.type === "price_battle" && (
          <>
            {pendingAnswer !== null && (
              <button className="hp-slider__lock-btn hp-battle__confirm-mobile" onClick={handleBattleConfirm}>
                Confirm Selection
              </button>
            )}
            <div className="hp-action-bar__hint">Tap the more expensive hotel</div>
          </>
        )}
        {!revealed && !multiWaiting && currentQ.type === "price_slider" && (
          <>
            {/* Mobile only: Confirm button in action bar */}
            <button className="hp-slider__lock-btn hp-slider__confirm-mobile" onClick={handleSliderSubmit} disabled={sliderLocked}>
              Confirm — {formatPrice(displayPrice)}/night
            </button>
            {/* Desktop hint */}
            <div className="hp-action-bar__hint">Drag the slider, then confirm</div>
          </>
        )}
        {multiWaiting && (
          <div className="hp-waiting">
            <div className="waiting-dot" /><div className="waiting-dot" /><div className="waiting-dot" />
            <span>Waiting for opponent…</span>
          </div>
        )}
        {revealed && !multiWaiting && (
          <div className="hp-feedback">
            <div className="hp-feedback__left">
              {currentQ.type === "price_slider" ? (
                <>
                  <span className="hp-feedback__icon">
                    {sliderPts >= 75 ? "🎯" : sliderPts >= 25 ? "💰" : "📉"}
                  </span>
                  <span className={`hp-feedback__text hp-feedback__text--${sliderPts >= 50 ? "correct" : "wrong"}`}>
                    +{sliderPts} pts
                  </span>
                </>
              ) : (
                <>
                  <span className="hp-feedback__icon">{battleCorrect ? "✅" : "❌"}</span>
                  <span className={`hp-feedback__text hp-feedback__text--${battleCorrect ? "correct" : "wrong"}`}>
                    {battleCorrect ? `+${battlePts} pts` : "Better luck next time"}
                  </span>
                </>
              )}
            </div>
            {/* Desktop slider: Next is in slider-controls; show here for battle + mobile */}
            <button className={`btn-next btn-hover-sm${currentQ.type === "price_slider" ? " hp-next-actionbar-slider" : ""}`} onClick={handleNext}>
              {round + 1 >= ROUNDS_PER_GAME ? "See Results" : "Next →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
