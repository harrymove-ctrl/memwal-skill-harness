"use client";

import { cssColor, DitherShader } from "@/lib/dither";
import type {
  DitherColor,
  DitherMatrix,
  DitherPalette,
  DitherShaderProps,
} from "@/lib/dither";

export type BlueprintDitherMode = "contours" | "glow" | "blueprint";

const MODE_INDEX: Record<BlueprintDitherMode, number> = {
  contours: 0,
  glow: 1,
  blueprint: 2,
};

/**
 * Custom GLSL field built on DitherShader for Skillbook:
 * - Mode 0 ("contours"): Topographic elevation lines with 5th-line index emphasis
 *   and gentle hillshade.
 * - Mode 1 ("glow"): Corner/edge dithered spotlight with drifting FBM clouds.
 * - Mode 2 ("blueprint"): Concentric Walrus Seal rings + drafting grid ticks.
 *
 * Text & interactive controls sit on clear ground (quality.md >= 4.5:1 contrast):
 * when `bpClearText > 0.5`, the left copy column and bottom button strip fade
 * smoothly to 0 so the dither frames the top-right atmospheric area cleanly.
 */
const FIELD = `
float bpHeight(vec2 p, float t) {
  vec2 drift = vec2(t * 0.018, -t * 0.011);
  vec2 w = p + drift;
  return 0.5
    + 0.34 * snoise(w * 0.95)
    + 0.16 * snoise(w * 2.05 + vec2(3.7, 1.9));
}

float bpContour(float h, float hx, float hy, float count, float width) {
  float v = h * count;
  float offset = abs(fract(v + 0.5) - 0.5);
  float perCell = max(length(vec2(hx - h, hy - h)) * count, 1e-4);
  float d = offset / perCell;
  float line = 1.0 - smoothstep(width * 0.5 - 0.5, width * 0.5 + 0.5, d);
  return line * (1.0 - smoothstep(0.065, 0.11, offset));
}

float field(vec2 uv, vec2 res, float t) {
  float aspect = res.x / res.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  vec2 focus = vec2(bpFocus.x * aspect, 1.0 - bpFocus.y);

  // Clear the left reading zone and bottom button strip so text stays > 4.5:1 contrast
  float rightMask = smoothstep(0.38, 0.72, uv.x);
  float topMask = smoothstep(0.18, 0.48, uv.y);
  float textClear = mix(1.0, rightMask * mix(0.35, 1.0, topMask), bpClearText);

  if (bpMode < 0.5) {
    // Mode 0: Topographic Contours + Index Lines + Hillshade
    vec2 sp = p * bpScale;
    float stepCell = bpScale / max(res.y, 1.0);
    float h = bpHeight(sp, t);
    float hx = bpHeight(sp + vec2(stepCell, 0.0), t);
    float hy = bpHeight(sp + vec2(0.0, stepCell), t);

    float minorLines = bpContour(h, hx, hy, 9.0, 1.3);
    float majorLines = bpContour(h, hx, hy, 2.25, 2.0);
    float shade = clamp((hx - h) * 14.0 + 0.16 * h, 0.0, 0.28);

    float tone = max(minorLines * 0.58, majorLines * 0.88) + shade * 0.38;
    return clamp(tone * bpIntensity * textClear, 0.0, 0.82);
  }

  if (bpMode < 1.5) {
    // Mode 1: Dithered Spotlight + FBM Cloud Drift
    float distSq = dot(p - focus, p - focus);
    float spotlight = exp(-distSq * bpTightness);
    float clouds = fbm(p * (bpScale * 1.35) + vec2(t * 0.028, -t * 0.016));
    float edgeRamp = smoothstep(0.45, 0.98, uv.x) * 0.28 * smoothstep(0.2, 0.9, uv.y);
    float tone = (spotlight * mix(0.5, 1.15, clouds) + edgeRamp) * bpIntensity;
    return clamp(tone * textClear, 0.0, 0.8);
  }

  // Mode 2: Blueprint Seal Rings + Orthographic Grid Crosshairs
  float dFocus = length(p - focus);
  float wave = fract(dFocus * (bpScale * 2.2) - t * 0.05);
  float ring = exp(-pow((wave - 0.5) * 6.8, 2.0));
  float coreGlow = exp(-dFocus * dFocus * (bpTightness * 0.85));

  vec2 gridUv = fract(uv * res / 24.0 + 0.5) - 0.5;
  float gridTick = (1.0 - smoothstep(0.0, 1.3 / 24.0, abs(gridUv.x)))
                 * (1.0 - smoothstep(0.0, 4.2 / 24.0, abs(gridUv.y)))
                 + (1.0 - smoothstep(0.0, 4.2 / 24.0, abs(gridUv.x)))
                 * (1.0 - smoothstep(0.0, 1.3 / 24.0, abs(gridUv.y)));

  float tone = (ring * 0.62 + coreGlow * 0.48 + clamp(gridTick, 0.0, 1.0) * 0.32) * bpIntensity;
  return clamp(tone * textClear, 0.0, 0.8);
}
`;

export type BlueprintDitherBackgroundProps = Omit<
  DitherShaderProps,
  "field" | "uniforms" | "fallback" | "palette"
> & {
  /** Field style: topographic "contours", soft "glow", or CAD "blueprint" rings. */
  mode?: BlueprintDitherMode;
  /** Primary ink colour from the dithercn palette or CSS variable. Default "ink". */
  color?: DitherColor;
  /** Optional custom palette tuple; overrides `color` when provided. */
  palette?: DitherPalette;
  /** Focus point `[x, y]` from top-left in [0, 1]. Default `[0.86, 0.28]`. */
  focus?: readonly [number, number];
  /** Peak tone multiplier in [0, 1]. Default `0.64`. */
  intensity?: number;
  /** Spatial scale of contours/clouds/rings. Default `1.65`. */
  scale?: number;
  /** Spotlight tightness. Default `2.2`. */
  tightness?: number;
  /** Whether to attenuate dots in the left reading zone & bottom bar. Default `true`. */
  clearTextZone?: boolean;
};

export function BlueprintDitherBackground({
  mode = "contours",
  color = "ink",
  palette,
  focus = [0.86, 0.28],
  intensity = 0.64,
  scale = 1.65,
  tightness = 2.2,
  clearTextZone = true,
  matrix = "bayer4" as DitherMatrix,
  cell = 3,
  stillTime = 6,
  className,
  ...props
}: BlueprintDitherBackgroundProps) {
  const resolvedPalette: DitherPalette = palette ?? ["--dither-paper", color];
  const inkCss = cssColor(resolvedPalette.at(-1) ?? color);
  const paperCss = cssColor(resolvedPalette[0]);

  return (
    <DitherShader
      {...props}
      className={className ?? "absolute inset-0 -z-10"}
      field={FIELD}
      palette={resolvedPalette}
      matrix={matrix}
      cell={cell}
      stillTime={stillTime}
      uniforms={{
        bpMode: MODE_INDEX[mode],
        bpFocus: focus,
        bpIntensity: intensity,
        bpScale: scale,
        bpTightness: tightness,
        bpClearText: clearTextZone ? 1 : 0,
      }}
      fallback={
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: paperCss,
            backgroundImage: `radial-gradient(ellipse at ${focus[0] * 100}% ${
              focus[1] * 100
            }%, color-mix(in oklch, ${inkCss} 24%, transparent), transparent 70%)`,
          }}
        />
      }
    />
  );
}
export default BlueprintDitherBackground;
