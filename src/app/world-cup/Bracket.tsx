"use client";
/* =========================================================================
   World Cup 2026 — growing knockout tree.
   Starts as the two outer Round-of-32 columns flanking a locked trophy
   centre; each completed round auto-reveals the next columns (slide +
   stagger, connectors drawing in) until the Final unlocks at the centre.
   Every winner is the user's pick; unfilled slots show their FIFA hint.
   ========================================================================= */
import * as React from "react";
import type { Team } from "./data";
import {
  computeBracket,
  deepestUnlockedRound,
  nextOf,
  regionOf,
  roundIdx,
  roundRemaining,
  ROUND_KEYS,
  winnerOf,
  type GroupRanks,
  type Match,
  type Picks,
  type RoundKey,
} from "./engine";

const REVEAL_DELAY = 650;

/* ----------------------------- crest ----------------------------------- */
export function Crest({
  team,
  size = 20,
  className = "",
}: {
  team: Team | null;
  size?: number;
  className?: string;
}) {
  const [broken, setBroken] = React.useState(false);
  if (!team) return null;
  if (broken) {
    return (
      <span className={"shrink-0 " + className} style={{ fontSize: size * 0.8, lineHeight: 1 }} aria-hidden>
        {team.flag}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={team.logo}
      alt={team.code}
      className={"object-contain shrink-0 " + className}
      style={{ width: size, height: size }}
      onError={() => setBroken(true)}
    />
  );
}

/* --------------------------- match card --------------------------------- */
function TeamRow({
  team,
  hint,
  isWinner,
  decided,
  onClick,
}: {
  team: Team | null;
  hint: string;
  isWinner: boolean;
  decided: boolean;
  onClick: () => void;
}) {
  if (!team) {
    return (
      <div className="flex items-center gap-2 h-9 px-2.5 text-[10px] italic" style={{ color: "var(--mute)" }}>
        <span className="w-4 text-center opacity-50">·</span>
        <span className="truncate">{hint}</span>
      </div>
    );
  }
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 h-9 w-full px-2.5 text-left transition-colors"
      style={{
        color: isWinner ? "var(--ink)" : decided ? "var(--mute)" : "var(--ink-2)",
        borderLeft: "2px solid " + (isWinner ? "var(--accent)" : "transparent"),
        background: isWinner ? "color-mix(in srgb, var(--accent) 8%, transparent)" : "transparent",
      }}
    >
      <Crest team={team} size={20} />
      <span className={"font-bold text-[12px] tracking-wide num w-8 " + (isWinner ? "" : "opacity-90")}>
        {team.code}
      </span>
      <span className="text-[11px] truncate flex-1 hidden xl:block" style={{ color: "var(--mute)" }}>
        {team.name}
      </span>
      <span className="num text-[11px] ml-auto" style={{ color: isWinner ? "var(--ink-2)" : "var(--mute)", opacity: 0.85 }}>
        {team.strength}
      </span>
      {isWinner ? (
        <svg viewBox="0 0 24 24" className="w-3 h-3 shrink-0" style={{ color: "var(--accent)" }} fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : (
        <span className="w-3 shrink-0" />
      )}
    </button>
  );
}

type RegisterRef = (id: string, el: HTMLDivElement | null) => void;

function MatchCard({
  match,
  winnerCode,
  onPick,
  registerRef,
  size,
}: {
  match: Match;
  winnerCode?: string;
  onPick: (id: string, code: string) => void;
  registerRef: RegisterRef;
  size?: "lg";
}) {
  const decided = !!winnerCode;
  return (
    <div
      ref={(el) => registerRef(match.id, el)}
      className="relative rounded-lg overflow-hidden"
      style={{
        background: "var(--surf)",
        border: "1px solid " + (size === "lg" ? "var(--hair-2)" : "var(--hair)"),
        boxShadow: size === "lg" ? "0 0 0 1px var(--hair), 0 18px 40px -22px var(--glow)" : "none",
      }}
    >
      <div className="flex items-center justify-between px-2.5 pt-1" style={{ height: 14 }}>
        <span className="num font-semibold" style={{ fontSize: 8, letterSpacing: "0.12em", color: "var(--mute)", opacity: 0.8 }}>
          M{match.no}
        </span>
      </div>
      <TeamRow
        team={match.a}
        hint={match.aHint}
        isWinner={!!winnerCode && !!match.a && winnerCode === match.a.code}
        decided={decided}
        onClick={() => match.a && match.b && onPick(match.id, match.a.code)}
      />
      <div style={{ height: 1, background: "var(--hair)" }} />
      <TeamRow
        team={match.b}
        hint={match.bHint}
        isWinner={!!winnerCode && !!match.b && winnerCode === match.b.code}
        decided={decided}
        onClick={() => match.a && match.b && onPick(match.id, match.b.code)}
      />
    </div>
  );
}

/* --------------------------- bracket view ------------------------------- */
const ROUND_LABELS: Record<RoundKey, string> = {
  r32: "Round of 32",
  r16: "Round of 16",
  qf: "Quarter-finals",
  sf: "Semi-finals",
  final: "Final",
};

function RoundColumn({
  round,
  label,
  matches,
  picks,
  onPick,
  registerRef,
  align,
  open,
  entering,
}: {
  round: RoundKey;
  label: string;
  matches: Match[];
  picks: Picks;
  onPick: (id: string, code: string) => void;
  registerRef: RegisterRef;
  align?: "right";
  open: boolean;
  entering: boolean;
}) {
  return (
    <div className={"wc-col shrink-0" + (open ? " wc-col-open" : "")} aria-hidden={!open} data-round={round}>
      <div className="flex flex-col justify-around h-full" style={{ width: 170 }}>
        <div className="eyebrow mb-1 px-1" style={{ textAlign: align === "right" ? "right" : "left", fontSize: 9, letterSpacing: "0.18em" }}>
          {label}
        </div>
        <div className="flex flex-col justify-around flex-1 gap-2.5">
          {matches.map((m, i) => (
            <div key={m.id} className={entering ? "reveal" : ""} style={entering ? { animationDelay: i * 50 + "ms" } : undefined}>
              <MatchCard match={m} winnerCode={winnerOf(m, picks)?.code} onPick={onPick} registerRef={registerRef} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Connectors({ paths }: { paths: { d: string; entering: boolean }[] }) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }} aria-hidden>
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill="none" style={{ stroke: "var(--hair-2)" }} strokeWidth="1.25" className={p.entering ? "conn-draw" : ""} />
      ))}
    </svg>
  );
}

