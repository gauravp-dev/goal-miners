/**
 * PartyKit server for Who Am I?
 *
 * Everyone vs system. Server picks a mystery player; six clues drip one at a
 * time on a 15-second interval (nation, position, league, age, OVR, first
 * letter of last name). Players submit guesses via autocomplete. First correct
 * wins the round (5 pts); each later-correct gets partial credit (3 / 2 / 1).
 *
 * The mysteryId is stripped from wire payloads during the guessing phase to
 * prevent trivial WS inspection cheats.
 */
import type * as Party from "partykit/server";
import { findPlayer, usablePlayers } from "../lib/players";
import type {
  Player,
  RoomPlayer,
  WhoClientMessage,
  WhoClue,
  WhoRound,
  WhoServerMessage,
  WhoState,
} from "../lib/game-types";
import { pickAvatar } from "../lib/utils";
import { OVR_STAR, weightedPick } from "../lib/tier-pools";

const CLUE_INTERVAL_MS = 15_000;
const ROUND_WINDOW_MS = 95_000; // 6 clues × 15s ≈ 90s plus a beat
const ROUND_END_PAUSE_MS = 6_000;
const DEFAULT_ROUND_COUNT = 5;
const POINTS_BY_RANK = [5, 3, 2, 1];

export default class WhoServer implements Party.Server {
  readonly state: WhoState = {
    phase: "lobby",
    players: {},
    round: null,
    roundCount: DEFAULT_ROUND_COUNT,
    revealedMysteryName: null,
    revealedMysteryImg: null,
    hostId: null,
  };

  private timer: ReturnType<typeof setTimeout> | null = null;
  private roundIndex = 0;

  constructor(readonly party: Party.Party) {}

  onConnect(conn: Party.Connection) {
    this.send(conn, { type: "state", state: this.sanitize() });
  }

  onMessage(raw: string, conn: Party.Connection) {
    let msg: WhoClientMessage;
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

  private handleGuess(conn: Party.Connection, guessedPlayerId: string) {
    if (this.state.phase !== "guessing") return;
    const round = this.state.round;
    if (!round) return;
    const you = this.state.players[conn.id];
    if (!you || !you.connected) return;
    // Already won this round — ignore additional submissions.
    if (round.winners.includes(you.id)) return;

    const guessed = findPlayer(guessedPlayerId);
    const mystery = findPlayer(round.mysteryId);
    if (!guessed || !mystery) return;

    const correct = guessed.id === mystery.id;
    const entry = {
      guessedPlayerId: guessed.id,
      guessedName: guessed.name,
      correct,
      atMs: Date.now(),
    };
    round.guesses[you.id] = [...(round.guesses[you.id] ?? []), entry];

    if (correct) {
      const rank = round.winners.length;
      round.winners.push(you.id);
      you.score += POINTS_BY_RANK[rank] ?? 1;
    }

    this.broadcast();

    // If every connected player has guessed correctly, end the round early.
    const connected = Object.values(this.state.players).filter((p) => p.connected);
    if (connected.every((p) => round.winners.includes(p.id))) {
      this.endRound();
    }
  }

  private handleNext(conn: Party.Connection) {
    if (conn.id !== this.state.hostId) return;
    if (this.state.phase !== "roundEnd") return;
    this.advanceAfterRoundEnd();
  }

  /* ---------- state machine ---------- */

  private startRound() {
    // Pool matches Playerdle (OVR_STAR / ≥82) with league-weighted selection
    // so clues like "Premier League" or "Real Madrid" give players an
    // actual fighting chance at recognizable names.
    const pool = usablePlayers().filter((p) => p.ovr >= OVR_STAR);
    if (pool.length < 1) {
      this.state.phase = "finished";
      this.broadcast();
      return;
    }
    const mystery = weightedPick(pool);
    const now = Date.now();
    const clues = buildClues(mystery, now);
    const round: WhoRound = {
      index: ++this.roundIndex,
      mysteryId: mystery.id,
      clues,
      deadline: now + ROUND_WINDOW_MS,
      guesses: {},
      winners: [],
    };
    for (const p of Object.values(this.state.players)) {
      if (p.connected) round.guesses[p.id] = [];
    }
    this.state.round = round;
    this.state.phase = "guessing";
    this.state.revealedMysteryName = null;
    this.state.revealedMysteryImg = null;
    this.broadcast();

    this.clearTimer();
    this.timer = setTimeout(() => this.endRound(), ROUND_WINDOW_MS + 100);
  }

  private endRound() {
    if (this.state.phase !== "guessing" || !this.state.round) return;
    this.clearTimer();
    const mystery = findPlayer(this.state.round.mysteryId);
    this.state.phase = "roundEnd";
    this.state.revealedMysteryName = mystery?.name ?? "Unknown";
    this.state.revealedMysteryImg = mystery?.img ?? null;
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

  private send(conn: Party.Connection, msg: WhoServerMessage) {
    conn.send(JSON.stringify(msg));
  }

  private broadcast() {
    const payload = JSON.stringify({
      type: "state",
      state: this.sanitize(),
    } satisfies WhoServerMessage);
    for (const c of this.party.getConnections()) c.send(payload);
  }

  /** Hide mysteryId from wire during guessing phase. */
  private sanitize(): WhoState {
    const { round, phase } = this.state;
    if (!round) return this.state;
    if (phase === "guessing") {
      return { ...this.state, round: { ...round, mysteryId: "__hidden__" } };
    }
    return this.state;
  }
}

function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, Math.floor(n)));
}

/** Build 6 clues for a mystery player with staggered reveal timestamps. */
function buildClues(m: Player, now: number): WhoClue[] {
  const lastName = m.name.split(" ").slice(-1)[0] ?? m.name;
  const ageBracket = bucketAge(m.age);
  const ovrBracket = bucketOvr(m.ovr);
  const base: Array<Omit<WhoClue, "revealAt">> = [
    { label: "Nation", value: m.nation },
    { label: "Position", value: m.pos },
    { label: "League", value: m.league ?? "Unknown" },
    { label: "Age range", value: ageBracket },
    { label: "OVR range", value: ovrBracket },
    { label: "Last name starts with", value: lastName[0]?.toUpperCase() ?? "?" },
  ];
  return base.map((c, i) => ({ ...c, revealAt: now + i * CLUE_INTERVAL_MS }));
}

function bucketAge(age: number): string {
  if (age < 21) return "Under 21";
  if (age < 24) return "21–23";
  if (age < 28) return "24–27";
  if (age < 32) return "28–31";
  return "32+";
}

function bucketOvr(ovr: number): string {
  if (ovr >= 90) return "90+";
  if (ovr >= 85) return "85–89";
  if (ovr >= 82) return "82–84";
  return "80–81";
}
