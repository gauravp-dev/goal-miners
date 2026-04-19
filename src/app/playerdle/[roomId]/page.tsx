"use client";
import * as React from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUp, ArrowDown, Check, X } from "lucide-react";
import confetti from "canvas-confetti";
import { usePartySocket } from "@/hooks/usePartySocket";
import { useClientId } from "@/hooks/useClientId";
import type {
  PdleClientMessage,
  PdleGuess,
  PdleGuessCell,
  PdleServerMessage,
  PdleState,
  Player,
  RoomPlayer,
} from "@/lib/game-types";
import { RoomHud } from "@/components/RoomHud";
import { CountdownTimer } from "@/components/CountdownTimer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { searchPlayers } from "@/lib/players";
import { cn } from "@/lib/utils";

const ROUND_WINDOW_MS = 150_000;

export default function PdleGamePage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const initialName = search.get("name") ?? "";

  const [name, setName] = React.useState(initialName);
  const [state, setState] = React.useState<PdleState | null>(null);
  const clientId = useClientId();
  const youId = clientId;

  const { send, connected } = usePartySocket<PdleClientMessage, PdleServerMessage>({
    party: "playerdle",
    room: roomId,
    id: clientId,
    onOpen: () => {
      if (initialName) send({ type: "join", name: initialName });
    },
    onMessage: (msg) => {
      if (msg.type === "state") setState(msg.state);
    },
  });

  // Confetti when you're first correct.
  const lastWinKey = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!state?.round) return;
    const key = `${state.round.index}-${state.round.winner ?? ""}`;
    if (lastWinKey.current === key) return;
    lastWinKey.current = key;
    if (state.round.winner === youId) {
      confetti({ particleCount: 140, spread: 80, origin: { y: 0.5 } });
    }
  }, [state, youId]);

  if (!state) {
    return (
      <main className="min-h-dvh flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-zinc-700 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">
            {connected ? "Syncing" : "Connecting to"} <span className="font-mono text-zinc-300">{roomId}</span>…
          </p>
          <Button variant="ghost" size="sm" onClick={() => router.push("/playerdle")}>
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
            href="/playerdle"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300"
          >
            <ArrowLeft size={12} /> Leave room
          </Link>
          <RoomHud
            code={roomId}
            shareUrl={typeof window !== "undefined" ? window.location.href : undefined}
            players={players}
            youId={youId}
            title="Playerdle"
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
            <Button size="lg" onClick={() => send({ type: "start", roundCount: 5 })}>
              Start game
            </Button>
          )}
          {state.phase === "lobby" && you && !isHost && (
            <p className="text-xs text-zinc-500">Waiting for host…</p>
          )}
        </aside>

        <section>
          {state.phase === "lobby" && <LobbyView players={players} />}
          {state.phase === "guessing" && state.round && (
            <GuessingView state={state} you={you} send={send} />
          )}
          {state.phase === "roundEnd" && (
            <RoundEndView state={state} isHost={isHost} onNext={() => send({ type: "next" })} />
          )}
          {state.phase === "finished" && (
            <FinishedView players={players} isHost={isHost} onPlayAgain={() => send({ type: "start", roundCount: 5 })} />
          )}
        </section>
      </div>
    </main>
  );
}

/* ------- sub-views ------- */

function LobbyView({ players }: { players: RoomPlayer[] }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-800 p-10 text-center bg-zinc-950/40">
      <div className="text-2xl font-bold mb-1">Waiting for friends</div>
      <p className="text-zinc-400 text-sm mb-6">
        Share the room code (top-left) with 3 friends.
      </p>
      <div className="text-zinc-500 text-sm">
        {players.length === 0 ? "Nobody's here yet." : `${players.length} in the room.`}
      </div>
    </div>
  );
}

