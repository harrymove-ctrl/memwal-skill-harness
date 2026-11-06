import React from "react";
import { Img, staticFile } from "remotion";
import type { CollapsePlateItem } from "@/components/snapcn/logo-collapse";
import { SNAP_CN_UI } from "@/lib/brand-tokens";

/**
 * Deterministic 4x4 Bayer threshold matrix matching src/lib/dither/matrices.ts.
 * Thresholds sit halfway between steps: (rank + 0.5) / 16.
 */
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

const NAMED_COLORS: Record<string, string> = {
  green: "#10b981",
  emerald: "#34d996",
  teal: "#14b8a6",
  cyan: "#38bdf8",
  blue: "#38bdf8",
  purple: "#a78bfa",
  violet: "#a78bfa",
  amber: "#fbbf24",
  orange: "#fb923c",
};

const resolveColorHex = (input?: string, fallback = "#34d996"): string => {
  if (!input) return fallback;
  const trimmed = input.trim();
  const mapped = NAMED_COLORS[trimmed.toLowerCase()];
  return mapped ?? trimmed;
};

const hexToRgbTuple = (
  hex: string
): readonly [number, number, number] | null => {
  const clean = hex.replace(/^#/, "").trim();
  if (clean.length === 3) {
    const r = Number.parseInt(clean[0] + clean[0], 16);
    const g = Number.parseInt(clean[1] + clean[1], 16);
    const b = Number.parseInt(clean[2] + clean[2], 16);
    if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) {
      return [r, g, b];
    }
  }
  if (clean.length === 6) {
    const r = Number.parseInt(clean.slice(0, 2), 16);
    const g = Number.parseInt(clean.slice(2, 4), 16);
    const b = Number.parseInt(clean.slice(4, 6), 16);
    if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) {
      return [r, g, b];
    }
  }
  return null;
};

const withAlpha = (color: string, alpha: number): string => {
  const rgb = hexToRgbTuple(color);
  if (rgb) {
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
  }
  return `color-mix(in oklab, ${color} ${Math.round(alpha * 100)}%, transparent)`;
};

/* ========================================================================== */
/* 1. WalrusLogo3DVideo                                                       */
/* ========================================================================== */

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

export interface WalrusLogo3DVideoProps {
  size?: number;
  color?: string;
  glow?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export const WalrusLogo3DVideo: React.FC<WalrusLogo3DVideoProps> = ({
  size = 56,
  color = "#34d996",
  glow = true,
  style,
  className,
}) => {
  const ink = resolveColorHex(color, "#34d996");
  const radiusPx = Math.round(size * 0.24);
  const glowSpread = Math.max(4, Math.round(size * 0.14));

  return (
    <span
      role="img"
      aria-label="Walrus Memory"
      className={className}
      style={{
        position: "relative",
        display: "inline-flex",
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: radiusPx,
        backgroundColor: withAlpha(ink, 0.14),
        boxShadow: [
          `inset 0 1.5px 0 ${withAlpha("#ffffff", 0.34)}`,
          `0 0 0 1.25px ${withAlpha(ink, 0.38)}`,
          glow ? `0 8px ${glowSpread * 2}px ${withAlpha(ink, 0.25)}` : "",
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
            ? `drop-shadow(0 0 ${Math.max(2, Math.round(size * 0.08))}px ${withAlpha(
                ink,
                0.42
              )})`
            : undefined,
        }}
      >
        <path d={WALRUS_PATHS.disc} style={{ fill: ink, opacity: 0.55 }} />
        <path d={WALRUS_PATHS.markShade} style={{ fill: ink, opacity: 0.78 }} />
        <path d={WALRUS_PATHS.markFull} style={{ fill: ink, opacity: 1 }} />
      </svg>
    </span>
  );
};

/* ========================================================================== */
/* 2. SignerOrbVideo                                                          */
/* ========================================================================== */

const AVATAR_GRID = 5;
const AVATAR_HALF = Math.ceil(AVATAR_GRID / 2);
const AVATAR_SUB = 4;
const AVATAR_PAD = 1.5;
const AVATAR_VIEW = AVATAR_GRID * AVATAR_SUB + AVATAR_PAD * 2 * AVATAR_SUB; // 32
const MODULUS = 2_147_483_647;

const seedOf = (value: string): number => {
  let hash = 7;
  for (const char of value) {
    hash = (hash * 31 + (char.codePointAt(0) ?? 0)) % MODULUS;
  }
  return hash === 0 ? 1 : hash;
};

const parkMiller = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 48_271) % MODULUS;
    return state / MODULUS;
  };
};

