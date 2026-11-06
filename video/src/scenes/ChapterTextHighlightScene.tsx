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
import { TextHighlight } from "../components/snapcn/TextHighlight";
import { PALETTE } from "../palette";

/**
 * Scene 4 (18.0s–22.6s, 138f): `@snapcn/TextHighlight` Chapter 01 — Live Recall
 */
export const ChapterTextHighlightScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 180, mass: 0.8 },
  });

  const subOpacity = interpolate(frame, [34, 54], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
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
            alignItems: "center",
            gap: 28,
            transform: `translateY(${((1 - enter) * 24).toFixed(2)}px)`,
            opacity: enter,
            textAlign: "center",
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
              CHAPTER 01 · LIVE WALRUS RECALL
            </span>
          </div>

          <div
            style={{
              fontSize: 82,
              fontWeight: 700,
              letterSpacing: "-0.042em",
              lineHeight: 1.08,
              color: PALETTE.ink,
            }}
          >
            <div>Recall team rules</div>
            <div style={{ marginTop: 8 }}>
              <TextHighlight
                startFrame={16}
                fillColor="rgba(16, 185, 129, 0.22)"
                borderColor="rgba(16, 185, 129, 0.55)"
                textColor={PALETTE.mintDeep}
              >
                before agents act.
              </TextHighlight>
            </div>
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 14,
              padding: "10px 22px",
              borderRadius: 999,
              backgroundColor: PALETTE.card,
              border: `1px solid ${PALETTE.border}`,
              opacity: subOpacity,
              fontFamily: PALETTE.fontMono,
              fontSize: 16,
              fontWeight: 600,
              color: PALETTE.ink2,
            }}
          >
            <span>Blob zjcqsfXK…aclk</span>
            <span style={{ color: PALETTE.mint }}>→</span>
            <span style={{ color: PALETTE.mintDeep }}>PASS · WALRUS RECALL</span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
