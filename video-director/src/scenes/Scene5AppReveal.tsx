import type React from "react";
import {
  Activity,
  ArrowUpRight,
  FolderGit2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ChromaCurrentBackdrop } from "@/components/backgrounds/ChromaCurrentBackdrop";
import { WalrusBrandMark } from "@/components/brand/WalrusBrandMark";
import { inter, interTight, mono } from "@/lib/fonts";

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const GREETING = "What should your agents remember today?";

const FEATURE_CHIPS = [
  {
    label: "Live Flow Graph",
    icon: FolderGit2,
    accent: "#34d996",
    bg: "rgba(52, 217, 150, 0.14)",
  },
  {
    label: "Tatum Wallet Gate",
    icon: ShieldCheck,
    accent: "#38bdf8",
    bg: "rgba(56, 189, 248, 0.14)",
  },
  {
    label: "Run Live Recall",
    icon: Sparkles,
    accent: "#2dd4bf",
    bg: "rgba(45, 212, 191, 0.14)",
  },
  {
    label: "Tatum AI MCP",
    icon: Activity,
    accent: "#a7f3d0",
    bg: "rgba(167, 243, 208, 0.12)",
  },
] as const;

export const APP_REVEAL_CUES = {
  cardBuildAt: 14,
  cameraDiveAt: 34,
  chipFrames: [58, 66, 74, 82],
  inputBarAt: 88,
} as const;

function evalTrack(
  frame: number,
  kf: readonly (readonly [number, number])[],
): number {
  const first = kf[0];
  const last = kf[kf.length - 1];
  if (!first || !last) return 0;
  if (frame <= first[0]) return first[1];
  if (frame >= last[0]) return last[1];
  for (let i = 0; i < kf.length - 1; i++) {
    const a = kf[i];
    const b = kf[i + 1];
    if (!a || !b) break;
    if (frame <= b[0]) {
      const u = (frame - a[0]) / Math.max(1, b[0] - a[0]);
      const eased = 0.5 - 0.5 * Math.cos(Math.PI * u);
      return a[1] + (b[1] - a[1]) * eased;
    }
  }
  return last[1];
}

// 120-frame measured 3D camera flight: holds front, dives past card, rolls along top edge, settles front-on
const CAM_SCALE: readonly (readonly [number, number])[] = [
  [0, 1.0],
  [34, 1.0],
  [64, 1.36],
  [88, 1.18],
  [112, 1.0],
];
const CAM_RX: readonly (readonly [number, number])[] = [
  [0, 0],
  [34, 0],
  [64, 12.5],
  [88, 6.2],
  [112, 0],
];
const CAM_RY: readonly (readonly [number, number])[] = [
  [0, 0],
  [34, 0],
  [64, -14.0],
  [88, 7.6],
  [112, 0],
];
const CAM_RZ: readonly (readonly [number, number])[] = [
  [0, 0],
  [34, 0],
  [64, -4.4],
  [88, 2.2],
  [112, 0],
];
const CAM_TX: readonly (readonly [number, number])[] = [
  [0, 0],
  [34, 0],
  [64, 96],
  [88, -68],
  [112, 0],
];
const CAM_TY: readonly (readonly [number, number])[] = [
  [0, 0],
  [34, 0],
  [64, 62],
  [88, -22],
  [112, 0],
];

