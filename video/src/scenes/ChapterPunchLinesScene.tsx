import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ChromaCurrentBackdrop } from "../components/backgrounds/ChromaCurrentBackdrop";
import { PALETTE } from "../palette";

const PUNCH_ITEMS = [
  { text: "Without memory: stale.", accent: false },
  { text: "Approves retired PRs.", accent: false },
  { text: "With Walrus Memory:", accent: false },
  { text: "Closes as not planned.", accent: true },
];

/**
 * Scene 6 (32.0s–36.6s, 138f): `@snapcn/PunchLines` Chapter 02 — Side-by-Side Verdict
 */
export const ChapterPunchLinesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerEnter = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 180, mass: 0.8 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: PALETTE.shaderCanvasLight,
        overflow: "hidden",
        fontFamily: PALETTE.fontSans,
      }}
    >
      <ChromaCurrentBackdrop mode="light" />

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
            alignItems: "flex-start",
            gap: 24,
            width: 980,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 9,
              padding: "7px 16px",
              borderRadius: 999,
              backgroundColor: PALETTE.card,
              border: `1px solid ${PALETTE.border}`,
              boxShadow: "0 4px 12px rgba(20, 20, 19, 0.05)",
              opacity: headerEnter,
              transform: `translateY(${((1 - headerEnter) * 14).toFixed(2)}px)`,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                backgroundColor: PALETTE.categories.qaTesting,
              }}
            />
            <span
              style={{
                fontFamily: PALETTE.fontMono,
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: "0.08em",
                color: PALETTE.ink2,
              }}
            >
              CHAPTER 02 · WITHOUT VS WITH MEMWAL
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {PUNCH_ITEMS.map((item, idx) => {
              const startF = 10 + idx * 18;
              const flipP = spring({
                frame: Math.max(0, frame - startF),
                fps,
                config: { damping: 18, stiffness: 210, mass: 0.78 },
              });
              const visible = frame >= startF;

              const nextStart = 10 + (idx + 1) * 18;
              const soften =
                idx < PUNCH_ITEMS.length - 1
                  ? interpolate(frame, [nextStart, nextStart + 12], [0, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    })
                  : 0;

              const baseColor = item.accent ? PALETTE.mintDeep : PALETTE.ink;
              const settledOpacity = item.accent ? 1 : 1 - soften * 0.45;

              return (
                <div
                  key={item.text}
                  style={{
                    height: 82,
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    gap: 18,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 18,
                      opacity: visible ? settledOpacity * flipP : 0,
                      transform: `translate3d(0, ${((1 - flipP) * 76).toFixed(2)}px, 0)`,
                    }}
                  >
                    <span
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 999,
                        backgroundColor: item.accent
                          ? PALETTE.mint
                          : PALETTE.ink3,
                        transform: `scale(${item.accent ? 1.15 : 1 - soften * 0.2})`,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 68,
                        fontWeight: 700,
                        letterSpacing: "-0.04em",
                        lineHeight: 1.06,
                        color: baseColor,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
