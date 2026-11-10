import React from "react";
import { AbsoluteFill } from "remotion";
import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { MARK_PATHS } from "../../../src/shell/logoPaths";

export const { fontFamily: GEIST } = loadGeist("normal", { weights: ["400", "500", "600"], subsets: ["latin"] });
export const { fontFamily: SERIF } = loadSerif("italic", { weights: ["400"], subsets: ["latin"] });

export const INK = "#f4f6f5";
export const INK2 = "#a7b0ad";
export const BG = "#0b0f0e";
export const SURFACE = "#18201e";
export const RAISED = "#222b29";
export const LINE = "rgba(255,255,255,.1)";
export const ACCENT = "#34d399";
export const ON_ACCENT = "#04140d";
export const BAD = "#f87171";

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const smooth = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
export const ramp = (t: number, a: number, b: number) => smooth(clamp((t - a) / (b - a)));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const rand = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
/** A closed form spring: rises to 1 with one small overshoot. */
export const springAt = (t: number, at: number, rate = 11) => {
  const u = t - at;
  return u <= 0 ? 0 : 1 - Math.exp(-rate * u) * Math.cos(rate * 0.9 * u);
};
export const squash = (t: number, at: number) => {
  const u = t - at;
  return u < 0 || u > 0.22 ? 0 : Math.sin((u / 0.22) * Math.PI) * Math.exp(-u * 7);
};

export const T: React.FC<{ size: number; color?: string; weight?: number; serif?: boolean; style?: React.CSSProperties; children: React.ReactNode }> = ({ size, color = INK, weight = 500, serif, style, children }) => (
  <span style={{ fontFamily: serif ? SERIF : GEIST, fontStyle: serif ? "italic" : "normal", fontSize: size, color, fontWeight: serif ? 400 : weight, whiteSpace: "nowrap", letterSpacing: serif ? "-0.01em" : size > 60 ? "-0.03em" : "-0.01em", ...style }}>{children}</span>
);

export const Mark: React.FC<{ size: number; color?: string; style?: React.CSSProperties }> = ({ size, color = ACCENT, style }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={style}>
    <g fill={color}>{MARK_PATHS.map((d) => <path key={d} d={d} />)}</g>
  </svg>
);

export const DotGrid: React.FC<{ offsetX?: number; offsetY?: number }> = ({ offsetX = 0, offsetY = 0 }) => (
  <AbsoluteFill
    style={{
      backgroundColor: BG,
      backgroundImage: "radial-gradient(rgba(255,255,255,.075) 1.6px, transparent 1.7px)",
      backgroundSize: "44px 44px",
      backgroundPosition: `${offsetX}px ${offsetY}px`,
    }}
  />
);

export const Ball: React.FC<{ x: number; y: number; r?: number; hit?: number }> = ({ x, y, r = 28, hit = 0 }) => (
  <div style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: "50%", background: "#fff", transform: `scale(${1 + hit * 0.16}, ${1 - hit * 0.2})`, boxShadow: "0 10px 26px rgba(0,0,0,.45)" }} />
);

/** Each word rises into place on its beat. */
export const Words: React.FC<{ t: number; at: number; text: string; size: number; step?: number; color?: string; serif?: boolean; style?: React.CSSProperties }> = ({ t, at, text, size, step = 0.09, color, serif, style }) => (
  <div style={{ display: "flex", gap: size * 0.26, flexWrap: "nowrap", ...style }}>
    {text.split(" ").map((word, i) => {
      const u = springAt(t, at + i * step, 14);
      return (
        <span key={`${word}${i}`} style={{ display: "inline-block", overflow: "hidden", paddingBottom: size * 0.16, marginBottom: -size * 0.16 }}>
          <T size={size} color={color} serif={serif} style={{ display: "inline-block", transform: `translateY(${(1 - clamp(u, 0, 1.2)) * size * 1.2}px)` }}>{word}</T>
        </span>
      );
    })}
  </div>
);
