import type React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  BookOpenCheck,
  CheckCircle2,
  FlaskConical,
  GraduationCap,
  Plug,
  XCircle,
} from "lucide-react";
import { ChromaCurrentBackdrop } from "@/components/backgrounds/ChromaCurrentBackdrop";
import { WalrusLogo3DVideo } from "@/components/brand/WalrusBrandPrimitives";
import { SNAP_CN_UI } from "@/lib/brand-tokens";
import { textWidth } from "@/lib/fonts";

/**
 * App Reveal for the Skillbook.
 *
 * The mark holds the frame alone, shrinks into the header of a card that
 * builds around it, then the camera dives past the card, rolls, and backs off
 * into a settled front-on framing while the greeting types, the suggestion
 * chips land one at a time on the beat and the input bar arrives. A pointer
 * then runs the app's real trajectory eval for the memwal-review skill.
 *
 * Copy on the result cards comes from the app itself:
 * src/components/TrajectoryEvalHarness.tsx (verdict strings) and
 * src/data/flowMemoriesSeed.ts (the memwal-review team rule and its blob).
 *
 * Local frame 0 is the second drop of the score; beats every 15 frames.
 */

export const APP_REVEAL_FRAMES = 372;

const D = SNAP_CN_UI.dark;
const CARD = { x: 280, y: 150, w: 1360, h: 780, r: 30 };
const PAD = 56;

const HOLD_END = 34;
const FOLD_END = 64;
const CAM = [64, 90, 118, 150];
const GREET_AT = 72;
const GREETING = "What should your agents remember today?";
const CHIP_AT = 150;
const INPUT_AT = 205;
const CLICK_AT = 255;
const STEPS_AT = 259;
const COLD_AT = 270;
const PASS_AT = 285;

const CHIPS = [
  { label: "Recall memwal-review", Icon: BookOpenCheck },
  { label: "Teach a new flow", Icon: GraduationCap },
  { label: "Run trajectory eval", Icon: FlaskConical },
  { label: "Copy .mcp.json", Icon: Plug },
] as const;
const RUN_CHIP = 2;
const CHIP_FONT = 24;
const CHIP_H = 56;
const CHIP_GAP = 14;

const STEPS = ["Skill fetch", "Walrus recall", "Think trace", "A/B verdict"];

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const inOut = Easing.inOut(Easing.sin);

// The mark is laid out at its hero size and scaled into the header.
const HERO_LOGO = 132;
const HERO_FONT = 104;
const HERO_GAP = 30;
const HEADER_LOGO = 44;
const K = HEADER_LOGO / HERO_LOGO;