function GuessingView({
  state,
  you,
  send,
}: {
  state: PdleState;
  you: RoomPlayer | null;
  send: (m: PdleClientMessage) => void;
}) {
  const round = state.round!;
  const yourGuesses = you ? round.guesses[you.id] ?? [] : [];
  const finished = yourGuesses.some((g) => g.correct) || yourGuesses.length >= state.maxGuessesPerPlayer;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm">
          <span className="uppercase tracking-widest text-xs text-zinc-500">Round</span>
          <span className="text-2xl font-bold num-ticker">
            {round.index}<span className="text-zinc-600"> / {state.roundCount}</span>
          </span>
        </div>
        <CountdownTimer endsAt={round.deadline} totalMs={ROUND_WINDOW_MS} />
      </div>

      {you && !finished && (
        <GuessBox
          yourPastGuessIds={new Set(yourGuesses.map((g) => g.playerId))}
          onPick={(p) => send({ type: "guess", playerId: p.id })}
        />
      )}

      {you && finished && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-400 text-center">
          {yourGuesses[0]?.correct
            ? "✓ You got it. Waiting for the rest…"
            : "Out of guesses. Waiting for the rest…"}
        </div>
      )}

      {/* Your grid */}
      {you && (
        <GuessGrid
          title="Your grid"
          guesses={yourGuesses}
          capacity={state.maxGuessesPerPlayer}
        />
      )}

      {/* Other players' grids — compact */}
      <div className="grid sm:grid-cols-2 gap-3 mt-2">
        {Object.values(state.players)
          .filter((p) => p.id !== you?.id)
          .map((p) => (
            <GuessGrid
              key={p.id}
              title={`${p.emoji} ${p.name}`}
              guesses={round.guesses[p.id] ?? []}
              capacity={state.maxGuessesPerPlayer}
              compact
              highlightWinner={round.winner === p.id}
            />
          ))}
      </div>
    </div>
  );
}

