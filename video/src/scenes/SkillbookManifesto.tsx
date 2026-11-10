import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { GEIST, Mark, T, clamp, lerp, rand, ramp, springAt } from "./SkillbookShared";
import { MARK_PATHS } from "../../../src/shell/logoPaths";
import BEATS from "../take/manifesto-beats.json";

const beat = (name: string) => (BEATS as { beat: string; at: number }[]).find((b) => b.beat === name)?.at ?? 0;

/* One type scale and one grid for the whole film. Left aligned text and every frame share the same 140px margin. */
const TYPE = { display: 128, statement: 84, caption: 64 };
const MARGIN = 140;

/**
 * Manifesto: a brand film in two acts, 60 seconds.
 * Act one states the problem in plain lines. The turn asks the question. Act two is the product, real screens
 * condensing out of the same dots. Every visual is a function of time, so any frame renders alone.
 */
export const MANIFESTO_SECONDS = 60;

const INK = "#0d1714";
const INK2 = "#46545e";
const EMERALD = "#047857";
const TAIL = "#035c43";
const PAPER = "#f6f8fa";

/* ---------- one card style for the whole film ---------- */
export const Glass: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode; strong?: boolean }> = ({ style, children, strong }) => (
  <div
    style={{
      background: strong ? "rgba(255,255,255,.84)" : "rgba(255,255,255,.5)",
      backdropFilter: "blur(30px) saturate(1.3)",
      WebkitBackdropFilter: "blur(30px) saturate(1.3)",
      borderRadius: 28,
      boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,.72), 0 30px 70px rgba(12,48,96,.2)",
      ...style,
    }}
  >
    {children}
  </div>
);

/* A soft field of blurred colour: the same air behind every scene of act one. */
const Air: React.FC<{ t: number; strength?: number }> = ({ t, strength = 1 }) => (
  <AbsoluteFill style={{ background: PAPER, overflow: "hidden" }}>
    {[
      { x: 300, y: 180, c: "rgba(90,160,255,.34)", r: 680, s: 0.11 },
      { x: 1560, y: 280, c: "rgba(52,211,153,.3)", r: 620, s: -0.08 },
      { x: 980, y: 930, c: "rgba(170,150,255,.24)", r: 720, s: 0.06 },
    ].map((b, i) => (
      <div key={i} style={{ position: "absolute", left: b.x + Math.sin(t * b.s + i) * 150 - b.r, top: b.y + Math.cos(t * b.s * 1.3 + i) * 90 - b.r, width: b.r * 2, height: b.r * 2, borderRadius: "50%", background: `radial-gradient(circle, ${b.c} 0%, transparent 68%)`, opacity: strength }} />
    ))}
  </AbsoluteFill>
);

/* ---------- canvas helper: draws once per frame, from time alone ---------- */
const Canvas: React.FC<{ draw: (ctx: CanvasRenderingContext2D) => void; style?: React.CSSProperties }> = ({ draw, style }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 1920, 1080);
    draw(ctx);
  });
  return <canvas ref={ref} width={1920} height={1080} style={{ position: "absolute", inset: 0, ...style }} />;
};

/* Smooth noise on a plane, for the globe's land and the marbled field. */
const noise = (x: number, y: number) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const h = (a: number, b: number) => rand(a * 57 + b * 131);
  return lerp(lerp(h(xi, yi), h(xi + 1, yi), u), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), u), v);
};
const fbm = (x: number, y: number) => noise(x, y) * 0.55 + noise(x * 2.1, y * 2.1) * 0.3 + noise(x * 4.3, y * 4.3) * 0.15;

