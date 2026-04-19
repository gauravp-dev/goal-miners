# Goal Miners

Browser-based multiplayer football party games for you and 2–3 friends. Everyone joins a room from their own device (phone or laptop), no downloads, no accounts. All gameplay is powered by the **EA FC 26 player dataset** — 10,654 real footballers with overalls, positions, clubs, nations, and shirt numbers.

It works equally well for solo play, a group-chat night in, or a Twitch/OBS stream where the host shares their browser and friends join on their phones.

---

## The lineup

| Game | What you do | Length |
|---|---|---|
| **Higher or Lower** | Two players on screen. Is the next one rated higher or lower? First streak-break loses. | 5–8 min |
| **Playerdle** | Wordle for footballers. Eight tries; each guess reveals colour-coded clues (nation, league, club, position, age, OVR). | 4–6 min |
| **FUT Draft** | Build a 4-3-3 from 5-card shortlists per slot. Everyone picks simultaneously under a 25s timer. Highest total squad OVR wins. | 8–12 min |
| **Who Am I?** | A mystery player and six drip-fed clues (one every 15s). First correct answer wins 5 pts; later-correct get 3/2/1. | 5–8 min |
| **Squad Number Draft** | Snake-draft a 4-3-3 in four position phases (GK → DEF → MID → FWD). Call a shirt number; the server gives you a random real player who wears it. | 12–15 min |

Every match is a fresh 4-letter room code. Share the URL, friends join, play.

---

## Stack

- **Next.js 15** (App Router) + **React 18** + **TypeScript strict**
- **Tailwind CSS** + **Framer Motion** (card flips, parallax hero, tilting game cards)
- **PartyKit** — one WebSocket server class per game, authoritative state, reconnect-safe
- **`partysocket`** client with stable client IDs (localStorage UUID) so a tab reload rejoins the same seat
- Dataset: EA FC 26 community CSV → slim JSON, baked into the PartyKit worker and Next server bundle as a static import
- Hosts on **Vercel** (web) + **PartyKit Cloud** (realtime). Both have usable free tiers.

---

## Quickstart

```bash
pnpm install
cp .env.example .env.local       # optional — only needed for a custom partykit host
pnpm dev                         # next dev on :3000, partykit dev on :1999
```

Open <http://localhost:3000>, pick a game, share the room URL.

The repo ships with `public/players.sample.json` (10,654 players) so everything works out of the box — no CSV download required to play.

---

## Rebuilding the dataset

`public/players.sample.json` is committed, but you can regenerate it from a fresh EA FC 26 community CSV:

1. Grab a recent CSV from Kaggle (search "EA FC 26 player"). Put it anywhere readable.
2. Run:

   ```bash
   pnpm build-dataset /path/to/FC26_20250921.csv
   # or drop the CSV at raw/fc26_players.csv and run with no args
   ```

3. Produces `public/players.json` (full) and overwrites `public/players.sample.json` (filtered to the set the games actually use — OVR ≥ 65, with valid stats).

The normalizer lives in `scripts/build-dataset.ts`. If a new CSV uses different column names, edit the `num()` / field lookups at the top of the file.

---

## Hero images (landing page)

The landing page hero has six floating FUT-style cards of real players (Mbappé, Salah, Haaland, Bellingham, Rodri, Van Dijk). Portraits are served **locally** from `public/hero/` to dodge sofifa's hotlink block.

Before your first deploy, run:

```bash
node scripts/download-hero-images.mjs
```

It tries sofifa first (with a browser User-Agent + Referer spoof), falls back to Wikimedia Commons press photos, and writes to `public/hero/{slug}.{png|jpg}`. Commit that folder. Missing files degrade gracefully to an SVG silhouette at runtime.

---

## Deploying

### Web (Vercel)

Push to GitHub, import the repo at <https://vercel.com/new>. Set one env var before the first deploy:

```
NEXT_PUBLIC_PARTYKIT_HOST = goal-miners.<your-username>.partykit.dev
```

Vercel auto-deploys on every push to `main`.

### Realtime (PartyKit) — you must run this manually

```bash
npx partykit login          # once
pnpm deploy:party           # every time you change src/party/*.ts or shared game-types
```

