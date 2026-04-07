"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import PartySocket from "partysocket";

// ─── Constants ─────────────────────────────────────────────────────────────────
const BOT_NAMES = ["GeoGenius", "CityBot", "MapMaster", "QuizBot", "ChampBot", "StarPlayer"];
const BOT_WAIT_MS = 30_000;
const BOT_COUNTDOWN_AT_MS = 20_000;

// ─── Types ─────────────────────────────────────────────────────────────────────
export type MultiplayerStatus =
  | "idle"
  | "connecting"
  | "waiting"
  | "matched"
  | "playing"
  | "opponent_left"
  | "finished";

export interface OpponentState {
  id: string;
  name: string;
  score: number;
  hasAnswered: boolean;
  wantsRematch: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  score: number;
  isMe: boolean;
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
  playerScore: number; botScore: number;
  round: number; totalRounds: number;
  playerAnswered: boolean; botAnswered: boolean;
  playerPoints: number; botPoints: number;
  botId: string; botName: string; seed: number; playerId: string;
}

interface UseMultiplayerReturn {
  status: MultiplayerStatus;
  myId: string | null;
  /** All opponents (N-1 players). For 1v1 quick match, length === 1. */
  opponents: OpponentState[];
  /** First opponent — kept for backward-compat in 1v1 screens. */
  opponent: OpponentState | null;
  /** Set when the game ends in private-room mode (N > 1 opponents). */
  finalLeaderboard: LeaderboardEntry[] | null;
  isPrivateRoom: boolean;
  myWantsRematch: boolean;
  series: SessionSeries;
  botCountdown: number | null;
  isBot: boolean;
  joinQueue: (name?: string) => void;
  /** Connect directly to a game room started by a private lobby. */
  joinFromLobby: (
    gameId: string,
    seed: number,
    myName: string,
    totalPlayers: number,
    playerNames: Record<string, string>
  ) => void;
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
  const [status,           setStatus]           = useState<MultiplayerStatus>("idle");
  const [myId,             setMyId]             = useState<string | null>(null);
  const [opponents,        setOpponents]        = useState<OpponentState[]>([]);
  const [myWantsRematch,   setMyWantsRematch]   = useState(false);
  const [series,           setSeries]           = useState<SessionSeries>({ me: 0, opp: 0, ties: 0 });
  const [botCountdown,     setBotCountdown]     = useState<number | null>(null);
  const [finalLeaderboard, setFinalLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [isPrivateRoom,    setIsPrivateRoom]    = useState(false);

  const matchmakingSocket = useRef<PartySocket | null>(null);
  const gameSocket        = useRef<PartySocket | null>(null);
  const opponentIdRef     = useRef<string | null>(null);

  // Bot refs
  const isBotRef      = useRef(false);
  const botStateRef   = useRef<BotState | null>(null);
  const botTimerRef   = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const botWaitRef    = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const botCdRef      = useRef<ReturnType<typeof setInterval> | null>(null);

  const cb = useRef(callbacks);
  useEffect(() => { cb.current = callbacks; });

  // ── Leaderboard builder ────────────────────────────────────────────────────
  const buildLeaderboard = useCallback(
    (scores: Record<string, number>, names: Record<string, string>, mySocketId: string): LeaderboardEntry[] => {
      const entries = Object.entries(scores)
        .map(([id, score]) => ({ id, name: names[id] ?? "Player", score }))
        .sort((a, b) => b.score - a.score);
      let rank = 1;
      return entries.map((e, i) => {
        if (i > 0 && e.score < entries[i - 1].score) rank = i + 1;
        return { rank, id: e.id, name: e.name, score: e.score, isMe: e.id === mySocketId };
      });
    },
    []
  );

  // ── Bot helpers ────────────────────────────────────────────────────────────
  const checkBotBothAnswered = useCallback(() => {
    const bs = botStateRef.current;
    if (!bs || !bs.playerAnswered || !bs.botAnswered) return;
    bs.playerScore += bs.playerPoints;
    bs.botScore    += bs.botPoints;
    const scores:      Record<string, number> = { [bs.playerId]: bs.playerScore, [bs.botId]: bs.botScore };
    const roundPoints: Record<string, number> = { [bs.playerId]: bs.playerPoints, [bs.botId]: bs.botPoints };
    bs.playerAnswered = false;
    bs.botAnswered    = false;
    setOpponents(prev => prev.map(o => o.id === bs.botId ? { ...o, score: bs.botScore, hasAnswered: false } : o));
    cb.current.onRoundEnd(scores, roundPoints);
  }, []);

  const scheduleBotAnswer = useCallback(() => {
    const delay = 2000 + Math.random() * 4000;
    botTimerRef.current = setTimeout(() => {
      const bs = botStateRef.current;
      if (!bs) return;
      const botPoints = Math.floor(15 + Math.random() * 71);
      bs.botPoints   = botPoints;
      bs.botAnswered = true;
      const previewScores: Record<string, number> = {
        [bs.playerId]: bs.playerScore + bs.playerPoints,
        [bs.botId]:    bs.botScore    + botPoints,
      };
      setOpponents(prev => prev.map(o => o.id === bs.botId ? { ...o, hasAnswered: true } : o));
      cb.current.onOpponentAnswered(botPoints, previewScores);
      checkBotBothAnswered();
    }, delay);
  }, [checkBotBothAnswered]);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  const clearBotTimers = useCallback(() => {
    if (botTimerRef.current) { clearTimeout(botTimerRef.current);  botTimerRef.current = null; }
    if (botWaitRef.current)  { clearTimeout(botWaitRef.current);   botWaitRef.current  = null; }
    if (botCdRef.current)    { clearInterval(botCdRef.current);    botCdRef.current    = null; }
  }, []);

  const disconnect = useCallback(() => {
    clearBotTimers();
    isBotRef.current    = false;
    botStateRef.current = null;
    matchmakingSocket.current?.close();
    gameSocket.current?.close();
    matchmakingSocket.current = null;
    gameSocket.current        = null;
    opponentIdRef.current     = null;
    setStatus("idle");
    setMyId(null);
    setOpponents([]);
    setMyWantsRematch(false);
    setSeries({ me: 0, opp: 0, ties: 0 });
    setBotCountdown(null);
    setFinalLeaderboard(null);
    setIsPrivateRoom(false);
  }, [clearBotTimers]);

  // ── Start a bot game ───────────────────────────────────────────────────────
  const playVsBot = useCallback((totalRounds = 10) => {
    clearBotTimers();
    setBotCountdown(null);
    matchmakingSocket.current?.close();
    matchmakingSocket.current = null;

    const botName  = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    const botId    = "bot_" + Math.random().toString(36).slice(2, 8);
    const playerId = "local_player";
    const seed     = Math.floor(Math.random() * 1_000_000);

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
    setFinalLeaderboard(null);
    setIsPrivateRoom(false);
    setOpponents([{ id: botId, name: botName, score: 0, hasAnswered: false, wantsRematch: false }]);
    cb.current.onGameStart(seed);
    scheduleBotAnswer();
  }, [clearBotTimers, scheduleBotAnswer]);

  // ── Shared game socket handler ────────────────────────────────────────────
  const attachGameSocket = useCallback((
    socket: PartySocket,
    seed: number,
    initialNames: Record<string, string>,
    privateRoom: boolean,
    fallbackName?: string,  // used by Quick Match to fill unknown opponent name
  ) => {
    gameSocket.current = socket;
    socket.onopen = () => setMyId(socket.id);

    socket.onmessage = (evt) => {
      const data = JSON.parse(evt.data as string);

      // ── game_start ───────────────────────────────────────────────────────
      if (data.type === "game_start") {
        const gameSeed: number  = data.state?.seed ?? seed;
        const names: Record<string, string> = data.playerNames ?? initialNames;
        setStatus("playing");
        setMyWantsRematch(false);
        setFinalLeaderboard(null);

        const oppStates: OpponentState[] = Object.keys(data.state.players)
          .filter(id => id !== socket.id)
          .map(id => ({
            id,
            name: names[id] ?? fallbackName ?? "Player",
            score: 0,
            hasAnswered: false,
            wantsRematch: false,
          }));
        setOpponents(oppStates);
        if (oppStates.length > 0) opponentIdRef.current = oppStates[0].id;
        cb.current.onGameStart(gameSeed);
      }

      // ── game_sync (reconnect) ────────────────────────────────────────────
      if (data.type === "game_sync") {
        setStatus("playing");
        cb.current.onGameSync?.(data.round, data.seed, data.myScore ?? 0, data.alreadyAnswered ?? false);
      }

      if (data.type === "opponent_reconnected") {
        setStatus("playing");
        setOpponents(prev => prev.map(o => ({ ...o, hasAnswered: false })));
      }

      if (data.type === "rematch_requested") {
        const senderId = data.playerId as string | undefined;
        setOpponents(prev => prev.map(o =>
          !senderId || o.id === senderId ? { ...o, wantsRematch: true } : o
        ));
      }

      // ── player_answered ──────────────────────────────────────────────────
      if (data.type === "player_answered" && data.playerId !== socket.id) {
        setOpponents(prev => prev.map(o =>
          o.id === data.playerId
            ? { ...o, score: data.scores[o.id] ?? o.score, hasAnswered: true }
            : o
        ));
        cb.current.onOpponentAnswered(data.points, data.scores);
      }

      // ── round_end ────────────────────────────────────────────────────────
      if (data.type === "round_end") {
        setOpponents(prev => prev.map(o =>
          ({ ...o, score: data.scores[o.id] ?? o.score, hasAnswered: false })
        ));
        cb.current.onRoundEnd(data.scores, data.roundPoints);
      }

      // ── next_round ───────────────────────────────────────────────────────
      if (data.type === "next_round") {
        setOpponents(prev => prev.map(o => ({ ...o, hasAnswered: false })));
        cb.current.onNextRound(data.round);
      }

      // ── game_end ─────────────────────────────────────────────────────────
      if (data.type === "game_end") {
        setStatus("finished");
        const scores: Record<string, number>     = data.scores ?? {};
        const names: Record<string, string>      = data.playerNames ?? {};
        const myScore  = scores[socket.id] ?? 0;
        const oppScore = opponentIdRef.current ? (scores[opponentIdRef.current] ?? 0) : 0;

        setSeries(prev => {
          if (myScore > oppScore) return { ...prev, me:  prev.me  + 1 };
          if (oppScore > myScore) return { ...prev, opp: prev.opp + 1 };
          return { ...prev, ties: prev.ties + 1 };
        });

        if (privateRoom) {
          const lb = buildLeaderboard(scores, names, socket.id);
          setFinalLeaderboard(lb);
        }

        cb.current.onGameEnd(scores);
      }

      // ── opponent_left ────────────────────────────────────────────────────
      if (data.type === "opponent_left") {
        const leftId = data.playerId as string | undefined;
        if (leftId) setOpponents(prev => prev.filter(o => o.id !== leftId));
        else        setStatus("opponent_left");
      }
    };

    socket.onclose = () => {
      setStatus(s => s === "playing" ? "opponent_left" : s);
    };
  }, [buildLeaderboard]);

  // ── Connect to game room after quick match ─────────────────────────────────
  const connectToGame = useCallback((gameId: string, seed: number, opponentName: string) => {
    const socket = new PartySocket({
      host,
      room: gameId,
      party: "game",
      query: { gameType, seed: String(seed) },
    });
    // Pass opponentName as fallback so game_start resolves the unknown opponent ID → name
    attachGameSocket(socket, seed, {}, false, opponentName);
  }, [host, gameType, attachGameSocket]);

  // ── Join from private lobby ────────────────────────────────────────────────
  const joinFromLobby = useCallback((
    gameId: string,
    seed: number,
    myName: string,
    totalPlayers: number,
    playerNames: Record<string, string>,
  ) => {
    setIsPrivateRoom(true);
    const socket = new PartySocket({
      host,
      room: gameId,
      party: "game",
      query: {
        gameType,
        seed:       String(seed),
        maxPlayers: String(totalPlayers),
        name:       encodeURIComponent(myName),
      },
    });
    attachGameSocket(socket, seed, playerNames, true);
  }, [host, gameType, attachGameSocket]);

  // ── Join matchmaking queue ─────────────────────────────────────────────────
  const joinQueue = useCallback((name: string = "Anonymous") => {
    if (status !== "idle") return;
    setStatus("connecting");
    setIsPrivateRoom(false);

    const socket = new PartySocket({ host, room: "global", party: "matchmaking" });
    matchmakingSocket.current = socket;

    let intentionalClose = false;
    let botTriggered     = false;

    botWaitRef.current = setTimeout(() => {
      if (botTriggered) return;
      botTriggered = true;
      intentionalClose = true;
      playVsBot();
    }, BOT_WAIT_MS);

    botCdRef.current = setInterval(() => {
      if (botTriggered) { clearInterval(botCdRef.current!); return; }
      const elapsed = Date.now() - startedAt;
      if (elapsed >= BOT_COUNTDOWN_AT_MS) {
        const remaining = Math.max(0, Math.ceil((BOT_WAIT_MS - elapsed) / 1000));
        setBotCountdown(remaining);
      }
    }, 200);

    const startedAt = Date.now();

    socket.onopen = () => {
      setMyId(socket.id);
      socket.send(JSON.stringify({ type: "join_queue", gameType, name }));
    };

    socket.onerror = (err) => {
      console.error("[Multiplayer] Matchmaking socket error:", err);
    };

    socket.onmessage = (evt) => {
      const data = JSON.parse(evt.data as string);

      if (data.type === "waiting") setStatus("waiting");

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
        console.error("[Multiplayer] Matchmaking closed unexpectedly. Code:", evt.code, "Reason:", evt.reason || "(none)");
        clearBotTimers();
        setBotCountdown(null);
        setStatus(s => (s === "connecting" || s === "waiting") ? "idle" : s);
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
        setOpponents(prev => prev.map(o => ({ ...o, hasAnswered: false })));
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
      bs.playerScore = 0; bs.botScore = 0; bs.round = 1;
      bs.playerAnswered = false; bs.botAnswered = false;
      bs.playerPoints = 0; bs.botPoints = 0; bs.seed = newSeed;
      isBotRef.current = true;
      setStatus("playing");
      setMyWantsRematch(false);
      setFinalLeaderboard(null);
      setOpponents(prev => prev.map(o => ({ ...o, score: 0, hasAnswered: false, wantsRematch: false })));
      cb.current.onGameStart(newSeed);
      scheduleBotAnswer();
      return;
    }
    gameSocket.current?.send(JSON.stringify({ type: "rematch_request" }));
    setMyWantsRematch(true);
  }, [scheduleBotAnswer]);

  useEffect(() => () => { disconnect(); }, [disconnect]);

  const opponent = opponents[0] ?? null;

  return {
    status, myId, opponents, opponent,
    finalLeaderboard, isPrivateRoom,
    myWantsRematch, series, botCountdown,
    isBot: isBotRef.current,
    joinQueue, joinFromLobby, leaveQueue,
    submitAnswer, readyForNext, requestRematch,
    playVsBot, disconnect,
  };
}
