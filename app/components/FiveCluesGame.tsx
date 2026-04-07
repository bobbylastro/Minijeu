"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { getPartykitHost } from "@/lib/partykitHost";
import { recordMatch } from "@/lib/matchHistory";
import { useRatingSubmit } from "@/hooks/useRatingSubmit";
import MultiplayerScreen from "@/components/MultiplayerScreen";
import OpponentBar from "@/components/OpponentBar";
import MultiplayerEntryModal from "@/components/MultiplayerEntryModal";
import LeaderboardOverlay from "@/components/LeaderboardOverlay";
import RematchZone from "@/components/RematchZone";
import rawData from "@/app/five-clues-data.json";
import "@/app/five-clues/five-clues.css";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Subject {
  id: string;
  name: string;
  category: string;
  accepted: string[];
  clues: string[];
}

const ALL_SUBJECTS = rawData as Subject[];

// ─── Fuzzy matching ───────────────────────────────────────────────────────────
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/[^a-z0-9 ]/g, "");
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp: number[] = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0]; dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[b.length];
}

function checkAnswer(input: string, accepted: string[]): boolean {
  const norm = normalize(input);
  if (norm.length < 2) return false;
  for (const ans of accepted) {
    const normAns = normalize(ans);
    if (norm === normAns) return true;
    if (normAns.length <= 3) continue; // short aliases (mj, cr7): exact only
    const threshold = Math.max(1, Math.min(Math.floor(normAns.length / 5), 3));
    if (levenshtein(norm, normAns) <= threshold) return true;
  }
  return false;
}

// ─── Seeded shuffle ──────────────────────────────────────────────────────────
function pickSubjects(seed: number, count = 10): Subject[] {
  let s = seed >>> 0;
  const rng = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 0x100000000; };
  const arr = [...ALL_SUBJECTS];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, count);
}

// ─── Constants ───────────────────────────────────────────────────────────────
const CLUE_POINTS = [500, 400, 300, 200, 100];
const MAX_ATTEMPTS = 3;
const TOTAL_ROUNDS = 10;

const CATEGORY_ICON: Record<string, string> = {
  sport: "🏆", music: "🎵", film: "🎬",
  history: "📜", business: "💼", politics: "🌍",
};

// ─── Stars background ────────────────────────────────────────────────────────
const STAR_DATA = Array.from({ length: 50 }, (_, i) => ({
  left: ((i * 37 + 13) % 100).toFixed(1),
  top:  ((i * 53 + 7)  % 100).toFixed(1),
  delay:    ((i * 0.13) % 3).toFixed(2),
  duration: (2 + (i * 0.17) % 3).toFixed(2),
}));

