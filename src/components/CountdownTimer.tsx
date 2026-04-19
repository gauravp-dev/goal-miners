"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type Props = {
  /** Epoch ms when the countdown ends. */
  endsAt: number;
  /** Total duration of the countdown for progress ring math. */
  totalMs: number;
  /** Fires once, when countdown reaches 0. */
  onDone?: () => void;
  size?: number;
  className?: string;
};

export function CountdownTimer({ endsAt, totalMs, onDone, size = 64, className }: Props) {
  const [remaining, setRemaining] = React.useState(() => Math.max(0, endsAt - Date.now()));
  const fired = React.useRef(false);

  React.useEffect(() => {
    fired.current = false;
    const id = setInterval(() => {
      const left = Math.max(0, endsAt - Date.now());
      setRemaining(left);
      if (left === 0 && !fired.current) {
        fired.current = true;
        onDone?.();
        clearInterval(id);
      }
    }, 100);
    return () => clearInterval(id);
  }, [endsAt, onDone]);

  const seconds = Math.ceil(remaining / 1000);
  const pct = Math.max(0, Math.min(1, remaining / totalMs));
  const circ = 2 * Math.PI * 28;
  const critical = seconds <= 3 && remaining > 0;

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        critical && "animate-shake",
        className,
      )}
      style={{ width: size, height: size }}
      aria-label={`Countdown: ${seconds} seconds`}
    >
      <svg viewBox="0 0 64 64" width={size} height={size}>
        <circle cx="32" cy="32" r="28" className="fill-none stroke-zinc-800" strokeWidth="5" />
        <circle
          cx="32"
          cy="32"
          r="28"
          strokeWidth="5"
          strokeLinecap="round"
          transform="rotate(-90 32 32)"
          className={cn(
            "fill-none transition-colors",
            critical ? "stroke-red-500" : "stroke-emerald-400",
          )}
          style={{
            strokeDasharray: circ,
            strokeDashoffset: circ * (1 - pct),
            transition: "stroke-dashoffset 100ms linear",
          }}
        />
      </svg>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center font-bold num-ticker",
          critical ? "text-red-400" : "text-zinc-100",
        )}
        style={{ fontSize: size * 0.3 }}
      >
        {seconds}
      </span>
    </div>
  );
}
