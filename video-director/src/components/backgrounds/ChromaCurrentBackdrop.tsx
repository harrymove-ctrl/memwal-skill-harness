import React, { useEffect, useLayoutEffect, useRef } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

export interface ChromaCurrentBackdropProps {
  mode?: "light" | "dark";
  intensity?: number;
}

const PITCH = 16;

const clamp = (v: number, lo: number, hi: number): number =>
  v < lo ? lo : v > hi ? hi : v;

const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

/** Exact deterministic Perlin permutation table from demo app ChromaCurrent (seed 1337). */
const PERM: Uint8Array = (() => {
  const base = Array.from({ length: 256 }, (_, i) => i);
  let state = 1337;
  for (let i = 255; i > 0; i--) {
    state = (state * 16807) % 2147483647;
    const j = state % (i + 1);
    const swap = base[i];
    base[i] = base[j];
    base[j] = swap;
  }
  const table = new Uint8Array(512);
  for (let i = 0; i < 512; i++) {
    table[i] = base[i & 255];
  }
  return table;
})();

const fadeCurve = (t: number): number =>
  t * t * t * (t * (t * 6 - 15) + 10);

const gradient3 = (hash: number, x: number, y: number, z: number): number => {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
};

const noise3 = (x: number, y: number, z: number): number => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const X = xi & 255;
  const Y = yi & 255;
  const Z = zi & 255;
  const fx = x - xi;
  const fy = y - yi;
  const fz = z - zi;
  const u = fadeCurve(fx);
  const v = fadeCurve(fy);
  const w = fadeCurve(fz);
  const A = PERM[X] + Y;
  const AA = PERM[A] + Z;
  const AB = PERM[A + 1] + Z;
  const B = PERM[X + 1] + Y;
  const BA = PERM[B] + Z;
  const BB = PERM[B + 1] + Z;
  const lerp = (t: number, a: number, b: number) => a + t * (b - a);
  return lerp(
    w,
    lerp(
      v,
      lerp(u, gradient3(PERM[AA], fx, fy, fz), gradient3(PERM[BA], fx - 1, fy, fz)),
      lerp(
        u,
        gradient3(PERM[AB], fx, fy - 1, fz),
        gradient3(PERM[BB], fx - 1, fy - 1, fz)
      )
    ),
    lerp(
      v,
      lerp(
        u,
        gradient3(PERM[AA + 1], fx, fy, fz - 1),
        gradient3(PERM[BA + 1], fx - 1, fy, fz - 1)
      ),
      lerp(
        u,
        gradient3(PERM[AB + 1], fx, fy - 1, fz - 1),
        gradient3(PERM[BB + 1], fx - 1, fy - 1, fz - 1)
      )
    )
  );
};

interface StreamSpec {
  id: number;
  baseCenter: number;
  amp: number;
  freq: number;
  speed: number;
  phase: number;
  width: number;
  angleRad: number;
  colorMix: number;
}

/** 4 flowing sinusoidal + Perlin-turbulent currents modeled directly on FullscreenShaderBackground. */
const STREAMS: readonly StreamSpec[] = [
  {
    id: 0,
    baseCenter: -0.34,
    amp: 0.085,
    freq: 2.35,
    speed: 0.44,
    phase: 0.6,
    width: 0.068,
    angleRad: -0.22,
    colorMix: 0.05,
  },
  {
    id: 1,
    baseCenter: -0.11,
    amp: 0.095,
    freq: 1.95,
    speed: 0.54,
    phase: 2.15,
    width: 0.074,
    angleRad: -0.15,
    colorMix: 0.36,
  },
  {
    id: 2,
    baseCenter: 0.13,
    amp: 0.09,
    freq: 2.15,
    speed: 0.49,
    phase: 4.05,
    width: 0.072,
    angleRad: -0.18,
    colorMix: 0.68,
  },
  {
    id: 3,
    baseCenter: 0.35,
    amp: 0.082,
    freq: 2.5,
    speed: 0.41,
    phase: 5.4,
    width: 0.066,
    angleRad: -0.24,
    colorMix: 0.96,
  },
];

