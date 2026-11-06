import type React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";

export interface WordWheelProps {
  words: string[];
  holdFrames?: number;
  rollFrames?: number;
  startFrame?: number;
  fontSize?: number;
  lineHeight?: number;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  paddingX?: number;
  paddingY?: number;
  radius?: number;
  style?: React.CSSProperties;
}

export const WordWheel: React.FC<WordWheelProps> = ({
  words,
  holdFrames = 32,
  rollFrames = 14,
  startFrame = 12,
  fontSize = 30,
  lineHeight = 46,
  color = "#065f46",
  backgroundColor = "rgba(16, 185, 129, 0.14)",
  borderColor = "rgba(16, 185, 129, 0.35)",
  paddingX = 18,
  paddingY = 4,
  radius = 13,
  style,
}) => {
  const frame = useCurrentFrame();
  const safeWords = words.length > 0 ? words : ["Sui gRPC SDK rules"];
  const stepSpan = holdFrames + rollFrames;
  const maxStep = safeWords.length - 1;

  const elapsed = Math.max(0, frame - startFrame);
  const rawStep = Math.min(maxStep, Math.floor(elapsed / stepSpan));
  const withinStep = elapsed - rawStep * stepSpan;

  let continuousIndex = rawStep;
  if (rawStep < maxStep && withinStep > holdFrames) {
    const rollT = interpolate(
      withinStep - holdFrames,
      [0, rollFrames],
      [0, 1],
      {
        easing: Easing.bezier(0.32, 0.72, 0, 1),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }
    );
    continuousIndex = rawStep + rollT;
  }

  // Smooth width interpolation so surrounding copy glides organically
  const lowIdx = Math.floor(continuousIndex);
  const highIdx = Math.min(maxStep, lowIdx + 1);
  const frac = continuousIndex - lowIdx;
  const charWidth = fontSize * 0.575;
  const wLow = safeWords[lowIdx].length * charWidth + paddingX * 2;
  const wHigh = safeWords[highIdx].length * charWidth + paddingX * 2;
  const animatedWidth = wLow + (wHigh - wLow) * frac;

  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        height: lineHeight + paddingY * 2,
        width: animatedWidth,
        borderRadius: radius,
        backgroundColor,
        border: `1.5px solid ${borderColor}`,
        overflow: "hidden",
        verticalAlign: "middle",
        margin: "0 8px",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.65)",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: paddingY,
          left: 0,
          right: 0,
          transform: `translateY(${-continuousIndex * lineHeight}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {safeWords.map((word, idx) => {
          const dist = Math.abs(idx - continuousIndex);
          const opacity = interpolate(dist, [0, 0.75, 1], [1, 0.35, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={`${word}-${idx}`}
              style={{
                height: lineHeight,
                lineHeight: `${lineHeight}px`,
                fontSize,
                fontWeight: 650,
                color,
                whiteSpace: "nowrap",
                opacity,
                letterSpacing: "-0.02em",
              }}
            >
              {word}
            </div>
          );
        })}
      </div>
    </span>
  );
};
