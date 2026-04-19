/**
 * PartyKit server for Squad Number Draft.
 *
 * Snake-ordered draft that builds a 4-3-3 XI in four position-gated phases:
 *   GK (1 pick)  → DEF (4 picks)  → MID (3 picks)  → FWD (3 picks)
 *
 * Within a phase, each pick is a shirt number 1–99 which the server resolves
 * to a random player in the FC26 dataset who plays that position AND wears
 * that number. The number pool resets between phases, so common numbers like
 * #10 can be drafted once per phase (GK #10, DEF #10, MID #10, FWD #10).
 *
 * Turn timer: 25s. On timeout, a random eligible number is auto-picked so the
 * draft doesn't stall if someone disconnects.
 *
 * Winner: highest sum of OVR across their 11 picks.
 */
import type * as Party from "partykit/server";
import { usablePlayers } from "../lib/players";
import {
  SD_PHASE_ORDER,
  SD_PHASE_POSITIONS,
  SD_PHASE_QUOTAS,
} from "../lib/game-types";
import type {
  Player,
  RoomPlayer,
  SdClientMessage,
  SdPick,
  SdPosPhase,
  SdServerMessage,
  SdState,
} from "../lib/game-types";
import { pickAvatar, pickRandom, shuffle } from "../lib/utils";

const TURN_WINDOW_MS = 25_000;
const MIN_NUMBER = 1;
const MAX_NUMBER = 99;

const TOTAL_PICKS_PER_PLAYER = SD_PHASE_ORDER.reduce(
  (acc, p) => acc + SD_PHASE_QUOTAS[p],
  0,
);

export default class SdServer implements Party.Server {
  readonly state: SdState = {
    phase: "lobby",
    players: {},
    order: [],
    currentTurn: null,
    deadline: null,
    picks: {},
    takenNumbers: [],
    posPhase: null,
    phaseNumberPool: [],
    hostId: null,
  };

  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(readonly party: Party.Party) {}

  onConnect(conn: Party.Connection) {
    this.send(conn, { type: "state", state: this.state });
  }