function LockedCenter({ frontier, remaining }: { frontier: RoundKey; remaining: number }) {
  return (
    <div className="flex flex-col items-center text-center px-3 py-6">
      <div className="relative mb-4">
        <div className="glow-blob" style={{ inset: -30, opacity: 0.35 }} />
        <span className="relative w-14 h-14 rounded-full grid place-items-center" style={{ border: "1px solid var(--hair-2)", background: "var(--surf)" }}>
          <TrophyIcon className="w-6 h-6" style={{ color: "var(--mute)" }} />
        </span>
      </div>
      <div className="eyebrow" style={{ fontSize: 8.5 }}>The final</div>
      <div key={remaining} className="num display text-4xl mt-2 ink pop">{remaining}</div>
      <div className="text-[11px] mute mt-1.5 leading-snug max-w-[150px]">
        {remaining === 1 ? "pick" : "picks"} left in the {ROUND_LABELS[frontier]}
      </div>
    </div>
  );
}

export function Bracket({
  ranks,
  thirds,
  picks,
  onPick,
  anim,
}: {
  ranks: GroupRanks;
  thirds: string[];
  picks: Picks;
  onPick: (id: string, code: string) => void;
  anim: boolean;
}) {
  const { rounds } = React.useMemo(
    () => computeBracket(ranks, thirds, picks),
    [ranks, thirds, picks]
  );
  const frontier = deepestUnlockedRound(rounds, picks);

  // Deepest revealed round. Initialised to the frontier so a restored
  // simulation opens fully grown — the cascade only plays for new picks.
  const [revealed, setRevealed] = React.useState<RoundKey>(() => frontier);
  const [justRevealed, setJustRevealed] = React.useState<RoundKey | null>(null);

  React.useEffect(() => {
    if (roundIdx(frontier) > roundIdx(revealed)) {
      const next = ROUND_KEYS[roundIdx(revealed) + 1];
      const t = setTimeout(() => { setRevealed(next); setJustRevealed(next); }, REVEAL_DELAY);
      return () => clearTimeout(t);
    }
    // Revealed rounds are sticky while picks exist; a full clear collapses the tree.
    if (roundIdx(frontier) < roundIdx(revealed) && Object.keys(picks).length === 0) {
      setRevealed("r32");
      setJustRevealed(null);
    }
  }, [frontier, revealed, picks]);

  React.useEffect(() => {
    if (!justRevealed) return;
    const t = setTimeout(() => setJustRevealed(null), 1400);
    return () => clearTimeout(t);
  }, [justRevealed]);

  const isOpen = (k: RoundKey) => roundIdx(k) <= roundIdx(revealed);

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const refs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const [paths, setPaths] = React.useState<{ d: string; entering: boolean }[]>([]);
  const registerRef = React.useCallback<RegisterRef>((id, el) => { refs.current[id] = el; }, []);

  const recompute = React.useCallback(() => {
    const cont = containerRef.current;
    if (!cont) return;
    const cr = cont.getBoundingClientRect();
    const anchor = (id: string, side: "left" | "right") => {
      const el = refs.current[id];
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: side === "right" ? r.right - cr.left : r.left - cr.left, y: r.top - cr.top + r.height / 2 };
    };
    const out: { d: string; entering: boolean }[] = [];
    const addPath = (id: string, tgt: string, tgtRound: RoundKey) => {
      if (roundIdx(tgtRound) > roundIdx(revealed)) return;
      const reg = regionOf(id);
      const src = anchor(id, reg === "left" ? "right" : "left");
      const dst = anchor(tgt, reg === "left" ? "left" : "right");
      if (!src || !dst) return;
      const midX = (src.x + dst.x) / 2;
      out.push({
        d: `M ${src.x} ${src.y} H ${midX} V ${dst.y} H ${dst.x}`,
        entering: anim && justRevealed === tgtRound,
      });
    };
    [...rounds.r32, ...rounds.r16, ...rounds.qf].forEach((m) => {
      const tgt = nextOf(m.id);
      if (tgt) addPath(m.id, tgt, tgt.split("-")[0] as RoundKey);
    });
    ["sf-0", "sf-1"].forEach((id) => addPath(id, "final-0", "final"));
    setPaths(out);
  }, [rounds, revealed, justRevealed, anim]);

  React.useEffect(() => {
    recompute();
    const ro = new ResizeObserver(recompute);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", recompute);
    const t = setTimeout(recompute, 60);
    return () => { ro.disconnect(); window.removeEventListener("resize", recompute); clearTimeout(t); };
  }, [recompute]);

  // Keep the trophy centred: on load and again after every reveal,
  // once the column expansion has settled.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const center = (smooth: boolean) =>
      el.scrollTo({ left: Math.max(0, (el.scrollWidth - el.clientWidth) / 2), behavior: smooth ? "smooth" : "auto" });
    const t = setTimeout(() => center(true), 500);
    const onResize = () => center(false);
    window.addEventListener("resize", onResize);
    return () => { clearTimeout(t); window.removeEventListener("resize", onResize); };
  }, [revealed]);

  const L = { r32: rounds.r32.slice(0, 8), r16: rounds.r16.slice(0, 4), qf: rounds.qf.slice(0, 2), sf: rounds.sf.slice(0, 1) };
  const R = { r32: rounds.r32.slice(8), r16: rounds.r16.slice(4), qf: rounds.qf.slice(2), sf: rounds.sf.slice(1) };
  const finalMatch = rounds.final[0];
  const finalWinner = winnerOf(finalMatch, picks)?.code;
  const finalOpen = isOpen("final");
  const colProps = (round: RoundKey, matches: Match[], align?: "right") => ({
    round,
    label: ROUND_LABELS[round],
    matches,
    picks,
    onPick,
    registerRef,
    align,
    open: isOpen(round),
    entering: anim && justRevealed === round,
  });

  return (
    <>
      <div ref={scrollRef} className="overflow-x-auto pb-3 -mx-1 px-1">
        <div ref={containerRef} className="relative mx-auto flex items-stretch py-2" style={{ width: "max-content" }}>
          <Connectors paths={paths} />
          <div className="relative z-10 flex items-stretch">
            <RoundColumn {...colProps("r32", L.r32)} />
            <RoundColumn {...colProps("r16", L.r16)} />
            <RoundColumn {...colProps("qf", L.qf)} />
            <RoundColumn {...colProps("sf", L.sf)} />

            <div className="wc-col wc-col-open wc-col-center shrink-0">
              <div className="flex flex-col justify-center items-center h-full px-1" style={{ width: 200 }}>
                {finalOpen ? (
                  <div className={anim && justRevealed === "final" ? "pop w-full flex flex-col items-center" : "w-full flex flex-col items-center"}>
                    <div className="eyebrow mb-2 text-center" style={{ color: "var(--accent)", fontSize: 9 }}>Final</div>
                    <div style={{ width: 190 }}>
                      <MatchCard match={finalMatch} winnerCode={finalWinner} onPick={onPick} registerRef={registerRef} size="lg" />
                    </div>
                    <ChampionBadge champion={winnerOf(finalMatch, picks)} anim={anim} />
                  </div>
                ) : (
                  <LockedCenter frontier={frontier} remaining={roundRemaining(rounds, picks, frontier)} />
                )}
              </div>
            </div>

            <RoundColumn {...colProps("sf", R.sf, "right")} />
            <RoundColumn {...colProps("qf", R.qf, "right")} />
            <RoundColumn {...colProps("r16", R.r16, "right")} />
            <RoundColumn {...colProps("r32", R.r32, "right")} />
          </div>
        </div>
      </div>
      <div className="relative mt-1 flex items-center justify-center gap-2 text-[10px] mute">
        {finalOpen
          ? "Tap either team to set the winner · scroll sideways to see both halves"
          : `Pick every ${ROUND_LABELS[frontier]} winner to grow the bracket`}
      </div>
    </>
  );
}