export const Scene5AppReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const foldT = interpolate(frame, [10, 36], [0, 1], {
    ...CLAMP,
    easing: Easing.inOut(Easing.cubic),
  });
  const cardBuild = interpolate(frame, [14, 38], [0, 1], {
    ...CLAMP,
    easing: Easing.out(Easing.cubic),
  });

  const camScale = evalTrack(frame, CAM_SCALE);
  const camRx = evalTrack(frame, CAM_RX);
  const camRy = evalTrack(frame, CAM_RY);
  const camRz = evalTrack(frame, CAM_RZ);
  const camTx = evalTrack(frame, CAM_TX);
  const camTy = evalTrack(frame, CAM_TY);

  const greetChars =
    frame < 38
      ? 0
      : Math.min(GREETING.length, Math.floor((frame - 38) * 1.15));
  const typedGreeting = GREETING.slice(0, greetChars);

  const canvasReveal = interpolate(frame, [44, 72], [0, 1], {
    ...CLAMP,
    easing: Easing.out(Easing.cubic),
  });

  const inputSpring = spring({
    frame: Math.max(0, frame - APP_REVEAL_CUES.inputBarAt),
    fps,
    config: { damping: 18, stiffness: 155, mass: 0.82 },
  });
  const inputOpacity = interpolate(
    frame,
    [APP_REVEAL_CUES.inputBarAt, APP_REVEAL_CUES.inputBarAt + 12],
    [0, 1],
    CLAMP,
  );

  const cardW = 1640;
  const cardH = 924;
  const cardLeft = (1920 - cardW) / 2;
  const cardTop = (1080 - cardH) / 2;

  const markX = interpolate(foldT, [0, 1], [960 - 185, cardLeft + 28]);
  const markY = interpolate(foldT, [0, 1], [540 - 40, cardTop + 17]);
  const markScale = interpolate(foldT, [0, 1], [1.72, 1.0]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#080c0b",
        fontFamily: inter.fontFamily,
        overflow: "hidden",
      }}
    >
      <ChromaCurrentBackdrop mode="dark" intensity={0.88} />

      <AbsoluteFill
        style={{
          perspective: 1500,
          transformStyle: "preserve-3d",
        }}
      >
        <AbsoluteFill
          style={{
            transformOrigin: "50% 50%",
            transform: `translate3d(${camTx}px, ${camTy}px, 0px) scale(${camScale}) rotateX(${camRx}deg) rotateY(${camRy}deg) rotateZ(${camRz}deg)`,
          }}
        >
          {/* App Card Shell Building Around the Header */}
          <div
            style={{
              position: "absolute",
              left: cardLeft,
              top: cardTop,
              width: cardW,
              height: cardH,
              borderRadius: 28,
              backgroundColor: "rgba(13, 18, 17, 0.96)",
              border: "1.5px solid rgba(52, 217, 150, 0.34)",
              boxShadow:
                "0 44px 120px rgba(0, 0, 0, 0.74), 0 0 60px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.10)",
              opacity: cardBuild,
              transform: `scale(${interpolate(cardBuild, [0, 1], [0.94, 1])})`,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Authentic MemWal Skills Top Bar */}
            <div
              style={{
                height: 76,
                padding: "0 28px 0 284px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.09)",
                backgroundColor: "rgba(16, 22, 20, 0.98)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {["Demo", "Skills (15)", "Connect"].map((tab, i) => (
                  <div
                    key={tab}
                    style={{
                      padding: "7px 18px",
                      borderRadius: 999,
                      fontSize: 16,
                      fontWeight: 600,
                      backgroundColor:
                        i === 1 ? "rgba(52, 217, 150, 0.16)" : "transparent",
                      border:
                        i === 1
                          ? "1px solid rgba(52, 217, 150, 0.45)"
                          : "1px solid rgba(255, 255, 255, 0.10)",
                      color: i === 1 ? "#6ee7b7" : "#94a3b8",
                    }}
                  >
                    {tab}
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    padding: "7px 16px",
                    borderRadius: 999,
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    fontFamily: mono.fontFamily,
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#e2e8f0",
                  }}
                >
                  memwal-team-skills
                </div>
                <div
                  style={{
                    padding: "7px 15px",
                    borderRadius: 999,
                    backgroundColor: "rgba(16, 185, 129, 0.16)",
                    border: "1px solid rgba(52, 217, 150, 0.40)",
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#6ee7b7",
                  }}
                >
                  Read &amp; Write
                </div>
                <div
                  style={{
                    padding: "7px 15px",
                    borderRadius: 999,
                    backgroundColor: "rgba(52, 217, 150, 0.14)",
                    border: "1px solid rgba(52, 217, 150, 0.36)",
                    fontFamily: mono.fontFamily,
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#a7f3d0",
                  }}
                >
                  @harrymove-ctrl
                </div>
              </div>
            </div>

            {/* Greeting Line + 4 Staggered Capability Chips */}
            <div
              style={{
                padding: "18px 32px 16px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 20,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  minHeight: 34,
                }}
              >
                <Sparkles size={22} color="#34d996" />
                <span
                  style={{
                    fontSize: 25,
                    fontWeight: 600,
                    color: "#f8fafc",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {typedGreeting}
                </span>
                {frame >= 38 && greetChars < GREETING.length && (
                  <span
                    style={{
                      width: 3,
                      height: 24,
                      backgroundColor: "#34d996",
                    }}
                  />
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {FEATURE_CHIPS.map((chip, idx) => {
                  const chipAt = APP_REVEAL_CUES.chipFrames[idx] ?? 58;
                  const s = spring({
                    frame: Math.max(0, frame - chipAt),
                    fps,
                    config: { damping: 16, stiffness: 175, mass: 0.76 },
                  });
                  const op = interpolate(
                    frame,
                    [chipAt, chipAt + 8],
                    [0, 1],
                    CLAMP,
                  );
                  const Icon = chip.icon;
                  return (
                    <div
                      key={chip.label}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 16px",
                        borderRadius: 999,
                        backgroundColor: chip.bg,
                        border: `1px solid ${chip.accent}55`,
                        opacity: op,
                        transform: `translateY(${interpolate(s, [0, 1], [12, 0])}px) scale(${interpolate(s, [0, 1], [0.92, 1])})`,
                      }}
                    >
                      <Icon size={16} color={chip.accent} strokeWidth={2.3} />
                      <span
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          color: "#f1f5f9",
                        }}
                      >
                        {chip.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Real Live Dark Flow Graph Workspace Preview inside Card */}
            <div
              style={{
                flex: 1,
                padding: "18px 32px",
                minHeight: 0,
                display: "flex",
              }}
            >
              <div
                style={{
                  flex: 1,
                  position: "relative",
                  borderRadius: 20,
                  overflow: "hidden",
                  border: "1px solid rgba(52, 217, 150, 0.28)",
                  backgroundColor: "#0a0f0e",
                  opacity: canvasReveal,
                  transform: `scale(${interpolate(canvasReveal, [0, 1], [0.98, 1])})`,
                }}
              >
                <Img
                  src={staticFile("shots/clean-1-flow-graph-dark.png")}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center 52%",
                  }}
                />
              </div>
            </div>

            {/* Arriving Bottom Composer Input Bar */}
            <div
              style={{
                padding: "0 32px 22px",
                opacity: inputOpacity,
                transform: `translateY(${interpolate(inputSpring, [0, 1], [24, 0])}px)`,
              }}
            >
              <div
                style={{
                  height: 68,
                  padding: "0 14px 0 24px",
                  borderRadius: 18,
                  backgroundColor: "rgba(20, 27, 25, 0.98)",
                  border: "1.5px solid rgba(52, 217, 150, 0.42)",
                  boxShadow: "0 14px 36px rgba(0, 0, 0, 0.48)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontFamily: mono.fontFamily,
                    fontSize: 18,
                    color: "#e2e8f0",
                  }}
                >
                  Ask Tatum AI, Claude Code, or Cursor to recall team rules...
                </span>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "11px 22px",
                    borderRadius: 13,
                    backgroundColor: "#34d996",
                    color: "#052e16",
                    fontSize: 17,
                    fontWeight: 700,
                  }}
                >
                  <span>Explore Live Canvas</span>
                  <ArrowUpRight size={19} strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </div>

          {/* Folding Hero Wordmark */}
          <div
            style={{
              position: "absolute",
              left: markX,
              top: markY,
              transform: `scale(${markScale})`,
              transformOrigin: "left center",
              display: "inline-flex",
              alignItems: "center",
              gap: 14,
              zIndex: 30,
              pointerEvents: "none",
            }}
          >
            <WalrusBrandMark size={42} color="#34d996" darkTile glow />
            <span
              style={{
                fontFamily: interTight.fontFamily,
                fontSize: 28,
                fontWeight: 700,
                letterSpacing: "-0.035em",
                color: "#f8fafc",
                whiteSpace: "nowrap",
              }}
            >
              MemWal Skills
            </span>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
