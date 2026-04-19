"use client";
import * as React from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";
import {
  Target,
  Flame,
  LayoutGrid,
  UserSearch,
  Hash,
  Users,
  Zap,
  Sparkles,
  ArrowRight,
  Link2,
  PlayCircle,
} from "lucide-react";

const games = [
  {
    slug: "higher-or-lower",
    title: "Higher or Lower",
    tagline: "Streak-based ratings duel.",
    blurb:
      "Two players flash on screen. Is the next one rated higher or lower? Build a streak. First mistake loses the round.",
    icon: Flame,
    duration: "5–8 min",
    color: "from-amber-500/40 via-orange-500/20 to-red-500/10",
    accent: "text-amber-400",
    hint: "Fastest to play",
  },
  {
    slug: "playerdle",
    title: "Playerdle",
    tagline: "Guess the mystery footballer.",
    blurb:
      "Like Wordle — but for footballers. Eight tries, colour-coded clues: nation, league, club, position, age, OVR.",
    icon: Target,
    duration: "4–6 min",
    color: "from-emerald-500/40 via-green-500/20 to-sky-500/10",
    accent: "text-emerald-400",
    hint: "Brainy pick",
  },
  {
    slug: "fut-draft",
    title: "FUT Draft",
    tagline: "Build a 4-3-3 from shortlists.",
    blurb:
      "Eleven slots, five random choices each. Everyone picks simultaneously under a 25-second timer. Highest squad OVR wins.",
    icon: LayoutGrid,
    duration: "8–12 min",
    color: "from-sky-500/40 via-blue-500/20 to-indigo-500/10",
    accent: "text-sky-400",
    hint: "Play-of-the-night",
  },
  {
    slug: "who-am-i",
    title: "Who Am I?",
    tagline: "Six drip-fed clues. First name wins.",
    blurb:
      "A clue drops every 15 seconds: nation, position, league, age, overall, name initial. First correct answer takes five points.",
    icon: UserSearch,
    duration: "5–8 min",
    color: "from-fuchsia-500/40 via-pink-500/20 to-rose-500/10",
    accent: "text-fuchsia-400",
    hint: "Trivia-heavy",
  },
  {
    slug: "squad-draft",
    title: "Squad Number Draft",
    tagline: "Call a shirt. Get a player.",
    blurb:
      "Snake-draft a 4-3-3 in four phases. Call a shirt number; the server pulls a random real player wearing it. Fight for #7.",
    icon: Hash,
    duration: "12–15 min",
    color: "from-emerald-500/40 via-teal-500/20 to-cyan-500/10",
    accent: "text-emerald-400",
    hint: "Most chaotic",
  },
];

/** Hand-picked stars for the hero collage. Portraits are served locally from
 *  /public/hero — run `node scripts/download-hero-images.mjs` once to fill it. */
