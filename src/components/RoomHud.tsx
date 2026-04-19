"use client";
import * as React from "react";
import { motion } from "framer-motion";
import { Copy, Check, Wifi, WifiOff } from "lucide-react";
import type { RoomPlayer } from "@/lib/game-types";
import { cn } from "@/lib/utils";

type Props = {
  /** Room code, 4 uppercase letters. */
  code: string;
  /** The full shareable URL (optional — if provided, copy button copies this instead of the code). */
  shareUrl?: string;
  /** The current participant list. */
  players: RoomPlayer[];
  /** The ID of the currently active player, if any (highlights their tile). */
  activeId?: string | null;
  /** Your own participant id. */
  youId?: string | null;
  /** Optional label for the right-side panel. */
  title?: string;
};

export function RoomHud({ code, shareUrl, players, activeId, youId, title = "Room" }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <CodeBadge code={code} shareUrl={shareUrl} title={title} />
      <ul className="flex flex-col gap-1">
        {players.map((p) => (
          <ParticipantTile
            key={p.id}
            player={p}
            isActive={p.id === activeId}
            isYou={p.id === youId}
          />
        ))}
      </ul>
    </div>
  );
}

function CodeBadge({
  code,
  shareUrl,
  title,
}: {
  code: string;
  shareUrl?: string;
  title: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const toCopy = shareUrl ?? code;

  async function copy() {
    try {
      await navigator.clipboard.writeText(toCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore clipboard errors (iOS in some contexts)
    }
  }

  return (
    <button
      onClick={copy}
      className={cn(
        "group w-full flex items-center justify-between",
        "rounded-xl px-4 py-3 bg-zinc-900/70 border border-zinc-800",
        "hover:bg-zinc-800 transition-all",
      )}
    >
      <div className="flex flex-col items-start">
        <span className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">
          {title}
        </span>
        <span className="text-3xl font-black tracking-[0.25em] num-ticker">{code}</span>
      </div>
      <span
        className={cn(
          "text-xs inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md",
          copied ? "bg-emerald-500/20 text-emerald-300" : "bg-zinc-800 text-zinc-400 group-hover:text-zinc-200",
        )}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? "Copied" : shareUrl ? "Copy link" : "Copy code"}
      </span>
    </button>
  );
}

function ParticipantTile({
  player,
  isActive,
  isYou,
}: {
  player: RoomPlayer;
  isActive: boolean;
  isYou: boolean;
}) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 border",
        isActive
          ? "border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_20px_-6px_rgba(34,197,94,0.6)]"
          : "border-zinc-800 bg-zinc-900/50",
        !player.connected && "opacity-50",
      )}
    >
      <span className="text-2xl leading-none">{player.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold">
            {player.name}
            {isYou && <span className="ml-1 text-xs text-emerald-400">(you)</span>}
          </span>
          {player.connected ? (
            <Wifi size={12} className="text-emerald-500 shrink-0" />
          ) : (
            <WifiOff size={12} className="text-zinc-500 shrink-0" />
          )}
        </div>
      </div>
      <span className="text-sm font-bold num-ticker text-zinc-300">{player.score}</span>
    </motion.li>
  );
}
