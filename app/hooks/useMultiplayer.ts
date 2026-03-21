"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import PartySocket from "partysocket";

// ─── Constants ─────────────────────────────────────────────────────────────────
const BOT_NAMES = ["GeoGenius", "CityBot", "MapMaster", "QuizBot", "ChampBot", "StarPlayer"];
const BOT_WAIT_MS = 30_000;          // trigger bot after 30s
const BOT_COUNTDOWN_AT_MS = 20_000;  // start showing countdown at 20s

// ─── Types ─────────────────────────────────────────────────────────────────────
export type MultiplayerStatus =
  | "idle"          // Not in multiplayer mode
  | "connecting"    // Connecting to matchmaking server
  | "waiting"       // In queue, waiting for an opponent
  | "matched"       // Opponent found, connecting to game room
  | "playing"       // In game
  | "opponent_left" // Opponent disconnected mid-game
  | "finished";     // Game over

export interface OpponentState {
  id: string;
  name: string;
  score: number;
  hasAnswered: boolean; // true = answered this round (value hidden until both done)
  wantsRematch: boolean;
}

export interface SessionSeries {
  me: number;
  opp: number;
  ties: number;
}

export interface MultiplayerCallbacks {
  onGameStart: (seed: number) => void;
  onGameSync?: (round: number, seed: number, myScore: number, alreadyAnswered: boolean) => void;
  onOpponentAnswered: (points: number, scores: Record<string, number>) => void;
  onRoundEnd: (scores: Record<string, number>, roundPoints: Record<string, number>) => void;
  onNextRound: (round: number) => void;
  onGameEnd: (scores: Record<string, number>) => void;
}

interface UseMultiplayerOptions extends MultiplayerCallbacks {
  gameType: string;
  host: string;
}

interface BotState {
  playerScore: number;
  botScore: number;
  round: number;
  totalRounds: number;
  playerAnswered: boolean;
  botAnswered: boolean;
  playerPoints: number;
  botPoints: number;
  botId: string;
  botName: string;
  seed: number;
  playerId: string;
}

interface UseMultiplayerReturn {
  status: MultiplayerStatus;
  myId: string | null;
  opponent: OpponentState | null;
  myWantsRematch: boolean;
  series: SessionSeries;
  botCountdown: number | null;
  isBot: boolean;
  joinQueue: (name?: string) => void;
  leaveQueue: () => void;
  submitAnswer: (answer: unknown, points: number) => void;
  readyForNext: () => void;
  requestRematch: () => void;
  playVsBot: (totalRounds?: number) => void;
  disconnect: () => void;
}

