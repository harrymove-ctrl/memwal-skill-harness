import type React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Layers, ShieldCheck } from "lucide-react";
import { ChromaCurrentBackdrop } from "@/components/backgrounds/ChromaCurrentBackdrop";
import {
  WalrusLogo3DVideo,
  buildWalrusCollapsePlates,
} from "@/components/brand/WalrusBrandPrimitives";
import { LogoCollapse } from "@/components/snapcn/logo-collapse";
import { SNAP_CN_UI } from "@/lib/brand-tokens";

export const Scene2LogoCollapse: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const plates = buildWalrusCollapsePlates();

  const contextEnter = spring({
    frame,
    fps,
    config: { damping: 19, stiffness: 135, mass: 0.85 },
  });

  const contextFadeOut = interpolate(frame, [36, 48], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const contextOpacity =
    interpolate(frame, [0, 10], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) * contextFadeOut;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: SNAP_CN_UI.dark.canvas,
        fontFamily: SNAP_CN_UI.fontFamily,
        overflow: "hidden",
      }}
    >
      {/* Rich Dark Obsidian + Emerald ChromaCurrent Stage */}
      <ChromaCurrentBackdrop mode="dark" intensity={1.15} />

      {/* Subtle radial vignette for crisp center focal contrast */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 58% 52% at 50% 50%, rgba(8, 12, 11, 0.56), transparent 78%)",
          pointerEvents: "none",
        }}
      />

      {/* @snapcn/logo-collapse Brand Implosion & Reveal */}
      <LogoCollapse
        plates={plates}
        collapseStart={38}
        collapseDuration={34}
        logoContent={
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 24,
              padding: "0 192px",
            }}
          >
            {/* Glowing Glass Pedestal */}
            <div
              style={{
                width: 174,
                height: 174,
                borderRadius: 42,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "linear-gradient(155deg, rgba(24, 38, 34, 0.94), rgba(10, 16, 15, 0.98))",
                border: "1.5px solid rgba(52, 217, 150, 0.48)",
                boxShadow:
                  "0 0 84px rgba(52, 217, 150, 0.28), 0 28px 64px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.18)",
              }}
            >
              <WalrusLogo3DVideo size={124} color="#34d996" />
            </div>

            {/* Bold Wordmark */}
            <div
              style={{
                fontSize: 78,
                fontWeight: 750,
                color: "#f8fafc",
                letterSpacing: "-0.035em",
                lineHeight: 1.05,
                textAlign: "center",
                textShadow: "0 12px 40px rgba(0, 0, 0, 0.55)",
              }}
            >
              Walrus Memory
            </div>
          </div>
        }
        subcopyContent={
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
              maxWidth: 1360,
              padding: "0 48px",
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 520,
                color: "#cbd5e1",
                letterSpacing: "-0.015em",
                lineHeight: 1.35,
                textAlign: "center",
              }}
            >
              Your team’s SKILL.md and flow memory, on Walrus
            </div>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 24px",
                borderRadius: 999,
                backgroundColor: "rgba(17, 26, 24, 0.90)",
                border: "1px solid rgba(52, 217, 150, 0.44)",
                boxShadow:
                  "0 12px 32px rgba(0, 0, 0, 0.42), 0 0 28px rgba(52, 217, 150, 0.14)",
              }}
            >
              <ShieldCheck size={24} color="#34d996" strokeWidth={2.3} />
              <span
                style={{
                  fontFamily: SNAP_CN_UI.monoFamily,
                  fontSize: 22,
                  fontWeight: 600,
                  color: "#34d996",
                  letterSpacing: "-0.01em",
                }}
              >
                memwal-team-skills · 14 skills
              </span>
            </div>
          </div>
        }
      />

      {/* Top Subtle Context Label inside 10% Safe Zone — fades out cleanly around frame 45 */}
      {contextOpacity > 0.01 && (
        <div
          style={{
            position: "absolute",
            top: 108,
            left: 192,
            right: 192,
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 40,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 26px",
              borderRadius: 999,
              backgroundColor: "rgba(8, 12, 11, 0.78)",
              border: "1px solid rgba(255, 255, 255, 0.14)",
              boxShadow: "0 14px 36px rgba(0, 0, 0, 0.45)",
              opacity: contextOpacity,
              transform: `translateY(${interpolate(
                contextEnter,
                [0, 1],
                [-14, 0],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              )}px)`,
            }}
          >
            <Layers size={22} color="#94a3b8" strokeWidth={2.2} />
            <span
              style={{
                fontSize: 24,
                fontWeight: 540,
                color: "#cbd5e1",
                letterSpacing: "-0.01em",
              }}
            >
              8 scattered agent contexts{" "}
              <span style={{ color: "#34d996", fontWeight: 700 }}>&rarr;</span>{" "}
              1 shared vault
            </span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

export default Scene2LogoCollapse;