type AvatarFace = readonly (readonly number[])[];

const computeAvatarFace = (value: string): AvatarFace => {
  const random = parkMiller(seedOf(value));
  const centre = (AVATAR_GRID - 1) / 2;
  const reach = Math.hypot(centre, centre);

  const rows = Array.from({ length: AVATAR_GRID }, (_, y) => {
    const half = Array.from({ length: AVATAR_HALF }, (_unused, x) => {
      const near = 1 - Math.hypot(x - centre, y - centre) / reach;
      if (random() > 0.3 + 0.75 * near || near < 0.05) {
        return 0;
      }
      return random() < 0.25 + 0.6 * near ? 1 : 0.5;
    });
    const mirrored = half.slice(0, AVATAR_GRID - AVATAR_HALF).reverse();
    return [...half, ...mirrored];
  });

  const spine = rows.filter((row) => (row[centre] ?? 0) > 0).length;
  if (spine < 2) {
    for (const y of [1, 2, 3]) {
      const row = rows[y];
      if (row) {
        row.splice(centre, 1, 1);
      }
    }
  }
  return rows;
};

const isFaceNear = (face: AvatarFace, x: number, y: number): boolean => {
  for (let oy = -1; oy <= 1; oy += 1) {
    for (let ox = -1; ox <= 1; ox += 1) {
      const bx = Math.floor((x + ox - AVATAR_PAD * AVATAR_SUB) / AVATAR_SUB);
      const by = Math.floor((y + oy - AVATAR_PAD * AVATAR_SUB) / AVATAR_SUB);
      if ((face[by]?.[bx] ?? 0) > 0) {
        return true;
      }
    }
  }
  return false;
};

interface CachedSignerPaths {
  disc: string;
  face: string;
}

const SIGNER_PATH_CACHE = new Map<string, CachedSignerPaths>();

const getSignerPaths = (seedName: string): CachedSignerPaths => {
  const cached = SIGNER_PATH_CACHE.get(seedName);
  if (cached) return cached;

  const faceGrid = computeAvatarFace(seedName);
  let face = "";
  for (let by = 0; by < AVATAR_GRID; by++) {
    const row = faceGrid[by];
    for (let bx = 0; bx < AVATAR_GRID; bx++) {
      const tone = row[bx] ?? 0;
      if (tone <= 0) continue;
      for (let sy = 0; sy < AVATAR_SUB; sy++) {
        for (let sx = 0; sx < AVATAR_SUB; sx++) {
          if (isInkedBayer4(sx, sy, tone)) {
            const px = AVATAR_PAD * AVATAR_SUB + bx * AVATAR_SUB + sx;
            const py = AVATAR_PAD * AVATAR_SUB + by * AVATAR_SUB + sy;
            face += `M${px} ${py}h1v1h-1z`;
          }
        }
      }
    }
  }

  let disc = "";
  for (let y = 0; y < AVATAR_VIEW; y++) {
    for (let x = 0; x < AVATAR_VIEW; x++) {
      if (isFaceNear(faceGrid, x, y)) continue;
      const nx = (x + 0.5 - AVATAR_VIEW / 2) / (AVATAR_VIEW / 2);
      const ny = (y + 0.5 - AVATAR_VIEW / 2) / (AVATAR_VIEW / 2);
      const light = 1 - Math.hypot(nx + 0.45, ny + 0.45) / 1.6;
      const tone = 0.26 * Math.max(0, light) ** 1.3;
      if (isInkedBayer4(x, y, tone)) {
        disc += `M${x} ${y}h1v1h-1z`;
      }
    }
  }

  const built = { disc, face };
  SIGNER_PATH_CACHE.set(seedName, built);
  return built;
};

