import type React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ChromaCurrentBackdrop } from "@/components/backgrounds/ChromaCurrentBackdrop";
import { LogoCollapse } from "@/components/snap-cn/logo-collapse";
import { inter } from "@/lib/fonts";

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * 6 scrubbed 1920x1080 MemWal Skills x Tatum product shots dealt on tightening beats:
 * 15 + 13 + 11 + 9 + 6 + 6 = 60 frames -> collapses onto the MemWal mark at
 * S2_START (180) + 60 = frame 240 (8.00s = Musical DROP A downbeat!).
 */
export const LOGO_COLLAPSE_HOLDS = [15, 13, 11, 9, 6, 6] as const;
export const LOGO_COLLAPSE_CUT_FRAMES = [0, 15, 28, 39, 48, 54] as const;
export const LOGO_COLLAPSE_IMPACT_FRAME = 60;

const SHOTS = [
  "/shots/clean-1-flow-graph-dark.png",
  "/shots/clean-2-tatum-playground.png",
  "/shots/clean-4-connect-tatum-mcp.png",
  "/shots/shot-2-ai-collection-creator.png",
  "/shots/clean-3-ab-verdict.png",
  "/shots/shot-5-seal-5-gates.png",
].join("|");

const SIZES =
  "0.86x0.484,0.77x0.433,0.68x0.382,0.58x0.326,0.48x0.270,0.38x0.214";

export const Scene2LogoCollapse: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const subReveal = spring({
    frame: Math.max(0, frame - 86),
    fps,
    config: { damping: 18, stiffness: 145, mass: 0.82 },
  });
  const subOpacity = interpolate(frame, [86, 98], [0, 1], CLAMP);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#f5f6f1",
        fontFamily: inter.fontFamily,
        overflow: "hidden",
      }}
    >
      {/* Demo App Sorbet Cream + Emerald/Teal Perlin Dither Currents */}
      <ChromaCurrentBackdrop mode="light" intensity={0.9} />

      {/* Center calm cushion so product prints and final MemWal lockup pop cleanly */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 58% 50% at 50% 50%, rgba(245, 246, 241, 0.86) 0%, rgba(245, 246, 241, 0.34) 66%, rgba(245, 246, 241, 0) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Official @snapcn/logo-collapse (pure visual rhythm, zero ALL-CAPS slop) */}
      <LogoCollapse
        images={SHOTS}
        sizes={SIZES}
        holds={LOGO_COLLAPSE_HOLDS.join(",")}
        mark="/logo/memwal-mark.svg"
        wordmark="MemWal"
        accent="#059669"
        mode="light"
        transparent
        cardRadius={9}
        theme={{
          background: "#f5f6f1",
          foreground: "#141413",
          muted: "#dcfce7",
          primary: "#059669",
        }}
      />

      {/* Clean editorial subcaption after lockup settles */}
      {frame >= 86 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 644,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            opacity: subOpacity,
            transform: `translateY(${interpolate(subReveal, [0, 1], [16, 0])}px)`,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              fontSize: 30,
              fontWeight: 600,
              letterSpacing: "-0.022em",
              color: "#1f2937",
            }}
          >
            Shared Agent Skills &amp; Wallet Security with Tatum
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