/* ---------- 1. Opening line ---------- */
const OpeningLine: React.FC<{ t: number }> = ({ t }) => {
  const pull = ramp(t, 0.15, 1.5);
  const size = lerp(760, TYPE.display, pull);
  const line = ["agent", "starts", "from", "zero"];
  const dotT = 3.9;
  const gather = ramp(t, 4.45, 5.0);
  return (
    <AbsoluteFill>
      <Air t={t} />
      <div style={{ position: "absolute", left: lerp(960, MARGIN, pull), top: lerp(540, 540, pull), transform: `translate(${lerp(-50, 0, pull)}%, -50%)`, display: "flex", alignItems: "baseline", gap: 36, opacity: 1 - gather }}>
        <T size={size} color={INK}>Every</T>
        {line.map((word, i) => {
          const at = 1.55 + i * 0.5;
          const u = clamp(springAt(t, at, 13), 0, 1.1);
          return <T key={word} size={TYPE.display} color={INK} style={{ display: "inline-block", opacity: clamp((t - at) * 7), transform: `translateY(${(1 - u) * 50}px)` }}>{word}</T>;
        })}
      </div>
      {t > dotT && <div style={{ position: "absolute", left: lerp(1786, 960, gather) - 13, top: lerp(584, 540, gather) - 13, width: 26, height: 26, borderRadius: 13, background: INK, transform: `scale(${clamp(springAt(t, dotT, 14), 0, 1.2)})` }} />}
    </AbsoluteFill>
  );
};