export interface SignerOrbVideoProps {
  handle?: string;
  name?: string;
  initials?: string;
  variant?: "emerald" | "cyan" | "blue" | "violet" | "amber" | "auto";
  size?: number;
  online?: boolean;
  ring?: boolean;
  outlineColor?: string;
  style?: React.CSSProperties;
  className?: string;
}

export const SignerOrbVideo: React.FC<SignerOrbVideoProps> = ({
  handle = "",
  name = "",
  initials = "",
  variant = "auto",
  size = 32,
  online = true,
  ring = false,
  outlineColor = "#0b1110",
  style,
  className,
}) => {
  const rawSeed =
    handle.trim() || name.trim() || initials.trim() || "@harrymove-ctrl";
  const lower = rawSeed.toLowerCase();

  let ink = "#34d996"; // emerald default (@harrymove-ctrl)
  if (variant === "emerald") {
    ink = "#34d996";
  } else if (variant === "cyan" || variant === "blue") {
    ink = "#38bdf8";
  } else if (variant === "violet") {
    ink = "#a78bfa";
  } else if (variant === "amber") {
    ink = "#fbbf24";
  } else if (lower.includes("teammate-dev") || initials.toUpperCase() === "TD") {
    ink = "#38bdf8";
  } else if (lower.includes("teammate-qa") || initials.toUpperCase() === "TQ") {
    ink = "#a78bfa";
  } else if (
    lower.includes("harrymove-ctrl") ||
    initials.toUpperCase() === "HM"
  ) {
    ink = "#34d996";
  }

  const paths = getSignerPaths(rawSeed);
  const dotSize = Math.max(6, Math.min(14, Math.round(size * 0.24)));

  return (
    <span
      role="img"
      aria-label={rawSeed}
      className={className}
      style={{
        position: "relative",
        display: "inline-flex",
        flexShrink: 0,
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: withAlpha(ink, 0.14),
        boxShadow: ring
          ? `0 0 0 2px ${outlineColor}, 0 0 0 3.5px ${ink}`
          : `inset 0 1px 0 ${withAlpha("#ffffff", 0.22)}, 0 0 0 1px ${withAlpha(
              ink,
              0.36
            )}`,
        userSelect: "none",
        ...style,
      }}
    >
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${AVATAR_VIEW} ${AVATAR_VIEW}`}
        shapeRendering="crispEdges"
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          filter: `drop-shadow(0 0 ${Math.max(
            1.5,
            Math.round(size * 0.06)
          )}px ${withAlpha(ink, 0.35)})`,
        }}
      >
        <path d={paths.disc} style={{ fill: ink, opacity: 0.6 }} />
        <path d={paths.face} style={{ fill: ink, opacity: 1 }} />
      </svg>

      {online && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            right: Math.max(0, Math.round(size * 0.02)),
            bottom: Math.max(0, Math.round(size * 0.02)),
            width: dotSize,
            height: dotSize,
            borderRadius: "50%",
            backgroundColor: "#22c55e",
            boxShadow: `0 0 0 2px ${outlineColor}`,
          }}
        />
      )}
    </span>
  );
};

/* ========================================================================== */
/* 3. buildWalrusCollapsePlates()                                             */
/* ========================================================================== */

interface PlushCardPlateProps {
  src: string;
  title: string;
  accent: string;
}

const PlushGlassPlate: React.FC<PlushCardPlateProps> = ({
  src,
  title,
  accent,
}) => (
  <div
    style={{
      position: "relative",
      width: "100%",
      height: "100%",
      borderRadius: 20,
      overflow: "hidden",
      backgroundColor: "rgba(12, 18, 17, 0.92)",
      border: `1.5px solid ${withAlpha(accent, 0.48)}`,
      boxShadow:
        "0 22px 48px rgba(4, 10, 14, 0.46), inset 0 1px 0 rgba(255, 255, 255, 0.24)",
      fontFamily: SNAP_CN_UI.fontFamily,
    }}
  >
    <Img
      src={src}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
      }}
    />
    {/* Bottom cinema gradient vignette for AAA 22px caption contrast */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(180deg, rgba(8, 12, 11, 0.02) 0%, rgba(8, 12, 11, 0.22) 46%, rgba(8, 12, 11, 0.92) 100%)",
      }}
    />
    {/* Bottom >=22px label row */}
    <div
      style={{
        position: "absolute",
        left: 14,
        right: 14,
        bottom: 12,
        display: "flex",
        alignItems: "center",
        gap: 9,
      }}
    >
      <span
        style={{
          width: 9,
          height: 9,
          borderRadius: "50%",
          backgroundColor: accent,
          boxShadow: `0 0 10px ${accent}`,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: 22,
          fontWeight: 680,
          letterSpacing: "-0.02em",
          lineHeight: 1.15,
          color: "#f8fafc",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </span>
    </div>
  </div>
);

interface EngPlateShellProps {
  accent: string;
  title: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}

const EngPlateShell: React.FC<EngPlateShellProps> = ({
  accent,
  title,
  rightSlot,
  children,
}) => (
  <div
    style={{
      position: "relative",
      width: "100%",
      height: "100%",
      boxSizing: "border-box",
      padding: "16px 18px",
      borderRadius: 20,
      backgroundColor: "rgba(13, 19, 18, 0.94)",
      border: "1.5px solid rgba(255, 255, 255, 0.16)",
      boxShadow: `0 22px 48px rgba(4, 10, 14, 0.44), 0 0 0 1px ${withAlpha(
        accent,
        0.24
      )}, inset 0 1px 0 rgba(255, 255, 255, 0.16)`,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      fontFamily: SNAP_CN_UI.fontFamily,
      color: "#f8fafc",
      overflow: "hidden",
    }}
  >
    {/* Top subtle glow wash */}
    <div
      style={{
        position: "absolute",
        top: -28,
        right: -24,
        width: 110,
        height: 110,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${withAlpha(
          accent,
          0.24
        )} 0%, transparent 70%)`,
        pointerEvents: "none",
      }}
    />

    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: accent,
            boxShadow: `0 0 10px ${accent}`,
          }}
        />
        <span
          style={{
            width: 56,
            height: 6,
            borderRadius: 999,
            backgroundColor: withAlpha(accent, 0.36),
          }}
        />
      </span>
      {rightSlot}
    </div>

    <div
      style={{
        fontSize: 23,
        fontWeight: 720,
        letterSpacing: "-0.025em",
        color: "#f8fafc",
        lineHeight: 1.15,
        whiteSpace: "nowrap",
      }}
    >
      {title}
    </div>

    <div>{children}</div>
  </div>
);

