import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Tier colors for player cards
        bronze: { DEFAULT: "#cd7f32", dark: "#8b4513" },
        silver: { DEFAULT: "#c0c0c0", dark: "#808080" },
        gold: { DEFAULT: "#d4af37", dark: "#8b6914" },
        icon: { DEFAULT: "#e5e4e2", dark: "#7a7673" },
        toty: { DEFAULT: "#1e90ff", dark: "#000080" },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 2s linear infinite",
        shake: "shake 0.4s cubic-bezier(.36,.07,.19,.97) both",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        shake: {
          "10%, 90%": { transform: "translate3d(-1px, 0, 0)" },
          "20%, 80%": { transform: "translate3d(2px, 0, 0)" },
          "30%, 50%, 70%": { transform: "translate3d(-3px, 0, 0)" },
          "40%, 60%": { transform: "translate3d(3px, 0, 0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
