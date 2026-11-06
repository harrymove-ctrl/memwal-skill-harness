import type React from "react";
import { ArrowUpRight, Terminal } from "lucide-react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ChromaCurrentBackdrop } from "@/components/backgrounds/ChromaCurrentBackdrop";
import { CloudSkyBackdrop } from "@/components/backgrounds/CloudSkyBackdrop";
import { WalrusBrandMark } from "@/components/brand/WalrusBrandMark";
import { inter, interTight, mono } from "@/lib/fonts";

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export const Scene6FinalLockup: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const settle = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 138, mass: 0.84 },
  });

  const cliIn = interpolate(frame, [10, 22], [0, 1], CLAMP);
  const partnerIn = interpolate(frame, [18, 30], [0, 1], CLAMP);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#7cb8f2",
        fontFamily: inter.fontFamily,
        overflow: "hidden",
      }}
    >
      {/* Bookend Authentic OriginKit CloudSky (preset=base) WebGL Shader */}
      <CloudSkyBackdrop
        windSpeed={1.0}
        sunGlow={0.96}
        cloudDensity={0.68}
        seedOffset={9.4}
      />

      {/* Subtle Sorbet Emerald Dither Edge Vignette */}
      <AbsoluteFill
        style={{
          opacity: 0.18,
          mixBlendMode: "multiply",
          maskImage:
            "radial-gradient(ellipse 70% 62% at 50% 50%, transparent 52%, black 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 62% at 50% 50%, transparent 52%, black 100%)",
        }}
      >
        <ChromaCurrentBackdrop mode="light" intensity={0.7} />
      </AbsoluteFill>

      {/* Center Sunlit Cushion for AAA Contrast */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 58% 48% at 50% 50%, rgba(255, 255, 255, 0.76) 0%, rgba(255, 255, 255, 0.28) 64%, rgba(255, 255, 255, 0) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Final Brand Lockup Held Crisp Through 42.0s */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          transform: `scale(${interpolate(settle, [0, 1], [0.95, 1])})`,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 24,
            padding: "20px 44px 20px 26px",
            borderRadius: 999,
            backgroundColor: "rgba(255, 255, 255, 0.90)",
            border: "1.5px solid rgba(255, 255, 255, 0.98)",
            boxShadow:
              "0 28px 72px rgba(8, 28, 56, 0.16), inset 0 1.5px 0 rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(16px)",
          }}
        >
          <WalrusBrandMark size={94} color="#34d996" darkTile glow />
          <span
            style={{
              fontFamily: interTight.fontFamily,
              fontSize: 82,
              fontWeight: 700,
              letterSpacing: "-0.04em",
              color: "#081426",
              lineHeight: 1,
            }}
          >
            MemWal Skills
          </span>
        </div>

        <div
          style={{
            fontSize: 34,
            fontWeight: 600,
            color: "#0b1829",
            letterSpacing: "-0.022em",
            textAlign: "center",
          }}
        >
          Teach your AI once. Every teammate&apos;s IDE remembers it.
        </div>

        {/* Copyable MCP Command Pill */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 14,
            marginTop: 4,
            padding: "16px 32px",
            borderRadius: 999,
            backgroundColor: "#091512",
            border: "1.5px solid #34d996",
            boxShadow:
              "0 22px 54px rgba(8, 24, 38, 0.28), 0 0 38px rgba(52, 217, 150, 0.24)",
            opacity: cliIn,
            transform: `translateY(${interpolate(cliIn, [0, 1], [12, 0])}px)`,
          }}
        >
          <Terminal size={24} color="#34d996" strokeWidth={2.4} />
          <span
            style={{
              fontFamily: mono.fontFamily,
              fontSize: 24,
              fontWeight: 600,
              color: "#f8fafc",
              letterSpacing: "-0.01em",
            }}
          >
            npx @mysten-incubation/memwal-mcp
          </span>
          <ArrowUpRight size={24} color="#34d996" strokeWidth={2.5} />
        </div>

        {/* Clean Partner Credit Pill */}
        <div
          style={{
            marginTop: 2,
            padding: "10px 26px",
            borderRadius: 999,
            backgroundColor: "rgba(255, 255, 255, 0.88)",
            border: "1px solid rgba(5, 150, 105, 0.28)",
            boxShadow: "0 12px 28px rgba(8, 24, 48, 0.10)",
            fontSize: 20,
            fontWeight: 600,
            color: "#065f46",
            letterSpacing: "-0.01em",
            opacity: partnerIn,
            transform: `translateY(${interpolate(partnerIn, [0, 1], [10, 0])}px)`,
          }}
        >
          Built with Tatum · ai.tatum.io/mcp
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
