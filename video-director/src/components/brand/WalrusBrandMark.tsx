import type React from "react";

const WALRUS_LOGO_VIEW = 28;
const WALRUS_W_BITMAP: readonly string[] = [
  "00000000000000",
  "00011000011000",
  "00011000011000",
  "01100111100110",
  "01100111100110",
  "01100111100110",
  "01100111100110",
  "01100111100110",
  "01100111100110",
  "00000000000000",
];

const BAYER4_THRESHOLDS: Float32Array = (() => {
  const size = 4;
  const thresholds = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let rank = 0;
      for (let bit = 1; bit < size; bit *= 2) {
        const xBit = Math.floor(x / bit) % 2;
        const yBit = Math.floor(y / bit) % 2;
        rank = rank * 4 + 2 * ((xBit + yBit) % 2) + yBit;
      }
      thresholds[y * size + x] = (rank + 0.5) / 16;
    }
  }
  return thresholds;
})();

const wrap4 = (v: number): number => ((Math.floor(v) % 4) + 4) % 4;
const isInkedBayer4 = (x: number, y: number, tone: number): boolean =>
  tone > (BAYER4_THRESHOLDS[wrap4(y) * 4 + wrap4(x)] ?? 0);

function buildWalrusDitherPaths(): {
  disc: string;
  markFull: string;
  markShade: string;
} {
  let disc = "";
  let markFull = "";
  let markShade = "";

  for (let y = 0; y < WALRUS_LOGO_VIEW; y += 1) {
    for (let x = 0; x < WALRUS_LOGO_VIEW; x += 1) {
      const bx = Math.floor(x / 2);
      const by = Math.floor((y - 4) / 2);
      const inW = WALRUS_W_BITMAP[by]?.[bx] === "1";

      if (inW) {
        const vGrad = 1 - Math.max(0, (y - 6) / 18) * 0.45;
        if (vGrad >= 0.78) {
          markFull += `M${x} ${y}h1v1h-1z`;
        } else if (isInkedBayer4(x, y, 0.75)) {
          markShade += `M${x} ${y}h1v1h-1z`;
        }
        continue;
      }

      const nx = (x + 0.5 - WALRUS_LOGO_VIEW / 2) / (WALRUS_LOGO_VIEW / 2);
      const ny = (y + 0.5 - WALRUS_LOGO_VIEW / 2) / (WALRUS_LOGO_VIEW / 2);
      const dist = Math.hypot(nx, ny);
      if (dist <= 0.96) {
        const light = 1 - Math.hypot(nx + 0.42, ny + 0.42) / 1.55;
        const tone = 0.28 * Math.max(0, light) ** 1.25;
        if (isInkedBayer4(x, y, tone)) {
          disc += `M${x} ${y}h1v1h-1z`;
        }
      }
    }
  }
  return { disc, markFull, markShade };
}

const WALRUS_PATHS = buildWalrusDitherPaths();

export interface WalrusBrandMarkProps {
  size?: number;
  color?: string;
  darkTile?: boolean;
  glow?: boolean;
  style?: React.CSSProperties;
}

export const WalrusBrandMark: React.FC<WalrusBrandMarkProps> = ({
  size = 64,
  color = "#34d996",
  darkTile = true,
  glow = true,
  style,
}) => {
  const radiusPx = Math.round(size * 0.24);
  const glowSpread = Math.max(6, Math.round(size * 0.16));

  return (
    <span
      role="img"
      aria-label="MemWal Skills"
      style={{
        position: "relative",
        display: "inline-flex",
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: radiusPx,
        background: darkTile
          ? "linear-gradient(145deg, #0b1f1a 0%, #06120f 100%)"
          : "rgba(16, 185, 129, 0.14)",
        boxShadow: [
          "inset 0 1.5px 0 rgba(255, 255, 255, 0.28)",
          "0 0 0 1.5px rgba(52, 217, 150, 0.48)",
          glow ? `0 12px ${glowSpread * 2}px rgba(16, 185, 129, 0.32)` : "",
        ]
          .filter(Boolean)
          .join(", "),
        userSelect: "none",
        ...style,
      }}
    >
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${WALRUS_LOGO_VIEW} ${WALRUS_LOGO_VIEW}`}
        shapeRendering="crispEdges"
        style={{
          width: "100%",
          height: "100%",
          borderRadius: radiusPx,
          filter: glow
            ? `drop-shadow(0 0 ${Math.max(2, Math.round(size * 0.08))}px rgba(52, 217, 150, 0.45))`
            : undefined,
        }}
      >
        <path d={WALRUS_PATHS.disc} fill={color} fillOpacity={0.34} />
        <path d={WALRUS_PATHS.markShade} fill={color} fillOpacity={0.78} />
        <path d={WALRUS_PATHS.markFull} fill="#a7f3d0" />
      </svg>
    </span>
  );
};
