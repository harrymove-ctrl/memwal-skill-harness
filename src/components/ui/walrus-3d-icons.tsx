import React, { useId } from "react";
import { Avatar, AvatarGroup } from "@/components/dithercn/avatar";
import { bloomStyle, cssColor } from "@/lib/dither";
import type { DitherColor } from "@/lib/dither";
import { LogoMark } from "@/shell/Logo";

export { Avatar, AvatarGroup, LogoMark };

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const WalrusLogo3D: React.FC<{
  size?: "sm" | "md" | "lg" | number;
  color?: DitherColor;
  className?: string;
}> = ({ size = "md", className }) => {
  const dim =
    typeof size === "number"
      ? size
      : size === "sm"
        ? 26
        : size === "lg"
          ? 36
          : 30;

  return (
    <span
      role="img"
      aria-label="Skillbook"
      className={cx(
        "relative inline-flex shrink-0 items-center justify-center select-none",
        className
      )}
      style={{ width: dim, height: dim }}
    >
      <LogoMark size={dim} glint className="cc-brand__mark" />
    </span>
  );
};

/**
 * Generative Dither Avatar for all User & Signer Profiles (`@harrymove-ctrl`, `@teammate-dev`, `@teammate-qa`, `0x...`)
 * Powered by `components/dithercn/avatar.tsx`: draws a deterministic mirrored 5x5 Bayer-dithered
 * pixel face on a 3D top-left lit dithered disc instead of plain 2-letter text initials (`TD`, `HM`).
 */
export const SignerOrb3D: React.FC<{
  initials?: string;
  handle?: string;
  variant?: "emerald" | "cyan" | "amber" | "violet" | "auto";
  size?: "sm" | "md" | "lg" | number;
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
  const lower = seedName.toLowerCase();

  let hash = 0;
  for (let i = 0; i < lower.length; i++) {
    hash = (hash * 31 + lower.charCodeAt(i)) >>> 0;
  }
  const palette: readonly DitherColor[] = ["green", "blue", "purple", "orange", "pink"];

  const ditherColor: DitherColor =
    variant === "emerald"
      ? "green"
      : variant === "cyan"
        ? "blue"
        : variant === "violet"
          ? "purple"
          : variant === "amber"
            ? "orange"
            : lower.includes("harrymove-ctrl") || initials === "HM"
              ? "green"
              : lower.includes("ducnmm") || lower.includes("teammate-dev") || initials === "TD"
                ? "blue"
                : lower.includes("teammate-qa") || initials === "TQ"
                  ? "purple"
                  : lower.includes("mysten")
                    ? "orange"
                    : palette[hash % palette.length] ?? "green";

  const pxSize =
    typeof size === "number"
      ? size
      : size === "sm"
        ? 22
        : size === "lg"
          ? 36
          : 28;

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
 * Distinct 3D-lit Agent Brand Badge for Coding Agents (`Claude Code`, `Cursor`, `Codex`, `Antigravity`, `Tatum AI`).
 * Pure SVG with `aria-hidden="true"` and zero text nodes so DOM text assertions stay untouched.
 */
export const AgentBrandLogo: React.FC<{
  agent: string;
  size?: number;
  className?: string;
}> = ({ agent, size = 28, className }) => {
  const id = agent.trim().toLowerCase();
  const isClaude = id.includes("claude");
  const isCursor = id.includes("cursor");
  const isCodex = id.includes("codex") || id.includes("openai");
  const isAntigravity = id.includes("antigravity") || id.includes("gemini");
  const isTatum = id.includes("tatum");

  const accent = isClaude
    ? "#fb923c"
    : isCursor
      ? "#38bdf8"
      : isCodex
        ? "#34d399"
        : isAntigravity
          ? "#a78bfa"
          : isTatum
            ? "#60a5fa"
            : "#2dd4bf";

  return (
    <span
      aria-hidden="true"
      className={cx("cc-agent-logo relative inline-flex shrink-0 items-center justify-center rounded-full select-none", className)}
      style={{
        width: size,
        height: size,
        backgroundColor: `color-mix(in oklab, ${accent} 14%, rgba(12, 16, 14, 0.85))`,
        boxShadow: `inset 0 1px 0 color-mix(in oklab, ${accent} 42%, white), 0 0 0 1px color-mix(in oklab, ${accent} 36%, transparent), 0 0 12px -3px color-mix(in oklab, ${accent} 45%, transparent)`,
      }}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        width={Math.round(size * 0.64)}
        height={Math.round(size * 0.64)}
        fill="none"
        className="cc-agent-logo__svg"
      >
        {isClaude ? (
          /* Claude Code starburst spark */
          <g stroke={accent} strokeWidth="2.1" strokeLinecap="round">
            <path d="M12 3.2v17.6M3.2 12h17.6M5.8 5.8l12.4 12.4M18.2 5.8L5.8 18.2" />
            <circle cx="12" cy="12" r="2.6" fill={accent} stroke="none" />
          </g>
        ) : isCursor ? (
          /* Cursor isometric cube + pointer */
          <g>
            <path
              d="M12 3.2L20 7.8v8.4L12 20.8 4 16.2V7.8L12 3.2Z"
              stroke={accent}
              strokeWidth="1.75"
              strokeLinejoin="round"
              fill={accent}
              fillOpacity="0.16"
            />
            <path
              d="M9.2 8.2l7.4 3.6-3.4 1.1-1.2 3.5-2.8-8.2Z"
              fill={accent}
            />
          </g>
        ) : isCodex ? (
          /* Codex hexagonal terminal prompt */
          <g>
            <path
              d="M12 2.8l8.2 4.7v9L12 21.2 3.8 16.5v-9L12 2.8Z"
              stroke={accent}
              strokeWidth="1.75"
              strokeLinejoin="round"
              fill={accent}
              fillOpacity="0.14"
            />
            <path
              d="M8.5 9.5L11.5 12l-3 2.5M12.8 14.5h3"
              stroke={accent}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        ) : isAntigravity ? (
          /* Antigravity orbital four-point star + ring */
          <g>
            <ellipse
              cx="12"
              cy="12"
              rx="8.8"
              ry="4.2"
              transform="rotate(-28 12 12)"
              stroke={accent}
              strokeWidth="1.5"
              strokeOpacity="0.72"
            />
            <path
              d="M12 3.5c1.4 4.8 3.7 7.1 8.5 8.5-4.8 1.4-7.1 3.7-8.5 8.5-1.4-4.8-3.7-7.1-8.5-8.5 4.8-1.4 7.1-3.7 8.5-8.5Z"
              fill={accent}
            />
          </g>
        ) : (
          /* Tatum AI / Generic geometric lightning cube */
          <g>
            <rect
              x="4"
              y="4"
              width="16"
              height="16"
              rx="4.5"
              stroke={accent}
              strokeWidth="1.75"
              fill={accent}
              fillOpacity="0.14"
            />
            <path
              d="M13.2 6.8L8.4 13h3.6l-.8 4.2 4.8-6.2h-3.6l.8-4.2Z"
              fill={accent}
            />
          </g>
        )}
      </svg>
    </span>
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
