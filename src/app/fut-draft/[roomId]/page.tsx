"use client";
import * as React from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Clock } from "lucide-react";
import confetti from "canvas-confetti";
import { usePartySocket } from "@/hooks/usePartySocket";
import { useClientId } from "@/hooks/useClientId";
import type {
  FutClientMessage,
  FutServerMessage,
  FutState,
  Player,
  RoomPlayer,
} from "@/lib/game-types";
import { PlayerCard } from "@/components/PlayerCard";
import { CountdownTimer } from "@/components/CountdownTimer";
import { RoomHud } from "@/components/RoomHud";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

const SLOT_WINDOW_MS = 25_000;

export default function FutDraftGamePage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const initialName = search.get("name") ?? "";

  const [name, setName] = React.useState(initialName);
  const [state, setState] = React.useState<FutState | null>(null);
  const clientId = useClientId();
  const youId = clientId;

  const { send, connected } = usePartySocket<FutClientMessage, FutServerMessage>({
    party: "futdraft",
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
          <div className="w-8 h-8 border-2 border-zinc-700 border-t-sky-500 rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">
            {connected ? "Syncing" : "Connecting to"} <span className="font-mono text-zinc-300">{roomId}</span>…
          </p>
          <Button variant="ghost" size="sm" onClick={() => router.push("/fut-draft")}>
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
            href="/fut-draft"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300"
          >
            <ArrowLeft size={12} /> Leave room
          </Link>
          <RoomHud
            code={roomId}
            shareUrl={typeof window !== "undefined" ? window.location.href : undefined}
            players={players}
            youId={youId}
            title="FUT Draft"
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
          {state.phase === "picking" && state.round && (
            <PickingView state={state} you={you} send={send} />
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
        Share the room code with up to 3 friends. Each drafts their own 4-3-3.
      </p>
      <div className="text-zinc-500 text-sm">
        {players.length === 0 ? "Nobody's here yet." : `${players.length} in the room.`}
      </div>
    </div>
  );
}

function PickingView({
  state,
  you,
  send,
}: {
  state: FutState;
  you: RoomPlayer | null;
  send: (m: FutClientMessage) => void;
}) {
  const round = state.round!;
  const yourPicks = you ? state.picks[you.id] ?? [] : [];
  const yourOptions = you ? round.options[you.id] ?? [] : [];
  const alreadyPicked = yourPicks.length > round.slotIndex;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="uppercase tracking-widest text-xs text-zinc-500">Pick</span>
          <span className="text-2xl font-bold num-ticker">
            {round.slotIndex + 1}<span className="text-zinc-600"> / {state.slotCount}</span>
          </span>
          <span className="ml-3 px-3 py-1 rounded-md bg-sky-500/15 text-sky-300 text-sm font-bold tracking-widest">
            {round.slotLabel}
          </span>
        </div>
        <CountdownTimer endsAt={round.deadline} totalMs={SLOT_WINDOW_MS} />
      </div>

      {you && !alreadyPicked && (
        <div>
          <p className="text-sm text-zinc-400 mb-4">
            Choose one of the 5 players below for your <span className="font-bold text-sky-300">{round.slotLabel}</span>.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {yourOptions.map((p) => (
              <button
                key={p.id}
                onClick={() => send({ type: "pick", playerId: p.id })}
                className="transition-transform hover:-translate-y-1 hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-sky-400 rounded-2xl"
              >
                <PlayerCard player={p} tilt={false} className="h-[280px] w-full" />
              </button>
            ))}
          </div>
        </div>
      )}

      {you && alreadyPicked && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-center gap-3">
          <Check className="text-emerald-400" size={18} />
          <span className="text-sm text-emerald-200">
            Locked in <span className="font-bold">{yourPicks[round.slotIndex]?.name}</span>. Waiting for the others…
          </span>
        </div>
      )}

      {/* Progress strip: who's picked, who hasn't */}
      <div className="flex flex-wrap gap-2">
        {Object.values(state.players).map((p) => {
          const picks = state.picks[p.id] ?? [];
          const done = picks.length > round.slotIndex;
          return (
            <span
              key={p.id}
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border",
                done
                  ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
                  : "border-zinc-700 text-zinc-400 bg-zinc-900/50",
              )}
            >
              {done ? <Check size={12} /> : <Clock size={12} />}
              {p.emoji} {p.name}
            </span>
          );
        })}
      </div>

      {/* Your XI so far */}
      {you && yourPicks.length > 0 && <PicksStrip label="Your XI" picks={yourPicks} />}
    </div>
  );
}

