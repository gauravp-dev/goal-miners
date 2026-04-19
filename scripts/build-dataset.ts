/**
 * Preprocesses the raw Kaggle EA FC 26 CSV into the slim JSON the app ships.
 *
 * Run:   pnpm build-dataset [optional-path-to-csv]
 *
 * Writes two files:
 *   public/players.json          full dataset, for any future client-fetch use
 *   public/players.sample.json   same data, overwrites the starter 30-player file.
 *                                This is the file baked into the PartyKit worker
 *                                and Next server bundles via static import.
 */
import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import type { Player } from "../src/lib/game-types";

// Candidate input paths (first arg wins, then common defaults).
const candidateInputs = [
  process.argv[2],
  "raw/fc26_players.csv",
  "raw/FC26_20250921.csv",
  "FC26_20250921.csv",
  "../FC26_20250921.csv",
  "../../FC26_20250921.csv",
].filter(Boolean) as string[];

const inputPath = candidateInputs.find((p) => fs.existsSync(p));
if (!inputPath) {
  console.error(
    "Could not find the CSV. Tried:\n  " +
      candidateInputs.join("\n  ") +
      "\nPass the path explicitly: pnpm build-dataset /path/to/FC26_20250921.csv",
  );
  process.exit(1);
}

console.log(`Reading ${inputPath} …`);
const raw = fs.readFileSync(inputPath, "utf8");

const parsed = Papa.parse<Record<string, string>>(raw, {
  header: true,
  skipEmptyLines: true,
});
if (parsed.errors.length) {
  console.warn(
    `Parsed with ${parsed.errors.length} warnings (first 3):`,
    parsed.errors.slice(0, 3),
  );
}
const rows = parsed.data;
console.log(`Parsed ${rows.length} rows.`);

const num = (v: string | undefined): number | null => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const str = (v: string | undefined): string | null => {
  if (v === undefined || v === null || v === "") return null;
  return v.trim();
};

function buildImage(r: Record<string, string>): string | null {
  const explicit = str(r["player_face_url"]);
  if (explicit) return explicit;
  const id = num(r["player_id"]);
  if (!id) return null;
  // SoFIFA convention: /players/<first-3>/<last-3>/<version>_<size>.png
  const idStr = String(id).padStart(6, "0");
  return `https://cdn.sofifa.net/players/${idStr.slice(0, 3)}/${idStr.slice(3)}/26_120.png`;
}

function normalize(r: Record<string, string>): Player | null {
  const ovr = num(r["overall"]);
  const pid = num(r["player_id"]);
  if (ovr === null || pid === null) return null;

  const positions = str(r["player_positions"]) ?? "";
  const primary = positions.split(",")[0]?.trim() || "SUB";

  return {
    id: String(pid),
    name: str(r["short_name"]) ?? str(r["long_name"]) ?? "Unknown",
    pos: primary,
    ovr,
    club: str(r["club_name"]),
    league: str(r["league_name"]),
    nation: str(r["nationality_name"]) ?? "Unknown",
    age: num(r["age"]) ?? 0,
    pace: num(r["pace"]),
    sho: num(r["shooting"]),
    pas: num(r["passing"]),
    dri: num(r["dribbling"]),
    def: num(r["defending"]),
    phy: num(r["physic"]),
    img: buildImage(r),
    val: num(r["value_eur"]),
  };
}

const MIN_OVR = 65;
const players = rows
  .map(normalize)
  .filter((p): p is Player => p !== null && p.ovr >= MIN_OVR);

// Dedupe by id — the CSV has multiple rows per player in FC/FIFA updates.
// Keep the highest OVR record per player.
const byId = new Map<string, Player>();
for (const p of players) {
  const existing = byId.get(p.id);
  if (!existing || p.ovr > existing.ovr) byId.set(p.id, p);
}
const unique = Array.from(byId.values()).sort((a, b) => b.ovr - a.ovr);

console.log(`Kept ${unique.length} unique players (OVR ≥ ${MIN_OVR}).`);

const outDir = "public";
fs.mkdirSync(outDir, { recursive: true });

// 1. Big JSON for future client-fetch use.
const fullPath = path.join(outDir, "players.json");
fs.writeFileSync(fullPath, JSON.stringify(unique));
console.log(
  `Wrote ${fullPath} (${(fs.statSync(fullPath).size / 1_000_000).toFixed(2)} MB).`,
);

// 2. Overwrite the baked-in sample so the static import in src/lib/players.ts
//    picks up the real data. Pretty-printed (gzipped on transfer anyway).
const samplePath = path.join(outDir, "players.sample.json");
fs.writeFileSync(samplePath, JSON.stringify(unique));
console.log(
  `Overwrote ${samplePath} (${(fs.statSync(samplePath).size / 1_000_000).toFixed(2)} MB). Restart dev server.`,
);
