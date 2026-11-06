import React from "react";
import {
  AbsoluteFill,
  Easing,
  OffthreadVideo,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ChromaCurrentBackdrop } from "../components/backgrounds/ChromaCurrentBackdrop";
import { PALETTE } from "../palette";

const PROMPTS = [
  "Give every agent your team's QA & review checklists",
  "Recall retired-app PR rules before approving merges",
  "Sync 14 SKILL.md files on memwal-team-skills",
];

/**
 * Scene 3 (11.0s–18.5s, 225f): `@snapcn/PromptRoll` + `@snapcn/LaptopFrame`
 * - Local frames 0..149 (11.0s–16.0s): PromptRoll cycles 3 real tasks while MacBook
 *   lid opens (`76° -> 7°`) and notch connects (`memwal-team-skills · Live`).
 * - Local frames 150..210 (16.0s–18.0s = global f=480..540): Bezel dive synced to
 *   the 2-second rising pluck swell in `score-master-80s.wav`!
 */
export const PromptLaptopDiveScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const roll1 = interpolate(frame, [42, 58], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.65, 0, 0.35, 1),
  });
  const roll2 = interpolate(frame, [90, 106], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.65, 0, 0.35, 1),
  });
  const slotProgress = roll1 + roll2;

  const promptExit = interpolate(frame, [142, 164], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.cubic),
  });

  const lidOpenSpring = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 105, mass: 1.05 },
  });

  // Exact 16.0s -> 18.0s (local 150 -> 210) bezel dive!
  const diveP = interpolate(frame, [150, 210], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  const restTiltDeg = interpolate(lidOpenSpring, [0, 1], [76, 7]);
  const lidRotateX = restTiltDeg * (1 - diveP);

  const SCREEN_W = 1120;
  const SCREEN_H = 630;
  const coverScale = 1920 / SCREEN_W;
  const diveScale = interpolate(diveP, [0, 1], [1, coverScale]);
  const laptopBaseY = interpolate(diveP, [0, 1], [56, 0]);
  const bezelFade = interpolate(diveP, [0.55, 0.96], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const notchConnected = frame >= 84;
  const notchConnecting = frame >= 40 && frame < 84;
  const notchWidth = notchConnected ? 286 : notchConnecting ? 142 : 76;
  const notchOpacity = interpolate(diveP, [0, 0.38], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ROW_H = 40;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: PALETTE.shaderCanvasLight,
        overflow: "hidden",
        fontFamily: PALETTE.fontSans,
      }}
    >
      <ChromaCurrentBackdrop mode="light" />

      {/* Top `@snapcn/PromptRoll` Composer Bar */}
      <div
        style={{
          position: "absolute",
          top: 52,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: 1 - promptExit,
          transform: `translate3d(0, ${(-promptExit * 44).toFixed(2)}px, 0)`,
          pointerEvents: "none",
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "12px 16px 12px 22px",
            borderRadius: 999,
            backgroundColor: "rgba(255, 255, 255, 0.96)",
            border: `1.5px solid ${PALETTE.border}`,
            boxShadow:
              "0 16px 40px rgba(20, 20, 19, 0.08), 0 2px 6px rgba(20, 20, 19, 0.04)",
          }}
        >
          <span
            style={{
              fontFamily: PALETTE.fontMono,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: PALETTE.mintDeep,
              backgroundColor: PALETTE.mintTint,
              border: `1px solid ${PALETTE.mint}45`,
              padding: "5px 12px",
              borderRadius: 999,
            }}
          >
            AGENT PROMPT
          </span>

          <div
            style={{
              height: ROW_H,
              width: 590,
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                transform: `translate3d(0, ${(-slotProgress * ROW_H).toFixed(2)}px, 0)`,
              }}
            >
              {PROMPTS.map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    height: ROW_H,
                    display: "flex",
                    alignItems: "center",
                    fontSize: 22,
                    fontWeight: 600,
                    letterSpacing: "-0.02em",
                    color: PALETTE.ink,
                    whiteSpace: "nowrap",
                  }}
                >
                  {p}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 999,
              backgroundColor: PALETTE.mint,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: 19,
              boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
            }}
          >
            ↑
          </div>
        </div>
      </div>

      {/* Center `@snapcn/LaptopFrame` Opening & Diving into REAL `take.mp4` */}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          perspective: 1800,
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            transform: `translate3d(0, ${laptopBaseY.toFixed(2)}px, 0) scale(${diveScale.toFixed(4)})`,
            transformOrigin: "50% 48.5%",
          }}
        >
          <div
            style={{
              width: SCREEN_W + 28,
              height: SCREEN_H + 28,
              padding: 14 * bezelFade,
              borderRadius: 26 * bezelFade,
              backgroundColor: bezelFade > 0.02 ? "#1b1c1e" : "transparent",
              boxShadow:
                bezelFade > 0.05
                  ? `0 38px 90px rgba(20, 20, 19, ${(0.22 * bezelFade).toFixed(3)}), 0 0 0 1.5px rgba(255,255,255,${(0.18 * bezelFade).toFixed(3)}) inset`
                  : "none",
              transform: `rotateX(${lidRotateX.toFixed(3)}deg)`,
              transformOrigin: "50% 100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {notchOpacity > 0.02 && (
              <div
                style={{
                  position: "absolute",
                  top: 14,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: notchWidth,
                  height: 28,
                  borderBottomLeftRadius: 12,
                  borderBottomRightRadius: 12,
                  backgroundColor: "#0e0f11",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "0 12px",
                  opacity: notchOpacity,
                  zIndex: 5,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 999,
                    backgroundColor: PALETTE.mint,
                  }}
                />
                {notchConnecting && (
                  <span
                    style={{
                      fontFamily: PALETTE.fontMono,
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#e4e4e7",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Connecting…
                  </span>
                )}
                {notchConnected && (
                  <span
                    style={{
                      fontFamily: PALETTE.fontMono,
                      fontSize: 11,
                      fontWeight: 600,
                      color: PALETTE.mintTint,
                      whiteSpace: "nowrap",
                    }}
                  >
                    memwal-team-skills · Live
                  </span>
                )}
              </div>
            )}

            {/* 100% REAL Live Product Screen (`public/take/take.mp4`, hero settled @ 4.8s) */}
            <div
              style={{
                width: SCREEN_W,
                height: SCREEN_H,
                borderRadius: Math.round(14 * bezelFade),
                overflow: "hidden",
                backgroundColor: PALETTE.paper,
                position: "relative",
              }}
            >
              <OffthreadVideo
                src={staticFile("take/take.mp4")}
                trimBefore={Math.round(4.6 * fps)}
                playbackRate={0.45}
                muted
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </div>
          </div>

          {bezelFade > 0.02 && (
            <div
              style={{
                width: SCREEN_W + 148,
                height: 18,
                borderBottomLeftRadius: 18,
                borderBottomRightRadius: 18,
                borderTopLeftRadius: 4,
                borderTopRightRadius: 4,
                background:
                  "linear-gradient(90deg, #c8cacf 0%, #e5e7eb 22%, #f3f4f6 50%, #e5e7eb 78%, #c8cacf 100%)",
                boxShadow:
                  "0 18px 38px rgba(20, 20, 19, 0.16), inset 0 1px 0 rgba(255,255,255,0.9)",
                opacity: bezelFade,
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 150,
                  height: 6,
                  borderBottomLeftRadius: 6,
                  borderBottomRightRadius: 6,
                  backgroundColor: "#aeb2b9",
                }}
              />
            </div>
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
