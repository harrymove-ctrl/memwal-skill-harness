import React from "react";
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { PALETTE } from "../../palette";

export interface WordGatherProps {
  words: string[];
  /** Order in which non-anchor words arrive (indices into `words`). Defaults to deterministic out-of-order gather. */
  gatherOrder?: number[];
  fontSize?: number;
  fontWeight?: number;
  inkColor?: string;
  accentColor?: string;
  /** Words that stay permanently accented in Mint even after settling */
  keepAccentIndices?: number[];
  holdFirstFrames?: number;
  staggerFrames?: number;
  lineBreakAfter?: number[];
}

/**
 * `@snapcn/word-gather`
 * First word holds the frame; remaining words drop in out of order in `accentColor`,
 * slide home into their sentence slot, and cool into `inkColor` as they settle.
 */
export const WordGather: React.FC<WordGatherProps> = ({
  words,
  gatherOrder,
  fontSize = 76,
  fontWeight = 700,
  inkColor = PALETTE.ink,
  accentColor = PALETTE.mint,
  keepAccentIndices = [],
  holdFirstFrames = 14,
  staggerFrames = 7,
  lineBreakAfter = [],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const order = React.useMemo(() => {
    if (gatherOrder && gatherOrder.length === words.length) {
      return gatherOrder;
    }
    const rest: number[] = [];
    let lo = 1;
    let hi = words.length - 1;
    let toggle = true;
    while (lo <= hi) {
      rest.push(toggle ? hi-- : lo++);
      toggle = !toggle;
    }
    return [0, ...rest];
  }, [gatherOrder, words.length]);

  const lastStart =
    holdFirstFrames + Math.max(0, words.length - 2) * staggerFrames;
  const groupScale = interpolate(frame, [0, lastStart + 36], [1.04, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const lines: Array<Array<{ word: string; index: number }>> = [[]];
  words.forEach((word, index) => {
    lines[lines.length - 1].push({ word, index });
    if (lineBreakAfter.includes(index) && index < words.length - 1) {
      lines.push([]);
    }
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: Math.round(fontSize * 0.14),
        transform: `scale(${groupScale})`,
        fontFamily: PALETTE.fontSans,
      }}
    >
      {lines.map((line, lineIdx) => (
        <div
          key={lineIdx}
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "baseline",
            justifyContent: "center",
            columnGap: Math.round(fontSize * 0.26),
          }}
        >
          {line.map(({ word, index }) => {
            const rank = order.indexOf(index);
            const startFrame =
              rank <= 0 ? 0 : holdFirstFrames + (rank - 1) * staggerFrames;
            const local = frame - startFrame;

            const enterSpring = spring({
              frame: Math.max(0, local),
              fps,
              config: { damping: 17, stiffness: 190, mass: 0.78 },
            });

            const opacity = interpolate(local, [0, 6], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

            const dropDir = index % 2 === 0 ? -1 : 1;
            const startY = index === 0 ? 18 : dropDir * 30;
            const startX =
              index === 0 ? 0 : index < words.length / 2 ? -22 : 22;

            const translateY = (1 - enterSpring) * startY;
            const translateX = (1 - enterSpring) * startX;

            const keepAccent = keepAccentIndices.includes(index);
            const settleMix = keepAccent
              ? 0
              : index === 0
                ? 1
                : interpolate(local, [8, 22], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                    easing: Easing.out(Easing.quad),
                  });

            return (
              <span
                key={`${index}-${word}`}
                style={{
                  position: "relative",
                  display: "inline-block",
                  fontSize,
                  fontWeight,
                  letterSpacing: "-0.038em",
                  lineHeight: 1.08,
                  opacity,
                  transform: `translate3d(${translateX.toFixed(2)}px, ${translateY.toFixed(2)}px, 0)`,
                }}
              >
                <span
                  style={{
                    color: accentColor,
                    opacity: 1 - settleMix,
                  }}
                >
                  {word}
                </span>
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    color: inkColor,
                    opacity: settleMix,
                  }}
                >
                  {word}
                </span>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
