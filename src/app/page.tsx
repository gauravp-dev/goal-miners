import Link from "next/link";
import { Target, HelpCircle, Flame } from "lucide-react";

const games = [
  {
    slug: "higher-or-lower",
    title: "Higher or Lower",
    tagline: "Streak-based ratings duel.",
    blurb:
      "Two players flash on screen. Is the right one's overall higher or lower? Last one standing takes the crown.",
    icon: Flame,
    duration: "5–8 min",
    color: "from-amber-600/30 to-red-500/10",
    accent: "text-amber-400",
  },
  {
    slug: "playerdle",
    title: "Playerdle",
    tagline: "Guess the mystery footballer.",
    blurb:
      "Everyone races to guess the same mystery player in 8 tries. Each guess reveals color-coded clues: nation, league, club, position, age, OVR.",
    icon: Target,
    duration: "4–6 min / round",
    color: "from-emerald-600/30 to-sky-500/10",
    accent: "text-emerald-400",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-dvh px-6 pt-12 pb-16 max-w-5xl mx-auto">
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-block w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(34,197,94,0.8)] animate-pulse-slow" />
          <span className="uppercase tracking-[0.3em] text-xs text-zinc-500">
            Goal Miners
          </span>
        </div>
        <h1 className="text-5xl sm:text-6xl font-black leading-[0.95] tracking-tight">
          Live football games,
          <br />
          built for your stream.
        </h1>
        <p className="mt-5 text-zinc-400 max-w-xl text-lg">
          Create a room, send the link to 3 friends, and play on-air. All data from the EA FC 26 player pool.
        </p>
      </header>

      <section className="grid sm:grid-cols-2 gap-5">
        {games.map((g) => (
          <GameCard key={g.slug} {...g} />
        ))}
      </section>

      <section className="mt-12 text-xs text-zinc-500 flex items-start gap-2">
        <HelpCircle size={14} className="mt-0.5" />
        <span>
          Host shares their browser window via OBS. Friends join from their own device using the room code.
        </span>
      </section>
    </main>
  );
}

type GameCardProps = (typeof games)[number];

function GameCard({ slug, title, tagline, blurb, icon: Icon, duration, color, accent }: GameCardProps) {
  return (
    <Link
      href={`/${slug}`}
      className={`group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-6 hover:border-zinc-700 transition-all`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-60 group-hover:opacity-100 transition-opacity`} />
      <div className="relative">
        <Icon className={`${accent} mb-4`} size={28} />
        <h3 className="text-2xl font-bold">{title}</h3>
        <p className={`text-sm font-medium ${accent} mb-3`}>{tagline}</p>
        <p className="text-sm text-zinc-300">{blurb}</p>
        <div className="mt-5 flex items-center justify-between text-xs text-zinc-400">
          <span>{duration}</span>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">Play →</span>
        </div>
      </div>
    </Link>
  );
}
