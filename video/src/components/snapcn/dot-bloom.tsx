import type React from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export interface DotBloomProps {
  color?: string;
  fromBg?: string;
  startFrame?: number;
  durationFrames?: number;
  originX?: string;
  originY?: string;
  initialSize?: number;
  children?: React.ReactNode;
}

export const DotBloom: React.FC<DotBloomProps> = ({
  color = "#10b981",
  fromBg = "#080c0b",
  startFrame = 0,
  durationFrames = 36,
  originX = "50%",
  originY = "50%",
  initialSize = 14,
  children,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const maxRadius = Math.hypot(width, height) * 1.15;

  const progress = interpolate(
    frame,
    [startFrame, startFrame + durationFrames],
    [0, 1],
    {
      easing: Easing.inOut(Easing.poly(4)),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const diameter = initialSize + progress * maxRadius * 2;
  const dotVisible = frame >= startFrame - 6;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: progress >= 0.995 ? color : fromBg,
        overflow: "hidden",
      }}
    >
      {dotVisible && progress < 0.998 && (
        <div
          style={{
            position: "absolute",
            left: originX,
            top: originY,
            width: diameter,
            height: diameter,
            borderRadius: "50%",
            backgroundColor: color,
            transform: "translate(-50%, -50%)",
            boxShadow: `0 0 80px ${color}`,
          }}
        />
      )}
      {children}
    </div>
  );
};
