import type React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export interface CollapsePlateItem {
  id: string;
  angleDeg: number;
  distance: number;
  width: number;
  height: number;
  rotateDeg?: number;
  render: () => React.ReactNode;
}

export interface LogoCollapseProps {
  plates: CollapsePlateItem[];
  collapseStart?: number;
  collapseDuration?: number;
  logoContent: React.ReactNode;
  subcopyContent?: React.ReactNode;
}

export const LogoCollapse: React.FC<LogoCollapseProps> = ({
  plates,
  collapseStart = 38,
  collapseDuration = 34,
  logoContent,
  subcopyContent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoRevealStart = collapseStart + collapseDuration - 8;
  const logoSpring = spring({
    frame: Math.max(0, frame - logoRevealStart),
    fps,
    config: { damping: 14, stiffness: 195, mass: 0.72 },
  });

  const shockwaveT = interpolate(
    frame,
    [logoRevealStart, logoRevealStart + 28],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const subcopySpring = spring({
    frame: Math.max(0, frame - (logoRevealStart + 14)),
    fps,
    config: { damping: 18, stiffness: 140, mass: 0.8 },
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/*Scattered product/plush plates floating then collapsing inward*/}
      {plates.map((plate, index) => {
        const enterSpring = spring({
          frame: Math.max(0, frame - index * 2),
          fps,
          config: { damping: 18, stiffness: 120, mass: 0.85 },
        });

        const staggerOffset = (index % 4) * 2;
        const collapseT = interpolate(
          frame,
          [
            collapseStart + staggerOffset,
            collapseStart + collapseDuration + staggerOffset,
          ],
          [0, 1],
          {
            easing: Easing.in(Easing.cubic),
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }
        );

        const rad = (plate.angleDeg * Math.PI) / 180;
        const floatDrift = Math.sin((frame + index * 19) * 0.08) * 8 * (1 - collapseT);
        const radius = plate.distance * (1 - collapseT);
        const x = Math.cos(rad) * radius;
        const y = Math.sin(rad) * radius + floatDrift;

        const scale =
          interpolate(enterSpring, [0, 1], [0.78, 1]) *
          interpolate(collapseT, [0, 0.8, 1], [1, 0.45, 0.05]);
        const opacity =
          interpolate(enterSpring, [0, 1], [0, 1]) *
          interpolate(collapseT, [0, 0.78, 1], [1, 0.85, 0]);
        const rot = (plate.rotateDeg ?? 0) * (1 - collapseT * 0.65);

        if (opacity <= 0.01) return null;

        return (
          <div
            key={plate.id}
            style={{
              position: "absolute",
              width: plate.width,
              height: plate.height,
              transform: `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${scale})`,
              opacity,
              zIndex: 10 + index,
            }}
          >
            {plate.render()}
          </div>
        );
      })}

      {/*Implosion emerald shockwave ring*/}
      {frame >= logoRevealStart && shockwaveT < 1 && (
        <div
          style={{
            position: "absolute",
            width: 560,
            height: 560,
            borderRadius: "50%",
            border: "2.5px solid rgba(52, 217, 150, 0.65)",
            transform: `scale(${0.18 + shockwaveT * 1.35})`,
            opacity: 1 - shockwaveT,
            pointerEvents: "none",
            zIndex: 25,
          }}
        />
      )}

      {/*Center Brand Mark + Wordmark*/}
      {frame >= logoRevealStart - 2 && (
        <div
          style={{
            position: "relative",
            zIndex: 30,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
            transform: `scale(${interpolate(logoSpring, [0, 1], [0.42, 1])})`,
            opacity: interpolate(logoSpring, [0, 0.5, 1], [0, 1, 1]),
          }}
        >
          {logoContent}
          {subcopyContent && (
            <div
              style={{
                opacity: subcopySpring,
                transform: `translateY(${interpolate(subcopySpring, [0, 1], [18, 0])}px)`,
              }}
            >
              {subcopyContent}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
