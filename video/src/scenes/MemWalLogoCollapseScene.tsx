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

interface CollapseCardSpec {
  eyebrow: string;
  title: string;
  metric: string;
  accent: string;
  holdFrames: number;
  scale: number;
  tiltDeg: number;
}

const STACK_CARDS: CollapseCardSpec[] = [
  {
    eyebrow: "01 · LIVE RECALL VERDICT",
    title: "FAIL / STALE RULE → PASS · WALRUS RECALL",
    metric: "LIVE VERDICT",
    accent: PALETTE.categories.qaTesting,
    holdFrames: 18,
    scale: 1.0,
    tiltDeg: -2.0,
  },
  {
    eyebrow: "02 · TEAM SKILL GRAPH",
    title: "14 SKILL.md Files & Recalled Team Rules",
    metric: "MEMWAL-TEAM-SKILLS",
    accent: PALETTE.categories.coreHub,
    holdFrames: 15,
    scale: 0.86,
    tiltDeg: 1.8,
  },
  {
    eyebrow: "03 · WALRUS PROVENANCE",
    title: "Blob zjcqsfXK…aclk by @harrymove-ctrl",
    metric: "ON-CHAIN BLOB",
    accent: PALETTE.categories.rustRelayer,
    holdFrames: 12,
    scale: 0.72,
    tiltDeg: -1.5,
  },
  {
    eyebrow: "04 · ROLE-SCOPED MEMORY",
    title: "Verified Namespace & Delegate Signers",
    metric: "DELEGATE KEYS",
    accent: PALETTE.categories.designSystem,
    holdFrames: 9,
    scale: 0.58,
    tiltDeg: 1.2,
  },
  {
    eyebrow: "05 · ONE MCP CONFIG",
    title: "Claude Code, Cursor, Codex & Antigravity",
    metric: "4 CODING AGENTS",
    accent: PALETTE.categories.workflows,
    holdFrames: 6,
    scale: 0.44,
    tiltDeg: -0.8,
  },
];

const COLLAPSE_FRAME = STACK_CARDS.reduce((acc, c) => acc + c.holdFrames, 0); // 60f

const CATEGORY_CHIPS = [
  { label: "QA & Testing", color: PALETTE.categories.qaTesting },
  { label: "Workflows", color: PALETTE.categories.workflows },
  { label: "Rust & Relayer", color: PALETTE.categories.rustRelayer },
  { label: "Design System", color: PALETTE.categories.designSystem },
  { label: "Core & Hub", color: PALETTE.categories.coreHub },
];

/**
 * Scene 2 (6.0s–11.5s, 165f): `@snapcn/LogoCollapse` Brand Reveal
 * 5 real-product cards cut progressively smaller and faster until collapsing
 * into `MemWalMark` + `Walrus Memory` lockup on Sorbet studio paper.
 */
export const MemWalLogoCollapseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const isCollapsed = frame >= COLLAPSE_FRAME;

  let cardIdx = 0;
  if (!isCollapsed) {
    let acc = 0;
    for (let i = 0; i < STACK_CARDS.length; i++) {
      acc += STACK_CARDS[i].holdFrames;
      if (frame < acc) {
        cardIdx = i;
        break;
      }
    }
  }

  const postFrame = Math.max(0, frame - COLLAPSE_FRAME);

  const markPop = spring({
    frame: postFrame,
    fps,
    config: { damping: 16, stiffness: 220, mass: 0.75 },
  });

  const wordmarkSlide = spring({
    frame: Math.max(0, postFrame - 6),
    fps,
    config: { damping: 19, stiffness: 170, mass: 0.85 },
  });

  const subReveal = interpolate(postFrame, [16, 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const activeCard = STACK_CARDS[cardIdx];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: PALETTE.shaderCanvasLight,
        overflow: "hidden",
        fontFamily: PALETTE.fontSans,
      }}
    >
      <ChromaCurrentBackdrop mode="light" />

      {/* Phase 1 (frames 0..59): Accelerating, shrinking hard-cut card stack */}
      {!isCollapsed && activeCard && (
        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 780,
              padding: "36px 44px",
              borderRadius: 28,
              backgroundColor: PALETTE.card,
              border: `1.5px solid ${PALETTE.border}`,
              boxShadow:
                "0 28px 70px rgba(20, 20, 19, 0.12), 0 6px 20px rgba(20, 20, 19, 0.05)",
              transform: `scale(${activeCard.scale}) rotate(${activeCard.tiltDeg}deg)`,
              display: "flex",
              flexDirection: "column",
              gap: 18,
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
                  fontFamily: PALETTE.fontMono,
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  color: PALETTE.ink2,
                }}
              >
                {activeCard.eyebrow}
              </span>
              <span
                style={{
                  fontFamily: PALETTE.fontMono,
                  fontSize: 13,
                  fontWeight: 700,
                  padding: "5px 12px",
                  borderRadius: 999,
                  backgroundColor: `${activeCard.accent}18`,
                  color: activeCard.accent,
                  border: `1px solid ${activeCard.accent}45`,
                }}
              >
                {activeCard.metric}
              </span>
            </div>

            <div
              style={{
                fontSize: 34,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: PALETTE.ink,
                lineHeight: 1.15,
              }}
            >
              {activeCard.title}
            </div>

            <div
              style={{
                height: 6,
                borderRadius: 999,
                backgroundColor: PALETTE.fill,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${((cardIdx + 1) / STACK_CARDS.length) * 100}%`,
                  height: "100%",
                  backgroundColor: activeCard.accent,
                  borderRadius: 999,
                }}
              />
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* Phase 2 (frames 60..165): Mark collapses in + Wordmark & Category chips lock up */}
      {isCollapsed && (
        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 28,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 26,
                transform: `scale(${(0.86 + 0.14 * markPop).toFixed(4)})`,
              }}
            >
              <MemWalMark size={112} />

              <div
                style={{
                  overflow: "hidden",
                  maxWidth: Math.round(720 * wordmarkSlide),
                  opacity: wordmarkSlide,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    paddingRight: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 92,
                      fontWeight: 700,
                      letterSpacing: "-0.046em",
                      lineHeight: 0.98,
                      color: PALETTE.ink,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Walrus Memory
                  </span>
                  <span
                    style={{
                      marginTop: 10,
                      fontFamily: PALETTE.fontMono,
                      fontSize: 16,
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: PALETTE.mintDeep,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Shared Skill Graph & Eval Harness
                  </span>
                </div>
              </div>
            </div>

            {/* Real Category Pill Strip from `SkillsWorkspace.tsx` */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                opacity: subReveal,
                transform: `translateY(${((1 - subReveal) * 12).toFixed(2)}px)`,
              }}
            >
              {CATEGORY_CHIPS.map((chip) => (
                <div
                  key={chip.label}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 15px",
                    borderRadius: 999,
                    backgroundColor: PALETTE.card,
                    border: `1px solid ${PALETTE.border}`,
                    boxShadow: "0 2px 8px rgba(20, 20, 19, 0.04)",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      backgroundColor: chip.color,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: PALETTE.fontMono,
                      fontSize: 13,
                      fontWeight: 600,
                      color: PALETTE.ink2,
                    }}
                  >
                    {chip.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
