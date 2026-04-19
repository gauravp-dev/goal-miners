"use client";
import * as React from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import type { Player } from "@/lib/game-types";
import { tierFor, tierStyle, isWalkout } from "@/lib/rating-tiers";
import { cn } from "@/lib/utils";

type Props = {
  player?: Player;
  /** When true, show only the card back with "?" until flipped. */
  hidden?: boolean;
  /** OVR to display. Defaults to player.ovr. Pass a separate value when revealing mystery cards. */
  displayOvr?: number | "hidden";
  /** If true, animates OVR number from 0 → real value on mount/flip. */
  countUp?: boolean;
  /** Show mouse-tilt affordance on hover. Default true. */
  tilt?: boolean;
  /** Trigger a big walkout reveal (confetti + shake). Handled by parent via prop change. */
  revealingWalkout?: boolean;
  /** Extra class names on the outer wrapper. */
  className?: string;
  /** When true, the card is rendered "disabled/grayed" — used for elimination states. */
  dim?: boolean;
  /**
   * When true, swap the tier-based gradient/color for a neutral "mystery" palette.
   * Use on the hidden card in Higher-or-Lower so its gold/silver/bronze color doesn't
   * leak whether the OVR is high or low before reveal.
   */
  hideTier?: boolean;
};

/**
 * The FUT-style player card. Reused across every game.
 *
 * States:
 *  - hidden=true                  → shows back of card with "?"
 *  - displayOvr="hidden"          → shows face + name but "??" in the rating slot
 *  - hidden=false, OVR shown      → full card, optional count-up animation on the rating
 *  - revealingWalkout=true        → triggers particle/shake combo in parent; card itself renders with TOTY glow.
 */
