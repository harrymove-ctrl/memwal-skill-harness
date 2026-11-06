import type React from "react";
import { ArrowUp, Check } from "lucide-react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Input } from "./input";
import { Caret } from "./caret";
import { CursorTrack } from "./cursor-track";
import { SNAP_CN_UI } from "@/lib/brand-tokens";

export interface PromptSendProps {
  brandHeader?: React.ReactNode;
  promptText: string;
  chips?: string[];
  typeStartFrame?: number;
  framesPerChar?: number;
  sendClickFrame?: number;
  width?: number;
  afterSendContent?: React.ReactNode;
}

export const PromptSend: React.FC<PromptSendProps> = ({
  brandHeader,
  promptText,
  chips = [
    "Namespace Skill Graph",
    "Shared Delegate Key",
    "Walrus Blob Proof",
  ],
  typeStartFrame = 14,
  framesPerChar = 1.65,
  sendClickFrame = 122,
  width = 1100,
  afterSendContent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 130, mass: 0.85 },
  });

  const typedCount =
    frame < typeStartFrame
      ? 0
      : Math.min(
          promptText.length,
          Math.floor((frame - typeStartFrame) / framesPerChar)
        );
  const hasTypedAny = typedCount > 0;
  const isSent = frame >= sendClickFrame + 3;

  const sendBtnReady = hasTypedAny && !isSent;
  const sendScale =
    frame >= sendClickFrame && frame <= sendClickFrame + 10
      ? interpolate(
          frame,
          [sendClickFrame, sendClickFrame + 3, sendClickFrame + 10],
          [1, 0.84, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        )
      : 1;

  const resultSpring = spring({
    frame: Math.max(0, frame - (sendClickFrame + 6)),
    fps,
    config: { damping: 16, stiffness: 155, mass: 0.78 },
  });

  return (
    <div
      style={{
        position: "relative",
        width,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
        opacity: enter,
        transform: `translateY(${interpolate(enter, [0, 1], [24, 0])}px)`,
      }}
    >
      {brandHeader && <div>{brandHeader}</div>}

      <div style={{ position: "relative", width: "100%" }}>
        <Input
          theme="dark"
          focused={!isSent}
          minHeight={90}
          radius={24}
          padding="20px 24px"
          fontSize={26}
          trailing={
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isSent
                  ? "#10b981"
                  : sendBtnReady
                    ? "#f8fafc"
                    : "rgba(255,255,255,0.12)",
                color: isSent
                  ? "#042f2e"
                  : sendBtnReady
                    ? "#080c0b"
                    : "rgba(255,255,255,0.45)",
                transform: `scale(${sendScale})`,
                boxShadow: sendBtnReady
                  ? "0 8px 24px rgba(52, 217, 150, 0.28)"
                  : "none",
              }}
            >
              {isSent ? (
                <Check size={24} strokeWidth={2.75} />
              ) : (
                <ArrowUp size={24} strokeWidth={2.6} />
              )}
            </div>
          }
        >
          {isSent ? (
            <span
              style={{
                color: "#34d996",
                fontWeight: 600,
                fontSize: 24,
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              Executing Trajectory Eval on namespace walrus-team-core...
            </span>
          ) : (
            <span
              style={{
                color: SNAP_CN_UI.dark.textPrimary,
                fontSize: 26,
                fontWeight: 520,
              }}
            >
              {promptText.slice(0, typedCount)}
              <Caret
                visible
                blinking={typedCount >= promptText.length}
                color="#34d996"
                height={30}
              />
            </span>
          )}
        </Input>

        <CursorTrack
          color="#f8fafc"
          strokeColor="#080c0b"
          rippleColor="#34d996"
          label="Run Eval"
          labelBg="#34d996"
          labelColor="#042f2e"
          waypoints={[
            { frame: sendClickFrame - 28, x: width - 220, y: 170 },
            { frame: sendClickFrame, x: width - 48, y: 46, click: true },
            { frame: sendClickFrame + 22, x: width - 28, y: 145 },
          ]}
        />
      </div>

      {/*Suggestion Chips*/}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 14,
        }}
      >
        {chips.map((chip, idx) => {
          const chipSpring = spring({
            frame: Math.max(0, frame - (8 + idx * 4)),
            fps,
            config: { damping: 18, stiffness: 150 },
          });
          return (
            <div
              key={chip}
              style={{
                padding: "10px 20px",
                borderRadius: 999,
                backgroundColor:
                  idx === 0 && isSent
                    ? "rgba(52, 217, 150, 0.18)"
                    : "rgba(255, 255, 255, 0.06)",
                border: `1px solid ${
                  idx === 0 && isSent
                    ? "rgba(52, 217, 150, 0.5)"
                    : "rgba(255, 255, 255, 0.12)"
                }`,
                color: idx === 0 && isSent ? "#6ee7b7" : "#cbd5e1",
                fontSize: 22,
                fontWeight: 520,
                opacity: chipSpring,
                transform: `translateY(${interpolate(chipSpring, [0, 1], [12, 0])}px)`,
              }}
            >
              {chip}
            </div>
          );
        })}
      </div>

      {/*Post-send live Trajectory Eval delta strip*/}
      {isSent && afterSendContent && (
        <div
          style={{
            width: "100%",
            opacity: resultSpring,
            transform: `translateY(${interpolate(resultSpring, [0, 1], [22, 0])}px) scale(${interpolate(
              resultSpring,
              [0, 1],
              [0.96, 1]
            )})`,
          }}
        >
          {afterSendContent}
        </div>
      )}
    </div>
  );
};
