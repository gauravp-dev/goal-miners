# Goal Miners

Live-stream football game platform. 3–4 friends join a room from their own devices, you screenshare on OBS. Games are powered by the EA FC 26 player dataset.

**Shipped games**

- **Higher or Lower** — two players on screen, guess whose overall is higher. Streak-based, head-to-head.
- **Playerdle** — Poeltl-style grid. Everyone races to guess the same mystery player in 8 tries.

**Stack**

- Next.js 15 (App Router) + React 18 + TypeScript
- Tailwind CSS + Framer Motion (card flips, reveals)
- PartyKit for realtime rooms (WebSocket, per-game server logic)
- Zustand for client state
- Deploys to Vercel (web) + PartyKit Cloud (realtime). Both have free tiers.

---

## Quickstart

```bash
pnpm install
cp .env.example .env.local
pnpm dev   # runs Next.js on :3000 and PartyKit on :1999 concurrently
```

Open http://localhost:3000 and create a room. Share the URL with friends on the same network (or after deploying, share the public URL).

The repo ships with a tiny `public/players.sample.json` (30 players) so everything runs out of the box. Swap it for the full dataset (~3000 players) before your first real stream — see below.

---

## Getting the full EA FC 26 dataset

1. On [kaggle.com](https://www.kaggle.com/), search for "EA FC 26 player" or "EA Sports FC 26 players". Download the latest CSV.
2. Put the CSV at `raw/fc26_players.csv` (directory is gitignored).
3. Run:

   ```bash
   pnpm build-dataset
   ```

   This produces `public/players.json` — filtered to OVR ≥ 65, trimmed to ~600KB gzipped.

4. Restart `pnpm dev`. The app auto-picks up `players.json` if present.

### Column mapping

The script in `scripts/build-dataset.ts` expects columns like `short_name`, `overall`, `player_positions`, `club_name`, `league_name`, `nationality_name`, `pace`, `shooting`, `passing`, `dribbling`, `defending`, `physic`, `player_face_url`, `age`, `value_eur`. These are the typical names in community uploads. If your CSV uses different column names, edit the `normalize()` function in that script.

---

## Deploying

### Web (Vercel)

```bash
# Push to GitHub first
git init && git add . && git commit -m "initial"
# Create a new repo on GitHub and follow its push instructions

# Then: go to https://vercel.com/new, import the repo.
# Set NEXT_PUBLIC_PARTYKIT_HOST env var (see below) before deploying.
```

### Realtime (PartyKit)

```bash
npx partykit login
pnpm deploy:party
# → outputs a URL like goal-miners.<your-username>.partykit.dev
```

Copy that host into `NEXT_PUBLIC_PARTYKIT_HOST` on Vercel's project settings. Redeploy the web app.

---

## Project layout

```
src/
  app/
    page.tsx                       landing + game picker
    higher-or-lower/
      page.tsx                     lobby (create/join)
      [roomId]/page.tsx            active game
    playerdle/
      page.tsx                     lobby
      [roomId]/page.tsx            active game
  components/
    PlayerCard.tsx                 FUT-style card w/ reveal animation
    CountdownTimer.tsx             circular SVG timer
    RoomHud.tsx                    room code + player list
    ui/                            minimal shadcn-style primitives
  hooks/
    usePartySocket.ts              typed WebSocket hook
  lib/
    players.ts                     dataset loader + position indexes
    game-types.ts                  shared types between client and PartyKit
    rating-tiers.ts                OVR → tier color
    utils.ts                       cn(), shuffle, random pair, etc.
  party/
    higher-or-lower.ts             PartyKit server for H/L rounds
    playerdle.ts                   PartyKit server for the mystery-player grid
public/
  players.sample.json              ships with repo (30 players)
  players.json                     gitignored; generated from Kaggle CSV
scripts/
  build-dataset.ts                 CSV → trimmed JSON
```

---

## Adding a new game

Each game is self-contained:

1. Add `src/party/<your-game>.ts` — a `Party.Server` class. Register it in `partykit.json` under `parties`.
2. Add `src/app/<your-game>/page.tsx` (lobby) and `[roomId]/page.tsx` (game).
3. Add shared types to `src/lib/game-types.ts` so client and server agree on message shapes.

The `PlayerCard`, `RoomHud`, `CountdownTimer`, and `usePartySocket` components/hooks are reusable across all games.

---

## Streaming notes

- During the stream the **host** opens the room URL in one tab (OBS captures it). This is the "shared view" — reveals, scores, etc.
- Each friend joins on their own phone/laptop using the room code on screen.
- Chrome + OBS "Browser source" captures the host view cleanly.
- For the reveal moments, bump your stream audio — the `<Reveal>` component emits a tick + walkout cue (see `lib/sfx.ts` — TODO, add your own audio files).
