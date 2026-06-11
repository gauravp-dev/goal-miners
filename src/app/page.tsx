"use client";
/* =========================================================================
   Goal Miners — landing page (sleek minimal rebuild).
   Monochrome + single emerald accent, type-led hero, featured World Cup
   prediction banner, the five games, how-it-works, closing CTA.
   ========================================================================= */
import * as React from "react";
import Link from "next/link";
import { hanken } from "@/lib/fonts";
import { TweaksPanel, usePrefs } from "@/components/ThemeTweaks";

/* ------------------------------ icons ---------------------------------- */
const I = {
  arrow: "M5 12h14M13 6l6 6-6 6",
  higherLower: "M8 3v18M8 3l-4 4M8 3l4 4M16 21V3M16 21l-4-4M16 21l4-4",
  playerdle: "M3 5h18M3 12h18M3 19h18M7 5v14",
  futDraft: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  whoAmI: "M9 9a3 3 0 1 1 4.5 2.6c-.9.5-1.5 1.2-1.5 2.4M12 17h.01M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z",
  squadDraft: "M4 9h16M4 15h16M10 3 8 21M16 3l-2 18",
  trophy: "M6 4h12v4a6 6 0 0 1-12 0V4ZM6 6H3.8A2.2 2.2 0 0 0 6 10.2M18 6h2.2A2.2 2.2 0 0 1 18 10.2M9.6 14.4 9.2 18h5.6l-.4-3.6M8.4 21h7.2M10 18v3M14 18v3",
  link: "M9 15l6-6M10.5 6.5l1-1a4 4 0 0 1 6 6l-1 1M13.5 17.5l-1 1a4 4 0 0 1-6-6l1-1",
  share: "M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13",
  play: "M6 4l14 8-14 8V4Z",
};
const Icon = ({ d, s = 20, sw = 1.7, className }: { d: string; s?: number; sw?: number; className?: string }) => (
  <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);

const GAMES = [
  { slug: "higher-or-lower", title: "Higher or Lower", tag: "Streak-based ratings duel.", icon: I.higherLower, time: "5–8 min", players: "2–4" },
  { slug: "playerdle", title: "Playerdle", tag: "Guess the mystery footballer.", icon: I.playerdle, time: "4–6 min", players: "2–4" },
  { slug: "fut-draft", title: "FUT Draft", tag: "Build a 4-3-3 from shortlists.", icon: I.futDraft, time: "8–12 min", players: "2–4" },
  { slug: "who-am-i", title: "Who Am I?", tag: "Six drip-fed clues. First name wins.", icon: I.whoAmI, time: "5–8 min", players: "2–4" },
  { slug: "squad-draft", title: "Squad Number Draft", tag: "Call a shirt. Get a player.", icon: I.squadDraft, time: "12–15 min", players: "2–4" },
];

/* ------------------------------- NAV ----------------------------------- */
function Nav() {
  return (
    <nav className="relative z-20 max-w-6xl mx-auto px-6 pt-7 flex items-center justify-between">
      <a href="#top" className="flex items-center gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-mark.png"
          alt="Goal Miners logo"
          className="w-8 h-8 rounded-full object-cover"
          style={{ border: "1px solid var(--hair-2)", boxShadow: "0 0 22px -4px rgba(212,175,55,0.45)" }}
        />
        <span className="font-bold text-[17px] tracking-tight ink whitespace-nowrap">Goal Miners</span>
      </a>
      <div className="flex items-center gap-1 sm:gap-2 text-sm">
        <a href="#games" className="px-3 py-2 mute hover:opacity-70 transition-opacity hidden sm:inline whitespace-nowrap">Games</a>
        <a href="#how" className="px-3 py-2 mute hover:opacity-70 transition-opacity hidden sm:inline whitespace-nowrap">How it works</a>
        <Link href="/world-cup" className="chip chip-accent ml-1">World Cup 26</Link>
      </div>
    </nav>
  );
}

/* ------------------------------ HERO ----------------------------------- */
function PitchMotif() {
  return (
    <svg viewBox="0 0 600 360" className="w-full h-full" aria-hidden preserveAspectRatio="xMidYMid meet">
      <g fill="none" style={{ stroke: "var(--hair)" }} strokeWidth="1.25">
        <rect x="40" y="30" width="520" height="300" rx="6" />
        <line x1="300" y1="30" x2="300" y2="330" />
        <circle cx="300" cy="180" r="58" />
        <circle cx="300" cy="180" r="2.5" style={{ fill: "var(--hair-2)", stroke: "none" }} />
        <rect x="40" y="100" width="70" height="160" />
        <rect x="490" y="100" width="70" height="160" />
        <rect x="40" y="140" width="28" height="80" />
        <rect x="532" y="140" width="28" height="80" />
      </g>
    </svg>
  );
}

