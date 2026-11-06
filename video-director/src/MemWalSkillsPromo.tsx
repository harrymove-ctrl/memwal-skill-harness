import type React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  staticFile,
} from "remotion";
import { LiveAppFootage } from "@/components/footage/LiveAppFootage";
import {
  DOT_BLOOM_CUT,
  DOT_BLOOM_FRAMES,
  EmeraldDotBloom,
} from "@/components/transitions/EmeraldDotBloom";
import {
  APP_REVEAL_CUES,
  CLICK_TYPE_CLICK_FRAME,
  CLICK_TYPE_CUT_FRAME,
  LOGO_COLLAPSE_CUT_FRAMES,
  LOGO_COLLAPSE_IMPACT_FRAME,
  PROMPT_ROLL_CUES,
  Scene1OpeningWordGather,
  Scene2LogoCollapse,
  Scene3PromptRoll,
  Scene4ClickType,
  Scene5AppReveal,
  Scene6FinalLockup,
} from "./scenes";

/**
 * Exact 42.00s (1260 frames @ 30fps, 120 BPM = 21 bars) Director's Cut Timeline:
 * 1. Act 1 (0..180, 6.0s): Frame 0 Music + 3D MemWal Logo Sting over authentic
 *    OriginKit CloudSky WebGL shader + official @snapcn/word-gather (zero overlap).
 * 2. Act 2 (180..330, 5.0s): Sorbet ChromaCurrent + official @snapcn/logo-collapse
 *    (6 scrubbed product shots dealt on tightening beats, collapsing at f240 = DROP A).
 * 3. Act 3 (330..555, 7.5s): Measured Prompt Roll light glass composer (push-in ->
 *    closer 1.52x cut -> 4 spring-width tinted rolls -> whip-pan blur -> halo press -> white wash).
 * 4. Act 4 (555..705, 5.0s, Breakdown): Official @snapcn/click-type emerging from
 *    white wash, cursor click + 1.9x close-up typing with zero right-edge clipping.
 * 5. Act 5A (705..825, 4.0s, DROP B): App Reveal (hero wordmark folds into header,
 *    3D camera dives/rolls/settles while greeting + 4 chips + input bar land).
 * 6. Act 5B (825..1140, 10.5s): 3 real 1080p live app recordings on 3D tilted camera
 *    with self-drawing emerald rings and non-overlapping 2-line explainer callouts:
 *    Shot 1 (825..930): Dark Flow View Skill Graph (take-flow-dark.mp4)
 *    Shot 2 (930..1045): Tatum x Walrus Total Recall Playground & A/B Verdict (take.mp4)
 *    Shot 3 (1045..1140): Connect Tatum AI + Claude Code + Cursor + Codex + Antigravity (take.mp4)
 * 7. Act 6 (1140..1260, 4.0s): EmeraldDotBloom halftone transition into OriginKit
 *    CloudSky Final Brand Lockup held crisp to 42.0s.
 */
const S1_START = 0;
const S1_DUR = 180;

const S2_START = 180;
const S2_DUR = 150;

const S3_START = 330;
const S3_DUR = 225;

const S4_START = 555;
const S4_DUR = 150;

const S5_START = 705;
const S5_DUR = 120;

const LIVE1_START = 825;
const LIVE1_DUR = 105;

const LIVE2_START = 930;
const LIVE2_DUR = 115;

const LIVE3_START = 1045;
const LIVE3_DUR = 95;

const S6_START = 1140;
const S6_DUR = 120;

// Sampled tactile keystroke ticks for PromptRoll typing & ClickType close-up typing
const PROMPT_ROLL_KEY_TICKS = [
  336, 342, 348, 354, 360, 366, 462, 468, 474,
];
const CLICK_TYPE_KEY_TICKS = [
  632, 637, 642, 647, 652, 657, 662, 667, 672, 677, 682, 687,
];

