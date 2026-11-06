import type React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SNAP_CN_UI } from "@/lib/brand-tokens";

export interface WordGatherProps {
  words?: string[];
  highlight?: string | string[];
  accentColor?: string;
  textColor?: string;
  fontSize?: number;
  fontWeight?: number;
  spread?: number;
  blur?: number;
  stagger?: number;
  startFrame?: number;
  pillHighlight?: boolean;
  pillBg?: string;
  style?: React.CSSProperties;
}

export const WordGather: React.FC<WordGatherProps> = ({
  words = ["Shared", "memory", "every", "agent", "recalls."],
  highlight = ["every", "agent"],
  accentColor = "#0284c7",
  textColor = "#0c192c",
  fontSize = 84,
  fontWeight = 700,
  spread = 54,
  blur = 10,
  stagger = 4,
  startFrame = 0,
  pillHighlight = false,
  pillBg = "rgba(255, 255, 255, 0.78)",
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const highlightSet = new Set(
    Array.isArray(highlight) ? highlight : highlight ? [highlight] : []
  );

  // Deterministic vertical offsets alternating up/down without random
  const offsets = [-1, 0.75, -0.6, 0.9, -0.8, 0.65, -0.85, 0.7];

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        columnGap: Math.round(fontSize * 0.26),
        rowGap: Math.round(fontSize * 0.14),
        fontFamily: SNAP_CN_UI.fontFamily,
        fontSize,
        fontWeight,
        letterSpacing: "-0.035em",
        lineHeight: 1.08,
        textAlign: "center",
        ...style,
      }}
    >
      {words.map((word, index) => {
        const localFrame = Math.max(0, frame - startFrame - index * stagger);
        const progress = spring({
          frame: localFrame,
          fps,
          config: { damping: 18, stiffness: 125, mass: 0.85 },
        });
        const dir = offsets[index % offsets.length];
        const y = interpolate(progress, [0, 1], [dir * spread, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const opacity = interpolate(
          frame - startFrame - index * stagger,
          [-2, 10],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        const currentBlur = interpolate(progress, [0, 1], [blur, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const scale = interpolate(progress, [0, 1], [0.92, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        const isHighlighted = highlightSet.has(word);

        return (
          <span
            key={`${word}-${index}`}
            style={{
              display: "inline-block",
              transform: `translateY(${y}px) scale(${scale})`,
              opacity,
              filter: currentBlur > 0.15 ? `blur(${currentBlur.toFixed(2)}px)` : "none",
              color: isHighlighted ? accentColor : textColor,
              padding: isHighlighted && pillHighlight ? "4px 20px 8px" : undefined,
              borderRadius: isHighlighted && pillHighlight ? 20 : undefined,
              backgroundColor: isHighlighted && pillHighlight ? pillBg : undefined,
              boxShadow:
                isHighlighted && pillHighlight
                  ? "0 12px 32px rgba(12, 25, 44, 0.10), inset 0 1px 0 rgba(255,255,255,0.9)"
                  : undefined,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