function GuessBox({
  yourPastGuessIds,
  onPick,
}: {
  yourPastGuessIds: Set<string>;
  onPick: (p: Player) => void;
}) {
  const [query, setQuery] = React.useState("");
  const results = React.useMemo(
    () => searchPlayers(query, 8).filter((p) => !yourPastGuessIds.has(p.id)),
    [query, yourPastGuessIds],
  );
  const [focused, setFocused] = React.useState(false);

  return (
    <div className="relative">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder="Guess a player (type a name)…"
      />
      {focused && query.trim().length > 0 && results.length > 0 && (
        <ul className="absolute top-full mt-1 left-0 right-0 z-10 rounded-lg border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden">
          {results.map((p) => (
            <li key={p.id}>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onPick(p);
                  setQuery("");
                }}
                className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left hover:bg-zinc-800 transition-colors"
              >
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold truncate">{p.name}</span>
                  <span className="text-xs text-zinc-500 truncate">
                    {p.club ?? p.nation} · {p.pos}
                  </span>
                </div>
                <span className="text-sm font-bold num-ticker text-zinc-300 shrink-0">{p.ovr}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GuessGrid({
  title,
  guesses,
  capacity,
  compact = false,
  highlightWinner = false,
}: {
  title: string;
  guesses: PdleGuess[];
  capacity: number;
  compact?: boolean;
  highlightWinner?: boolean;
}) {
  const order: (keyof PdleGuess["cells"])[] = ["nation", "league", "club", "position", "age", "overall"];
  const labels: Record<keyof PdleGuess["cells"], string> = {
    nation: "Nation",
    league: "League",
    club: "Club",
    position: "Pos",
    age: "Age",
    overall: "OVR",
  };

  // Server stores guesses newest-first; display oldest-at-top, newest-at-bottom (Wordle style).
  const chrono = guesses.slice().reverse();
  const rows = Array.from({ length: capacity }, (_, i) => chrono[i] ?? null);

  return (
    <div
      className={cn(
        "rounded-xl border p-3 bg-zinc-950",
        highlightWinner ? "border-emerald-500/50" : "border-zinc-800",
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold text-zinc-300 truncate">{title}</div>
        {highlightWinner && <span className="text-[10px] uppercase text-emerald-400">Winner</span>}
      </div>
      <div className={cn("grid gap-1", compact ? "text-[9px]" : "text-[11px]")}>
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `${compact ? "80px" : "120px"} repeat(6, 1fr)` }}
        >
          <div />
          {order.map((k) => (
            <div key={k} className="text-center text-zinc-500 uppercase tracking-wider">
              {labels[k]}
            </div>
          ))}
        </div>
        {rows.map((g, i) => (
          <div
            key={i}
            className="grid gap-1"
            style={{ gridTemplateColumns: `${compact ? "80px" : "120px"} repeat(6, 1fr)` }}
          >
            <div
              className={cn(
                "px-2 py-1.5 rounded-md bg-zinc-900 truncate",
                compact ? "text-[10px]" : "text-sm",
                !g && "opacity-30",
              )}
            >
              {g ? g.playerName : "—"}
            </div>
            {order.map((k) => (
              <CellView key={k} cell={g?.cells[k]} compact={compact} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function CellView({ cell, compact }: { cell?: PdleGuessCell; compact?: boolean }) {
  if (!cell) {
    return <div className={cn("rounded-md bg-zinc-900/60", compact ? "h-6" : "h-9")} />;
  }
  const bg =
    cell.status === "correct"
      ? "bg-emerald-600 text-white"
      : cell.status === "higher" || cell.status === "lower"
        ? "bg-amber-600/80 text-amber-50"
        : "bg-zinc-800 text-zinc-300";

  const icon =
    cell.status === "correct" ? (
      <Check size={compact ? 10 : 12} />
    ) : cell.status === "higher" ? (
      <ArrowUp size={compact ? 10 : 12} />
    ) : cell.status === "lower" ? (
      <ArrowDown size={compact ? 10 : 12} />
    ) : (
      <X size={compact ? 10 : 12} className="opacity-50" />
    );

  return (
    <div
      className={cn(
        "rounded-md flex items-center justify-center gap-1 font-semibold",
        bg,
        compact ? "h-6 text-[10px] px-1" : "h-9 text-xs px-2",
      )}
      title={typeof cell.value === "string" ? cell.value : undefined}
    >
      <span className="truncate">{cell.value}</span>
      {icon}
    </div>
  );
}

function RoundEndView({
  state,
  isHost,
  onNext,
}: {
  state: PdleState;
  isHost: boolean;
  onNext: () => void;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center">
      <div className="text-xs uppercase tracking-[0.3em] text-zinc-500 mb-2">Mystery player was</div>
      <div className="text-4xl font-black mb-4">{state.revealedMysteryName ?? "Unknown"}</div>
      <div className="text-sm text-zinc-400 mb-6">
        {state.round?.winner
          ? `${state.players[state.round.winner]?.name ?? "Someone"} got it first.`
          : "Nobody got it this round."}
      </div>
      {isHost && (
        <Button onClick={onNext}>
          {state.round && state.round.index >= state.roundCount ? "Finish match" : "Next round"}
        </Button>
      )}
    </div>
  );
}

function FinishedView({
  players,
  isHost,
  onPlayAgain,
}: {
  players: RoomPlayer[];
  isHost: boolean;
  onPlayAgain: () => void;
}) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const champ = sorted[0];
  React.useEffect(() => {
    if (!champ) return;
    confetti({ particleCount: 220, spread: 120, origin: { y: 0.6 } });
  }, [champ?.id]);
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center">
      <div className="text-xs uppercase tracking-[0.3em] text-zinc-500 mb-2">Champion</div>
      <div className="text-5xl font-black mb-2">
        {champ ? `${champ.emoji} ${champ.name}` : "—"}
      </div>
      <div className="text-zinc-400 mb-6">{champ?.score ?? 0} pts</div>
      <ol className="text-left max-w-sm mx-auto space-y-1 mb-8">
        {sorted.map((p, i) => (
          <li
            key={p.id}
            className="flex items-center justify-between px-3 py-2 rounded-md bg-zinc-900"
          >
            <span>
              {i + 1}. {p.emoji} {p.name}
            </span>
            <span className="font-bold num-ticker">{p.score}</span>
          </li>
        ))}
      </ol>
      {isHost && (
        <Button size="lg" onClick={onPlayAgain}>
          Play again
        </Button>
      )}
    </div>
  );
}
