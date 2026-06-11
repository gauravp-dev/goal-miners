"use client";
/* =========================================================================
   World Cup 2026 — prediction page (sleek minimal), official FIFA format.
   Phase 1: rank 1st/2nd/3rd in all 12 groups (tap in finishing order).
   Phase 2: choose the 8 best third-placed teams.
   Phase 3: the knockouts unlock — tap through matches 73→104 to a champion.
   ========================================================================= */
import * as React from "react";
import Link from "next/link";
import { GROUPS, type Group, type Team } from "./data";
import {
  championPath,
  computeBracket,
  byStr,
  simRemainingPicks,
  TEAM_BY_CODE,
  GROUP_OF,
  type GroupRanks,
  type Picks,
} from "./engine";
import { Bracket, Crest } from "./Bracket";
import { FAQ } from "./faq";
import { TweaksPanel, usePrefs } from "@/components/ThemeTweaks";

const { useState, useMemo, useEffect, useCallback } = React;

/* ---------------------------- icons ------------------------------------ */
const Arrow = (p: { s?: number; className?: string }) => (
  <svg viewBox="0 0 24 24" width={p.s || 16} height={p.s || 16} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={p.className}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
const Wand = (p: { s?: number; className?: string }) => (
  <svg viewBox="0 0 24 24" width={p.s || 16} height={p.s || 16} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={p.className}>
    <path d="m15 4 1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2ZM4.5 19.5 13 11M6 4l.7 1.4L8 6l-1.3.6L6 8l-.7-1.4L4 6l1.3-.6L6 4ZM19 14l.7 1.4 1.3.6-1.3.6L19 18l-.7-1.4-1.3-.6 1.3-.6.7-1.4Z" />
  </svg>
);
const Check = (p: { s?: number; className?: string }) => (
  <svg viewBox="0 0 24 24" width={p.s || 14} height={p.s || 14} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={p.className}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
const Lock = (p: { s?: number; className?: string }) => (
  <svg viewBox="0 0 24 24" width={p.s || 16} height={p.s || 16} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={p.className}>
    <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

/* ------------------------------- NAV ----------------------------------- */
function Nav() {
  return (
    <nav className="relative z-20 max-w-7xl mx-auto px-6 pt-7 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2.5 group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-mark.png"
          alt="Goal Miners logo"
          className="w-8 h-8 rounded-full object-cover"
          style={{ border: "1px solid var(--hair-2)", boxShadow: "0 0 22px -4px rgba(212,175,55,0.45)" }}
        />
        <span className="font-bold text-[17px] tracking-tight ink whitespace-nowrap">Goal Miners</span>
      </Link>
      <div className="flex items-center gap-1 sm:gap-2 text-sm">
        <Link href="/" className="px-3 py-2 mute hover:opacity-70 transition-opacity hidden sm:inline">Games</Link>
        <a href="#groups" className="px-3 py-2 mute hover:opacity-70 transition-opacity hidden sm:inline">Groups</a>
        <a href="#bracket" className="px-3 py-2 mute hover:opacity-70 transition-opacity hidden sm:inline">Bracket</a>
        <span className="chip chip-accent ml-1">Prediction</span>
      </div>
    </nav>
  );
}

/* --------------------- HERO + bracket teaser graphic -------------------- */
function BracketTeaser() {
  const W = 1000, H = 300, top = 28, bot = 272, cx = 500, cy = 150;
  const ys = (level: number) => {
    const n = 8 / Math.pow(2, level), arr: number[] = [];
    for (let i = 0; i < n; i++) arr.push(top + (bot - top) * ((i + 0.5) / n));
    return arr;
  };
  const colsL = [78, 188, 298, 398];
  const elbow = (x: number, y: number, nx: number, ny: number) => {
    const m = (x + nx) / 2;
    return `M ${x} ${y} H ${m} V ${ny} H ${nx}`;
  };
  const paths: string[] = [];
  const nodes: { x: number; y: number; edge: boolean }[] = [];
  [colsL, colsL.map((x) => W - x)].forEach((cols, side) => {
    const dir = side === 0 ? 1 : -1;
    for (let L = 0; L < 4; L++) {
      const yy = ys(L);
      yy.forEach((y) => nodes.push({ x: cols[L], y, edge: L === 0 }));
      if (L < 3) {
        const ny = ys(L + 1);
        yy.forEach((y, i) => paths.push(elbow(cols[L], y, cols[L + 1], ny[Math.floor(i / 2)])));
      } else {
        paths.push(elbow(cols[L], cy, cx + dir * 34, cy));
      }
    }
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 300 }} aria-hidden>
      {paths.map((d, i) => <path key={i} d={d} fill="none" style={{ stroke: "var(--hair)" }} strokeWidth="1.25" />)}
      {nodes.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r={n.edge ? 2.6 : 2} style={{ fill: n.edge ? "var(--hair-2)" : "var(--hair)" }} />
      ))}
      <circle cx={cx} cy={cy} r="40" style={{ fill: "var(--glow)", opacity: 0.5 }} />
      <circle cx={cx} cy={cy} r="27" style={{ fill: "var(--bg-2)", stroke: "var(--accent)" }} strokeWidth="1.5" />
      <g transform={`translate(${cx - 11}, ${cy - 11}) scale(0.92)`} style={{ color: "var(--accent)" }}>
        <path d="M6 4h12v4a6 6 0 0 1-12 0V4Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M6 6H3.8A2.2 2.2 0 0 0 6 10.2M18 6h2.2A2.2 2.2 0 0 1 18 10.2M9.6 14.4 9.2 18h5.6l-.4-3.6M8.4 21h7.2M10 18v3M14 18v3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

function Hero({ onBuild }: { onBuild: () => void }) {
  return (
    <header id="top" className="relative z-10 max-w-7xl mx-auto px-6 pt-16 sm:pt-24 pb-8">
      <div className="grid lg:grid-cols-[1.25fr_0.75fr] gap-10 items-center">
        <div className="reveal">
          <div className="eyebrow mb-6">FIFA World Cup 26 · USA · Canada · Mexico</div>
          <h1 className="display text-[15vw] sm:text-7xl md:text-[5.6rem] ink">
            <span className="sr-only">World Cup 2026 Simulator &amp; Bracket Predictor — </span>
            The bracket is<br />yours to call.
          </h1>
          <p className="mt-7 max-w-xl text-lg sm:text-xl ink2 leading-relaxed">
            48 nations, 16 cities, one trophy. Call every group, pick the eight
            best thirds, then tap through the knockouts to crown your champion.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <button onClick={onBuild} className="btn btn-accent">Start with the groups <Arrow /></button>
            <a href="#bracket" className="btn btn-ghost">Peek at the bracket</a>
          </div>
          <div className="mt-8 flex items-center gap-x-6 gap-y-2 flex-wrap text-[13px] mute num">
            <span><b className="ink">48</b> nations</span><span className="opacity-40">/</span>
            <span><b className="ink">12</b> groups</span><span className="opacity-40">/</span>
            <span><b className="ink">104</b> matches</span><span className="opacity-40">/</span>
            <span><b className="ink">16</b> host cities</span>
          </div>
        </div>
        <div className="reveal hidden lg:flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/wc/logos/wc2026-white.svg" alt="FIFA World Cup 2026" className="wc-logo-dark" style={{ height: 300 }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/wc/logos/wc2026.svg" alt="FIFA World Cup 2026" className="wc-logo-light" style={{ height: 300 }} />
        </div>
      </div>
      <div className="reveal mt-10 sm:mt-4 sm:-mb-6 opacity-90 pointer-events-none">
        <BracketTeaser />
      </div>
    </header>
  );
}

/* --------------------------- GROUP STAGE -------------------------------- */
function rankBadge(pos: number | null, complete: boolean) {
  if (pos === 0 || pos === 1) {
    return (
      <span className="num text-[10px] font-bold w-5 h-5 rounded-full grid place-items-center shrink-0"
        style={{ background: "var(--accent)", color: "var(--accent-ink)" }}>{pos + 1}</span>
    );
  }
  if (pos === 2) {
    return (
      <span className="num text-[10px] font-bold w-5 h-5 rounded-full grid place-items-center shrink-0"
        style={{ border: "1.5px solid var(--accent)", color: "var(--accent)" }}>3</span>
    );
  }
  return (
    <span className="w-5 h-5 rounded-full grid place-items-center shrink-0"
      style={{ border: "1px solid var(--hair-2)" }}>
      {complete
        ? <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="var(--mute)" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
        : <span style={{ width: 4, height: 4, borderRadius: 99, background: "var(--hair-2)", display: "inline-block" }} />}
    </span>
  );
}

function GroupCard({ g, ranked, onToggle, onClear }: {
  g: Group;
  ranked: string[];
  onToggle: (group: string, code: string) => void;
  onClear: (group: string) => void;
}) {
  const complete = ranked.length >= 3;
  return (
    <div className="card p-3.5" style={complete ? { borderColor: "color-mix(in srgb, var(--accent) 35%, var(--hair))" } : undefined}>
      <div className="flex items-center justify-between mb-2.5 px-0.5" style={{ minHeight: 18 }}>
        <span className="eyebrow whitespace-nowrap" style={{ fontSize: 10 }}>Group {g.name}</span>
        {ranked.length > 0 ? (
          <button onClick={() => onClear(g.name)} className="text-[10px] font-semibold mute hover:opacity-70 transition-opacity">Clear</button>
        ) : (
          <span className="text-[9px] mute italic">tap in order</span>
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        {g.teams.map((t) => {
          const pos = ranked.indexOf(t.code);
          const has = pos >= 0;
          const out = complete && !has;
          return (
            <button
              key={t.code}
              onClick={() => onToggle(g.name, t.code)}
              className="flex items-center gap-2.5 h-9 px-1.5 rounded-md text-left transition-colors"
              style={{
                borderLeft: "2px solid " + (pos === 0 || pos === 1 ? "var(--accent)" : "transparent"),
                background: pos === 0 || pos === 1 ? "color-mix(in srgb, var(--accent) 6%, transparent)" : "transparent",
                opacity: out ? 0.45 : 1,
              }}
            >
              {rankBadge(has ? pos : null, complete)}
              <Crest team={t} size={20} />
              <span className="font-bold text-[12px] num tracking-wide ink">{t.code}</span>
              <span className="text-[11px] ink2 truncate flex-1 hidden lg:block">{t.name}</span>
              <span className="ml-auto num text-[11px]" style={{ color: "var(--mute)" }}>{t.strength}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function GroupStage({ ranks, onToggle, onClear, onAutoFill, onClearAll }: {
  ranks: GroupRanks;
  onToggle: (group: string, code: string) => void;
  onClear: (group: string) => void;
  onAutoFill: () => void;
  onClearAll: () => void;
}) {
  const done = GROUPS.filter((g) => (ranks[g.name]?.length ?? 0) >= 3).length;
  return (
    <section id="groups" className="relative z-10 max-w-7xl mx-auto px-6 mt-24">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-7 reveal">
        <div className="max-w-xl">
          <div className="eyebrow accent mb-3">Phase 1 — call the groups</div>
          <h2 className="display text-3xl sm:text-[2.6rem] ink">Rank every group.</h2>
          <p className="ink2 text-[15px] mt-3">
            Tap teams in finishing order — <span className="ink font-semibold">1st, 2nd, 3rd</span>.
            Top two advance straight to the Round of 32; the third goes into the play-off race.
            Tap a ranked team to undo.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[13px] mute num"><b className={done === 12 ? "accent" : "ink"}>{done}</b>/12 set</span>
          <button onClick={onAutoFill} className="btn btn-ghost btn-sm"><Wand s={14} className="accent" /> Auto-fill by rating</button>
          {done > 0 && <button onClick={onClearAll} className="btn btn-ghost btn-sm">Clear all</button>}
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {GROUPS.map((g) => (
          <GroupCard key={g.name} g={g} ranked={ranks[g.name] ?? []} onToggle={onToggle} onClear={onClear} />
        ))}
      </div>
      <div className="flex items-center gap-4 mt-5 text-[11px] mute flex-wrap">
        <span className="inline-flex items-center gap-1.5"><span style={{ width: 8, height: 8, borderRadius: 99, background: "var(--accent)", display: "inline-block" }} /> 1st &amp; 2nd advance</span>
        <span className="inline-flex items-center gap-1.5"><span className="num font-bold" style={{ color: "var(--accent)" }}>③</span> 3rd enters the play-off race</span>
      </div>
    </section>
  );
}

/* ------------------------ THIRD-PLACE SELECTION ------------------------- */
function ThirdsSelect({ ranks, thirds, onToggle, onAutoPick, onClear }: {
  ranks: GroupRanks;
  thirds: string[];
  onToggle: (code: string) => void;
  onAutoPick: () => void;
  onClear: () => void;
}) {
  const rows = GROUPS.map((g) => {
    const code = ranks[g.name]?.[2];
    return { group: g.name, team: code ? TEAM_BY_CODE[code] : null };
  });
  const known = rows.filter((r) => r.team).length;
  const full = thirds.length === 8;
  return (
    <section id="thirds" className="relative z-10 max-w-7xl mx-auto px-6 mt-24">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-7 reveal">
        <div className="max-w-2xl">
          <div className="eyebrow accent mb-3">Phase 2 — the play-off line</div>
          <h2 className="display text-3xl sm:text-[2.6rem] ink">Pick the eight best thirds.</h2>
          <p className="ink2 text-[15px] mt-4 leading-relaxed">
            Twelve groups, twelve third-placed teams — but only <span className="ink font-semibold">eight</span> join
            the 24 group qualifiers in the Round of 32. You decide who makes the cut.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[13px] mute num"><b className={full ? "accent" : "ink"}>{thirds.length}</b>/8 picked</span>
          <button onClick={onAutoPick} disabled={known < 12} className="btn btn-ghost btn-sm" style={known < 12 ? { opacity: 0.45, cursor: "not-allowed" } : undefined}>
            <Wand s={14} className="accent" /> Auto-pick best 8
          </button>
          {thirds.length > 0 && <button onClick={onClear} className="btn btn-ghost btn-sm">Clear</button>}
        </div>
      </div>

      <div className="surf rounded-2xl overflow-hidden" style={{ borderRadius: 18 }}>
        <div
          className="grid grid-cols-[2.5rem_1fr_auto_auto] sm:grid-cols-[3rem_1fr_5rem_6rem] items-center gap-3 px-4 py-2.5 eyebrow"
          style={{ fontSize: 9, borderBottom: "1px solid var(--hair)" }}
        >
          <span>Group</span><span>Third-placed team</span><span className="text-center">Rating</span><span className="text-right">Status</span>
        </div>
        {rows.map((r, i) => {
          const sel = !!r.team && thirds.includes(r.team.code);
          const disabled = !r.team || (!sel && full);
          return (
            <button
              key={r.group}
              onClick={() => r.team && !disabled && onToggle(r.team.code)}
              disabled={disabled}
              className="grid grid-cols-[2.5rem_1fr_auto_auto] sm:grid-cols-[3rem_1fr_5rem_6rem] items-center gap-3 px-4 w-full text-left transition-colors"
              style={{
                height: 46,
                cursor: disabled ? "default" : "pointer",
                borderBottom: i < rows.length - 1 ? "1px solid var(--hair)" : "none",
                borderLeft: "2px solid " + (sel ? "var(--accent)" : "transparent"),
                background: sel ? "color-mix(in srgb, var(--accent) 6%, transparent)" : "transparent",
                opacity: !r.team ? 0.5 : !sel && full ? 0.55 : 1,
              }}
            >
              <span className="num font-bold text-sm" style={{ color: sel ? "var(--accent)" : "var(--mute)" }}>{r.group}</span>
              {r.team ? (
                <span className="flex items-center gap-2.5 min-w-0">
                  <Crest team={r.team} size={24} />
                  <span className="font-bold text-[13px] num tracking-wide ink shrink-0">{r.team.code}</span>
                  <span className="text-[12px] ink2 truncate flex-1 min-w-0">{r.team.name}</span>
                </span>
              ) : (
                <span className="text-[12px] italic" style={{ color: "var(--mute)" }}>Rank Group {r.group} first</span>
              )}
              <span className="text-center text-[11px] num font-semibold" style={{ color: "var(--mute)" }}>{r.team?.strength ?? "—"}</span>
              <span className="text-right">
                {sel ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: "var(--accent)" }}><Check s={12} /> Through</span>
                ) : r.team ? (
                  <span className="text-[11px] mute">{full ? "Out" : "Tap to pick"}</span>
                ) : null}
              </span>
            </button>
          );
        })}
        <div className="flex items-center justify-center gap-2 py-2.5 text-[10px] mute" style={{ borderTop: "1px solid var(--hair)" }}>
          <span style={{ width: 8, height: 8, borderRadius: 99, background: "var(--accent)", display: "inline-block" }} />
          pick exactly eight — the other four go home
        </div>
      </div>
    </section>
  );
}

/* --------------------------- BRACKET SECTION ---------------------------- */
function BracketSection({ ranks, thirds, picks, onPick, onReset, onSim, anim }: {
  ranks: GroupRanks;
  thirds: string[];
  picks: Picks;
  onPick: (id: string, code: string) => void;
  onReset: () => void;
  onSim: () => void;
  anim: boolean;
}) {
  const groupsDone = GROUPS.filter((g) => (ranks[g.name]?.length ?? 0) >= 3).length;
  const ready = groupsDone === 12 && thirds.length === 8;
  const { champion, decided, total } = useMemo(
    () => computeBracket(ranks, thirds, picks),
    [ranks, thirds, picks]
  );
  const path = useMemo(
    () => championPath(ranks, thirds, picks, champion),
    [ranks, thirds, picks, champion]
  );

  return (
    <section id="bracket" className="relative z-10 max-w-7xl mx-auto px-6 mt-24">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-6 reveal">
        <div>
          <div className="eyebrow accent mb-3">Phase 3 — the knockouts</div>
          <h2 className="display text-3xl sm:text-[2.6rem] ink">Tap a team to send them through.</h2>
          <p className="ink2 text-[15px] mt-3 max-w-xl">The official match plan — every third-place slot lands where FIFA&apos;s allocation rules put it.</p>
        </div>
        {ready && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[13px] mute num"><b className={decided === total ? "accent" : "ink"}>{decided}</b>/{total} decided</span>
            <button onClick={onSim} className="btn btn-ghost btn-sm"><Wand s={14} className="accent" /> Sim the rest</button>
            {decided > 0 && <button onClick={onReset} className="btn btn-ghost btn-sm">Clear picks</button>}
          </div>
        )}
      </div>

      {ready ? (
        <>
          <div className="relative rounded-3xl overflow-hidden surf p-3 sm:p-5" style={{ borderRadius: 22 }}>
            <div className="glow-blob" style={{ top: -120, left: "50%", transform: "translateX(-50%)", width: 520, height: 240, opacity: 0.5 }} />
            <div className="relative">
              <Bracket ranks={ranks} thirds={thirds} picks={picks} onPick={onPick} anim={anim} />
            </div>
          </div>
          {champion && path.length > 0 && <Recap champion={champion} path={path} anim={anim} />}
        </>
      ) : (
        <div className="relative rounded-3xl overflow-hidden surf p-10 sm:p-14 text-center" style={{ borderRadius: 22 }}>
          <div className="glow-blob" style={{ top: -100, left: "50%", transform: "translateX(-50%)", width: 420, height: 200, opacity: 0.4 }} />
          <div className="relative max-w-md mx-auto">
            <span className="inline-grid place-items-center w-12 h-12 rounded-full mb-5" style={{ border: "1px solid var(--hair-2)", color: "var(--mute)" }}>
              <Lock s={18} />
            </span>
            <h3 className="display text-2xl ink">The knockouts are locked.</h3>
            <p className="ink2 text-[14px] mt-3">Finish the group stage to open the bracket.</p>
            <div className="mt-7 flex flex-col gap-2.5 text-left">
              <Requirement done={groupsDone === 12} label={`Rank all 12 groups`} progress={`${groupsDone}/12`} href="#groups" />
              <Requirement done={thirds.length === 8} label={`Pick the 8 best thirds`} progress={`${thirds.length}/8`} href="#thirds" />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Requirement({ done, label, progress, href }: { done: boolean; label: string; progress: string; href: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors hover:opacity-90"
      style={{
        border: "1px solid " + (done ? "color-mix(in srgb, var(--accent) 40%, var(--hair))" : "var(--hair)"),
        background: done ? "color-mix(in srgb, var(--accent) 6%, transparent)" : "var(--surf)",
      }}
    >
      <span className="w-5 h-5 rounded-full grid place-items-center shrink-0"
        style={done ? { background: "var(--accent)", color: "var(--accent-ink)" } : { border: "1.5px solid var(--hair-2)" }}>
        {done && <Check s={11} />}
      </span>
      <span className="text-[13px] font-semibold" style={{ color: done ? "var(--ink)" : "var(--ink-2)" }}>{label}</span>
      <span className="ml-auto num text-[12px]" style={{ color: done ? "var(--accent)" : "var(--mute)" }}>{progress}</span>
    </a>
  );
}

/* ------------------------------ RECAP ----------------------------------- */
function Recap({ champion, path, anim }: {
  champion: Team;
  path: { round: string; opp: Team }[];
  anim: boolean;
}) {
  return (
    <div className="mt-7 grid lg:grid-cols-[0.95fr_1.45fr] gap-3.5">
      <div
        className="relative rounded-3xl overflow-hidden p-8 flex flex-col items-center justify-center text-center"
        style={{ border: "1px solid var(--hair-2)", background: "color-mix(in srgb, var(--accent) 6%, var(--surf))", borderRadius: 22 }}
      >
        {anim && <Confetti />}
        <div className="glow-blob" style={{ top: -60, left: "50%", transform: "translateX(-50%)", width: 320, height: 180 }} />
        <div className="relative">
          <div className="eyebrow" style={{ color: "var(--accent)" }}>Your world champion</div>
          <div className={"mt-5 flex justify-center " + (anim ? "pop" : "")}><Crest team={champion} size={96} /></div>
          <div className="mt-3 display text-4xl ink">{champion.name}</div>
          <div className="num mt-2 text-[12px]" style={{ color: "var(--mute)", letterSpacing: "0.1em" }}>
            {champion.code} · RATING {champion.strength} · {champion.conf}
          </div>
        </div>
      </div>
      <div className="card p-6" style={{ borderRadius: 22 }}>
        <div className="eyebrow accent mb-5">Road to the title</div>
        <div className="flex flex-col">
          {path.map((step, i) => (
            <div key={i} className="flex items-center gap-3 py-3" style={{ borderBottom: i < path.length - 1 ? "1px solid var(--hair)" : "none" }}>
              <span className="eyebrow w-24 shrink-0" style={{ fontSize: 9, letterSpacing: "0.12em" }}>{step.round}</span>
              <Crest team={step.opp} size={26} />
              <span className="font-bold text-sm num ink w-9">{step.opp.code}</span>
              <span className="text-[13px] ink2 hidden sm:block truncate">{step.opp.name}</span>
              <span className="ml-auto inline-flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: "var(--accent)" }}>
                <Check s={13} /> beat
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Confetti() {
  // Generated after mount so SSR markup stays deterministic.
  const [bits, setBits] = useState<{ left: number; delay: number; dur: number; rot: number }[]>([]);
  useEffect(() => {
    setBits(
      Array.from({ length: 18 }, () => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        dur: 1.6 + Math.random() * 1.3,
        rot: Math.random() * 360,
      }))
    );
  }, []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {bits.map((b, i) => (
        <span
          key={i}
          className="confetti w-1.5 h-2.5 rounded-[1px]"
          style={{
            left: b.left + "%",
            background: i % 3 === 0 ? "var(--accent)" : "var(--ink-2)",
            animationDelay: b.delay + "s",
            animationDuration: b.dur + "s",
            transform: `rotate(${b.rot}deg)`,
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------- FAQ ------------------------------------ */
function FaqSection() {
  return (
    <section id="faq" className="relative z-10 max-w-7xl mx-auto px-6 mt-24">
      <div className="mb-8 max-w-xl reveal">
        <div className="eyebrow accent mb-3">Good to know</div>
        <h2 className="display text-3xl sm:text-[2.6rem] ink">The 2026 format, explained.</h2>
        <p className="ink2 text-[15px] mt-3">
          Everything the simulator models — the new 48-team format, the third-place
          rule and the official knockout bracket.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {FAQ.map((f) => (
          <div key={f.q} className="card p-6">
            <h3 className="text-[15px] font-bold ink">{f.q}</h3>
            <p className="mt-2 text-[13.5px] ink2 leading-relaxed">{f.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------ FOOTER --------------------------------- */
function Footer() {
  return (
    <footer className="relative z-10 max-w-7xl mx-auto px-6 mt-24 pb-12">
      <div className="flex items-center justify-between text-[12px] mute flex-wrap gap-3 pt-6" style={{ borderTop: "1px solid var(--hair)" }}>
        <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
          <span style={{ width: 7, height: 7, borderRadius: 99, background: "var(--accent)", display: "inline-block" }} />
          <span>Goal Miners · back to games</span>
        </Link>
        <span>Projected field & ratings — not an official FIFA draw.</span>
      </div>
    </footer>
  );
}

/* ------------------------------- PAGE ----------------------------------- */
const SIM_KEY = "wc26-sim-v1";

export default function WorldCupPage() {
  const { theme, motion, setTheme, setMotion } = usePrefs();
  const [ranks, setRanks] = useState<GroupRanks>({});
  const [thirds, setThirds] = useState<string[]>([]);
  const [picks, setPicks] = useState<Picks>({});
  const anim = motion !== "off";
  const bigMotion = motion === "full";

  // restore the saved simulation
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SIM_KEY) || "{}");
      if (saved.ranks && typeof saved.ranks === "object") setRanks(saved.ranks);
      if (Array.isArray(saved.thirds)) setThirds(saved.thirds);
      if (saved.picks && typeof saved.picks === "object") setPicks(saved.picks);
    } catch {
      /* corrupted save — start fresh */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(SIM_KEY, JSON.stringify({ ranks, thirds, picks }));
    } catch {
      /* storage unavailable */
    }
  }, [ranks, thirds, picks]);

  /* phase 1: tap to rank / unrank */
  const onToggleRank = useCallback((group: string, code: string) => {
    setRanks((r) => {
      const cur = r[group] ?? [];
      const next = cur.includes(code)
        ? cur.filter((c) => c !== code)
        : cur.length < 3
          ? [...cur, code]
          : cur;
      return { ...r, [group]: next };
    });
  }, []);
  const onClearGroup = useCallback((group: string) => {
    setRanks((r) => ({ ...r, [group]: [] }));
  }, []);
  const onAutoFill = useCallback(() => {
    setRanks((r) => {
      const next = { ...r };
      GROUPS.forEach((g) => {
        if ((next[g.name]?.length ?? 0) < 3) {
          next[g.name] = [...g.teams].sort(byStr).slice(0, 3).map((t) => t.code);
        }
      });
      return next;
    });
  }, []);
  const onClearAll = useCallback(() => { setRanks({}); setThirds([]); setPicks({}); }, []);

  // A selected third only counts while it is still that group's 3rd place —
  // derived (not pruned in state) so re-ranking a group can never wipe a
  // freshly restored selection.
  const validThirds = useMemo(
    () => thirds.filter((c) => ranks[GROUP_OF[c]]?.[2] === c),
    [thirds, ranks]
  );

  /* phase 2: choose 8 thirds */
  const onToggleThird = useCallback((code: string) => {
    setThirds((t) => {
      const valid = t.filter((c) => ranks[GROUP_OF[c]]?.[2] === c);
      if (valid.includes(code)) return valid.filter((c) => c !== code);
      return valid.length < 8 ? [...valid, code] : valid;
    });
  }, [ranks]);
  const onAutoPickThirds = useCallback(() => {
    setThirds(() => {
      const all = GROUPS.map((g) => ranks[g.name]?.[2]).filter(Boolean) as string[];
      return all.map((c) => TEAM_BY_CODE[c]).sort(byStr).slice(0, 8).map((t) => t.code);
    });
  }, [ranks]);
  const onClearThirds = useCallback(() => setThirds([]), []);

  /* phase 3: knockout picks */
  const onPick = useCallback((id: string, code: string) => setPicks((p) => ({ ...p, [id]: code })), []);
  const onResetPicks = useCallback(() => setPicks({}), []);
  const onSimRest = useCallback(
    () => setPicks((p) => simRemainingPicks(ranks, validThirds, p)),
    [ranks, validThirds]
  );

  const scrollToGroups = useCallback(() => {
    const el = document.getElementById("groups");
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 20, behavior: "smooth" });
  }, []);

  return (
    <main className="wc relative min-h-dvh overflow-hidden" data-theme={theme} data-motion={motion}>
      <Backdrop />
      <Nav />
      <Hero onBuild={scrollToGroups} />
      <GroupStage ranks={ranks} onToggle={onToggleRank} onClear={onClearGroup} onAutoFill={onAutoFill} onClearAll={onClearAll} />
      <ThirdsSelect ranks={ranks} thirds={validThirds} onToggle={onToggleThird} onAutoPick={onAutoPickThirds} onClear={onClearThirds} />
      <BracketSection ranks={ranks} thirds={validThirds} picks={picks} onPick={onPick} onReset={onResetPicks} onSim={onSimRest} anim={bigMotion} />
      <FaqSection />
      <Footer />
      <TweaksPanel theme={theme} motion={motion} onTheme={setTheme} onMotion={setMotion} />
    </main>
  );
}

function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
      <div className="glow-blob" style={{ top: -200, right: -120, width: 560, height: 560, opacity: 0.6 }} />
      <div className="glow-blob" style={{ bottom: -260, left: -160, width: 520, height: 520, opacity: 0.35 }} />
    </div>
  );
}
