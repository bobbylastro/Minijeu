import type * as Party from "partykit/server";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface PlayerState {
  id: string;
  score: number;
  roundPoints: number[];
  roundAnswer: unknown | null;
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

const RECONNECT_GRACE_MS = 8_000;

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

  // Ghost slot: the disconnected player's state + a timer to declare them gone
  private ghost: { state: PlayerState; timer: ReturnType<typeof setTimeout> } | null = null;

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    const activePlayers = Object.keys(this.state.players).length;

    // ── Reconnect within grace period ────────────────────────────────────────
    if (this.ghost && activePlayers === 1) {
      clearTimeout(this.ghost.timer);
      const restored = { ...this.ghost.state, id: conn.id };
      this.ghost = null;

      this.state.players[conn.id] = restored;

      // If this player hadn't answered yet, server still waits — nothing to do.
      // If they had already answered, check whether the round can now progress.
      if (restored.roundAnswer !== null) {
        const allAnswered = Object.values(this.state.players).every(p => p.roundAnswer !== null);
        if (allAnswered && this.state.status === "playing") {
          this.state.status = "round_end";
          this.broadcast(JSON.stringify({
            type: "round_end",
            round: this.state.round,
            scores: this.scoresSnapshot(),
            roundPoints: this.roundPointsSnapshot(),
          }));
        }
      }

      // Send the reconnecting client a sync so they jump to the right round
      conn.send(JSON.stringify({
        type: "game_sync",
        round: this.state.round,
        seed: this.state.seed,
        scores: this.scoresSnapshot(),
        myScore: restored.score,
        alreadyAnswered: restored.roundAnswer !== null,
        status: this.state.status,
      }));

      // Tell the other player the opponent is back
      this.broadcast(JSON.stringify({ type: "opponent_reconnected" }), conn.id);
      return;
    }

    // ── Normal connect ───────────────────────────────────────────────────────
    if (activePlayers >= 2) {
      conn.close(1008, "Room full");
      return;
    }

    const url = new URL(ctx.request.url);
    const gameType = url.searchParams.get("gameType") ?? "";
    const seed = parseInt(url.searchParams.get("seed") ?? "0", 10);

    if (activePlayers === 0) {
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

    // ── Submit answer ────────────────────────────────────────────────────────
    if (data.type === "submit_answer") {
      if (player.roundAnswer !== null) return;

      player.roundAnswer = data.answer;
      player.roundPoints.push(data.points ?? 0);
      player.score += data.points ?? 0;

      this.broadcast(JSON.stringify({
        type: "player_answered",
        playerId: sender.id,
        points: data.points ?? 0,
        scores: this.scoresSnapshot(),
      }), sender.id);

      const allAnswered = Object.values(this.state.players).every(p => p.roundAnswer !== null);
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

    // ── Ready for next round ─────────────────────────────────────────────────
    if (data.type === "next_round") {
      player.readyForNext = true;

      const allReady = Object.values(this.state.players).every(p => p.readyForNext);
      if (allReady) {
        this.state.round++;
        const finished = this.state.round >= this.state.totalRounds;
        this.state.status = finished ? "finished" : "playing";

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

    // ── Rematch ──────────────────────────────────────────────────────────────
    if (data.type === "rematch_request" && this.state.status === "finished") {
      this.rematchRequested.add(sender.id);
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
    const player = this.state.players[conn.id];
    if (!player) return;

    delete this.state.players[conn.id];

    // During an active game: grace period before declaring opponent_left
    if (this.state.status === "playing" || this.state.status === "round_end") {
      if (this.ghost) clearTimeout(this.ghost.timer); // cancel any existing ghost
      this.ghost = {
        state: player,
        timer: setTimeout(() => {
          this.ghost = null;
          if (Object.keys(this.state.players).length > 0) {
            this.broadcast(JSON.stringify({ type: "opponent_left" }));
          }
        }, RECONNECT_GRACE_MS),
      };
    } else {
      // Not in an active game (waiting / finished) — declare immediately
      if (Object.keys(this.state.players).length > 0) {
        this.broadcast(JSON.stringify({ type: "opponent_left" }));
      }
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────
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
