import type React from "react";
import { useCurrentFrame } from "remotion";

export interface CaretProps {
  visible?: boolean;
  blinking?: boolean;
  blinkFrames?: number;
  height?: number | string;
  color?: string;
  width?: number;
  style?: React.CSSProperties;
}

export const Caret: React.FC<CaretProps> = ({
  visible = true,
  blinking = false,
  blinkFrames = 15,
  height = "1.1em",
  color = "currentColor",
  width = 2.5,
  style,
}) => {
  const frame = useCurrentFrame();
  if (!visible) return null;

  const blinkOn = !blinking || Math.floor(frame / blinkFrames) % 2 === 0;

  return (
    <span
      style={{
        display: "inline-block",
        width,
        height,
        backgroundColor: color,
        borderRadius: 2,
        marginLeft: 3,
        verticalAlign: "-0.12em",
        opacity: blinkOn ? 1 : 0.12,
        flexShrink: 0,
        ...style,
      }}
    />
  );
};
