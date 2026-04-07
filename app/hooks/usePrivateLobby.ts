"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import PartySocket from "partysocket";

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface LobbyPlayer {
  id: string;
  name: string;
}

export type LobbyStatus = "idle" | "connecting" | "waiting" | "starting" | "error";

export interface GameReadyPayload {
  gameId: string;
  seed: number;
  gameType: string;
  totalPlayers: number;
  playerNames: Record<string, string>;
}

// Unambiguous chars — no 0/O, 1/I confusion
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode(len = 4) {
  let code = "";
  for (let i = 0; i < len; i++)
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return code;
}

// ─── Hook ──────────────────────────────────────────────────────────────────────
export function usePrivateLobby({
  host,
  gameType,
  onGameReady,
}: {
  host: string;
  gameType: string;
  onGameReady: (payload: GameReadyPayload) => void;
}) {
  const [status,  setStatus]  = useState<LobbyStatus>("idle");
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [hostId,  setHostId]  = useState("");
  const [myId,    setMyId]    = useState<string | null>(null);
  const [code,    setCode]    = useState("");
  const [error,   setError]   = useState<string | null>(null);

  const socket = useRef<PartySocket | null>(null);
  const cbRef  = useRef(onGameReady);
  useEffect(() => { cbRef.current = onGameReady; });

  // ── Disconnect ───────────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    socket.current?.close();
    socket.current = null;
    setStatus("idle");
    setPlayers([]);
    setHostId("");
    setMyId(null);
    setCode("");
    setError(null);
  }, []);

  // ── Core connect ─────────────────────────────────────────────────────────────
  const connect = useCallback((roomCode: string, playerName: string) => {
    socket.current?.close();
    socket.current = null;

    setStatus("connecting");
    setCode(roomCode);
    setError(null);

    const sock = new PartySocket({ host, room: roomCode, party: "lobby" });
    socket.current = sock;

    sock.onopen = () => {
      setMyId(sock.id);
      sock.send(JSON.stringify({ type: "join", name: playerName, gameType }));
    };

    sock.onmessage = (evt) => {
      const data = JSON.parse(evt.data as string);

      if (data.type === "lobby_state") {
        setPlayers(data.players ?? []);
        setHostId(data.hostId ?? "");
        setStatus(data.status === "starting" ? "starting" : "waiting");
      }

      if (data.type === "game_ready") {
        setStatus("starting");
        cbRef.current(data as GameReadyPayload);
      }

      if (data.type === "error") {
        setError(data.message as string);
        setStatus("error");
      }

      if (data.type === "kicked") {
        setError("You have been removed from the lobby.");
        setStatus("error");
        sock.close();
        socket.current = null;
      }
    };

    sock.onerror = () => {
      setError("Connection failed. Check the code and try again.");
      setStatus("error");
    };

    sock.onclose = () => {
      setStatus(s => (s === "connecting" || s === "waiting") ? "idle" : s);
    };
  }, [host, gameType]);

  // ── Public API ───────────────────────────────────────────────────────────────
  const createRoom = useCallback((playerName: string): string => {
    const newCode = generateCode();
    connect(newCode, playerName);
    return newCode;
  }, [connect]);

  const joinRoom = useCallback((playerName: string, roomCode: string) => {
    connect(roomCode.trim().toUpperCase(), playerName);
  }, [connect]);

  const startGame = useCallback(() => {
    socket.current?.send(JSON.stringify({ type: "start" }));
  }, []);

  const kickPlayer = useCallback((playerId: string) => {
    socket.current?.send(JSON.stringify({ type: "kick", playerId }));
  }, []);

  // Cleanup on unmount
  useEffect(() => () => { disconnect(); }, [disconnect]);

  return {
    code, players, hostId, myId, status, error,
    isHost:     myId !== null && myId === hostId,
    canStart:   players.length >= 2,
    createRoom, joinRoom, startGame, kickPlayer, disconnect,
  };
}
