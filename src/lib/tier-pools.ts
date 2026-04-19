/**
 * Player-selection weighting.
 *
 * Every game that draws a "random" player should route the pick through
 * `weightedPick` / `weightedPickN` here instead of uniform randomness.
 * Otherwise half the dataset is OVR-65–69 unknowns from leagues nobody
 * watches and the experience suffers.
 *
 * Selection weight = ovrWeight(player) × leagueWeight(player)
 *
 * - OVR weight biases picks toward recognizable players (more famous = higher OVR).
 * - League weight biases picks toward the top leagues people actually follow.
 *
 * The combined effect: in a large pool, a Premier League 86 OVR beats a
 * Norwegian Eliteserien 76 by a factor of (5×3) / (0.3×1.3) ≈ 38×, which is
 * what we want. A Ligue 1 83 still beats a Bundesliga 71 by ~2.8×, so top
 * leagues dominate *within* OVR tiers too.
 *
 * Thresholds live here so they're tweakable from one place.
 */

import type { Player } from "./game-types";

// -------- OVR tiers --------

/** Global superstars: typically Ballon d'Or-level. ~95 players in the dataset. */
export const OVR_ELITE = 85;
/** Highly recognizable, big-club regulars. ~500 players. */
export const OVR_STAR = 82;
/** Starters for top-flight clubs. ~1,500 players. */
export const OVR_KNOWN = 78;
/** Solid first-team player. ~2,900 players. */
export const OVR_SOLID = 75;
/** Minimum OVR we'll show at all (higher than `usablePlayers()`'s 65 floor). */
export const OVR_FLOOR = 72;

// -------- League prestige tiers --------
//
// String values below MUST match the `league` field in
// public/players.sample.json. The set was inspected against a 10,654-player
// FC26 CSV on 2026-04; re-verify when upgrading the dataset.

/**
 * S-tier (weight 5.0): the Big Five European leagues. Home of almost every
 * globally recognizable footballer.
 */
const S_TIER: readonly string[] = [
  "Premier League",
  "La Liga",
  "Serie A",
  "Bundesliga",
  "Ligue 1",
];

/**
 * A-tier (weight 2.0): strong secondary competitions with plenty of
 * international names (Saudi, MLS, Championship, Portugal, Netherlands,
 * Turkey). Note: the FC26 dataset labels BOTH the Belgian Jupiler Pro and
 * the Saudi Pro League as "Pro League" — so this entry doubles up.
 */
const A_TIER: readonly string[] = [
  "Championship",
  "La Liga 2",
  "Serie B",
  "2. Bundesliga",
  "Ligue 2",
  "Primeira Liga",
  "Eredivisie",
  "Major League Soccer",
  "Pro League", // Jupiler Pro (Belgium) + Saudi Pro League
  "Süper Lig",
];

/**
 * B-tier (weight 1.0): notable domestic leagues that occasionally produce
 * household names but mostly contain less-known players.
 */
const B_TIER: readonly string[] = [
  "Super League", // Swiss + Chinese — dataset conflates them
  "League One",
  "Série A", // Brazilian (note accented É, distinct from Italian "Serie A")
  "Liga Profesional de Fútbol", // Argentine
  "Eliteserien",
  "Ekstraklasa",
  "Allsvenskan",
  "Superliga",
  "3. Liga",
  "Liga I",
];

// Lookup map for O(1) check.
const LEAGUE_WEIGHT_MAP: Record<string, number> = (() => {
  const m: Record<string, number> = {};
  for (const l of S_TIER) m[l] = 5.0;
  for (const l of A_TIER) m[l] = 2.0;
  for (const l of B_TIER) m[l] = 1.0;
  return m;
})();

/** Weight 0.3 for any league not explicitly listed (long tail, obscure comps). */
const DEFAULT_LEAGUE_WEIGHT = 0.3;

export function leagueWeight(player: Player): number {
  if (!player.league) return DEFAULT_LEAGUE_WEIGHT;
  return LEAGUE_WEIGHT_MAP[player.league] ?? DEFAULT_LEAGUE_WEIGHT;
}

// -------- OVR weight curve --------
//
// Scaling is gentle so league weight still matters. Tuning principle: an
// 85-OVR player is ~3× as likely to surface as a 75-OVR player with the same
// league — enough to feel less random without making the game predictable.

export function ovrWeight(player: Player): number {
  const o = player.ovr;
  if (o >= OVR_ELITE) return 4.0;
  if (o >= OVR_STAR) return 3.0;
  if (o >= OVR_KNOWN) return 2.0;
  if (o >= OVR_SOLID) return 1.3;
  if (o >= OVR_FLOOR) return 1.0;
  return 0.5; // still allowed in pools that don't filter OVR, just rarely
}

export function selectionWeight(player: Player): number {
  return ovrWeight(player) * leagueWeight(player);
}

// -------- Weighted samplers --------

/**
 * Pick one player from `pool` with probability proportional to its
 * `selectionWeight`. `pool` must be non-empty.
 */
export function weightedPick<T extends Player>(pool: readonly T[], rng: () => number = Math.random): T {
  if (pool.length === 0) throw new Error("weightedPick: empty pool");
  if (pool.length === 1) return pool[0]!;

  let total = 0;
  for (const p of pool) total += selectionWeight(p);
  // Degenerate case (all weights 0): fall back to uniform.
  if (total <= 0) return pool[Math.floor(rng() * pool.length)]!;

  let r = rng() * total;
  for (const p of pool) {
    r -= selectionWeight(p);
    if (r <= 0) return p;
  }
  return pool[pool.length - 1]!;
}

/**
 * Pick `n` distinct players from `pool` without replacement, weighted.
 * If `pool.length < n`, returns the full shuffled pool.
 */
export function weightedPickN<T extends Player>(pool: readonly T[], n: number, rng: () => number = Math.random): T[] {
  if (n <= 0) return [];
  if (pool.length <= n) {
    // fall back to a uniform shuffle — can't be picky when you have to take everyone.
    const copy = [...pool];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [copy[i], copy[j]] = [copy[j]!, copy[i]!];
    }
    return copy;
  }
  const remaining = [...pool];
  const picked: T[] = [];
  while (picked.length < n && remaining.length > 0) {
    const chosen = weightedPick(remaining, rng);
    picked.push(chosen);
    const idx = remaining.indexOf(chosen);
    if (idx >= 0) remaining.splice(idx, 1);
  }
  return picked;
}

/**
 * Pick two *distinct* players with weighted sampling. Used by Higher or Lower
 * where we also want the pair to have different OVRs to avoid trivial ties.
 */
export function weightedPickPair<T extends Player>(pool: readonly T[], rng: () => number = Math.random): [T, T] {
  if (pool.length < 2) throw new Error("weightedPickPair: need at least 2 items");
  const a = weightedPick(pool, rng);
  let b = weightedPick(pool, rng);
  let tries = 0;
  while ((b.id === a.id || b.ovr === a.ovr) && tries < 15) {
    b = weightedPick(pool, rng);
    tries++;
  }
  return [a, b];
}
