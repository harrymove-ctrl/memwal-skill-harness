import type React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Database, GitBranch, KeyRound } from "lucide-react";
import { CloudSkyBackdrop } from "@/components/backgrounds/CloudSkyBackdrop";
import { WalrusLogo3DVideo } from "@/components/brand/WalrusBrandPrimitives";
import { WordGather } from "@/components/snapcn/word-gather";
import { SNAP_CN_UI } from "@/lib/brand-tokens";

const TRUST_PILLS = [
  {
    label: "SKILL.md Graph",
    icon: GitBranch,
    iconColor: "#047857",
  },
  {
    label: "Shared Delegate Keys",
    icon: KeyRound,
    iconColor: "#0369a1",
  },
  {
    label: "On-Chain Walrus Blobs",
    icon: Database,
    iconColor: "#047857",
  },
] as const;

export const Scene1SkyIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const eyebrowSpring = spring({
    frame: Math.max(0, frame - 2),
    fps,
    config: { damping: 18, stiffness: 135, mass: 0.85 },
  });

  const eyebrowY = interpolate(eyebrowSpring, [0, 1], [-22, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const eyebrowOpacity = interpolate(frame, [2, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#cfe8fb",
        fontFamily: SNAP_CN_UI.fontFamily,
        overflow: "hidden",
      }}
    >
      {/* OriginKit CloudSky (preset=base) */}
      <CloudSkyBackdrop windSpeed={1.15} sunGlow={1} />

      {/* Frosted atmospheric radial scrim so #081426 copy holds >9:1 contrast over clouds & sky */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 62% 44% at 50% 50%, rgba(255,255,255,0.48), rgba(255,255,255,0.22) 48%, transparent 75%)",
          pointerEvents: "none",
        }}
      />

      {/* Strict 10% title-safe container (108px top/bottom, 192px left/right) */}
      <AbsoluteFill
        style={{
          padding: "108px 192px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 30,
        }}
      >
        {/* Top Eyebrow Pill */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 14,
            padding: "12px 26px",
            borderRadius: 999,
            backgroundColor: "rgba(255, 255, 255, 0.88)",
            border: "1px solid rgba(255, 255, 255, 0.96)",
            boxShadow:
              "0 14px 36px rgba(8, 20, 38, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.95)",
            transform: `translateY(${eyebrowY}px) scale(${interpolate(
              eyebrowSpring,
              [0, 1],
              [0.94, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            )})`,
            opacity: eyebrowOpacity,
          }}
        >
          <WalrusLogo3DVideo size={30} color="#059669" />
          <span
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: "#0c192c",
              lineHeight: 1.2,
            }}
          >
            WALRUS MEMORY · SKILLBOOK
          </span>
        </div>

        {/* Main Hero Headline (@snapcn/word-gather) */}
        <div style={{ maxWidth: 1480, marginTop: 4 }}>
          <WordGather
            words={["Shared", "memory", "every", "agent", "recalls."]}
            highlight={["every", "agent"]}
            pillHighlight={true}
            pillBg="rgba(255, 255, 255, 0.90)"
            accentColor="#047857"
            textColor="#081426"
            fontSize={86}
            fontWeight={750}
            spread={58}
            blur={10}
            stagger={4}
            startFrame={6}
          />
        </div>

        {/* Secondary Value Line (@snapcn/word-gather) */}
        <div style={{ maxWidth: 1280 }}>
          <WordGather
            words={["One", "namespace.", "Zero", "cold", "starts."]}
            highlight={["Zero"]}
            pillHighlight={true}
            pillBg="rgba(255, 255, 255, 0.86)"
            accentColor="#0369a1"
            textColor="#1e293b"
            fontSize={42}
            fontWeight={600}
            spread={32}
            blur={6}
            stagger={3}
            startFrame={34}
          />
        </div>

        {/* Bottom Floating Trust Strip — springs in at frame 52, holds steady through 165 */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
            gap: 18,
            marginTop: 22,
          }}
        >
          {TRUST_PILLS.map((pill, idx) => {
            const Icon = pill.icon;
            const pillStart = 52 + idx * 5;
            const pillSpring = spring({
              frame: Math.max(0, frame - pillStart),
              fps,
              config: { damping: 18, stiffness: 140, mass: 0.82 },
            });
            const pillOpacity = interpolate(
              frame,
              [pillStart, pillStart + 12],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            const pillY = interpolate(pillSpring, [0, 1], [24, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

            return (
              <div
                key={pill.label}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "13px 24px",
                  borderRadius: 999,
                  backgroundColor: "rgba(255, 255, 255, 0.88)",
                  border: "1px solid rgba(12, 25, 44, 0.12)",
                  boxShadow:
                    "0 12px 30px rgba(8, 20, 38, 0.09), inset 0 1px 0 rgba(255, 255, 255, 0.95)",
                  opacity: pillOpacity,
                  transform: `translateY(${pillY}px)`,
                }}
              >
                <Icon size={22} color={pill.iconColor} strokeWidth={2.3} />
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 620,
                    color: "#0c192c",
                    letterSpacing: "-0.01em",
                    lineHeight: 1.2,
                  }}
                >
                  {pill.label}
                </span>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene1SkyIntro;
