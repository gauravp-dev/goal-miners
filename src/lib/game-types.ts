/**
 * Types shared between the Next.js client and PartyKit servers.
 * Keep this file pure (no React/Node imports) so it imports cleanly in both.
 */

// Canonical player record used by every game.
export interface Player {
  id: string;
  name: string;
  pos: string; // primary position, e.g. "ST"
  ovr: number; // overall rating
  club: string | null;
  league: string | null;
  nation: string;
  age: number;
  pace: number | null;
  sho: number | null;
  pas: number | null;
  dri: number | null;
  def: number | null;
  phy: number | null;
  img: string | null; // portrait url
  val: number | null; // market value in eur
  // Optional: club jersey number from the FC26 dataset. Only used by Squad Number Draft;
  // null when not present in the current dataset. Safe to ignore in other games.
  jerseyNumber?: number | null;
}

// Presence record for a participant in a room.
export interface RoomPlayer {
  id: string; // stable socket id
  name: string; // display name
  emoji: string; // random avatar emoji assigned on join
  connected: boolean;
  score: number;
}

// ---- Higher or Lower ----

export type HolPhase = "lobby" | "guessing" | "revealing" | "finished";

export interface HolRound {
  index: number; // 1-based
  a: Player; // left card (shown)
  b: Player; // right card (hidden rating)
  deadline: number; // epoch ms when guessing window closes
}

export interface HolState {
  phase: HolPhase;
  players: Record<string, RoomPlayer>;
  round: HolRound | null;
  // key: playerId, value: "higher" | "lower"
  guesses: Record<string, "higher" | "lower">;
  // Filled in on reveal so clients can render an outcome screen.
  lastResult: null | {
    correctAnswer: "higher" | "lower" | "equal";
    bRevealed: Player;
    perPlayer: Record<string, { guess: "higher" | "lower"; correct: boolean }>;
  };
  roundCount: number; // total rounds for this match
  hostId: string | null;
}

export type HolClientMessage =
  | { type: "join"; name: string }
  | { type: "start"; roundCount: number }
  | { type: "guess"; answer: "higher" | "lower" }
  | { type: "next" };

export type HolServerMessage =
  | { type: "state"; state: HolState }
  | { type: "error"; message: string };

// ---- Playerdle ----

export type PlayerdlePhase = "lobby" | "guessing" | "roundEnd" | "finished";

export interface PdleGuessCell {
  value: string | number;
  status: "correct" | "wrong" | "higher" | "lower";
}

export interface PdleGuess {
  playerId: string; // the guessed player's id
  guessedBy: string; // the roomPlayer.id who guessed
  cells: {
    nation: PdleGuessCell;
    league: PdleGuessCell;
    club: PdleGuessCell;
    position: PdleGuessCell;
    age: PdleGuessCell;
    overall: PdleGuessCell;
  };
  correct: boolean;
  playerName: string; // shown in the guess row
}

export interface PdleRound {
  index: number;
  mysteryId: string; // hidden from clients until reveal
  deadline: number;
  // Guesses per roomPlayer.id, newest first.
  guesses: Record<string, PdleGuess[]>;
  winner: string | null; // first roomPlayer.id to guess correctly
}

export interface PdleState {
  phase: PlayerdlePhase;
  players: Record<string, RoomPlayer>;
  round: PdleRound | null;
  maxGuessesPerPlayer: number;
  roundCount: number;
  revealedMysteryName: string | null;
  revealedMysteryId: string | null;
  hostId: string | null;
}

export type PdleClientMessage =
  | { type: "join"; name: string }
  | { type: "start"; roundCount: number }
  | { type: "guess"; playerId: string }
  | { type: "next" };

export type PdleServerMessage =
  | { type: "state"; state: PdleState }
  | { type: "error"; message: string };

// ---- FUT Draft (game E) ----
//
// Each player independently builds an 11-slot 4-3-3 squad from 5 randomised
// choices per slot. Picks happen simultaneously; the server advances to the
// next slot when every connected player has picked (or the per-slot timer
// elapses). At the end, total squad OVR decides the winner.

export type FutPhase = "lobby" | "picking" | "finished";

/**
 * Fixed 4-3-3 slot labels the client renders in order. Position codes map to
 * the canonical `Player.pos` values in the dataset.
 */
export const FUT_4_3_3_SLOTS = [
  { label: "GK", positions: ["GK"] },
  { label: "LB", positions: ["LB", "LWB"] },
  { label: "CB", positions: ["CB"] },
  { label: "CB", positions: ["CB"] },
  { label: "RB", positions: ["RB", "RWB"] },
  { label: "CDM", positions: ["CDM", "CM"] },
  { label: "CM", positions: ["CM", "CAM"] },
  { label: "CAM", positions: ["CAM", "CM"] },
  { label: "LW", positions: ["LW", "LM"] },
  { label: "ST", positions: ["ST", "CF"] },
  { label: "RW", positions: ["RW", "RM"] },
] as const;

export interface FutRound {
  slotIndex: number; // 0..10
  slotLabel: string; // e.g. "CB"
  deadline: number;
  /** options per roomPlayer.id: the 5 players they can choose from this slot. */
  options: Record<string, Player[]>;
}

