import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { PALETTE } from "../../palette";

export interface TextHighlightProps {
  children: React.ReactNode;
  startFrame?: number;
  fillColor?: string;
  borderColor?: string;
  textColor?: string;
}

/**
 * `@snapcn/text-highlight`
 * Copy is visible from frame 1 — only the marker highlight sweeps left-to-right
 * via a high-damping spring (`damping: 18`, zero bounce).
 */
export const TextHighlight: React.FC<TextHighlightProps> = ({
  children,
  startFrame = 12,
  fillColor = "rgba(16, 185, 129, 0.20)",
  borderColor = "rgba(16, 185, 129, 0.50)",
  textColor = PALETTE.mintDeep,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sweep = spring({
    frame: Math.max(0, frame - startFrame),
    fps,
    config: { damping: 18, stiffness: 150, mass: 0.85 },
  });

  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        padding: "0 0.14em",
        margin: "0 0.04em",
        fontFamily: PALETTE.fontSans,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "7%",
          bottom: "3%",
          borderRadius: 16,
          backgroundColor: fillColor,
          border: `1.5px solid ${borderColor}`,
          transform: `scaleX(${sweep.toFixed(4)})`,
          transformOrigin: "left center",
        }}
      />
      <span
        style={{
          position: "relative",
          color: sweep > 0.3 ? textColor : PALETTE.ink,
        }}
      >
        {children}
      </span>
    </span>
  );
};
