"use client";
import * as React from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import confetti from "canvas-confetti";
import { usePartySocket } from "@/hooks/usePartySocket";
import { useClientId } from "@/hooks/useClientId";
import type {
  HolClientMessage,
  HolServerMessage,
  HolState,
  RoomPlayer,
} from "@/lib/game-types";
import { PlayerCard } from "@/components/PlayerCard";
import { CountdownTimer } from "@/components/CountdownTimer";
import { RoomHud } from "@/components/RoomHud";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { isWalkout } from "@/lib/rating-tiers";

const GUESS_WINDOW_MS = 12_000;

export default function HolGamePage() {
  const { roomId } = useParams<{ roomId: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const initialName = search.get("name") ?? "";

  const [name, setName] = React.useState(initialName);
  const [state, setState] = React.useState<HolState | null>(null);
  const clientId = useClientId();
  const youId = clientId;

  const { send, connected } = usePartySocket<HolClientMessage, HolServerMessage>({
    party: "higherorlower",
    room: roomId,
    id: clientId,
    onOpen: () => {
      if (initialName) send({ type: "join", name: initialName });
    },
    onMessage: (msg) => {
      if (msg.type === "state") setState(msg.state);
    },
  });

  // Walkout confetti when reveal transitions in with a high-rated card.
  const lastRevealId = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!state || state.phase !== "revealing" || !state.lastResult) return;
    const revealed = state.lastResult.bRevealed;
    const key = `${state.round?.index}-${revealed.id}`;
    if (lastRevealId.current === key) return;
    lastRevealId.current = key;
    if (isWalkout(revealed.ovr)) {
      confetti({
        particleCount: 160,
        spread: 100,
        origin: { x: 0.5, y: 0.5 },
        colors: ["#facc15", "#fde68a", "#fbbf24", "#ffffff"],
      });
    }
  }, [state]);

  if (!state) {
    return <LoadingScreen roomId={roomId} connected={connected} onLeave={() => router.push("/higher-or-lower")} />;
  }

  const players = Object.values(state.players);
  const you = youId ? state.players[youId] : null;
  const isHost = youId === state.hostId;

  return (
    <main className="min-h-dvh pitch-bg">
      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="flex flex-col gap-4">
          <Link
            href="/higher-or-lower"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300"
          >
            <ArrowLeft size={12} /> Leave room
          </Link>
          <RoomHud
            code={roomId}
            shareUrl={typeof window !== "undefined" ? window.location.href : undefined}
            players={players}
            youId={youId}
            title="Higher / Lower"
          />
          {!you && (
            <JoinPanel
              name={name}
              setName={setName}
              onJoin={() => send({ type: "join", name: name.trim() || "Player" })}
            />
          )}
          {state.phase === "lobby" && you && isHost && (
            <Button onClick={() => send({ type: "start", roundCount: 15 })} size="lg">
              Start game
            </Button>
          )}
          {state.phase === "lobby" && you && !isHost && (
            <p className="text-xs text-zinc-500">Waiting for host…</p>
          )}
        </aside>

        {/* Main game area */}
        <section>
          {state.phase === "lobby" && <LobbyView players={players} />}
          {state.phase !== "lobby" && state.round && (
            <PlayView state={state} you={you} send={send} />
          )}
          {state.phase === "finished" && (
            <FinishedView players={players} isHost={isHost} onPlayAgain={() => send({ type: "start", roundCount: 15 })} />
          )}
        </section>
      </div>
    </main>
  );
}

/* --- sub-components --- */

function LoadingScreen({
  roomId,
  connected,
  onLeave,
}: {
  roomId: string;
  connected: boolean;
  onLeave: () => void;
}) {
  return (
    <main className="min-h-dvh flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-zinc-500 text-sm">
          {connected ? "Syncing room" : "Connecting to"} <span className="font-mono text-zinc-300">{roomId}</span>…
        </p>
        <Button variant="ghost" size="sm" onClick={onLeave}>
          Cancel
        </Button>
      </div>
    </main>
  );
}

function JoinPanel({
  name,
  setName,
  onJoin,
}: {
  name: string;
  setName: (s: string) => void;
  onJoin: () => void;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 flex flex-col gap-2">
      <span className="text-xs uppercase tracking-wider text-zinc-500">Your name</span>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Gaurav"
        maxLength={16}
      />
      <Button size="md" onClick={onJoin} disabled={!name.trim()}>
        Join room
      </Button>
    </div>
  );
}