export function TrophyIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 4h12v4a6 6 0 0 1-12 0V4Z" />
      <path d="M6 6H3.5A2.5 2.5 0 0 0 6 10.5M18 6h2.5A2.5 2.5 0 0 1 18 10.5" />
      <path d="M9.5 14.5 9 18h6l-.5-3.5M8 21h8M10 18v3M14 18v3" />
    </svg>
  );
}

function ChampionBadge({ champion, anim }: { champion: Team | null; anim: boolean }) {
  return (
    <div className="mt-5 w-full flex flex-col items-center text-center">
      <TrophyIcon className="w-5 h-5 mb-1.5" style={{ color: champion ? "var(--accent)" : "var(--mute)" }} />
      <div className="eyebrow" style={{ fontSize: 8.5 }}>{champion ? "Your champion" : "Pick the final"}</div>
      {champion ? (
        <div
          key={champion.code}
          className={"mt-2 w-full rounded-xl px-3 py-3 " + (anim ? "pop" : "")}
          style={{ border: "1px solid var(--hair-2)", background: "color-mix(in srgb, var(--accent) 7%, var(--surf))" }}
        >
          <Crest team={champion} size={44} className="mx-auto" />
          <div className="mt-1.5 font-bold text-base tracking-tight ink">{champion.name}</div>
          <div className="num mt-0.5" style={{ fontSize: 10, color: "var(--mute)", letterSpacing: "0.08em" }}>
            {champion.code} · {champion.strength}
          </div>
        </div>
      ) : (
        <div className="mt-2 text-xs mute">—</div>
      )}
    </div>
  );
}
