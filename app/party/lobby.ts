import type * as Party from "partykit/server";

// ─── Types ─────────────────────────────────────────────────────────────────────
const MAX_PLAYERS = 8;

interface LobbyPlayer {
  id: string;
  name: string;
}

type LobbyStatus = "waiting" | "starting";

interface LobbyState {
  hostId: string;
  gameType: string;
  players: LobbyPlayer[];
  status: LobbyStatus;
}

// ─── Server ────────────────────────────────────────────────────────────────────
export default class LobbyServer implements Party.Server {
  private state: LobbyState = {
    hostId: "",
    gameType: "",
    players: [],
    status: "waiting",
  };

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection) {
    // Send current state; player sends "join" next
    conn.send(JSON.stringify({ type: "lobby_state", ...this.snapshot() }));
  }

  onMessage(message: string, sender: Party.Connection) {
    const data = JSON.parse(message as string);

    // ── Join ──────────────────────────────────────────────────────────────────
    if (data.type === "join") {
      if (this.state.players.find(p => p.id === sender.id)) return;

      if (this.state.status === "starting") {
        sender.send(JSON.stringify({ type: "error", message: "Game already started" }));
        return;
      }
      if (this.state.players.length >= MAX_PLAYERS) {
        sender.send(JSON.stringify({ type: "error", message: "Room is full (max 8 players)" }));
        return;
      }

      const name = (data.name as string)?.trim().slice(0, 20) || "Anonymous";

      // First to join becomes host
      if (this.state.players.length === 0) {
        this.state.hostId = sender.id;
        this.state.gameType = (data.gameType as string) || "";
      }

      this.state.players.push({ id: sender.id, name });
      this.broadcastState();
    }

    // ── Start game (host only) ─────────────────────────────────────────────────
    if (data.type === "start" && sender.id === this.state.hostId) {
      if (this.state.players.length < 2) {
        sender.send(JSON.stringify({ type: "error", message: "Need at least 2 players to start" }));
        return;
      }
      if (this.state.status === "starting") return;

      this.state.status = "starting";

      const seed = Math.floor(Math.random() * 1_000_000);
      const playerNames: Record<string, string> = {};
      for (const p of this.state.players) playerNames[p.id] = p.name;

      this.broadcast(JSON.stringify({
        type: "game_ready",
        gameId:       this.room.id,
        seed,
        gameType:     this.state.gameType,
        totalPlayers: this.state.players.length,
        playerNames,
      }));
    }

    // ── Kick player (host only) ────────────────────────────────────────────────
    if (data.type === "kick" && sender.id === this.state.hostId) {
      const targetId = data.playerId as string;
      const target = this.room.getConnection(targetId);
      if (target) {
        target.send(JSON.stringify({ type: "kicked" }));
        target.close();
      }
      this.state.players = this.state.players.filter(p => p.id !== targetId);
      this.broadcastState();
    }
  }

  onClose(conn: Party.Connection) {
    const wasHost = conn.id === this.state.hostId;
    this.state.players = this.state.players.filter(p => p.id !== conn.id);

    if (this.state.players.length === 0) return;

    // Transfer host to next player
    if (wasHost) this.state.hostId = this.state.players[0].id;

    if (this.state.status !== "starting") this.broadcastState();
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  private snapshot() {
    return {
      hostId:     this.state.hostId,
      gameType:   this.state.gameType,
      players:    this.state.players,
      status:     this.state.status,
      maxPlayers: MAX_PLAYERS,
    };
  }

  private broadcastState() {
    this.broadcast(JSON.stringify({ type: "lobby_state", ...this.snapshot() }));
  }

  private broadcast(message: string, excludeId?: string) {
    for (const conn of this.room.getConnections()) {
      if (conn.id !== excludeId) conn.send(message);
    }
  }
}