export function PlayerCard({
  player,
  hidden = false,
  displayOvr,
  countUp = false,
  tilt = true,
  revealingWalkout = false,
  className,
  dim = false,
  hideTier = false,
}: Props) {
  if (!player) {
    return <div className={cn("h-[360px] w-[240px] rounded-2xl bg-zinc-900/60 animate-pulse", className)} />;
  }

  const tier = hideTier ? "mystery" : tierFor(player.ovr);
  const style = tierStyle(tier);

  return (
    <div className={cn("relative h-[360px] w-[240px] select-none", dim && "opacity-40 grayscale", className)}>
      <AnimatePresence mode="wait" initial={false}>
        {hidden ? (
          <CardBack key="back" />
        ) : (
          <CardFront
            key={`front-${player.id}`}
            player={player}
            style={style}
            displayOvr={displayOvr}
            countUp={countUp}
            tilt={tilt}
            walkout={revealingWalkout || (!hideTier && isWalkout(player.ovr))}
            hideStats={hideTier}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------

function CardBack() {
  return (
    <motion.div
      initial={{ opacity: 0, rotateY: 90 }}
      animate={{ opacity: 1, rotateY: 0 }}
      exit={{ opacity: 0, rotateY: -90 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "absolute inset-0 rounded-2xl card-back-pattern border border-zinc-800",
        "flex flex-col items-center justify-center shadow-2xl",
      )}
    >
      <div className="text-zinc-700 text-8xl font-black">?</div>
      <div className="mt-2 text-zinc-600 uppercase tracking-[0.3em] text-xs">Goal&nbsp;Miners</div>
    </motion.div>
  );
}

function CardFront({
  player,
  style,
  displayOvr,
  countUp,
  tilt,
  walkout,
  hideStats = false,
}: {
  player: Player;
  style: ReturnType<typeof tierStyle>;
  displayOvr?: number | "hidden";
  countUp: boolean;
  tilt: boolean;
  walkout: boolean;
  hideStats?: boolean;
}) {
  // Mouse tilt
  const ref = React.useRef<HTMLDivElement>(null);
  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);
  const x = useTransform(rotY, [-15, 15], ["6%", "-6%"]);
  const y = useTransform(rotX, [-15, 15], ["-4%", "4%"]);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!tilt || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    rotY.set((px - 0.5) * 20);
    rotX.set((0.5 - py) * 20);
  }
  function onLeave() {
    rotX.set(0);
    rotY.set(0);
  }

  const shownOvr = displayOvr === "hidden" ? null : displayOvr ?? player.ovr;

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      initial={{ opacity: 0, rotateY: -90 }}
      animate={{ opacity: 1, rotateY: 0 }}
      exit={{ opacity: 0, rotateY: 90 }}
      transition={{ duration: 0.55, type: "spring", stiffness: 140, damping: 14 }}
      style={{ perspective: 800, rotateX: rotX, rotateY: rotY }}
      className={cn(
        "absolute inset-0 rounded-2xl overflow-hidden shimmer shadow-2xl",
        `bg-gradient-to-br ${style.gradient}`,
        walkout && "animate-pulse-slow ring-2 ring-white/40",
      )}
    >
      {/* Top-left: OVR + position */}
      <div className={cn("absolute top-4 left-5 flex flex-col items-center", style.text)}>
        {shownOvr === null ? (
          <span className="text-5xl font-black num-ticker drop-shadow">??</span>
        ) : (
          <OvrNumber value={shownOvr} countUp={countUp} />
        )}
        <span className="text-base font-bold -mt-1 tracking-wider">{player.pos}</span>
      </div>

      {/* Face image (silhouette fallback if none) */}
      <div className="absolute top-6 right-3 w-28 h-28 opacity-90">
        {player.img ? (
          // Using <img> (not next/image) because the SoFIFA URLs can be flaky — we'd rather a missing image than a broken build.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={player.name}
            src={player.img}
            className="w-full h-full object-contain drop-shadow-[0_8px_6px_rgba(0,0,0,0.4)]"
            onError={(e) => ((e.target as HTMLImageElement).style.opacity = "0")}
          />
        ) : (
          <div className="w-full h-full rounded-full bg-black/10" />
        )}
      </div>

      {/* Name + club band */}
      <div className={cn("absolute left-0 right-0 top-[55%] text-center px-4", style.text)}>
        <div className="text-lg font-extrabold tracking-wide truncate uppercase">
          {player.name}
        </div>
        <div className="text-xs opacity-80 truncate">
          {player.club ?? player.nation}
        </div>
      </div>

      {/* Stats grid — hidden on mystery cards so stat totals don't leak OVR */}
      {hideStats ? (
        <div className={cn("absolute bottom-4 left-4 right-4 flex items-center justify-center gap-2 text-xs font-bold tracking-[0.3em] uppercase opacity-60", style.text)}>
          <span>Stats hidden</span>
        </div>
      ) : (
        <div className={cn("absolute bottom-4 left-4 right-4 grid grid-cols-3 gap-y-1 gap-x-2 text-[11px] font-bold tracking-wide", style.text)}>
          <Stat label="PAC" value={player.pace} />
          <Stat label="SHO" value={player.sho} />
          <Stat label="PAS" value={player.pas} />
          <Stat label="DRI" value={player.dri} />
          <Stat label="DEF" value={player.def} />
          <Stat label="PHY" value={player.phy} />
        </div>
      )}

      {/* Hover parallax inner shift — gives a subtle 3D feel */}
      <motion.div style={{ x, y }} className="pointer-events-none absolute inset-0" aria-hidden />
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex items-center gap-1">
      <span className="num-ticker">{value ?? "—"}</span>
      <span className="opacity-70">{label}</span>
    </div>
  );
}

function OvrNumber({ value, countUp }: { value: number; countUp: boolean }) {
  const mv = useMotionValue(countUp ? 0 : value);
  const [display, setDisplay] = React.useState(countUp ? 0 : value);

  React.useEffect(() => {
    if (!countUp) {
      setDisplay(value);
      return;
    }
    const controls = animate(mv, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return controls.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, countUp]);

  return <span className="text-5xl font-black num-ticker drop-shadow">{display}</span>;
}