  onMessage(raw: string, conn: Party.Connection) {
    let msg: SdClientMessage;
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
        this.handleStart(conn);
        break;
      case "pick":
        this.handlePick(conn, msg.jerseyNumber);
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

  private handleStart(conn: Party.Connection) {
    if (conn.id !== this.state.hostId) return;
    if (this.state.phase !== "lobby" && this.state.phase !== "finished") return;

    const connectedPlayers = Object.values(this.state.players).filter((p) => p.connected);
    if (connectedPlayers.length < 1) return;

    this.state.order = shuffle(connectedPlayers.map((p) => p.id));
    this.state.picks = {};
    this.state.takenNumbers = [];
    this.state.posPhase = "GK";
    this.state.phaseNumberPool = this.computePhasePool("GK");
    for (const p of Object.values(this.state.players)) {
      p.score = 0;
      if (p.connected) this.state.picks[p.id] = [];
    }
    this.state.phase = "drafting";
    this.startTurn();
  }

  private handlePick(conn: Party.Connection, jerseyNumber: number) {
    if (this.state.phase !== "drafting") return;
    if (conn.id !== this.state.currentTurn) return;
    if (!this.state.posPhase) return;
    if (!Number.isFinite(jerseyNumber)) return;
    const num = Math.floor(jerseyNumber);
    if (num < MIN_NUMBER || num > MAX_NUMBER) return;
    if (this.state.takenNumbers.includes(num)) return;

    const resolved = this.resolvePlayerForNumber(num, this.state.posPhase);
    if (!resolved) return; // no dataset candidate for this number+position this round

    this.commitPick(conn.id, num, resolved, this.state.posPhase);
  }

  /* ---------- state machine ---------- */

  private startTurn() {
    // All players finished every phase → done.
    if (this.totalPicksMade() >= this.state.order.length * TOTAL_PICKS_PER_PLAYER) {
      this.finish();
      return;
    }

    // Has the current phase completed? If so, advance it and reset the number pool.
    this.maybeAdvancePhase();

    const currentId = this.whoseTurn();
    if (!currentId) {
      this.finish();
      return;
    }

    this.state.currentTurn = currentId;
    this.state.deadline = Date.now() + TURN_WINDOW_MS;
    this.broadcast();

    this.clearTimer();
    this.timer = setTimeout(() => this.handleTimeout(), TURN_WINDOW_MS + 100);
  }

  private handleTimeout() {
    const turnId = this.state.currentTurn;
    const posPhase = this.state.posPhase;
    if (!turnId || !posPhase) return;
    // Auto-pick a random available number that has a valid candidate.
    const available: number[] = [];
    for (let n = MIN_NUMBER; n <= MAX_NUMBER; n++) {
      if (!this.state.takenNumbers.includes(n)) available.push(n);
    }
    const shuffled = shuffle(available);
    for (const num of shuffled) {
      const resolved = this.resolvePlayerForNumber(num, posPhase);
      if (resolved) {
        this.commitPick(turnId, num, resolved, posPhase);
        return;
      }
    }
    // No candidate at all for this position phase — skip the pick and carry on.
    // (Extreme edge case: dataset exhaustion.) We advance by committing a
    // sentinel-free no-op: bump the player's turn by finishing early if nobody
    // can draft anything.
    this.finish();
  }

  private commitPick(
    roomPlayerId: string,
    num: number,
    player: Player,
    posPhase: SdPosPhase,
  ) {
    this.state.takenNumbers = [...this.state.takenNumbers, num];
    const pick: SdPick = {
      jerseyNumber: num,
      player,
      pickedAtMs: Date.now(),
      posPhase,
    };
    this.state.picks[roomPlayerId] = [...(this.state.picks[roomPlayerId] ?? []), pick];
    this.clearTimer();
    this.startTurn();
  }

  private finish() {
    this.clearTimer();
    for (const p of Object.values(this.state.players)) {
      const picks = this.state.picks[p.id] ?? [];
      p.score = picks.reduce((acc, pk) => acc + pk.player.ovr, 0);
    }
    this.state.phase = "finished";
    this.state.currentTurn = null;
    this.state.deadline = null;
    this.state.posPhase = null;
    this.state.phaseNumberPool = [];
    this.broadcast();
  }

  /**
   * Pick a random player from the dataset who plays a position allowed in
   * `posPhase`, wears `num` at their club, and isn't already drafted.
   */
  private resolvePlayerForNumber(num: number, posPhase: SdPosPhase): Player | null {
    const alreadyPickedIds = new Set<string>();
    for (const arr of Object.values(this.state.picks)) {
      for (const pk of arr) alreadyPickedIds.add(pk.player.id);
    }
    const allowedPositions = new Set(SD_PHASE_POSITIONS[posPhase]);
    const candidates = usablePlayers().filter(
      (p) =>
        p.jerseyNumber === num &&
        allowedPositions.has(p.pos) &&
        !alreadyPickedIds.has(p.id),
    );
    if (candidates.length === 0) return null;
    return pickRandom(candidates);
  }

  /* ---------- helpers ---------- */

  /** Advance the position phase if everyone has completed the current phase's quota. */
  private maybeAdvancePhase() {
    const current = this.state.posPhase;
    if (!current) return;
    const quota = SD_PHASE_QUOTAS[current];
    const everyoneDone = this.state.order.every((id) => {
      const picks = this.state.picks[id] ?? [];
      return picks.filter((pk) => pk.posPhase === current).length >= quota;
    });
    if (!everyoneDone) return;
    const idx = SD_PHASE_ORDER.indexOf(current);
    const next = SD_PHASE_ORDER[idx + 1];
    if (!next) return; // last phase just finished; finish() will handle via totalPicks check
    this.state.posPhase = next;
    // Fresh number pool for the new phase.
    this.state.takenNumbers = [];
    this.state.phaseNumberPool = this.computePhasePool(next);
  }

  /**
   * Jersey numbers that have at least one dataset candidate for `posPhase`,
   * ignoring any already-drafted players. Reset per phase so the client can
   * grey out the numbers that have no valid player for the current position
   * group (e.g. #7 in the GK phase).
   */
  private computePhasePool(posPhase: SdPosPhase): number[] {
    const allowed = new Set(SD_PHASE_POSITIONS[posPhase]);
    const drafted = new Set<string>();
    for (const arr of Object.values(this.state.picks)) {
      for (const pk of arr) drafted.add(pk.player.id);
    }
    const pool = new Set<number>();
    for (const p of usablePlayers()) {
      if (p.jerseyNumber == null) continue;
      if (!allowed.has(p.pos)) continue;
      if (drafted.has(p.id)) continue;
      pool.add(p.jerseyNumber);
    }
    return [...pool].sort((a, b) => a - b);
  }

  /**
   * Snake-draft turn resolution scoped to the current phase. Within each phase,
   * the first player in `order` picks first on round 0; direction flips each
   * round. Phases also alternate their starting direction based on phase index
   * so whoever picked last in phase N-1 doesn't always pick last in phase N.
   */
  private whoseTurn(): string | null {
    const order = this.state.order;
    const posPhase = this.state.posPhase;
    if (order.length === 0 || !posPhase) return null;

    const picksInPhase = this.picksInPhase(posPhase);
    const round = Math.floor(picksInPhase / order.length);
    const inRound = picksInPhase % order.length;
    const phaseIdx = SD_PHASE_ORDER.indexOf(posPhase);
    // Odd phases (DEF, FWD in our order) start reversed for fairness.
    const forward = (round + phaseIdx) % 2 === 0;
    const idx = forward ? inRound : order.length - 1 - inRound;
    return order[idx] ?? null;
  }

  private totalPicksMade(): number {
    return Object.values(this.state.picks).reduce((acc, arr) => acc + arr.length, 0);
  }

  private picksInPhase(posPhase: SdPosPhase): number {
    let n = 0;
    for (const arr of Object.values(this.state.picks)) {
      for (const pk of arr) if (pk.posPhase === posPhase) n++;
    }
    return n;
  }

  private clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private send(conn: Party.Connection, msg: SdServerMessage) {
    conn.send(JSON.stringify(msg));
  }

  private broadcast() {
    const payload = JSON.stringify({ type: "state", state: this.state } satisfies SdServerMessage);
    for (const c of this.party.getConnections()) c.send(payload);
  }
}
