import type React from "react";
import {
  AbsoluteFill,
  Easing,
  OffthreadVideo,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BRAND_UI } from "@/lib/brand-tokens";
import { inter, textWidth } from "@/lib/fonts";

const TAKE_W = 1920;
const TAKE_H = 1080;
const PERSPECTIVE = 1350;
const CREEP = 1.038;

export type Box = { x: number; y: number; w: number; h: number };
export type CamKey = { t: number; zoom: number; u: number; v: number };
export type CalloutSide = "above" | "below" | "left" | "right";

export interface CalloutSpec {
  from: number;
  to: number;
  box: Box;
  what: string;
  why: string;
  side: CalloutSide;
  /** Optional explicit screen-space position (x, y) so the card never occludes key content. */
  screenPos?: { x: number; y: number };
}

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const IN_OUT = Easing.inOut(Easing.cubic);

function cameraAt(t: number, keys: CamKey[]): CamKey {
  if (t <= keys[0].t) return keys[0];
  const last = keys[keys.length - 1];
  if (t >= last.t) return last;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (t >= a.t && t <= b.t) {
      const k = interpolate(t, [a.t, b.t], [0, 1], { ...CLAMP, easing: IN_OUT });
      return {
        t,
        zoom: a.zoom + (b.zoom - a.zoom) * k,
        u: a.u + (b.u - a.u) * k,
        v: a.v + (b.v - a.v) * k,
      };
    }
  }
  return last;
}

const clampFocus = (f: number, zoom: number): number =>
  Math.min(1 - 0.5 / zoom, Math.max(0.5 / zoom, f));

function tiltLevel(frame: number, callouts: CalloutSpec[]): number {
  let flat = 0;
  for (const c of callouts) {
    const on = interpolate(frame, [c.from - 18, c.from], [0, 1], {
      ...CLAMP,
      easing: IN_OUT,
    });
    const off = interpolate(frame, [c.to, c.to + 28], [1, 0], {
      ...CLAMP,
      easing: IN_OUT,
    });
    flat = Math.max(flat, Math.min(on, off));
  }
  return 1 - flat;
}

const CARD_STYLE = { pad: 18, gap: 20, whatSize: 30, whySize: 22 };

