import type React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ArrowUpRight, Terminal } from "lucide-react";
import { ChromaCurrentBackdrop } from "@/components/backgrounds/ChromaCurrentBackdrop";
import { WalrusLogo3DVideo } from "@/components/brand/WalrusBrandPrimitives";
import { SNAP_CN_UI } from "@/lib/brand-tokens";

export const END_CARD_FRAMES = 140;

/** Brand lockup and call to action. Lands on the score's final chord. */
export const SceneEndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rise = (delay: number) =>
    spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 140, mass: 0.85 } });
  const mark = rise(0);
  const title = rise(5);
  const sub = rise(10);
  const cta = rise(16);
  const url = rise(22);
  const glow = interpolate(frame, [0, 8, 50], [0.2, 1, 0.55], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lift = (v: number) => ({ opacity: v, transform: `translateY(${(1 - v) * 26}px)` });

  return (
    <AbsoluteFill style={{ backgroundColor: "#080c0b", fontFamily: SNAP_CN_UI.fontFamily }}>
      <ChromaCurrentBackdrop mode="dark" intensity={0.9} />
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse 60% 55% at 50% 48%, rgba(8,12,11,0.5), rgba(8,12,11,0.88))",
        }}
      />
      <AbsoluteFill
        style={{
          padding: "108px 192px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 26,
        }}
      >
        <div
          style={{
            width: 162,
            height: 162,
            borderRadius: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(150deg, rgba(22,38,34,0.95), rgba(10,16,15,0.98))",
            border: "1.5px solid rgba(52,217,150,0.52)",
            boxShadow: `0 0 ${90 * glow}px rgba(52,217,150,${0.4 * glow}), 0 28px 64px rgba(0,0,0,0.65)`,
            opacity: mark,
            transform: `scale(${0.8 + 0.2 * mark})`,
          }}
        >
          <WalrusLogo3DVideo size={112} color="#34d996" />
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 88,
            fontWeight: 750,
            color: "#f8fafc",
            letterSpacing: "-0.035em",
            lineHeight: 1.05,
            ...lift(title),
          }}
        >
          Walrus Memory
        </h1>
        <p style={{ margin: 0, fontSize: 36, fontWeight: 520, color: "#cbd5e1", letterSpacing: "-0.015em", ...lift(sub) }}>
          Your team's skills, recalled by every agent.
        </p>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 16,
            marginTop: 10,
            padding: "18px 34px",
            borderRadius: 999,
            backgroundColor: "rgba(15,23,21,0.94)",
            border: "1.5px solid #34d996",
            boxShadow: "0 0 52px rgba(52,217,150,0.24), 0 22px 52px rgba(0,0,0,0.55)",
            ...lift(cta),
          }}
        >
          <Terminal size={26} color="#34d996" strokeWidth={2.4} />
          <span style={{ fontFamily: SNAP_CN_UI.monoFamily, fontSize: 28, fontWeight: 650, color: "#f8fafc" }}>
            npx @mysten-incubation/memwal-mcp
          </span>
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 24px",
            borderRadius: 999,
            backgroundColor: "rgba(52,217,150,0.14)",
            border: "1px solid rgba(52,217,150,0.4)",
            color: "#6ee7b7",
            fontSize: 26,
            fontWeight: 650,
            ...lift(url),
          }}
        >
          docs.wal.app/walrus-memory
          <ArrowUpRight size={24} color="#34d996" strokeWidth={2.4} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default SceneEndCard;
