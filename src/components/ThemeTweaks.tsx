"use client";
/* =========================================================================
   Shared display tweaks for the minimal-theme pages: light/dark theme and
   animation intensity, persisted in localStorage so both routes agree.
   ========================================================================= */
import * as React from "react";

export type Theme = "dark" | "light";
export type Motion = "off" | "subtle" | "full";

const PREFS_KEY = "gm-minimal-prefs";

export function usePrefs() {
  const [theme, setTheme] = React.useState<Theme>("dark");
  const [motion, setMotion] = React.useState<Motion>("full");

  React.useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
      if (saved.theme === "light" || saved.theme === "dark") setTheme(saved.theme);
      if (["off", "subtle", "full"].includes(saved.motion)) setMotion(saved.motion);
    } catch {
      /* corrupted prefs — keep defaults */
    }
  }, []);
  React.useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ theme, motion }));
    } catch {
      /* storage unavailable */
    }
  }, [theme, motion]);

  return { theme, motion, setTheme, setMotion };
}

export function TweaksPanel({
  theme,
  motion,
  onTheme,
  onMotion,
}: {
  theme: Theme;
  motion: Motion;
  onTheme: (t: Theme) => void;
  onMotion: (m: Motion) => void;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="rounded-2xl p-4 w-56" style={{ background: "var(--bg-2)", border: "1px solid var(--hair-2)", boxShadow: "var(--shadow)" }}>
          <div className="eyebrow mb-2" style={{ fontSize: 9 }}>Theme</div>
          <Segmented value={theme} options={["dark", "light"]} onChange={(v) => onTheme(v as Theme)} />
          <div className="eyebrow mb-2 mt-4" style={{ fontSize: 9 }}>Animation</div>
          <Segmented value={motion} options={["off", "subtle", "full"]} onChange={(v) => onMotion(v as Motion)} />
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Display settings"
        aria-expanded={open}
        className="w-11 h-11 rounded-full grid place-items-center transition-transform hover:scale-105"
        style={{ background: "var(--bg-2)", border: "1px solid var(--hair-2)", color: "var(--ink-2)", boxShadow: "var(--shadow)" }}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
        </svg>
      </button>
    </div>
  );
}

function Segmented({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex rounded-full p-0.5" style={{ border: "1px solid var(--hair)", background: "var(--surf)" }}>
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className="flex-1 rounded-full px-2 py-1.5 text-[11px] font-semibold capitalize transition-colors"
          style={
            o === value
              ? { background: "var(--accent)", color: "var(--accent-ink)" }
              : { color: "var(--mute)" }
          }
        >
          {o}
        </button>
      ))}
    </div>
  );
}
