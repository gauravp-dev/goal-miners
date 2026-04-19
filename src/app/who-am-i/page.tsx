import Link from "next/link";
import { ArrowLeft, UserSearch } from "lucide-react";
import { LobbyForm } from "@/components/LobbyForm";

export default function WhoAmILobbyPage() {
  return (
    <main className="min-h-dvh px-6 pt-8 pb-16 max-w-3xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 mb-10"
      >
        <ArrowLeft size={14} /> All games
      </Link>

      <header className="flex items-center gap-4 mb-6">
        <UserSearch className="text-fuchsia-400" size={32} />
        <div>
          <h1 className="text-4xl font-black leading-tight">Who Am I?</h1>
          <p className="text-zinc-400 mt-1">
            Clues drip every 15 seconds. First to name the mystery player wins.
          </p>
        </div>
      </header>

      <section className="mb-10 rounded-xl border border-zinc-800 bg-zinc-950 p-5 text-sm text-zinc-400 leading-relaxed">
        <p>
          <span className="font-semibold text-zinc-100">How it plays:</span> six clues are revealed
          one at a time — nation, position, league, age bracket, OVR bracket, and the first letter
          of the last name. Guess the player by typing their name. First correct = 5 pts, second = 3,
          third = 2, fourth = 1. Wrong guesses don&apos;t cost points, so keep trying.
        </p>
      </section>

      <LobbyForm game="who-am-i" />
    </main>
  );
}