function LobbyView({ players }: { players: RoomPlayer[] }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-800 p-10 text-center bg-zinc-950/40">
      <div className="text-2xl font-bold mb-1">Waiting for friends</div>
      <p className="text-zinc-400 text-sm mb-6">Share the room code (top-left) with 3 friends.</p>
      <div className="text-zinc-500 text-sm">
        {players.length === 0 ? "Nobody's here yet." : `${players.length} in the room.`}
      </div>
    </div>
  );
}

function PlayView({
  state,
  you,
  send,
}: {
  state: HolState;
  you: RoomPlayer | null;
  send: (m: HolClientMessage) => void;
}) {
  const { round, phase, guesses, lastResult } = state;
  if (!round) return null;

  const yourGuess = you ? guesses[you.id] : null;
  const revealing = phase === "revealing";

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-4 text-zinc-400 text-sm">
        <span className="uppercase tracking-widest text-xs text-zinc-500">Round</span>
        <span className="text-2xl font-bold num-ticker text-zinc-100">
          {round.index}<span className="text-zinc-600"> / {state.roundCount}</span>
        </span>
        <CountdownTimer
          endsAt={round.deadline}
          totalMs={GUESS_WINDOW_MS}
          size={48}
        />
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
        <PlayerCard player={round.a} countUp={false} />
        <div className="text-4xl font-black text-zinc-600">vs</div>
        <PlayerCard
          player={round.b}
          displayOvr={revealing ? round.b.ovr : "hidden"}
          countUp={revealing}
          hideTier={!revealing}
          revealingWalkout={revealing && isWalkout(round.b.ovr)}
        />
      </div>

      {!revealing && you && !yourGuess && (
        <div className="flex gap-4">
          <Button size="lg" onClick={() => send({ type: "guess", answer: "higher" })} className="min-w-[160px]">
            ⬆ Higher
          </Button>
          <Button size="lg" variant="secondary" onClick={() => send({ type: "guess", answer: "lower" })} className="min-w-[160px]">
            ⬇ Lower
          </Button>
        </div>
      )}

      {!revealing && you && yourGuess && (
        <div className="text-sm text-zinc-400">
          You picked <span className="font-semibold text-zinc-100">{yourGuess}</span>. Waiting for others…
        </div>
      )}

      {revealing && lastResult && you && (
        <RevealSummary
          yourGuess={lastResult.perPlayer[you.id]?.guess ?? null}
          correctAnswer={lastResult.correctAnswer}
          players={Object.values(state.players)}
          result={lastResult.perPlayer}
        />
      )}
    </div>
  );
}

function RevealSummary({
  yourGuess,
  correctAnswer,
  players,
  result,
}: {
  yourGuess: "higher" | "lower" | null;
  correctAnswer: "higher" | "lower" | "equal";
  players: RoomPlayer[];
  result: Record<string, { guess: "higher" | "lower"; correct: boolean }>;
}) {
  const youWereRight =
    yourGuess !== null && (correctAnswer === "equal" || yourGuess === correctAnswer);
  return (
    <div className="flex flex-col items-center gap-2 text-sm">
      <div className={`text-lg font-bold ${youWereRight ? "text-emerald-400" : "text-red-400"}`}>
        {yourGuess === null
          ? `Answer: ${correctAnswer.toUpperCase()}`
          : youWereRight
            ? "✓ Correct!"
            : `✗ Answer was ${correctAnswer.toUpperCase()}`}
      </div>
      <div className="flex flex-wrap gap-1.5 justify-center">
        {players.map((p) => {
          const r = result[p.id];
          return (
            <span
              key={p.id}
              className={
                "px-2 py-0.5 rounded-md text-xs border " +
                (!r
                  ? "border-zinc-800 text-zinc-500"
                  : r.correct
                    ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
                    : "border-red-500/40 text-red-300 bg-red-500/10")
              }
            >
              {p.emoji} {p.name}
            </span>
          );
        })}
      </div>
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
      <div className="text-zinc-400 mb-6">{champ?.score ?? 0} correct</div>
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
