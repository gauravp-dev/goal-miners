"use client";
import * as React from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Hash, Trophy, Clock } from "lucide-react";
import confetti from "canvas-confetti";
import { usePartySocket } from "@/hooks/usePartySocket";
import { useClientId } from "@/hooks/useClientId";
import {
  SD_PHASE_ORDER,
  SD_PHASE_QUOTAS,
} from "@/lib/game-types";
import type {
  RoomPlayer,
  SdClientMessage,
  SdPick,
  SdPosPhase,
  SdServerMessage,
  SdState,
} from "@/lib/game-types";
import { CountdownTimer } from "@/components/CountdownTimer";
import { RoomHud } from "@/components/RoomHud";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

const TURN_WINDOW_MS = 25_000;
const MIN_NUMBER = 1;
const MAX_NUMBER = 99;

const PHASE_LABELS: Record<SdPosPhase, string> = {
  GK: "Goalkeeper",
  DEF: "Defenders",
  MID: "Midfielders",
  FWD: "Forwards",
};

const PHASE_ACCENTS: Record<SdPosPhase, string> = {
  GK: "text-amber-400",
  DEF: "text-sky-400",
  MID: "text-emerald-400",
  FWD: "text-fuchsia-400",
};

const PHASE_RINGS: Record<SdPosPhase, string> = {
  GK: "border-amber-500/40 bg-amber-500/5",
  DEF: "border-sky-500/40 bg-sky-500/5",
  MID: "border-emerald-500/40 bg-emerald-500/5",
  FWD: "border-fuchsia-500/40 bg-fuchsia-500/5",
};

const TOTAL_PICKS_PER_PLAYER = SD_PHASE_ORDER.reduce(
  (acc, p) => acc + SD_PHASE_QUOTAS[p],
  0,
);

export default function SquadDraftGamePage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const initialName = search.get("name") ?? "";

  const [name, setName] = React.useState(initialName);
  const [state, setState] = React.useState<SdState | null>(null);
  const clientId = useClientId();
  const youId = clientId;

  const { send, connected } = usePartySocket<SdClientMessage, SdServerMessage>({
    party: "squaddraft",
    room: roomId,
    id: clientId,
    onOpen: () => {
      if (initialName) send({ type: "join", name: initialName });
    },
    onMessage: (msg) => {
      if (msg.type === "state") setState(msg.state);
    },
  });

  if (!state) {
    return (
      <main className="min-h-dvh flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-zinc-700 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">
            {connected ? "Syncing" : "Connecting to"} <span className="font-mono text-zinc-300">{roomId}</span>…
          </p>
          <Button variant="ghost" size="sm" onClick={() => router.push("/squad-draft")}>
            Cancel
          </Button>
        </div>
      </main>
    );
  }

  const players = Object.values(state.players);
  const you = youId ? state.players[youId] : null;
  const isHost = youId === state.hostId;

  return (
    <main className="min-h-dvh pitch-bg">
      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <aside className="flex flex-col gap-4">
          <Link
            href="/squad-draft"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300"
          >
            <ArrowLeft size={12} /> Leave room
          </Link>
          <RoomHud
            code={roomId}
            shareUrl={typeof window !== "undefined" ? window.location.href : undefined}
            players={players}
            youId={youId}
            title="Squad Draft"
          />
          {!you && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 flex flex-col gap-2">
              <span className="text-xs uppercase tracking-wider text-zinc-500">Your name</span>
              <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={16} />
              <Button onClick={() => send({ type: "join", name: name.trim() || "Player" })} disabled={!name.trim()}>
                Join room
              </Button>
            </div>
          )}
          {state.phase === "lobby" && you && isHost && (
            <Button size="lg" onClick={() => send({ type: "start" })}>
              Start draft
            </Button>
          )}
          {state.phase === "lobby" && you && !isHost && (
            <p className="text-xs text-zinc-500">Waiting for host…</p>
          )}
        </aside>

        <section>
          {state.phase === "lobby" && <LobbyView players={players} />}
          {state.phase === "drafting" && (
            <DraftingView state={state} you={you} send={send} />
          )}
          {state.phase === "finished" && (
            <FinishedView
              state={state}
              isHost={isHost}
              onPlayAgain={() => send({ type: "start" })}
            />
          )}
        </section>
      </div>
    </main>
  );
}