function Hero() {
  return (
    <header id="top" className="relative z-10 max-w-6xl mx-auto px-6 pt-16 sm:pt-24 pb-12">
      <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-10 items-center">
        <div className="reveal">
          <div className="chip mb-6">
            <span className="live-dot" style={{ width: 7, height: 7, borderRadius: 99, background: "var(--accent)", display: "inline-block" }} />
            Live multiplayer · free to play
          </div>
          <h1 className="display text-[13.5vw] sm:text-6xl md:text-[4.6rem] ink">
            Football games<br />for the group chat.
          </h1>
          <p className="mt-6 max-w-lg text-lg ink2 leading-relaxed">
            Five bite-sized multiplayer games powered by <span className="ink font-semibold num">10,654</span> real footballers.
            Create a room, share a link, play in your browser. No downloads, no accounts.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#games" className="btn btn-accent">Browse games <Icon d={I.arrow} s={16} /></a>
            <a href="#how" className="btn btn-ghost">How it works</a>
          </div>
          <div className="mt-8 flex items-center gap-x-6 gap-y-2 flex-wrap text-[13px] mute num">
            <span><b className="ink">10,654</b> players</span><span className="opacity-40">/</span>
            <span><b className="ink">6</b> games</span><span className="opacity-40">/</span>
            <span><b className="ink">2–4</b> per room</span><span className="opacity-40">/</span>
            <span><b className="ink">$0</b> forever</span>
          </div>
        </div>
        <div className="reveal hidden lg:block relative">
          <div className="glow-blob" style={{ inset: "10%", opacity: 0.4 }} />
          <div className="relative surf rounded-3xl p-7" style={{ borderRadius: 24 }}>
            <PitchMotif />
          </div>
        </div>
      </div>
    </header>
  );
}

