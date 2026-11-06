import React from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ChromaCurrentBackdrop } from "../components/backgrounds/ChromaCurrentBackdrop";
import { PALETTE } from "../palette";

const RUNTIMES = [
  {
    title: "Claude Code",
    tag: "mcpServers · stdio",
    accent: PALETTE.categories.qaTesting,
  },
  {
    title: "Cursor",
    tag: ".cursor/mcp.json",
    accent: PALETTE.categories.workflows,
  },
  {
    title: "Codex",
    tag: "codex config.toml",
    accent: PALETTE.categories.coreHub,
  },
  {
    title: "Antigravity",
    tag: "mcp_config.json",
    accent: PALETTE.categories.designSystem,
  },
];

/**
 * Scene 10 (60.0s–64.6s, 138f): `@snapcn/CheckCycle` Chapter 04 — One MCP Config
 */
export const ChapterCheckCycleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const leftEnter = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 180, mass: 0.8 },
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
          padding: "0 192px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            maxWidth: 1536,
            gap: 64,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 22,
              flex: 1,
              opacity: leftEnter,
              transform: `translateY(${((1 - leftEnter) * 20).toFixed(2)}px)`,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 9,
                padding: "7px 16px",
                borderRadius: 999,
                backgroundColor: PALETTE.card,
                border: `1px solid ${PALETTE.border}`,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: PALETTE.categories.workflows,
                }}
              />
              <span
                style={{
                  fontFamily: PALETTE.fontMono,
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  color: PALETTE.ink2,
                }}
              >
                CHAPTER 04 · CONNECT EVERY IDE
              </span>
            </div>

            <div
              style={{
                fontSize: 74,
                fontWeight: 700,
                letterSpacing: "-0.044em",
                lineHeight: 1.04,
                color: PALETTE.ink,
              }}
            >
              <div>One MCP config.</div>
              <div style={{ color: PALETTE.mintDeep }}>Every coding agent.</div>
            </div>

            <div
              style={{
                fontFamily: PALETTE.fontMono,
                fontSize: 16,
                fontWeight: 500,
                color: PALETTE.ink2,
              }}
            >
              npx @mysten-incubation/memwal-mcp
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              width: 600,
            }}
          >
            {RUNTIMES.map((rt, idx) => {
              const checkStart = 14 + idx * 18;
              const rowEnter = spring({
                frame: Math.max(0, frame - idx * 6),
                fps,
                config: { damping: 20, stiffness: 190, mass: 0.78 },
              });
              const checkPop = spring({
                frame: Math.max(0, frame - checkStart),
                fps,
                config: { damping: 14, stiffness: 250, mass: 0.65 },
              });
              const checked = frame >= checkStart;

              return (
                <div
                  key={rt.title}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "18px 24px",
                    borderRadius: 20,
                    backgroundColor: checked
                      ? PALETTE.card
                      : "rgba(255, 255, 255, 0.65)",
                    border: `1.5px solid ${checked ? `${PALETTE.mint}66` : PALETTE.border}`,
                    boxShadow: checked
                      ? "0 14px 34px rgba(20, 20, 19, 0.07)"
                      : "none",
                    opacity: rowEnter,
                    transform: `translate3d(${((1 - rowEnter) * 28).toFixed(2)}px, 0, 0)`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 999,
                        backgroundColor: checked ? PALETTE.mint : PALETTE.fill,
                        border: `1.5px solid ${checked ? PALETTE.mint : PALETTE.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transform: `scale(${checked ? (0.8 + 0.2 * checkPop).toFixed(3) : "1"})`,
                      }}
                    >
                      {checked && (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <path
                            d="M3.5 8.3L6.6 11.4L12.6 4.8"
                            stroke="#ffffff"
                            strokeWidth="2.3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>

                    <span
                      style={{
                        fontSize: 24,
                        fontWeight: 700,
                        letterSpacing: "-0.02em",
                        color: PALETTE.ink,
                      }}
                    >
                      {rt.title}
                    </span>
                  </div>

                  <span
                    style={{
                      fontFamily: PALETTE.fontMono,
                      fontSize: 13,
                      fontWeight: 600,
                      padding: "5px 12px",
                      borderRadius: 999,
                      backgroundColor: `${rt.accent}15`,
                      color: rt.accent,
                    }}
                  >
                    {rt.tag}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
