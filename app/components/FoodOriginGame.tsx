"use client";
import { memo, useState, useEffect, useRef, useCallback } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { seededShuffle } from "@/lib/seededRandom";
import rawDishes from "@/app/food_data.json";
import "@/app/food/food.css";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Dish {
  name: string;
  country: string;
  countryCode: string;
  wiki: string;
  hint: string;
  image_url?: string;
}

type Phase = "home" | "playing" | "revealed" | "result";

// ─── Constants ───────────────────────────────────────────────────────────────
const ALL_DISHES = rawDishes as Dish[];
const ROUNDS_PER_GAME = 10;
const ROUND_SECONDS = 30;
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

// ISO 3166-1 numeric IDs for special handling
const ISRAEL_ID = "376";
const PALESTINE_ID = "275";

// ─── Natural Earth name → ISO alpha-2 mapping ────────────────────────────────
// Covers all Natural Earth country names that differ from our dish data
const GEO_NAME_TO_ALPHA2: Record<string, string> = {
  "Afghanistan": "AF", "Albania": "AL", "Algeria": "DZ", "Angola": "AO",
  "Argentina": "AR", "Armenia": "AM", "Australia": "AU", "Austria": "AT",
  "Azerbaijan": "AZ", "Bahrain": "BH", "Bangladesh": "BD", "Belarus": "BY",
  "Belgium": "BE", "Bolivia": "BO", "Bosnia and Herz.": "BA",
  "Bosnia and Herzegovina": "BA", "Botswana": "BW", "Brazil": "BR",
  "Brunei": "BN", "Bulgaria": "BG", "Burkina Faso": "BF", "Burundi": "BI",
  "Cambodia": "KH", "Cameroon": "CM", "Canada": "CA",
  "Central African Rep.": "CF", "Central African Republic": "CF",
  "Chad": "TD", "Chile": "CL", "China": "CN", "Colombia": "CO",
  "Congo": "CG", "Costa Rica": "CR", "Croatia": "HR", "Cuba": "CU",
  "Cyprus": "CY", "Czech Republic": "CZ", "Czechia": "CZ",
  "Dem. Rep. Congo": "CD", "Democratic Republic of Congo": "CD",
  "Denmark": "DK", "Dominican Rep.": "DO", "Dominican Republic": "DO",
  "Ecuador": "EC", "Egypt": "EG", "El Salvador": "SV", "Eritrea": "ER",
  "Estonia": "EE", "Ethiopia": "ET", "Fiji": "FJ", "Finland": "FI",
  "France": "FR", "Gabon": "GA", "Georgia": "GE", "Germany": "DE",
  "Ghana": "GH", "Greece": "GR", "Guatemala": "GT", "Guinea": "GN",
  "Guyana": "GY", "Haiti": "HT", "Honduras": "HN", "Hungary": "HU",
  "Iceland": "IS", "India": "IN", "Indonesia": "ID", "Iran": "IR",
  "Iraq": "IQ", "Ireland": "IE", "Italy": "IT", "Jamaica": "JM",
  "Japan": "JP", "Jordan": "JO", "Kazakhstan": "KZ", "Kenya": "KE",
  "Kosovo": "XK", "Kuwait": "KW", "Kyrgyzstan": "KG", "Laos": "LA",
  "Latvia": "LV", "Lebanon": "LB", "Libya": "LY", "Lithuania": "LT",
  "Luxembourg": "LU", "Madagascar": "MG", "Malawi": "MW", "Malaysia": "MY",
  "Mali": "ML", "Malta": "MT", "Mauritania": "MR", "Mexico": "MX",
  "Moldova": "MD", "Mongolia": "MN", "Montenegro": "ME", "Morocco": "MA",
  "Mozambique": "MZ", "Myanmar": "MM", "Namibia": "NA", "Nepal": "NP",
  "Netherlands": "NL", "New Zealand": "NZ", "Nicaragua": "NI",
  "Niger": "NE", "Nigeria": "NG", "North Korea": "KP",
  "North Macedonia": "MK", "Norway": "NO", "Oman": "OM", "Pakistan": "PK",
  "Palestine": "PS", "Panama": "PA", "Papua New Guinea": "PG",
  "Paraguay": "PY", "Peru": "PE", "Philippines": "PH", "Poland": "PL",
  "Portugal": "PT", "Qatar": "QA", "Romania": "RO", "Russia": "RU",
  "Russian Federation": "RU", "Rwanda": "RW", "Saudi Arabia": "SA",
  "Senegal": "SN", "Serbia": "RS", "Sierra Leone": "SL", "Slovakia": "SK",
  "Slovenia": "SI", "Somalia": "SO", "South Africa": "ZA",
  "South Korea": "KR", "Republic of Korea": "KR", "South Sudan": "SS",
  "Spain": "ES", "Sri Lanka": "LK", "Sudan": "SD", "Suriname": "SR",
  "Sweden": "SE", "Switzerland": "CH", "Syria": "SY", "Taiwan": "TW",
  "Tajikistan": "TJ", "Tanzania": "TZ", "Thailand": "TH", "Togo": "TG",
  "Trinidad and Tobago": "TT", "Tunisia": "TN", "Turkey": "TR",
  "Turkmenistan": "TM", "Uganda": "UG", "Ukraine": "UA",
  "United Arab Emirates": "AE", "United Kingdom": "GB",
  "United States of America": "US", "United States": "US",
  "Uruguay": "UY", "Uzbekistan": "UZ", "Venezuela": "VE",
  "Viet Nam": "VN", "Vietnam": "VN", "W. Sahara": "EH",
  "Yemen": "YE", "Zambia": "ZM", "Zimbabwe": "ZW",
  "Côte d'Ivoire": "CI", "Ivory Coast": "CI",
};

