import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";

const { fontFamily: GEIST } = loadGeist("normal", { weights: ["400", "500", "600"], subsets: ["latin"] });

/**
 * The 15 second loop: one white ball carries the whole product idea through one world.
 * Turn a rule on, it reaches every agent, agents recall it, an agent asks, you teach it, the rule is saved.
 * Everything is computed from time. Nothing carries state between frames, so any frame renders alone.
 */
export const LOOP_SECONDS = 15;

const INK = "#f4f6f5";
const INK2 = "#a7b0ad";
const BG = "#0b0f0e";
const SURFACE = "#18201e";
const RAISED = "#222b29";
const LINE = "rgba(255,255,255,.1)";
const ACCENT = "#34d399";
const ON_ACCENT = "#04140d";

/* ---------- time helpers ---------- */
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const ramp = (t: number, a: number, b: number) => smooth(clamp((t - a) / (b - a)));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** A closed form spring: rises to 1 with one small overshoot. */
const spring = (t: number, at: number, rate = 11, overshoot = 0.09) => {
  const u = t - at;
  if (u <= 0) return 0;
  return 1 - Math.exp(-rate * u) * Math.cos(rate * 0.9 * u) * (1 - overshoot) - overshoot * Math.exp(-rate * 0.5 * u) * 0;
};
/** Squash on contact: a short dip that recovers. */
const squash = (t: number, at: number) => {
  const u = t - at;
  if (u < 0 || u > 0.22) return 0;
  return Math.sin((u / 0.22) * Math.PI) * Math.exp(-u * 7);
};

/* ---------- the world ---------- */
const SWITCH = { x: 760, y: 540, w: 236, h: 124 };
const KNOB_R = 50;
const switchOff = { x: SWITCH.x - SWITCH.w / 2 + 62, y: SWITCH.y };
const switchOn = { x: SWITCH.x + SWITCH.w / 2 - 62, y: SWITCH.y };

const SLIDER = { x: 1700, y: 240, w: 980, h: 16 };
const KNOB_Y = SLIDER.y - 8 - 34;

const CARDS = { x: 2980, y: 620, w: 760, h: 150, gap: 22 };
const cardY = (i: number) => CARDS.y + i * (CARDS.h + CARDS.gap);
const REPLY = { x: CARDS.x + 540, y: cardY(2) + 90, w: 140, h: 46 };

const FIELD = { x: 2980, y: 1130, w: 760, h: 84 };

const KB = { x: 2860, y: 1250, key: 88, gap: 10 };
const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
const keyPos = (ch: string) => {
  if (ch === "space") return { x: KB.x + 500, y: KB.y + 3 * (KB.key + KB.gap) + KB.key / 2, w: 480 };
  if (ch === "return") return { x: KB.x + 9.2 * (KB.key + KB.gap) + 30, y: KB.y + 3 * (KB.key + KB.gap) + KB.key / 2, w: 170 };
  for (let r = 0; r < ROWS.length; r += 1) {
    const i = ROWS[r]!.indexOf(ch);
    if (i >= 0) return { x: KB.x + (r * 0.5 * (KB.key + KB.gap)) + i * (KB.key + KB.gap) + KB.key / 2, y: KB.y + r * (KB.key + KB.gap) + KB.key / 2, w: KB.key };
  }
  throw new Error(`No key for ${ch}`);
};

const REPLY_TEXT = "drop mutexes";
const KEY_START = 7.1;
const KEY_STEP = 0.235;
const STROKES = REPLY_TEXT.split("").map((c, i) => ({ ch: c === " " ? "space" : c, at: KEY_START + i * KEY_STEP }));
const RETURN_AT = KEY_START + STROKES.length * KEY_STEP + 0.1;

/* ---------- the ball: one route, no teleports ---------- */
type P = { x: number; y: number };
const arc = (a: P, b: P, u: number, height: number): P => ({
  x: lerp(a.x, b.x, u),
  y: lerp(a.y, b.y, u) - Math.sin(u * Math.PI) * height,
});

