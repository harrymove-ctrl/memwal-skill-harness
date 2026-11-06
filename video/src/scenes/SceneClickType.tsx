import type React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { CLICK_AT, CUT_AT, ClickType, clickTypeFrames } from "@/components/snap-cn/click-type";

/**
 * The official @snapcn/click-type scene, re-skinned to the app's palette.
 * The prompt is the task the App Reveal then answers with the memwal-review
 * skill and its recalled team rule.
 */
export const CLICK_TYPE_PROMPT = "Review PRs, then promote to main";
export const CLICK_TYPE_FRAMES = 189;
/** Slowed so typing reads at 1080p and the scene fills its slot. */
export const CLICK_TYPE_SPEED = clickTypeFrames(CLICK_TYPE_PROMPT) / 180;

export const CLICK_TYPE_THEME = {
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
};

/** Local frames (in this scene's own time) of the click, cut, and each keystroke. */
export function clickTypeCueFrames() {
  const typeAt = CUT_AT + 4;
  const keys: number[] = [];
  let f = 0;
  for (const ch of CLICK_TYPE_PROMPT) {
    if (ch !== " ") keys.push(Math.round((typeAt + f) / CLICK_TYPE_SPEED));
    f += ch === " " ? 2 : 1;
  }
  return {
    click: Math.round(CLICK_AT / CLICK_TYPE_SPEED),
    cut: Math.round(CUT_AT / CLICK_TYPE_SPEED),
    keys,
  };
}

export const SceneClickType: React.FC = () => {
  const frame = useCurrentFrame();
  // Slow push across the whole scene so the post-typing hold never sits still.
  const push = interpolate(frame, [0, CLICK_TYPE_FRAMES], [1, 1.07], {
    easing: Easing.inOut(Easing.sin),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
  <AbsoluteFill style={{ backgroundColor: CLICK_TYPE_THEME.background }}>
   <AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: "30% 42%" }}>
    <ClickType
      placeholder="Ask your team's memory..."
      prompt={CLICK_TYPE_PROMPT}
      hint="memwal-team-skills"
      accentColor="#10b981"
      theme={CLICK_TYPE_THEME}
      mode="light"
      speed={CLICK_TYPE_SPEED}
    />
   </AbsoluteFill>
  </AbsoluteFill>
  );
};

export default SceneClickType;
