import type React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ArrowUpRight, Terminal } from "lucide-react";
import { ChromaCurrentBackdrop } from "@/components/backgrounds/ChromaCurrentBackdrop";
import { WalrusLogo3DVideo } from "@/components/brand/WalrusBrandPrimitives";
import { SNAP_CN_UI } from "@/lib/brand-tokens";

/** End card in the app's own look: the light dithered canvas, the MemWal mark and the app's own tagline. */
export const SceneEndLight: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rise = (delay: number) =>
    spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 150, mass: 0.8 } });
  const lift = (v: number) => ({ opacity: v, transform: `translateY(${(1 - v) * 24}px)` });
  const mark = rise(0);
  const glow = interpolate(frame, [0, 10, 60], [0.3, 1, 0.6], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ink = SNAP_CN_UI.light.textPrimary;

  return (
    <AbsoluteFill style={{ backgroundColor: SNAP_CN_UI.light.canvas, fontFamily: SNAP_CN_UI.fontFamily }}>
      <ChromaCurrentBackdrop mode="light" intensity={0.9} />
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse 58% 52% at 50% 50%, rgba(245,246,241,0.94), rgba(245,246,241,0.35) 85%)",
        }}
      />
      <AbsoluteFill
        style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28, ...lift(mark) }}>
          <div
            style={{
              width: 128,
              height: 128,
              borderRadius: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#ffffff",
              border: "1.5px solid rgba(5,150,105,0.35)",
              boxShadow: `0 0 ${70 * glow}px rgba(16,185,129,${0.3 * glow}), 0 20px 50px rgba(6,78,59,0.14)`,
            }}
          >
            <WalrusLogo3DVideo size={92} color="#059669" glow={false} />
          </div>
          <span style={{ fontSize: 112, fontWeight: 750, letterSpacing: "-0.04em", color: ink }}>MemWal</span>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 46,
            fontWeight: 650,
            letterSpacing: "-0.025em",
            color: ink,
            textAlign: "center",
            lineHeight: 1.2,
            ...lift(rise(6)),
          }}
        >
          Teach your AI once.
          <br />
          <span style={{ color: "#059669" }}>Every teammate's IDE remembers it.</span>
        </p>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 14,
            marginTop: 8,
            padding: "16px 30px",
            borderRadius: 999,
            background: "#141413",
            boxShadow: "0 18px 40px rgba(20,20,19,0.18)",
            ...lift(rise(13)),
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
            gap: 8,
            fontSize: 26,
            fontWeight: 600,
            color: "#047857",
            ...lift(rise(19)),
          }}
        >
          docs.wal.app/walrus-memory
          <ArrowUpRight size={24} color="#059669" strokeWidth={2.4} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default SceneEndLight;
