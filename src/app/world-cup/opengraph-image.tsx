import { ImageResponse } from "next/og";

export const alt = "World Cup 2026 Simulator & Bracket Predictor";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#0a0c0f",
          color: "#f3f5f8",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* converging bracket lines */}
        <svg
          width="1200"
          height="630"
          viewBox="0 0 1200 630"
          style={{ position: "absolute", top: 0, left: 0, opacity: 0.35 }}
        >
          <g fill="none" stroke="#2a3138" strokeWidth="2">
            <path d="M 940 80 H 1020 V 180 H 1100" />
            <path d="M 940 280 H 1020 V 180 H 1100" />
            <path d="M 940 380 H 1020 V 480 H 1100" />
            <path d="M 940 580 H 1020 V 480 H 1100" />
            <path d="M 1100 180 H 1160 V 330" />
            <path d="M 1100 480 H 1160 V 330" />
          </g>
          <circle cx="1160" cy="330" r="34" fill="none" stroke="#34d399" strokeWidth="2.5" />
        </svg>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 999,
              background: "#34d399",
              boxShadow: "0 0 60px rgba(52,211,153,0.6)",
            }}
          />
          <div style={{ fontSize: 30, fontWeight: 700, color: "#a7b0bb" }}>
            Goal Miners
          </div>
        </div>
        <div style={{ fontSize: 86, fontWeight: 800, lineHeight: 1.04, marginTop: 44, letterSpacing: -3 }}>
          World Cup 2026
        </div>
        <div style={{ fontSize: 86, fontWeight: 800, lineHeight: 1.04, letterSpacing: -3, color: "#34d399" }}>
          Simulator
        </div>
        <div style={{ fontSize: 30, color: "#a7b0bb", marginTop: 34 }}>
          48 teams · official bracket · pick every match, crown your champion
        </div>
      </div>
    ),
    size
  );
}