const CalloutOverlay: React.FC<{
  spec: CalloutSpec;
  box: Box;
  darkTheme: boolean;
}> = ({ spec, box, darkTheme }) => {
  const frame = useCurrentFrame();
  const local = frame - spec.from;
  if (frame < spec.from || frame > spec.to + 10) return null;

  const ringIn = interpolate(local, [0, 12], [0, 1], {
    ...CLAMP,
    easing: Easing.out(Easing.cubic),
  });
  const cardIn = interpolate(local, [5, 16], [0, 1], {
    ...CLAMP,
    easing: Easing.out(Easing.cubic),
  });
  const fadeOut = interpolate(frame, [spec.to, spec.to + 10], [1, 0], CLAMP);

  const r = {
    x: box.x - 10,
    y: box.y - 10,
    w: box.w + 20,
    h: box.h + 20,
  };
  const perimeter = 2 * (r.w + r.h);

  const w =
    Math.max(
      textWidth(spec.what, CARD_STYLE.whatSize, 700, inter.fontFamily, -0.02),
      textWidth(spec.why, CARD_STYLE.whySize, 500, inter.fontFamily, -0.01),
    ) +
    CARD_STYLE.pad * 2 +
    26;
  const h = CARD_STYLE.pad * 2 + 36 + 30;

  let x = r.x + r.w / 2 - w / 2;
  let y = r.y - CARD_STYLE.gap - h;
  if (spec.side === "below") y = r.y + r.h + CARD_STYLE.gap;
  if (spec.side === "right") {
    x = r.x + r.w + CARD_STYLE.gap;
    y = r.y + r.h / 2 - h / 2;
  }
  if (spec.side === "left") {
    x = r.x - CARD_STYLE.gap - w;
    y = r.y + r.h / 2 - h / 2;
  }
  if (spec.screenPos) {
    x = spec.screenPos.x;
    y = spec.screenPos.y;
  }
  // Keep strictly inside frame safe margins
  x = Math.min(1920 - 24 - w, Math.max(24, x));
  y = Math.min(1080 - 24 - h, Math.max(48, y));

  const dy = spec.side === "above" ? 12 : spec.side === "below" ? -12 : 0;
  const dx = spec.side === "right" ? -12 : spec.side === "left" ? 12 : 0;

  return (
    <AbsoluteFill style={{ opacity: fadeOut, pointerEvents: "none" }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <rect
          x={r.x}
          y={r.y}
          width={r.w}
          height={r.h}
          rx={16}
          fill="none"
          stroke={darkTheme ? "#34d996" : "#10b981"}
          strokeWidth={3}
          strokeDasharray={perimeter}
          strokeDashoffset={perimeter * (1 - ringIn)}
          style={{
            filter: "drop-shadow(0 0 12px rgba(16, 185, 129, 0.5))",
          }}
        />
      </svg>

      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: w,
          boxSizing: "border-box",
          padding: CARD_STYLE.pad,
          paddingLeft: CARD_STYLE.pad + 22,
          borderRadius: 18,
          background: darkTheme
            ? "rgba(12, 20, 18, 0.95)"
            : "rgba(255, 255, 255, 0.97)",
          border: darkTheme
            ? "1.5px solid rgba(52, 217, 150, 0.45)"
            : "1.5px solid rgba(16, 185, 129, 0.30)",
          boxShadow: darkTheme
            ? "0 24px 60px rgba(0, 0, 0, 0.65), 0 0 26px rgba(52, 217, 150, 0.16)"
            : "0 20px 52px rgba(6, 78, 59, 0.18), 0 6px 18px rgba(20, 20, 19, 0.08)",
          fontFamily: inter.fontFamily,
          opacity: cardIn,
          transform: `translate(${(1 - cardIn) * dx}px, ${(1 - cardIn) * dy}px)`,
          backdropFilter: "blur(14px)",
        }}
      >
        <span
          style={{
            position: "absolute",
            left: CARD_STYLE.pad,
            top: CARD_STYLE.pad + 13,
            width: 10,
            height: 10,
            borderRadius: 5,
            background: darkTheme ? "#34d996" : "#10b981",
            boxShadow: "0 0 10px rgba(52, 217, 150, 0.7)",
          }}
        />
        <div
          style={{
            fontSize: CARD_STYLE.whatSize,
            fontWeight: 700,
            color: darkTheme ? "#f8fafc" : BRAND_UI.light.textPrimary,
            letterSpacing: "-0.022em",
            lineHeight: "36px",
            whiteSpace: "nowrap",
          }}
        >
          {spec.what}
        </div>
        <div
          style={{
            fontSize: CARD_STYLE.whySize,
            fontWeight: 500,
            color: darkTheme ? "#a7f3d0" : "#4b5563",
            letterSpacing: "-0.01em",
            lineHeight: "30px",
            whiteSpace: "nowrap",
          }}
        >
          {spec.why}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const LiveAppFootage: React.FC<{
  src: string;
  from: number;
  rate: number;
  frames: number;
  camera: CamKey[];
  callouts?: CalloutSpec[];
  tilt?: number;
  darkTheme?: boolean;
  fadeInFrames?: number;
}> = ({
  src,
  from,
  rate,
  frames,
  camera,
  callouts = [],
  tilt = 8,
  darkTheme = false,
  fadeInFrames = 8,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = from + (frame / fps) * rate;
  const cam = cameraAt(t, camera);
  const z = cam.zoom * interpolate(frame, [0, frames], [1, CREEP], CLAMP);
  const u = clampFocus(cam.u, z);
  const v = clampFocus(cam.v, z);

  const level = tilt === 0 ? 0 : tiltLevel(frame, callouts);
  const yaw = (tilt + interpolate(frame, [0, frames], [-0.5, 0.5], CLAMP)) * level;
  const pitch = 0.28 * Math.abs(yaw);
  const tiltScale = 1 + 0.065 * level;

  const project = (b: Box): Box => ({
    x: (b.x - u * TAKE_W) * z + 960,
    y: (b.y - v * TAKE_H) * z + 540,
    w: b.w * z,
    h: b.h * z,
  });

  const enterOpacity =
    fadeInFrames > 0
      ? interpolate(frame, [0, fadeInFrames], [0, 1], CLAMP)
      : 1;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: darkTheme ? "#080c0b" : "#f5f6f1",
        overflow: "hidden",
        opacity: enterOpacity,
      }}
    >
      <AbsoluteFill style={{ perspective: PERSPECTIVE }}>
        <AbsoluteFill
          style={{
            transform:
              level < 0.01
                ? undefined
                : `scale(${tiltScale}) rotateX(${pitch}deg) rotateY(${yaw}deg)`,
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
              src={staticFile(src)}
              trimBefore={Math.round(from * fps)}
              playbackRate={rate}
              muted
              style={{ width: TAKE_W, height: TAKE_H }}
            />
          </div>
        </AbsoluteFill>
      </AbsoluteFill>

      {callouts.map((c) => (
        <CalloutOverlay
          key={`${c.from}-${c.what}`}
          spec={c}
          box={project(c.box)}
          darkTheme={darkTheme}
        />
      ))}
    </AbsoluteFill>
  );
};
