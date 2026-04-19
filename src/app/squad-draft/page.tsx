import Link from "next/link";
import { ArrowLeft, Hash } from "lucide-react";
import { LobbyForm } from "@/components/LobbyForm";

export default function SquadDraftLobbyPage() {
  return (
    <main className="min-h-dvh px-6 pt-8 pb-16 max-w-3xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 mb-10"
      >
        <ArrowLeft size={14} /> All games
      </Link>

      <header className="flex items-center gap-4 mb-6">
        <Hash className="text-emerald-400" size={32} />
        <div>
          <h1 className="text-4xl font-black leading-tight">Squad Number Draft</h1>
          <p className="text-zinc-400 mt-1">
            Pick shirt numbers. Get whoever wears that number. Fight for #7.
          </p>
        </div>
      </header>

      <section className="mb-10 rounded-xl border border-zinc-800 bg-zinc-950 p-5 text-sm text-zinc-400 leading-relaxed">
        <p className="mb-3">
          <span className="font-semibold text-zinc-100">How it plays:</span> build a 4-3-3 XI in
          four snake-draft phases — 1 GK, then 4 defenders, then 3 midfielders, then 3 forwards.
          On your turn you call a shirt number 1–99, and the server pulls a random real FC 26
          player at that number who plays the current phase&apos;s position.
        </p>
        <p>
          The 1–99 pool resets per phase, so yes — you can draft a #10 goalkeeper AND a #10
          striker. Numbers with no valid player for the current position are greyed out. Highest
          total OVR after 11 picks wins.
        </p>
      </section>

      <LobbyForm game="squad-draft" />
    </main>
  );
}
