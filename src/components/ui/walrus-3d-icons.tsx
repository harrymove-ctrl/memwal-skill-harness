import React, { useId } from "react";
import { Avatar, AvatarGroup } from "@/components/dithercn/avatar";
import { bloomStyle, cssColor, isInked } from "@/lib/dither";
import type { DitherColor } from "@/lib/dither";

export { Avatar, AvatarGroup };

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Transparent 3D Bayer-Dithered Walrus Memory Brand Mark
 * Built directly on the dithercn engine (`isInked("bayer4")` + `bloomStyle`).
 */
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

function buildWalrusDitherPaths(): { disc: string; markFull: string; markShade: string } {
  let disc = "";
  let markFull = "";
  let markShade = "";

  for (let y = 0; y < WALRUS_LOGO_VIEW; y += 1) {
    for (let x = 0; x < WALRUS_LOGO_VIEW; x += 1) {
      const bx = Math.floor((x - 0) / 2);
      const by = Math.floor((y - 4) / 2);
      const inW = WALRUS_W_BITMAP[by]?.[bx] === "1";

      if (inW) {
        // Top-lit 3D dither ramp across the W bars
        const vGrad = 1 - Math.max(0, (y - 6) / 18) * 0.45;
        if (vGrad >= 0.78) {
          markFull += `M${x} ${y}h1v1h-1z`;
        } else if (isInked("bayer4", x, y, 0.75)) {
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
        if (isInked("bayer4", x, y, tone)) {
          disc += `M${x} ${y}h1v1h-1z`;
        }
      }
    }
  }
  return { disc, markFull, markShade };
}

const WALRUS_PATHS = buildWalrusDitherPaths();

export const WalrusLogo3D: React.FC<{
  size?: "sm" | "md" | "lg";
  color?: DitherColor;
  className?: string;
}> = ({ size = "md", color = "green", className }) => {
  const dim = size === "sm" ? 26 : size === "lg" ? 36 : 30;
  const ink = cssColor(color);

  return (
    <span
      role="img"
      aria-label="Walrus Memory"
      className={cx(
        "relative inline-flex shrink-0 items-center justify-center rounded-[24%] select-none",
        className
      )}
      style={{
        width: dim,
        height: dim,
        backgroundColor: `color-mix(in oklab, ${ink} 12%, transparent)`,
        boxShadow: `inset 0 1px 0 color-mix(in oklab, ${ink} 38%, white), 0 0 0 1px color-mix(in oklab, ${ink} 34%, transparent)`,
      }}
    >
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${WALRUS_LOGO_VIEW} ${WALRUS_LOGO_VIEW}`}
        shapeRendering="crispEdges"
        className="size-full rounded-[24%]"
        style={bloomStyle(color, "low")}
      >
        <path d={WALRUS_PATHS.disc} style={{ fill: ink, opacity: 0.55 }} />
        <path d={WALRUS_PATHS.markShade} style={{ fill: ink, opacity: 0.78 }} />
        <path d={WALRUS_PATHS.markFull} style={{ fill: ink, opacity: 1 }} />
      </svg>
    </span>
  );
};

/**
 * Generative Dither Avatar for all User & Signer Profiles (`@harrymove-ctrl`, `@teammate-dev`, `@teammate-qa`)
 * Powered by `components/dithercn/avatar.tsx`: draws a deterministic mirrored 5x5 Bayer-dithered
 * pixel face on a 3D top-left lit dithered disc instead of plain 2-letter text initials (`TD`, `HM`).
 */
export const SignerOrb3D: React.FC<{
  initials?: string;
  handle?: string;
  variant?: "emerald" | "cyan" | "amber" | "violet" | "auto";
  size?: "sm" | "md" | "lg";
  online?: boolean;
  ring?: boolean;
  className?: string;
}> = ({
  initials = "walrus",
  handle = "",
  variant = "auto",
  size = "md",
  online = true,
  ring = false,
  className,
}) => {
  const seedName = handle.trim() || initials.trim() || "walrus-user";

  const ditherColor: DitherColor =
    variant === "emerald"
      ? "green"
      : variant === "cyan"
        ? "blue"
        : variant === "violet"
          ? "purple"
          : variant === "amber"
            ? "orange"
            : seedName.includes("harrymove-ctrl") || initials === "HM"
              ? "green"
              : seedName.includes("teammate-dev") || initials === "TD"
                ? "blue"
                : seedName.includes("teammate-qa") || initials === "TQ"
                  ? "purple"
                  : "green";

  const pxSize = size === "sm" ? 22 : size === "lg" ? 36 : 28;

  return (
    <Avatar
      name={seedName}
      label={seedName}
      size={pxSize}
      color={ditherColor}
      fill="gradient"
      shape="circle"
      ring={ring}
      status={online ? "online" : undefined}
      bloom="low"
      className={className}
    />
  );
};

/**
 * Transparent 3D Bayer-Dithered Bucket Folder Icon
 * Uses dithercn Bayer matrix cells + crisp edges instead of OS folder emojis.
 */
export const BucketFolder3DIcon: React.FC<{
  active?: boolean;
  size?: number;
  className?: string;
}> = ({ active = false, size = 18, className }) => {
  const uid = useId().replace(/:/g, "");
  const color: DitherColor = active ? "green" : "grey";
  const ink = cssColor(color);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      shapeRendering="crispEdges"
      className={cx("shrink-0", className)}
      style={active ? bloomStyle("green", "low") : undefined}
      aria-hidden="true"
    >
      <defs>
        <pattern
          id={`bkt-dither-${uid}`}
          width="4"
          height="4"
          patternUnits="userSpaceOnUse"
        >
          <rect x="0" y="0" width="1" height="1" fill={ink} fillOpacity={active ? "0.85" : "0.45"} />
          <rect x="2" y="0" width="1" height="1" fill={ink} fillOpacity={active ? "0.55" : "0.25"} />
          <rect x="1" y="1" width="1" height="1" fill={ink} fillOpacity={active ? "0.7" : "0.35"} />
          <rect x="3" y="1" width="1" height="1" fill={ink} fillOpacity={active ? "0.4" : "0.2"} />
          <rect x="0" y="2" width="1" height="1" fill={ink} fillOpacity={active ? "0.65" : "0.3"} />
          <rect x="2" y="2" width="1" height="1" fill={ink} fillOpacity={active ? "0.9" : "0.5"} />
          <rect x="1" y="3" width="1" height="1" fill={ink} fillOpacity={active ? "0.45" : "0.2"} />
        </pattern>
      </defs>
      {/* Back folder tab */}
      <path
        d="M3 5H10L12 7H21V19H3V5Z"
        fill={`url(#bkt-dither-${uid})`}
        stroke={ink}
        strokeOpacity={active ? "0.9" : "0.45"}
        strokeWidth="1.4"
      />
      {/* Front lit plate */}
      <path
        d="M3 10H21V19H3V10Z"
        fill={ink}
        fillOpacity={active ? "0.26" : "0.12"}
        stroke={ink}
        strokeOpacity={active ? "1" : "0.55"}
        strokeWidth="1.4"
      />
    </svg>
  );
};