export interface FutState {
  phase: FutPhase;
  players: Record<string, RoomPlayer>;
  round: FutRound | null;
  /** picks per roomPlayer.id, length = slotIndex (grows as slots complete). */
  picks: Record<string, Player[]>;
  /** Number of slots to draft (always 11 for 4-3-3, kept configurable for future formations). */
  slotCount: number;
  hostId: string | null;
}

export type FutClientMessage =
  | { type: "join"; name: string }
  | { type: "start" }
  | { type: "pick"; playerId: string };

export type FutServerMessage =
  | { type: "state"; state: FutState }
  | { type: "error"; message: string };

// ---- Who Am I? (game C) ----
//
// Server picks a mystery player each round. Clues reveal one at a time on a
// fixed interval (e.g. every 15s). Players submit a guessed name via autocomplete;
// first correct guess wins the round, later-correct guesses get partial credit.

export type WhoPhase = "lobby" | "guessing" | "roundEnd" | "finished";

/** One clue that drips to players during the guessing phase. */
export interface WhoClue {
  /** Category shown as a label (e.g. "Nation"). */
  label: string;
  /** The revealed value. */
  value: string;
  /** When this clue becomes visible to clients (epoch ms). */
  revealAt: number;
}

export interface WhoRound {
  index: number;
  mysteryId: string; // stripped from wire during guessing
  clues: WhoClue[]; // length up to 6; `revealAt` per clue
  deadline: number;
  /** playerId → array of guess attempts (playerId strings from the dataset). */
  guesses: Record<string, { guessedPlayerId: string; guessedName: string; correct: boolean; atMs: number }[]>;
  /** Order of first-correct for scoring. */
  winners: string[];
}

export interface WhoState {
  phase: WhoPhase;
  players: Record<string, RoomPlayer>;
  round: WhoRound | null;
  roundCount: number;
  revealedMysteryName: string | null;
  revealedMysteryImg: string | null;
  hostId: string | null;
}

export type WhoClientMessage =
  | { type: "join"; name: string }
  | { type: "start"; roundCount: number }
  | { type: "guess"; playerId: string }
  | { type: "next" };

export type WhoServerMessage =
  | { type: "state"; state: WhoState }
  | { type: "error"; message: string };

// ---- Squad Number Draft (game A) ----
//
// Turn-based, snake-ordered draft that builds a 4-3-3 XI. Each player drafts
// exactly 1 GK, 4 defenders, 3 midfielders, and 3 forwards — in that order, in
// four position-gated phases. Within a phase, picks are made by calling a
// shirt number 1–99; the server resolves the number to a random real player
// who plays that position AND wears that shirt.
//
// The jersey-number pool resets at the start of each phase so that common
// numbers (e.g. #10) can be used across GK / DEF / MID / FWD without
// collisions. A number is locked within a phase only.

export type SdPhase = "lobby" | "drafting" | "finished";

/** Position group each phase targets. */
export type SdPosPhase = "GK" | "DEF" | "MID" | "FWD";

/** How many picks each player makes per phase (must sum to 11 for 4-3-3). */
export const SD_PHASE_QUOTAS: Record<SdPosPhase, number> = {
  GK: 1,
  DEF: 4,
  MID: 3,
  FWD: 3,
};

/** Ordered sequence of phases. */
export const SD_PHASE_ORDER: readonly SdPosPhase[] = ["GK", "DEF", "MID", "FWD"];

/** Allowed `Player.pos` values per phase. */
export const SD_PHASE_POSITIONS: Record<SdPosPhase, readonly string[]> = {
  GK: ["GK"],
  DEF: ["CB", "LB", "RB", "LWB", "RWB"],
  MID: ["CDM", "CM", "CAM", "LM", "RM"],
  FWD: ["ST", "CF", "LW", "RW", "LF", "RF"],
};

export interface SdPick {
  jerseyNumber: number;
  player: Player; // the real player assigned to that number
  pickedAtMs: number;
  /** Which position phase this pick belongs to. */
  posPhase: SdPosPhase;
}

export interface SdState {
  phase: SdPhase;
  players: Record<string, RoomPlayer>;
  /** turn order — roomPlayer ids, determined at draft start. */
  order: string[];
  /** whose turn it is right now (roomPlayer.id). null in lobby/finished. */
  currentTurn: string | null;
  /** deadline for the current pick (epoch ms). */
  deadline: number | null;
  /** picks per roomPlayer.id — grows one per turn up to 11. */
  picks: Record<string, SdPick[]>;
  /** jersey numbers taken in the current phase (reset between phases). */
  takenNumbers: number[];
  /** Current position phase — null in lobby/finished. */
  posPhase: SdPosPhase | null;
  /**
   * Jersey numbers that have at least one valid candidate for the current
   * phase (computed from the dataset on phase start, excludes already-drafted
   * players). Clients should disable numbers outside this pool. Empty in
   * lobby/finished.
   */
  phaseNumberPool: number[];
  hostId: string | null;
}

export type SdClientMessage =
  | { type: "join"; name: string }
  | { type: "start" }
  | { type: "pick"; jerseyNumber: number };

export type SdServerMessage =
  | { type: "state"; state: SdState }
  | { type: "error"; message: string };
