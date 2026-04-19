import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export function shuffle<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

/** Pick two distinct items from arr. */
export function pickPair<T>(arr: readonly T[]): [T, T] {
  if (arr.length < 2) throw new Error("pickPair requires at least 2 items");
  const a = Math.floor(Math.random() * arr.length);
  let b = Math.floor(Math.random() * arr.length);
  while (b === a) b = Math.floor(Math.random() * arr.length);
  return [arr[a]!, arr[b]!];
}

/** 4-letter uppercase room code. */
export function generateRoomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I/O to avoid ambiguity
  let s = "";
  for (let i = 0; i < 4; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

const AVATAR_EMOJIS = [
  "⚽",
  "🦁",
  "🐺",
  "🦅",
  "🐉",
  "🦊",
  "🐯",
  "🦈",
  "🐻",
  "🐼",
  "🦉",
  "🐲",
];

export function pickAvatar(existing: string[]): string {
  const available = AVATAR_EMOJIS.filter((e) => !existing.includes(e));
  return available.length ? pickRandom(available) : pickRandom(AVATAR_EMOJIS);
}