export function buildWalrusCollapsePlates(): CollapsePlateItem[] {
  return [
    {
      id: "plush-skill-hub",
      angleDeg: 18,
      distance: 548,
      width: 266,
      height: 152,
      rotateDeg: 3,
      render: () => (
        <PlushGlassPlate
          src={staticFile("plush/walrus-mascot-1-skill-hub.jpg")}
          title="Skill Hub"
          accent="#34d996"
        />
      ),
    },
    {
      id: "eng-skill-grpc",
      angleDeg: 52,
      distance: 345,
      width: 266,
      height: 152,
      rotateDeg: -2.5,
      render: () => (
        <EngPlateShell
          accent="#34d996"
          title="SKILL.md · Sui gRPC"
          rightSlot={<WalrusLogo3DVideo size={28} color="#34d996" glow={false} />}
        >
          <div style={{ display: "flex", gap: 8 }}>
            <div
              style={{
                flex: 1,
                height: 8,
                borderRadius: 999,
                background: "linear-gradient(90deg, #34d996, rgba(52,217,150,0.28))",
              }}
            />
            <div
              style={{
                width: 68,
                height: 8,
                borderRadius: 999,
                backgroundColor: "rgba(255, 255, 255, 0.14)",
              }}
            />
          </div>
        </EngPlateShell>
      ),
    },
    {
      id: "plush-memory-vault",
      angleDeg: 128,
      distance: 345,
      width: 266,
      height: 152,
      rotateDeg: 2.5,
      render: () => (
        <PlushGlassPlate
          src={staticFile("plush/walrus-mascot-2-memory-vault.jpg")}
          title="Memory Vault"
          accent="#2dd4bf"
        />
      ),
    },
    {
      id: "eng-delegate-key",
      angleDeg: 162,
      distance: 548,
      width: 266,
      height: 152,
      rotateDeg: 3,
      render: () => (
        <EngPlateShell
          accent="#38bdf8"
          title="Delegate Key"
          rightSlot={
            <SignerOrbVideo
              handle="@harrymove-ctrl"
              variant="emerald"
              size={28}
              online={true}
            />
          }
        >
          <div style={{ display: "flex", gap: 8 }}>
            <div
              style={{
                width: "72%",
                height: 8,
                borderRadius: 999,
                background: "linear-gradient(90deg, #38bdf8, #34d996)",
              }}
            />
            <div
              style={{
                flex: 1,
                height: 8,
                borderRadius: 999,
                backgroundColor: "rgba(56, 189, 248, 0.18)",
              }}
            />
          </div>
        </EngPlateShell>
      ),
    },
    {
      id: "plush-skill-recall",
      angleDeg: 198,
      distance: 548,
      width: 266,
      height: 152,
      rotateDeg: -3,
      render: () => (
        <PlushGlassPlate
          src={staticFile("plush/walrus-mascot-4-skill-recall.jpg")}
          title="Skill Recall"
          accent="#34d996"
        />
      ),
    },
    {
      id: "eng-walrus-blob",
      angleDeg: 232,
      distance: 345,
      width: 266,
      height: 152,
      rotateDeg: -2.5,
      render: () => (
        <EngPlateShell
          accent="#2dd4bf"
          title="Walrus Blob"
          rightSlot={<WalrusLogo3DVideo size={28} color="#2dd4bf" glow={false} />}
        >
          <div
            style={{
              height: 8,
              borderRadius: 999,
              backgroundColor: "rgba(255, 255, 255, 0.10)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: "92%",
                height: "100%",
                borderRadius: 999,
                background: "linear-gradient(90deg, #10b981, #2dd4bf)",
              }}
            />
          </div>
        </EngPlateShell>
      ),
    },
    {
      id: "plush-eval-arena",
      angleDeg: 308,
      distance: 345,
      width: 266,
      height: 152,
      rotateDeg: -2,
      render: () => (
        <PlushGlassPlate
          src={staticFile("plush/walrus-plush-eval-arena.jpg")}
          title="Eval Arena"
          accent="#a78bfa"
        />
      ),
    },
    {
      id: "eng-eval-pass-rate",
      angleDeg: 342,
      distance: 548,
      width: 266,
      height: 152,
      rotateDeg: 3,
      render: () => (
        <EngPlateShell
          accent="#a78bfa"
          title="PASS · Walrus Recall"
          rightSlot={
            <SignerOrbVideo
              handle="@teammate-qa"
              variant="violet"
              size={28}
              online={true}
            />
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              style={{
                width: "38%",
                height: 6,
                borderRadius: 999,
                backgroundColor: "rgba(148, 163, 184, 0.45)",
              }}
            />
            <div
              style={{
                width: "96%",
                height: 7,
                borderRadius: 999,
                background: "linear-gradient(90deg, #34d996, #a78bfa)",
              }}
            />
          </div>
        </EngPlateShell>
      ),
    },
  ];
}
