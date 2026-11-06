import type React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile } from "remotion";
import { PROMPT_ROLL_FRAMES, ScenePromptRoll } from "./scenes/ScenePromptRoll";
import { SceneEndLight } from "./scenes/SceneEndLight";
import { Footage, type CalloutSpec, type CamKey } from "./take/Footage";

/**
 * Walrus Memory promo, real-app cut. 42.0 s @ 30 fps (1260 frames), 120 BPM (beat = 15 f).
 *
 *   f0     Prompt Roll (kept from v2): the sentence types, the pill rolls, send, wash to white
 *   f253   DROP A. Demo: Run Live Recall, the recalled team rule
 *   f553   Without vs With MemWal, the real result cards
 *   f793   DROP B. Skills: memwal-review and its team rule, then the skill graph
 *   f1003  Connect: the same config in every coding agent
 *   f1153  End card, final chord
 *
 * Footage is public/take/take.mp4, recorded from the running app by scripts/record-take.mjs
 * (secrets and internal tracker ids are masked on screen at record time).
 */
export const REAL_FRAMES = 1260;

type Shot = {
  at: number;
  frames: number;
  from: number;
  rate: number;
  camera: CamKey[];
  callouts?: CalloutSpec[];
  tilt?: number;
  fromWhite?: number;
};

export const SHOTS: Record<"recall" | "compare" | "skills" | "connect", Shot> = {
  recall: {
    at: PROMPT_ROLL_FRAMES,
    frames: 300,
    from: 5.0,
    rate: 1.04,
    fromWhite: 14,
    camera: [
      { t: 5.0, zoom: 1.2, u: 0.37, v: 0.24 },
      { t: 7.3, zoom: 1.22, u: 0.4, v: 0.26 },
      { t: 8.6, zoom: 1.6, u: 0.69, v: 0.47 },
      { t: 9.7, zoom: 1.55, u: 0.66, v: 0.5 },
      { t: 10.9, zoom: 1.28, u: 0.5, v: 0.62 },
      { t: 13.9, zoom: 1.3, u: 0.5, v: 0.62 },
      { t: 15.4, zoom: 1.06, u: 0.5, v: 0.45 },
    ],
    callouts: [
      {
        from: 180,
        to: 252,
        box: { x: 223, y: 740, w: 1474, h: 98 },
        what: "Team rule recalled",
        why: "Written once by a teammate, kept on Walrus",
        side: "below",
      },
    ],
  },
  compare: {
    at: PROMPT_ROLL_FRAMES + 300,
    frames: 240,
    from: 15.4,
    rate: 0.85,
    tilt: 7,
    camera: [
      { t: 15.4, zoom: 1.06, u: 0.5, v: 0.43 },
      { t: 20.6, zoom: 1.08, u: 0.5, v: 0.42 },
      { t: 22.2, zoom: 1.14, u: 0.5, v: 0.55 },
    ],
    callouts: [
      {
        from: 14,
        to: 92,
        box: { x: 222, y: 160, w: 704, h: 46 },
        what: "Without memory",
        why: "Approves a PR for a retired app",
        side: "below",
        card: { x: 250, y: 384 },
      },
      {
        from: 100,
        to: 178,
        box: { x: 1000, y: 160, w: 712, h: 46 },
        what: "With Walrus Memory",
        why: "Closes it as not planned",
        side: "below",
        card: { x: 1030, y: 420 },
      },
    ],
  },
  skills: {
    at: PROMPT_ROLL_FRAMES + 540,
    frames: 210,
    from: 29.0,
    rate: 1.13,
    camera: [
      { t: 29.0, zoom: 1.16, u: 0.56, v: 0.36 },
      { t: 33.6, zoom: 1.2, u: 0.58, v: 0.36 },
      { t: 35.7, zoom: 1.1, u: 0.55, v: 0.55 },
      { t: 37.0, zoom: 1.16, u: 0.52, v: 0.6 },
    ],
    callouts: [
      {
        from: 22,
        to: 138,
        box: { x: 578, y: 348, w: 1022, h: 60 },
        what: "Team rules live with the skill",
        why: "Change one, and every agent follows it",
        side: "below",
      },
    ],
  },
  connect: {
    at: PROMPT_ROLL_FRAMES + 750,
    frames: 150,
    from: 44.6,
    rate: 1.12,
    camera: [
      { t: 44.6, zoom: 1.22, u: 0.5, v: 0.42 },
      { t: 50.2, zoom: 1.28, u: 0.5, v: 0.44 },
    ],
    callouts: [
      {
        from: 32,
        to: 132,
        box: { x: 555, y: 367, w: 511, h: 56 },
        what: "Every coding agent",
        why: "One MCP config, the same team memory",
        side: "right",
      },
    ],
  },
};

