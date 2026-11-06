import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { PALETTE } from "../palette";

export interface ExplainerCalloutProps {
  what: string;
  why: string;
  eyebrow?: string;
  accentColor?: string;
  enterFrame?: number;
  exitFrame?: number;
  x: number;
  y: number;
  anchorX?: number;
  anchorY?: number;
  width?: number;
}

export const ExplainerCallout: React.FC<ExplainerCalloutProps> = ({
  what,
  why,
  eyebrow,
  accentColor = PALETTE.mint,
  enterFrame = 0,
  exitFrame,
  x,
  y,
  anchorX,
  anchorY,
  width = 396,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const localFrame = frame - enterFrame;
  if (localFrame < 0) return null;
  if (exitFrame !== undefined && frame > exitFrame) return null;

  const enterProgress = spring({
    frame: localFrame,
    fps,
    config: { damping: 20, stiffness: 185, mass: 0.78 },
  });

  const exitOpacity =
    exitFrame !== undefined
      ? interpolate(frame, [exitFrame - 12, exitFrame], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1;

  const opacity = enterProgress * exitOpacity;
  const translateY = (1 - enterProgress) * 14;
  const scale = 0.96 + 0.04 * enterProgress;

  const cardAttachX = anchorX !== undefined && anchorX < x ? x : x + width * 0.5;
  const cardAttachY = anchorY !== undefined && anchorY < y ? y : y + 48;

  return (
    <>
      {anchorX !== undefined && anchorY !== undefined && (
        <svg
          width={1920}
          height={1080}
          viewBox="0 0 1920 1080"
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            opacity: opacity * 0.9,
          }}
        >
          <line
            x1={anchorX}
            y1={anchorY}
            x2={cardAttachX}
            y2={cardAttachY}
            stroke={accentColor}
            strokeWidth={2}
            strokeDasharray="5 5"
          />
          <circle cx={anchorX} cy={anchorY} r={5.5} fill={accentColor} />
        </svg>
      )}

      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width,
          opacity,
          transform: `translate3d(0, ${translateY.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`,
          transformOrigin: "left center",
          backgroundColor: "rgba(255, 255, 255, 0.96)",
          border: `1.5px solid ${PALETTE.border}`,
          borderLeft: `4px solid ${accentColor}`,
          borderRadius: 16,
          padding: "16px 20px",
          boxShadow:
            "0 20px 50px rgba(20, 20, 19, 0.12), 0 4px 12px rgba(20, 20, 19, 0.05)",
          pointerEvents: "none",
          fontFamily: PALETTE.fontSans,
        }}
      >
        {eyebrow && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              marginBottom: 6,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: 999,
                backgroundColor: accentColor,
              }}
            />
            <span
              style={{
                fontFamily: PALETTE.fontMono,
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: PALETTE.mintDeep,
              }}
            >
              {eyebrow}
            </span>
          </div>
        )}

        <div
          style={{
            fontSize: 23,
            fontWeight: 700,
            letterSpacing: "-0.025em",
            lineHeight: 1.18,
            color: PALETTE.ink,
          }}
        >
          {what}
        </div>
        <div
          style={{
            marginTop: 5,
            fontSize: 16,
            fontWeight: 500,
            lineHeight: 1.35,
            color: PALETTE.ink2,
          }}
        >
          {why}
        </div>
      </div>
    </>
  );
};