const HERO_STARS: {
  slug: string;
  name: string;
  pos: string;
  ovr: number;
  nation: string;
  flag: string;
  tier: "gold" | "toty" | "silver";
}[] = [
  { slug: "mbappe",     name: "Mbappé",     pos: "ST",  ovr: 91, nation: "FRA", flag: "🇫🇷",            tier: "toty" },
  { slug: "salah",      name: "Salah",      pos: "RM",  ovr: 91, nation: "EGY", flag: "🇪🇬",            tier: "toty" },
  { slug: "haaland",    name: "Haaland",    pos: "ST",  ovr: 90, nation: "NOR", flag: "🇳🇴",            tier: "gold" },
  { slug: "bellingham", name: "Bellingham", pos: "CAM", ovr: 90, nation: "ENG", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", tier: "gold" },
  { slug: "rodri",      name: "Rodri",      pos: "CDM", ovr: 90, nation: "ESP", flag: "🇪🇸",            tier: "gold" },
  { slug: "vandijk",    name: "Van Dijk",   pos: "CB",  ovr: 90, nation: "NED", flag: "🇳🇱",            tier: "gold" },
];

export default function HomePage() {
  return (
    <main className="relative min-h-dvh overflow-hidden">
      <BackgroundStage />
      <Nav />
      <Hero />
      <StatsBar />
      <GamesSection />
      <HowItWorks />
      <Footer />
    </main>
  );
}

/* =========================== BACKGROUND =========================== */

function BackgroundStage() {
  return (
    <>
      {/* Soft colour wash */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full bg-emerald-500/10 blur-[140px]" />
        <div className="absolute top-1/4 -right-40 w-[600px] h-[600px] rounded-full bg-sky-500/10 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full bg-fuchsia-500/5 blur-[140px]" />
      </div>
      {/* Pitch stripe backdrop */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-40"
        style={{
          background:
            "repeating-linear-gradient(90deg, rgba(34,197,94,0.04) 0 80px, rgba(34,197,94,0.01) 80px 160px)",
        }}
      />
      {/* Noise grain */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E\")",
        }}
      />
    </>
  );
}

/* =========================== NAV =========================== */

function Nav() {
  return (
    <nav className="relative z-10 max-w-6xl mx-auto px-6 pt-6 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2.5 group">
        <div className="relative">
          <span className="block w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-700 shadow-[0_0_24px_rgba(34,197,94,0.6)] transition-shadow group-hover:shadow-[0_0_32px_rgba(34,197,94,0.9)]" />
          <span className="absolute inset-0 rounded-full border border-white/20" />
          <span className="absolute top-1 left-1 w-2 h-2 rounded-full bg-white/60 blur-[1px]" />
        </div>
        <span className="font-black text-lg tracking-tight">Goal Miners</span>
      </Link>
      <div className="flex items-center gap-5 text-sm text-zinc-400">
        <a href="#games" className="hover:text-white transition-colors hidden sm:inline">
          Games
        </a>
        <a href="#how-it-works" className="hover:text-white transition-colors hidden sm:inline">
          How it works
        </a>
        <Link
          href="#games"
          className="inline-flex items-center gap-1.5 bg-white text-zinc-950 font-semibold text-sm px-4 py-2 rounded-full hover:bg-zinc-200 transition-all hover:scale-105"
        >
          Play free <ArrowRight size={14} />
        </Link>
      </div>
    </nav>
  );
}

/* =========================== HERO =========================== */

function Hero() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 40, damping: 15 });
  const sy = useSpring(my, { stiffness: 40, damping: 15 });

  function onMouseMove(e: React.MouseEvent<HTMLElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = e.clientX - rect.left - rect.width / 2;
    const cy = e.clientY - rect.top - rect.height / 2;
    mx.set(cx / rect.width);
    my.set(cy / rect.height);
  }

  return (
    <section
      onMouseMove={onMouseMove}
      className="relative z-10 max-w-6xl mx-auto px-6 pt-16 sm:pt-24 pb-20 min-h-[85dvh] flex items-center"
    >
      {/* Floating hero cards — parallax on mouse */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        {HERO_STARS.map((s, i) => {
          const seed = (i + 1) / (HERO_STARS.length + 1);
          const depth = 30 + i * 10;
          return (
            <FloatingCard
              key={s.name}
              star={s}
              index={i}
              seed={seed}
              sx={sx}
              sy={sy}
              depth={depth}
            />
          );
        })}
      </div>

      <div className="relative w-full text-center sm:text-left">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 backdrop-blur px-3 py-1 text-xs text-emerald-300"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="tracking-wider uppercase font-semibold">
            Live multiplayer · free to play
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-6 font-black tracking-tight leading-[0.9] text-[14vw] sm:text-7xl md:text-8xl"
        >
          Football
          <br />
          <span className="relative inline-block">
            <span className="bg-gradient-to-r from-emerald-300 via-sky-300 to-fuchsia-300 bg-clip-text text-transparent">
              party games.
            </span>
            <motion.span
              className="absolute -bottom-2 left-0 h-1 w-full origin-left bg-gradient-to-r from-emerald-400 via-sky-400 to-fuchsia-400 rounded-full"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.9, delay: 0.5, ease: "easeOut" }}
            />
          </span>
          <br />
          <span className="text-zinc-200">Play with friends.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mt-7 max-w-xl mx-auto sm:mx-0 text-lg sm:text-xl text-zinc-400 leading-relaxed"
        >
          Five bite-sized multiplayer games powered by{" "}
          <span className="text-emerald-300 font-semibold">10,654 real footballers</span>.
          Create a room, share a link, play in your browser. No downloads, no accounts.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-9 flex flex-col sm:flex-row items-center gap-3 justify-center sm:justify-start"
        >
          <Link
            href="#games"
            className="group relative inline-flex items-center gap-2 bg-white text-zinc-950 font-bold text-base px-6 py-3.5 rounded-full hover:scale-[1.03] transition-transform"
          >
            <PlayCircle size={20} />
            <span>Start a room</span>
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white px-4 py-3.5"
          >
            <Zap size={16} className="text-emerald-400" />
            How it works
          </a>
        </motion.div>
      </div>
    </section>
  );
}

