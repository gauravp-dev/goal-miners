# Goal Miners — Platform Roadmap

This doc captures where Goal Miners is going beyond "five party games in a
browser." The goal: turn a fun one-night-stand into a daily ritual people
return to and tell their friends about. Inspired by what makes Wordle, Who
Are Ya?, Poeltl, FPL, Duolingo, and FUT itself sticky.

Nothing in this document is implemented yet (except where noted under
"Already shipped"). It's a sequenced plan you can pick from.

---

## Already shipped (April 2026)

- Five live games (Higher or Lower, Playerdle, FUT Draft, Who Am I?, Squad
  Number Draft) with PartyKit-backed multiplayer rooms.
- 10,654-player FC26 dataset baked into the worker.
- **Pick-quality rules** (`src/lib/tier-pools.ts`):
  - OVR tier filtering per game (e.g., Playerdle mystery is from the ≥82
    pool, FUT Draft slots guarantee a 1/2/2 mix of elite/known/floor cards).
  - League-prestige weighting (Top 5 European leagues × 5, major secondary
    × 2, notable × 1, long tail × 0.3) — every "random" player draw is
    routed through `weightedPick` so recognizable names dominate.
- Animated landing page with hero portraits.

---

## Why people will keep coming back — the design principles

**Daily ritual + streak.** Wordle's whole moat is one puzzle a day plus a
visible streak counter. Loss aversion (don't break the streak) is more
motivating than reward seeking (get a high score). Who Are Ya? built an
entire football audience on exactly this loop.

**Shareable spoiler-free results.** The reason Wordle went viral isn't the
gameplay; it's the yellow/green grid people couldn't help posting. Our
Playerdle attribute grid (nation flag / league crest / club / position /
age arrow / OVR arrow) is *already* the perfect Wordle clone format.

**Loss-aversion safety valves.** Streak freezes (Duolingo) let users miss a
day without churning. Without them, one bad week kills the user.

**Identity worth building.** Sporcle figured out that a profile page with
your rank, badges, quiz count is worth more than any single quiz. People
return to fill the profile, not to play.

**Collectibles with asymmetric drops.** FUT pack-opening dopamine works
because of rarity (1% Icon pulls). Cosmetic-only collectibles pinned to a
profile drive return visits even when the user doesn't feel like playing.

**Leagues of a size you can win.** Duolingo puts you in a bucket of 30
weekly. FPL mini-leagues with friends. Per-friend-group leaderboards >
global leaderboards for retention.

**Seasons end.** Reset every 4–8 weeks. Late adopters can grind to the top;
old-timers earn permanent "Season 3 — World Class" badges. Without resets,
churn accelerates as the top becomes unreachable.

**Cross-game meta-progression.** All XP feeds the same profile. Playing
Playerdle should level up cosmetics usable in FUT Draft. This is what makes
the games feel like a *platform* and not a homepage of disconnected
minigames.

---

## The pillars

### Pillar 1 — Identity layer

Anonymous handle assigned on first visit (`goalminers.app/u/gaurav-7f3`),
stored in `localStorage`. URL structure means we can later upgrade
anonymous handles to authenticated accounts without breaking the URL.

**Profile page shows:**
- Current streak per game; longest streak ever
- Total games played
- Best Playerdle solve (fewest guesses)
- Average FUT Draft squad rating
- Collected Icons display case (see Pillar 6)
- Badges from past seasons / themed weeklies

**Tech delta:** localStorage only for v1. Adds a `useProfile` hook + a
`/u/[handle]` page. No backend.

### Pillar 2 — Daily Challenge

One Playerdle and one Who Am I? per day, identical for every player on
Earth (deterministic seed from the date). Solving awards baseline XP;
fewer-guesses = bonus XP. Miss a day → streak resets (unless freeze).

**Why it matters:** Single-player ritual content that *pulls* people back
to the multiplayer party games. Who Are Ya? built its entire audience on
this loop without any multiplayer at all.

**Tech delta:** New page `/daily`. Server endpoint `GET /api/daily` returns
`{ playerdleId, whoAmIId }` derived from `hash(date)`. Local guess history
in localStorage for v1; sync to DB later.

### Pillar 3 — Streaks + Freezes

Per-game daily streak counter. 2 freezes auto-granted per month (Duolingo
pattern). Prominent streak display on landing page when the user returns.

**Tech delta:** Profile object grows `{ streak, longestStreak, freezes,
lastPlayedDate }` per game. Cron-style check on first daily-challenge
attempt of each day.

### Pillar 4 — XP + Miner Levels

Every game awards XP (with daily cap to prevent grinders dominating).
Levels unlock cosmetics: profile banner colors, FUT-style card frames,
celebration animations. Pure cosmetics, no gameplay impact.

**XP formula draft:**
- Higher or Lower: 2 XP per correct, +5 for full clean sweep
- Playerdle: 10 XP solved + (4 - guesses) × 5 bonus
- FUT Draft: 5 XP for placement, +20 if you win the room
- Who Am I?: 5 XP per correct guess, +10 if you're first
- Squad Draft: 3 XP per pick, +25 win bonus

Daily cap: 200 XP from non-Daily-Challenge play.

### Pillar 5 — Seasons

6-week seasons. Global leaderboard + private friends-league leaderboards.
Top 1% globally earn a permanent season badge ("Season 3 — World Class").
Reset spikes engagement and creates re-entry points.

### Pillar 6 — Collectible Icons (your idea)

Every 5 completed games = 1 Scout Pack. Pack opens with FUT-style walkout
animation. Drop rates:

| Tier | Chance | Content |
|---|---|---|
| Common | 60% | Cosmetic gold-card variant of an active player |
| Rare | 25% | Animated TOTW-style variant |
| Epic | 10% | Animated TOTY-style variant |
| **Icon** | 5% | A legend (Pelé, Maradona, Zidane, Henry, Ronaldinho, Bobby Moore, Cruyff, Cafú…) |

Duplicate cards auto-convert to currency that buys *targeted* packs (e.g.
"Brazilian Icons pack").

**Why this is critical:** the display case on your profile becomes the
status symbol. People return when they don't feel like playing because
they want to open packs.

**Dataset note:** the current `players.sample.json` has zero Icon
players — it's a current-roster CSV only. To ship this pillar we need to
import a separate Icons dataset. See "Adding Icons to the dataset" below.

### Pillar 7 — Friends

Invite-link friend groups (3–20 people). Private leaderboard per group
for daily challenges. Push-style notifications when a friend beats your
streak record or unpacks a new Icon. Social pressure from a 4-person
group beats anonymous global leaderboards for retention.

### Pillar 8 — Themed weekly challenges

"This week: solve 5 Playerdles where the answer plays in Serie A." Earn
a themed badge. Gives the team a weekly content lever without writing new
code — just config.

---

## Suggested ship order

The hard cliff is between Phase 1 and Phase 2: PartyKit rooms are
ephemeral and there's no user table. To go further than Phase 1 you need
~1 day of backend plumbing (DB + auth).

### Phase 1 — Zero-backend hooks

Ships in days, no infra changes. Buys ~70% of the perceived stickiness.

- Anonymous handle in localStorage
- Local-only streak counter
- Wordle-style emoji grid for Playerdle results (`🟩⬛⬛🟨⬛⬛`)
- Share button that copies the grid to clipboard
- Profile page rendering localStorage stats
- Icons dataset merged into `players.sample.json` (cosmetic only — no
  pack mechanic yet, just shows up in Playerdle/Who Am I? as solvable
  legends)

### Phase 2 — Real accounts

DB + auth wall. Choose: Supabase or Neon + NextAuth or Clerk. ~1 day.

- Persistent user accounts (anonymous handles can be claimed)
- Daily challenge service (`hash(date)` → puzzle ID)
- Global daily leaderboard
- Streak persists across devices

### Phase 3 — Progression

- XP system + Miner Levels
- Cosmetic unlocks tied to level
- First versions of celebration animations

### Phase 4 — Collectibles

- Scout Packs after every N games
- Icon pull mechanics with rarity tiers
- Duplicate → currency conversion
- Display case on profile

### Phase 5 — Social + Seasons

- Friend groups with invite links
- Friends-league leaderboards
- 6-week seasons with permanent badges
- Themed weekly challenges

---

## Adding Icons to the dataset (when you're ready)

The community FUT Icons CSV on Kaggle ("FIFA Icons" or "FUT Heroes &
Icons") gives you the rosters. Suggested merge:

1. Drop `raw/fc26_icons.csv` next to `raw/fc26_players.csv`.
2. Extend `scripts/build-dataset.ts` to read the icons CSV and emit
   records with:
   - `league: "FUT Icons"` (synthetic — give it weight 6.0 in
     `tier-pools.ts` if you want them to show up frequently in Playerdle)
   - `id: "icon-" + slug(name)` (prefix avoids collisions with active-roster IDs)
   - `club: null` (Icons aren't on a club)
   - All other fields mapped through normally
3. The five party games will pick them up automatically — they all read
   from the same `usablePlayers()` pool and respect league weights.

The only code that may need a tweak is `who-am-i.ts`'s `League` clue, which
would say "FUT Icons" — fine, makes the answer more identifiable.

---

## Risks and unknowns

- **PartyKit billing at scale.** Daily challenges with global participation
  may move from PartyKit-room-bound traffic to shared-state traffic. If
  daily players exceed PartyKit's free tier, evaluate moving the daily
  service off PartyKit (it doesn't need realtime — just a simple
  `GET /api/daily/[date]`).
- **Anti-cheat for daily leaderboards.** Currently mystery IDs are
  sanitized from the WS payload during play. For a global daily, you'd
  want server-side verification of solve time + guess count, since the
  client can be inspected.
- **Username squatting.** Anonymous handles are auto-generated; user-chosen
  handles will need uniqueness checks and a profanity filter.

---

## Quick prioritisation principle

When in doubt, ship anything that adds a *visible counter* the user wants
to grow (streak, XP, Icons collected, season rank) and anything that lets
them *show off* (shareable grid, profile URL, badges). Avoid features that
require sustained skill investment without visible progress.
