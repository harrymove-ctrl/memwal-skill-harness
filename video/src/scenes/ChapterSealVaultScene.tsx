import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ChromaCurrentBackdrop } from "../components/backgrounds/ChromaCurrentBackdrop";
import { WordGather } from "../components/snapcn/WordGather";
import { PALETTE } from "../palette";

/**
 * Scene 8 (46.0s–50.6s, 138f): `@snapcn/DotBloom` + `@snapcn/WordGather` Chapter 03 — Skill Graph
 */
export const ChapterSealVaultScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardSpring = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 175, mass: 0.8 },
  });

  const bloomRadius = interpolate(frame, [0, 96], [80, 960], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const bloomBand = 240;

  const subOpacity = interpolate(frame, [48, 68], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cols = 24;
  const rows = 14;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: PALETTE.shaderCanvasLight,
        overflow: "hidden",
        fontFamily: PALETTE.fontSans,
      }}
    >
      <ChromaCurrentBackdrop mode="light" />

      {/* Ambient `@snapcn/DotBloom` Halftone Ring */}
      <svg
        width={1920}
        height={1080}
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((__, c) => {
            const x = (c + 0.5) * (1920 / cols);
            const y = (r + 0.5) * (1080 / rows);
            const dist = Math.hypot(x - 960, y - 540);
            const wave = Math.max(
              0,
              1 - Math.abs(dist - bloomRadius) / bloomBand
            );
            if (wave <= 0.04) return null;
            const radius = 2 + wave * 6.5;
            const isTeal = (r + c) % 2 === 0;
            return (
              <circle
                key={`${r}-${c}`}
                cx={x}
                cy={y}
                r={radius}
                fill={
                  isTeal ? PALETTE.categories.coreHub : PALETTE.categories.designSystem
                }
                opacity={wave * 0.24}
              />
            );
          })
        )}
      </svg>

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          padding: "0 192px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 26,
            padding: "46px 68px",
            borderRadius: 32,
            backgroundColor: "rgba(255, 255, 255, 0.90)",
            border: `1.5px solid ${PALETTE.border}`,
            boxShadow:
              "0 28px 75px rgba(20, 20, 19, 0.09), 0 4px 16px rgba(20, 20, 19, 0.04)",
            opacity: cardSpring,
            transform: `scale(${(0.94 + 0.06 * cardSpring).toFixed(4)})`,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 9,
              padding: "7px 16px",
              borderRadius: 999,
              backgroundColor: PALETTE.mintTint,
              border: `1px solid ${PALETTE.mint}45`,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                backgroundColor: PALETTE.categories.coreHub,
              }}
            />
            <span
              style={{
                fontFamily: PALETTE.fontMono,
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: "0.08em",
                color: PALETTE.mintDeep,
              }}
            >
              CHAPTER 03 · LIVING SKILL GRAPH
            </span>
          </div>

          <WordGather
            words={["Team", "rules", "live", "with", "skills."]}
            gatherOrder={[0, 4, 1, 3, 2]}
            lineBreakAfter={[1]}
            keepAccentIndices={[4]}
            accentColor={PALETTE.mint}
            inkColor={PALETTE.ink}
            fontSize={82}
            fontWeight={700}
            holdFirstFrames={10}
            staggerFrames={8}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              opacity: subOpacity,
              fontFamily: PALETTE.fontMono,
              fontSize: 16,
              fontWeight: 600,
              color: PALETTE.ink2,
            }}
          >
            <span>14 SKILL.md files</span>
            <span style={{ color: PALETTE.mint }}>•</span>
            <span>@harrymove-ctrl</span>
            <span style={{ color: PALETTE.mint }}>•</span>
            <span>Interactive graph</span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