function FloatingCard({
  star,
  index,
  seed,
  sx,
  sy,
  depth,
}: {
  star: (typeof HERO_STARS)[number];
  index: number;
  seed: number;
  sx: MotionValue<number>;
  sy: MotionValue<number>;
  depth: number;
}) {
  const x = useTransform(sx, (v) => v * depth);
  const y = useTransform(sy, (v) => v * depth);

  // Deterministic scatter so positions don't reshuffle each render.
  const positions = [
    { top: "6%", left: "68%", rot: -6, size: "lg" },
    { top: "14%", left: "6%", rot: 8, size: "md" },
    { top: "44%", left: "82%", rot: 4, size: "md" },
    { top: "62%", left: "72%", rot: -10, size: "sm" },
    { top: "70%", left: "4%", rot: -4, size: "md" },
    { top: "34%", left: "-2%", rot: 10, size: "sm" },
  ];
  const pos = positions[index] ?? positions[0]!;

  const sizePx = pos.size === "lg" ? 170 : pos.size === "md" ? 140 : 110;

  const tierStyle =
    star.tier === "toty"
      ? "from-indigo-300 via-blue-500 to-slate-900 text-white"
      : star.tier === "gold"
        ? "from-yellow-200 via-amber-400 to-amber-700 text-amber-950"
        : "from-zinc-200 via-zinc-400 to-zinc-700 text-zinc-900";

  return (
    <motion.div
      className="absolute hidden md:block"
      style={{ top: pos.top, left: pos.left, x, y, rotate: pos.rot }}
      initial={{ opacity: 0, scale: 0.8, y: 40 }}
      animate={{
        opacity: 0.9,
        scale: 1,
        y: [0, -8, 0],
      }}
      transition={{
        opacity: { duration: 0.9, delay: 0.3 + index * 0.08 },
        scale: { duration: 0.9, delay: 0.3 + index * 0.08 },
        y: {
          duration: 4 + seed * 3,
          delay: seed * 2,
          repeat: Infinity,
          ease: "easeInOut",
        },
      }}
      aria-hidden
    >
      <MiniFutCard star={star} sizePx={sizePx} tierStyle={tierStyle} />
    </motion.div>
  );
}