function getAlpha2(geo: { id: string; properties: { name: string } }): string | null {
  if (geo.id === PALESTINE_ID) return "PS";
  if (geo.id === ISRAEL_ID) return null; // non-clickable
  return GEO_NAME_TO_ALPHA2[geo.properties.name] ?? null;
}

function getDisplayName(geo: { id: string; properties: { name: string } }): string {
  if (geo.id === PALESTINE_ID) return "Palestine";
  return geo.properties.name;
}

// ─── Pick N random dishes ─────────────────────────────────────────────────────
function pickDishes(n: number, seed?: number): Dish[] {
  const shuffled = seed !== undefined
    ? seededShuffle([...ALL_DISHES], seed)
    : [...ALL_DISHES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

// ─── Stars ───────────────────────────────────────────────────────────────────
const STARS = Array.from({ length: 60 }, (_, i) => ({
  id: i, x: Math.random() * 100, y: Math.random() * 100,
  size: Math.random() * 2 + 0.5, opacity: Math.random() * 0.5 + 0.1, delay: Math.random() * 4,
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
function DishPhoto({ dish }: { dish: Dish }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => setLoaded(false), [dish]);
  if (!dish.image_url) return <div className="fd-dish-photo fd-dish-photo--placeholder" />;
  return (
    <div className="fd-dish-photo-wrap">
      {!loaded && <div className="fd-dish-photo fd-dish-photo--placeholder" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={dish.image_url}
        alt={dish.name}
        className={`fd-dish-photo${loaded ? " fd-dish-photo--visible" : ""}`}
        onLoad={() => setLoaded(true)}
        draggable={false}
      />
    </div>
  );
}

// ─── Timer ring ───────────────────────────────────────────────────────────────
function TimerRing({ seconds, total }: { seconds: number; total: number }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const pct = seconds / total;
  const color = pct > 0.5 ? "#00ffa0" : pct > 0.25 ? "#f0c040" : "#ff6b6b";
  return (
    <svg className="fd-timer-ring" viewBox="0 0 50 50">
      <circle cx="25" cy="25" r={r} stroke="#ffffff18" strokeWidth="4" fill="none" />
      <circle
        cx="25" cy="25" r={r} stroke={color} strokeWidth="4" fill="none"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - pct)}
        strokeLinecap="round"
        transform="rotate(-90 25 25)"
        style={{ transition: "stroke-dashoffset 1s linear, stroke 0.4s" }}
      />
      <text x="25" y="25" textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize="14" fontWeight="bold">{seconds}</text>
    </svg>
  );
}

// ─── World Map ────────────────────────────────────────────────────────────────
interface MapProps {
  correctCode: string;
  clickedCode: string | null;
  revealed: boolean;
  onCountryClick: (alpha2: string, name: string) => void;
  onCountryHover: (name: string | null) => void;
}

const WorldMap = memo(function WorldMap({ correctCode, clickedCode, revealed, onCountryClick, onCountryHover }: MapProps) {
  function getFill(geo: { id: string; properties: { name: string } }): { default: string; hover: string } {
    const alpha2 = getAlpha2(geo);
    const isIsrael = geo.id === ISRAEL_ID;

    if (isIsrael) return { default: "#1a2535", hover: "#1a2535" };

    if (revealed) {
      if (alpha2 === correctCode) return { default: "#16a34a", hover: "#16a34a" };
      if (clickedCode && alpha2 === clickedCode && alpha2 !== correctCode) return { default: "#dc2626", hover: "#dc2626" };
    }
    return { default: "#1e3a5f", hover: "#7c3aed" };
  }

  return (
    <ComposableMap
      projection="geoMercator"
      projectionConfig={{ center: [10, 15], scale: 135 }}
      style={{ width: "100%", height: "100%" }}
    >
      <Geographies geography={GEO_URL}>
        {({ geographies }) =>
          geographies.map(geo => {
            const isIsrael = geo.id === ISRAEL_ID;
            const alpha2 = getAlpha2(geo);
            const displayName = getDisplayName(geo);
            const fill = getFill(geo);

            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                onMouseEnter={() => !isIsrael && onCountryHover(displayName)}
                onMouseLeave={() => onCountryHover(null)}
                onClick={() => {
                  if (isIsrael || revealed || !alpha2) return;
                  onCountryClick(alpha2, displayName);
                }}
                style={{
                  default:  { fill: fill.default, stroke: "#0d1f35", strokeWidth: 0.4, outline: "none" },
                  hover:    { fill: isIsrael ? fill.default : fill.hover, stroke: "#0d1f35", strokeWidth: 0.4, outline: "none", cursor: isIsrael ? "default" : "pointer" },
                  pressed:  { fill: fill.hover, stroke: "#0d1f35", strokeWidth: 0.4, outline: "none" },
                }}
              />
            );
          })
        }
      </Geographies>
    </ComposableMap>
  );
});

// ─── Home screen ──────────────────────────────────────────────────────────────
function HomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="home-screen">
      <div className="glow-orb glow-orb--purple" style={{ top: "15%", left: "20%" }} />
      <div className="glow-orb glow-orb--orange" style={{ bottom: "20%", right: "15%" }} />
      <Stars />
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
  );
}

