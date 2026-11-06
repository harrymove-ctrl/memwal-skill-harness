import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ChromaCurrentBackdrop } from "../components/backgrounds/ChromaCurrentBackdrop";
import { MemWalMark } from "../components/MemWalMark";
import { PALETTE } from "../palette";

const CMD = "npx @mysten-incubation/memwal-mcp";

const STDOUT_LINES = [
  {
    appearFrame: 52,
    badge: "NAMESPACE",
    badgeColor: PALETTE.categories.coreHub,
    text: "Connected memwal-team-skills · 14 SKILL.md files synced",
  },
  {
    appearFrame: 66,
    badge: "WALRUS",
    badgeColor: PALETTE.categories.rustRelayer,
    text: "Verified blob zjcqsfXK…aclk · @harrymove-ctrl",
  },
  {
    appearFrame: 80,
    badge: "VERDICT",
    badgeColor: PALETTE.categories.qaTesting,
    text: "PASS · WALRUS RECALL — ready across Claude, Cursor & Codex",
  },
];

/**
 * Scene 12 (73.5s–80.0s, 195f): `@snapcn/TerminalSimulator` + Sorbet Brand End Lockup
 * Enters cleanly across the 73.50s–74.00s breath so the Cmaj9 resolution at 74.00s (local f=15)
 * unveils the Sorbet studio terminal + final Walrus Memory CTA lockup!
 */
export const TerminalEndLockupScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const termEnter = spring({
    frame: Math.max(0, frame - 12),
    fps,
    config: { damping: 20, stiffness: 170, mass: 0.85 },
  });

  const typedCount = Math.round(
    interpolate(frame, [16, 46], [0, CMD.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const typedText = CMD.slice(0, typedCount);
  const showCaret = frame < 50 || Math.floor(frame / 15) % 2 === 0;

  const lockupEnter = spring({
    frame: Math.max(0, frame - 24),
    fps,
    config: { damping: 19, stiffness: 165, mass: 0.85 },
  });

  const ctaReveal = interpolate(frame, [38, 56], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: PALETTE.shaderCanvasLight,
        overflow: "hidden",
        fontFamily: PALETTE.fontSans,
      }}
    >
      <ChromaCurrentBackdrop mode="light" />

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          padding: "108px 192px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 36,
            width: "100%",
            maxWidth: 1240,
          }}
        >
          {/* `@snapcn/TerminalSimulator` — Clean Sorbet Studio Window */}
          <div
            style={{
              width: "100%",
              borderRadius: 24,
              backgroundColor: PALETTE.card,
              border: `1.5px solid ${PALETTE.border}`,
              boxShadow:
                "0 28px 75px rgba(20, 20, 19, 0.10), 0 4px 16px rgba(20, 20, 19, 0.04)",
              overflow: "hidden",
              opacity: termEnter,
              transform: `translateY(${((1 - termEnter) * 22).toFixed(2)}px)`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 22px",
                backgroundColor: PALETTE.paper,
                borderBottom: `1px solid ${PALETTE.border}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: 999,
                    backgroundColor: "#f87171",
                  }}
                />
                <span
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: 999,
                    backgroundColor: "#fbbf24",
                  }}
                />
                <span
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: 999,
                    backgroundColor: "#34d399",
                  }}
                />
              </div>
              <span
                style={{
                  fontFamily: PALETTE.fontMono,
                  fontSize: 13,
                  fontWeight: 600,
                  color: PALETTE.ink3,
                }}
              >
                memwal-mcp — zsh
              </span>
              <span
                style={{
                  fontFamily: PALETTE.fontMono,
                  fontSize: 12,
                  fontWeight: 600,
                  color: PALETTE.mintDeep,
                  backgroundColor: PALETTE.mintTint,
                  padding: "4px 10px",
                  borderRadius: 999,
                }}
              >
                WALRUS LIVE
              </span>
            </div>

            <div
              style={{
                padding: "26px 32px 30px",
                fontFamily: PALETTE.fontMono,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  fontSize: 22,
                  fontWeight: 600,
                  color: PALETTE.ink,
                }}
              >
                <span style={{ color: PALETTE.mint }}>❯</span>
                <span>
                  {typedText}
                  {showCaret && (
                    <span
                      style={{
                        display: "inline-block",
                        width: 10,
                        height: 24,
                        marginLeft: 3,
                        verticalAlign: "text-bottom",
                        backgroundColor: PALETTE.mint,
                      }}
                    />
                  )}
                </span>
              </div>

              {STDOUT_LINES.map((line) => {
                const visible = frame >= line.appearFrame;
                const p = spring({
                  frame: Math.max(0, frame - line.appearFrame),
                  fps,
                  config: { damping: 20, stiffness: 220, mass: 0.7 },
                });
                return (
                  <div
                    key={line.badge}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      opacity: visible ? p : 0,
                      transform: `translateY(${((1 - p) * 8).toFixed(2)}px)`,
                      fontSize: 17,
                      fontWeight: 500,
                      color: PALETTE.ink2,
                    }}
                  >
                    <span style={{ color: PALETTE.mint, fontWeight: 700 }}>
                      ✓
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "3px 9px",
                        borderRadius: 6,
                        backgroundColor: `${line.badgeColor}18`,
                        color: line.badgeColor,
                      }}
                    >
                      {line.badge}
                    </span>
                    <span>{line.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Final Brand Lockup + CTA (Held > 4.5s through f=2400!) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              padding: "26px 36px",
              borderRadius: 24,
              backgroundColor: "rgba(255, 255, 255, 0.94)",
              border: `1.5px solid ${PALETTE.border}`,
              boxShadow: "0 18px 50px rgba(20, 20, 19, 0.07)",
              opacity: lockupEnter,
              transform: `translateY(${((1 - lockupEnter) * 18).toFixed(2)}px)`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <MemWalMark size={72} />
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span
                  style={{
                    fontSize: 46,
                    fontWeight: 700,
                    letterSpacing: "-0.042em",
                    lineHeight: 1,
                    color: PALETTE.ink,
                  }}
                >
                  Walrus Memory
                </span>
                <span
                  style={{
                    fontFamily: PALETTE.fontMono,
                    fontSize: 15,
                    fontWeight: 600,
                    color: PALETTE.ink2,
                  }}
                >
                  Your team&apos;s skills, recalled by every agent.
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                opacity: ctaReveal,
              }}
            >
              <div
                style={{
                  padding: "13px 20px",
                  borderRadius: 999,
                  backgroundColor: PALETTE.fill,
                  border: `1px solid ${PALETTE.border}`,
                  fontFamily: PALETTE.fontMono,
                  fontSize: 15,
                  fontWeight: 600,
                  color: PALETTE.ink,
                }}
              >
                npx @mysten-incubation/memwal-mcp
              </div>
              <div
                style={{
                  padding: "13px 24px",
                  borderRadius: 999,
                  backgroundColor: PALETTE.primary,
                  fontFamily: PALETTE.fontMono,
                  fontSize: 15,
                  fontWeight: 600,
                  color: PALETTE.primaryFg,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    backgroundColor: PALETTE.mint,
                  }}
                />
                <span>docs.wal.app/walrus-memory</span>
              </div>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