function MiniFutCard({
  star,
  sizePx,
  tierStyle,
}: {
  star: (typeof HERO_STARS)[number];
  sizePx: number;
  tierStyle: string;
}) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10"
      style={{ width: sizePx, height: sizePx * 1.38 }}
    >
      {/* Tier gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${tierStyle}`} />
      {/* Shine overlay */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.45), transparent 50%)",
        }}
      />
      {/* Diagonal stripes for texture */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-15 mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(255,255,255,0.25) 0 2px, transparent 2px 8px)",
        }}
      />

      <div className="relative h-full flex flex-col p-3">
        {/* Top row: OVR/POS + flag */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col items-center leading-none">
            <span className="text-2xl font-black tracking-tight">{star.ovr}</span>
            <span className="mt-0.5 text-[10px] font-black opacity-80 tracking-wider">
              {star.pos}
            </span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xl leading-none">{star.flag}</span>
            <span className="text-[8px] font-black opacity-70 tracking-wider">
              {star.nation}
            </span>
          </div>
        </div>

        {/* Portrait (local file, silhouette fallback if missing) */}
        <div className="flex-1 relative flex items-end justify-center">
          <HeroPortrait slug={star.slug} name={star.name} />
        </div>

        {/* Name + mini stats */}
        <div className="relative pt-1 border-t border-black/20">
          <div className="font-black text-[11px] tracking-wider uppercase text-center truncate">
            {star.name}
          </div>
          <div className="mt-1 grid grid-cols-3 gap-0.5 text-[7px] font-black tracking-wider text-center opacity-75">
            <span>PAC</span>
            <span>SHO</span>
            <span>DRI</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Tries /hero/{slug}.png → .jpg → SVG silhouette, so a missing or failed
 * download degrades gracefully instead of showing a broken-image icon.
 */
function HeroPortrait({ slug, name }: { slug: string; name: string }) {
  const [idx, setIdx] = React.useState(0);
  const sources = [`/hero/${slug}.png`, `/hero/${slug}.jpg`];
  if (idx >= sources.length) {
    return <PlayerSilhouette />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={sources[idx]}
      alt={name}
      className="w-[92%] h-[92%] object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.45)]"
      loading="lazy"
      onError={() => setIdx((i) => i + 1)}
    />
  );
}

/** Simple inline SVG of a footballer silhouette — no external deps. */
function PlayerSilhouette() {
  return (
    <svg
      viewBox="0 0 120 140"
      className="w-[85%] h-[85%] opacity-90"
      aria-hidden
    >
      <defs>
        <linearGradient id="sil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(0,0,0,0.75)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
        </linearGradient>
      </defs>
      {/* Head */}
      <circle cx="60" cy="30" r="17" fill="url(#sil)" />
      {/* Shoulders / body */}
      <path
        d="M20 130 Q20 80 40 66 Q50 58 60 58 Q70 58 80 66 Q100 80 100 130 Z"
        fill="url(#sil)"
      />
      {/* Arm hint */}
      <path
        d="M18 108 Q24 88 38 80"
        stroke="rgba(0,0,0,0.55)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M102 108 Q96 88 82 80"
        stroke="rgba(0,0,0,0.55)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/* =========================== STATS BAR =========================== */

function StatsBar() {
  const items = [
    { value: "10,654", label: "Real players", icon: Users },
    { value: "5", label: "Live games", icon: Sparkles },
    { value: "2–4", label: "Friends / room", icon: Link2 },
    { value: "0$", label: "No paywall, ever", icon: Zap },
  ];
  return (
    <section className="relative z-10 max-w-6xl mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur px-4 py-6 grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-sky-500/10 border border-white/10 grid place-items-center">
              <it.icon size={16} className="text-emerald-300" />
            </div>
            <div className="leading-tight">
              <div className="text-xl sm:text-2xl font-black num-ticker">{it.value}</div>
              <div className="text-[11px] uppercase tracking-wider text-zinc-500">
                {it.label}
              </div>
            </div>
          </div>
        ))}
      </motion.div>
    </section>
  );
}

/* =========================== GAMES =========================== */

function GamesSection() {
  return (
    <section id="games" className="relative z-10 max-w-6xl mx-auto px-6 mt-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="flex items-end justify-between flex-wrap gap-4 mb-10"
      >
        <div>
          <div className="uppercase tracking-[0.3em] text-xs text-emerald-400 mb-3 font-bold">
            The lineup
          </div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
            Pick a game.
            <br />
            Send the link.
          </h2>
        </div>
        <p className="text-zinc-400 max-w-sm">
          Every match is a fresh room. No sign-up — just a code you share with friends.
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {games.map((g, i) => (
          <GameCard key={g.slug} {...g} index={i} />
        ))}
      </div>
    </section>
  );
}

type GameCardProps = (typeof games)[number] & { index: number };

