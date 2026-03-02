import type * as Party from "partykit/server";

interface WaitingPlayer {
  connectionId: string;
  gameType: string;
  name: string;
}

// Single global matchmaking queue across all connections to this room.
// Everyone connects to the same room id ("global").
export default class MatchmakingServer implements Party.Server {
  private queue: WaitingPlayer[] = [];

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection) {
    conn.send(JSON.stringify({ type: "connected" }));
  }

  onMessage(message: string, sender: Party.Connection) {
    const data = JSON.parse(message as string);

    if (data.type === "join_queue") {
      const gameType: string = data.gameType;
      const name: string = (data.name as string)?.trim() || "Anonymous";

      // Avoid double-queueing
      if (this.queue.find(p => p.connectionId === sender.id)) return;

      const opponentIdx = this.queue.findIndex(p => p.gameType === gameType);

      if (opponentIdx !== -1) {
        // Match found — send each player the other's name
        const opponent = this.queue.splice(opponentIdx, 1)[0];

        const gameId = Math.random().toString(36).slice(2, 8).toUpperCase();
        const seed = Math.floor(Math.random() * 1_000_000);

        sender.send(JSON.stringify({ type: "match_found", gameId, seed, gameType, opponentName: opponent.name }));
        this.room.getConnection(opponent.connectionId)?.send(JSON.stringify({ type: "match_found", gameId, seed, gameType, opponentName: name }));
      } else {
        // Add to queue
        this.queue.push({ connectionId: sender.id, gameType, name });
        sender.send(JSON.stringify({ type: "waiting" }));
      }
    }

    if (data.type === "leave_queue") {
      this.queue = this.queue.filter(p => p.connectionId !== sender.id);
    }
  }

  onClose(conn: Party.Connection) {
    this.queue = this.queue.filter(p => p.connectionId !== conn.id);
  }
}
