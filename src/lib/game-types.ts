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
