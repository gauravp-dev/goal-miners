import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FUT Draft — Build Your Best 4-3-3",
  description: "Free multiplayer FUT draft: eleven slots, five random choices each, 25 seconds per pick. Highest squad rating wins. Play with friends in the browser.",
  alternates: { canonical: "/fut-draft" },
};

import Link from "next/link";
import { ArrowLeft, LayoutGrid } from "lucide-react";
import { LobbyForm } from "@/components/LobbyForm";

export default function FutDraftLobbyPage() {
  return (
    <main className="min-h-dvh px-6 pt-8 pb-16 max-w-3xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 mb-10"
      >
        <ArrowLeft size={14} /> All games
      </Link>

      <header className="flex items-center gap-4 mb-6">
        <LayoutGrid className="text-sky-400" size={32} />
        <div>
          <h1 className="text-4xl font-black leading-tight">FUT Draft</h1>
          <p className="text-zinc-400 mt-1">
            Draft a 4-3-3 from random 5-card shortlists. Highest total OVR wins.
          </p>
        </div>
      </header>

      <section className="mb-10 rounded-xl border border-zinc-800 bg-zinc-950 p-5 text-sm text-zinc-400 leading-relaxed">
        <p>
          <span className="font-semibold text-zinc-100">How it plays:</span> 11 slots, 4-3-3.
          Each slot you see <span className="font-semibold text-sky-300">5 random players</span> at that
          position — pick one. Everyone picks simultaneously with a 25-second timer. After the 11
          picks, your squad&apos;s total overall rating is your score.
        </p>
      </section>

      <LobbyForm game="fut-draft" />
    </main>
  );
}
