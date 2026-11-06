import type React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SNAP_CN_UI } from "@/lib/brand-tokens";
import { textWidth } from "@/lib/fonts";

/**
 * Real app footage on a moving camera (the Nimbus board, "Footage camera"):
 * a window of the recorded take, a camera keyed in take time, a slow creep so
 * no hold reads as a freeze, a tilt that relaxes to flat whenever a callout
 * opens, and two-line callouts ringed on the real element.
 *
 * Take coordinates are px of the 1920 x 1080 recording; take time is seconds.
 */

const TAKE_W = 1920;
const TAKE_H = 1080;
const PERSPECTIVE = 1200;
const CREEP = 1.04;

export type Box = { x: number; y: number; w: number; h: number };
/** A camera key: at take time `t`, zoom `zoom` on the take point (u, v) in 0..1. */
export type CamKey = { t: number; zoom: number; u: number; v: number };
export type CalloutSide = "above" | "below" | "left" | "right" | "inside-bottom";
export type CalloutSpec = {
  /** Shot frames the callout is open. */
  from: number;
  to: number;
  box: Box;
  what: string;
  why: string;
  side: CalloutSide;
  /** Optional card top-left in take px (projected with the camera); overrides `side`. */
  card?: { x: number; y: number };
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const inOut = Easing.inOut(Easing.cubic);

function cameraAt(t: number, keys: CamKey[]) {
  if (t <= keys[0].t) return keys[0];
  const last = keys[keys.length - 1];
  if (t >= last.t) return last;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (t >= a.t && t <= b.t) {
      const k = interpolate(t, [a.t, b.t], [0, 1], { ...clamp, easing: inOut });
      return { t, zoom: a.zoom + (b.zoom - a.zoom) * k, u: a.u + (b.u - a.u) * k, v: a.v + (b.v - a.v) * k };
    }
  }
  return last;
}
const clampFocus = (f: number, zoom: number) => Math.min(1 - 0.5 / zoom, Math.max(0.5 / zoom, f));

function tiltLevel(frame: number, callouts: CalloutSpec[]) {
  let flat = 0;
  for (const c of callouts) {
    const on = interpolate(frame, [c.from - 22, c.from], [0, 1], { ...clamp, easing: inOut });
    const off = interpolate(frame, [c.to, c.to + 40], [1, 0], { ...clamp, easing: inOut });
    flat = Math.max(flat, Math.min(on, off));
  }
  return 1 - flat;
}

const CARD = { pad: 24, gap: 20, what: 36, why: 28 };