export const SceneAppReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ---- mark: hold, then fold into the header
  const heroW = HERO_LOGO + HERO_GAP + textWidth("Walrus Memory", HERO_FONT, 750, "Inter", -0.035);
  const fold = interpolate(frame, [HOLD_END, FOLD_END], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const breathe = interpolate(frame, [0, HOLD_END], [0.97, 1.0], { ...clamp, easing: ease });
  const markScale = interpolate(fold, [0, 1], [breathe, K]);
  const markX = interpolate(fold, [0, 1], [CARD.w / 2 - (heroW * breathe) / 2, 30]);
  const markCY = interpolate(fold, [0, 1], [CARD.h / 2, 46]);
  const markGlow = interpolate(fold, [0, 1], [1, 0]);

  // ---- card grows out of the mark's bounds
  const grow = fold;
  const from = { l: CARD.w / 2 - heroW / 2 - 40, t: CARD.h / 2 - 110, r: CARD.w / 2 - heroW / 2 - 40, b: CARD.h / 2 - 110 };
  const inset = {
    t: interpolate(grow, [0, 1], [from.t, 0]),
    r: interpolate(grow, [0, 1], [from.r, 0]),
    b: interpolate(grow, [0, 1], [from.b, 0]),
    l: interpolate(grow, [0, 1], [from.l, 0]),
  };
  const cardVisible = interpolate(frame, [HOLD_END + 4, HOLD_END + 12], [0, 1], clamp);
  const chrome = interpolate(frame, [FOLD_END - 6, FOLD_END + 8], [0, 1], clamp);

  // ---- camera: dive past, roll, back off, settle
  const s = interpolate(frame, CAM, [1, 2.25, 1.12, 1], { ...clamp, easing: inOut });
  const rz = interpolate(frame, CAM, [0, 8, -3, 0], { ...clamp, easing: inOut });
  const rx = interpolate(frame, CAM, [0, 16, 5, 0], { ...clamp, easing: inOut });
  const ry = interpolate(frame, CAM, [0, -22, 6, 0], { ...clamp, easing: inOut });
  const ty = interpolate(frame, CAM, [0, 90, 12, 0], { ...clamp, easing: inOut });
  const tx = interpolate(frame, CAM, [0, 160, -20, 0], { ...clamp, easing: inOut });

  // ---- greeting, chips, input
  const typed = Math.max(0, Math.min(GREETING.length, Math.floor((frame - GREET_AT) / 1.25) + 1));
  const greetCaret = frame >= GREET_AT && (typed < GREETING.length || Math.floor(frame / 9) % 2 === 0) && frame < CLICK_AT;

  const chipW = CHIPS.map((c) => 22 + 26 + 10 + textWidth(c.label, CHIP_FONT, 560) + 24);
  const chipX: number[] = [];
  chipW.reduce((x, w) => {
    chipX.push(x);
    return x + w + CHIP_GAP;
  }, PAD);
  const CHIP_Y = 222;

  const inputIn = spring({ frame: frame - INPUT_AT, fps, config: { damping: 18, stiffness: 150, mass: 0.85 } });

  // ---- pointer + run
  const runChipCX = CARD.x + chipX[RUN_CHIP] + chipW[RUN_CHIP] / 2;
  const runChipCY = CARD.y + CHIP_Y + CHIP_H / 2;
  const ptr = interpolate(frame, [CLICK_AT - 26, CLICK_AT - 3], [0, 1], { ...clamp, easing: ease });
  const ptrX = interpolate(ptr, [0, 1], [1700, runChipCX + 8]);
  const ptrY = interpolate(ptr, [0, 1], [1090, runChipCY + 6]);
  const ptrAway = interpolate(frame, [CLICK_AT + 10, CLICK_AT + 40], [0, 1], { ...clamp, easing: ease });
  const ptrScale = interpolate(frame, [CLICK_AT - 2, CLICK_AT, CLICK_AT + 6], [1, 0.84, 1], clamp);
  const ripple = interpolate(frame, [CLICK_AT, CLICK_AT + 18], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const ran = frame >= CLICK_AT;

  const cold = spring({ frame: frame - COLD_AT, fps, config: { damping: 17, stiffness: 160, mass: 0.8 } });
  const pass = spring({ frame: frame - PASS_AT, fps, config: { damping: 15, stiffness: 170, mass: 0.8 } });
  const passGlow = interpolate(frame, [PASS_AT, PASS_AT + 10, PASS_AT + 40], [0, 1, 0.45], clamp);

  const stageGlow = interpolate(frame, [0, 20], [0.6, 1], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: D.canvas, fontFamily: SNAP_CN_UI.fontFamily, overflow: "hidden" }}>
      <ChromaCurrentBackdrop mode="dark" intensity={1.0} />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 70% 62% at 50% 50%, rgba(8,12,11,0.45), rgba(8,12,11,0.85) 100%)",
          opacity: stageGlow,
        }}
      />

      <AbsoluteFill style={{ perspective: 1700, perspectiveOrigin: "50% 45%" }}>
        <div
          style={{
            position: "absolute",
            left: CARD.x,
            top: CARD.y,
            width: CARD.w,
            height: CARD.h,
            transformStyle: "preserve-3d",
            transformOrigin: "42% 30%",
            transform: `translate(${tx}px, ${ty}px) scale(${s}) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`,
          }}
        >
          {/* card surface, clipped out of the mark's bounds */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: CARD.r,
              background: "linear-gradient(180deg, #151c1a 0%, #0f1513 100%)",
              border: `1.5px solid ${D.border}`,
              boxShadow: "0 60px 140px rgba(0,0,0,0.6), 0 0 0 1px rgba(52,217,150,0.06), inset 0 1px 0 rgba(255,255,255,0.06)",
              clipPath: `inset(${inset.t}px ${inset.r}px ${inset.b}px ${inset.l}px round ${CARD.r}px)`,
              opacity: cardVisible,
            }}
          />

          {/* header chrome */}
          <div style={{ opacity: chrome }}>
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 92,
                height: 1,
                background: D.border,
              }}
            />
            <div
              style={{
                position: "absolute",
                right: 28,
                top: 22,
                display: "flex",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  height: 48,
                  padding: "0 20px",
                  borderRadius: 24,
                  display: "flex",
                  alignItems: "center",
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${D.border}`,
                  fontFamily: SNAP_CN_UI.monoFamily,
                  fontSize: 22,
                  fontWeight: 600,
                  color: D.textSecondary,
                }}
              >
                memwal-team-skills · 14 skills
              </div>
              <div
                style={{
                  height: 48,
                  padding: "0 20px",
                  borderRadius: 24,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: D.accentBg,
                  border: `1px solid ${D.borderStrong}`,
                  fontSize: 22,
                  fontWeight: 650,
                  color: "#6ee7b7",
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    background: D.accent,
                    boxShadow: `0 0 10px ${D.accent}`,
                  }}
                />
                MCP live
              </div>
            </div>
          </div>

          {/* the mark */}
          <div
            style={{
              position: "absolute",
              left: markX,
              top: markCY - HERO_LOGO / 2,
              height: HERO_LOGO,
              display: "flex",
              alignItems: "center",
              gap: HERO_GAP,
              transformOrigin: "0 50%",
              transform: `scale(${markScale})`,
              whiteSpace: "nowrap",
            }}
          >
            <div
              style={{
                width: HERO_LOGO,
                height: HERO_LOGO,
                borderRadius: 34,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(150deg, rgba(22,38,34,0.95), rgba(10,16,15,0.98))",
                border: "2px solid rgba(52,217,150,0.5)",
                boxShadow: `0 0 ${70 * markGlow}px rgba(52,217,150,${0.35 * markGlow})`,
              }}
            >
              <WalrusLogo3DVideo size={92} color="#34d996" glow={markGlow > 0.3} />
            </div>
            <span
              style={{
                fontSize: HERO_FONT,
                fontWeight: 750,
                letterSpacing: "-0.035em",
                color: D.textPrimary,
              }}
            >
              Walrus Memory
            </span>
          </div>

          {/* greeting */}
          {frame >= GREET_AT && (
            <div
              style={{
                position: "absolute",
                left: PAD,
                top: 128,
                fontSize: 50,
                fontWeight: 650,
                letterSpacing: "-0.03em",
                lineHeight: "68px",
                color: D.textPrimary,
                whiteSpace: "nowrap",
              }}
            >
              {GREETING.slice(0, typed)}
              <span
                style={{
                  display: "inline-block",
                  width: 4,
                  height: 52,
                  marginLeft: 4,
                  verticalAlign: "-0.14em",
                  borderRadius: 2,
                  background: D.accent,
                  opacity: greetCaret ? 1 : 0,
                }}
              />
            </div>
          )}

          {/* suggestion chips, one per beat */}
          {CHIPS.map(({ label, Icon }, i) => {
            const at = CHIP_AT + i * 15;
            const sp = spring({ frame: frame - at, fps, config: { damping: 15, stiffness: 210, mass: 0.7 } });
            if (frame < at) return null;
            const active = ran && i === RUN_CHIP;
            return (
              <div
                key={label}
                style={{
                  position: "absolute",
                  left: chipX[i],
                  top: CHIP_Y,
                  width: chipW[i],
                  height: CHIP_H,
                  borderRadius: CHIP_H / 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  paddingLeft: 22,
                  boxSizing: "border-box",
                  background: active ? "rgba(52,217,150,0.18)" : "rgba(255,255,255,0.05)",
                  border: `1.5px solid ${active ? "rgba(52,217,150,0.6)" : D.border}`,
                  color: active ? "#a7f3d0" : D.textSecondary,
                  fontSize: CHIP_FONT,
                  fontWeight: 560,
                  whiteSpace: "nowrap",
                  opacity: sp,
                  transform: `translateY(${(1 - sp) * 26}px) scale(${0.92 + 0.08 * sp})`,
                  boxShadow: active ? "0 0 30px rgba(52,217,150,0.25)" : "none",
                }}
              >
                <Icon size={26} strokeWidth={2.1} color={active ? D.accent : D.textMuted} />
                {label}
              </div>
            );
          })}

          {/* eval steps */}
          {frame >= STEPS_AT && (
            <div
              style={{
                position: "absolute",
                left: PAD,
                right: PAD,
                top: 310,
                height: 48,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span
                style={{
                  fontFamily: SNAP_CN_UI.monoFamily,
                  fontSize: 22,
                  fontWeight: 600,
                  color: D.textMuted,
                  marginRight: 6,
                  opacity: interpolate(frame, [STEPS_AT, STEPS_AT + 6], [0, 1], clamp),
                }}
              >
                [SKILL:memwal-review]
              </span>
              {STEPS.map((step, i) => {
                const at = STEPS_AT + 2 + i * 6;
                const on = interpolate(frame, [at, at + 6], [0, 1], clamp);
                return (
                  <div
                    key={step}
                    style={{
                      height: 44,
                      padding: "0 16px 0 12px",
                      borderRadius: 22,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "rgba(255,255,255,0.04)",
                      border: `1px solid ${D.border}`,
                      fontSize: 22,
                      fontWeight: 560,
                      color: D.textSecondary,
                      opacity: on,
                      transform: `translateX(${(1 - on) * -10}px)`,
                    }}
                  >
                    <CheckCircle2 size={22} color={D.accent} strokeWidth={2.3} />
                    {step}
                  </div>
                );
              })}
            </div>
          )}

          {/* A/B verdict */}
          {[
            {
              at: COLD_AT,
              sp: cold,
              tag: "STATIC SKILL",
              verdict: "FAIL / STALE RULE",
              tone: "#f87171",
              toneBg: "rgba(248,113,113,0.12)",
              toneRim: "rgba(248,113,113,0.45)",
              Icon: XCircle,
              body: "Follows only static memwal-review/SKILL.md instructions.",
              foot: "No team rules recalled",
            },
            {
              at: PASS_AT,
              sp: pass,
              tag: "WALRUS RECALL",
              verdict: "PASS · WALRUS RECALL",
              tone: D.accent,
              toneBg: D.accentBg,
              toneRim: "rgba(52,217,150,0.55)",
              Icon: CheckCircle2,
              body: "Staging is retired, so promote directly from dev to main.",
              foot: "blob zjcqsfXK…aclk · @harrymove-ctrl",
            },
          ].map((c, i) => {
            if (frame < c.at) return null;
            const w = (CARD.w - PAD * 2 - 24) / 2;
            return (
              <div
                key={c.tag}
                style={{
                  position: "absolute",
                  left: PAD + i * (w + 24),
                  top: 376,
                  width: w,
                  height: 214,
                  boxSizing: "border-box",
                  padding: "22px 26px",
                  borderRadius: 22,
                  background: i === 1 ? "rgba(52,217,150,0.07)" : "rgba(255,255,255,0.035)",
                  border: `1.5px solid ${i === 1 ? c.toneRim : D.border}`,
                  boxShadow: i === 1 ? `0 0 ${50 * passGlow}px rgba(52,217,150,${0.35 * passGlow})` : "none",
                  opacity: c.sp,
                  transform: `translateY(${(1 - c.sp) * 30}px)`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "0.06em", color: D.textMuted }}>
                    {c.tag}
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      height: 40,
                      padding: "0 16px",
                      borderRadius: 20,
                      background: c.toneBg,
                      border: `1px solid ${c.toneRim}`,
                      color: c.tone,
                      fontSize: 22,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <c.Icon size={22} strokeWidth={2.4} />
                    {c.verdict}
                  </span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 600, lineHeight: 1.3, color: D.textPrimary, letterSpacing: "-0.015em" }}>
                  {c.body}
                </div>
                <div style={{ fontFamily: SNAP_CN_UI.monoFamily, fontSize: 22, fontWeight: 500, whiteSpace: "nowrap", color: i === 1 ? "#6ee7b7" : D.textMuted }}>
                  {c.foot}
                </div>
              </div>
            );
          })}

          {/* input bar */}
          {frame >= INPUT_AT && (
            <div
              style={{
                position: "absolute",
                left: PAD,
                right: PAD,
                top: 644,
                height: 80,
                borderRadius: 26,
                boxSizing: "border-box",
                padding: "0 14px 0 28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(255,255,255,0.05)",
                border: `1.5px solid ${D.border}`,
                opacity: inputIn,
                transform: `translateY(${(1 - inputIn) * 60}px)`,
              }}
            >
              <span style={{ fontSize: 26, fontWeight: 500, color: D.textMuted }}>
                Ask your team's memory...
              </span>
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 27,
                  background: D.textPrimary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={D.canvas} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </AbsoluteFill>

      {/* pointer */}
      {frame >= CLICK_AT - 26 && (
        <>
          {frame >= CLICK_AT && ripple < 1 && (
            <div
              style={{
                position: "absolute",
                left: runChipCX + 8 - 40,
                top: runChipCY + 6 - 40,
                width: 80,
                height: 80,
                borderRadius: 40,
                border: `3px solid ${D.accent}`,
                transform: `scale(${0.3 + ripple * 1.4})`,
                opacity: 1 - ripple,
              }}
            />
          )}
          <svg
            width={46}
            height={46}
            viewBox="0 0 24 24"
            style={{
              position: "absolute",
              left: ptrX + ptrAway * 70 - 6,
              top: ptrY + ptrAway * 120 - 3,
              transform: `scale(${ptrScale})`,
              transformOrigin: "6px 3px",
              filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.45))",
              opacity: 1 - ptrAway,
            }}
          >
            <path
              d="M5 2.5 L19.5 13.2 L12.6 14.1 L16.4 21.2 L13.6 22.5 L9.9 15.4 L5 20.2 Z"
              fill="#f8fafc"
              stroke="#080c0b"
              strokeWidth={1.6}
              strokeLinejoin="round"
            />
          </svg>
        </>
      )}
    </AbsoluteFill>
  );
};

export default SceneAppReveal;
