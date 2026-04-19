/**
 * FUT-inspired rating tiers. Drives card color and walkout logic.
 */

export type Tier = "bronze" | "silver" | "gold" | "toty";

export interface TierStyle {
  tier: Tier;
  // Tailwind classes for the card body gradient.
  gradient: string;
  // Border / accent color.
  border: string;
  text: string;
  glow: string; // drop-shadow color for walkouts
}

export function tierFor(ovr: number): Tier {
  if (ovr >= 88) return "toty";
  if (ovr >= 83) return "gold";
  if (ovr >= 75) return "silver";
  return "bronze";
}

export function tierStyle(tier: Tier): TierStyle {
  switch (tier) {
    case "toty":
      return {
        tier,
        gradient: "from-blue-900 via-blue-600 to-sky-400",
        border: "border-sky-300",
        text: "text-white",
        glow: "0 0 40px rgba(56, 189, 248, 0.6)",
      };
    case "gold":
      return {
        tier,
        gradient: "from-yellow-700 via-amber-500 to-yellow-300",
        border: "border-amber-300",
        text: "text-zinc-900",
        glow: "0 0 28px rgba(251, 191, 36, 0.55)",
      };
    case "silver":
      return {
        tier,
        gradient: "from-zinc-500 via-zinc-300 to-zinc-100",
        border: "border-zinc-200",
        text: "text-zinc-900",
        glow: "0 0 20px rgba(212, 212, 216, 0.5)",
      };
    case "bronze":
    default:
      return {
        tier,
        gradient: "from-amber-900 via-amber-700 to-amber-500",
        border: "border-amber-600",
        text: "text-zinc-100",
        glow: "0 0 18px rgba(180, 83, 9, 0.45)",
      };
  }
}

/** Whether a reveal should trigger confetti + walkout stamp. */
export function isWalkout(ovr: number): boolean {
  return ovr >= 88;
}