function PicksStrip({ label, picks }: { label: string; picks: Player[] }) {
  const total = picks.reduce((acc, p) => acc + p.ovr, 0);
  const avg = picks.length ? Math.round(total / picks.length) : 0;
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
      <div className="flex items-center justify-between mb-2 text-xs">
        <span className="uppercase tracking-widest text-zinc-500">{label}</span>
        <span className="text-zinc-400">
          <span className="font-bold num-ticker text-zinc-200">{total}</span>
          <span className="text-zinc-500"> OVR · avg {avg}</span>
        </span>
      </div>
      <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5">
        {picks.map((p, i) => (
          <div
            key={`${p.id}-${i}`}
            className="rounded-md bg-zinc-900 px-2 py-1.5 text-center"
            title={`${p.name} · ${p.pos} · ${p.ovr}`}
          >
            <div className="text-[10px] text-zinc-500 tracking-wider">{p.pos}</div>
            <div className="text-sm font-bold truncate">{lastName(p.name)}</div>
            <div className="text-xs font-bold num-ticker text-zinc-300">{p.ovr}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FinishedView({
  state,
  isHost,
  onPlayAgain,
}: {
  state: FutState;
  isHost: boolean;
  onPlayAgain: () => void;
}) {
  const ranked = Object.values(state.players)
    .map((p) => ({ player: p, total: state.picks[p.id]?.reduce((a, pl) => a + pl.ovr, 0) ?? 0 }))
    .sort((a, b) => b.total - a.total);
  const champ = ranked[0]?.player;

  React.useEffect(() => {
    if (!champ) return;
    confetti({ particleCount: 220, spread: 120, origin: { y: 0.6 } });
  }, [champ?.id]);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center">
        <div className="text-xs uppercase tracking-[0.3em] text-zinc-500 mb-2">Champion drafter</div>
        <div className="text-4xl font-black mb-1">
          {champ ? `${champ.emoji} ${champ.name}` : "—"}
        </div>
        <div className="text-zinc-400">{ranked[0]?.total ?? 0} total OVR</div>
      </div>

      {ranked.map(({ player: p, total }) => (
        <div key={p.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">
              {p.emoji} {p.name}
            </span>
            <span className="text-sm text-zinc-400">
              <span className="font-bold num-ticker text-zinc-200">{total}</span> OVR
            </span>
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5">
            {(state.picks[p.id] ?? []).map((pl, i) => (
              <div
                key={`${pl.id}-${i}`}
                className="rounded-md bg-zinc-900 px-2 py-1.5 text-center"
                title={`${pl.name} · ${pl.pos} · ${pl.ovr}`}
              >
                <div className="text-[10px] text-zinc-500 tracking-wider">{pl.pos}</div>
                <div className="text-sm font-bold truncate">{lastName(pl.name)}</div>
                <div className="text-xs font-bold num-ticker text-zinc-300">{pl.ovr}</div>
              </div>
            ))}
          </div>
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

function lastName(full: string): string {
  // "K. Mbappé" → "Mbappé"; "Cristiano Ronaldo" → "Ronaldo"; single names unchanged.
  const parts = full.split(" ");
  return parts.length > 1 ? parts[parts.length - 1]! : full;
}
