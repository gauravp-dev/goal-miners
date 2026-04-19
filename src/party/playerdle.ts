/**
 * PartyKit server for Playerdle (football Wordle).
 *
 * One mystery player per round. Every connected player has up to 8 guesses.
 * Each guess returns a color grid comparing nation / league / club / position /
 * age / overall. First correct guess in a round = 3 pts, any other correct = 1.
 *
 * The mystery player's id is NEVER sent to clients until the round ends.
 */
import type * as Party from "partykit/server";
import { findPlayer, usablePlayers } from "../lib/players";
import type {
  PdleClientMessage,
  PdleGuess,
  PdleGuessCell,
  PdleRound,
  PdleServerMessage,
  PdleState,
  Player,
  RoomPlayer,
} from "../lib/game-types";
import { pickAvatar, pickRandom } from "../lib/utils";

const ROUND_WINDOW_MS = 150_000;            // 2m30s per round
const ROUND_END_PAUSE_MS = 8_000;
const MAX_GUESSES = 8;
const DEFAULT_ROUND_COUNT = 5;

export default class PdleServer implements Party.Server {
  readonly state: PdleState = {
    phase: "lobby",
    players: {},
    round: null,
    maxGuessesPerPlayer: MAX_GUESSES,
    roundCount: DEFAULT_ROUND_COUNT,
    revealedMysteryName: null,
    revealedMysteryId: null,
    hostId: null,
  };

  private timer: ReturnType<typeof setTimeout> | null = null;
  private roundIndex = 0;

  constructor(readonly party: Party.Party) {}

  onConnect(conn: Party.Connection) {
    this.send(conn, { type: "state", state: this.sanitize() });
  }

