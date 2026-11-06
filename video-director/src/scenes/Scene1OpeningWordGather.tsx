import type React from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CloudSkyBackdrop } from "@/components/backgrounds/CloudSkyBackdrop";
import { WalrusBrandMark } from "@/components/brand/WalrusBrandMark";
import { WordGather } from "@/components/snap-cn/word-gather";
import { inter, interTight } from "@/lib/fonts";

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * Act 1 (f0..f180, 6.0s):
 * 1. Frame 0: Music and 3D MemWal mark ignite immediately over the authentic
 *    OriginKit CloudSky WebGL shader, unfurl "MemWal Skills", and glide into
 *    a clean frosted top badge.
 * 2. Frame 44..180: Official @snapcn/word-gather runs "Shared skills every
 *    coding agent recalls." engineered with maxWidth=395 (3 words + 3 words)
 *    so every scatter vector drops from open outer margin space with zero
 *    word-on-word overlap on every intermediate frame.
 */
export const Scene1OpeningWordGather: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoPop = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 185, mass: 0.76 },
  });

  const wordUnfurl = interpolate(frame, [10, 28], [0, 1], {
    ...CLAMP,
    easing: Easing.out(Easing.cubic),
  });

  const tuckProgress = interpolate(frame, [34, 54], [0, 1], {
    ...CLAMP,
    easing: Easing.inOut(Easing.cubic),
  });

  const heroCenterY = interpolate(tuckProgress, [0, 1], [520, 74]);
  const heroScale = interpolate(tuckProgress, [0, 1], [1, 0.44]);
  const wordGatherOpacity = interpolate(frame, [44, 52], [0, 1], CLAMP);

  // Smooth 8-frame crossfade into Sorbet cream right before Scene 2
  const exitWash = interpolate(frame, [172, 180], [0, 1], CLAMP);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#7cb8f2",
        fontFamily: inter.fontFamily,
        overflow: "hidden",
      }}
    >
      {/* 1. Authentic OriginKit CloudSky (preset=base) WebGL GLSL Shader */}
      <CloudSkyBackdrop windSpeed={1.2} sunGlow={0.94} cloudDensity={0.66} seedOffset={4.2} />

      {/* 2. Soft sunlit mist cushion behind typography so #081426 holds >10:1 AAA contrast */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 72% 62% at 50% 52%, rgba(255, 255, 255, 0.50) 0%, rgba(255, 255, 255, 0.20) 48%, rgba(255, 255, 255, 0) 84%)",
          filter: "blur(28px)",
          pointerEvents: "none",
        }}
      />

      {/* 3. Official @snapcn/word-gather (3 + 3 word wrap = zero overlap) */}
      <Sequence from={44} durationInFrames={136}>
        <AbsoluteFill style={{ opacity: wordGatherOpacity }}>
          <WordGather
            text="Shared skills every coding agent recalls."
            maxWidth={395}
            accent="#047857"
            fontWeight={500}
            speed={0.44}
            transparent
            mode="light"
            theme={{
              background: "#cfe8fb",
              foreground: "#081426",
              primary: "#047857",
            }}
          />
        </AbsoluteFill>
      </Sequence>

      {/* 4. Immediate Frame-0 Logo Animation -> Glides to Clean Top Badge */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: heroCenterY,
          transform: `translateY(-50%) scale(${heroScale * interpolate(logoPop, [0, 1], [0.58, 1])})`,
          opacity: interpolate(frame, [0, 6], [0, 1], CLAMP),
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 20,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 24,
            padding: "20px 38px 20px 24px",
            borderRadius: 999,
            backgroundColor: `rgba(255, 255, 255, ${0.72 + tuckProgress * 0.2})`,
            border: "1.5px solid rgba(255, 255, 255, 0.94)",
            boxShadow:
              "0 24px 64px rgba(8, 28, 56, 0.16), inset 0 1.5px 0 rgba(255, 255, 255, 0.96)",
            backdropFilter: "blur(16px)",
          }}
        >
          <WalrusBrandMark size={104} color="#34d996" darkTile glow />

          <div
            style={{
              overflow: "hidden",
              maxWidth: interpolate(wordUnfurl, [0, 1], [0, 560]),
              opacity: interpolate(wordUnfurl, [0, 0.25, 1], [0, 0.7, 1]),
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontFamily: interTight.fontFamily,
                fontSize: 70,
                fontWeight: 700,
                letterSpacing: "-0.038em",
                lineHeight: 1.0,
                color: "#081426",
                whiteSpace: "nowrap",
              }}
            >
              MemWal Skills
            </div>
            <div
              style={{
                marginTop: 6,
                fontFamily: inter.fontFamily,
                fontSize: 24,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: "#047857",
                whiteSpace: "nowrap",
              }}
            >
              Built with Tatum on Walrus
            </div>
          </div>
        </div>
      </div>

      {/* 5. Clean Bottom Context Line once WordGather settles */}
      {frame >= 122 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 76,
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none",
            opacity: interpolate(frame, [122, 134], [0, 1], CLAMP),
            transform: `translateY(${interpolate(frame, [122, 136], [14, 0], {
              ...CLAMP,
              easing: Easing.out(Easing.cubic),
            })}px)`,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 14,
              padding: "12px 28px",
              borderRadius: 999,
              backgroundColor: "rgba(255, 255, 255, 0.90)",
              border: "1px solid rgba(5, 150, 105, 0.28)",
              boxShadow: "0 14px 34px rgba(8, 24, 48, 0.12)",
              fontSize: 23,
              fontWeight: 600,
              color: "#0c192c",
              letterSpacing: "-0.015em",
            }}
          >
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: 999,
                backgroundColor: "#10b981",
                boxShadow: "0 0 10px rgba(16, 185, 129, 0.65)",
              }}
            />
            <span>One team vault · Tatum wallet security · Live MCP</span>
          </div>
        </div>
      )}

      {exitWash > 0.01 && (
        <AbsoluteFill
          style={{
            backgroundColor: "#f5f6f1",
            opacity: exitWash,
            pointerEvents: "none",
          }}
        />
      )}
    </AbsoluteFill>
  );
};