type Rgb = readonly [number, number, number];

const LIGHT_COLORS: readonly [Rgb, Rgb] = [
  [16, 185, 129], // #10b981
  [20, 184, 166], // #14b8a6
];

const DARK_COLORS: readonly [Rgb, Rgb] = [
  [52, 217, 150], // #34d996
  [45, 212, 191], // #2dd4bf
];

const lerpRgb = (a: Rgb, b: Rgb, t: number): Rgb => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];

const evalStreamCenter = (
  s: StreamSpec,
  u: number,
  timeSec: number
): number => {
  const travel = timeSec * s.speed;
  const evolve = timeSec * 0.22;
  const wave =
    s.amp * Math.sin(u * s.freq - travel * 2.2 + s.phase) +
    s.amp * 0.36 * Math.sin(u * s.freq * 1.9 - travel * 3.1 + s.phase * 1.7);
  const turb =
    0.115 *
      noise3(u * 1.45 - travel * 0.85, s.baseCenter * 2.6 + s.id * 3.1, evolve) +
    0.048 *
      noise3(
        u * 3.1 - travel * 1.35 + 7.3,
        s.baseCenter * 4.2 - 2.1,
        evolve * 1.65 + s.id * 5.7
      );
  return s.baseCenter + wave + turb;
};

interface BloomNode {
  x: number;
  y: number;
  lit: number;
  rgb: Rgb;
}

interface LitCell {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rot: number;
  lit: number;
  rgb: Rgb;
}

