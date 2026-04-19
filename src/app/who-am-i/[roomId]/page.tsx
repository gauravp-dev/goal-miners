"use client";
import * as React from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Lock, Trophy } from "lucide-react";
import confetti from "canvas-confetti";
import { usePartySocket } from "@/hooks/usePartySocket";
import { useClientId } from "@/hooks/useClientId";
import type {
  Player,
  RoomPlayer,
  WhoClientMessage,
  WhoClue,
  WhoServerMessage,
  WhoState,
} from "@/lib/game-types";
import { RoomHud } from "@/components/RoomHud";
import { CountdownTimer } from "@/components/CountdownTimer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { searchPlayers } from "@/lib/players";
import { cn } from "@/lib/utils";

const ROUND_WINDOW_MS = 95_000;

export default function WhoGamePage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const initialName = search.get("name") ?? "";

  const [name, setName] = React.useState(initialName);
  const [state, setState] = React.useState<WhoState | null>(null);
  const clientId = useClientId();
  const youId = clientId;

  const { send, connected } = usePartySocket<WhoClientMessage, WhoServerMessage>({
    party: "whoami",
    room: roomId,
    id: clientId,
    onOpen: () => {
      if (initialName) send({ type: "join", name: initialName });
    },
    onMessage: (msg) => {
      if (msg.type === "state") setState(msg.state);
    },
  });

  // Confetti when you're first correct this round.
  const lastWinKey = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!state?.round) return;
    const firstWinner = state.round.winners[0];
    const key = `${state.round.index}-${firstWinner ?? ""}`;
    if (lastWinKey.current === key) return;
    lastWinKey.current = key;
    if (firstWinner && firstWinner === youId) {
      confetti({ particleCount: 140, spread: 80, origin: { y: 0.5 } });
    }
  }, [state, youId]);

  if (!state) {
    return (
      <main className="min-h-dvh flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-zinc-700 border-t-fuchsia-500 rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">
            {connected ? "Syncing" : "Connecting to"} <span className="font-mono text-zinc-300">{roomId}</span>…
          </p>
          <Button variant="ghost" size="sm" onClick={() => router.push("/who-am-i")}>
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
            href="/who-am-i"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300"
          >
            <ArrowLeft size={12} /> Leave room
          </Link>
          <RoomHud
            code={roomId}
            shareUrl={typeof window !== "undefined" ? window.location.href : undefined}
            players={players}
            youId={youId}
            title="Who Am I?"
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

/* ---------------- sub-views ---------------- */

function LobbyView({ players }: { players: RoomPlayer[] }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-800 p-10 text-center bg-zinc-950/40">
      <div className="text-2xl font-bold mb-1">Waiting for friends</div>
      <p className="text-zinc-400 text-sm mb-6">Share the room code with up to 3 friends.</p>
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
  state: WhoState;
  you: RoomPlayer | null;
  send: (m: WhoClientMessage) => void;
}) {
  const round = state.round!;
  const [now, setNow] = React.useState(Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);
  const visibleClues = round.clues.filter((c) => c.revealAt <= now);
  const youWon = you ? round.winners.includes(you.id) : false;
  const alreadyGuessedIds = new Set((you && round.guesses[you.id]?.map((g) => g.guessedPlayerId)) ?? []);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="uppercase tracking-widest text-xs text-zinc-500">Round</span>
          <span className="text-2xl font-bold num-ticker">
            {round.index}<span className="text-zinc-600"> / {state.roundCount}</span>
          </span>
        </div>
        <CountdownTimer endsAt={round.deadline} totalMs={ROUND_WINDOW_MS} />
      </div>

      {/* Clue board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {round.clues.map((c, i) => (
          <ClueCard key={i} clue={c} visibleAtMs={now} />
        ))}
      </div>

      {you && !youWon && (
        <GuessBox
          alreadyGuessedIds={alreadyGuessedIds}
          onPick={(p) => send({ type: "guess", playerId: p.id })}
        />
      )}

      {you && youWon && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-center gap-3">
          <Check className="text-emerald-400" size={18} />
          <span className="text-sm text-emerald-200">You got it! Waiting for the rest…</span>
        </div>
      )}

      {/* Per-player wrong-guess log */}
      <div className="grid sm:grid-cols-2 gap-3">
        {Object.values(state.players).map((p) => {
          const guesses = round.guesses[p.id] ?? [];
          const winnerRank = round.winners.indexOf(p.id);
          return (
            <div
              key={p.id}
              className={cn(
                "rounded-lg border p-3 bg-zinc-950",
                winnerRank >= 0 ? "border-emerald-500/40" : "border-zinc-800",
              )}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-zinc-200">
                  {p.emoji} {p.name}
                </span>
                {winnerRank >= 0 && (
                  <span className="text-[10px] uppercase tracking-wider text-emerald-400">
                    #{winnerRank + 1} correct
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {guesses.length === 0 ? (
                  <span className="text-xs text-zinc-500">No guesses yet.</span>
                ) : (
                  guesses.map((g, i) => (
                    <span
                      key={i}
                      className={cn(
                        "px-2 py-0.5 rounded text-[11px] border",
                        g.correct
                          ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
                          : "border-red-500/30 text-red-300 bg-red-500/5",
                      )}
                    >
                      {g.guessedName}
                    </span>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ClueCard({ clue, visibleAtMs }: { clue: WhoClue; visibleAtMs: number }) {
  const revealed = clue.revealAt <= visibleAtMs;
  const secondsUntil = Math.max(0, Math.ceil((clue.revealAt - visibleAtMs) / 1000));
  return (
    <div
      className={cn(
        "rounded-xl p-4 border transition-all",
        revealed
          ? "border-fuchsia-500/30 bg-fuchsia-500/5"
          : "border-zinc-800 bg-zinc-950",
      )}
    >
      <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1">{clue.label}</div>
      {revealed ? (
        <div className="text-2xl font-black text-zinc-50">{clue.value}</div>
      ) : (
        <div className="flex items-center gap-2 text-zinc-500 text-sm">
          <Lock size={14} />
          in {secondsUntil}s
        </div>
      )}
    </div>
  );
}

function GuessBox({
  alreadyGuessedIds,
  onPick,
}: {
  alreadyGuessedIds: Set<string>;
  onPick: (p: Player) => void;
}) {
  const [query, setQuery] = React.useState("");
  const results = React.useMemo(
    () => searchPlayers(query, 8).filter((p) => !alreadyGuessedIds.has(p.id)),
    [query, alreadyGuessedIds],
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

function RoundEndView({
  state,
  isHost,
  onNext,
}: {
  state: WhoState;
  isHost: boolean;
  onNext: () => void;
}) {
  const firstWinner = state.round?.winners[0];
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-8 text-center">
      <div className="text-xs uppercase tracking-[0.3em] text-zinc-500 mb-2">Mystery was</div>
      <div className="text-4xl font-black mb-4">{state.revealedMysteryName ?? "Unknown"}</div>
      {state.revealedMysteryImg && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={state.revealedMysteryImg}
          alt={state.revealedMysteryName ?? "Mystery"}
          className="mx-auto w-28 h-28 mb-4 opacity-90"
          onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
        />
      )}
      <div className="text-sm text-zinc-400 mb-6">
        {firstWinner
          ? `${state.players[firstWinner]?.name ?? "Someone"} got it first.`
          : "Nobody got it."}
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
      <Trophy className="mx-auto text-fuchsia-400 mb-3" size={32} />
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
