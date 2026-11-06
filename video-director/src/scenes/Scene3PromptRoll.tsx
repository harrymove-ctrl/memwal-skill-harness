import type React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ChromaCurrentBackdrop } from "@/components/backgrounds/ChromaCurrentBackdrop";
import { WalrusBrandMark } from "@/components/brand/WalrusBrandMark";
import { BRAND_UI } from "@/lib/brand-tokens";
import { inter, mono, textWidth } from "@/lib/fonts";

/**
 * Act 3 (f330..f555, 225 frames = 7.5s):
 * Measured Prompt Roll composer choreography on Sorbet ChromaCurrent:
 * - Card pushes in while "Give every agent your team's" types
 * - Hard cut closer (1.52x) on beat (local f42)
 * - Dynamic spring-width tinted capability pill rolls across 4 real capabilities
 * - Sentence finishes " on Walrus."
 * - Camera whips with directional motion blur to self-drawing send circle
 * - Pointer presses into dual emerald halo rings, arrow pulls free & flies off
 *   as frame washes cleanly to #ffffff
 */
export const PROMPT_ROLL_DURATION = 225;

const LINE_1 = "Give every agent your team's";
const LINE_2_TAIL = " on Walrus.";

const ROLL = [
  { word: "Tatum wallet checks", ink: "#0369a1", bg: "#e0f2fe", rim: "#7dd3fc" },
  { word: "PR review rules", ink: "#b45309", bg: "#fef3c7", rim: "#fcd34d" },
  { word: "Sui Move guardrails", ink: "#6d28d9", bg: "#ede9fe", rim: "#c4b5fd" },
  { word: "SKILL.md flow graph", ink: "#047857", bg: "#d1fae5", rim: "#6ee7b7" },
] as const;

const TYPE_1_AT = 5;
const FPC = 1.18;
const CUT_AT = 42;
const STEP = 28;
const ROLL_LEN = 10;
const FINAL_AT = CUT_AT + STEP * (ROLL.length - 1); // 126
const TAIL_AT = FINAL_AT + 4; // 130
const WHIP_AT = 158;
const WHIP_END = 170;
const DRAW_AT = 162;
const PRESS_AT = 195;
const FLY_AT = 199;
const WASH_AT = 205;

export const PROMPT_ROLL_CUES = {
  cutAt: CUT_AT,
  rollSteps: [CUT_AT + STEP, CUT_AT + STEP * 2, CUT_AT + STEP * 3],
  whipAt: WHIP_AT,
  pressAt: PRESS_AT,
  flyAt: FLY_AT,
} as const;

const CARD = { x: 320, y: 340, w: 1280, h: 400, r: 40 };
const PAD = 60;
const FONT = 54;
const LINE_H = 76;
const PILL_FONT = 50;
const PILL_H = 68;
const PILL_PAD = 22;
const SEND = {
  cx: CARD.x + CARD.w - PAD - 40,
  cy: CARD.y + CARD.h - PAD - 40,
  r: 40,
};

const EASE = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

function camera(frame: number) {
  if (frame < CUT_AT) {
    return {
      cx: 960,
      cy: 540,
      s: interpolate(frame, [0, 24, CUT_AT], [0.78, 1.0, 1.06], {
        ...CLAMP,
        easing: EASE,
      }),
    };
  }
  const close = {
    cx: 785,
    cy: 520,
    s: interpolate(frame, [CUT_AT, WHIP_AT], [1.46, 1.56], CLAMP),
  };
  if (frame < WHIP_AT) return close;
  const t = interpolate(frame, [WHIP_AT, WHIP_END], [0, 1], {
    ...CLAMP,
    easing: Easing.inOut(Easing.cubic),
  });
  const s = interpolate(
    frame,
    [WHIP_END, PROMPT_ROLL_DURATION],
    [2.08, 2.2],
    CLAMP,
  );
  return {
    cx: interpolate(t, [0, 1], [close.cx, SEND.cx]),
    cy: interpolate(t, [0, 1], [close.cy, SEND.cy]),
    s: t < 1 ? interpolate(t, [0, 1], [1.56, 2.08]) : s,
  };
}

const Pointer: React.FC<{
  x: number;
  y: number;
  scale: number;
  opacity: number;
}> = ({ x, y, scale, opacity }) => (
  <svg
    width={46}
    height={46}
    viewBox="0 0 24 24"
    style={{
      position: "absolute",
      left: x - 6,
      top: y - 3,
      transform: `scale(${scale})`,
      transformOrigin: "6px 3px",
      opacity,
      filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.25))",
    }}
  >
    <path
      d="M5 2.5 L19.5 13.2 L12.6 14.1 L16.4 21.2 L13.6 22.5 L9.9 15.4 L5 20.2 Z"
      fill="#141413"
      stroke="#ffffff"
      strokeWidth={1.6}
      strokeLinejoin="round"
    />
  </svg>
);