  onMessage(raw: string, conn: Party.Connection) {
    let msg: PdleClientMessage;
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
        this.handleGuess(conn, msg.playerId);
        break;
      case "next":
        this.handleNext(conn);
        break;
    }
  }

  onClose(conn: Party.Connection) {
    const p = this.state.players[conn.id];
    if (!p) return;
    p.connected = false;
    if (this.state.hostId === conn.id) {
      const next = Object.values(this.state.players).find((x) => x.connected);
      this.state.hostId = next?.id ?? null;
    }
    this.broadcast();
  }

  /* ---------- handlers ---------- */

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
    if (!this.state.hostId) this.state.hostId = conn.id;
    this.broadcast();
  }

  private handleStart(conn: Party.Connection, roundCount: number) {
    if (conn.id !== this.state.hostId) return;
    if (this.state.phase !== "lobby" && this.state.phase !== "finished") return;
    this.state.roundCount = clamp(roundCount, 1, 10);
    for (const p of Object.values(this.state.players)) p.score = 0;
    this.roundIndex = 0;
    this.startRound();
  }

  private handleGuess(conn: Party.Connection, playerId: string) {
    if (this.state.phase !== "guessing") return;
    const round = this.state.round;
    if (!round) return;
    const you = this.state.players[conn.id];
    if (!you || !you.connected) return;

    const existingGuesses = round.guesses[you.id] ?? [];
    if (existingGuesses.length >= this.state.maxGuessesPerPlayer) return;
    // Cannot re-guess the same player.
    if (existingGuesses.some((g) => g.playerId === playerId)) return;

    const guessed = findPlayer(playerId);
    const mystery = findPlayer(round.mysteryId);
    if (!guessed || !mystery) return;

    const entry: PdleGuess = {
      playerId,
      guessedBy: you.id,
      playerName: guessed.name,
      correct: guessed.id === mystery.id,
      cells: compareCells(guessed, mystery),
    };
    round.guesses[you.id] = [entry, ...existingGuesses];

    if (entry.correct) {
      if (!round.winner) {
        round.winner = you.id;
        you.score += 3;
      } else {
        you.score += 1;
      }
    }

    this.broadcast();
    this.maybeEndRound();
  }

  private handleNext(conn: Party.Connection) {
    if (conn.id !== this.state.hostId) return;
    if (this.state.phase !== "roundEnd") return;
    this.advanceAfterRoundEnd();
  }

  /* ---------- state machine ---------- */

  private startRound() {
    const pool = usablePlayers().filter((p) => p.ovr >= 82);
    if (pool.length < 1) {
      this.state.phase = "finished";
      this.broadcast();
      return;
    }
    const mystery = pickRandom(pool);
    const round: PdleRound = {
      index: ++this.roundIndex,
      mysteryId: mystery.id,
      deadline: Date.now() + ROUND_WINDOW_MS,
      guesses: {},
      winner: null,
    };
    // Empty guess arrays for connected players so the UI renders their grids.
    for (const p of Object.values(this.state.players)) {
      if (p.connected) round.guesses[p.id] = [];
    }
    this.state.round = round;
    this.state.phase = "guessing";
    this.state.revealedMysteryName = null;
    this.state.revealedMysteryId = null;
    this.broadcast();

    this.clearTimer();
    this.timer = setTimeout(() => this.endRound(), ROUND_WINDOW_MS + 100);
  }

  private maybeEndRound() {
    if (!this.state.round) return;
    const connected = Object.values(this.state.players).filter((p) => p.connected);
    const everyoneDone = connected.every((p) => {
      const gs = this.state.round?.guesses[p.id] ?? [];
      return gs.some((g) => g.correct) || gs.length >= this.state.maxGuessesPerPlayer;
    });
    if (everyoneDone) this.endRound();
  }

  private endRound() {
    if (this.state.phase !== "guessing" || !this.state.round) return;
    this.clearTimer();
    const mystery = findPlayer(this.state.round.mysteryId);
    this.state.phase = "roundEnd";
    this.state.revealedMysteryName = mystery?.name ?? "Unknown";
    this.state.revealedMysteryId = mystery?.id ?? null;
    this.broadcast();

    this.timer = setTimeout(() => this.advanceAfterRoundEnd(), ROUND_END_PAUSE_MS);
  }

  private advanceAfterRoundEnd() {
    this.clearTimer();
    if (this.roundIndex >= this.state.roundCount) {
      this.state.phase = "finished";
      this.state.round = null;
      this.broadcast();
      return;
    }
    this.startRound();
  }

  /* ---------- helpers ---------- */

  private clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private send(conn: Party.Connection, msg: PdleServerMessage) {
    conn.send(JSON.stringify(msg));
  }

  private broadcast() {
    const payload = JSON.stringify({
      type: "state",
      state: this.sanitize(),
    } satisfies PdleServerMessage);
    for (const c of this.party.getConnections()) c.send(payload);
  }

  /**
   * Strip the mysteryId from `round` before broadcasting during guessing phase.
   * Otherwise clients could inspect WebSocket traffic and win trivially.
   */
  private sanitize(): PdleState {
    const { round, phase } = this.state;
    if (!round) return this.state;
    if (phase === "guessing") {
      return {
        ...this.state,
        round: { ...round, mysteryId: "__hidden__" },
      };
    }
    return this.state;
  }
}

function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, Math.floor(n)));
}

/**
 * Compare a guessed player vs the mystery across 6 clue dimensions.
 * Returns cells ordered as: nation, league, club, position, age, overall.
 */
export function compareCells(guess: Player, mystery: Player): PdleGuess["cells"] {
  const nation: PdleGuessCell = {
    value: guess.nation,
    status: guess.nation === mystery.nation ? "correct" : "wrong",
  };
  const league: PdleGuessCell = {
    value: guess.league ?? "—",
    status: guess.league && guess.league === mystery.league ? "correct" : "wrong",
  };
  const club: PdleGuessCell = {
    value: guess.club ?? "—",
    status: guess.club && guess.club === mystery.club ? "correct" : "wrong",
  };
  const position: PdleGuessCell = {
    value: guess.pos,
    status: guess.pos === mystery.pos ? "correct" : "wrong",
  };
  const age: PdleGuessCell = numericCell(guess.age, mystery.age);
  const overall: PdleGuessCell = numericCell(guess.ovr, mystery.ovr);
  return { nation, league, club, position, age, overall };
}

function numericCell(guess: number, mystery: number): PdleGuessCell {
  if (guess === mystery) return { value: guess, status: "correct" };
  return { value: guess, status: guess < mystery ? "higher" : "lower" };
}
