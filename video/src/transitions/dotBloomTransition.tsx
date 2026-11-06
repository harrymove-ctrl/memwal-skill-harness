import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import { PALETTE } from "../palette";

export interface DotBloomProps extends Record<string, unknown> {
  accentColor?: string;
  secondaryColor?: string;
}

const DotBloomPresentation: React.FC<
  TransitionPresentationComponentProps<DotBloomProps>
> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const accent = passedProps.accentColor ?? PALETTE.mint;
  const secondary = passedProps.secondaryColor ?? PALETTE.teal;

  if (presentationDirection === "exiting") {
    const outOpacity = interpolate(presentationProgress, [0.35, 0.85], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return <AbsoluteFill style={{ opacity: outOpacity }}>{children}</AbsoluteFill>;
  }

  // Entering scene: circular iris clip + `@snapcn/DotBloom` halftone wavefront
  const clipRadiusPct = interpolate(presentationProgress, [0, 1], [0, 145], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const waveRadiusPx = presentationProgress * 1240;
  const bandWidth = 220;
  const waveEnvelope = interpolate(
    presentationProgress,
    [0, 0.18, 0.82, 1],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const cols = 24;
  const rows = 14;

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          clipPath: `circle(${clipRadiusPct.toFixed(2)}% at 50% 50%)`,
        }}
      >
        {children}
      </AbsoluteFill>

      {waveEnvelope > 0.01 && (
        <svg
          width={1920}
          height={1080}
          viewBox="0 0 1920 1080"
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          {Array.from({ length: rows }).map((_, r) =>
            Array.from({ length: cols }).map((__, c) => {
              const x = (c + 0.5) * (1920 / cols);
              const y = (r + 0.5) * (1080 / rows);
              const d = Math.hypot(x - 960, y - 540);
              const w = Math.max(0, 1 - Math.abs(d - waveRadiusPx) / bandWidth);
              if (w <= 0.05) return null;
              const rad = 2.5 + w * 9.5;
              return (
                <circle
                  key={`${r}-${c}`}
                  cx={x}
                  cy={y}
                  r={rad}
                  fill={(r + c) % 2 === 0 ? accent : secondary}
                  opacity={w * waveEnvelope * 0.58}
                />
              );
            })
          )}
        </svg>
      )}
    </AbsoluteFill>
  );
};

export function dotBloom(
  props: DotBloomProps = {}
): TransitionPresentation<DotBloomProps> {
  return {
    component: DotBloomPresentation,
    props,
  };
}