/* ---------------- sub-views ---------------- */

function LobbyView({ players }: { players: RoomPlayer[] }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-800 p-10 text-center bg-zinc-950/40">
      <div className="text-2xl font-bold mb-1">Waiting for friends</div>
      <p className="text-zinc-400 text-sm mb-6">
        Snake draft in 4 phases: 1 GK, 4 DEF, 3 MID, 3 FWD. Pick a shirt number each turn.
      </p>
      <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 mb-4">
        {SD_PHASE_ORDER.map((p) => (
          <span
            key={p}
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-2 py-1",
              PHASE_RINGS[p],
            )}
          >
            <span className={cn("font-bold", PHASE_ACCENTS[p])}>{p}</span>
            <span className="text-zinc-500">× {SD_PHASE_QUOTAS[p]}</span>
          </span>
        ))}
      </div>
      <div className="text-zinc-500 text-sm">
        {players.length === 0 ? "Nobody's here yet." : `${players.length} in the room.`}
      </div>
    </div>
  );
}

function DraftingView({
  state,
  you,
  send,
}: {
  state: SdState;
  you: RoomPlayer | null;
  send: (m: SdClientMessage) => void;
}) {
  const isYourTurn = !!you && state.currentTurn === you.id;
  const currentPlayer = state.currentTurn ? state.players[state.currentTurn] : null;
  const posPhase = state.posPhase;

  const totalPicksMade = Object.values(state.picks).reduce((a, arr) => a + arr.length, 0);
  const targetTotal = state.order.length * TOTAL_PICKS_PER_PLAYER;
  const pickNumber = totalPicksMade + 1;

  const picksInThisPhase = posPhase
    ? Object.values(state.picks).reduce(
        (a, arr) => a + arr.filter((pk) => pk.posPhase === posPhase).length,
        0,
      )
    : 0;
  const phaseTarget = posPhase ? state.order.length * SD_PHASE_QUOTAS[posPhase] : 0;

  const lastPicks = buildRecentFeed(state);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="uppercase tracking-widest text-xs text-zinc-500">Pick</span>
          <span className="text-2xl font-bold num-ticker">
            {pickNumber}<span className="text-zinc-600"> / {targetTotal}</span>
          </span>
        </div>
        {state.deadline && (
          <CountdownTimer endsAt={state.deadline} totalMs={TURN_WINDOW_MS} />
        )}
      </div>

      {/* Phase tracker */}
      {posPhase && (
        <div className="flex items-center gap-2 flex-wrap">
          {SD_PHASE_ORDER.map((p) => {
            const active = p === posPhase;
            const done = SD_PHASE_ORDER.indexOf(p) < SD_PHASE_ORDER.indexOf(posPhase);
            return (
              <div
                key={p}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs",
                  active
                    ? PHASE_RINGS[p]
                    : done
                      ? "border-zinc-800 bg-zinc-900/50 text-zinc-500"
                      : "border-zinc-800 bg-zinc-950 text-zinc-600",
                )}
              >
                <span className={cn("font-bold", active ? PHASE_ACCENTS[p] : "")}>{p}</span>
                <span className="text-zinc-500">× {SD_PHASE_QUOTAS[p]}</span>
                {done && <span className="text-emerald-500">✓</span>}
              </div>
            );
          })}
        </div>
      )}

      <div
        className={cn(
          "rounded-2xl border p-5 text-center transition-colors",
          isYourTurn && posPhase
            ? PHASE_RINGS[posPhase]
            : "border-zinc-800 bg-zinc-950",
        )}
      >
        <div className="text-xs uppercase tracking-[0.3em] text-zinc-500 mb-1">
          {posPhase ? `${PHASE_LABELS[posPhase]} phase` : "On the clock"}{" "}
          {posPhase && (
            <span className="text-zinc-600">
              · {picksInThisPhase}/{phaseTarget}
            </span>
          )}
        </div>
        <div className="text-3xl font-black mb-1">
          {currentPlayer ? `${currentPlayer.emoji} ${currentPlayer.name}` : "—"}
        </div>
        {isYourTurn && posPhase ? (
          <p className={cn("text-sm", PHASE_ACCENTS[posPhase])}>
            Your turn — pick a shirt number for a {PHASE_LABELS[posPhase].toLowerCase().replace(/s$/, "")}.
          </p>
        ) : (
          <p className="text-zinc-500 text-sm">Waiting for pick…</p>
        )}
      </div>

      {isYourTurn && posPhase && (
        <NumberPicker
          takenNumbers={state.takenNumbers}
          phaseNumberPool={state.phaseNumberPool}
          posPhase={posPhase}
          onPick={(num) => send({ type: "pick", jerseyNumber: num })}
        />
      )}

      {/* Recent picks feed */}
      {lastPicks.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2">Recent picks</div>
          <ol className="flex flex-col gap-1.5">
            {lastPicks.map((row, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="truncate">
                  <span className={cn("text-[10px] font-bold mr-1.5", PHASE_ACCENTS[row.pick.posPhase])}>
                    {row.pick.posPhase}
                  </span>
                  <span className="text-zinc-400">{row.drafter.emoji} {row.drafter.name}</span>
                  <span className="text-zinc-500"> took </span>
                  <span className="inline-flex items-center gap-1 font-bold">
                    <Hash size={12} className="text-emerald-400" />
                    {row.pick.jerseyNumber}
                  </span>
                  <span className="text-zinc-500"> → </span>
                  <span className="font-semibold text-zinc-100">{row.pick.player.name}</span>
                  <span className="text-zinc-500"> ({row.pick.player.pos})</span>
                </span>
                <span className="text-xs text-zinc-400 shrink-0">
                  <span className="num-ticker font-bold text-zinc-200">{row.pick.player.ovr}</span> OVR
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Squad summary per player */}
      <div className="grid gap-3 sm:grid-cols-2">
        {state.order.map((id) => {
          const p = state.players[id];
          if (!p) return null;
          const picks = state.picks[id] ?? [];
          const total = picks.reduce((a, pk) => a + pk.player.ovr, 0);
          const isActive = state.currentTurn === id;
          return (
            <div
              key={id}
              className={cn(
                "rounded-xl border p-3",
                isActive && posPhase
                  ? PHASE_RINGS[posPhase]
                  : "border-zinc-800 bg-zinc-950",
              )}
            >
              <div className="flex items-center justify-between mb-2 text-sm">
                <span className="font-semibold">
                  {p.emoji} {p.name}
                  {isActive && <Clock size={12} className="inline ml-1 text-emerald-300" />}
                </span>
                <span className="text-xs text-zinc-400">
                  <span className="font-bold num-ticker text-zinc-200">{total}</span> OVR ·{" "}
                  {picks.length}/{TOTAL_PICKS_PER_PLAYER}
                </span>
              </div>
              {/* Phase progress dots */}
              <div className="flex items-center gap-1.5 mb-2 text-[10px] text-zinc-500">
                {SD_PHASE_ORDER.map((ph) => {
                  const phaseCount = picks.filter((pk) => pk.posPhase === ph).length;
                  const quota = SD_PHASE_QUOTAS[ph];
                  const filled = phaseCount >= quota;
                  return (
                    <span
                      key={ph}
                      className={cn(
                        "inline-flex items-center gap-0.5 rounded px-1",
                        filled ? "bg-zinc-800" : "",
                        PHASE_ACCENTS[ph],
                      )}
                    >
                      <span className="font-bold">{ph}</span>
                      <span className="text-zinc-500">{phaseCount}/{quota}</span>
                    </span>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-1">
                {picks.map((pk, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-[11px] rounded-md bg-zinc-900 px-1.5 py-0.5"
                    title={`${pk.player.name} · ${pk.player.pos} · ${pk.player.club ?? "—"} · ${pk.player.ovr} OVR`}
                  >
                    <span className={cn("font-bold", PHASE_ACCENTS[pk.posPhase])}>#{pk.jerseyNumber}</span>
                    <span className="text-zinc-300 truncate max-w-[80px]">
                      {lastName(pk.player.name)}
                    </span>
                  </span>
                ))}
                {picks.length === 0 && (
                  <span className="text-xs text-zinc-500">No picks yet.</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NumberPicker({
  takenNumbers,
  phaseNumberPool,
  posPhase,
  onPick,
}: {
  takenNumbers: number[];
  phaseNumberPool: number[];
  posPhase: SdPosPhase;
  onPick: (num: number) => void;
}) {
  const [typed, setTyped] = React.useState("");
  const takenSet = React.useMemo(() => new Set(takenNumbers), [takenNumbers]);
  const poolSet = React.useMemo(() => new Set(phaseNumberPool), [phaseNumberPool]);
  const [hoverNum, setHoverNum] = React.useState<number | null>(null);

  function isPickable(num: number) {
    return !takenSet.has(num) && poolSet.has(num);
  }

  function submit() {
    const n = Number(typed);
    if (!Number.isFinite(n)) return;
    const num = Math.floor(n);
    if (num < MIN_NUMBER || num > MAX_NUMBER) return;
    if (!isPickable(num)) return;
    onPick(num);
    setTyped("");
  }

  const accent = PHASE_ACCENTS[posPhase];
  const available = phaseNumberPool.filter((n) => !takenSet.has(n)).length;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className={cn("text-xs uppercase tracking-[0.2em] font-bold", accent)}>
          {PHASE_LABELS[posPhase]} pool
        </span>
        <span className="text-[10px] text-zinc-500">
          {available} numbers with a valid {posPhase === "GK" ? "goalkeeper" : posPhase === "DEF" ? "defender" : posPhase === "MID" ? "midfielder" : "forward"}
        </span>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <Input
          type="number"
          min={1}
          max={99}
          placeholder="1–99"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          className="text-center text-xl font-bold tracking-widest"
        />
        <Button onClick={submit} disabled={!typed || !isPickable(Math.floor(Number(typed)))}>
          Draft
        </Button>
      </div>
      <div className="grid grid-cols-10 gap-1">
        {Array.from({ length: 99 }, (_, i) => i + 1).map((num) => {
          const taken = takenSet.has(num);
          const inPool = poolSet.has(num);
          const disabled = taken || !inPool;
          return (
            <button
              key={num}
              onClick={() => {
                if (disabled) return;
                onPick(num);
              }}
              onMouseEnter={() => setHoverNum(num)}
              onMouseLeave={() => setHoverNum((h) => (h === num ? null : h))}
              disabled={disabled}
              title={
                taken
                  ? "Already drafted this phase"
                  : !inPool
                    ? `No ${PHASE_LABELS[posPhase].toLowerCase()} wears this number`
                    : undefined
              }
              className={cn(
                "h-9 rounded-md text-sm font-bold tabular-nums transition-all",
                taken
                  ? "bg-zinc-900 text-zinc-700 line-through cursor-not-allowed"
                  : !inPool
                    ? "bg-zinc-950 text-zinc-800 cursor-not-allowed"
                    : hoverNum === num
                      ? "bg-emerald-500 text-zinc-950 -translate-y-0.5"
                      : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700",
              )}
            >
              {num}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FinishedView({
  state,
  isHost,
  onPlayAgain,
}: {
  state: SdState;
  isHost: boolean;
  onPlayAgain: () => void;
}) {
  const ranked = state.order
    .map((id) => ({
      player: state.players[id],
      total: (state.picks[id] ?? []).reduce((a, pk) => a + pk.player.ovr, 0),
      picks: state.picks[id] ?? [],
    }))
    .filter((r): r is { player: RoomPlayer; total: number; picks: SdPick[] } => !!r.player)
    .sort((a, b) => b.total - a.total);
  const champ = ranked[0]?.player;

  React.useEffect(() => {
    if (!champ) return;
    confetti({ particleCount: 220, spread: 120, origin: { y: 0.6 } });
  }, [champ?.id]);

  // Best and worst single pick for some storytelling.
  const allPicks = ranked.flatMap((r) =>
    r.picks.map((pk) => ({ drafter: r.player, pick: pk })),
  );
  const best = [...allPicks].sort((a, b) => b.pick.player.ovr - a.pick.player.ovr)[0];
  const worst = [...allPicks].sort((a, b) => a.pick.player.ovr - b.pick.player.ovr)[0];

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center">
        <Trophy className="mx-auto text-emerald-400 mb-3" size={32} />
        <div className="text-xs uppercase tracking-[0.3em] text-zinc-500 mb-2">Champion drafter</div>
        <div className="text-4xl font-black mb-1">
          {champ ? `${champ.emoji} ${champ.name}` : "—"}
        </div>
        <div className="text-zinc-400">{ranked[0]?.total ?? 0} total OVR</div>
      </div>

      {best && worst && (
        <div className="grid sm:grid-cols-2 gap-3">
          <StoryCard
            label="Steal of the draft"
            value={`${best.drafter.emoji} ${best.drafter.name} took #${best.pick.jerseyNumber} (${best.pick.posPhase})`}
            sub={`${best.pick.player.name} · ${best.pick.player.ovr} OVR`}
            accent="text-emerald-300"
          />
          <StoryCard
            label="Curse of the draft"
            value={`${worst.drafter.emoji} ${worst.drafter.name} took #${worst.pick.jerseyNumber} (${worst.pick.posPhase})`}
            sub={`${worst.pick.player.name} · ${worst.pick.player.ovr} OVR`}
            accent="text-red-300"
          />
        </div>
      )}

      {ranked.map(({ player: p, total, picks }) => (
        <div key={p.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-bold">
              {p.emoji} {p.name}
            </span>
            <span className="text-sm text-zinc-400">
              <span className="font-bold num-ticker text-zinc-200">{total}</span> OVR
            </span>
          </div>
          {SD_PHASE_ORDER.map((ph) => {
            const phasePicks = picks.filter((pk) => pk.posPhase === ph);
            if (phasePicks.length === 0) return null;
            return (
              <div key={ph} className="mb-3 last:mb-0">
                <div className={cn("text-[10px] uppercase tracking-[0.2em] font-bold mb-1.5", PHASE_ACCENTS[ph])}>
                  {PHASE_LABELS[ph]}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                  {phasePicks.map((pk, i) => (
                    <MiniPick key={i} pick={pk} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {isHost && (
        <Button size="lg" onClick={onPlayAgain}>
          New draft
        </Button>
      )}
    </div>
  );
}

function StoryCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
      <div className={cn("text-[10px] uppercase tracking-[0.2em]", accent)}>{label}</div>
      <div className="text-sm font-semibold text-zinc-100 mt-1">{value}</div>
      <div className="text-xs text-zinc-500">{sub}</div>
    </div>
  );
}

function MiniPick({ pick }: { pick: SdPick }) {
  return (
    <div className="rounded-md bg-zinc-900 px-2 py-1.5">
      <div className={cn("flex items-center gap-1 text-xs font-bold", PHASE_ACCENTS[pick.posPhase])}>
        <Hash size={10} /> {pick.jerseyNumber}
        <span className="ml-auto text-[10px] text-zinc-500 font-normal">{pick.player.pos}</span>
      </div>
      <div className="text-sm font-semibold truncate">{pick.player.name}</div>
      <div className="flex items-center justify-between text-[11px] text-zinc-500">
        <span className="truncate">{pick.player.club ?? "—"}</span>
        <span className="font-bold text-zinc-300 num-ticker">{pick.player.ovr}</span>
      </div>
    </div>
  );
}

/** Collect recent picks across all players, newest first, top 5. */
function buildRecentFeed(state: SdState): { drafter: RoomPlayer; pick: SdPick }[] {
  const all: { drafter: RoomPlayer; pick: SdPick }[] = [];
  for (const id of Object.keys(state.picks)) {
    const drafter = state.players[id];
    if (!drafter) continue;
    for (const pk of state.picks[id] ?? []) {
      all.push({ drafter, pick: pk });
    }
  }
  return all.sort((a, b) => b.pick.pickedAtMs - a.pick.pickedAtMs).slice(0, 5);
}

function lastName(full: string): string {
  const parts = full.split(" ");
  return parts.length > 1 ? parts[parts.length - 1]! : full;
}