function Callout({ spec, box, cardAt }: { spec: CalloutSpec; box: Box; cardAt?: { x: number; y: number } }) {
  const frame = useCurrentFrame();
  const local = frame - spec.from;
  if (frame < spec.from || frame > spec.to + 12) return null;
  const ringIn = interpolate(local, [0, 12], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const cardIn = interpolate(local, [6, 18], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const out = interpolate(frame, [spec.to, spec.to + 10], [1, 0], clamp);

  const r = { x: box.x - 10, y: box.y - 10, w: box.w + 20, h: box.h + 20 };
  const per = 2 * (r.w + r.h);
  const w =
    Math.max(textWidth(spec.what, CARD.what, 650), textWidth(spec.why, CARD.why, 500)) + CARD.pad * 2 + 22;
  const h = CARD.pad * 2 + 46 + 38;
  let x = r.x + r.w / 2 - w / 2;
  let y = r.y - CARD.gap - h;
  if (spec.side === "below") y = r.y + r.h + CARD.gap;
  if (spec.side === "right") {
    x = r.x + r.w + CARD.gap;
    y = r.y + r.h / 2 - h / 2;
  }
  if (spec.side === "left") {
    x = r.x - CARD.gap - w;
    y = r.y + r.h / 2 - h / 2;
  }
  if (spec.side === "inside-bottom") {
    x = r.x + 28;
    y = r.y + r.h - h - 28;
  }
  if (cardAt) {
    x = cardAt.x;
    y = cardAt.y;
  }
  x = Math.min(1920 - 56 - w, Math.max(56, x));
  y = Math.min(1080 - 56 - h, Math.max(56, y));
  const dy = spec.side === "above" ? 14 : spec.side === "below" ? -14 : 0;
  const dx = spec.side === "right" ? -14 : spec.side === "left" ? 14 : 0;

  return (
    <AbsoluteFill style={{ opacity: out, pointerEvents: "none" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <rect
          x={r.x}
          y={r.y}
          width={r.w}
          height={r.h}
          rx={14}
          fill="none"
          stroke="#10b981"
          strokeWidth={3}
          strokeDasharray={per}
          strokeDashoffset={per * (1 - ringIn)}
          style={{ filter: "drop-shadow(0 0 10px rgba(16,185,129,0.45))" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: w,
          boxSizing: "border-box",
          padding: CARD.pad,
          paddingLeft: CARD.pad + 22,
          borderRadius: 18,
          background: "rgba(255,255,255,0.97)",
          border: "1px solid rgba(20,20,19,0.10)",
          boxShadow: "0 24px 60px rgba(6,78,59,0.18), 0 6px 18px rgba(20,20,19,0.08)",
          fontFamily: SNAP_CN_UI.fontFamily,
          opacity: cardIn,
          transform: `translate(${(1 - cardIn) * dx}px, ${(1 - cardIn) * dy}px)`,
        }}
      >
        <span
          style={{
            position: "absolute",
            left: CARD.pad,
            top: CARD.pad + 18,
            width: 10,
            height: 10,
            borderRadius: 5,
            background: "#10b981",
            boxShadow: "0 0 10px rgba(16,185,129,0.6)",
          }}
        />
        <div style={{ fontSize: CARD.what, fontWeight: 650, color: "#141413", letterSpacing: "-0.02em", lineHeight: "46px", whiteSpace: "nowrap" }}>
          {spec.what}
        </div>
        <div style={{ fontSize: CARD.why, fontWeight: 500, color: "#52525b", letterSpacing: "-0.01em", lineHeight: "38px", whiteSpace: "nowrap" }}>
          {spec.why}
        </div>
      </div>
    </AbsoluteFill>
  );
}

export const Footage: React.FC<{
  /** Take time (s) at the first frame of the shot. */
  from: number;
  /** Footage speed (1 = real time). */
  rate: number;
  frames: number;
  camera: CamKey[];
  callouts?: CalloutSpec[];
  /** Yaw of the tilted camera in degrees; 0 is flat. */
  tilt?: number;
  /** Frames to fade in from white (out of the Prompt Roll wash). */
  fromWhite?: number;
}> = ({ from, rate, frames, camera, callouts = [], tilt = 9, fromWhite = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = from + (frame / fps) * rate;
  const cam = cameraAt(t, camera);
  const z = cam.zoom * interpolate(frame, [0, frames], [1, CREEP], clamp);
  const u = clampFocus(cam.u, z);
  const v = clampFocus(cam.v, z);

  const level = tilt === 0 ? 0 : tiltLevel(frame, callouts);
  const yaw = (tilt + interpolate(frame, [0, frames], [-0.6, 0.6], clamp)) * level;
  const pitch = 0.3 * yaw;
  const tiltScale = 1 + 0.07 * level;

  const project = (b: Box): Box => ({
    x: (b.x - u * TAKE_W) * z + 960,
    y: (b.y - v * TAKE_H) * z + 540,
    w: b.w * z,
    h: b.h * z,
  });
  const white = fromWhite > 0 ? interpolate(frame, [0, fromWhite], [1, 0], { ...clamp, easing: Easing.out(Easing.quad) }) : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#f5f6f1", overflow: "hidden" }}>
      <AbsoluteFill style={{ perspective: PERSPECTIVE }}>
        <AbsoluteFill
          style={{
            transform: level < 0.01 ? undefined : `scale(${tiltScale}) rotateX(${pitch}deg) rotateY(${yaw}deg)`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: TAKE_W,
              height: TAKE_H,
              transformOrigin: "0 0",
              transform: `translate(960px, 540px) scale(${z}) translate(${-u * TAKE_W}px, ${-v * TAKE_H}px)`,
            }}
          >
            <OffthreadVideo
              src={staticFile("take/take.mp4")}
              trimBefore={Math.round(from * fps)}
              playbackRate={rate}
              muted
              style={{ width: TAKE_W, height: TAKE_H }}
            />
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
      {callouts.map((c) => (
        <Callout
          key={`${c.from}-${c.what}`}
          spec={c}
          box={project(c.box)}
          cardAt={c.card ? project({ x: c.card.x, y: c.card.y, w: 0, h: 0 }) : undefined}
        />
      ))}
      {white > 0 && <AbsoluteFill style={{ backgroundColor: "#ffffff", opacity: white }} />}
    </AbsoluteFill>
  );
};
