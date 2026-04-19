/**
 * PartyKit server for FUT Draft.
 *
 * Each player independently builds a 4-3-3 by choosing one of 5 random
 * players for each of 11 slots. Slots advance when all connected players
 * have picked OR the per-slot timer fires.
 *
 * Scoring: final total OVR of each player's XI; highest wins. Ties broken
 * by sum of the six 1-99 sub-stats (pace/sho/...).
 */
import type * as Party from "partykit/server";
import { usablePlayers } from "../lib/players";
import type {
  FutClientMessage,
  FutRound,
  FutServerMessage,
  FutState,
  Player,
  RoomPlayer,
} from "../lib/game-types";
import { FUT_4_3_3_SLOTS } from "../lib/game-types";
import { pickAvatar, shuffle } from "../lib/utils";

const SLOT_WINDOW_MS = 25_000;
const OPTIONS_PER_SLOT = 5;

export default class FutServer implements Party.Server {
  readonly state: FutState = {
    phase: "lobby",
    players: {},
    round: null,
    picks: {},
    slotCount: FUT_4_3_3_SLOTS.length,
    hostId: null,
  };

  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(readonly party: Party.Party) {}

  onConnect(conn: Party.Connection) {
    this.send(conn, { type: "state", state: this.state });
  }

  onMessage(raw: string, conn: Party.Connection) {
    let msg: FutClientMessage;
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
        this.handlePick(conn, msg.playerId);
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

    // Reset score + picks for everyone; only seed picks arrays for connected players.
    this.state.picks = {};
    for (const p of Object.values(this.state.players)) {
      p.score = 0;
      if (p.connected) this.state.picks[p.id] = [];
    }
    this.state.phase = "picking";
    this.startSlot(0);
  }

  private handlePick(conn: Party.Connection, playerId: string) {
    if (this.state.phase !== "picking" || !this.state.round) return;
    const you = this.state.players[conn.id];
    if (!you || !you.connected) return;

    const yourPicks = this.state.picks[you.id] ?? [];
    if (yourPicks.length > this.state.round.slotIndex) return; // already picked this slot
    if (yourPicks.length !== this.state.round.slotIndex) return; // out of sync — ignore

    const options = this.state.round.options[you.id] ?? [];
    const chosen = options.find((p) => p.id === playerId);
    if (!chosen) return; // reject picks outside the offered 5 to prevent client tampering

    this.state.picks[you.id] = [...yourPicks, chosen];
    this.broadcast();

    // If every connected player has picked, advance early.
    const connected = Object.values(this.state.players).filter((p) => p.connected);
    const allPicked = connected.every(
      (p) => (this.state.picks[p.id]?.length ?? 0) > this.state.round!.slotIndex,
    );
    if (allPicked) this.advanceSlot();
  }

  /* ---------- state machine ---------- */

  private startSlot(slotIndex: number) {
    const slot = FUT_4_3_3_SLOTS[slotIndex];
    if (!slot) {
      this.finish();
      return;
    }
    // Pool: all players matching the slot's position tags, with all outfield stats present.
    // GK slot is position "GK" only (no stat-completeness guard since we don't render outfield stats for GK).
    const fullPool = usablePlayers();
    const allowed = new Set<string>(slot.positions);
    let pool = fullPool.filter(
      (p) =>
        allowed.has(p.pos) &&
        // Skip players with any outfield stat null for non-GK slots so the cards look complete.
        (slot.label === "GK" || (p.pace != null && p.sho != null && p.pas != null && p.dri != null && p.def != null && p.phy != null)),
    );
    // Fallback: if the filter produced too few players (e.g. a rare position tag combo), widen to all usable players.
    if (pool.length < OPTIONS_PER_SLOT) pool = fullPool;

    // Every connected player gets their own random 5.
    const options: Record<string, Player[]> = {};
    for (const p of Object.values(this.state.players)) {
      if (!p.connected) continue;
      options[p.id] = shuffle(pool).slice(0, OPTIONS_PER_SLOT);
    }

    const round: FutRound = {
      slotIndex,
      slotLabel: slot.label,
      deadline: Date.now() + SLOT_WINDOW_MS,
      options,
    };
    this.state.round = round;
    this.broadcast();

    this.clearTimer();
    this.timer = setTimeout(() => this.advanceSlot(true), SLOT_WINDOW_MS + 100);
  }

  /**
   * Move to the next slot. For any connected player who failed to pick in time,
   * auto-assign them the first option so the XI stays 11-deep.
   */
  private advanceSlot(autoAssign = false) {
    if (!this.state.round) return;
    this.clearTimer();

    const round = this.state.round;
    for (const p of Object.values(this.state.players)) {
      if (!p.connected) continue;
      const picks = this.state.picks[p.id] ?? [];
      if (picks.length <= round.slotIndex && autoAssign) {
        const forced = round.options[p.id]?.[0];
        if (forced) this.state.picks[p.id] = [...picks, forced];
      }
    }

    const next = round.slotIndex + 1;
    if (next >= this.state.slotCount) {
      this.finish();
      return;
    }
    this.startSlot(next);
  }

  private finish() {
    this.clearTimer();
    // Score = sum of OVRs in each player's XI.
    for (const p of Object.values(this.state.players)) {
      const picks = this.state.picks[p.id] ?? [];
      p.score = picks.reduce((acc, pl) => acc + (pl.ovr ?? 0), 0);
    }
    this.state.phase = "finished";
    this.state.round = null;
    this.broadcast();
  }

  /* ---------- helpers ---------- */

  private clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private send(conn: Party.Connection, msg: FutServerMessage) {
    conn.send(JSON.stringify(msg));
  }

  private broadcast() {
    const payload = JSON.stringify({ type: "state", state: this.state } satisfies FutServerMessage);
    for (const c of this.party.getConnections()) c.send(payload);
  }
}
