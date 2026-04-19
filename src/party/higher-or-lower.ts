/**
 * PartyKit server for Higher or Lower.
 *
 * Each "room" is an instance of this server, keyed by the 4-letter code from the URL.
 * All game state lives here (in-memory per room).
 *
 * Flow: lobby → (host clicks start) → guessing (12s) → revealing (4s) → next round …
 *       After `roundCount` rounds, phase = "finished".
 */
import type * as Party from "partykit/server";
import { usablePlayers } from "../lib/players";
import type {
  HolClientMessage,
  HolRound,
  HolServerMessage,
  HolState,
  Player,
  RoomPlayer,
} from "../lib/game-types";
import { pickAvatar, pickPair } from "../lib/utils";

const GUESS_WINDOW_MS = 12_000;
const REVEAL_WINDOW_MS = 4_000;
const DEFAULT_ROUND_COUNT = 15;

export default class HolServer implements Party.Server {
  readonly state: HolState = {
    phase: "lobby",
    players: {},
    round: null,
    guesses: {},
    lastResult: null,
    roundCount: DEFAULT_ROUND_COUNT,
    hostId: null,
  };

  private timer: ReturnType<typeof setTimeout> | null = null;
  private roundIndex = 0;

  constructor(readonly party: Party.Party) {}

  /* ------------- lifecycle ------------- */

  onConnect(conn: Party.Connection) {
    // Players join implicitly; they must then send { type: "join", name }.
    this.send(conn, { type: "state", state: this.state });
  }

  onMessage(raw: string, conn: Party.Connection) {
    let msg: HolClientMessage;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    switch (msg.type) {
      case "join":
        this.handleJoin(conn, msg.name);
        break;
      case "start":
        this.handleStart(conn, msg.roundCount);
        break;
      case "guess":
        this.handleGuess(conn, msg.answer);
        break;
      case "next":
        this.handleNext(conn);
        break;
    }
  }

  onClose(conn: Party.Connection) {
    const player = this.state.players[conn.id];
    if (!player) return;
    player.connected = false;

    // If the host leaves, promote the next connected player.
    if (this.state.hostId === conn.id) {
      const next = Object.values(this.state.players).find((p) => p.connected);
      this.state.hostId = next?.id ?? null;
    }

    // If no one connected remains, reset timers so the room idles cleanly.
    const anyoneLeft = Object.values(this.state.players).some((p) => p.connected);
    if (!anyoneLeft && this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.broadcast();
  }

  /* ------------- handlers ------------- */

  private handleJoin(conn: Party.Connection, rawName: string) {
    const name = (rawName ?? "").trim().slice(0, 16) || "Player";
    const existing = this.state.players[conn.id];
    if (existing) {
      existing.name = name;
      existing.connected = true;
    } else {
      const used = Object.values(this.state.players).map((p) => p.emoji);
      const player: RoomPlayer = {
        id: conn.id,
        name,
        emoji: pickAvatar(used),
        connected: true,
        score: 0,
      };
      this.state.players[conn.id] = player;
    }
    // First player becomes host.
    if (!this.state.hostId) this.state.hostId = conn.id;
    this.broadcast();
  }

  private handleStart(conn: Party.Connection, roundCount: number) {
    if (conn.id !== this.state.hostId) return;
    if (this.state.phase !== "lobby" && this.state.phase !== "finished") return;

    this.state.roundCount = clampRoundCount(roundCount);
    // Reset scores from previous matches.
    for (const p of Object.values(this.state.players)) p.score = 0;
    this.roundIndex = 0;
    this.startRound();
  }

  private handleGuess(conn: Party.Connection, answer: "higher" | "lower") {
    if (this.state.phase !== "guessing" || !this.state.round) return;
    if (!this.state.players[conn.id]) return;
    if (this.state.guesses[conn.id]) return; // lock-in: no changing answer
    this.state.guesses[conn.id] = answer;
    this.broadcast();

    // If every CONNECTED player has answered, reveal early.
    const connected = Object.values(this.state.players).filter((p) => p.connected);
    if (connected.every((p) => this.state.guesses[p.id])) {
      this.advanceToReveal();
    }
  }

  private handleNext(conn: Party.Connection) {
    if (conn.id !== this.state.hostId) return;
    if (this.state.phase !== "revealing") return;
    this.advanceAfterReveal();
  }

  /* ------------- state machine ------------- */

  private startRound() {
    // Exclude goalkeepers (they use GK-only stats, so the 6-stat card row renders as dashes)
    // and anyone with a missing outfield stat to keep every card visually complete.
    const pool = usablePlayers().filter(
      (p) =>
        p.ovr >= 75 &&
        p.pos !== "GK" &&
        p.pace !== null &&
        p.sho !== null &&
        p.pas !== null &&
        p.dri !== null &&
        p.def !== null &&
        p.phy !== null,
    );
    if (pool.length < 2) {
      this.state.phase = "finished";
      this.broadcast();
      return;
    }

    const [a, b] = pickDistinctPair(pool);
    const round: HolRound = {
      index: ++this.roundIndex,
      a,
      b,
      deadline: Date.now() + GUESS_WINDOW_MS,
    };
    this.state.round = round;
    this.state.guesses = {};
    this.state.lastResult = null;
    this.state.phase = "guessing";
    this.broadcast();

    this.clearTimer();
    this.timer = setTimeout(() => this.advanceToReveal(), GUESS_WINDOW_MS + 100);
  }

  private advanceToReveal() {
    if (this.state.phase !== "guessing" || !this.state.round) return;
    this.clearTimer();

    const { a, b } = this.state.round;
    const correctAnswer: "higher" | "lower" | "equal" =
      b.ovr > a.ovr ? "higher" : b.ovr < a.ovr ? "lower" : "equal";

    const perPlayer: Record<string, { guess: "higher" | "lower"; correct: boolean }> = {};
    for (const p of Object.values(this.state.players)) {
      const guess = this.state.guesses[p.id];
      if (!guess) continue;
      // Ties count as correct for whichever side they bet — generous for the stream vibe.
      const correct = correctAnswer === "equal" ? true : guess === correctAnswer;
      perPlayer[p.id] = { guess, correct };
      if (correct) p.score += 1;
    }

    this.state.lastResult = { correctAnswer, bRevealed: b, perPlayer };
    this.state.phase = "revealing";
    this.broadcast();

    this.timer = setTimeout(() => this.advanceAfterReveal(), REVEAL_WINDOW_MS);
  }

  private advanceAfterReveal() {
    this.clearTimer();
    if (this.roundIndex >= this.state.roundCount) {
      this.state.phase = "finished";
      this.state.round = null;
      this.broadcast();
      return;
    }
    this.startRound();
  }

  /* ------------- helpers ------------- */

  private clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private send(conn: Party.Connection, msg: HolServerMessage) {
    conn.send(JSON.stringify(msg));
  }

  private broadcast() {
    const payload = JSON.stringify({ type: "state", state: this.state } satisfies HolServerMessage);
    for (const c of this.party.getConnections()) c.send(payload);
  }
}

function clampRoundCount(n: number) {
  if (!Number.isFinite(n)) return DEFAULT_ROUND_COUNT;
  return Math.max(3, Math.min(30, Math.floor(n)));
}

function pickDistinctPair(pool: Player[]): [Player, Player] {
  // Ensure non-identical OVRs to avoid boring ties.
  let [a, b] = pickPair(pool);
  let tries = 0;
  while (a.ovr === b.ovr && tries < 10) {
    [a, b] = pickPair(pool);
    tries++;
  }
  return [a, b];
}