// WordGather 5-word drop ticks (Sequence starts at f44, speed=0.44 -> beats 20..24)
const WORD_GATHER_TICKS = [100, 103, 106, 109, 112];

export const MemWalSkillsPromo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#080c0b" }}>
      {/* ==================== VISUAL TIMELINE (1260 FRAMES) ==================== */}
      <Sequence from={S1_START} durationInFrames={S1_DUR}>
        <Scene1OpeningWordGather />
      </Sequence>

      <Sequence from={S2_START} durationInFrames={S2_DUR}>
        <Scene2LogoCollapse />
      </Sequence>

      <Sequence from={S3_START} durationInFrames={S3_DUR}>
        <Scene3PromptRoll />
      </Sequence>

      <Sequence from={S4_START} durationInFrames={S4_DUR}>
        <Scene4ClickType />
      </Sequence>

      <Sequence from={S5_START} durationInFrames={S5_DUR}>
        <Scene5AppReveal />
      </Sequence>

      {/* Live 1080p Shot 1: Dark Flow View Skill Graph */}
      <Sequence from={LIVE1_START} durationInFrames={LIVE1_DUR}>
        <LiveAppFootage
          src="take/take-flow-dark.mp4"
          from={15.6}
          rate={1.35}
          frames={LIVE1_DUR}
          darkTheme
          tilt={7.5}
          fadeInFrames={8}
          camera={[
            { t: 15.6, zoom: 1.03, u: 0.5, v: 0.47 },
            { t: 20.5, zoom: 1.07, u: 0.51, v: 0.47 },
          ]}
          callouts={[
            {
              from: 18,
              to: 88,
              box: { x: 802, y: 584, w: 160, h: 43 },
              what: "SKILL.md flow graph",
              why: "15 skills synced on Walrus",
              side: "right",
              screenPos: { x: 1562, y: 580 },
            },
          ]}
        />
      </Sequence>

      {/* Live 1080p Shot 2: Tatum x Walrus Total Recall -> Without vs With MemWal */}
      <Sequence from={LIVE2_START} durationInFrames={LIVE2_DUR}>
        <LiveAppFootage
          src="take/take.mp4"
          from={8.5}
          rate={2.2}
          frames={LIVE2_DUR}
          darkTheme={false}
          tilt={-7.2}
          fadeInFrames={8}
          camera={[
            { t: 8.5, zoom: 1.04, u: 0.52, v: 0.52 },
            { t: 11.2, zoom: 1.06, u: 0.5, v: 0.56 },
            { t: 14.2, zoom: 1.07, u: 0.52, v: 0.35 },
            { t: 17.0, zoom: 1.08, u: 0.53, v: 0.35 },
          ]}
          callouts={[
            {
              from: 70,
              to: 106,
              box: { x: 1003, y: 116, w: 694, h: 86 },
              what: "Tatum live context + team recall",
              why: "Catches retired apps before any PR merges",
              side: "below",
              screenPos: { x: 84, y: 616 },
            },
          ]}
        />
      </Sequence>

      {/* Live 1080p Shot 3: Connect Tatum AI + Claude Code + Cursor + Codex + Antigravity */}
      <Sequence from={LIVE3_START} durationInFrames={LIVE3_DUR}>
        <LiveAppFootage
          src="take/take.mp4"
          from={41.6}
          rate={2.5}
          frames={LIVE3_DUR}
          darkTheme={false}
          tilt={7.0}
          fadeInFrames={8}
          camera={[
            { t: 41.6, zoom: 1.08, u: 0.5, v: 0.42 },
            { t: 49.6, zoom: 1.1, u: 0.5, v: 0.42 },
          ]}
          callouts={[
            {
              from: 16,
              to: 78,
              box: { x: 320, y: 381, w: 924, h: 40 },
              what: "Tatum AI + every coding IDE",
              why: "One MCP config shares memory across the team",
              side: "below",
              screenPos: { x: 1130, y: 740 },
            },
          ]}
        />
      </Sequence>

      {/* Final Scene: OriginKit CloudSky Brand Lockup */}
      <Sequence from={S6_START} durationInFrames={S6_DUR}>
        <Scene6FinalLockup />
      </Sequence>

      {/* Emerald-Retinted @snapcn/dot-bloom Halftone Transition at frame 1140 */}
      <Sequence
        from={S6_START - DOT_BLOOM_CUT}
        durationInFrames={DOT_BLOOM_FRAMES}
      >
        <EmeraldDotBloom />
      </Sequence>

      {/* ==================== MASTER SCORE & FRAME-EXACT SFX ==================== */}
      <Audio
        src={staticFile("audio/soundtrack.wav")}
        volume={(f) =>
          interpolate(f, [0, 4, 1200, 1259], [0.7, 0.76, 0.76, 0.0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />

      {/* Act 1: Frame 0 Logo Ignite + CloudSky Breeze + WordGather Drops */}
      <Sequence from={0} durationInFrames={42}>
        <Audio src={staticFile("audio/logo-ignite.wav")} volume={0.68} />
      </Sequence>
      <Sequence from={44} durationInFrames={48}>
        <Audio src={staticFile("audio/sky-breeze.wav")} volume={0.42} />
      </Sequence>
      {WORD_GATHER_TICKS.map((wf) => (
        <Sequence key={`wg-${wf}`} from={wf} durationInFrames={8}>
          <Audio src={staticFile("audio/pop.wav")} volume={0.34} />
        </Sequence>
      ))}

      {/* Act 2: LogoCollapse 6 Photo Cuts + Tile Collapse Impact on DROP A (f240) */}
      {LOGO_COLLAPSE_CUT_FRAMES.map((cf) => (
        <Sequence
          key={`lc-cut-${cf}`}
          from={S2_START + cf}
          durationInFrames={6}
        >
          <Audio src={staticFile("audio/card-cut.wav")} volume={0.46} />
        </Sequence>
      ))}
      <Sequence
        from={S2_START + LOGO_COLLAPSE_IMPACT_FRAME}
        durationInFrames={34}
      >
        <Audio src={staticFile("audio/collapse-impact.wav")} volume={0.72} />
      </Sequence>
      <Sequence from={S2_START + 79} durationInFrames={8}>
        <Audio src={staticFile("audio/wheel-tick.wav")} volume={0.42} />
      </Sequence>
      <Sequence from={S2_START + 84} durationInFrames={8}>
        <Audio src={staticFile("audio/wheel-tick.wav")} volume={0.42} />
      </Sequence>

      {/* Act 3: PromptRoll Closer Cut + 4 Tinted Rolls + Whip Pan + Halo Press */}
      {PROMPT_ROLL_KEY_TICKS.map((kf) => (
        <Sequence key={`pr-key-${kf}`} from={kf} durationInFrames={5}>
          <Audio src={staticFile("audio/key-tick.wav")} volume={0.26} />
        </Sequence>
      ))}
      <Sequence
        from={S3_START + PROMPT_ROLL_CUES.cutAt}
        durationInFrames={6}
      >
        <Audio src={staticFile("audio/card-cut.wav")} volume={0.4} />
      </Sequence>
      {PROMPT_ROLL_CUES.rollSteps.map((rf) => (
        <Sequence
          key={`pr-roll-${rf}`}
          from={S3_START + rf}
          durationInFrames={8}
        >
          <Audio src={staticFile("audio/wheel-tick.wav")} volume={0.58} />
        </Sequence>
      ))}
      <Sequence
        from={S3_START + PROMPT_ROLL_CUES.whipAt}
        durationInFrames={16}
      >
        <Audio src={staticFile("audio/whip.wav")} volume={0.56} />
      </Sequence>
      <Sequence
        from={S3_START + PROMPT_ROLL_CUES.pressAt}
        durationInFrames={32}
      >
        <Audio src={staticFile("audio/press-halo.wav")} volume={0.72} />
      </Sequence>

      {/* Act 4: ClickType Cursor Click + Hard Cut + Close-up Caret Typing */}
      <Sequence
        from={S4_START + CLICK_TYPE_CLICK_FRAME}
        durationInFrames={10}
      >
        <Audio src={staticFile("audio/click-crisp.wav")} volume={0.68} />
      </Sequence>
      <Sequence from={S4_START + CLICK_TYPE_CUT_FRAME} durationInFrames={6}>
        <Audio src={staticFile("audio/card-cut.wav")} volume={0.4} />
      </Sequence>
      {CLICK_TYPE_KEY_TICKS.map((kf) => (
        <Sequence key={`ct-key-${kf}`} from={kf} durationInFrames={5}>
          <Audio src={staticFile("audio/key-tick.wav")} volume={0.26} />
        </Sequence>
      ))}

      {/* Act 5A: App Reveal Fold + 3D Camera Dive/Roll + 4 Chips + Input Bar */}
      <Sequence
        from={S5_START + APP_REVEAL_CUES.cardBuildAt}
        durationInFrames={36}
      >
        <Audio src={staticFile("audio/logo-ignite.wav")} volume={0.44} />
      </Sequence>
      <Sequence
        from={S5_START + APP_REVEAL_CUES.cameraDiveAt}
        durationInFrames={18}
      >
        <Audio src={staticFile("audio/whoosh.wav")} volume={0.56} />
      </Sequence>
      {APP_REVEAL_CUES.chipFrames.map((cf) => (
        <Sequence
          key={`ar-chip-${cf}`}
          from={S5_START + cf}
          durationInFrames={8}
        >
          <Audio src={staticFile("audio/pop.wav")} volume={0.38} />
        </Sequence>
      ))}
      <Sequence
        from={S5_START + APP_REVEAL_CUES.inputBarAt}
        durationInFrames={10}
      >
        <Audio src={staticFile("audio/click-crisp.wav")} volume={0.44} />
      </Sequence>

      {/* Act 5B: Live Footage Transitions + Callout Ring Pings */}
      <Sequence from={LIVE1_START + 18} durationInFrames={8}>
        <Audio src={staticFile("audio/pop.wav")} volume={0.36} />
      </Sequence>
      <Sequence from={LIVE2_START} durationInFrames={12}>
        <Audio src={staticFile("audio/whip.wav")} volume={0.38} />
      </Sequence>
      <Sequence from={LIVE2_START + 12} durationInFrames={10}>
        <Audio src={staticFile("audio/click-crisp.wav")} volume={0.5} />
      </Sequence>
      <Sequence from={LIVE2_START + 70} durationInFrames={8}>
        <Audio src={staticFile("audio/pop.wav")} volume={0.38} />
      </Sequence>
      <Sequence from={LIVE3_START} durationInFrames={12}>
        <Audio src={staticFile("audio/whip.wav")} volume={0.38} />
      </Sequence>
      <Sequence from={LIVE3_START + 16} durationInFrames={8}>
        <Audio src={staticFile("audio/pop.wav")} volume={0.38} />
      </Sequence>
      {[20, 46, 72].map((tabClick) => (
        <Sequence
          key={`ide-tab-${tabClick}`}
          from={LIVE3_START + tabClick}
          durationInFrames={8}
        >
          <Audio src={staticFile("audio/wheel-tick.wav")} volume={0.34} />
        </Sequence>
      ))}

      {/* Act 6: EmeraldDotBloom Halftone Transition + CloudSky Resolution */}
      <Sequence from={S6_START - DOT_BLOOM_CUT} durationInFrames={54}>
        <Audio src={staticFile("audio/bloom-reveal.wav")} volume={0.68} />
      </Sequence>
      <Sequence from={S6_START + 10} durationInFrames={48}>
        <Audio src={staticFile("audio/sky-breeze.wav")} volume={0.38} />
      </Sequence>
    </AbsoluteFill>
  );
};
