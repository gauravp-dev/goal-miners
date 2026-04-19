// Quick empirical check: run the exact Playerdle/WhoAmI/H-o-L weighting
// logic against the real dataset and report the distribution of picks.
// Re-run whenever you change tier-pools.ts thresholds.
//
//   node scripts/verify-weighting.mjs
//
// Not part of the build — just a local verification tool.

import fs from "node:fs";
import path from "node:path";

const players = JSON.parse(
  fs.readFileSync(path.resolve("public/players.sample.json"), "utf8"),
);

// Mirror tier-pools.ts exactly.
const OVR_ELITE = 85;
const OVR_STAR = 82;
const OVR_KNOWN = 78;
const OVR_SOLID = 75;
const OVR_FLOOR = 72;

const S_TIER = new Set([
  "Premier League",
  "La Liga",
  "Serie A",
  "Bundesliga",
  "Ligue 1",
]);
const A_TIER = new Set([
  "Championship", "La Liga 2", "Serie B", "2. Bundesliga", "Ligue 2",
  "Primeira Liga", "Eredivisie", "Major League Soccer", "Pro League", "Süper Lig",
]);
const B_TIER = new Set([
  "Super League", "League One", "Série A", "Liga Profesional de Fútbol",
  "Eliteserien", "Ekstraklasa", "Allsvenskan", "Superliga", "3. Liga", "Liga I",
]);

function leagueWeight(p) {
  if (!p.league) return 0.3;
  if (S_TIER.has(p.league)) return 5.0;
  if (A_TIER.has(p.league)) return 2.0;
  if (B_TIER.has(p.league)) return 1.0;
  return 0.3;
}
function ovrWeight(p) {
  if (p.ovr >= OVR_ELITE) return 4.0;
  if (p.ovr >= OVR_STAR) return 3.0;
  if (p.ovr >= OVR_KNOWN) return 2.0;
  if (p.ovr >= OVR_SOLID) return 1.3;
  if (p.ovr >= OVR_FLOOR) return 1.0;
  return 0.5;
}
function selectionWeight(p) { return ovrWeight(p) * leagueWeight(p); }

function weightedPick(pool) {
  const total = pool.reduce((s, p) => s + selectionWeight(p), 0);
  let r = Math.random() * total;
  for (const p of pool) {
    r -= selectionWeight(p);
    if (r <= 0) return p;
  }
  return pool[pool.length - 1];
}

function tierOf(p) {
  if (!p.league) return "C (long tail)";
  if (S_TIER.has(p.league)) return "S (Top 5)";
  if (A_TIER.has(p.league)) return "A (major secondary)";
  if (B_TIER.has(p.league)) return "B (notable)";
  return "C (long tail)";
}

function simulate(label, poolFilter, N = 20000) {
  const pool = players.filter(poolFilter);
  const tierCount = {};
  const leagueCount = {};
  for (let i = 0; i < N; i++) {
    const p = weightedPick(pool);
    tierCount[tierOf(p)] = (tierCount[tierOf(p)] ?? 0) + 1;
    leagueCount[p.league ?? "(none)"] = (leagueCount[p.league ?? "(none)"] ?? 0) + 1;
  }
  console.log(`\n=== ${label} (pool size ${pool.length}, ${N} samples) ===`);
  const order = ["S (Top 5)", "A (major secondary)", "B (notable)", "C (long tail)"];
  for (const t of order) {
    const n = tierCount[t] ?? 0;
    console.log(`  ${t.padEnd(22)} ${(100 * n / N).toFixed(1)}%`);
  }
  const top = Object.entries(leagueCount).sort((a, b) => b[1] - a[1]).slice(0, 7);
  console.log(`  top leagues:`);
  for (const [lg, n] of top) {
    console.log(`    ${((100 * n) / N).toFixed(1).padStart(5)}%  ${lg}`);
  }
}

simulate("Playerdle / Who Am I? (≥82 pool)", (p) => p.ovr >= OVR_STAR);
simulate("Higher or Lower (≥75 outfield pool)", (p) =>
  p.ovr >= OVR_SOLID && p.pos !== "GK" && p.pace != null);
simulate("Squad Number Draft (≥72 candidates)", (p) => p.ovr >= OVR_FLOOR);