/* ---------- 2. First problem: a dot becomes a globe of what the team knows, and the globe forgets ---------- */
const FirstProblem: React.FC<{ t: number }> = ({ t }) => {
  const u = t - 5;
  const R = 330 * ramp(u, 0, 1.15);
  const halftone = ramp(u, 0.95, 1.7);
  const move = ramp(u, 1.1, 1.9);
  const forget = ramp(u, 4.2, 6.5);
  const cx = lerp(960, 1370, move);
  const cy = 540;
  return (
    <AbsoluteFill>
      <Air t={t} />
      <Canvas
        draw={(ctx) => {
          if (R < 1) return;
          if (halftone < 1) {
            ctx.fillStyle = INK;
            ctx.globalAlpha = 1 - halftone;
            ctx.beginPath();
            ctx.arc(cx, cy, R, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
          const step = 11;
          for (let y = -R; y <= R; y += step) {
            for (let x = -R; x <= R; x += step) {
              const r2 = (x * x + y * y) / (R * R);
              if (r2 > 1) continue;
              const nz = Math.sqrt(1 - r2);
              const lon = Math.atan2(x / R, nz) + u * 0.32;
              const lat = Math.asin(y / R);
              const land = fbm(lon * 1.4 + 11, lat * 2.2 + 5);
              const lit = 0.3 + 0.7 * clamp(nz * 0.8 - (x / R) * 0.25 - (y / R) * 0.35);
              const isLand = land > 0.5;
              // Forgetting moves in from the edge and clears the land as it passes.
              const lost = forget * 1.6 - (1 - Math.sqrt(r2)) * 0.5 - rand(x * 3 + y) * 0.3;
              const keep = clamp(1 - lost * 1.6);
              const size = (isLand ? 4.8 : 1.8) * lit * keep * halftone;
              if (size < 0.25) continue;
              ctx.fillStyle = isLand ? EMERALD : "#7fa0c4";
              ctx.beginPath();
              ctx.arc(cx + x, cy + y, size, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }}
      />
      <div style={{ position: "absolute", left: MARGIN, top: 330, width: 880 }}>
        <div style={{ opacity: ramp(u, 1.5, 1.9) }}>
          <T size={TYPE.statement} color={INK} style={{ whiteSpace: "normal", lineHeight: "96px", display: "block" }}>Your team learned something today.</T>
        </div>
        <div style={{ marginTop: 34, opacity: ramp(u, 3.9, 4.3), transform: `translateY(${(1 - ramp(u, 3.9, 4.3)) * 24}px)` }}>
          <T size={TYPE.statement + 6} color={TAIL} serif style={{ whiteSpace: "normal", lineHeight: "96px", display: "block" }}>Tomorrow's agent<br />won't know it.</T>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- 3. Second problem: a halftone laptop; a file flips, changes, and crumbles to dust ---------- */
const NAMES = ["team-notes.md", "team-notes-final.md", "team-notes-final-2.md"];
const SecondProblem: React.FC<{ t: number }> = ({ t }) => {
  const u = t - 12;
  const flipAt = [1.2, 2.3];
  let angle = 0;
  flipAt.forEach((at) => {
    const f = ramp(u, at, at + 0.42);
    if (f > 0 && f < 1) angle = f * 180;
  });
  const flips = flipAt.filter((at) => u >= at + 0.21).length;
  const shown = angle > 90 ? angle - 180 : angle;
  const crumble = ramp(u, 3.5, 5.6);
  const out = ramp(u, 5.35, 6.0);
  const box = { x: 1040, y: 470, w: 740, h: 220 };
  return (
    <AbsoluteFill>
      <Air t={t} />
      <Canvas
        draw={(ctx) => {
          // The laptop, in the same dots the globe left behind.
          const appear = ramp(u, 0, 0.8) * (1 - out);
          const step = 12;
          for (let y = 370; y < 900; y += step) {
            for (let x = 140; x < 930; x += step) {
              const inScreen = x > 210 && x < 860 && y > 390 && y < 800;
              const inBezel = x > 240 && x < 830 && y > 420 && y < 772;
              const inBase = x > 140 && x < 925 && y >= 808 && y < 860 - (x < 200 || x > 870 ? 22 : 0);
              if (!inScreen && !inBase) continue;
              const shade = inBase ? 0.72 : inBezel ? 0.2 + 0.14 * Math.sin(y * 0.11 + u) + (y > 470 && y < 600 && x < 560 ? 0.25 : 0) : 0.82;
              const size = Math.max(0.5, shade * 5.2) * appear;
              if (size < 0.25) continue;
              ctx.fillStyle = INK;
              ctx.beginPath();
              ctx.arc(x, y, size, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          // Dust: the file comes apart from its right edge and drifts away.
          if (crumble > 0) {
            for (let i = 0; i < 1500; i += 1) {
              const px = box.x + rand(i) * box.w;
              const py = box.y + rand(i + 900) * box.h;
              const start = (1 - (px - box.x) / box.w) * 0.55 + rand(i + 40) * 0.2;
              const g = clamp((crumble - start) / 0.5);
              if (g <= 0) continue;
              const drift = g * g;
              const x = px + drift * (220 + rand(i + 3) * 340);
              const y = py - drift * (120 + rand(i + 5) * 260) + Math.sin(i + g * 6) * 12 * g;
              ctx.fillStyle = `rgba(13,23,20,${(1 - g) * 0.85})`;
              ctx.fillRect(x, y, 2 + rand(i + 7) * 3, 2 + rand(i + 7) * 3);
            }
          }
        }}
      />
      {crumble < 0.82 && (
        <div style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, perspective: 1500, opacity: ramp(u, 0.25, 0.6) }}>
          <Glass style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", padding: "0 46px", boxSizing: "border-box", transform: `rotateY(${shown}deg)`, clipPath: crumble > 0 ? `inset(0 ${crumble * 118}% 0 0 round 28px)` : undefined }}>
            <T size={44} color={INK} style={{ fontFamily: "'JetBrains Mono', ui-monospace, Menlo, monospace" }}>{NAMES[Math.min(flips, 2)]}</T>
          </Glass>
        </div>
      )}
      <div style={{ position: "absolute", left: MARGIN, top: 90, opacity: ramp(u, 0.3, 0.7) * (1 - out) }}>
        <T size={TYPE.statement} color={INK} style={{ display: "block", lineHeight: "100px" }}>So you copy the notes around.</T>
        <span style={{ opacity: ramp(u, 2.9, 3.3) }}><T size={TYPE.statement + 6} color={TAIL} serif style={{ display: "block", lineHeight: "100px" }}>They go stale.</T></span>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- 4. Three words circling a marbled field of dots ---------- */
const WORDS = ["Teach", "Share", "Remember"];
const marble = (x: number, y: number, t: number) => {
  const warp = fbm(x * 0.0026 + t * 0.05, y * 0.0026 - t * 0.04);
  return Math.sin((x * 0.006 + y * 0.003 + warp * 7) * 2 + t * 0.35) * 0.5 + 0.5;
};
const ThreeWords: React.FC<{ t: number }> = ({ t }) => {
  const u = t - 18;
  const appear = ramp(u, 0, 0.9);
  const leave = ramp(u, 4.2, 5.1);
  return (
    <AbsoluteFill>
      <Air t={t} />
      <Canvas
        draw={(ctx) => {
          const step = 15;
          for (let y = 8; y < 1080; y += step) {
            for (let x = 8; x < 1920; x += step) {
              const m = marble(x, y, t);
              const d = Math.hypot(x - 960, y - 540);
              const reach = appear * 1300 * (1 - leave);
              const seen = clamp((reach - d) / 220);
              const size = (0.8 + m * m * 5.4) * seen * lerp(1, 0.4, leave);
              if (size < 0.3) continue;
              ctx.fillStyle = m > 0.62 ? EMERALD : m > 0.35 ? "#5b8fd4" : "#a59ae0";
              ctx.beginPath();
              ctx.arc(x, y, size, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }}
      />
      {WORDS.map((word, i) => {
        const a = (i / 3) * Math.PI * 2 + u * 0.58 - Math.PI / 2;
        const r = lerp(620, 300, ramp(u, 0.2, 1.3)) * lerp(1, 0.72, leave);
                return (
          <Glass key={word} strong style={{ position: "absolute", left: 960 + Math.cos(a) * r * 1.75, top: 540 + Math.sin(a) * r, transform: "translate(-50%,-50%)", padding: "16px 42px", opacity: ramp(u, 0.2 + i * 0.25, 0.6 + i * 0.25) * (1 - ramp(u, 4.0, 4.5)) }}>
            <T size={TYPE.statement + 16} color={INK}>{word}</T>
          </Glass>
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------- 5. The turn: nested spheres burst and fold back to one dot ---------- */
const TheTurn: React.FC<{ t: number }> = ({ t }) => {
  const u = t - 23;
  const SPHERES = [430, 330, 235, 150, 76];
  const burst = ramp(u, 0.25, 1.5);
  const fold = ramp(u, 3.7, 5.1);
  const words = "What if you only had to say it once?".split(" ");
  return (
    <AbsoluteFill>
      <Air t={t} />
      <Canvas
        draw={(ctx) => {
          SPHERES.forEach((base, i) => {
            const open = clamp(burst * 1.5 - i * 0.1);
            const r = base * open * (1 - fold) * (1 + 0.03 * Math.sin(u * 2 + i));
            if (r < 1) return;
            const count = Math.floor(r * 1.25);
            for (let k = 0; k < count; k += 1) {
              // Points on a sphere, spiral-spaced, turning slowly.
              const f = (k + 0.5) / count;
              const lat = Math.acos(1 - 2 * f);
              const lon = k * 2.39996 + u * (0.28 + i * 0.09) * (i % 2 ? -1 : 1);
              const x = Math.sin(lat) * Math.cos(lon);
              const y = Math.cos(lat);
              const z = Math.sin(lat) * Math.sin(lon);
              const size = (0.9 + (z + 1) * 1.9) * (i === 4 ? 1.3 : 1);
              ctx.fillStyle = i % 2 ? EMERALD : "#34628f";
              ctx.globalAlpha = 0.28 + (z + 1) * 0.34;
              ctx.beginPath();
              ctx.arc(960 + x * r, 540 + y * r, size, 0, Math.PI * 2);
              ctx.fill();
            }
          });
          ctx.globalAlpha = 1;
          // Everything folds back into one dot.
          const dot = 8 + 20 * ramp(u, 4.6, 5.3);
          ctx.fillStyle = INK;
          ctx.beginPath();
          ctx.arc(960, 540, dot * clamp(fold * 3 + (1 - burst)), 0, Math.PI * 2);
          ctx.fill();
        }}
      />
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, display: "grid", placeItems: "center", opacity: 1 - ramp(u, 3.7, 4.2) }}>
        <Glass strong style={{ padding: "34px 64px", display: "flex", gap: 22, opacity: ramp(u, 0.7, 1.0), transform: `scale(${0.97 + 0.03 * ramp(u, 0.7, 1.1)})` }}>
          {words.map((word, i) => {
            const at = 0.9 + i * 0.2;
            return <T key={i} size={TYPE.statement} color={word === "once?" ? TAIL : INK} serif={word === "once?"} style={{ display: "inline-block", opacity: clamp((t - 23 - at) * 6), transform: `translateY(${(1 - clamp(springAt(u, at, 13), 0, 1.05)) * 22}px)` }}>{word}</T>;
          })}
        </Glass>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- 6. Reveal: your screens condense out of dots ---------- */
/** A sheet of paper with holes that grow from one point: whatever sits under it condenses out of the dots. */
const DotCondense: React.FC<{ amount: number; color?: string; cx?: number; cy?: number }> = ({ amount, color = PAPER, cx = 960, cy = 540 }) => {
  if (amount >= 1) return null;
  return (
    <Canvas
      draw={(ctx) => {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1920, 1080);
        ctx.globalCompositeOperation = "destination-out";
        const step = 24;
        const far = Math.hypot(1000, 600);
        for (let y = 0; y <= 1080 + step; y += step) {
          for (let x = 0; x <= 1920 + step; x += step) {
            const d = Math.hypot(x - cx, y - cy) / far;
            const g = clamp((amount * 1.7 - d * 0.7 - rand(x * 0.7 + y) * 0.12) * 2.2);
            if (g <= 0) continue;
            ctx.beginPath();
            ctx.arc(x, y, g * step * 0.86, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.globalCompositeOperation = "source-over";
      }}
    />
  );
};

const FRAME = { x: MARGIN, y: 206, w: 1920 - MARGIN * 2, h: 820, pad: 14 };
type Shot = { z: number; fx: number; fy: number };
/** A window on the recording: shot positions are in px of the 1920 wide take, moving from one to the next. */
const Frame: React.FC<{ t: number; at: number; until: number; from: number; rate?: number; src: string; a: Shot; b: Shot }> = ({ t, at, until, from, rate = 1, src, a, b }) => {
  const k = ramp(t, at + 0.2, until - 0.3);
  const iw = FRAME.w - FRAME.pad * 2;
  const ih = FRAME.h - FRAME.pad * 2;
  const z = Math.exp(lerp(Math.log(a.z), Math.log(b.z), k));
  const scale = (iw / 1920) * z;
  const vw = iw / scale;
  const vh = ih / scale;
  const fx = clamp(lerp(a.fx, b.fx, k), vw / 2, 1920 - vw / 2);
  const fy = clamp(lerp(a.fy, b.fy, k), vh / 2, 1080 - vh / 2);
  const opacity = ramp(t, at - 0.4, at) * (1 - ramp(t, until, until + 0.4));
  return (
    <Sequence from={Math.round((at - 0.4) * 60)} durationInFrames={Math.round((until - at + 0.8) * 60)} layout="none">
      <Glass style={{ position: "absolute", left: FRAME.x, top: FRAME.y, width: FRAME.w, height: FRAME.h, padding: FRAME.pad, boxSizing: "border-box", opacity, transform: `translateY(${(1 - ramp(t, at - 0.4, at + 0.2)) * 18}px)` }}>
        <div style={{ width: iw, height: ih, borderRadius: 16, overflow: "hidden", position: "relative" }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: "0 0", transform: `scale(${scale}) translate(${-(fx - vw / 2)}px, ${-(fy - vh / 2)}px)` }}>
            <OffthreadVideo src={staticFile(src)} trimBefore={Math.round(from * 60)} playbackRate={rate} muted style={{ width: 1920, height: 1080 }} />
          </div>
        </div>
      </Glass>
    </Sequence>
  );
};

const Caption: React.FC<{ t: number; at: number; until: number; text: string; tail?: string }> = ({ t, at, until, text, tail }) => {
  const u = clamp(springAt(t, at, 11), 0, 1.04);
  const out = ramp(t, until, until + 0.35);
  return (
    <Glass strong style={{ position: "absolute", left: MARGIN, top: 52, height: 124, boxSizing: "border-box", display: "flex", alignItems: "center", padding: "0 40px", opacity: clamp((t - at) * 5) * (1 - out), transform: `translateY(${(1 - u) * 22 - out * 14}px)`, zIndex: 3 }}>
      <T size={TYPE.caption} color={INK}>{text}</T>
      {tail && <T size={TYPE.caption + 6} color={TAIL} serif style={{ marginLeft: 18 }}>{tail}</T>}
    </Glass>
  );
};

const Reveal: React.FC<{ t: number }> = ({ t }) => {
  const u = t - 29;
  return (
    <AbsoluteFill style={{ background: "#3b82f6" }}>
      <Img src={staticFile("take/sky.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", transform: `scale(${1.06 + u * 0.004})` }} />
      {/* The glass page, flying: the fly-through itself. */}
      {u < 8.9 && (
        <AbsoluteFill style={{ opacity: 1 - ramp(u, 8.4, 8.9) }}>
          <Sequence from={Math.round(29 * 60)} layout="none"><OffthreadVideo src={staticFile("take/intro.mp4")} trimBefore={36} muted style={{ width: "100%", height: "100%" }} /></Sequence>
        </AbsoluteFill>
      )}
      {/* Teach: straight to the rule being written. */}
      {u > 8.0 && u < 13.3 && (
        <>
          <Frame t={t} at={37.5} until={41.8} from={Math.max(0, beat("typing") - 0.9)} rate={1.25} src="take/manifesto.mp4" a={{ z: 1.7, fx: 1326, fy: 300 }} b={{ z: 1.74, fx: 1326, fy: 280 }} />
          <Caption t={t} at={37.7} until={41.7} text="Teach a rule." tail="Once." />
        </>
      )}
      {/* Recall: the real receipt in the stream. */}
      {u > 12.4 && u < 17.3 && (
        <>
          <Frame t={t} at={41.9} until={45.8} from={beat("live") - 0.2} src="take/manifesto.mp4" a={{ z: 1.2, fx: 1130, fy: 470 }} b={{ z: 1.85, fx: 925, fy: 860 }} />
          <Caption t={t} at={42.0} until={45.7} text="Your agents" tail="recall it." />
        </>
      )}
      {/* Tatum AI: its real public page, the prompt being typed. */}
      {u > 16.4 && u < 21.3 && (
        <>
          <Frame t={t} at={45.9} until={49.8} from={4} rate={4} src="take/tatum.mp4" a={{ z: 1.2, fx: 960, fy: 430 }} b={{ z: 1.5, fx: 960, fy: 440 }} />
          <Caption t={t} at={46.0} until={49.7} text="Ready for" tail="Tatum AI." />
        </>
      )}
      {/* Proof: the real count, and the line that names the gateway. */}
      {u > 20.4 && (
        <>
          <Frame t={t} at={49.9} until={53.3} from={beat("proof") - 0.1} src="take/manifesto.mp4" a={{ z: 2.68, fx: 1560, fy: 230 }} b={{ z: 2.72, fx: 1560, fy: 262 }} />
          <Caption t={t} at={50.0} until={53.2} text="Stored on Walrus." tail="Checked on Sui." />
        </>
      )}
      <DotCondense amount={ramp(u, 0, 1.5)} />
    </AbsoluteFill>
  );
};

/* ---------- 7. The line on our colour, then the logo gathering on white ---------- */
const MARK_POINTS = (() => {
  const points: { x: number; y: number }[] = [];
  if (typeof document === "undefined") return points;
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) return points;
  const paths = MARK_PATHS.map((d) => new Path2D(d));
  for (let y = 0.5; y < 64; y += 1.1) {
    for (let x = 0.5; x < 64; x += 1.1) {
      if (paths.some((p) => ctx.isPointInPath(p, x, y))) points.push({ x, y });
    }
  }
  return points;
})();

const Logo: React.FC<{ t: number }> = ({ t }) => {
  const u = t - 53;
  const green = ramp(u, 0, 0.55);
  const white = ramp(u, 3.1, 3.7);
  const gather = ramp(u, 3.4, 5.0);
  const name = ramp(u, 4.9, 5.4);
  const words = ["Teach", "your", "agents", "once."];
  const SCALE = 5.4;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "#047857", clipPath: `circle(${green * 1300}px at 960px 540px)` }} />
      {u < 3.6 && (
        <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", opacity: 1 - ramp(u, 3.05, 3.5) }}>
          <div style={{ display: "flex", gap: 28 }}>
            {words.map((word, i) => {
              const at = 0.4 + i * 0.13;
              return <T key={word} size={TYPE.display} color="#fff" style={{ display: "inline-block", opacity: clamp((u - at) * 6), transform: `translateY(${(1 - clamp(springAt(u, at, 13), 0, 1.05)) * 30}px)` }}>{word}</T>;
            })}
          </div>
          <div style={{ marginTop: 10, opacity: ramp(u, 1.15, 1.6) }}><T size={108} color="#c9f7e6" serif>Every agent remembers.</T></div>
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{ background: "#fff", clipPath: `circle(${white * 1300}px at 960px 540px)` }} />
      {u > 3.3 && (
        <Canvas
          draw={(ctx) => {
            const left = 960 - 32 * SCALE;
            const top = 440 - 32 * SCALE;
            MARK_POINTS.forEach((p, i) => {
              const a = rand(i) * Math.PI * 2;
              const d = 500 + rand(i + 3) * 700;
              const k = clamp((gather - rand(i + 8) * 0.35) / 0.65);
              const e = k * k * (3 - 2 * k);
              const x = lerp(960 + Math.cos(a) * d, left + p.x * SCALE, e);
              const y = lerp(500 + Math.sin(a) * d, top + p.y * SCALE, e);
              ctx.fillStyle = `rgba(4,120,87,${clamp(k * 3)})`;
              ctx.beginPath();
              ctx.arc(x, y, lerp(2.6, 3.9, e), 0, Math.PI * 2);
              ctx.fill();
            });
          }}
        />
      )}
      {gather >= 0.98 && <Mark size={64 * SCALE} color="#047857" style={{ position: "absolute", left: 960 - 32 * SCALE, top: 440 - 32 * SCALE, opacity: ramp(u, 5.0, 5.3) }} />}
      <div style={{ position: "absolute", left: 0, right: 0, top: 660, textAlign: "center", opacity: name, transform: `translateY(${(1 - name) * 20}px)` }}>
        <T size={132} color={INK}>Skillbook</T>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 830, textAlign: "center", opacity: ramp(u, 5.4, 5.8), fontFamily: GEIST }}>
        <T size={34} color={INK2}>Built on Walrus, Sui and Tatum.</T>
      </div>
    </AbsoluteFill>
  );
};

export const SkillbookManifesto: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <AbsoluteFill style={{ background: PAPER, fontFamily: GEIST }}>
      {t < 5.05 && <OpeningLine t={t} />}
      {t >= 5.05 && t < 12.1 && <FirstProblem t={t} />}
      {t >= 12.1 && t < 18.1 && <SecondProblem t={t} />}
      {t >= 18.1 && t < 23.2 && <ThreeWords t={t} />}
      {t >= 23.2 && t < 29.0 && <TheTurn t={t} />}
      {t >= 29.0 && t < 53.6 && <Reveal t={t} />}
      {t >= 53.0 && <Logo t={t} />}
    </AbsoluteFill>
  );
};
