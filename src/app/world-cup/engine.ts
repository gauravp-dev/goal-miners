/* =========================================================================
   World Cup 2026 — bracket engine, following the official FIFA format.

   Group stage: the user ranks 1st/2nd/3rd in every group. Top two advance;
   the user then selects the 8 best third-placed teams (per the regulations,
   the 8 best thirds by record complete the Round of 32 field).

   Knockouts: the official match plan (matches 73–88), including the
   group constraints on each third-place slot. Which qualified third lands
   in which slot is resolved by constraint matching, mirroring FIFA's
   495-combination allocation table. Every knockout winner is the user's
   pick — nothing is decided for them.
   ========================================================================= */
import { GROUPS, type Team } from "./data";

export type Picks = Record<string, string>;
/** group name -> ordered codes of the user's 1st/2nd/3rd picks (0–3 long). */
export type GroupRanks = Record<string, string[]>;

export type Slot =
  | { kind: "winner"; group: string }
  | { kind: "runner"; group: string }
  | { kind: "third"; allowed: string[] };

export type Match = {
  id: string;
  /** Official FIFA match number (73–88 in the R32, 104 = final). */
  no: number;
  a: Team | null;
  b: Team | null;
  aHint: string;
  bHint: string;
};
export type Rounds = { r32: Match[]; r16: Match[]; qf: Match[]; sf: Match[]; final: Match[] };

export const byStr = (a: Team, b: Team) =>
  b.strength - a.strength || a.code.localeCompare(b.code);

export const TEAM_BY_CODE: Record<string, Team> = Object.fromEntries(
  GROUPS.flatMap((g) => g.teams.map((t) => [t.code, t]))
);
export const GROUP_OF: Record<string, string> = Object.fromEntries(
  GROUPS.flatMap((g) => g.teams.map((t) => [t.code, g.name]))
);

/* ------------------- official Round-of-32 match plan -------------------- */
/* Source: FIFA match schedule (matches 73–88). Third-place slots list the
   groups that third can come from. */
const W = (group: string): Slot => ({ kind: "winner", group });
const RU = (group: string): Slot => ({ kind: "runner", group });
const T = (...allowed: string[]): Slot => ({ kind: "third", allowed });

export const R32_PLAN: { no: number; a: Slot; b: Slot }[] = [
  { no: 73, a: RU("A"), b: RU("B") },
  { no: 74, a: W("E"), b: T("A", "B", "C", "D", "F") },
  { no: 75, a: W("F"), b: RU("C") },
  { no: 76, a: W("C"), b: RU("F") },
  { no: 77, a: W("I"), b: T("C", "D", "F", "G", "H") },
  { no: 78, a: RU("E"), b: RU("I") },
  { no: 79, a: W("A"), b: T("C", "E", "F", "H", "I") },
  { no: 80, a: W("L"), b: T("E", "H", "I", "J", "K") },
  { no: 81, a: W("D"), b: T("B", "E", "F", "I", "J") },
  { no: 82, a: W("G"), b: T("A", "E", "H", "I", "J") },
  { no: 83, a: RU("K"), b: RU("L") },
  { no: 84, a: W("H"), b: RU("J") },
  { no: 85, a: W("B"), b: T("E", "F", "G", "I", "J") },
  { no: 86, a: W("J"), b: RU("H") },
  { no: 87, a: W("K"), b: T("D", "E", "I", "J", "L") },
  { no: 88, a: RU("D"), b: RU("G") },
];

/* Display order for the split bracket tree. With this ordering, adjacent
   pairs feed the next round exactly as the official plan does:
   (74,77)→89 (73,75)→90 (83,84)→93 (81,82)→94 → (89,90)→97 (93,94)→98 → 101
   (76,78)→91 (79,80)→92 (86,88)→95 (85,87)→96 → (91,92)→99 (95,96)→100 → 102
   Final: 104 = W101 v W102. */
