"use client";
import { memo, useState, useCallback, useEffect, useRef } from "react";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { seededShuffle } from "@/lib/seededRandom";
import { getPartykitHost, isMultiplayerEnabled } from "@/lib/partykitHost";
import { recordMatch, getRecord } from "@/lib/matchHistory";
import { useRatingSubmit } from "@/hooks/useRatingSubmit";
import MultiplayerScreen from "@/components/MultiplayerScreen";
import OpponentBar from "@/components/OpponentBar";
import NamePromptModal from "@/components/NamePromptModal";
import careerData from "@/app/career_data.json";
import { ensureCustomImages, getCustomImage } from "@/lib/customImages";

// ─── Club → Wikipedia page title (only when it differs from the display name) ──
const WIKI_CLUB: Record<string, string> = {
  "Ajax":                "AFC Ajax",
  "Monaco":              "AS Monaco FC",
  "AS Monaco":           "AS Monaco FC",
  "Chelsea":             "Chelsea F.C.",
  "Liverpool":           "Liverpool F.C.",
  "Arsenal":             "Arsenal F.C.",
  "Everton":             "Everton F.C.",
  "Southampton":         "Southampton F.C.",
  "Manchester United":   "Manchester United F.C.",
  "Manchester City":     "Manchester City F.C.",
  "Tottenham Hotspur":   "Tottenham Hotspur F.C.",
  "West Ham United":     "West Ham United F.C.",
  "Leeds United":        "Leeds United F.C.",
  "Queens Park Rangers": "Queens Park Rangers F.C.",
  "Fenerbahçe":          "Fenerbahçe S.K. (football)",
  "Galatasaray":         "Galatasaray S.K. (football)",
  "Santos":              "Santos FC",
  "São Paulo":           "São Paulo FC",
  "Cruzeiro":            "Cruzeiro Esporte Clube",
  "Grêmio":              "Grêmio Foot-Ball Porto Alegrense",
  "Palmeiras":           "Palmeiras",
  "Independiente":       "Club Atlético Independiente",
  "Anderlecht":          "R.S.C. Anderlecht",
  "Genk":                "K.R.C. Genk",
  "Basel":               "FC Basel",
  "Fiorentina":          "ACF Fiorentina",
  "Udinese":             "Udinese Calcio",
  "Mallorca":            "RCD Mallorca",
  "Guingamp":            "En Avant de Guingamp",
  "Schalke 04":          "FC Schalke 04",
  "Werder Bremen":       "SV Werder Bremen",
  "Molde":               "Molde FK",
  "Red Bull Salzburg":   "FC Red Bull Salzburg",
  "LAFC":                "Los Angeles FC",
  "Orlando City":        "Orlando City SC",
  "DC United":           "D.C. United",
  "Al-Nassr":            "Al-Nassr FC",
  "Al-Hilal":            "Al-Hilal FC",
  "Al-Sadd":             "Al-Sadd SC",
  "Anzhi Makhachkala":   "FC Anzhi Makhachkala",
  "Dinamo Zagreb":       "GNK Dinamo Zagreb",
  "Inter Milan":         "Inter Milan",
  "Juventus":            "Juventus FC",
  "Real Madrid":         "Real Madrid CF",
  "Bayern Munich":       "FC Bayern Munich",
  "Paris Saint-Germain": "Paris Saint-Germain F.C.",
  "Inter Miami":         "Inter Miami CF",
  "Borussia Dortmund":   "Borussia Dortmund",
  "Lech Poznań":         "Lech Poznań",
};

// ─── Types ──────────────────────────────────────────────────────────────────────
interface PlayerData { name: string; flag: string; flagCode: string; wiki?: string; clubs: string[]; image_url?: string; }
interface Round      { player: PlayerData; shuffledClubs: string[]; }
interface RoundResult {
  round: number; player: string;
  placed: string[]; correct: string[];
  correctCount: number; points: number;
}
type Screen = "home" | "game" | "result";
type Mode   = "solo" | "multi";

// ─── Constants ──────────────────────────────────────────────────────────────────
const TOTAL       = 5;
const MAX_PTS     = 100;
const MAX_TOTAL   = TOTAL * MAX_PTS;
const ANSWER_TIME = 20;
const NEXT_TIME   = 3;
const ALL_PLAYERS: PlayerData[] = careerData.players as PlayerData[];

// ─── Helpers ────────────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shuffleClubs(clubs: string[], seed?: number): string[] {
  const s = seed !== undefined ? seededShuffle([...clubs], seed) : shuffle([...clubs]);
  if (s.length > 1 && s.every((c, i) => c === clubs[i])) { [s[0], s[1]] = [s[1], s[0]]; }
  return s;
}

function computeScore(placed: string[], correct: string[]): { points: number; correctCount: number } {
  const correctCount = placed.reduce((n, c, i) => n + (c === correct[i] ? 1 : 0), 0);
  return { points: Math.round((correctCount / correct.length) * MAX_PTS), correctCount };
}

