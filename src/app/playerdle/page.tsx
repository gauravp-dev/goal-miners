import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Playerdle — Guess the Footballer",
  description: "Wordle for football: guess the mystery footballer in 8 tries with colour-coded clues for nation, league, club, position, age and rating. Free multiplayer.",
  alternates: { canonical: "/playerdle" },
};

import Link from "next/link";
import { ArrowLeft, Target } from "lucide-react";
import { LobbyForm } from "@/components/LobbyForm";

export default function PdleLobbyPage() {
  return (
    <main className="min-h-dvh px-6 pt-8 pb-16 max-w-3xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 mb-10"
      >
        <ArrowLeft size={14} /> All games
      </Link>

      <header className="flex items-center gap-4 mb-6">
        <Target className="text-emerald-400" size={32} />
        <div>
          <h1 className="text-4xl font-black leading-tight">Playerdle</h1>
          <p className="text-zinc-400 mt-1">
            Guess the mystery footballer in 8 tries. Every guess reveals color-coded clues.
          </p>
        </div>
      </header>

      <section className="mb-10 rounded-xl border border-zinc-800 bg-zinc-950 p-5 text-sm text-zinc-400 leading-relaxed">
        <p>
          <span className="font-semibold text-zinc-100">How it plays:</span> one mystery player per round.
          Everyone guesses simultaneously. Each guess fills a row of clues — green = match, arrows = higher/lower.
          First correct guess is worth 3 points, any correct guess after is worth 1. 5 rounds per match.
        </p>
      </section>

      <LobbyForm game="playerdle" />
    </main>
  );
}