function Stars() {
  return (
    <div className="stars-layer" aria-hidden>
      {STAR_DATA.map((s, i) => (
        <div key={i} className="star" style={{
          left: `${s.left}%`, top: `${s.top}%`,
          animationDelay: `${s.delay}s`, animationDuration: `${s.duration}s`,
        }} />
      ))}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function FiveCluesGame() {
  const HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999";
  const { submitRating } = useRatingSubmit("five-clues");

  const [screen, setScreen]     = useState<"home" | "playing" | "result">("home");
  const [mode, setMode]         = useState<"solo" | "multi">("solo");
  const [showNamePrompt, setShowNamePrompt] = useState(false);

  // Game state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [round, setRound]       = useState(0);
  const [currentClue, setCurrentClue]   = useState(1);
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [inputValue, setInputValue]     = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [answered, setAnswered] = useState(false);
  const [pointsThisRound, setPointsThisRound] = useState(0);
  const [totalScore, setTotalScore]   = useState(0);
  const [roundScores, setRoundScores] = useState<number[]>([]);

  // Multiplayer round state
  const [multiSubmitted, setMultiSubmitted] = useState(false);
  const [multiRoundResult, setMultiRoundResult] = useState<{ myPts: number; oppPts: number } | null>(null);
  const [finalScores, setFinalScores] = useState<Record<string, number>>({});

  const inputRef     = useRef<HTMLInputElement>(null);
  const subjectsRef  = useRef<Subject[]>([]);
  const totalScoreRef = useRef(0);

  // ── Multiplayer ──────────────────────────────────────────────────────────
  const mp = useMultiplayer({
    gameType: "five-clues",
    host: HOST,
    onGameStart(seed) { initGame(seed); },
    onOpponentAnswered() { /* opponent bar updates via mp.opponent.hasAnswered */ },
    onRoundEnd(_, roundPoints) {
      const myPts  = mp.myId      ? (roundPoints[mp.myId]      ?? 0) : 0;
      const oppPts = mp.opponent  ? (roundPoints[mp.opponent.id] ?? 0) : 0;
      setMultiRoundResult({ myPts, oppPts });
      setRoundScores(prev => [...prev, myPts]);
      setTotalScore(prev => { totalScoreRef.current = prev + myPts; return prev + myPts; });
    },
    onNextRound(roundNum) { beginRound(roundNum - 1); },
    onGameEnd(scores) {
      setFinalScores(scores);
      if (mp.opponent && mp.myId) {
        const myFinal  = scores[mp.myId]       ?? 0;
        const oppFinal = scores[mp.opponent.id] ?? 0;
        recordMatch(mp.opponent.name, myFinal > oppFinal ? "win" : myFinal < oppFinal ? "loss" : "tie");
        submitRating(myFinal, oppFinal);
      }
      setScreen("result");
    },
    onGameSync(roundNum, seed, myScore) {
      const picked = pickSubjects(seed, TOTAL_ROUNDS);
      subjectsRef.current = picked;
      setSubjects(picked);
      setTotalScore(myScore);
      totalScoreRef.current = myScore;
      beginRound(roundNum - 1);
    },
  });

  function initGame(seed: number) {
    const picked = pickSubjects(seed, TOTAL_ROUNDS);
    subjectsRef.current = picked;
    setSubjects(picked);
    setTotalScore(0);
    totalScoreRef.current = 0;
    setRoundScores([]);
    setFinalScores({});
    beginRound(0);
    setScreen("playing");
  }

  function beginRound(idx: number) {
    setRound(idx);
    setCurrentClue(1);
    setAttemptsLeft(MAX_ATTEMPTS);
    setInputValue("");
    setFeedback(null);
    setAnswered(false);
    setMultiSubmitted(false);
    setMultiRoundResult(null);
    setPointsThisRound(0);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  // Auto-reveal all clues when answer is shown (out of attempts)
  useEffect(() => {
    if (answered && pointsThisRound === 0) setCurrentClue(5);
  }, [answered, pointsThisRound]);

  // ── Game actions ──────────────────────────────────────────────────────────
  function handleSubmit() {
    if (answered || (mode === "multi" && multiSubmitted)) return;
    if (!inputValue.trim()) return;
    const subject = subjectsRef.current[round];
    if (!subject) return;

    if (checkAnswer(inputValue, subject.accepted)) {
      const pts = CLUE_POINTS[currentClue - 1] ?? 0;
      setPointsThisRound(pts);
      setAnswered(true);
      setFeedback("correct");
      if (mode === "solo") {
        setTotalScore(t => t + pts);
        setRoundScores(prev => [...prev, pts]);
      } else {
        mp.submitAnswer(inputValue, pts);
        setMultiSubmitted(true);
      }
    } else {
      const next = attemptsLeft - 1;
      setAttemptsLeft(next);
      setFeedback("wrong");
      if (next === 0) setTimeout(() => handleReveal(), 700);
    }
  }

  const handleReveal = useCallback(() => {
    setAnswered(true);
    setFeedback(null);
    setPointsThisRound(0);
    if (mode === "multi" && !multiSubmitted) {
      mp.submitAnswer("", 0);
      setMultiSubmitted(true);
    } else if (mode === "solo") {
      setRoundScores(prev => [...prev, 0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, multiSubmitted]);

  function handleNextClue() {
    if (currentClue >= 5) return;
    setCurrentClue(c => c + 1);
    setFeedback(null);
    setInputValue("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleNextRound() {
    if (mode === "solo") {
      if (round + 1 >= TOTAL_ROUNDS) setScreen("result");
      else beginRound(round + 1);
    } else {
      mp.readyForNext();
    }
  }

  function startSolo() {
    setMode("solo");
    initGame(Math.floor(Math.random() * 1_000_000));
  }

  function backToHome() {
    mp.disconnect();
    setScreen("home");
    setMode("solo");
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const subject    = subjectsRef.current[round];
  const isWaiting  = mode === "multi" && multiSubmitted && !multiRoundResult;
  const canGuess   = !answered && !(mode === "multi" && multiSubmitted);
  const canNextClue = canGuess && currentClue < 5;

  // ── Result screen ─────────────────────────────────────────────────────────
  if (screen === "result") {
    const myFinal  = mode === "multi" && mp.myId ? (finalScores[mp.myId] ?? totalScore) : totalScore;
    const oppFinal = mode === "multi" && mp.opponent ? (finalScores[mp.opponent.id] ?? 0) : 0;
    const found    = roundScores.filter(s => s > 0).length;
    const pct      = Math.round((myFinal / (TOTAL_ROUNDS * 500)) * 100);
    return (
      <div className="game-wrapper">
        <Stars />
        <div className="glow-orb glow-orb--purple" />
        <div className="glow-orb glow-orb--orange" />
        <div className="fc-result">
          <div className="fc-result__title">Game Over!</div>
          <div className="fc-result__score">
            {myFinal}<span className="fc-result__max">/{TOTAL_ROUNDS * 500}</span>
          </div>
          <div className="fc-result__found">{found}/{TOTAL_ROUNDS} identified</div>

          {mode === "multi" && mp.opponent && (
            <div className="fc-result__vs">
              <div className={`fc-result__vs-score ${myFinal >= oppFinal ? "fc-result__vs-score--win" : "fc-result__vs-score--loss"}`}>
                {myFinal > oppFinal ? "You win! 🏆" : myFinal < oppFinal ? "You lose 😢" : "It's a tie! 🤝"}
              </div>
              <div className="fc-result__vs-detail">
                You: {myFinal} pts · {mp.opponent.name}: {oppFinal} pts
              </div>
            </div>
          )}

          <div className="result-score-bar" style={{ width: "100%" }}>
            <div className={`result-score-bar__fill ${pct >= 70 ? "result-score-bar__fill--excellent" : pct >= 40 ? "result-score-bar__fill--good" : "result-score-bar__fill--poor"}`}
              style={{ width: `${pct}%` }} />
          </div>

          {mode === "multi" && mp.opponent && (
            <RematchZone
              opponent={mp.opponent}
              myWantsRematch={mp.myWantsRematch}
              series={mp.series}
              onRematch={mp.requestRematch}
            />
          )}
          <button onClick={backToHome} className="btn-outline btn-hover">Back to Menu</button>
        </div>
        {mp.finalLeaderboard && (
          <LeaderboardOverlay
            leaderboard={mp.finalLeaderboard}
            onClose={() => { mp.disconnect(); backToHome(); }}
          />
        )}
      </div>
    );
  }

  // ── Playing screen ────────────────────────────────────────────────────────
  if (screen === "playing" && subject) {
    return (
      <>
        {showNamePrompt && (
          <MultiplayerEntryModal
            gameType="five-clues"
            host={getPartykitHost()}
            onQuickMatch={name => { setShowNamePrompt(false); mp.joinQueue(name); }}
            onLobbyStart={(payload, myName) => {
              setShowNamePrompt(false);
              mp.joinFromLobby(payload.gameId, payload.seed, myName, payload.totalPlayers, payload.playerNames);
            }}
            onCancel={() => { setShowNamePrompt(false); setMode("solo"); }}
          />
        )}
        <MultiplayerScreen
          status={mp.status}
          botCountdown={mp.botCountdown}
          onCancel={() => { mp.leaveQueue(); setMode("solo"); setScreen("home"); }}
          onPlayBot={mp.playVsBot}
          onContinueSolo={() => { mp.disconnect(); setMode("solo"); }}
        />

        <div className="game-wrapper">
          <Stars />
          <div className="glow-orb glow-orb--purple" />
          <div className="glow-orb glow-orb--orange" />

          {mode === "multi" && (
            <OpponentBar
              opponents={mp.opponents}
              myScore={totalScore}
              maxScore={TOTAL_ROUNDS * 500}
            />
          )}

          <div className="fc-game">
            {/* Header */}
            <div className="fc-header">
              <div className="fc-header__meta">
                <span className="fc-header__round">Person {round + 1}/{TOTAL_ROUNDS}</span>
                <span className="fc-header__score">{totalScore} pts</span>
              </div>
              <div className="fc-category">
                <span>{CATEGORY_ICON[subject.category] ?? "❓"}</span>
                <span>{subject.category.charAt(0).toUpperCase() + subject.category.slice(1)}</span>
              </div>
            </div>

            {/* Clues */}
            <div className="fc-clues">
              {subject.clues.map((clue, i) => {
                const num = i + 1;
                const revealed = num <= currentClue;
                const active   = num === currentClue && !answered;
                return (
                  <div key={i} className={`fc-clue ${revealed ? "fc-clue--revealed" : "fc-clue--hidden"} ${active ? "fc-clue--active" : ""}`}>
                    <span className="fc-clue__num">{num}</span>
                    {revealed
                      ? <span className="fc-clue__text">{clue}</span>
                      : <span className="fc-clue__lock">🔒 Locked</span>}
                  </div>
                );
              })}
            </div>

            {/* Correct feedback */}
            {feedback === "correct" && (
              <div className="fc-feedback fc-feedback--correct">
                ✓ Correct! +{pointsThisRound} pts
              </div>
            )}

            {/* Answer reveal (when failed) */}
            {answered && pointsThisRound === 0 && (
              <div className="fc-reveal">
                The answer was: <strong>{subject.name}</strong>
              </div>
            )}

            {/* Input zone */}
            {canGuess && (
              <div className="fc-input-zone">
                <div className="fc-attempts">
                  {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                    <div key={i} className={`fc-attempt-dot ${i < MAX_ATTEMPTS - attemptsLeft ? "fc-attempt-dot--used" : ""}`} />
                  ))}
                  <span className="fc-attempts__label">
                    {attemptsLeft} attempt{attemptsLeft !== 1 ? "s" : ""} left
                  </span>
                </div>

                {feedback === "wrong" && (
                  <div className="fc-feedback fc-feedback--wrong">
                    ✗ Wrong answer!
                  </div>
                )}

                <div className="fc-input-row">
                  <input
                    ref={inputRef}
                    type="text"
                    className="fc-input"
                    placeholder="Who am I?"
                    value={inputValue}
                    autoComplete="off" autoCorrect="off"
                    autoCapitalize="off" spellCheck={false}
                    onChange={e => { setInputValue(e.target.value); if (feedback === "wrong") setFeedback(null); }}
                    onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
                  />
                  <button
                    className="btn-primary fc-btn-submit btn-hover"
                    onClick={handleSubmit}
                    disabled={!inputValue.trim()}
                  >
                    Submit
                  </button>
                </div>

                <div className="fc-actions">
                  {canNextClue && (
                    <button className="btn-outline fc-btn-clue btn-hover" onClick={handleNextClue}>
                      Next clue
                      <span className="fc-btn-clue__pts">{CLUE_POINTS[currentClue] ?? 0} pts</span>
                    </button>
                  )}
                  <button className="fc-btn-skip btn-hover" onClick={handleReveal}>
                    Give up
                  </button>
                </div>
              </div>
            )}

            {/* Waiting for opponent (multi) */}
            {isWaiting && (
              <div className="waiting-indicator">
                <span className="waiting-dot" />
                Waiting for {mp.opponent?.name ?? "opponent"}…
              </div>
            )}

            {/* Round result comparison (multi) */}
            {multiRoundResult && (
              <div className="fc-round-result">
                <div>You: <strong>{multiRoundResult.myPts} pts</strong></div>
                <div>{mp.opponent?.name}: <strong>{multiRoundResult.oppPts} pts</strong></div>
              </div>
            )}

            {/* Next button */}
            {(answered || multiRoundResult) && !isWaiting && (
              <button className="btn-next btn-hover" onClick={handleNextRound}>
                {round + 1 >= TOTAL_ROUNDS ? "See Results" : "Next Person →"}
              </button>
            )}
          </div>
        </div>
      </>
    );
  }

  // ── Home screen ───────────────────────────────────────────────────────────
  return (
    <div className="game-wrapper">
      <Stars />
      <div className="glow-orb glow-orb--purple" />
      <div className="glow-orb glow-orb--orange" />
      <div className="home-screen">
        <div className="home-title">
          5 <span className="accent">Clues</span>
        </div>
        <p className="home-subtitle">
          5 progressive clues. 3 attempts. Who am I?
        </p>
        <div className="fc-home-preview">
          <div className="fc-home-clue">① I was born in 1985 on a small Portuguese island…</div>
          <div className="fc-home-clue">② I grew up in poverty and left home at 12…</div>
          <div className="fc-home-clue fc-home-clue--locked">③ 🔒 Locked</div>
        </div>
        <div className="home-buttons">
          <button className="btn-primary btn-hover" onClick={startSolo}>Play Solo</button>
          <button className="btn-outline btn-hover" onClick={() => setShowNamePrompt(true)}>
            vs Opponent
          </button>
        </div>
      </div>

      {showNamePrompt && (
        <MultiplayerEntryModal
          gameType="five-clues"
          host={getPartykitHost()}
          onQuickMatch={name => { setShowNamePrompt(false); setMode("multi"); mp.joinQueue(name); }}
          onLobbyStart={(payload, myName) => {
            setShowNamePrompt(false);
            setMode("multi");
            mp.joinFromLobby(payload.gameId, payload.seed, myName, payload.totalPlayers, payload.playerNames);
          }}
          onCancel={() => setShowNamePrompt(false)}
        />
      )}
      <MultiplayerScreen
        status={mp.status}
        botCountdown={mp.botCountdown}
        onCancel={() => { mp.leaveQueue(); setShowNamePrompt(false); }}
        onPlayBot={mp.playVsBot}
      />
    </div>
  );
}