const BOUNCES: { at: number; p: P; height: number }[] = [
  { at: 2.0, p: { x: SLIDER.x, y: KNOB_Y }, height: 320 },
  { at: 4.0, p: { x: SLIDER.x + SLIDER.w, y: KNOB_Y }, height: 0 },
  { at: 4.5, p: { x: CARDS.x + 80, y: cardY(0) - KNOB_R * 0.5 }, height: 220 },
  { at: 5.0, p: { x: CARDS.x + 340, y: cardY(1) + 8 }, height: 120 },
  { at: 5.5, p: { x: CARDS.x + 200, y: cardY(2) + 8 }, height: 120 },
  { at: 6.0, p: { x: REPLY.x + REPLY.w / 2, y: REPLY.y - 2 }, height: 110 },
];

function ballAt(t: number): P {
  if (t < 1.08) return t < 1.0 ? switchOff : { x: lerp(switchOff.x, switchOn.x, spring(t, 1.0, 30)), y: switchOn.y };
  let prev: { at: number; p: P } = { at: 1.08, p: switchOn };
  for (const b of BOUNCES) {
    if (t <= b.at) {
      const u = (t - prev.at) / (b.at - prev.at);
      if (b.height === 0) return { x: lerp(prev.p.x, b.p.x, ramp(t, prev.at, b.at)), y: b.p.y };
      return arc(prev.p, b.p, u, b.height);
    }
    prev = b;
  }
  // From the Reply pill onto the keys, then one hop per key.
  const strokes = [{ at: 6.0, p: prev.p }, ...STROKES.map((s) => ({ at: s.at, p: { x: keyPos(s.ch).x, y: keyPos(s.ch).y - 24 } })), { at: RETURN_AT, p: { x: keyPos("return").x, y: keyPos("return").y - 24 } }];
  for (let i = 1; i < strokes.length; i += 1) {
    if (t <= strokes[i]!.at) {
      const a = strokes[i - 1]!;
      const b = strokes[i]!;
      const u = (t - a.at) / (b.at - a.at);
      return arc(a.p, b.p, u, i === 1 ? 180 : 58);
    }
  }
  // Up to the sent message, then the long way home across the whole world.
  const msg: P = { x: FIELD.x + FIELD.w - 390, y: FIELD.y + 42 };
  const lift = RETURN_AT + 0.9;
  if (t <= lift) return arc(strokes[strokes.length - 1]!.p, msg, clamp((t - RETURN_AT) / 0.9), 140);
  if (t <= 12.5) return { x: msg.x, y: msg.y + Math.sin((t - lift) * 3.2) * 6 };
  if (t <= 14.0) {
    const u = ramp(t, 12.5, 14.0);
    return arc(msg, switchOff, u, 620);
  }
  return switchOff;
}

/* ---------- the camera: one transform, position and log zoom ---------- */
type Shot = { at: number; x: number; y: number; z: number };
const SHOTS: Shot[] = [
  { at: 0, x: 760, y: 540, z: 2.0 },
  { at: 1.1, x: 760, y: 540, z: 2.0 },
  { at: 2.0, x: 1760, y: 300, z: 1.28 },
  { at: 3.7, x: 2190, y: 300, z: 1.28 },
  { at: 4.5, x: 3320, y: 760, z: 1.3 },
  { at: 6.0, x: 3360, y: 900, z: 1.3 },
  { at: 7.0, x: 3360, y: 1320, z: 1.0 },
  { at: RETURN_AT + 0.2, x: 3360, y: 1320, z: 1.0 },
  { at: 11.0, x: 3360, y: 1160, z: 1.05 },
  { at: 12.4, x: 2190, y: 940, z: 0.5 },
  { at: 13.6, x: 2020, y: 860, z: 0.54 },
  { at: 14.6, x: 760, y: 540, z: 2.0 },
  { at: 15, x: 760, y: 540, z: 2.0 },
];
function cameraAt(t: number) {
  for (let i = 1; i < SHOTS.length; i += 1) {
    const a = SHOTS[i - 1]!;
    const b = SHOTS[i]!;
    if (t <= b.at) {
      const u = ramp(t, a.at, b.at);
      return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), u)) };
    }
  }
  return SHOTS[SHOTS.length - 1]!;
}