export const END_AT = SHOTS.connect.at + SHOTS.connect.frames; // 1153

/** A take time inside a shot, as an absolute frame of the promo. */
const atTake = (s: Shot, t: number) => Math.round(s.at + ((t - s.from) / s.rate) * 30);

type Cue = { at: number; src: string; vol: number; len?: number };
function cues(): Cue[] {
  const c: Cue[] = [];
  const add = (at: number, src: string, vol: number, len = 60) => c.push({ at, src, vol, len });
  // Prompt roll (local frames from the scene)
  const typing = (text: string, at: number) =>
    [...text].flatMap((ch, i) => (ch === " " || i % 2 ? [] : [at + Math.floor(i * 1.25)]));
  typing("Give every agent your team's", 6).forEach((f) => add(f, "key-tick", 0.22, 6));
  add(43, "pop", 0.45, 8);
  [73, 103, 133, 163].forEach((f) => add(f, "wheel-tick", 0.5, 10));
  typing(" on Walrus.", 166).forEach((f) => add(f, "key-tick", 0.22, 6));
  add(186, "whip", 0.55, 12);
  add(192, "sky-breeze", 0.25, 45);
  add(223, "press-halo", 0.7, 36);
  add(227, "whoosh", 0.45, 18);

  // Real clicks in the take (the click lands just before each beat mark)
  add(atTake(SHOTS.recall, 8.9), "click-crisp", 0.62, 10);
  add(atTake(SHOTS.recall, 10.95), "bloom-reveal", 0.32, 50);
  add(atTake(SHOTS.compare, 20.65), "whoosh", 0.2, 18);
  add(atTake(SHOTS.skills, 35.3), "click-crisp", 0.55, 10);
  for (const t of [45.42, 47.53, 49.81]) add(atTake(SHOTS.connect, t), "click-crisp", 0.5, 10);

  // Callouts open with a soft pop
  for (const s of Object.values(SHOTS)) for (const k of s.callouts ?? []) add(s.at + k.from, "pop", 0.3, 8);

  add(END_AT + 2, "sky-breeze", 0.32, 48);
  return c;
}
const CUES = cues();

export const WalrusPromoReal: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#f5f6f1" }}>
    <Sequence durationInFrames={PROMPT_ROLL_FRAMES}>
      <ScenePromptRoll />
    </Sequence>
    {Object.entries(SHOTS).map(([name, s]) => (
      <Sequence key={name} from={s.at} durationInFrames={s.frames}>
        <Footage
          from={s.from}
          rate={s.rate}
          frames={s.frames}
          camera={s.camera}
          callouts={s.callouts}
          tilt={s.tilt}
          fromWhite={s.fromWhite}
        />
      </Sequence>
    ))}
    <Sequence from={END_AT} durationInFrames={REAL_FRAMES - END_AT}>
      <SceneEndLight />
    </Sequence>

    <Audio
      src={staticFile("audio/score-real.wav")}
      volume={(f) =>
        interpolate(f, [0, 12, REAL_FRAMES - 10, REAL_FRAMES], [0, 0.6, 0.6, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      }
    />
    {CUES.map((cue, i) => (
      <Sequence key={`${cue.src}-${cue.at}-${i}`} from={cue.at} durationInFrames={cue.len ?? 60}>
        <Audio src={staticFile(`audio/${cue.src}.wav`)} volume={cue.vol} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
