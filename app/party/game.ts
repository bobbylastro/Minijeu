import type * as Party from "partykit/server";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface PlayerState {
  id: string;
  score: number;
  roundPoints: number[];      // points scored each round
  roundAnswer: unknown | null; // answer this round (null = not yet submitted)
  readyForNext: boolean;
}

type GameStatus = "waiting" | "playing" | "round_end" | "finished";

interface GameState {
  gameType: string;
  seed: number;
  totalRounds: number;
  round: number;
  status: GameStatus;
  players: Record<string, PlayerState>;
}

// ─── Server ────────────────────────────────────────────────────────────────────
export default class GameServer implements Party.Server {
  private state: GameState = {
    gameType: "",
    seed: 0,
    totalRounds: 10,
    round: 0,
    status: "waiting",
    players: {},
  };
  private rematchRequested = new Set<string>();

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // Reject any connection beyond the first two players
    if (Object.keys(this.state.players).length >= 2) {
      conn.close(1008, "Room full");
      return;
    }

    const url = new URL(ctx.request.url);
    const gameType = url.searchParams.get("gameType") ?? "";
    const seed = parseInt(url.searchParams.get("seed") ?? "0", 10);

    // Set game params from the first player to connect
    if (Object.keys(this.state.players).length === 0) {
      this.state.gameType = gameType;
      this.state.seed = seed;
    }

    this.state.players[conn.id] = {
      id: conn.id,
      score: 0,
      roundPoints: [],
      roundAnswer: null,
      readyForNext: false,
    };

    // Start when 2 players connected
    if (Object.keys(this.state.players).length === 2) {
      this.state.status = "playing";
      this.state.round = 0;
      this.broadcast(JSON.stringify({ type: "game_start", state: this.state }));
    }
  }

  onMessage(message: string, sender: Party.Connection) {
    const data = JSON.parse(message as string);
    const player = this.state.players[sender.id];
    if (!player) return;

    // ── Player submits an answer for the current round ──────────────────────
    if (data.type === "submit_answer") {
      if (player.roundAnswer !== null) return; // already answered

      player.roundAnswer = data.answer;
      player.roundPoints.push(data.points ?? 0);
      player.score += data.points ?? 0;

      // Notify only the opponent (not the sender) that this player has answered
      this.broadcast(JSON.stringify({
        type: "player_answered",
        playerId: sender.id,
        points: data.points ?? 0,
        scores: this.scoresSnapshot(),
      }), sender.id);

      // If both players answered → end of round
      const allAnswered = Object.values(this.state.players)
        .every(p => p.roundAnswer !== null);

      if (allAnswered) {
        this.state.status = "round_end";
        this.broadcast(JSON.stringify({
          type: "round_end",
          round: this.state.round,
          scores: this.scoresSnapshot(),
          roundPoints: this.roundPointsSnapshot(),
        }));
      }
    }

    // ── Player is ready to go to next round ────────────────────────────────
    if (data.type === "next_round") {
      player.readyForNext = true;

      const allReady = Object.values(this.state.players)
        .every(p => p.readyForNext);

      if (allReady) {
        this.state.round++;
        const finished = this.state.round >= this.state.totalRounds;
        this.state.status = finished ? "finished" : "playing";

        // Reset per-round state
        Object.values(this.state.players).forEach(p => {
          p.roundAnswer = null;
          p.readyForNext = false;
        });

        this.broadcast(JSON.stringify({
          type: finished ? "game_end" : "next_round",
          round: this.state.round,
          scores: this.scoresSnapshot(),
        }));
      }
    }

    // ── Rematch request ────────────────────────────────────────────────────
    if (data.type === "rematch_request" && this.state.status === "finished") {
      this.rematchRequested.add(sender.id);
      // Notify opponent
      this.broadcast(JSON.stringify({ type: "rematch_requested" }), sender.id);

      const playerIds = Object.keys(this.state.players);
      if (playerIds.length === 2 && playerIds.every(id => this.rematchRequested.has(id))) {
        this.rematchRequested.clear();
        const newSeed = Math.floor(Math.random() * 1_000_000);
        this.state.seed = newSeed;
        this.state.round = 0;
        this.state.status = "playing";
        Object.values(this.state.players).forEach(p => {
          p.score = 0;
          p.roundPoints = [];
          p.roundAnswer = null;
          p.readyForNext = false;
        });
        this.broadcast(JSON.stringify({ type: "game_start", state: this.state }));
      }
    }
  }

  onClose(conn: Party.Connection) {
    delete this.state.players[conn.id];
    if (Object.keys(this.state.players).length > 0) {
      this.broadcast(JSON.stringify({ type: "opponent_left" }));
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────
  private scoresSnapshot() {
    return Object.fromEntries(
      Object.entries(this.state.players).map(([id, p]) => [id, p.score])
    );
  }

  private roundPointsSnapshot() {
    return Object.fromEntries(
      Object.entries(this.state.players).map(([id, p]) => [id, p.roundPoints.at(-1) ?? 0])
    );
  }

  private broadcast(message: string, excludeId?: string) {
    for (const conn of this.room.getConnections()) {
      if (conn.id !== excludeId) conn.send(message);
    }
  }
}
