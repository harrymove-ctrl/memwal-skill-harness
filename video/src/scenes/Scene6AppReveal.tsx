import type React from "react";
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
import {
  ArrowUpRight,
  CheckCircle2,
  Database,
  GitBranch,
  KeyRound,
  Sparkles,
  Terminal,
} from "lucide-react";
import { ChromaCurrentBackdrop } from "@/components/backgrounds/ChromaCurrentBackdrop";
import {
  SignerOrbVideo,
  WalrusLogo3DVideo,
} from "@/components/brand/WalrusBrandPrimitives";
import { DotBloom } from "@/components/snapcn/dot-bloom";
import { SNAP_CN_UI } from "@/lib/brand-tokens";

const WORKSPACE_SIGNERS = [
  "@harrymove-ctrl",
  "@teammate-dev",
  "@teammate-qa",
] as const;

const GRAPH_NODES = [
  {
    id: "memwal-skill-hub",
    label: "memwal-skill-hub",
    x: 110,
    y: 196,
    isHub: true,
  },
  {
    id: "cmk:sui-sdk",
    label: "cmk:sui-sdk",
    x: 432,
    y: 78,
    isHub: false,
  },
  {
    id: "getting-started",
    label: "getting-started",
    x: 432,
    y: 196,
    isHub: false,
  },
  {
    id: "walrus-qa",
    label: "walrus-qa",
    x: 432,
    y: 314,
    isHub: false,
  },
] as const;

