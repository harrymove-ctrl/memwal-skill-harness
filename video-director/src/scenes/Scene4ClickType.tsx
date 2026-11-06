import type React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { ChromaCurrentBackdrop } from "@/components/backgrounds/ChromaCurrentBackdrop";
import { CLICK_AT, CUT_AT, ClickType } from "@/components/snap-cn/click-type";
import { inter } from "@/lib/fonts";

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export const CLICK_TYPE_PROMPT = "Audit PR & verify Tatum wallet";
export const CLICK_TYPE_SPEED = 0.68;
export const CLICK_TYPE_CLICK_FRAME = Math.round(CLICK_AT / CLICK_TYPE_SPEED);
export const CLICK_TYPE_CUT_FRAME = Math.round(CUT_AT / CLICK_TYPE_SPEED);

/**
 * Act 4 (f555..f705, 150 frames = 5.0s):
 * Official @snapcn/click-type emerging cleanly out of Scene 3's white wash.
 * Concise 30-char prompt keeps 100% of characters + blinking caret well inside
 * the 1.9x close-up frame with ~320px of right breathing room.
 */
export const Scene4ClickType: React.FC = () => {
  const frame = useCurrentFrame();
  const washOut = interpolate(frame, [0, 10], [1, 0], CLAMP);
  const creep = interpolate(frame, [0, 150], [1, 1.045], {
    ...CLAMP,
    easing: Easing.inOut(Easing.sin),
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#f5f6f1",
        fontFamily: inter.fontFamily,
        overflow: "hidden",
      }}
    >
      <ChromaCurrentBackdrop mode="light" intensity={0.48} />

      <AbsoluteFill
        style={{
          transform: `scale(${creep})`,
          transformOrigin: "32% 44%",
        }}
      >
        <ClickType
          placeholder="Ask your team's memory or Tatum MCP..."
          prompt={CLICK_TYPE_PROMPT}
          hint="memwal-team-skills · ai.tatum.io/mcp"
          accentColor="#10b981"
          speed={CLICK_TYPE_SPEED}
          transparent
          mode="light"
          theme={{
            background: "#f5f6f1",
            foreground: "#141413",
            card: "#ffffff",
            cardForeground: "#141413",
            primary: "#059669",
            primaryForeground: "#ffffff",
            muted: "#f1f5f3",
            mutedForeground: "#52525b",
            border: "#e4e6df",
            input: "#e4e6df",
            ring: "#10b981",
            fontFamily: "Inter",
          }}
        />
      </AbsoluteFill>

      {washOut > 0.01 && (
        <AbsoluteFill
          style={{
            backgroundColor: "#ffffff",
            opacity: washOut,
            pointerEvents: "none",
          }}
        />
      )}
    </AbsoluteFill>
  );
};
