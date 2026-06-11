/** Canonical production origin. Override with NEXT_PUBLIC_SITE_URL when the
 *  domain changes (e.g. a custom domain in front of Vercel). */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://goal-miners.vercel.app";

export const SITE_NAME = "Goal Miners";
