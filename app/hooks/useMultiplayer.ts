"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import PartySocket from "partysocket";

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

export interface MultiplayerCallbacks {
  onGameStart: (seed: number) => void;
  onGameSync?: (round: number, seed: number, myScore: number, alreadyAnswered: boolean) => void;
  onOpponentAnswered: (points: number, scores: Record<string, number>) => void;
  onRoundEnd: (scores: Record<string, number>, roundPoints: Record<string, number>) => void;
  onNextRound: (round: number) => void;
  onGameEnd: (scores: Record<string, number>) => void;
}

interface UseMultiplayerOptions extends MultiplayerCallbacks {
  gameType: string; // "cityguessr" | "popguessr" | any future game
  host: string;     // Partykit host URL
}

interface UseMultiplayerReturn {
  status: MultiplayerStatus;
  myId: string | null;
  opponent: OpponentState | null;
  myWantsRematch: boolean;
  joinQueue: (name?: string) => void;
  leaveQueue: () => void;
  submitAnswer: (answer: unknown, points: number) => void;
  readyForNext: () => void;
  requestRematch: () => void;
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

  const matchmakingSocket = useRef<PartySocket | null>(null);
  const gameSocket = useRef<PartySocket | null>(null);

  // Keep callbacks in a ref so socket handlers are never stale
  const cb = useRef(callbacks);
  useEffect(() => { cb.current = callbacks; });

  // ── Cleanup ────────────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    matchmakingSocket.current?.close();
    gameSocket.current?.close();
    matchmakingSocket.current = null;
    gameSocket.current = null;
    setStatus("idle");
    setMyId(null);
    setOpponent(null);
    setMyWantsRematch(false);
  }, []);

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
        if (opponentId) setOpponent({ id: opponentId, name: opponentName, score: 0, hasAnswered: false, wantsRematch: false });
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

    // Flag to distinguish intentional closes (match found / user cancel)
    // from unexpected drops so onclose doesn't incorrectly reset status.
    let intentionalClose = false;

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
        setStatus(s => s === "connecting" || s === "waiting" ? "idle" : s);
      }
    };
  }, [status, host, gameType, connectToGame]);

  // ── Actions sent to the game server ───────────────────────────────────────
  const leaveQueue = useCallback(() => {
    matchmakingSocket.current?.send(JSON.stringify({ type: "leave_queue" }));
    disconnect();
  }, [disconnect]);

  const submitAnswer = useCallback((answer: unknown, points: number) => {
    gameSocket.current?.send(JSON.stringify({ type: "submit_answer", answer, points }));
  }, []);

  const readyForNext = useCallback(() => {
    gameSocket.current?.send(JSON.stringify({ type: "next_round" }));
  }, []);

  const requestRematch = useCallback(() => {
    gameSocket.current?.send(JSON.stringify({ type: "rematch_request" }));
    setMyWantsRematch(true);
  }, []);

  // Cleanup on unmount
  useEffect(() => () => { disconnect(); }, [disconnect]);

  return { status, myId, opponent, myWantsRematch, joinQueue, leaveQueue, submitAnswer, readyForNext, requestRematch, disconnect };
}