export const Scene6AppReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Smooth fade from emerald DotBloom into rich dark-emerald/obsidian ChromaCurrent stage
  const darkStageOpacity = interpolate(frame, [11, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // App Window entrance (frames 10..186 — overlaps DotBloom expansion with zero flat frames)
  const appRiseSpring = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { damping: 20, stiffness: 95 },
  });
  const appEnterOpacity = interpolate(frame, [10, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Cross-zoom transition from App Window -> Final Brand End Card (frames 174..194)
  const crossZoomT = interpolate(frame, [174, 194], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const appOpacity = appEnterOpacity * (1 - crossZoomT);
  const appY = interpolate(appRiseSpring, [0, 1], [48, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const appScale =
    interpolate(appRiseSpring, [0, 1], [0.93, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) *
    interpolate(crossZoomT, [0, 1], [1, 1.06], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const appBlur = interpolate(crossZoomT, [0, 1], [0, 10], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Animated eval bars inside workspace
  const scoreSpring = spring({
    frame: Math.max(0, frame - 26),
    fps,
    config: { damping: 18, stiffness: 115 },
  });
  const passBarPct = interpolate(scoreSpring, [0, 1], [0, 96.4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Final Brand End Card Lockup (frames 178..309 — >3.65s rock-steady 100%-opacity hold)
  const endCardSpring = spring({
    frame: Math.max(0, frame - 178),
    fps,
    config: { damping: 18, stiffness: 120, mass: 0.85 },
  });
  const endCardOpacity = interpolate(frame, [180, 198], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const dashOffset = -(frame * 1.6);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#080c0b",
        fontFamily: SNAP_CN_UI.fontFamily,
        overflow: "hidden",
      }}
    >
      {/* Layer 1: @snapcn/dot-bloom Emerald Reveal */}
      <DotBloom
        color="#10b981"
        fromBg="#080c0b"
        startFrame={0}
        durationFrames={32}
      />

      {/* Layer 2: Dark ChromaCurrent Showcase Stage fading in over frames 26..48 */}
      <AbsoluteFill style={{ opacity: darkStageOpacity }}>
        <ChromaCurrentBackdrop mode="dark" intensity={1.1} />
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(ellipse 68% 60% at 50% 50%, rgba(8, 12, 11, 0.52), rgba(8, 12, 11, 0.72) 100%)",
          }}
        />
      </AbsoluteFill>

      {/* Phase A (Frames 24–195): 1500x790 Walrus Memory Desktop Workspace inside Safe Zone */}
      {appOpacity > 0.01 && (
        <AbsoluteFill
          style={{
            padding: "108px 192px",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: appOpacity,
            transform: `translateY(${appY}px) scale(${appScale})`,
            filter: appBlur > 0.2 ? `blur(${appBlur.toFixed(1)}px)` : "none",
          }}
        >
          <div
            style={{
              width: 1500,
              height: 790,
              borderRadius: 28,
              backgroundColor: "rgba(13, 19, 18, 0.95)",
              border: "1.5px solid rgba(52, 217, 150, 0.36)",
              boxShadow:
                "0 36px 90px rgba(0, 0, 0, 0.68), 0 0 60px rgba(16, 185, 129, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* macOS Window Top Bar */}
            <div
              style={{
                height: 74,
                padding: "0 26px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.10)",
                backgroundColor: "rgba(18, 26, 24, 0.96)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
              }}
            >
              {/* Traffic Lights + App Brand */}
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      backgroundColor: "#ff5f57",
                    }}
                  />
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      backgroundColor: "#febc2e",
                    }}
                  />
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      backgroundColor: "#28c840",
                    }}
                  />
                </div>

                {/* Route Tabs: 1 Demo | 2 Skills | 3 Connect */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginLeft: 10,
                    padding: 5,
                    borderRadius: 14,
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  {["1 Demo", "2 Skills", "3 Connect"].map((tab, idx) => {
                    const active = idx === 1;
                    return (
                      <div
                        key={tab}
                        style={{
                          padding: "6px 16px",
                          borderRadius: 10,
                          backgroundColor: active
                            ? "rgba(52, 217, 150, 0.18)"
                            : "transparent",
                          border: active
                            ? "1px solid rgba(52, 217, 150, 0.42)"
                            : "1px solid transparent",
                          color: active ? "#6ee7b7" : "#cbd5e1",
                          fontSize: 22,
                          fontWeight: active ? 700 : 540,
                        }}
                      >
                        {tab}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Namespace + Gas Sponsored Badges */}
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    padding: "7px 18px",
                    borderRadius: 999,
                    backgroundColor: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.14)",
                    fontFamily: SNAP_CN_UI.monoFamily,
                    fontSize: 22,
                    fontWeight: 600,
                    color: "#e2e8f0",
                  }}
                >
                  ns://walrus-team-core
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "7px 18px",
                    borderRadius: 999,
                    backgroundColor: "rgba(52, 217, 150, 0.15)",
                    border: "1px solid rgba(52, 217, 150, 0.42)",
                    fontSize: 22,
                    fontWeight: 700,
                    color: "#34d996",
                  }}
                >
                  <Sparkles size={20} color="#34d996" strokeWidth={2.4} />
                  <span>Gas Sponsored</span>
                </div>
              </div>
            </div>

            {/* 3-Column Authentic Workspace Body */}
            <div
              style={{
                flex: 1,
                padding: 24,
                display: "grid",
                gridTemplateColumns: "352px 1fr 336px",
                gap: 20,
                boxSizing: "border-box",
              }}
            >
              {/* Left Rail: Signers & Delegate Vault */}
              <div
                style={{
                  borderRadius: 20,
                  backgroundColor: "rgba(20, 29, 27, 0.86)",
                  border: "1px solid rgba(255, 255, 255, 0.09)",
                  padding: 22,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: "#f8fafc",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    Team Signers
                  </div>

                  {WORKSPACE_SIGNERS.map((handle) => (
                    <div
                      key={handle}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "13px 16px",
                        borderRadius: 16,
                        backgroundColor: "rgba(255, 255, 255, 0.04)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                      }}
                    >
                      <SignerOrbVideo handle={handle} size={34} />
                      <span
                        style={{
                          fontFamily: SNAP_CN_UI.monoFamily,
                          fontSize: 22,
                          fontWeight: 580,
                          color: "#f8fafc",
                          flex: 1,
                        }}
                      >
                        {handle}
                      </span>
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          backgroundColor: "#34d996",
                          boxShadow: "0 0 10px #34d996",
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Delegate Key Vault Card */}
                <div
                  style={{
                    padding: "18px 18px",
                    borderRadius: 18,
                    backgroundColor: "rgba(52, 217, 150, 0.12)",
                    border: "1px solid rgba(52, 217, 150, 0.38)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      color: "#6ee7b7",
                      fontSize: 22,
                      fontWeight: 700,
                    }}
                  >
                    <KeyRound size={22} color="#34d996" strokeWidth={2.4} />
                    <span>Shared Delegate Key</span>
                  </div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 600,
                      color: "#34d996",
                    }}
                  >
                    Active · Zero cold keys
                  </div>
                </div>
              </div>

              {/* Center Stage: Namespace Skill Graph + Mascot Thumbnail + Blob Badge */}
              <div
                style={{
                  borderRadius: 20,
                  backgroundColor: "rgba(18, 26, 24, 0.90)",
                  border: "1px solid rgba(52, 217, 150, 0.24)",
                  padding: 22,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                {/* Header + Plush Mascot Preview */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      fontSize: 24,
                      fontWeight: 700,
                      color: "#f8fafc",
                    }}
                  >
                    <GitBranch size={24} color="#34d996" strokeWidth={2.4} />
                    <span>Namespace Skill Graph</span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "6px 14px 6px 8px",
                      borderRadius: 16,
                      backgroundColor: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.14)",
                    }}
                  >
                    <Img
                      src={staticFile("plush/walrus-mascot-1-skill-hub.jpg")}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 11,
                        objectFit: "cover",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 22,
                        fontWeight: 620,
                        color: "#e2e8f0",
                      }}
                    >
                      Skill Hub
                    </span>
                  </div>
                </div>

                {/* Connected Skill Nodes Canvas */}
                <div
                  style={{
                    position: "relative",
                    height: 430,
                    borderRadius: 18,
                    backgroundColor: "rgba(9, 14, 13, 0.72)",
                    border: "1px solid rgba(255, 255, 255, 0.07)",
                    overflow: "hidden",
                  }}
                >
                  <svg
                    width="678"
                    height="430"
                    viewBox="0 0 678 430"
                    style={{ position: "absolute", inset: 0 }}
                  >
                    {[78, 196, 314].map((targetY) => (
                      <g key={targetY}>
                        <path
                          d={`M 260 220 C 345 220, 345 ${targetY + 24}, 428 ${
                            targetY + 24
                          }`}
                          fill="none"
                          stroke="rgba(52, 217, 150, 0.26)"
                          strokeWidth={2.5}
                        />
                        <path
                          d={`M 260 220 C 345 220, 345 ${targetY + 24}, 428 ${
                            targetY + 24
                          }`}
                          fill="none"
                          stroke="#34d996"
                          strokeWidth={3}
                          strokeDasharray="10 14"
                          strokeDashoffset={dashOffset}
                        />
                      </g>
                    ))}
                  </svg>

                  {GRAPH_NODES.map((node) => (
                    <div
                      key={node.id}
                      style={{
                        position: "absolute",
                        left: node.isHub ? 28 : 426,
                        top: node.y,
                        width: node.isHub ? 236 : 224,
                        padding: "13px 16px",
                        borderRadius: 16,
                        backgroundColor: node.isHub
                          ? "rgba(16, 48, 38, 0.96)"
                          : "rgba(22, 32, 30, 0.96)",
                        border: node.isHub
                          ? "1.5px solid #34d996"
                          : "1.5px solid rgba(52, 217, 150, 0.42)",
                        boxShadow: node.isHub
                          ? "0 0 28px rgba(52, 217, 150, 0.25)"
                          : "0 10px 24px rgba(0, 0, 0, 0.38)",
                        fontFamily: SNAP_CN_UI.monoFamily,
                        fontSize: 22,
                        fontWeight: 650,
                        color: node.isHub ? "#6ee7b7" : "#f8fafc",
                        textAlign: "center",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {node.label}
                    </div>
                  ))}
                </div>

                {/* Live Walrus Blob Badge */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 18px",
                    borderRadius: 14,
                    backgroundColor: "rgba(52, 217, 150, 0.11)",
                    border: "1px solid rgba(52, 217, 150, 0.34)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontFamily: SNAP_CN_UI.monoFamily,
                      fontSize: 22,
                      fontWeight: 620,
                      color: "#34d996",
                    }}
                  >
                    <Database size={22} color="#34d996" strokeWidth={2.3} />
                    <span>Blob z7BHX3br...Fkk0</span>
                  </div>
                  <span
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: "#6ee7b7",
                    }}
                  >
                    On-Chain
                  </span>
                </div>
              </div>

              {/* Right Rail: Live Eval Scoreboard */}
              <div
                style={{
                  borderRadius: 20,
                  backgroundColor: "rgba(20, 29, 27, 0.86)",
                  border: "1px solid rgba(255, 255, 255, 0.09)",
                  padding: 22,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 18 }}
                >
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: "#f8fafc",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    Trajectory Eval
                  </div>

                  {/* 96.4% Pass Rate Hero Card */}
                  <div
                    style={{
                      padding: 20,
                      borderRadius: 18,
                      background:
                        "linear-gradient(145deg, rgba(16, 44, 35, 0.92), rgba(12, 24, 21, 0.95))",
                      border: "1.5px solid rgba(52, 217, 150, 0.55)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 650,
                        color: "#6ee7b7",
                      }}
                    >
                      With Walrus Memory
                    </div>
                    <div
                      style={{
                        fontSize: 54,
                        fontWeight: 800,
                        color: "#34d996",
                        letterSpacing: "-0.03em",
                        lineHeight: 1.05,
                      }}
                    >
                      96.4%
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: 11,
                        borderRadius: 999,
                        backgroundColor: "rgba(255, 255, 255, 0.10)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${passBarPct}%`,
                          height: "100%",
                          borderRadius: 999,
                          backgroundColor: "#34d996",
                        }}
                      />
                    </div>
                  </div>

                  {/* 38.0% Baseline Card */}
                  <div
                    style={{
                      padding: 20,
                      borderRadius: 18,
                      backgroundColor: "rgba(255, 255, 255, 0.04)",
                      border: "1px solid rgba(248, 113, 113, 0.32)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 600,
                        color: "#fca5a5",
                      }}
                    >
                      Baseline (No Memory)
                    </div>
                    <div
                      style={{
                        fontSize: 38,
                        fontWeight: 750,
                        color: "#f87171",
                        letterSpacing: "-0.025em",
                        lineHeight: 1.1,
                      }}
                    >
                      38.0%
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: 10,
                        borderRadius: 999,
                        backgroundColor: "rgba(255, 255, 255, 0.08)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: "38%",
                          height: "100%",
                          borderRadius: 999,
                          backgroundColor: "#f87171",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom MCP Sync Active Pill */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 9,
                    padding: "13px 16px",
                    borderRadius: 16,
                    backgroundColor: "rgba(52, 217, 150, 0.14)",
                    border: "1px solid rgba(52, 217, 150, 0.42)",
                    color: "#6ee7b7",
                    fontSize: 22,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  }}
                >
                  <CheckCircle2 size={23} color="#34d996" strokeWidth={2.4} />
                  <span>MCP Sync · Live</span>
                </div>
              </div>
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* Phase B (Frames 178–309): Final Brand End Card Lockup (>3.7s 100%-Opacity Hold) */}
      {frame >= 178 && (
        <AbsoluteFill
          style={{
            padding: "108px 192px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 26,
            opacity: endCardOpacity,
            transform: `translateY(${interpolate(
              endCardSpring,
              [0, 1],
              [28, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            )}px) scale(${interpolate(endCardSpring, [0, 1], [0.94, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })})`,
          }}
        >
          {/* Glowing Final Brand Mark */}
          <div
            style={{
              width: 162,
              height: 162,
              borderRadius: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "linear-gradient(150deg, rgba(22, 38, 34, 0.95), rgba(10, 16, 15, 0.98))",
              border: "1.5px solid rgba(52, 217, 150, 0.52)",
              boxShadow:
                "0 0 88px rgba(52, 217, 150, 0.30), 0 28px 64px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.18)",
            }}
          >
            <WalrusLogo3DVideo size={112} color="#34d996" />
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 84,
              fontWeight: 750,
              color: "#f8fafc",
              letterSpacing: "-0.035em",
              lineHeight: 1.05,
              textAlign: "center",
            }}
          >
            Walrus Memory
          </h1>

          <p
            style={{
              margin: 0,
              fontSize: 34,
              fontWeight: 520,
              color: "#cbd5e1",
              letterSpacing: "-0.015em",
              lineHeight: 1.3,
              textAlign: "center",
            }}
          >
            Shared SKILL.md &amp; Flow Memory on Walrus.
          </p>

          {/* Crisp Terminal CTA Pill */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 16,
              marginTop: 10,
              padding: "18px 34px",
              borderRadius: 999,
              backgroundColor: "rgba(15, 23, 21, 0.94)",
              border: "1.5px solid #34d996",
              boxShadow:
                "0 0 52px rgba(52, 217, 150, 0.24), 0 22px 52px rgba(0, 0, 0, 0.55)",
            }}
          >
            <Terminal size={26} color="#34d996" strokeWidth={2.4} />
            <span
              style={{
                fontFamily: SNAP_CN_UI.monoFamily,
                fontSize: 26,
                fontWeight: 650,
                color: "#f8fafc",
                letterSpacing: "-0.015em",
              }}
            >
              npx @mysten-incubation/memwal-mcp
            </span>
          </div>

          {/* Website Domain Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 24px",
              borderRadius: 999,
              backgroundColor: "rgba(52, 217, 150, 0.14)",
              border: "1px solid rgba(52, 217, 150, 0.40)",
              color: "#6ee7b7",
              fontSize: 23,
              fontWeight: 650,
            }}
          >
            <span>memwal.mystenlabs.com</span>
            <ArrowUpRight size={22} color="#34d996" strokeWidth={2.4} />
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

export default Scene6AppReveal;