**Important:** Vercel builds only the Next.js app. Any change to a party server (`src/party/*.ts`) or shared state shape in `src/lib/game-types.ts` needs a matching `pnpm deploy:party`, or the live rooms will speak the wrong protocol.

---

## Project layout

```
src/
  app/
    page.tsx                       landing page (animated hero + game grid)
    layout.tsx                     root layout, global metadata
    globals.css                    Tailwind + pitch bg + shimmer utilities
    higher-or-lower/
      page.tsx                     lobby (create/join)
      [roomId]/page.tsx            active game
    playerdle/[roomId]/page.tsx    + lobby page.tsx
    fut-draft/[roomId]/page.tsx    + lobby page.tsx
    who-am-i/[roomId]/page.tsx     + lobby page.tsx
    squad-draft/[roomId]/page.tsx  + lobby page.tsx
  components/
    PlayerCard.tsx                 FUT-style card with tier gradients, reveal, walkout glow
    CountdownTimer.tsx             circular SVG timer
    RoomHud.tsx                    room code + player list + share button
    LobbyForm.tsx                  create/join form shared across all game lobbies
    ui/                            Button, Input — minimal shadcn-style primitives
  hooks/
    usePartySocket.ts              typed WebSocket hook (reconnect, typed send)
    useClientId.ts                 stable per-browser UUID in localStorage
  lib/
    players.ts                     dataset loader + position indexes
    game-types.ts                  shared types between client and PartyKit
    rating-tiers.ts                OVR → FUT tier (bronze/silver/gold/TOTY/mystery)
    utils.ts                       cn(), shuffle, pickRandom, avatars, etc.
  party/
    higher-or-lower.ts             server for H/L rounds
    playerdle.ts                   server for the mystery-player grid
    fut-draft.ts                   server for simultaneous 4-3-3 drafting
    who-am-i.ts                    server for drip-fed clue rounds
    squad-draft.ts                 server for position-gated snake draft
public/
  players.sample.json              baked-in dataset (10,654 players)
  players.json                     gitignored; full CSV output
  hero/                            hero player portraits (run download script to populate)
scripts/
  build-dataset.ts                 CSV → trimmed JSON
  download-hero-images.mjs         one-shot downloader for hero portraits
partykit.json                      maps party names to server classes
```

---

## Adding a new game

Each game is fully self-contained. To add one:

1. **Server** — create `src/party/<your-game>.ts` exporting a `Party.Server` class. Register it in `partykit.json` under `parties` with a name that's a valid JS identifier (no hyphens):

   ```json
   "parties": { "yourgame": "src/party/your-game.ts" }
   ```

2. **Shared types** — add `Your*State`, `Your*ClientMessage`, `Your*ServerMessage` to `src/lib/game-types.ts`. Keep this file import-pure (no React/Node) so both sides can import it.

3. **Lobby + game pages** — `src/app/<your-game>/page.tsx` (lobby) and `src/app/<your-game>/[roomId]/page.tsx` (game). Use the existing `usePartySocket` hook, `useClientId` for seat identity, and `LobbyForm`/`RoomHud` components.

4. **Landing card** — add an entry to the `games` array in `src/app/page.tsx`.

The shared components (`PlayerCard`, `RoomHud`, `CountdownTimer`) and hooks (`usePartySocket`, `useClientId`) are intentionally game-agnostic — every existing game reuses them.

---

## How the state model works

Each PartyKit server class owns the full authoritative room state. Clients send typed messages (`join`, `start`, `guess`, `pick`, etc.), server mutates state, broadcasts the new state to all connections. Clients just render.

Reconnect safety: the `useClientId` hook stores a UUID in `localStorage`; that ID is passed to PartyKit as the connection ID. Reloading a tab rejoins the same seat rather than creating a ghost player. Server-side `onClose` marks the player disconnected but keeps their score/picks — they resume cleanly on reconnect.

Some games sanitize broadcast state so the client can't cheat by reading WebSocket frames (e.g. Who Am I? strips the `mysteryId` while the round is live). Look for `sanitize()` methods in the party servers.

---

## Credits

Player data derived from the EA FC 26 community dataset on Kaggle. Not affiliated with EA Sports. Built with Next.js, PartyKit, and way too many late nights watching Champions League.
