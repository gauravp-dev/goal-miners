import Link from "next/link";
import { ArrowLeft, Flame } from "lucide-react";
import { LobbyForm } from "@/components/LobbyForm";

export default function HolLobbyPage() {
  return (
    <main className="min-h-dvh px-6 pt-8 pb-16 max-w-3xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 mb-10"
      >
        <ArrowLeft size={14} /> All games
      </Link>

      <header className="flex items-center gap-4 mb-6">
        <Flame className="text-amber-400" size={32} />
        <div>
          <h1 className="text-4xl font-black leading-tight">Higher or Lower</h1>
          <p className="text-zinc-400 mt-1">
            Guess whose overall rating is higher. Streak up, outlast your friends.
          </p>
        </div>
      </header>

      <section className="mb-10 rounded-xl border border-zinc-800 bg-zinc-950 p-5 text-sm text-zinc-400 leading-relaxed">
        <p>
          <span className="font-semibold text-zinc-100">How it plays:</span> two cards flash on screen. Hit
          <span className="font-semibold text-emerald-300"> Higher </span>
          or
          <span className="font-semibold text-sky-300"> Lower </span>
          before the timer runs out. Everyone plays the same round simultaneously — points for each correct
          call, highest total after 15 rounds wins.
        </p>
      </section>

      <LobbyForm game="higher-or-lower" />
    </main>
  );
}