/* ---------- pieces ---------- */
const Text: React.FC<{ size: number; color?: string; weight?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ size, color = INK, weight = 500, style, children }) => (
  <span style={{ fontFamily: GEIST, fontSize: size, color, fontWeight: weight, whiteSpace: "nowrap", letterSpacing: "-0.01em", ...style }}>{children}</span>
);

const Box: React.FC<{ x: number; y: number; w: number; h: number; radius?: number; color?: string; border?: string; style?: React.CSSProperties; children?: React.ReactNode }> = ({ x, y, w, h, radius = 16, color = SURFACE, border = LINE, style, children }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: radius, background: color, boxShadow: `inset 0 0 0 1px ${border}`, ...style }}>{children}</div>
);

const NOTES = [
  { at: 4.5, title: "Claude Code", line: "Recalled 2 rules for rust-async-patterns", time: "now" },
  { at: 5.0, title: "Cursor", line: "Recalled 2 rules for ui-ux-qa", time: "now" },
  { at: 5.5, title: "Codex", line: "Holding lock across await?", time: "now" },
];

export const SkillbookLoopScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (frame / fps) % LOOP_SECONDS;

  const cam = cameraAt(t);
  const ball = ballAt(t);

  /* Switch: on from the click until the ball has left, off again as the film returns to its first frame. */
  const switchOnAmount = ramp(t, 1.0, 1.16) * (1 - ramp(t, 13.7, 13.98));
  const fill = t < 2.0 ? 0 : t <= 4.0 ? clamp((ball.x - SLIDER.x) / SLIDER.w) : 1 - ramp(t, 13.2, 13.9);
  const value = Math.round(fill * 100);
  const knobX = t < 2.0 ? SLIDER.x : SLIDER.x + fill * SLIDER.w;

  const typed = STROKES.filter((s) => t >= s.at).length;
  const pressed = (key: string) => {
    const hit = key === "return" ? [RETURN_AT] : STROKES.filter((s) => s.ch === key).map((s) => s.at);
    return hit.some((at) => t >= at && t < at + 0.14);
  };

  const open = ramp(t, 6.0, 6.45) * (1 - ramp(t, 13.3, 13.9));
  const keyboardUp = spring(t, 6.5, 9) * (1 - ramp(t, 13.3, 13.9));
  const sent = ramp(t, RETURN_AT, RETURN_AT + 0.35);
  const sendOn = typed === REPLY_TEXT.length ? 1 : 0;
  const clear = 1 - ramp(t, 13.2, 13.8);

  /* Ball shape: squash on every contact, along the contact normal. */
  const contacts = [1.0, ...BOUNCES.map((b) => b.at), ...STROKES.map((s) => s.at), RETURN_AT, 14.0];
  const hit = Math.max(...contacts.map((at) => squash(t, at)));
  const ballR = t < 1.08 || t > 14.0 ? KNOB_R : lerp(KNOB_R, 28, ramp(t, 1.08, 1.5)) + (t > 13.4 ? lerp(0, KNOB_R - 28, ramp(t, 13.4, 14.0)) : 0);

  /* Cursor: arrives, clicks, leaves, and sits exactly where it started by the last frame. */
  const toSwitch = ramp(t, 0.2, 0.9) - ramp(t, 1.15, 1.7);
  const cursor = { x: lerp(SWITCH.x + 300, SWITCH.x + 30, toSwitch), y: lerp(SWITCH.y + 190, SWITCH.y + 18, toSwitch) };
  const click = squash(t, 1.0);

  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 960,
          top: 540,
          width: 0,
          height: 0,
          transform: `scale(${cam.z}) translate(${-cam.x}px, ${-cam.y}px)`,
        }}
      >
        {/* A faint dot grid across the whole world. */}
        <div
          style={{
            position: "absolute",
            left: -2000,
            top: -2000,
            width: 8000,
            height: 6000,
            backgroundImage: "radial-gradient(rgba(255,255,255,.075) 1.6px, transparent 1.7px)",
            backgroundSize: "44px 44px",
          }}
        />

        {/* Toggle */}
        <Text size={30} color={INK2} style={{ position: "absolute", left: SWITCH.x - 240, top: SWITCH.y - 150, width: 480, textAlign: "center", display: "block", whiteSpace: "normal" }}>
          Drop Mutex guards before await
        </Text>
        <div
          style={{
            position: "absolute",
            left: SWITCH.x - SWITCH.w / 2,
            top: SWITCH.y - SWITCH.h / 2,
            width: SWITCH.w,
            height: SWITCH.h,
            borderRadius: SWITCH.h / 2,
            background: switchOnAmount > 0.5 ? ACCENT : RAISED,
            boxShadow: `inset 0 0 0 1px ${LINE}`,
            transform: `scale(${1 - click * 0.05})`,
          }}
        />

        {/* Slider */}
        <Text size={30} color={INK2} style={{ position: "absolute", left: SLIDER.x, top: SLIDER.y - 170 }}>
          Team agents following the rule
        </Text>
        <div style={{ position: "absolute", left: SLIDER.x, top: SLIDER.y, width: SLIDER.w, height: SLIDER.h, borderRadius: 99, background: RAISED }} />
        <div style={{ position: "absolute", left: SLIDER.x, top: SLIDER.y, width: fill * SLIDER.w, height: SLIDER.h, borderRadius: 99, background: ACCENT }} />
        <div style={{ position: "absolute", left: knobX - 58, top: KNOB_Y - 108, width: 116, height: 58, borderRadius: 14, background: RAISED, boxShadow: `inset 0 0 0 1px ${LINE}`, display: "grid", placeItems: "center", opacity: ramp(t, 1.7, 2.0) }}>
          <Text size={30} weight={600} style={{ fontVariantNumeric: "tabular-nums" }}>{value}%</Text>
        </div>

        {/* Notifications */}
        {NOTES.map((note, i) => {
          const pop = spring(t, note.at - 0.14, 12);
          const y = cardY(i) + (1 - pop) * 70;
          return (
            <Box key={note.title} x={CARDS.x} y={y} w={CARDS.w} h={CARDS.h} radius={26} style={{ opacity: clamp(pop * 1.4), transform: `scale(${0.96 + 0.04 * pop})` }}>
              <Text size={34} weight={600} style={{ position: "absolute", left: 34, top: 28 }}>{note.title}</Text>
              <Text size={26} color={INK2} style={{ position: "absolute", right: 34, top: 34 }}>{note.time}</Text>
              <Text size={29} color={INK2} style={{ position: "absolute", left: 34, top: 86 }}>{note.line}</Text>
            </Box>
          );
        })}

        {/* Reply pill stretches into the field. */}
        {(() => {
          const w = lerp(REPLY.w, FIELD.w, open);
          const h = lerp(REPLY.h, FIELD.h, open);
          const x = lerp(REPLY.x, FIELD.x, open);
          const y = lerp(REPLY.y, FIELD.y, open);
          const shown = REPLY_TEXT.slice(0, typed);
          const visible = spring(t, 5.5 - 0.14, 12);
          return (
            <Box x={x} y={y} w={w} h={h} radius={h / 2} color={RAISED} style={{ opacity: clamp(visible * 1.4) * (1 - sent), overflow: "hidden" }}>
              {open < 0.25 ? (
                <Text size={24} style={{ position: "absolute", left: 0, right: 0, top: 9, textAlign: "center", display: "block" }}>Reply</Text>
              ) : (
                <>
                  <Text size={34} style={{ position: "absolute", left: 34, top: 21 }}>{shown}</Text>
                  {shown.length === 0 && <Text size={34} color={INK2} style={{ position: "absolute", left: 34, top: 21 }}>Teach a rule</Text>}
                  <div style={{ position: "absolute", right: 12, top: 12, width: 60, height: 60, borderRadius: 30, background: sendOn ? ACCENT : SURFACE, display: "grid", placeItems: "center" }}>
                    <Text size={32} weight={600} color={sendOn ? ON_ACCENT : INK2}>↑</Text>
                  </div>
                </>
              )}
            </Box>
          );
        })()}

        {/* The reply contracts into a small sent message. */}
        {sent > 0 && clear > 0 && (
          <div style={{ position: "absolute", left: lerp(FIELD.x, FIELD.x + FIELD.w - 330, sent), top: lerp(FIELD.y, FIELD.y + 5, sent), width: lerp(FIELD.w, 330, sent), height: lerp(FIELD.h, 74, sent), borderRadius: 37, background: ACCENT, display: "grid", placeItems: "center", opacity: clear }}>
            <Text size={32} weight={600} color={ON_ACCENT}>{REPLY_TEXT}</Text>
          </div>
        )}

        {/* Keyboard rises as part of the same scene. */}
        <div style={{ position: "absolute", left: 0, top: 0, transform: `translateY(${(1 - keyboardUp) * 760}px)`, opacity: clamp(keyboardUp * 2) }}>
          {ROWS.map((row, r) =>
            row.split("").map((ch) => {
              const p = keyPos(ch);
              const down = pressed(ch);
              return (
                <Box key={ch} x={p.x - KB.key / 2} y={p.y - KB.key / 2 + (down ? 4 : 0)} w={KB.key} h={KB.key} radius={16} color={down ? ACCENT : SURFACE}>
                  <Text size={34} color={down ? ON_ACCENT : INK} style={{ position: "absolute", left: 0, right: 0, top: 22, textAlign: "center", display: "block" }}>{ch}</Text>
                </Box>
              );
            }),
          )}
          {(["space", "return"] as const).map((k) => {
            const p = keyPos(k);
            const down = pressed(k);
            return (
              <Box key={k} x={p.x - p.w / 2} y={p.y - KB.key / 2 + (down ? 4 : 0)} w={p.w} h={KB.key} radius={16} color={down ? ACCENT : k === "return" && sendOn ? ACCENT : SURFACE}>
                <Text size={30} color={down || (k === "return" && sendOn) ? ON_ACCENT : INK2} style={{ position: "absolute", left: 0, right: 0, top: 24, textAlign: "center", display: "block" }}>{k}</Text>
              </Box>
            );
          })}
        </div>

        {/* The ball. */}
        <div
          style={{
            position: "absolute",
            left: ball.x - ballR,
            top: ball.y - ballR,
            width: ballR * 2,
            height: ballR * 2,
            borderRadius: "50%",
            background: "#fff",
            transform: `scale(${1 + hit * 0.16}, ${1 - hit * 0.2})`,
            boxShadow: "0 10px 26px rgba(0,0,0,.45)",
          }}
        />

        {/* The cursor. */}
        <svg
          width={64}
          height={78}
          viewBox="0 0 24 30"
          style={{ position: "absolute", left: cursor.x, top: cursor.y, transform: `scale(${1 - click * 0.14})`, filter: "drop-shadow(0 6px 10px rgba(0,0,0,.5))" }}
        >
          <path d="M2 2 L2 23 L8 18 L12 27 L16 25 L12 17 L20 17 Z" fill="#fff" stroke="#0b0f0e" strokeWidth={1.4} strokeLinejoin="round" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};