function GameCard({
  slug,
  title,
  tagline,
  blurb,
  icon: Icon,
  duration,
  color,
  accent,
  hint,
  index,
}: GameCardProps) {
  const ref = React.useRef<HTMLAnchorElement | null>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useTransform(my, (v) => -v * 6);
  const ry = useTransform(mx, (v) => v * 6);

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }

  function onLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: "easeOut" }}
      style={{ perspective: 1200 }}
    >
      <motion.a
        ref={ref}
        href={`/${slug}`}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/60 p-6 min-h-[240px] transition-colors hover:border-white/20"
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-70 transition-opacity group-hover:opacity-100`} />
        <div className="relative flex flex-col h-full" style={{ transform: "translateZ(20px)" }}>
          <div className="flex items-start justify-between">
            <div className={`w-12 h-12 rounded-xl grid place-items-center border border-white/10 bg-white/5 ${accent}`}>
              <Icon size={22} />
            </div>
            <span className="text-[10px] uppercase tracking-widest text-white/60">{hint}</span>
          </div>
          <h3 className="mt-5 text-2xl font-black tracking-tight">{title}</h3>
          <p className={`text-sm font-semibold mb-2 ${accent}`}>{tagline}</p>
          <p className="text-sm text-zinc-300/90 leading-relaxed">{blurb}</p>
          <div className="mt-auto pt-5 flex items-center justify-between text-xs text-zinc-400">
            <span>{duration}</span>
            <span className="inline-flex items-center gap-1 text-zinc-200 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
              Play <ArrowRight size={14} />
            </span>
          </div>
        </div>
      </motion.a>
    </motion.div>
  );
}

/* =========================== HOW IT WORKS =========================== */

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Pick a game",
      body: "Five modes, each under 15 minutes. Something for every vibe.",
      icon: Sparkles,
      accent: "text-emerald-400",
    },
    {
      n: "02",
      title: "Share the link",
      body: "Each room is a tiny code. Drop it in the group chat.",
      icon: Link2,
      accent: "text-sky-400",
    },
    {
      n: "03",
      title: "Play in the browser",
      body: "No app, no login. Everyone joins from their phone or laptop.",
      icon: PlayCircle,
      accent: "text-fuchsia-400",
    },
  ];
  return (
    <section id="how-it-works" className="relative z-10 max-w-6xl mx-auto px-6 mt-28">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
      >
        <div className="uppercase tracking-[0.3em] text-xs text-sky-400 mb-3 font-bold">
          How it works
        </div>
        <h2 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight mb-12">
          From zero to playing
          <br />
          <span className="text-zinc-500">in under 30 seconds.</span>
        </h2>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-4">
        {steps.map((s, i) => (
          <motion.div
            key={s.n}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.12 }}
            className="relative rounded-2xl border border-white/10 bg-white/[0.02] p-6 overflow-hidden"
          >
            <div className="absolute top-3 right-4 text-7xl font-black text-white/[0.04] select-none">
              {s.n}
            </div>
            <s.icon className={`${s.accent} mb-4`} size={26} />
            <div className="text-xl font-bold">{s.title}</div>
            <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">{s.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* =========================== FOOTER =========================== */

function Footer() {
  return (
    <footer className="relative z-10 max-w-6xl mx-auto px-6 mt-28 pb-10">
      <div className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-sky-500/5 to-transparent p-8 sm:p-12 text-center overflow-hidden relative">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            background:
              "radial-gradient(ellipse 500px 200px at 50% 0%, rgba(34,197,94,0.4), transparent 60%)",
          }}
        />
        <div className="relative">
          <h3 className="text-3xl sm:text-5xl font-black tracking-tight">
            Your group chat needs this.
          </h3>
          <p className="text-zinc-300 mt-3 max-w-xl mx-auto">
            Spin up a room, drop the link, start playing.
          </p>
          <Link
            href="#games"
            className="mt-6 inline-flex items-center gap-2 bg-white text-zinc-950 font-bold px-6 py-3 rounded-full hover:scale-105 transition-transform"
          >
            <PlayCircle size={20} /> Play free
          </Link>
        </div>
      </div>
      <div className="mt-10 flex items-center justify-between text-xs text-zinc-500 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="block w-2 h-2 rounded-full bg-emerald-500" />
          <span>Goal Miners · built by football nerds</span>
        </div>
        <span>
          Player data from the EA FC 26 community dataset. Not affiliated with EA Sports.
        </span>
      </div>
    </footer>
  );
}