export const Scene3PromptRoll: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ink = BRAND_UI.light.textPrimary;

  const typed1 = Math.max(
    0,
    Math.min(LINE_1.length, Math.floor((frame - TYPE_1_AT) / FPC) + 1),
  );
  const typedTail =
    frame < TAIL_AT
      ? 0
      : Math.min(
          LINE_2_TAIL.length,
          Math.floor((frame - TAIL_AT) / FPC) + 1,
        );
  const typingLine1 = frame < CUT_AT;
  const caretOn =
    (typingLine1 && typed1 < LINE_1.length) ||
    (frame >= TAIL_AT && typedTail < LINE_2_TAIL.length) ||
    Math.floor(frame / 8) % 2 === 0;

  let idx = 0;
  for (let i = 1; i < ROLL.length; i++) {
    const land = CUT_AT + i * STEP;
    idx += interpolate(frame, [land - ROLL_LEN, land], [0, 1], {
      ...CLAMP,
      easing: Easing.bezier(0.32, 0.72, 0, 1),
    });
  }
  const lo = Math.floor(idx);
  const hi = Math.min(ROLL.length - 1, lo + 1);
  const frac = idx - lo;
  const widthOf = (i: number) =>
    textWidth(ROLL[i].word, PILL_FONT, 650, inter.fontFamily, -0.02) +
    PILL_PAD * 2;
  const pillOpen = spring({
    frame: frame - CUT_AT,
    fps,
    config: { damping: 16, stiffness: 190, mass: 0.7 },
  });
  const pillW =
    (widthOf(lo) + (widthOf(hi) - widthOf(lo)) * frac) * pillOpen;
  const pillInk = interpolateColors(
    frac,
    [0, 1],
    [ROLL[lo].ink, ROLL[hi].ink],
  );
  const pillBg = interpolateColors(frac, [0, 1], [ROLL[lo].bg, ROLL[hi].bg]);
  const pillRim = interpolateColors(
    frac,
    [0, 1],
    [ROLL[lo].rim, ROLL[hi].rim],
  );

  const landPop =
    frame >= CUT_AT
      ? 1 +
        0.048 *
          Math.max(
            ...ROLL.map((_, i) => {
              const land = CUT_AT + i * STEP;
              return interpolate(
                frame,
                [land, land + 3, land + 10],
                [0, 1, 0],
                CLAMP,
              );
            }),
          )
      : 1;

  const cam = camera(frame);
  const prev = camera(Math.max(0, frame - 1));
  const speed = Math.hypot(cam.cx - prev.cx, cam.cy - prev.cy) * cam.s;
  const blur =
    frame >= WHIP_AT && frame <= WHIP_END + 1
      ? Math.min(7, speed * 0.05)
      : 0;
  const enter = interpolate(frame, [0, 8], [0, 1], CLAMP);

  const drawT = interpolate(frame, [DRAW_AT, DRAW_AT + 14], [0, 1], {
    ...CLAMP,
    easing: EASE,
  });
  const fillT = interpolate(frame, [DRAW_AT + 11, DRAW_AT + 19], [0, 1], CLAMP);
  const arrowIn = spring({
    frame: frame - (DRAW_AT + 14),
    fps,
    config: { damping: 14, stiffness: 220, mass: 0.6 },
  });
  const pressScale = interpolate(
    frame,
    [PRESS_AT, PRESS_AT + 3, PRESS_AT + 11],
    [1, 0.86, 1],
    CLAMP,
  );
  const circ = 2 * Math.PI * (SEND.r - 2);

  const ptrIn = interpolate(frame, [WHIP_END + 2, PRESS_AT - 4], [0, 1], {
    ...CLAMP,
    easing: EASE,
  });
  const ptrX = interpolate(ptrIn, [0, 1], [1580, 972]);
  const ptrY = interpolate(ptrIn, [0, 1], [1060, 552]);
  const ptrDrift = interpolate(frame, [PRESS_AT + 6, WASH_AT + 14], [0, 1], {
    ...CLAMP,
    easing: EASE,
  });
  const ptrScale = interpolate(
    frame,
    [PRESS_AT - 2, PRESS_AT, PRESS_AT + 6],
    [1, 0.84, 1],
    CLAMP,
  );
  const ptrOpacity = interpolate(
    frame,
    [WHIP_END + 2, WHIP_END + 6],
    [0, 1],
    CLAMP,
  );

  const fly = interpolate(frame, [FLY_AT, FLY_AT + 20], [0, 1], {
    ...CLAMP,
    easing: Easing.in(Easing.cubic),
  });
  const wash = interpolate(
    frame,
    [WASH_AT, PROMPT_ROLL_DURATION - 2],
    [0, 1],
    {
      ...CLAMP,
      easing: Easing.in(Easing.quad),
    },
  );
  const sendScreen = 2 * SEND.r * cam.s;
  const line2Y = CARD.y + PAD + LINE_H;

  const caret = (
    <span
      style={{
        display: "inline-block",
        width: 4,
        height: FONT * 1.08,
        marginLeft: 4,
        borderRadius: 2,
        background: "#059669",
        verticalAlign: "-0.16em",
        opacity: caretOn ? 1 : 0,
      }}
    />
  );

  return (
    <AbsoluteFill
      style={{ backgroundColor: BRAND_UI.light.canvas, overflow: "hidden" }}
    >
      <ChromaCurrentBackdrop mode="light" intensity={0.85} />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 50% 50%, rgba(245,246,241,0.76), rgba(245,246,241,0.22) 80%)",
        }}
      />

      <AbsoluteFill
        style={{
          opacity: enter,
          filter: blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : undefined,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1920,
            height: 1080,
            transformOrigin: "0 0",
            transform: `translate(960px, 540px) scale(${cam.s}) translate(${-cam.cx}px, ${-cam.cy}px)`,
          }}
        >
          {/* Soft emerald/sky studio aura behind card */}
          <div
            style={{
              position: "absolute",
              left: CARD.x - 220,
              top: CARD.y - 200,
              width: CARD.w + 440,
              height: CARD.h + 400,
              borderRadius: "50%",
              background:
                "radial-gradient(closest-side, rgba(16,185,129,0.26), rgba(56,189,248,0.12) 55%, transparent)",
              filter: "blur(10px)",
            }}
          />

          {/* Outer glass rim */}
          <div
            style={{
              position: "absolute",
              left: CARD.x - 10,
              top: CARD.y - 10,
              width: CARD.w + 20,
              height: CARD.h + 20,
              borderRadius: CARD.r + 10,
              background: "rgba(255,255,255,0.58)",
              border: "1px solid rgba(20,20,19,0.06)",
              boxShadow:
                "0 40px 90px rgba(6,78,59,0.14), 0 12px 30px rgba(20,20,19,0.06)",
            }}
          />

          {/* Writing surface */}
          <div
            style={{
              position: "absolute",
              left: CARD.x,
              top: CARD.y,
              width: CARD.w,
              height: CARD.h,
              borderRadius: CARD.r,
              background: "#ffffff",
              border: "1px solid rgba(20,20,19,0.08)",
              fontFamily: inter.fontFamily,
              color: ink,
            }}
          />

          {/* Line 1 */}
          <div
            style={{
              position: "absolute",
              left: CARD.x + PAD,
              top: CARD.y + PAD,
              height: LINE_H,
              fontFamily: inter.fontFamily,
              fontSize: FONT,
              fontWeight: 600,
              letterSpacing: "-0.025em",
              lineHeight: `${LINE_H}px`,
              color: ink,
              whiteSpace: "nowrap",
            }}
          >
            {LINE_1.slice(0, typed1)}
            {typingLine1 && caret}
          </div>

          {/* Line 2: Rolling capability pill + tail */}
          {frame >= CUT_AT && (
            <div
              style={{
                position: "absolute",
                left: CARD.x + PAD - 6,
                top: line2Y,
                height: LINE_H,
                display: "flex",
                alignItems: "center",
                fontFamily: inter.fontFamily,
                fontSize: FONT,
                fontWeight: 600,
                letterSpacing: "-0.025em",
                color: ink,
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  position: "relative",
                  display: "inline-block",
                  width: pillW,
                  height: PILL_H,
                  borderRadius: 18,
                  background: pillBg,
                  border: `2px solid ${pillRim}`,
                  overflow: "hidden",
                  transform: `scale(${landPop})`,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 0,
                    transform: `translateY(${-idx * PILL_H}px)`,
                  }}
                >
                  {ROLL.map((r, i) => (
                    <span
                      key={r.word}
                      style={{
                        display: "block",
                        height: PILL_H,
                        lineHeight: `${PILL_H - 4}px`,
                        textAlign: "center",
                        fontSize: PILL_FONT,
                        fontWeight: 650,
                        letterSpacing: "-0.02em",
                        color: pillInk,
                        opacity: interpolate(
                          Math.abs(i - idx),
                          [0, 0.8],
                          [1, 0],
                          CLAMP,
                        ),
                      }}
                    >
                      {r.word}
                    </span>
                  ))}
                </span>
              </span>
              <span>{LINE_2_TAIL.slice(0, typedTail)}</span>
              {frame < WHIP_AT + 4 && caret}
            </div>
          )}

          {/* Bottom-left composer tools + MemWal x Tatum namespace chip */}
          <div
            style={{
              position: "absolute",
              left: CARD.x + PAD - 6,
              top: SEND.cy - 30,
              display: "flex",
              gap: 14,
            }}
          >
            {[
              "M12 6v12M6 12h12",
              "M12 4.5a2.5 2.5 0 0 0-2.5 2.5v4.5a2.5 2.5 0 0 0 5 0V7A2.5 2.5 0 0 0 12 4.5zM7 11a5 5 0 0 0 10 0M12 16v3",
            ].map((d) => (
              <div
                key={d}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  border: "1.5px solid rgba(20,20,19,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width={28}
                  height={28}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#52525b"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                >
                  <path d={d} />
                </svg>
              </div>
            ))}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "0 20px 0 12px",
                height: 60,
                borderRadius: 30,
                background: "rgba(16,185,129,0.10)",
                border: "1.5px solid rgba(5,150,105,0.28)",
                fontFamily: mono.fontFamily,
                fontSize: 21,
                fontWeight: 600,
                color: "#065f46",
              }}
            >
              <WalrusBrandMark size={34} color="#34d996" darkTile glow={false} />
              memwal-team-skills · Tatum MCP
            </div>
          </div>

          {/* Self-drawing circular send button + press halos */}
          <div
            style={{
              position: "absolute",
              left: SEND.cx - SEND.r,
              top: SEND.cy - SEND.r,
              width: SEND.r * 2,
              height: SEND.r * 2,
              transform: `scale(${pressScale})`,
            }}
          >
            {[0, 6].map((delay) => {
              const h = interpolate(
                frame,
                [PRESS_AT + delay, PRESS_AT + delay + 22],
                [0, 1],
                {
                  ...CLAMP,
                  easing: Easing.out(Easing.cubic),
                },
              );
              return frame >= PRESS_AT + delay ? (
                <div
                  key={delay}
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    border: `${delay ? 2 : 3}px solid #10b981`,
                    transform: `scale(${1 + h * (delay ? 2.2 : 1.7)})`,
                    opacity: (1 - h) * 0.85,
                    boxShadow: "0 0 24px rgba(16,185,129,0.45)",
                  }}
                />
              ) : null;
            })}
            <svg
              width={SEND.r * 2}
              height={SEND.r * 2}
              style={{ position: "absolute", inset: 0 }}
            >
              <circle
                cx={SEND.r}
                cy={SEND.r}
                r={SEND.r - 2}
                fill={interpolateColors(
                  fillT,
                  [0, 1],
                  ["rgba(20,20,19,0)", "#141413"],
                )}
                stroke="#141413"
                strokeWidth={3}
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - drawT)}
                transform={`rotate(-90 ${SEND.r} ${SEND.r})`}
              />
            </svg>
            {frame < FLY_AT && (
              <svg
                width={SEND.r * 2}
                height={SEND.r * 2}
                viewBox="0 0 24 24"
                style={{
                  position: "absolute",
                  inset: 0,
                  transform: `scale(${0.5 * arrowIn})`,
                }}
                fill="none"
                stroke="#ffffff"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" />
              </svg>
            )}
          </div>
        </div>
      </AbsoluteFill>

      {/* Arrow pulls free and flies upward in screen space */}
      {frame >= FLY_AT && (
        <svg
          width={sendScreen}
          height={sendScreen}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            position: "absolute",
            left: 960 - sendScreen / 2,
            top: 540 - sendScreen / 2,
            transform: `translate(${fly * 140}px, ${-fly * 820}px) scale(${0.5 + fly * 0.35})`,
            filter: `drop-shadow(0 0 ${8 + fly * 20}px rgba(16,185,129,0.7)) ${
              fly > 0.2 ? `blur(${(fly * 3).toFixed(1)}px)` : ""
            }`,
            opacity: 1 - fly * 0.2,
          }}
        >
          <path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" />
        </svg>
      )}

      {frame > WHIP_END && (
        <Pointer
          x={ptrX + ptrDrift * 40}
          y={ptrY + ptrDrift * 50}
          scale={ptrScale}
          opacity={ptrOpacity * (1 - wash)}
        />
      )}

      <AbsoluteFill style={{ backgroundColor: "#ffffff", opacity: wash }} />
    </AbsoluteFill>
  );
};
