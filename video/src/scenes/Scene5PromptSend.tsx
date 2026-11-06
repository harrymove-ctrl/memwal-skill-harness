import type React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { ChromaCurrentBackdrop } from "@/components/backgrounds/ChromaCurrentBackdrop";
import { WalrusLogo3DVideo } from "@/components/brand/WalrusBrandPrimitives";
import { PromptSend } from "@/components/snapcn/prompt-send";
import { SNAP_CN_UI } from "@/lib/brand-tokens";

export const Scene5PromptSend: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const barSpring = spring({
    frame: Math.max(0, frame - 120),
    fps,
    config: { damping: 18, stiffness: 120, mass: 0.85 },
  });

  const leftBarPct = interpolate(barSpring, [0, 1], [0, 38], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rightBarPct = interpolate(barSpring, [0, 1], [0, 96], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: SNAP_CN_UI.dark.canvas,
        fontFamily: SNAP_CN_UI.fontFamily,
        overflow: "hidden",
      }}
    >
      {/* Dark Emerald & Obsidian ChromaCurrent Stage */}
      <ChromaCurrentBackdrop mode="dark" intensity={1.15} />

      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 64% 56% at 50% 50%, rgba(8, 12, 11, 0.58), transparent 82%)",
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
        }}
      >
        <PromptSend
          width={1160}
          typeStartFrame={12}
          framesPerChar={1.55}
          sendClickFrame={112}
          promptText="Benchmark Sui SDK task: Without vs With Team Memory"
          chips={[
            "Namespace Skill Graph",
            "Shared Delegate Key",
            "Walrus Blob Proof",
          ]}
          brandHeader={
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: 4,
              }}
            >
              <WalrusLogo3DVideo size={42} color="#34d996" />
              <span
                style={{
                  fontSize: 48,
                  fontWeight: 700,
                  color: "#f8fafc",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                }}
              >
                Trajectory Eval Harness
              </span>
            </div>
          }
          afterSendContent={
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 24,
                width: "100%",
                marginTop: 6,
              }}
            >
              {/* Left Card: Without Shared Memory (38% Pass) */}
              <div
                style={{
                  padding: "26px 30px",
                  borderRadius: 24,
                  backgroundColor: "rgba(17, 22, 21, 0.94)",
                  border: "1.5px solid rgba(248, 113, 113, 0.38)",
                  boxShadow: "0 20px 48px rgba(0, 0, 0, 0.45)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: 23,
                      fontWeight: 650,
                      color: "#fca5a5",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    Without Shared Memory
                  </span>
                  <span
                    style={{
                      padding: "4px 14px",
                      borderRadius: 999,
                      backgroundColor: "rgba(248, 113, 113, 0.14)",
                      border: "1px solid rgba(248, 113, 113, 0.34)",
                      fontSize: 22,
                      fontWeight: 650,
                      color: "#fca5a5",
                    }}
                  >
                    Cold Agent
                  </span>
                </div>

                <div
                  style={{
                    fontSize: 56,
                    fontWeight: 780,
                    color: "#f87171",
                    letterSpacing: "-0.03em",
                    lineHeight: 1.05,
                  }}
                >
                  38% Pass
                </div>

                <div
                  style={{
                    width: "100%",
                    height: 12,
                    borderRadius: 999,
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${leftBarPct}%`,
                      height: "100%",
                      borderRadius: 999,
                      backgroundColor: "#f87171",
                    }}
                  />
                </div>

                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 520,
                    color: "#cbd5e1",
                    lineHeight: 1.3,
                  }}
                >
                  Hallucinates deprecated JSON-RPC
                </div>
              </div>

              {/* Right Card: With Walrus Memory (96% PASS, glowing emerald border) */}
              <div
                style={{
                  padding: "26px 30px",
                  borderRadius: 24,
                  background:
                    "linear-gradient(145deg, rgba(16, 42, 34, 0.95), rgba(11, 22, 19, 0.98))",
                  border: "1.5px solid #34d996",
                  boxShadow:
                    "0 0 48px rgba(52, 217, 150, 0.22), 0 22px 52px rgba(0, 0, 0, 0.50)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 10,
                      fontSize: 23,
                      fontWeight: 700,
                      color: "#6ee7b7",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    <ShieldCheck size={24} color="#34d996" strokeWidth={2.4} />
                    With Walrus Memory
                  </span>
                  <span
                    style={{
                      padding: "4px 16px",
                      borderRadius: 999,
                      backgroundColor: "#34d996",
                      color: "#042f2e",
                      fontSize: 22,
                      fontWeight: 780,
                    }}
                  >
                    +58% lift
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    fontSize: 56,
                    fontWeight: 800,
                    color: "#34d996",
                    letterSpacing: "-0.03em",
                    lineHeight: 1.05,
                  }}
                >
                  <span>96% PASS</span>
                  <CheckCircle2 size={38} color="#34d996" strokeWidth={2.5} />
                </div>

                <div
                  style={{
                    width: "100%",
                    height: 12,
                    borderRadius: 999,
                    backgroundColor: "rgba(255, 255, 255, 0.10)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${rightBarPct}%`,
                      height: "100%",
                      borderRadius: 999,
                      background:
                        "linear-gradient(90deg, #10b981 0%, #34d996 100%)",
                      boxShadow: "0 0 18px rgba(52, 217, 150, 0.65)",
                    }}
                  />
                </div>

                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 560,
                    color: "#f8fafc",
                    lineHeight: 1.3,
                  }}
                >
                  Recalls cmk:sui-sdk gRPC + Blob z7BHX3br...
                </div>
              </div>
            </div>
          }
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene5PromptSend;
