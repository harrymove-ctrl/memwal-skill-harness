import type React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Input } from "./input";
import { Caret } from "./caret";
import { CursorTrack } from "./cursor-track";
import { SNAP_CN_UI } from "@/lib/brand-tokens";

export interface ClickTypeProps {
  text: string;
  placeholder?: string;
  theme?: "dark" | "light";
  clickFrame?: number;
  typeStartFrame?: number;
  framesPerChar?: number;
  width?: number;
  leadingIcon?: React.ReactNode;
  trailingBadge?: React.ReactNode;
  cursorLabel?: string;
}

export const ClickType: React.FC<ClickTypeProps> = ({
  text,
  placeholder = "Ask your team namespace or sync a SKILL.md...",
  theme = "light",
  clickFrame = 28,
  typeStartFrame = 38,
  framesPerChar = 2.1,
  width = 1060,
  leadingIcon,
  trailingBadge,
  cursorLabel = "@harrymove-ctrl",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const palette = theme === "dark" ? SNAP_CN_UI.dark : SNAP_CN_UI.light;

  const cardEnter = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 130, mass: 0.85 },
  });

  const isFocused = frame >= clickFrame;
  const typedCount =
    frame < typeStartFrame
      ? 0
      : Math.min(text.length, Math.floor((frame - typeStartFrame) / framesPerChar));
  const typedSlice = text.slice(0, typedCount);
  const isFinishedTyping = typedCount >= text.length;

  const pressDip =
    frame >= clickFrame && frame <= clickFrame + 8
      ? interpolate(frame, [clickFrame, clickFrame + 3, clickFrame + 8], [1, 0.986, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1;

  return (
    <div
      style={{
        position: "relative",
        width,
        transform: `translateY(${interpolate(cardEnter, [0, 1], [28, 0])}px) scale(${pressDip})`,
        opacity: cardEnter,
      }}
    >
      <Input
        theme={theme}
        focused={isFocused}
        minHeight={88}
        fontSize={28}
        radius={24}
        padding="20px 28px"
        leading={leadingIcon}
        trailing={trailingBadge}
      >
        {!isFocused ? (
          <span style={{ color: palette.textMuted, fontWeight: 450 }}>
            {placeholder}
          </span>
        ) : typedCount === 0 ? (
          <span style={{ display: "inline-flex", alignItems: "center" }}>
            <Caret visible blinking color={palette.accent} height={32} />
            <span
              style={{
                color: palette.textMuted,
                marginLeft: 8,
                opacity: 0.88,
                fontWeight: 450,
              }}
            >
              {placeholder}
            </span>
          </span>
        ) : (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              color: palette.textPrimary,
              fontFamily: SNAP_CN_UI.monoFamily,
              fontSize: 25,
              fontWeight: 550,
            }}
          >
            {typedSlice}
            <Caret
              visible
              blinking={isFinishedTyping}
              color={palette.accent}
              height={30}
            />
          </span>
        )}
      </Input>

      {/*Cursor glides in, clicks input bar, then parks neatly to bottom-right*/}
      <CursorTrack
        label={cursorLabel}
        waypoints={[
          { frame: 4, x: width * 0.78, y: 185 },
          { frame: clickFrame, x: width * 0.34, y: 48, click: true },
          { frame: clickFrame + 24, x: width * 0.88, y: 126 },
        ]}
      />
    </div>
  );
};
