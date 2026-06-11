import { ImageResponse } from "next/og";

export const alt = "Goal Miners — Football Party Games & World Cup 2026 Simulator";
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
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              background: "#34d399",
              boxShadow: "0 0 60px rgba(52,211,153,0.6)",
            }}
          />
          <div style={{ fontSize: 36, fontWeight: 700 }}>Goal Miners</div>
        </div>
        <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05, marginTop: 48, letterSpacing: -3 }}>
          Football games for
        </div>
        <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05, letterSpacing: -3 }}>
          the group chat.
        </div>
        <div style={{ fontSize: 30, color: "#a7b0bb", marginTop: 36 }}>
          5 free multiplayer games · 10,654 real footballers · World Cup 2026 simulator
        </div>
      </div>
    ),
    size
  );
}