export const ChromaCurrentBackdrop: React.FC<ChromaCurrentBackdropProps> = ({
  mode = "dark",
  intensity = 1,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastRenderKeyRef = useRef<string>("");

  const isDark = mode === "dark";
  const safeIntensity = clamp(
    Number.isFinite(intensity) ? intensity : 1,
    0,
    2.5
  );

  const renderKey = `${frame}|${width}|${height}|${fps}|${mode}|${safeIntensity.toFixed(4)}`;

  const drawFrame = () => {
    if (lastRenderKeyRef.current === renderKey) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    lastRenderKeyRef.current = renderKey;

    const timeSec = frame / Math.max(1, fps);
    const aspect = width / Math.max(1, height);
    const palette = isDark ? DARK_COLORS : LIGHT_COLORS;

    // 1. Solid theme canvas fill (Sorbet #f5f6f1 or Obsidian #080c0b)
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = isDark ? "#080c0b" : "#f5f6f1";
    ctx.fillRect(0, 0, width, height);

    const cols = Math.ceil(width / PITCH) + 1;
    const rows = Math.ceil(height / PITCH) + 1;
    const originX = (width - cols * PITCH) * 0.5;
    const originY = (height - rows * PITCH) * 0.5;

    const baseRadius = isDark ? 1.35 : 1.3;
    const maxRadius = isDark ? 5.25 : 4.85;

    const baseDotsPath = new Path2D();
    const litCells: LitCell[] = [];
    const bloomNodes: BloomNode[] = [];

    for (let row = 0; row < rows; row++) {
      const cy = originY + (row + 0.5) * PITCH;
      const ny = cy / height - 0.5;

      for (let col = 0; col < cols; col++) {
        const cx = originX + (col + 0.5) * PITCH;
        const nx = (cx / width - 0.5) * aspect;

        let totalEnergy = 0;
        let weightedR = 0;
        let weightedG = 0;
        let weightedB = 0;
        let domSlopeAngle = -0.18;
        let domEnergy = 0;

        for (let sIdx = 0; sIdx < STREAMS.length; sIdx++) {
          const s = STREAMS[sIdx];
          const cosA = Math.cos(s.angleRad);
          const sinA = Math.sin(s.angleRad);

          const u = nx * cosA + ny * sinA;
          const v = -nx * sinA + ny * cosA;

          const center = evalStreamCenter(s, u, timeSec);
          const dist = v - center;
          const sigma = s.width;

          if (Math.abs(dist) > sigma * 3.1) continue;

          const crossProfile = Math.exp(-(dist * dist) / (2 * sigma * sigma));

          // Advected wave packets & cellular sparkle crests flowing along stream u
          const advectedU = u - timeSec * s.speed * 1.35;
          const packetWave =
            0.52 +
            0.48 *
              Math.sin(advectedU * 5.2 + s.phase * 2.1 + Math.sin(advectedU * 2.3) * 0.8);
          const sparkle =
            0.5 +
            0.5 *
              noise3(
                advectedU * 4.4 + s.id * 9.1,
                dist * 9.5 + s.id * 4.3,
                timeSec * 0.36
              );
          const pulse = 0.26 + 0.94 * packetWave * (0.45 + 0.85 * sparkle * sparkle);

          const streamE = crossProfile * pulse * safeIntensity;
          if (streamE <= 0.008) continue;

          const colorT = clamp(
            s.colorMix + 0.18 * Math.sin(advectedU * 3.1 + s.id),
            0,
            1
          );
          const rgb = lerpRgb(palette[0], palette[1], colorT);

          totalEnergy += streamE;
          weightedR += rgb[0] * streamE;
          weightedG += rgb[1] * streamE;
          weightedB += rgb[2] * streamE;

          if (streamE > domEnergy) {
            domEnergy = streamE;
            const centerAhead = evalStreamCenter(s, u + 0.03, timeSec);
            const localSlope = Math.atan2(centerAhead - center, 0.03);
            domSlopeAngle = -s.angleRad + localSlope;
          }
        }

        const lit = clamp(1 - Math.exp(-totalEnergy * 1.28), 0, 1);

        if (lit < 0.045) {
          baseDotsPath.moveTo(cx + baseRadius, cy);
          baseDotsPath.arc(cx, cy, baseRadius, 0, Math.PI * 2);
          continue;
        }

        const invE = 1 / Math.max(totalEnergy, 0.0001);
        const rgb: Rgb = [
          Math.round(weightedR * invE),
          Math.round(weightedG * invE),
          Math.round(weightedB * invE),
        ];

        // Halftone + panel blend & flow-aligned stretch matching ChromaCurrent dotsFragment
        const halftone = baseRadius + (maxRadius - baseRadius) * Math.sqrt(lit);
        const panel = maxRadius * (0.68 + 0.32 * smoothstep(0, 0.45, lit));
        const r = panel * 0.58 + halftone * 0.42;
        const stretch = 1 + 0.24 * smoothstep(0.06, 0.42, lit);

        litCells.push({
          cx,
          cy,
          rx: r * stretch,
          ry: r,
          rot: domSlopeAngle,
          lit,
          rgb,
        });

        // Decimated crest sampling for creamy phosphor bloom halos
        if (lit > 0.46 && col % 3 === 1 && row % 3 === 1) {
          bloomNodes.push({ x: cx, y: cy, lit, rgb });
        }
      }
    }

    // 2. Render subtle base dot matrix across unlit cells
    ctx.fillStyle = isDark
      ? "rgba(52, 217, 150, 0.13)"
      : "rgba(39, 98, 79, 0.115)";
    ctx.fill(baseDotsPath);

    // 3. Render phosphor bloom halo around active stream crests
    if (bloomNodes.length > 0) {
      ctx.save();
      ctx.globalCompositeOperation = isDark ? "screen" : "source-over";
      for (let i = 0; i < bloomNodes.length; i++) {
        const b = bloomNodes[i];
        const radius = isDark ? 64 + b.lit * 46 : 52 + b.lit * 34;
        const peakAlpha = isDark
          ? clamp((b.lit - 0.38) * 0.24 * safeIntensity, 0, 0.22)
          : clamp((b.lit - 0.42) * 0.14 * safeIntensity, 0, 0.12);
        if (peakAlpha <= 0.004) continue;

        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, radius);
        grad.addColorStop(
          0,
          `rgba(${b.rgb[0]}, ${b.rgb[1]}, ${b.rgb[2]}, ${peakAlpha.toFixed(4)})`
        );
        grad.addColorStop(
          0.45,
          `rgba(${b.rgb[0]}, ${b.rgb[1]}, ${b.rgb[2]}, ${(peakAlpha * 0.38).toFixed(4)})`
        );
        grad.addColorStop(1, `rgba(${b.rgb[0]}, ${b.rgb[1]}, ${b.rgb[2]}, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 4. Render flowing emerald & teal / cyan stream dots
    for (let i = 0; i < litCells.length; i++) {
      const c = litCells[i];
      if (isDark) {
        // Luminous Obsidian emission + white-mint hot crest core
        const hot = Math.max(0, (c.lit - 0.76) / 0.24);
        const r = Math.round(c.rgb[0] + (236 - c.rgb[0]) * hot * 0.58);
        const g = Math.round(c.rgb[1] + (255 - c.rgb[1]) * hot * 0.58);
        const b = Math.round(c.rgb[2] + (246 - c.rgb[2]) * hot * 0.58);
        const alpha = clamp(0.16 + c.lit * 0.88, 0, 1);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
      } else {
        // Sorbet ink mode: rich emerald/teal dots over warm cream #f5f6f1
        const alpha = clamp(0.14 + c.lit * 0.78, 0, 0.92);
        ctx.fillStyle = `rgba(${c.rgb[0]}, ${c.rgb[1]}, ${c.rgb[2]}, ${alpha.toFixed(3)})`;
      }

      ctx.beginPath();
      ctx.ellipse(c.cx, c.cy, c.rx, c.ry, c.rot, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Soft radial center vignette so foreground UI cards pop with crisp contrast
    const cx = width * 0.5;
    const cy = height * 0.5;
    const maxR = Math.hypot(cx, cy);

    if (isDark) {
      // Subtle center calm + gentle obsidian edge framing
      const centerCalm = ctx.createRadialGradient(
        cx,
        cy,
        0,
        cx,
        cy,
        maxR * 0.62
      );
      centerCalm.addColorStop(0, "rgba(8, 12, 11, 0.42)");
      centerCalm.addColorStop(0.65, "rgba(8, 12, 11, 0.14)");
      centerCalm.addColorStop(1, "rgba(8, 12, 11, 0)");
      ctx.fillStyle = centerCalm;
      ctx.fillRect(0, 0, width, height);

      const edgeVignette = ctx.createRadialGradient(
        cx,
        cy,
        maxR * 0.58,
        cx,
        cy,
        maxR
      );
      edgeVignette.addColorStop(0, "rgba(4, 7, 6, 0)");
      edgeVignette.addColorStop(1, "rgba(4, 7, 6, 0.44)");
      ctx.fillStyle = edgeVignette;
      ctx.fillRect(0, 0, width, height);
    } else {
      // Soft Sorbet radial center cushion so white/glass foreground UI cards pop cleanly
      const centerVignette = ctx.createRadialGradient(
        cx,
        cy,
        0,
        cx,
        cy,
        maxR * 0.66
      );
      centerVignette.addColorStop(0, "rgba(245, 246, 241, 0.64)");
      centerVignette.addColorStop(0.58, "rgba(245, 246, 241, 0.24)");
      centerVignette.addColorStop(1, "rgba(245, 246, 241, 0)");
      ctx.fillStyle = centerVignette;
      ctx.fillRect(0, 0, width, height);

      const perimeterTint = ctx.createRadialGradient(
        cx,
        cy,
        maxR * 0.62,
        cx,
        cy,
        maxR
      );
      perimeterTint.addColorStop(0, "rgba(232, 237, 231, 0)");
      perimeterTint.addColorStop(1, "rgba(225, 232, 226, 0.38)");
      ctx.fillStyle = perimeterTint;
      ctx.fillRect(0, 0, width, height);
    }
  };

  useLayoutEffect(() => {
    drawFrame();
  }, [frame, width, height, fps, mode, safeIntensity]);

  useEffect(() => {
    drawFrame();
  }, [frame, width, height, fps, mode, safeIntensity]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        backgroundColor: isDark ? "#080c0b" : "#f5f6f1",
      }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};

export default ChromaCurrentBackdrop;