function gradeLabel(pts: number): string {
  const p = pts / MAX_TOTAL;
  if (p >= 0.9)  return "🌟 Legendary";
  if (p >= 0.75) return "🔥 Expert";
  if (p >= 0.55) return "👍 Solid";
  if (p >= 0.35) return "😅 Beginner";
  return "😬 Need more training";
}

function generateRounds(seed?: number): Round[] {
  const players = seed !== undefined
    ? seededShuffle([...ALL_PLAYERS], seed).slice(0, TOTAL)
    : shuffle([...ALL_PLAYERS]).slice(0, TOTAL);
  return players.map((player, i) => ({
    player,
    shuffledClubs: shuffleClubs(player.clubs, seed !== undefined ? seed + i + 1 : undefined),
  }));
}

// ─── Wikipedia image cache + hook (player photos only) ───────────────────────
const wikiImgCache = new Map<string, string>();

function useWikiImage(title: string | undefined, gameKey?: import("@/lib/customImages").GameKey, prefetchedUrl?: string | null): string | null {
  const [src, setSrc] = useState<string | null>(
    prefetchedUrl ??
    (gameKey && title ? getCustomImage(gameKey, title) : null) ??
    (title && wikiImgCache.has(title) ? wikiImgCache.get(title)! : null)
  );
  useEffect(() => {
    if (prefetchedUrl) { setSrc(prefetchedUrl); return; }
    if (!title) return;
    let cancelled = false;
    (async () => {
      await ensureCustomImages();
      if (cancelled) return;
      if (gameKey) {
        const custom = getCustomImage(gameKey, title);
        if (custom) { setSrc(custom); return; }
      }
      if (wikiImgCache.has(title)) { setSrc(wikiImgCache.get(title)!); return; }
      try {
        const data = await (await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=300&origin=*`
        )).json();
        if (cancelled) return;
        const pages = data?.query?.pages as Record<string, { thumbnail?: { source: string } }> | undefined;
        const page = Object.values(pages ?? {})[0];
        if (page?.thumbnail?.source) { wikiImgCache.set(title, page.thumbnail.source); setSrc(page.thumbnail.source); }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [title, gameKey, prefetchedUrl]);
  return src;
}

// ─── Wikipedia club badge: parse section 0 HTML, grab first img in .images ───
const wikiClubCache = new Map<string, string>();

function useClubLogo(club: string): string | null {
  const wikiTitle = WIKI_CLUB[club] ?? club;
  const prefetched = (careerData as { club_logos?: Record<string, string> }).club_logos?.[club] ?? null;
  const [src, setSrc] = useState<string | null>(
    prefetched ?? getCustomImage("career_clubs", club) ?? (wikiClubCache.get(wikiTitle) ?? null)
  );
  useEffect(() => {
    if (prefetched) { setSrc(prefetched); return; }
    let cancelled = false;
    (async () => {
      await ensureCustomImages();
      if (cancelled) return;
      const customUrl = getCustomImage("career_clubs", club);
      if (customUrl) { setSrc(customUrl); return; }
      const cached = wikiClubCache.get(wikiTitle);
      if (cached) { setSrc(cached); return; }
      try {
        const data = await (await fetch(
          `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(wikiTitle)}&prop=text&format=json&origin=*&section=0`
        )).json();
        if (cancelled) return;
        const html: string = data?.parse?.text?.["*"] ?? "";
        if (!html) return;
        const doc = new DOMParser().parseFromString(html, "text/html");
        // 1) Try specific infobox image cells (old & new template formats)
        // 2) Fallback: first img > 30px wide anywhere in the infobox (skips flag icons)
        let img = doc.querySelector(".images img, .infobox-image img") as HTMLImageElement | null;
        if (!img) {
          const all = Array.from(doc.querySelectorAll("table.infobox img, table.vcard img")) as HTMLImageElement[];
          img = all.find(i => parseInt(i.getAttribute("width") ?? "0") > 30) ?? null;
        }
        let imgSrc = img?.getAttribute("src") ?? "";
        if (imgSrc.startsWith("//")) imgSrc = "https:" + imgSrc;
        else if (imgSrc.startsWith("/")) imgSrc = "https://en.wikipedia.org" + imgSrc;
        if (!imgSrc) return;
        wikiClubCache.set(wikiTitle, imgSrc);
        setSrc(imgSrc);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [wikiTitle, club]);
  return src;
}

// ─── Stars ──────────────────────────────────────────────────────────────────────
const STARS = Array.from({ length: 80 }, (_, i) => ({
  id: i, x: Math.random() * 100, y: Math.random() * 100,
  size: Math.random() * 2 + 0.5, opacity: Math.random() * 0.6 + 0.1, delay: Math.random() * 4,
}));
const Stars = memo(function Stars() {
  return (
    <div className="stars-layer">
      {STARS.map(s => (
        <div key={s.id} className="star" style={{
          left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size,
          opacity: s.opacity, animation: `twinkle ${2 + s.delay}s ease-in-out infinite`,
          animationDelay: `${s.delay}s`,
        }} />
      ))}
    </div>
  );
});

// ─── ProgressBar ────────────────────────────────────────────────────────────────
function ProgressBar({ current, total, score }: { current: number; total: number; score: number }) {
  return (
    <div className="progress-bar">
      <div className="progress-bar__header">
        <span className="progress-bar__question">Round {current}/{total}</span>
        <div className="progress-bar__stat">
          <div className="progress-bar__stat-label">Points</div>
          <div className="progress-bar__stat-value" style={{ color: "#f0c040" }}>{score}</div>
        </div>
      </div>
      <div className="progress-bar__track">
        <div className="progress-bar__fill" style={{ width: `${(current / total) * 100}%` }} />
      </div>
    </div>
  );
}

// ─── AnswerTimer ────────────────────────────────────────────────────────────────
function AnswerTimer({ timeLeft, total }: { timeLeft: number; total: number }) {
  const urgent = timeLeft <= 5;
  return (
    <div className="answer-timer">
      <div className="answer-timer__header">
        <span className="answer-timer__label">Time to answer</span>
        <span className={`answer-timer__count answer-timer__count--${urgent ? "urgent" : "normal"}`}>{timeLeft}s</span>
      </div>
      <div className="answer-timer__track">
        <div className={`answer-timer__fill answer-timer__fill--${urgent ? "urgent" : "normal"}`}
          style={{ width: `${(timeLeft / total) * 100}%` }} />
      </div>
    </div>
  );
}

// ─── ClubLogoImg: logo + fallback initial ────────────────────────────────────────
function ClubLogoImg({ club, imgClass, placeholderClass }: {
  club: string; imgClass: string; placeholderClass: string;
}) {
  const logo = useClubLogo(club);
  if (logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logo} alt={club} className={imgClass} draggable={false} loading="lazy" />;
  }
  return <div className={placeholderClass}>{club[0]}</div>;
}

// ─── ClubChip: draggable pool item ───────────────────────────────────────────────
function ClubChip({ club, isDragging, onPointerDown }: {
  club: string;
  isDragging: boolean;
  onPointerDown: (e: React.MouseEvent | React.TouchEvent, el: HTMLElement) => void;
}) {
  return (
    <div
      className={`cr-chip ${isDragging ? "cr-chip--dragging" : ""}`}
      onMouseDown={e => { e.preventDefault(); onPointerDown(e, e.currentTarget); }}
      onTouchStart={e => { onPointerDown(e, e.currentTarget); }}
    >
      <div className="cr-chip-logo-wrap">
        <ClubLogoImg club={club} imgClass="cr-chip-logo" placeholderClass="cr-chip-logo-placeholder" />
      </div>
      <span className="cr-chip-label">{club}</span>
    </div>
  );
}

// ─── SortingGame ─────────────────────────────────────────────────────────────────
function SortingGame({
  round, submitted, placed, draggingClub, draggingFromSlot, dragOverSlot,
  slotRefs, onSlotDragStart,
}: {
  round: Round;
  submitted: boolean;
  placed: (string | null)[];
  draggingClub: string | null;
  draggingFromSlot: number | null;
  dragOverSlot: number | null;
  slotRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  onSlotDragStart: (club: string, slotIndex: number, e: React.MouseEvent | React.TouchEvent, el: HTMLElement) => void;
}) {
  const correct = round.player.clubs;
  const cols = placed.length <= 4 ? placed.length : 3;
  // During drag from slot, show that slot as empty
  const getDisplayedClub = (i: number) =>
    draggingFromSlot === i ? null : placed[i];

  return (
    <>
      {/* Numbered slots */}
      <div>
        <div className="cr-instruction">Drag clubs into chronological order</div>
        <div style={{ height: 8 }} />
        <div className="cr-slots" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {placed.map((_, i) => {
            const club = getDisplayedClub(i);
            const isOver = dragOverSlot === i;
            let cls = "cr-slot";
            if (submitted && club !== null) {
              cls += club === correct[i] ? " cr-slot--correct" : " cr-slot--wrong";
            } else if (club !== null) {
              cls += " cr-slot--filled";
            }
            if (!submitted && isOver) cls += " cr-slot--drag-over";

            return (
              <div
                key={i}
                className={cls}
                ref={el => { slotRefs.current[i] = el; }}
                onMouseDown={e => {
                  if (submitted || !club) return;
                  e.preventDefault();
                  onSlotDragStart(club, i, e, e.currentTarget);
                }}
                onTouchStart={e => {
                  if (submitted || !club) return;
                  onSlotDragStart(club, i, e, e.currentTarget);
                }}
              >
                <div className="cr-slot-num">{i + 1}</div>
                {club !== null ? (
                  <>
                    {submitted && (
                      <span className="cr-slot-verdict">{club === correct[i] ? "✓" : "✗"}</span>
                    )}
                    <div className="cr-slot-logo-wrap">
                      <ClubLogoImg club={club} imgClass="cr-slot-logo" placeholderClass="cr-slot-logo-placeholder" />
                    </div>
                    <span className="cr-slot-club">{club}</span>
                    {submitted && club !== correct[i] && (
                      <span className="cr-slot-correct-hint">→ {correct[i]}</span>
                    )}
                  </>
                ) : (
                  <span className="cr-slot-empty-hint">drop here</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pool — only shown while there are unplaced clubs */}
      {!submitted && placed.some(p => p === null) && (
        <div>
          <div className="cr-pool-label">Available clubs — drag to sort</div>
          <div style={{ height: 4 }} />
          <div className="cr-pool">
            {round.shuffledClubs
              .filter(c => !placed.includes(c) || (draggingFromSlot !== null && draggingClub === c && placed.includes(c) && placed[draggingFromSlot] === c))
              .filter(c => !(draggingClub === c && draggingFromSlot === null))
              .map(club => (
                <ClubChip
                  key={club}
                  club={club}
                  isDragging={false}
                  onPointerDown={(e, el) => {
                    if (e.type === "mousedown") {
                      (e as React.MouseEvent).preventDefault();
                      onSlotDragStart(club, -1, e, el); // -1 = from pool
                    } else {
                      onSlotDragStart(club, -1, e, el);
                    }
                  }}
                />
              ))}
          </div>
        </div>
      )}
    </>
  );
}

// ─── PlayerCard ─────────────────────────────────────────────────────────────────
function PlayerCard({ player }: { player: PlayerData }) {
  const imgSrc = useWikiImage(player.wiki, "career_players", player.image_url);
  return (
    <div className="cr-player-card">
      {imgSrc
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={imgSrc} alt={player.name} className="cr-player-img" draggable={false} />
        : <div className="cr-player-img" />
      }
      <div className="cr-player-info">
        <div className="cr-player-name">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://flagcdn.com/w40/${player.flagCode}.png`} alt="" className="cr-player-flag" draggable={false} />
          {player.name}
        </div>
        <span className="cr-club-count">{player.clubs.length} clubs</span>
      </div>
    </div>
  );
}

// ─── ResultCard ─────────────────────────────────────────────────────────────────
function ResultCard({ entry }: { entry: RoundResult }) {
  const pct   = entry.points / MAX_PTS;
  const color = pct >= 1 ? "#00ffa0" : pct >= 0.5 ? "#f0c040" : "#ff6b6b";
  return (
    <div className="cr-result-card">
      <div className="cr-result-card__info">
        <div className="cr-result-card__player">{entry.player}</div>
        <div className="cr-result-card__clubs">
          {entry.correct.map((club, i) => {
            const ok = entry.placed[i] === club;
            return (
              <span key={i} style={{ color: ok ? "#00ffa0" : "#ff6b6b" }}>
                {i + 1}. {club}{i < entry.correct.length - 1 ? "  ·  " : ""}
              </span>
            );
          })}
        </div>
      </div>
      <div className="cr-result-card__score">
        <div className="cr-result-card__pts" style={{ color }}>{entry.points}</div>
        <div className="cr-result-card__pts-label">pts</div>
      </div>
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────────
export default function CareerQuiz() {
  const [screen, setScreen]         = useState<Screen>("home");
  const [mode, setMode]             = useState<Mode>("solo");
  const [rounds, setRounds]         = useState<Round[]>([]);
  const [qNum, setQNum]             = useState(1);
  const [placed, setPlaced]         = useState<(string | null)[]>([]);
  const [submitted, setSubmitted]   = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [results, setResults]       = useState<RoundResult[]>([]);
  const [roundOver, setRoundOver]   = useState(false);
  const [multiWaiting, setMultiWaiting]     = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [answerTimeLeft, setAnswerTimeLeft] = useState<number | null>(null);
  const [nextCountdown, setNextCountdown]   = useState<number | null>(null);

  // Drag state
  const [draggingClub, setDraggingClub]         = useState<string | null>(null);
  const [draggingFromSlot, setDraggingFromSlot] = useState<number | null>(null); // -1 = pool
  const [dragOverSlot, setDragOverSlot]         = useState<number | null>(null);

  // Refs
  const roundsRef         = useRef<Round[]>([]);
  const placedRef         = useRef<(string | null)[]>([]);
  const submittedRef      = useRef(false);
  const qNumRef           = useRef(1);
  const slotRefs          = useRef<(HTMLDivElement | null)[]>([]);
  const ghostRef          = useRef<HTMLElement | null>(null);
  const answerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answerTimeoutRef  = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const nextIntervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextTimeoutRef    = useRef<ReturnType<typeof setTimeout>  | null>(null);

  const currentRound = rounds[qNum - 1] ?? null;
  const isLastRound  = qNum >= TOTAL;
  const allPlaced    = placed.length > 0 && placed.every(c => c !== null);
  const canClickNext = mode === "solo" ? submitted : roundOver && !multiWaiting;

  placedRef.current    = placed;
  submittedRef.current = submitted;
  qNumRef.current      = qNum;

  // ── Drag and drop ────────────────────────────────────────────────────────────
  function getSlotAtPoint(x: number, y: number): number | null {
    for (let i = 0; i < slotRefs.current.length; i++) {
      const el = slotRefs.current[i];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return i;
    }
    return null;
  }

  const startDrag = useCallback((
    club: string,
    fromSlot: number,           // -1 = from pool, ≥0 = from slot index
    clientX: number,
    clientY: number,
    sourceEl: HTMLElement,
  ) => {
    if (submittedRef.current) return;

    // Clone source element as ghost
    const ghost = sourceEl.cloneNode(true) as HTMLElement;
    const w = sourceEl.offsetWidth;
    const h = sourceEl.offsetHeight;
    ghost.className = (ghost.className ?? "") + " cr-drag-ghost";
    Object.assign(ghost.style, {
      width: `${w}px`, height: `${h}px`,
      left: `${clientX - w / 2}px`, top: `${clientY - h / 2}px`,
    });
    document.body.appendChild(ghost);
    ghostRef.current = ghost;

    setDraggingClub(club);
    setDraggingFromSlot(fromSlot);
    setDragOverSlot(null);

    let lastOver: number | null = null;
    let done = false;

    const onMove = (cx: number, cy: number) => {
      if (ghostRef.current) {
        ghostRef.current.style.left = `${cx - w / 2}px`;
        ghostRef.current.style.top  = `${cy - h / 2}px`;
      }
      const slot = getSlotAtPoint(cx, cy);
      if (slot !== lastOver) { lastOver = slot; setDragOverSlot(slot); }
    };

    const onEnd = (cx: number, cy: number) => {
      if (done) return;
      done = true;
      ghostRef.current?.remove();
      ghostRef.current = null;

      const targetSlot = getSlotAtPoint(cx, cy);

      setPlaced(prev => {
        const next = [...prev];
        if (targetSlot !== null) {
          const displaced = next[targetSlot];
          next[targetSlot] = club;
          if (fromSlot >= 0) next[fromSlot] = displaced ?? null; // slot↔slot swap
          // pool→slot: displaced goes back to pool (removed from `next`)
        } else {
          if (fromSlot >= 0) next[fromSlot] = null; // dragged out of slot → pool
        }
        return next;
      });

      setDraggingClub(null);
      setDraggingFromSlot(null);
      setDragOverSlot(null);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend",  onTouchEnd);
    };

    const onMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const onMouseUp   = (e: MouseEvent) => onEnd(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); };
    const onTouchEnd  = (e: TouchEvent) => onEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend",  onTouchEnd);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup ghost on unmount
  useEffect(() => () => { ghostRef.current?.remove(); }, []);

  // ── Submit helper ─────────────────────────────────────────────────────────────
  const doSubmit = useCallback((currentPlaced: (string | null)[], round: Round) => {
    if (submittedRef.current) return 0;
    const filled = [...currentPlaced];
    const remaining = round.shuffledClubs.filter(c => !filled.includes(c));
    let ri = 0;
    for (let i = 0; i < filled.length; i++) { if (filled[i] === null) filled[i] = remaining[ri++] ?? null; }
    const finalPlaced = filled as string[];
    const { points, correctCount } = computeScore(finalPlaced, round.player.clubs);
    submittedRef.current = true;
    setSubmitted(true);
    setPlaced(finalPlaced); placedRef.current = finalPlaced;
    setTotalScore(s => s + points);
    setResults(prev => [...prev, {
      round: qNumRef.current, player: round.player.name,
      placed: finalPlaced, correct: round.player.clubs, correctCount, points,
    }]);
    return points;
  }, []);

  // ── Reset round ──────────────────────────────────────────────────────────────
  const resetRound = useCallback((length: number) => {
    const empty = Array<null>(length).fill(null);
    setPlaced(empty); placedRef.current = empty;
    setSubmitted(false); submittedRef.current = false;
    setRoundOver(false); setMultiWaiting(false);
  }, []);

  const clearTimers = useCallback(() => {
    clearInterval(answerIntervalRef.current!); clearTimeout(answerTimeoutRef.current!);
    answerIntervalRef.current = null; answerTimeoutRef.current = null;
    setAnswerTimeLeft(null);
  }, []);

  // ── Multiplayer callbacks ─────────────────────────────────────────────────────
  const onMpGameStart = useCallback((seed: number) => {
    const newRounds = generateRounds(seed);
    roundsRef.current = newRounds;
    setRounds(newRounds);
    setQNum(1); qNumRef.current = 1;
    setTotalScore(0); setResults([]);
    resetRound(newRounds[0].player.clubs.length);
    setScreen("game");
  }, [resetRound]);

  const onMpRoundEnd  = useCallback(() => setRoundOver(true), []);

  const onMpNextRound = useCallback((round: number) => {
    const nextRound = roundsRef.current[round];
    if (!nextRound) return;
    setQNum(round + 1); qNumRef.current = round + 1;
    resetRound(nextRound.player.clubs.length);
  }, [resetRound]);

  const onMpGameEnd = useCallback(() => setScreen("result"), []);

  const mp = useMultiplayer({
    gameType: "career",
    host: getPartykitHost(),
    onGameStart:        onMpGameStart,
    onOpponentAnswered: useCallback(() => {}, []),
    onRoundEnd:         onMpRoundEnd,
    onNextRound:        onMpNextRound,
    onGameEnd:          onMpGameEnd,
  });

  const { submitRating, ratingResult } = useRatingSubmit("career");

  // Record match outcome + ELO rating
  useEffect(() => {
    if (screen !== "result" || mode !== "multi" || !mp.opponent) return;
    recordMatch(mp.opponent.name, totalScore > mp.opponent.score ? "win" : totalScore < mp.opponent.score ? "loss" : "tie");
    submitRating(totalScore, mp.opponent.score);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // ── Answer timer (multi) ──────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== "multi" || screen !== "game") return;
    let timeLeft = ANSWER_TIME;
    setAnswerTimeLeft(timeLeft);
    answerIntervalRef.current = setInterval(() => { timeLeft--; setAnswerTimeLeft(timeLeft); }, 1000);
    answerTimeoutRef.current  = setTimeout(() => {
      clearInterval(answerIntervalRef.current!);
      answerIntervalRef.current = null;
      setAnswerTimeLeft(0);
      const round = roundsRef.current[qNumRef.current - 1];
      if (!round || submittedRef.current) return;
      const pts = doSubmit(placedRef.current, round);
      mp.submitAnswer(0, pts);
    }, ANSWER_TIME * 1000);
    return () => {
      clearInterval(answerIntervalRef.current!); clearTimeout(answerTimeoutRef.current!);
      answerIntervalRef.current = null; answerTimeoutRef.current = null;
      setAnswerTimeLeft(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, screen, qNum]);

  // ── Next-round countdown (multi) ─────────────────────────────────────────────
  useEffect(() => {
    if (!roundOver || mode !== "multi") return;
    let countdown = NEXT_TIME;
    setNextCountdown(countdown);
    nextIntervalRef.current = setInterval(() => { countdown--; setNextCountdown(countdown); }, 1000);
    nextTimeoutRef.current  = setTimeout(() => {
      clearInterval(nextIntervalRef.current!); nextIntervalRef.current = null;
      setNextCountdown(null);
      setMultiWaiting(prev => { if (!prev) mp.readyForNext(); return true; });
    }, NEXT_TIME * 1000);
    return () => {
      clearInterval(nextIntervalRef.current!); clearTimeout(nextTimeoutRef.current!);
      nextIntervalRef.current = null; nextTimeoutRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundOver]);

  // ── Init placed array on round change ────────────────────────────────────────
  useEffect(() => {
    if (currentRound && screen === "game") {
      const empty = Array<null>(currentRound.player.clubs.length).fill(null);
      setPlaced(empty); placedRef.current = empty;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qNum, screen]);

  // ── Game actions ─────────────────────────────────────────────────────────────
  const startSolo = useCallback(() => {
    setMode("solo");
    const newRounds = generateRounds();
    roundsRef.current = newRounds;
    setRounds(newRounds);
    setQNum(1); qNumRef.current = 1;
    setTotalScore(0); setResults([]);
    resetRound(newRounds[0].player.clubs.length);
    setScreen("game");
  }, [resetRound]);

  const startMulti    = () => { mp.disconnect(); setMode("multi"); setShowNamePrompt(true); };
  const handleNewOpp  = () => { mp.disconnect(); setMode("multi"); setScreen("home"); setShowNamePrompt(true); };
  const handleMenu    = () => { mp.disconnect(); setMode("solo");  setScreen("home"); };

  const handleSubmit = () => {
    if (submitted || !currentRound || !allPlaced) return;
    clearTimers();
    const pts = doSubmit(placedRef.current, currentRound);
    if (mode === "multi") mp.submitAnswer(0, pts);
  };

  const handleNext = () => {
    if (mode === "multi") {
      clearInterval(nextIntervalRef.current!); clearTimeout(nextTimeoutRef.current!);
      nextIntervalRef.current = null; nextTimeoutRef.current = null;
      setNextCountdown(null); setMultiWaiting(true); mp.readyForNext();
      return;
    }
    if (isLastRound) { setScreen("result"); return; }
    const nextQ = qNum + 1;
    setQNum(nextQ); qNumRef.current = nextQ;
    resetRound(rounds[nextQ - 1]?.player.clubs.length ?? 0);
  };

  const handleSlotDragStart = (club: string, fromSlot: number, e: React.MouseEvent | React.TouchEvent, el: HTMLElement) => {
    const { clientX, clientY } = e.type.startsWith("touch")
      ? (e as React.TouchEvent).touches[0]
      : (e as React.MouseEvent);
    startDrag(club, fromSlot, clientX, clientY, el);
  };

  // ── Result helpers ────────────────────────────────────────────────────────────
  const pct           = totalScore / MAX_TOTAL;
  const scoreBarGrade = pct >= 0.75 ? "excellent" : pct >= 0.5 ? "good" : "poor";
  const myCircleClass = mode === "multi" && mp.opponent
    ? totalScore > mp.opponent.score ? "score-circle--win" : "score-circle--neutral" : "score-circle--solo";
  const oppCircleClass = mode === "multi" && mp.opponent
    ? mp.opponent.score > totalScore ? "score-circle--win" : "score-circle--lose" : "";
  const myValueColor  = mode === "multi" && mp.opponent
    ? totalScore > mp.opponent.score ? "score-circle__value--green" : "score-circle__value--gold"
    : "score-circle__value--gold";
  const oppValueColor = mode === "multi" && mp.opponent
    ? mp.opponent.score > totalScore ? "score-circle__value--green" : "score-circle__value--red" : "";
  const feedbackIsWaiting = mode === "multi" && submitted && (!roundOver || multiWaiting);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      {showNamePrompt && (
        <NamePromptModal
          onConfirm={name => { setShowNamePrompt(false); mp.joinQueue(name); }}
          onCancel={() => { setShowNamePrompt(false); setMode("solo"); }}
        />
      )}
      <MultiplayerScreen
        status={mp.status}
        onCancel={() => { mp.leaveQueue(); setMode("solo"); setScreen("home"); }}
        onContinueSolo={() => { mp.disconnect(); setMode("solo"); setMultiWaiting(false); }}
      />

      <div className="game-wrapper theme-sport">
        <Stars />
        <div className="glow-orb glow-orb--purple" />
        <div className="glow-orb glow-orb--orange" />

        {/* ── HOME ───────────────────────────────────────────────────────────── */}
        {screen === "home" && (
          <div className="home-screen">
            <div className="home-emoji">🔀</div>
            <div className="home-title">Career<span className="accent">Order</span></div>
            <p className="home-subtitle">Drag club badges into chronological order</p>

            <div className="how-it-works">
              <div className="how-it-works__title">How it works</div>
              {[
                ["👤", "A player is shown with their career clubs"],
                ["🔀", "Badges are shuffled — drag them into order"],
                ["🎯", "Each correctly placed club scores points"],
                ["🏆", "5 rounds · max 500 pts"],
              ].map(([icon, text]) => (
                <div key={text as string} className="how-it-works__item">
                  <span className="how-it-works__icon">{icon as string}</span>
                  <span className="how-it-works__text">{text as string}</span>
                </div>
              ))}
            </div>

            <div className="home-buttons">
              <button onClick={startSolo}  className="btn-primary btn-hover">Play Solo</button>
              {isMultiplayerEnabled() && <button onClick={startMulti} className="btn-outline btn-hover">⚡ Multiplayer</button>}
            </div>
          </div>
        )}

        {/* ── GAME ───────────────────────────────────────────────────────────── */}
        {screen === "game" && currentRound && (
          <div className="cr-container">
            {mode === "multi" && mp.opponent && (
              <OpponentBar opponent={mp.opponent} myScore={totalScore} maxScore={MAX_TOTAL} />
            )}
            <ProgressBar current={qNum} total={TOTAL} score={totalScore} />
            {mode === "multi" && answerTimeLeft !== null && !submitted && (
              <AnswerTimer timeLeft={answerTimeLeft} total={ANSWER_TIME} />
            )}

            <PlayerCard player={currentRound.player} />

            <SortingGame
              round={currentRound}
              submitted={submitted}
              placed={placed}
              draggingClub={draggingClub}
              draggingFromSlot={draggingFromSlot}
              dragOverSlot={dragOverSlot}
              slotRefs={slotRefs}
              onSlotDragStart={handleSlotDragStart}
            />

            {/* Submit */}
            {!submitted && (
              <div className="cr-submit-row">
                <button
                  onClick={handleSubmit}
                  disabled={!allPlaced}
                  className="btn-submit btn-hover-sm"
                  style={{ opacity: allPlaced ? 1 : 0.38 }}
                >
                  {allPlaced
                    ? "Submit →"
                    : `${placed.filter(c => c === null).length} club${placed.filter(c => c === null).length > 1 ? "s" : ""} left`}
                </button>
              </div>
            )}

            {/* Feedback after submit */}
            {submitted && (() => {
              const last = results[results.length - 1];
              if (!last) return null;
              const color = last.points === MAX_PTS ? "#00ffa0" : last.points >= 50 ? "#f0c040" : "#ff6b6b";
              return (
                <div className="cr-feedback-row">
                  <div>
                    <div className="cr-feedback-score" style={{ color }}>+{last.points} pts</div>
                    <div className="cr-feedback-detail">
                      {last.correctCount}/{last.correct.length} clubs in the right position
                    </div>
                  </div>
                  {feedbackIsWaiting && (
                    <div className="cr-waiting-badge"><span className="waiting-dot" />Waiting…</div>
                  )}
                  {canClickNext && (
                    <button onClick={handleNext} className="cr-feedback-btn">
                      {isLastRound ? "Results →" : nextCountdown !== null ? `Next (${nextCountdown}s)` : "Next →"}
                    </button>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* ── RESULT ─────────────────────────────────────────────────────────── */}
        {screen === "result" && (
          <div className="citymix-result-screen">
            <div className="result-emoji--pop">{pct >= 0.75 ? "🏆" : pct >= 0.5 ? "⚽" : "😅"}</div>
            <h1 className="result-title--pop">{mode === "multi" ? "Results" : "Final Score"}</h1>

            {mode === "multi" && mp.opponent ? (
              <div className="score-circles">
                <div className={`score-circle score-circle--md ${myCircleClass}`}>
                  <div className="score-circle__label">You</div>
                  <div className={`score-circle__value score-circle__value--md ${myValueColor}`}>{totalScore}</div>
                  <div className="score-circle__total score-circle__total--md">/ {MAX_TOTAL}</div>
                </div>
                <div className={`score-circle score-circle--md ${oppCircleClass}`}>
                  <div className="score-circle__label">Opp.</div>
                  <div className={`score-circle__value score-circle__value--md ${oppValueColor}`}>{mp.opponent.score}</div>
                  <div className="score-circle__total score-circle__total--md">/ {MAX_TOTAL}</div>
                </div>
              </div>
            ) : (
              <div className="score-circle score-circle--md score-circle--solo" style={{ margin: "20px auto" }}>
                <div className="score-circle__value score-circle__value--md score-circle__value--gold">{totalScore}</div>
                <div className="score-circle__total score-circle__total--md">/ {MAX_TOTAL}</div>
              </div>
            )}

            <div className="result-grade--pop">
              {mode === "multi" && mp.opponent
                ? totalScore > mp.opponent.score ? "🏆 You won!" : totalScore < mp.opponent.score ? "😅 You lost…" : "🤝 It's a tie!"
                : gradeLabel(totalScore)}
            </div>

            {mode === "multi" && ratingResult && (
              <div className="rating-delta">
                <span className={`rating-delta__pts ${ratingResult.won ? "rating-delta__pts--pos" : "rating-delta__pts--neg"}`}>
                  {ratingResult.won ? "+" : ""}{ratingResult.pointsDelta} pts
                </span>
                <span className="rating-delta__rank">{ratingResult.rank.emoji} {ratingResult.rank.name} · {ratingResult.newPoints.toLocaleString()} pts total</span>
              </div>
            )}

            {mode === "solo" && (
              <div className="result-score-bar result-score-bar--popguessr">
                <div className={`result-score-bar__fill result-score-bar__fill--${scoreBarGrade}`} style={{ width: `${pct * 100}%` }} />
              </div>
            )}

            <div className="round-breakdown">
              <div className="round-breakdown__header">Round Breakdown</div>
              <div className="round-breakdown__list">
                {results.map((entry, i) => <ResultCard key={i} entry={entry} />)}
              </div>
            </div>

            {mode === "multi" && mp.opponent && (
              <div className="rematch-zone">
                {(() => {
                  const rec = getRecord(mp.opponent.name);
                  if (!rec) return null;
                  return (
                    <div className="rematch-record">
                      vs <span className="rematch-record__name">{mp.opponent.name}</span>:{" "}
                      <span className="rematch-record__win">{rec.wins}W</span>{" "}
                      <span className="rematch-record__loss">{rec.losses}L</span>{" "}
                      <span className="rematch-record__tie">{rec.ties}T</span>
                    </div>
                  );
                })()}
                {mp.opponent.wantsRematch && !mp.myWantsRematch && (
                  <div className="rematch-notice">⚡ Opponent wants a rematch!</div>
                )}
                {mp.myWantsRematch
                  ? <div className="waiting-indicator"><span className="waiting-dot" />Waiting for opponent…</div>
                  : <button onClick={mp.requestRematch} className="btn-rematch btn-hover">⚡ Rematch</button>
                }
              </div>
            )}

            {mode === "multi" && mp.opponent ? (
              <div className="result-buttons--pop">
                <button onClick={handleNewOpp} className="btn-result-outline btn-hover-sm">🔄 New Opponent</button>
                <button onClick={handleMenu}   className="btn-result-ghost  btn-hover-sm">← Menu</button>
              </div>
            ) : (
              <div className="result-buttons--pop">
                <button onClick={startSolo}  className="btn-result-primary btn-hover-sm">Play Again</button>
                {isMultiplayerEnabled() && <button onClick={startMulti} className="btn-result-outline btn-hover-sm">⚡ Multiplayer</button>}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
