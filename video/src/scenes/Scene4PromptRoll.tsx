import type React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  ArrowUpRight,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
  Terminal,
} from "lucide-react";
import { ChromaCurrentBackdrop } from "@/components/backgrounds/ChromaCurrentBackdrop";
import { WalrusLogo3DVideo } from "@/components/brand/WalrusBrandPrimitives";
import { Caret } from "@/components/snapcn/caret";
import { Input } from "@/components/snapcn/input";
import { WordWheel } from "@/components/snapcn/word-wheel";
import { SNAP_CN_UI } from "@/lib/brand-tokens";

const ROLL_WORDS = [
  "Sui gRPC SDK rules",
  "Walrus blob receipts",
  "team SKILL.md graph",
  "shared delegate keys",
];

const AGENT_CARDS = [
  {
    name: "Claude Code",
    tag: "gRPC SDK Rules",
    activateFrame: 16,
    icon: Terminal,
  },
  {
    name: "Cursor",
    tag: "Blob Receipts",
    activateFrame: 62,
    icon: Cpu,
  },
  {
    name: "Antigravity",
    tag: "SKILL.md Graph",
    activateFrame: 108,
    icon: Sparkles,
  },
  {
    name: "Codex",
    tag: "Delegate Keys",
    activateFrame: 154,
    icon: Layers,
  },
] as const;