export const R32_DISPLAY_ORDER = [74, 77, 73, 75, 83, 84, 81, 82, 76, 78, 79, 80, 86, 88, 85, 87];
const ROUND_NOS = {
  r16: [89, 90, 93, 94, 91, 92, 95, 96],
  qf: [97, 98, 99, 100],
  sf: [101, 102],
  final: [104],
};

/* --------------------- third-place slot allocation ---------------------- */
/** Assign the 8 selected thirds (by their group letter) to the 8 constrained
    slots — a tiny backtracking bipartite matching, fewest-options first.
    FIFA's allocation table guarantees a solution for every combination. */
export function allocateThirds(selectedGroups: string[]): Record<number, string> | null {
  const slots = R32_PLAN.filter((m) => m.b.kind === "third").map((m) => ({
    no: m.no,
    allowed: (m.b as { allowed: string[] }).allowed.filter((g) => selectedGroups.includes(g)),
  }));
  slots.sort((a, b) => a.allowed.length - b.allowed.length);
  const used = new Set<string>();
  const out: Record<number, string> = {};
  const place = (i: number): boolean => {
    if (i === slots.length) return true;
    for (const g of slots[i].allowed) {
      if (used.has(g)) continue;
      used.add(g);
      out[slots[i].no] = g;
      if (place(i + 1)) return true;
      used.delete(g);
      delete out[slots[i].no];
    }
    return false;
  };
  return place(0) ? out : null;
}

/* --------------------------- bracket build ------------------------------ */
function slotHint(s: Slot): string {
  if (s.kind === "winner") return `Winner ${s.group}`;
  if (s.kind === "runner") return `Runner-up ${s.group}`;
  return `3rd · ${s.allowed.join("/")}`;
}

function resolveSlot(
  s: Slot,
  ranks: GroupRanks,
  thirdByMatch: Record<number, string> | null,
  matchNo: number,
  thirdsByGroup: Record<string, Team>
): Team | null {
  if (s.kind === "winner") {
    const code = ranks[s.group]?.[0];
    return code ? TEAM_BY_CODE[code] : null;
  }
  if (s.kind === "runner") {
    const code = ranks[s.group]?.[1];
    return code ? TEAM_BY_CODE[code] : null;
  }
  if (!thirdByMatch) return null;
  const g = thirdByMatch[matchNo];
  return g ? (thirdsByGroup[g] ?? null) : null;
}

export function winnerOf(match: Match | undefined, picks: Picks): Team | null {
  if (!match || !match.a || !match.b) return null;
  const pick = picks[match.id];
  if (pick === match.a.code) return match.a;
  if (pick === match.b.code) return match.b;
  return null;
}

export function computeBracket(ranks: GroupRanks, thirds: string[], picks: Picks) {
  // thirds chosen by the user, keyed by their group
  const thirdsByGroup: Record<string, Team> = {};
  thirds.forEach((code) => {
    const g = GROUP_OF[code];
    if (g && ranks[g]?.[2] === code) thirdsByGroup[g] = TEAM_BY_CODE[code];
  });
  const selectedGroups = Object.keys(thirdsByGroup);
  const thirdByMatch = selectedGroups.length === 8 ? allocateThirds(selectedGroups) : null;

  const planByNo = Object.fromEntries(R32_PLAN.map((m) => [m.no, m]));
  const r32: Match[] = R32_DISPLAY_ORDER.map((no, i) => {
    const plan = planByNo[no];
    return {
      id: "r32-" + i,
      no,
      a: resolveSlot(plan.a, ranks, thirdByMatch, no, thirdsByGroup),
      b: resolveSlot(plan.b, ranks, thirdByMatch, no, thirdsByGroup),
      aHint: slotHint(plan.a),
      bHint: slotHint(plan.b),
    };
  });

  const build = (prev: Match[], rid: keyof typeof ROUND_NOS): Match[] => {
    const out: Match[] = [];
    for (let i = 0; i < prev.length; i += 2) {
      out.push({
        id: rid + "-" + i / 2,
        no: ROUND_NOS[rid][i / 2],
        a: winnerOf(prev[i], picks),
        b: winnerOf(prev[i + 1], picks),
        aHint: `Winner M${prev[i].no}`,
        bHint: `Winner M${prev[i + 1].no}`,
      });
    }
    return out;
  };
  const r16 = build(r32, "r16");
  const qf = build(r16, "qf");
  const sf = build(qf, "sf");
  const final = build(sf, "final");
  const rounds: Rounds = { r32, r16, qf, sf, final };

  const allMatches = [...r32, ...r16, ...qf, ...sf, ...final];
  const decided = allMatches.filter((m) => winnerOf(m, picks)).length;
  return { rounds, champion: winnerOf(final[0], picks), decided, total: allMatches.length };
}

