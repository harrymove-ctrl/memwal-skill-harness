import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ChromaCurrentBackdrop } from "../components/backgrounds/ChromaCurrentBackdrop";
import { WordGather } from "../components/snapcn/WordGather";
import { PALETTE } from "../palette";

/**
 * Scene 1 (0.0s–6.5s, 195f): OriginKit Atmospheric `CloudSky` + `@snapcn/WordGather`
 * Daylight sky (`bootSkyTop` -> `bootSkyBottom`) with drifting volumetric cumulus layers
 * warming seamlessly into Sorbet `#f5f6f1` studio paper ahead of DROP A at f=180.
 */
export const OriginCloudHookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const skyWarmMix = interpolate(frame, [130, 185], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  const cloudDriftSlow = (frame / fps) * 20;
  const cloudDriftMid = (frame / fps) * 34;
  const cloudDriftFast = (frame / fps) * 50;

  const pillSpring = spring({
    frame,
    fps,
    config: { damping: 20, stiffness: 160, mass: 0.8 },
  });

  const subOpacity = interpolate(frame, [62, 84], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subY = interpolate(frame, [62, 84], [14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: PALETTE.shaderCanvasLight,
        overflow: "hidden",
        fontFamily: PALETTE.fontSans,
      }}
    >
      <ChromaCurrentBackdrop mode="light" />

      {/* OriginKit Daylight Atmospheric CloudSky Layer */}
      <AbsoluteFill style={{ opacity: 1 - skyWarmMix * 0.76 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(180deg, #60a5fa 0%, ${PALETTE.bootSkyTop} 42%, #e0f2fe 70%, ${PALETTE.bootSkyBottom} 96%)`,
          }}
        />

        {/* Sunlit upper glow */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "-18%",
            width: 1280,
            height: 680,
            transform: "translateX(-50%)",
            background:
              "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.76) 0%, rgba(255, 255, 255, 0.20) 48%, rgba(255, 255, 255, 0) 76%)",
          }}
        />

        {/* Far cumulus horizon bank */}
        <svg
          width={2400}
          height={1080}
          viewBox="0 0 2400 1080"
          style={{
            position: "absolute",
            left: -240 + cloudDriftSlow,
            top: 0,
            opacity: 0.74,
          }}
        >
          <defs>
            <linearGradient id="cloudGradFar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.96" />
              <stop
                offset="100%"
                stopColor={PALETTE.bootSkyBottom}
                stopOpacity="0.84"
              />
            </linearGradient>
          </defs>
          <g fill="url(#cloudGradFar)">
            <ellipse cx="320" cy="790" rx="340" ry="150" />
            <ellipse cx="640" cy="740" rx="290" ry="165" />
            <ellipse cx="980" cy="800" rx="380" ry="155" />
            <ellipse cx="1360" cy="745" rx="330" ry="175" />
            <ellipse cx="1740" cy="785" rx="360" ry="160" />
            <ellipse cx="2080" cy="755" rx="320" ry="150" />
            <rect x="0" y="790" width="2400" height="290" />
          </g>
        </svg>

        {/* Mid volumetric cloud puffs */}
        <svg
          width={2400}
          height={1080}
          viewBox="0 0 2400 1080"
          style={{
            position: "absolute",
            left: -160 - cloudDriftMid,
            top: 30,
            opacity: 0.9,
          }}
        >
          <g fill="#ffffff">
            <ellipse cx="260" cy="850" rx="280" ry="130" opacity="0.92" />
            <ellipse cx="520" cy="830" rx="240" ry="140" opacity="0.94" />
            <ellipse cx="1520" cy="835" rx="290" ry="145" opacity="0.92" />
            <ellipse cx="1840" cy="815" rx="320" ry="155" opacity="0.95" />
            <ellipse cx="2150" cy="855" rx="280" ry="130" opacity="0.9" />
          </g>
        </svg>

        {/* Foreground soft Sorbet mist deck */}
        <div
          style={{
            position: "absolute",
            left: -120 + cloudDriftFast,
            right: -120,
            bottom: -40,
            height: 410,
            background: `linear-gradient(180deg, rgba(248, 248, 247, 0) 0%, rgba(248, 248, 247, 0.86) 58%, ${PALETTE.shaderCanvasLight} 100%)`,
          }}
        />
      </AbsoluteFill>

      {/* Center Frosted Studio Pedestal + `@snapcn/WordGather` */}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          padding: "0 192px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 28,
            padding: "48px 68px",
            borderRadius: 32,
            backgroundColor: "rgba(255, 255, 255, 0.88)",
            border: `1.5px solid ${PALETTE.border}`,
            boxShadow:
              "0 28px 80px rgba(20, 20, 19, 0.10), 0 4px 16px rgba(20, 20, 19, 0.04)",
          }}
        >
          {/* Top Eyebrow Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 9,
              padding: "7px 16px",
              borderRadius: 999,
              backgroundColor: PALETTE.mintTint,
              border: `1px solid ${PALETTE.mint}45`,
              opacity: pillSpring,
              transform: `translateY(${((1 - pillSpring) * -10).toFixed(2)}px)`,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                backgroundColor: PALETTE.mint,
              }}
            />
            <span
              style={{
                fontFamily: PALETTE.fontMono,
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: PALETTE.mintDeep,
              }}
            >
              MEMWAL-TEAM-SKILLS · WALRUS
            </span>
          </div>

          {/* `@snapcn/WordGather` Kinetic Headline */}
          <WordGather
            words={["Shared", "memory", "every", "agent", "recalls."]}
            gatherOrder={[0, 4, 1, 3, 2]}
            lineBreakAfter={[1]}
            keepAccentIndices={[4]}
            accentColor={PALETTE.mint}
            inkColor={PALETTE.ink}
            fontSize={86}
            fontWeight={700}
            holdFirstFrames={14}
            staggerFrames={9}
          />

          {/* Grounding Sub-line */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              opacity: subOpacity,
              transform: `translateY(${subY.toFixed(2)}px)`,
              fontFamily: PALETTE.fontMono,
              fontSize: 17,
              fontWeight: 500,
              color: PALETTE.ink2,
              letterSpacing: "-0.01em",
            }}
          >
            <span>One namespace</span>
            <span style={{ color: PALETTE.mint }}>•</span>
            <span>14 SKILL.md rules</span>
            <span style={{ color: PALETTE.mint }}>•</span>
            <span>Zero cold starts</span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