// ─── Result screen ────────────────────────────────────────────────────────────
function ResultScreen({ score, onReplay }: { score: number; onReplay: () => void }) {
  const max = ROUNDS_PER_GAME * 100;
  const pct = (score / max) * 100;
  const cls = pct >= 80 ? "score-circle--win" : pct >= 50 ? "score-circle--neutral" : "score-circle--lose";
  return (
    <div className="home-screen">
      <Stars />
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
  );
}

// ─── Main game ────────────────────────────────────────────────────────────────
export default function FoodOriginGame() {
  const [phase, setPhase] = useState<Phase>("home");
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [clickedCode, setClickedCode] = useState<string | null>(null);
  const [clickedName, setClickedName] = useState<string | null>(null);
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [revealed, setRevealed] = useState(false);
  const [pointsEarned, setPointsEarned] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentDish = dishes[round] ?? null;

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const reveal = useCallback((alpha2: string | null, name: string | null) => {
    stopTimer();
    setClickedCode(alpha2);
    setClickedName(name);
    setRevealed(true);
    const pts = alpha2 && currentDish && alpha2 === currentDish.countryCode ? 100 : 0;
    setPointsEarned(pts);
    setScore(s => s + pts);
  }, [currentDish, stopTimer]);

  // Timer
  useEffect(() => {
    if (phase !== "playing" || revealed) return;
    setTimeLeft(ROUND_SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { reveal(null, null); return 0; }
        return t - 1;
      });
    }, 1000);
    return stopTimer;
  }, [phase, round, revealed, reveal, stopTimer]);

  function startGame() {
    const selected = pickDishes(ROUNDS_PER_GAME);
    setDishes(selected);
    setRound(0);
    setScore(0);
    setClickedCode(null);
    setClickedName(null);
    setRevealed(false);
    setPointsEarned(null);
    setPhase("playing");
  }

  function nextRound() {
    if (round + 1 >= ROUNDS_PER_GAME) {
      setPhase("result");
      return;
    }
    setRound(r => r + 1);
    setClickedCode(null);
    setClickedName(null);
    setRevealed(false);
    setPointsEarned(null);
  }

  function handleCountryClick(alpha2: string, name: string) {
    if (revealed) return;
    reveal(alpha2, name);
  }

  // ── Screens ─────────────────────────────────────────────────────────────────
  if (phase === "home") return <HomeScreen onStart={startGame} />;
  if (phase === "result") return <ResultScreen score={score} onReplay={() => setPhase("home")} />;
  if (!currentDish) return null;

  const isCorrect = clickedCode === currentDish.countryCode;

  return (
    <div className="fd-game-wrapper">
      <Stars />

      {/* ── Top bar ── */}
      <div className="fd-topbar">
        <div className="fd-topbar__round">Round {round + 1}/{ROUNDS_PER_GAME}</div>
        <div className="fd-topbar__score">⭐ {score} pts</div>
        <TimerRing seconds={timeLeft} total={ROUND_SECONDS} />
      </div>

      {/* ── Main layout ── */}
      <div className="fd-layout">

        {/* ── Dish panel ── */}
        <div className="fd-dish-panel">
          <DishPhoto dish={currentDish} />
          <div className="fd-dish-info">
            <div className="fd-dish-name">{currentDish.name}</div>
            <div className="fd-dish-hint">{currentDish.hint}</div>
          </div>

          {/* Reveal feedback */}
          {revealed && (
            <div className={`fd-feedback ${isCorrect ? "fd-feedback--correct" : "fd-feedback--wrong"}`}>
              {isCorrect ? (
                <>
                  <div className="fd-feedback__icon">✓</div>
                  <div className="fd-feedback__text">Correct! <strong>{currentDish.country}</strong></div>
                  <div className="fd-feedback__pts">+100 pts</div>
                </>
              ) : clickedCode ? (
                <>
                  <div className="fd-feedback__icon">✗</div>
                  <div className="fd-feedback__text">It was <strong>{currentDish.country}</strong></div>
                  <div className="fd-feedback__pts">+0 pts</div>
                </>
              ) : (
                <>
                  <div className="fd-feedback__icon">⏱</div>
                  <div className="fd-feedback__text">Time&apos;s up! It was <strong>{currentDish.country}</strong></div>
                  <div className="fd-feedback__pts">+0 pts</div>
                </>
              )}
              <button className="btn-next btn-hover-sm fd-next-btn" onClick={nextRound}>
                {round + 1 >= ROUNDS_PER_GAME ? "See Results →" : "Next Dish →"}
              </button>
            </div>
          )}
        </div>

        {/* ── Map ── */}
        <div className="fd-map-wrap">
          <div className="fd-map-container">
            <WorldMap
              correctCode={currentDish.countryCode}
              clickedCode={clickedCode}
              revealed={revealed}
              onCountryClick={handleCountryClick}
              onCountryHover={setHoveredName}
            />
          </div>
          {/* Hover tooltip */}
          <div className="fd-map-tooltip">
            {hoveredName ?? "Hover over a country"}
          </div>
        </div>
      </div>
    </div>
  );
}