// ─── Hook ──────────────────────────────────────────────────────────────────────
export function useMultiplayer({
  gameType,
  host,
  ...callbacks
}: UseMultiplayerOptions): UseMultiplayerReturn {
  const [status, setStatus] = useState<MultiplayerStatus>("idle");
  const [myId, setMyId] = useState<string | null>(null);
  const [opponent, setOpponent] = useState<OpponentState | null>(null);
  const [myWantsRematch, setMyWantsRematch] = useState(false);
  const [series, setSeries] = useState<SessionSeries>({ me: 0, opp: 0, ties: 0 });
  const [botCountdown, setBotCountdown] = useState<number | null>(null);

  const matchmakingSocket = useRef<PartySocket | null>(null);
  const gameSocket = useRef<PartySocket | null>(null);
  const opponentIdRef = useRef<string | null>(null);

  // Bot refs
  const isBotRef = useRef(false);
  const botStateRef = useRef<BotState | null>(null);
  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const botWaitRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const botCdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep callbacks in a ref so socket handlers are never stale
  const cb = useRef(callbacks);
  useEffect(() => { cb.current = callbacks; });

  // ── Bot helpers ────────────────────────────────────────────────────────────

  const checkBotBothAnswered = useCallback(() => {
    const bs = botStateRef.current;
    if (!bs || !bs.playerAnswered || !bs.botAnswered) return;

    bs.playerScore += bs.playerPoints;
    bs.botScore    += bs.botPoints;

    const scores: Record<string, number> = {
      [bs.playerId]: bs.playerScore,
      [bs.botId]: bs.botScore,
    };
    const roundPoints: Record<string, number> = {
      [bs.playerId]: bs.playerPoints,
      [bs.botId]: bs.botPoints,
    };

    bs.playerAnswered = false;
    bs.botAnswered    = false;

    setOpponent(prev => prev ? { ...prev, score: bs.botScore, hasAnswered: false } : prev);
    cb.current.onRoundEnd(scores, roundPoints);
  }, []);

  const scheduleBotAnswer = useCallback(() => {
    const delay = 2000 + Math.random() * 4000; // 2–6 seconds
    botTimerRef.current = setTimeout(() => {
      const bs = botStateRef.current;
      if (!bs) return;

      const botPoints = Math.floor(15 + Math.random() * 71); // 15–85 pts
      bs.botPoints    = botPoints;
      bs.botAnswered  = true;

      const previewScores: Record<string, number> = {
        [bs.playerId]: bs.playerScore + bs.playerPoints,
        [bs.botId]: bs.botScore + botPoints,
      };

      setOpponent(prev => prev ? { ...prev, hasAnswered: true } : prev);
      cb.current.onOpponentAnswered(botPoints, previewScores);

      checkBotBothAnswered();
    }, delay);
  }, [checkBotBothAnswered]);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  const clearBotTimers = useCallback(() => {
    if (botTimerRef.current) { clearTimeout(botTimerRef.current);   botTimerRef.current = null; }
    if (botWaitRef.current)  { clearTimeout(botWaitRef.current);    botWaitRef.current  = null; }
    if (botCdRef.current)    { clearInterval(botCdRef.current);     botCdRef.current    = null; }
  }, []);

  const disconnect = useCallback(() => {
    clearBotTimers();
    isBotRef.current  = false;
    botStateRef.current = null;
    matchmakingSocket.current?.close();
    gameSocket.current?.close();
    matchmakingSocket.current = null;
    gameSocket.current = null;
    opponentIdRef.current = null;
    setStatus("idle");
    setMyId(null);
    setOpponent(null);
    setMyWantsRematch(false);
    setSeries({ me: 0, opp: 0, ties: 0 });
    setBotCountdown(null);
  }, [clearBotTimers]);

  // ── Start a bot game ───────────────────────────────────────────────────────
  const playVsBot = useCallback((totalRounds = 10) => {
    clearBotTimers();
    setBotCountdown(null);

    // Close matchmaking socket if still open
    matchmakingSocket.current?.close();
    matchmakingSocket.current = null;

    const botName   = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    const botId     = "bot_" + Math.random().toString(36).slice(2, 8);
    const playerId  = "local_player";
    const seed      = Math.floor(Math.random() * 1_000_000);

    isBotRef.current = true;
    botStateRef.current = {
      playerScore: 0, botScore: 0,
      round: 1, totalRounds,
      playerAnswered: false, botAnswered: false,
      playerPoints: 0, botPoints: 0,
      botId, botName, seed, playerId,
    };

    opponentIdRef.current = botId;
    setMyId(playerId);
    setStatus("playing");
    setMyWantsRematch(false);
    setOpponent({ id: botId, name: botName, score: 0, hasAnswered: false, wantsRematch: false });

    cb.current.onGameStart(seed);
    scheduleBotAnswer();
  }, [clearBotTimers, scheduleBotAnswer]);

  // ── Connect to game room after match is found ──────────────────────────────
  const connectToGame = useCallback((gameId: string, seed: number, opponentName: string) => {
    const socket = new PartySocket({
      host,
      room: gameId,
      party: "game",
      query: { gameType, seed: String(seed) },
    });
    gameSocket.current = socket;

    socket.onopen = () => setMyId(socket.id);

    socket.onmessage = (evt) => {
      const data = JSON.parse(evt.data as string);

      if (data.type === "game_start") {
        const gameSeed: number = data.state?.seed ?? seed;
        setStatus("playing");
        setMyWantsRematch(false);
        const opponentId = Object.keys(data.state.players).find(id => id !== socket.id);
        if (opponentId) {
          opponentIdRef.current = opponentId;
          setOpponent({ id: opponentId, name: opponentName, score: 0, hasAnswered: false, wantsRematch: false });
        }
        cb.current.onGameStart(gameSeed);
      }

      if (data.type === "game_sync") {
        setStatus("playing");
        cb.current.onGameSync?.(data.round, data.seed, data.myScore ?? 0, data.alreadyAnswered ?? false);
      }

      if (data.type === "opponent_reconnected") {
        setStatus("playing");
        setOpponent(prev => prev ? { ...prev, hasAnswered: false } : prev);
      }

      if (data.type === "rematch_requested") {
        setOpponent(prev => prev ? { ...prev, wantsRematch: true } : prev);
      }

      if (data.type === "player_answered" && data.playerId !== socket.id) {
        setOpponent(prev =>
          prev ? { ...prev, score: data.scores[prev.id] ?? prev.score, hasAnswered: true } : prev
        );
        cb.current.onOpponentAnswered(data.points, data.scores);
      }

      if (data.type === "round_end") {
        setOpponent(prev =>
          prev ? { ...prev, score: data.scores[prev.id] ?? prev.score, hasAnswered: false } : prev
        );
        cb.current.onRoundEnd(data.scores, data.roundPoints);
      }

      if (data.type === "next_round") {
        setOpponent(prev => prev ? { ...prev, hasAnswered: false } : prev);
        cb.current.onNextRound(data.round);
      }

      if (data.type === "game_end") {
        setStatus("finished");
        const myScore  = data.scores[socket.id] ?? 0;
        const oppScore = opponentIdRef.current ? (data.scores[opponentIdRef.current] ?? 0) : 0;
        setSeries(prev => {
          if (myScore > oppScore)  return { ...prev, me:  prev.me  + 1 };
          if (oppScore > myScore)  return { ...prev, opp: prev.opp + 1 };
          return { ...prev, ties: prev.ties + 1 };
        });
        cb.current.onGameEnd(data.scores);
      }

      if (data.type === "opponent_left") {
        setStatus("opponent_left");
      }
    };

    socket.onclose = () => {
      setStatus(s => s === "playing" ? "opponent_left" : s);
    };
  }, [host, gameType]);

  // ── Join matchmaking queue ─────────────────────────────────────────────────
  const joinQueue = useCallback((name: string = "Anonymous") => {
    if (status !== "idle") return;
    setStatus("connecting");

    const socket = new PartySocket({
      host,
      room: "global",
      party: "matchmaking",
    });
    matchmakingSocket.current = socket;

    let intentionalClose = false;
    let botTriggered = false;

    // Start 30s bot fallback timer
    botWaitRef.current = setTimeout(() => {
      if (botTriggered) return;
      botTriggered = true;
      intentionalClose = true;
      playVsBot();
    }, BOT_WAIT_MS);

    // Show countdown from 10s before bot triggers
    const countdownStart = BOT_WAIT_MS - BOT_COUNTDOWN_AT_MS; // 10s
    botCdRef.current = setInterval(() => {
      if (botTriggered) { clearInterval(botCdRef.current!); return; }
      const elapsed = Date.now() - startedAt;
      if (elapsed >= BOT_COUNTDOWN_AT_MS) {
        const remaining = Math.max(0, Math.ceil((BOT_WAIT_MS - elapsed) / 1000));
        setBotCountdown(remaining);
      }
    }, 200);

    const startedAt = Date.now();
    void countdownStart; // used implicitly via startedAt

    socket.onopen = () => {
      setMyId(socket.id);
      socket.send(JSON.stringify({ type: "join_queue", gameType, name }));
    };

    socket.onerror = (err) => {
      console.error("[Multiplayer] Matchmaking socket error:", err);
    };

    socket.onmessage = (evt) => {
      const data = JSON.parse(evt.data as string);

      if (data.type === "waiting") {
        setStatus("waiting");
      }

      if (data.type === "match_found") {
        botTriggered = true;
        clearBotTimers();
        setBotCountdown(null);
        intentionalClose = true;
        setStatus("matched");
        socket.close();
        matchmakingSocket.current = null;
        connectToGame(data.gameId as string, data.seed as number, data.opponentName as string ?? "Anonymous");
      }
    };

    socket.onclose = (evt) => {
      if (!intentionalClose) {
        console.error("[Multiplayer] Matchmaking socket closed unexpectedly. Code:", evt.code, "Reason:", evt.reason || "(none)");
        clearBotTimers();
        setBotCountdown(null);
        setStatus(s => s === "connecting" || s === "waiting" ? "idle" : s);
      }
    };
  }, [status, host, gameType, connectToGame, playVsBot, clearBotTimers]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const leaveQueue = useCallback(() => {
    matchmakingSocket.current?.send(JSON.stringify({ type: "leave_queue" }));
    disconnect();
  }, [disconnect]);

  const submitAnswer = useCallback((_answer: unknown, points: number) => {
    if (isBotRef.current) {
      const bs = botStateRef.current;
      if (!bs) return;
      bs.playerPoints   = points;
      bs.playerAnswered = true;
      checkBotBothAnswered();
      return;
    }
    gameSocket.current?.send(JSON.stringify({ type: "submit_answer", answer: _answer, points }));
  }, [checkBotBothAnswered]);

  const readyForNext = useCallback(() => {
    if (isBotRef.current) {
      const bs = botStateRef.current;
      if (!bs) return;

      if (bs.round >= bs.totalRounds) {
        // Game over
        isBotRef.current = false;
        setStatus("finished");
        const finalScores: Record<string, number> = {
          [bs.playerId]: bs.playerScore,
          [bs.botId]:    bs.botScore,
        };
        setSeries(prev => {
          if (bs.playerScore > bs.botScore) return { ...prev, me:  prev.me  + 1 };
          if (bs.botScore > bs.playerScore) return { ...prev, opp: prev.opp + 1 };
          return { ...prev, ties: prev.ties + 1 };
        });
        cb.current.onGameEnd(finalScores);
      } else {
        bs.round += 1;
        setOpponent(prev => prev ? { ...prev, hasAnswered: false } : prev);
        cb.current.onNextRound(bs.round);
        scheduleBotAnswer();
      }
      return;
    }
    gameSocket.current?.send(JSON.stringify({ type: "next_round" }));
  }, [scheduleBotAnswer]);

  const requestRematch = useCallback(() => {
    if (isBotRef.current) {
      const bs = botStateRef.current;
      if (!bs) return;
      const newSeed = Math.floor(Math.random() * 1_000_000);
      bs.playerScore    = 0;
      bs.botScore       = 0;
      bs.round          = 1;
      bs.playerAnswered = false;
      bs.botAnswered    = false;
      bs.playerPoints   = 0;
      bs.botPoints      = 0;
      bs.seed           = newSeed;
      isBotRef.current  = true;
      setStatus("playing");
      setMyWantsRematch(false);
      setOpponent(prev => prev ? { ...prev, score: 0, hasAnswered: false, wantsRematch: false } : prev);
      cb.current.onGameStart(newSeed);
      scheduleBotAnswer();
      return;
    }
    gameSocket.current?.send(JSON.stringify({ type: "rematch_request" }));
    setMyWantsRematch(true);
  }, [scheduleBotAnswer]);

  // Cleanup on unmount
  useEffect(() => () => { disconnect(); }, [disconnect]);

  return {
    status, myId, opponent, myWantsRematch, series,
    botCountdown, isBot: isBotRef.current,
    joinQueue, leaveQueue, submitAnswer, readyForNext,
    requestRematch, playVsBot, disconnect,
  };
}
