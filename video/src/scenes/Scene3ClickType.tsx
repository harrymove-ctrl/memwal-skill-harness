import type React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CheckCircle2, Database, Terminal } from "lucide-react";
import { ChromaCurrentBackdrop } from "@/components/backgrounds/ChromaCurrentBackdrop";
import {
  SignerOrbVideo,
  WalrusLogo3DVideo,
} from "@/components/brand/WalrusBrandPrimitives";
import { ClickType } from "@/components/snapcn/click-type";
import { SNAP_CN_UI } from "@/lib/brand-tokens";

const SIGNERS = [
  { handle: "@harrymove-ctrl", role: "Lead" },
  { handle: "@teammate-dev", role: "SDK" },
  { handle: "@teammate-qa", role: "Eval" },
] as const;

export const Scene3ClickType: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerSpring = spring({
    frame,
    fps,
    config: { damping: 19, stiffness: 135, mass: 0.85 },
  });

  const receiptSpring = spring({
    frame: Math.max(0, frame - 116),
    fps,
    config: { damping: 18, stiffness: 145, mass: 0.82 },
  });
  const receiptOpacity = interpolate(frame, [116, 128], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: SNAP_CN_UI.light.canvas,
        fontFamily: SNAP_CN_UI.fontFamily,
        overflow: "hidden",
      }}
    >
      {/* Demo App Sorbet Light ChromaCurrent Stage */}
      <ChromaCurrentBackdrop mode="light" intensity={1.0} />

      {/* Soft center surface glow so #141413 typography pops with high contrast */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 64% 54% at 50% 50%, rgba(245, 246, 241, 0.62), transparent 80%)",
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
          gap: 36,
        }}
      >
        {/* Section Eyebrow + Concise 6-Word Header */}
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
              backgroundColor: "rgba(255, 255, 255, 0.88)",
              border: "1px solid rgba(5, 150, 105, 0.30)",
              boxShadow: "0 8px 24px rgba(20, 20, 19, 0.06)",
            }}
          >
            <Terminal size={22} color="#047857" strokeWidth={2.3} />
            <span
              style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "0.05em",
                color: "#065f46",
              }}
            >
              ONE-COMMAND CLI &amp; MCP
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
            Sync team skills in one command.
          </h2>
        </div>

        {/* @snapcn/click-type Interactive Command Bar */}
        <div style={{ marginTop: 4, marginBottom: 14 }}>
          <ClickType
            theme="light"
            text="npx memwal sync --ns walrus-team-core"
            clickFrame={28}
            typeStartFrame={38}
            framesPerChar={2.1}
            width={1120}
            cursorLabel="@harrymove-ctrl"
            leadingIcon={<WalrusLogo3DVideo size={36} color="#059669" />}
            trailingBadge={
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 18px",
                  borderRadius: 999,
                  backgroundColor: "rgba(16, 185, 129, 0.14)",
                  border: "1px solid rgba(5, 150, 105, 0.34)",
                  color: "#065f46",
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                }}
              >
                <CheckCircle2 size={22} color="#059669" strokeWidth={2.4} />
                <span>MCP READY</span>
              </div>
            }
          />
        </div>

        {/* Live Signer Presence + On-Chain Blob Receipt (springs in at ~frame 118 as typing finishes) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 18,
            marginTop: 12,
          }}
        >
          {/* 3 Live Signer Presence Pills */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 16,
            }}
          >
            {SIGNERS.map((signer, idx) => {
              const startF = 118 + idx * 5;
              const pillSpring = spring({
                frame: Math.max(0, frame - startF),
                fps,
                config: { damping: 17, stiffness: 150, mass: 0.8 },
              });
              const pillOpacity = interpolate(
                frame,
                [startF, startF + 10],
                [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              );

              return (
                <div
                  key={signer.handle}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 22px 10px 14px",
                    borderRadius: 999,
                    backgroundColor: "rgba(255, 255, 255, 0.94)",
                    border: "1px solid rgba(20, 20, 19, 0.12)",
                    boxShadow: "0 12px 28px rgba(20, 20, 19, 0.08)",
                    opacity: pillOpacity,
                    transform: `translateY(${interpolate(
                      pillSpring,
                      [0, 1],
                      [20, 0],
                      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                    )}px) scale(${interpolate(
                      pillSpring,
                      [0, 1],
                      [0.95, 1],
                      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                    )})`,
                  }}
                >
                  <SignerOrbVideo handle={signer.handle} size={32} />
                  <span
                    style={{
                      fontFamily: SNAP_CN_UI.monoFamily,
                      fontSize: 22,
                      fontWeight: 600,
                      color: "#141413",
                    }}
                  >
                    {signer.handle}
                  </span>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      backgroundColor: "#10b981",
                      boxShadow: "0 0 10px rgba(16, 185, 129, 0.65)",
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Synced Walrus Blob Verification Banner */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              padding: "11px 26px",
              borderRadius: 999,
              backgroundColor: "rgba(6, 95, 70, 0.10)",
              border: "1px solid rgba(5, 150, 105, 0.34)",
              opacity: receiptOpacity,
              transform: `translateY(${interpolate(
                receiptSpring,
                [0, 1],
                [16, 0],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              )}px)`,
            }}
          >
            <Database size={22} color="#047857" strokeWidth={2.3} />
            <span
              style={{
                fontFamily: SNAP_CN_UI.monoFamily,
                fontSize: 22,
                fontWeight: 620,
                color: "#065f46",
              }}
            >
              Synced SKILL.md · Blob z7BHX3br...Fkk0
            </span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default Scene3ClickType;