/* ----------------------- progressive reveal helpers --------------------- */
export const ROUND_KEYS = ["r32", "r16", "qf", "sf", "final"] as const;
export type RoundKey = (typeof ROUND_KEYS)[number];
export const roundIdx = (k: RoundKey) => ROUND_KEYS.indexOf(k);

/** Matches in a round still waiting on the user's pick. */
export function roundRemaining(rounds: Rounds, picks: Picks, key: RoundKey): number {
  return rounds[key].filter((m) => !winnerOf(m, picks)).length;
}

/** The frontier: the first round not yet fully decided (final once SF is done). */
export function deepestUnlockedRound(rounds: Rounds, picks: Picks): RoundKey {
  for (const key of ROUND_KEYS) {
    if (roundRemaining(rounds, picks, key) > 0) return key;
  }
  return "final";
}

export function regionOf(id: string): "left" | "right" | "center" {
  const [r, nStr] = id.split("-");
  if (r === "final") return "center";
  const half = { r32: 8, r16: 4, qf: 2, sf: 1 }[r as "r32" | "r16" | "qf" | "sf"];
  return +nStr < half ? "left" : "right";
}

export function nextOf(id: string): string | null {
  const [r, nStr] = id.split("-");
  const map: Record<string, string> = { r32: "r16", r16: "qf", qf: "sf", sf: "final" };
  if (r === "final") return null;
  return map[r] + "-" + Math.floor(+nStr / 2);
}

/** Fill every undecided (but populated) match with the higher-rated side. */
export function simRemainingPicks(ranks: GroupRanks, thirds: string[], picks: Picks): Picks {
  const out = { ...picks };
  for (let pass = 0; pass < 5; pass++) {
    const { rounds } = computeBracket(ranks, thirds, out);
    ([rounds.r32, rounds.r16, rounds.qf, rounds.sf, rounds.final] as Match[][]).forEach((round) =>
      round.forEach((m) => {
        if (m.a && m.b && !winnerOf(m, out)) {
          out[m.id] = (m.b.strength > m.a.strength ? m.b : m.a).code;
        }
      })
    );
  }
  return out;
}

/** The champion's wins, round by round, for the recap card. */
export function championPath(ranks: GroupRanks, thirds: string[], picks: Picks, champion: Team | null) {
  if (!champion) return [];
  const { rounds } = computeBracket(ranks, thirds, picks);
  const labels: [keyof Rounds, string][] = [
    ["r32", "Round of 32"],
    ["r16", "Round of 16"],
    ["qf", "Quarter-final"],
    ["sf", "Semi-final"],
    ["final", "Final"],
  ];
  const out: { round: string; opp: Team }[] = [];
  labels.forEach(([key, lab]) => {
    const m = rounds[key].find(
      (x) => (x.a && x.a.code === champion.code) || (x.b && x.b.code === champion.code)
    );
    if (!m) return;
    const opp = m.a && m.a.code === champion.code ? m.b : m.a;
    if (opp) out.push({ round: lab, opp });
  });
  return out;
}
