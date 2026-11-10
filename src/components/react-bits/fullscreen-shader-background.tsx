"use client";

import React from "react";
import ChromaCurrent, { type ChromaCurrentPattern } from "./chroma-current";
import {
  BlueprintDitherBackground,
  type BlueprintDitherMode,
} from "../dithercn/blueprint-dither-bg";

export type ShaderPlaceHint =
  | "home"
  | "skills"
  | "try"
  | "team"
  | "agents"
  | "landing"
  | null;

export interface FullscreenShaderBackgroundProps {
  isDark?: boolean;
  place?: ShaderPlaceHint;
  pattern?: ChromaCurrentPattern;
  ditherMode?: BlueprintDitherMode;
  className?: string;
  variant?: "viewport" | "stage";
}

const PLACE_PATTERN: Record<NonNullable<ShaderPlaceHint>, ChromaCurrentPattern> = {
  landing: "streams",
  home: "streams",
  skills: "contours",
  try: "waves",
  team: "radial",
  agents: "vortex",
};

const PLACE_DITHER: Record<NonNullable<ShaderPlaceHint>, BlueprintDitherMode> = {
  landing: "contours",
  home: "contours",
  skills: "blueprint",
  try: "glow",
  team: "blueprint",
  agents: "contours",
};

/**
 * Full-viewport multi-layer animated background combining:
 * 1. React Bits Pro's ChromaCurrent ("Currents of light flowing across a grid of glowing dots")
 * 2. DitherCN's BlueprintDitherBackground (Bayer-4x4 topographic contours & Walrus Seal rings)
 * 3. Breathing Walrus emerald-teal-cyan aurora plumes + orthographic grid framing
 */
export const FullscreenShaderBackground: React.FC<
  FullscreenShaderBackgroundProps
> = ({
  isDark = true,
  place = null,
  pattern,
  ditherMode,
  className = "",
  variant = "viewport",
}) => {
  if (variant === "stage") {
    return null;
  }

  const resolvedPattern =
    pattern ?? (place ? PLACE_PATTERN[place] : "streams");
  const resolvedDither =
    ditherMode ?? (place ? PLACE_DITHER[place] : "contours");

  return (
    <div
      aria-hidden="true"
      data-testid="ambient-shader-bg"
      data-pattern={resolvedPattern}
      data-dither={resolvedDither}
      className={`cc-ambient-bg pointer-events-none fixed inset-0 z-0 overflow-hidden ${className}`}
    >
      {/* Layer 1: Interactive WebGL ChromaCurrent dot-stream fluid field */}
      <div
        className="absolute inset-0"
        style={{ opacity: isDark ? 0.64 : 0.48 }}
      >
        <ChromaCurrent
          colors={isDark ? ["#34d996", "#00e5d6"] : ["#059669", "#0d9488"]}
          backgroundColor={isDark ? "#0b0f0e" : "#f1f2ee"}
          pattern={resolvedPattern}
          pitch={8}
          dotSize={0.64}
          variance={0.38}
          shape="circle"
          baseDots={isDark ? 0.15 : 0.11}
          stretch={0.26}
          streams={5}
          spread={0.58}
          speed={0.72}
          turbulence={0.68}
          trail={0.72}
          intensity={isDark ? 1.24 : 1.05}
          bloom={isDark ? 0.74 : 0.42}
          grain={0.12}
          interactive={true}
          stir={1.25}
          plume={1.3}
          intro={false}
          className="h-full w-full"
        />
      </div>

      {/* Layer 2: DitherCN Bayer-4x4 Topographic Contours & Walrus Seal Rings */}
      <div
        className="absolute inset-0"
        style={{
          opacity: isDark ? 0.38 : 0.26,
          mixBlendMode: isDark ? "screen" : "multiply",
        }}
      >
        <BlueprintDitherBackground
          mode={resolvedDither}
          palette={
            isDark
              ? ["#0b0f0e", "#10b981", "#2dd4bf"]
              : ["#f1f2ee", "#047857", "#0d9488"]
          }
          focus={[0.84, 0.24]}
          intensity={isDark ? 0.58 : 0.44}
          scale={1.65}
          tightness={2.1}
          clearTextZone={true}
          cell={3}
          className="absolute inset-0 h-full w-full"
        />
      </div>

      {/* Layer 3: Breathing Walrus Emerald & Cyan Aurora Plumes + Blueprint Grid */}
      <div className="cc-ambient-aurora" />
      <div className="cc-ambient-grid" />
    </div>
  );
};

export default FullscreenShaderBackground;