/* --------------------------- FEATURED (WC) ------------------------------ */
function FeaturedPrediction() {
  return (
    <Link
      href="/world-cup"
      className="reveal group relative block rounded-3xl overflow-hidden mb-5"
      style={{
        border: "1px solid color-mix(in srgb, var(--accent) 40%, var(--hair))",
        background: "color-mix(in srgb, var(--accent) 7%, var(--surf))",
        borderRadius: 24,
      }}
    >
      <div className="glow-blob" style={{ top: -80, right: 80, width: 360, height: 220, opacity: 0.55 }} />
      <div className="relative grid sm:grid-cols-[1fr_auto] gap-6 items-center p-7 sm:p-9">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="chip chip-accent">New</span>
            <span className="eyebrow" style={{ color: "var(--accent)" }}>Featured</span>
          </div>
          <h3 className="display text-3xl sm:text-4xl ink">World Cup 2026 Prediction</h3>
          <p className="mt-3 ink2 text-[15px] max-w-md leading-relaxed">
            48 nations, one bracket. Call the groups, settle the third-place race, then tap your way to a champion.
          </p>
          <span className="btn btn-accent mt-6 group-hover:translate-x-0.5 transition-transform">
            Build your bracket <Icon d={I.arrow} s={16} />
          </span>
        </div>
        <div className="justify-self-end flex items-center pr-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/wc/logos/wc2026-white.svg" alt="FIFA World Cup 2026" className="wc-logo-dark" style={{ height: 152 }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/wc/logos/wc2026.svg" alt="FIFA World Cup 2026" className="wc-logo-light" style={{ height: 152 }} />
        </div>
      </div>
    </Link>
  );
}

/* ------------------------------ GAMES ----------------------------------- */
function GameCard({ g }: { g: (typeof GAMES)[number] }) {
  return (
    <Link href={`/${g.slug}`} className="card group p-6 flex flex-col min-h-[200px]">
      <div className="flex items-start justify-between">
        <span
          className="w-11 h-11 rounded-xl grid place-items-center transition-colors"
          style={{ border: "1px solid var(--hair)", background: "var(--surf)", color: "var(--ink-2)" }}
        >
          <Icon d={g.icon} s={20} />
        </span>
        <span className="eyebrow" style={{ fontSize: 9.5 }}>{g.time}</span>
      </div>
      <h3 className="mt-5 text-xl font-bold tracking-tight ink">{g.title}</h3>
      <p className="mt-1.5 text-[14px] ink2 leading-relaxed">{g.tag}</p>
      <div className="mt-auto pt-5 flex items-center justify-between text-[12px]">
        <span className="mute num">{g.players} players</span>
        <span className="inline-flex items-center gap-1 font-semibold transition-all group-hover:gap-1.5" style={{ color: "var(--accent)" }}>
          Play <Icon d={I.arrow} s={14} sw={2.4} />
        </span>
      </div>
    </Link>
  );
}

function Games() {
  return (
    <section id="games" className="relative z-10 max-w-6xl mx-auto px-6 mt-20">
      <div className="reveal mb-8 max-w-xl">
        <div className="eyebrow accent mb-3">The lineup</div>
        <h2 className="display text-3xl sm:text-[2.6rem] ink">Pick a game. Send the link.</h2>
        <p className="ink2 text-[15px] mt-3">Every match is a fresh room — just a code you share with friends. No sign-up.</p>
      </div>
      <FeaturedPrediction />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {GAMES.map((g) => <GameCard key={g.slug} g={g} />)}
      </div>
    </section>
  );
}

/* --------------------------- HOW IT WORKS ------------------------------- */
function How() {
  const steps = [
    { n: "01", t: "Pick a game", d: "Six modes, each under 15 minutes. Something for every vibe.", icon: I.play },
    { n: "02", t: "Share the link", d: "Each room is a tiny code. Drop it in the group chat.", icon: I.share },
    { n: "03", t: "Play in the browser", d: "No app, no login. Everyone joins from phone or laptop.", icon: I.link },
  ];
  return (
    <section id="how" className="relative z-10 max-w-6xl mx-auto px-6 mt-24">
      <div className="reveal mb-9 max-w-xl">
        <div className="eyebrow accent mb-3">How it works</div>
        <h2 className="display text-3xl sm:text-[2.6rem] ink">Zero to playing in 30 seconds.</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {steps.map((s) => (
          <div key={s.n} className="reveal card p-6">
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-xl grid place-items-center" style={{ border: "1px solid var(--hair)", color: "var(--accent)" }}>
                <Icon d={s.icon} s={18} />
              </span>
              <span className="num display text-3xl" style={{ color: "var(--hair-2)" }}>{s.n}</span>
            </div>
            <div className="mt-5 text-lg font-bold ink">{s.t}</div>
            <p className="mt-1.5 text-[14px] ink2 leading-relaxed">{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------- CTA ------------------------------------ */
function FinalCTA() {
  return (
    <section className="relative z-10 max-w-6xl mx-auto px-6 mt-24">
      <div className="reveal relative rounded-3xl overflow-hidden text-center p-12 sm:p-16" style={{ border: "1px solid var(--hair-2)", background: "var(--surf)", borderRadius: 26 }}>
        <div className="glow-blob" style={{ top: -100, left: "50%", transform: "translateX(-50%)", width: 480, height: 240, opacity: 0.5 }} />
        <div className="relative">
          <h2 className="display text-3xl sm:text-5xl ink">Your group chat needs this.</h2>
          <p className="ink2 mt-4 max-w-md mx-auto">Spin up a room, drop the link, start playing.</p>
          <div className="mt-7 flex items-center justify-center gap-3 flex-wrap">
            <a href="#games" className="btn btn-accent">Browse games <Icon d={I.arrow} s={16} /></a>
            <Link href="/world-cup" className="btn btn-ghost"><Icon d={I.trophy} s={16} /> World Cup 26</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ FOOTER --------------------------------- */
function Footer() {
  return (
    <footer className="relative z-10 max-w-6xl mx-auto px-6 mt-20 pb-12">
      <div className="flex items-center justify-between text-[12px] mute flex-wrap gap-3 pt-6" style={{ borderTop: "1px solid var(--hair)" }}>
        <div className="flex items-center gap-2">
          <span style={{ width: 7, height: 7, borderRadius: 99, background: "var(--accent)", display: "inline-block" }} />
          <span>Goal Miners · built by football nerds</span>
        </div>
        <span>Player data from the EA FC 26 community dataset. Not affiliated with EA Sports.</span>
      </div>
    </footer>
  );
}

/* ------------------------------- PAGE ----------------------------------- */
export default function HomePage() {
  const { theme, motion, setTheme, setMotion } = usePrefs();
  return (
    <main className={"wc relative min-h-dvh overflow-hidden " + hanken.className} data-theme={theme} data-motion={motion}>
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="glow-blob" style={{ top: -220, right: -140, width: 560, height: 520, opacity: 0.55 }} />
        <div className="glow-blob" style={{ bottom: -260, left: -160, width: 520, height: 480, opacity: 0.3 }} />
      </div>
      <Nav />
      <Hero />
      <Games />
      <How />
      <FinalCTA />
      <Footer />
      <TweaksPanel theme={theme} motion={motion} onTheme={setTheme} onMotion={setMotion} />
    </main>
  );
}