export const Scene4PromptRoll: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerSpring = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 135, mass: 0.85 },
  });

  const composerSpring = spring({
    frame: Math.max(0, frame - 6),
    fps,
    config: { damping: 18, stiffness: 130, mass: 0.85 },
  });

  // Active WordWheel slot index: steps at frames 16, 62, 108, 154 (holdFrames=32 + rollFrames=14 = 46)
  const activeSlot =
    frame >= 154 ? 3 : frame >= 108 ? 2 : frame >= 62 ? 1 : 0;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: SNAP_CN_UI.light.canvas,
        fontFamily: SNAP_CN_UI.fontFamily,
        overflow: "hidden",
      }}
    >
      {/* Light Sorbet ChromaCurrent Stage */}
      <ChromaCurrentBackdrop mode="light" intensity={0.9} />

      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 65% 54% at 50% 50%, rgba(245, 246, 241, 0.58), transparent 80%)",
          pointerEvents: "none",
        }}
      />

      {/* Strict 10% Safe Zone */}
      <AbsoluteFill
        style={{
          padding: "108px 192px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 38,
        }}
      >
        {/* Section Eyebrow + Concise Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            opacity: interpolate(frame, [0, 12], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            transform: `translateY(${interpolate(headerSpring, [0, 1], [22, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })}px)`,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 22px",
              borderRadius: 999,
              backgroundColor: "rgba(255, 255, 255, 0.90)",
              border: "1px solid rgba(5, 150, 105, 0.30)",
            }}
          >
            <Sparkles size={22} color="#047857" strokeWidth={2.3} />
            <span
              style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "0.05em",
                color: "#065f46",
              }}
            >
              CROSS-HARNESS RECALL
            </span>
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: 58,
              fontWeight: 750,
              color: "#141413",
              letterSpacing: "-0.032em",
              lineHeight: 1.1,
              textAlign: "center",
            }}
          >
            Every context your agents need.
          </h2>
        </div>

        {/* Official @snapcn/prompt-roll Composer (Input + WordWheel + Caret) */}
        <div
          style={{
            opacity: interpolate(frame, [4, 16], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            transform: `translateY(${interpolate(
              composerSpring,
              [0, 1],
              [24, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            )}px)`,
          }}
        >
          <Input
            theme="light"
            focused={true}
            width={1220}
            minHeight={98}
            radius={999}
            padding="18px 28px"
            leading={<WalrusLogo3DVideo size={38} color="#059669" />}
            trailing={
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: "50%",
                  backgroundColor: "#141413",
                  color: "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 10px 24px rgba(20, 20, 19, 0.22)",
                }}
              >
                <ArrowUpRight size={26} strokeWidth={2.5} />
              </div>
            }
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "nowrap",
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  fontSize: 30,
                  color: "#141413",
                  fontWeight: 550,
                  marginRight: 4,
                }}
              >
                Recall
              </span>
              <WordWheel
                words={ROLL_WORDS}
                holdFrames={32}
                rollFrames={14}
                startFrame={16}
                fontSize={30}
                lineHeight={48}
                color="#065f46"
                backgroundColor="rgba(16, 185, 129, 0.14)"
                borderColor="rgba(5, 150, 105, 0.36)"
              />
              <span
                style={{
                  fontSize: 30,
                  color: "#141413",
                  fontWeight: 550,
                  marginLeft: 4,
                }}
              >
                across every IDE
              </span>
              <Caret visible blinking color="#059669" height={32} />
            </div>
          </Input>
        </div>

        {/* 4 Connected Agent Cards Lighting Up in Sync with WordWheel (frames 16, 62, 108, 154) */}
        <div
          style={{
            width: 1220,
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 20,
            marginTop: 6,
          }}
        >
          {AGENT_CARDS.map((agent, idx) => {
            const Icon = agent.icon;
            const cardEnter = spring({
              frame: Math.max(0, frame - (10 + idx * 4)),
              fps,
              config: { damping: 18, stiffness: 140, mass: 0.82 },
            });
            const isActivated = frame >= agent.activateFrame;
            const isCurrent = activeSlot === idx && frame >= 16;

            const activeSpring = spring({
              frame: Math.max(0, frame - agent.activateFrame),
              fps,
              config: { damping: 15, stiffness: 170, mass: 0.78 },
            });

            const liftY = isCurrent
              ? interpolate(activeSpring, [0, 1], [0, -6], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })
              : 0;

            return (
              <div
                key={agent.name}
                style={{
                  padding: "20px 22px",
                  borderRadius: 24,
                  backgroundColor: isCurrent
                    ? "#ffffff"
                    : isActivated
                      ? "rgba(255, 255, 255, 0.94)"
                      : "rgba(255, 255, 255, 0.76)",
                  border: isCurrent
                    ? "2px solid #059669"
                    : isActivated
                      ? "1.5px solid rgba(5, 150, 105, 0.36)"
                      : "1.5px solid rgba(20, 20, 19, 0.10)",
                  boxShadow: isCurrent
                    ? "0 18px 40px rgba(5, 150, 105, 0.16), 0 0 0 4px rgba(16, 185, 129, 0.12)"
                    : "0 10px 26px rgba(20, 20, 19, 0.06)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  opacity: interpolate(
                    frame,
                    [10 + idx * 4, 22 + idx * 4],
                    [0, 1],
                    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                  ),
                  transform: `translateY(${
                    interpolate(cardEnter, [0, 1], [20, 0], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    }) + liftY
                  }px)`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isActivated
                        ? "rgba(16, 185, 129, 0.15)"
                        : "rgba(20, 20, 19, 0.06)",
                      color: isActivated ? "#047857" : "#3f3f46",
                    }}
                  >
                    <Icon size={22} strokeWidth={2.3} />
                  </div>

                  {isActivated ? (
                    <CheckCircle2
                      size={24}
                      color="#059669"
                      strokeWidth={2.4}
                    />
                  ) : (
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        backgroundColor: "rgba(20, 20, 19, 0.22)",
                      }}
                    />
                  )}
                </div>

                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: "#141413",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.2,
                  }}
                >
                  {agent.name}
                </div>

                <div
                  style={{
                    fontSize: 22,
                    fontWeight: isActivated ? 620 : 500,
                    color: isActivated ? "#065f46" : "#52525b",
                    lineHeight: 1.25,
                  }}
                >
                  {agent.tag}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene4PromptRoll;
