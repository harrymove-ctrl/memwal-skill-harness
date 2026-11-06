import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  staticFile,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { dotBloom } from "./transitions/dotBloomTransition";
import { PALETTE } from "./palette";

import { OriginCloudHookScene } from "./scenes/OriginCloudHookScene";
import { MemWalLogoCollapseScene } from "./scenes/MemWalLogoCollapseScene";
import { PromptLaptopDiveScene } from "./scenes/PromptLaptopDiveScene";
import { ChapterTextHighlightScene } from "./scenes/ChapterTextHighlightScene";
import { ChapterPunchLinesScene } from "./scenes/ChapterPunchLinesScene";
import { ChapterSealVaultScene } from "./scenes/ChapterSealVaultScene";
import { ChapterCheckCycleScene } from "./scenes/ChapterCheckCycleScene";
import { TerminalEndLockupScene } from "./scenes/TerminalEndLockupScene";
import {
  LiveAct1EvalRecall,
  LiveAct2CompareVerdict,
  LiveAct3SkillGraph,
  LiveAct4ConnectIdes,
} from "./scenes/LiveProductActs";

/**
 * Complete 80.00-second (2400 frames @ 30fps) Walrus Memory Real-Product Film.
 *
 * Exact TransitionSeries timeline (sum of scenes 2577 - sum of transitions 177 = 2400f):
 *   S1  f0..195     OriginCloudHookScene       (OriginKit CloudSky + @snapcn/WordGather)
 *        T1 (15f)   fade()
 *   S2  f180..345   MemWalLogoCollapseScene    (@snapcn/LogoCollapse -> MemWalMark @ f240)
 *        T2 (15f)   slide("from-bottom")
 *   S3  f330..555   PromptLaptopDiveScene      (@snapcn/PromptRoll + LaptopFrame bezel dive f480..540)
 *        T3 (15f)   fade()
 *   S4  f540..678   ChapterTextHighlightScene  (@snapcn/TextHighlight Chapter 01)
 *        T4 (18f)   fade()
 *   S5  f660..975   LiveAct1EvalRecall         (Real take.mp4: Run Live Recall @ f754, Recalled @ f821)
 *        T5 (15f)   slide("from-right")
 *   S6  f960..1098  ChapterPunchLinesScene     (@snapcn/PunchLines Chapter 02)
 *        T6 (18f)   fade()
 *   S7  f1080..1395 LiveAct2CompareVerdict     (Real take.mp4: Without vs With Walrus Memory)
 *        T7 (15f)   dotBloom()                 (Custom @snapcn/DotBloom halftone iris)
 *   S8  f1380..1518 ChapterSealVaultScene      (@snapcn/DotBloom + WordGather Chapter 03)
 *        T8 (18f)   fade()
 *   S9  f1500..1815 LiveAct3SkillGraph         (Real take.mp4: SKILL.md + Skill Graph click @ f1698)
 *        T9 (15f)   slide("from-bottom")
 *   S10 f1800..1938 ChapterCheckCycleScene     (@snapcn/CheckCycle Chapter 04)
 *        T10 (18f)  fade()
 *   S11 f1920..2220 LiveAct4ConnectIdes        (Real take.mp4: Cursor @ f1982, Codex @ f2056, Antigravity @ f2136)
 *        T11 (15f)  fade()
 *   S12 f2205..2400 TerminalEndLockupScene     (@snapcn/TerminalSimulator + Sorbet Brand End Lockup)
 */
export const FILM_FRAMES = 2400;

interface SfxCue {
  at: number;
  src: string;
  vol: number;
  len: number;
}

function buildSfxCues(): SfxCue[] {
  const cues: SfxCue[] = [];
  const add = (at: number, src: string, vol: number, len = 30) => {
    cues.push({ at, src, vol, len });
  };

  // S1: OriginKit CloudSky + WordGather
  add(4, "sky-breeze", 0.36, 48);
  [14, 23, 32, 41].forEach((f) => add(f, "pop", 0.22, 8));

  // S2: LogoCollapse (starts f180; card cuts @ 198, 213, 225, 234; mark collapses @ f240)
  [198, 213, 225, 234].forEach((f) => add(f, "wheel-tick", 0.38, 10));
  add(221, "collapse-impact", 0.62, 42);

  // S3: PromptRoll + LaptopFrame bezel dive (starts f330; rolls @ 372, 420; dive @ 480..540)
  add(372, "wheel-tick", 0.44, 10);
  add(420, "wheel-tick", 0.44, 10);
  add(478, "press-halo", 0.48, 36);
  add(513, "laptop-dive", 0.56, 27);

  // S4: Chapter 01 TextHighlight (starts f540)
  add(540, "chapter-chime", 0.44, 18);
  add(556, "whoosh", 0.26, 18);

  // S5: Live Act 1 — Real Playwright click @ f754, Recalled banner @ f821, Callout @ f828
  add(754, "click-crisp", 0.62, 10);
  add(821, "bloom-reveal", 0.52, 54);
  add(828, "pop", 0.38, 8);

  // S6: Chapter 02 PunchLines (starts f960)
  add(960, "chapter-chime", 0.42, 18);
  [970, 988, 1006, 1024].forEach((f) => add(f, "whip", 0.28, 12));

  // S7: Live Act 2 — Callout @ f1110
  add(1110, "pop", 0.38, 8);

  // S8: DotBloom transition + Chapter 03 Skill Graph (starts f1380)
  add(1380, "halftone-bloom", 0.48, 21);
  add(1384, "chapter-chime", 0.38, 18);

  // S9: Live Act 3 — Callout @ f1534, Real Playwright Skill Graph click @ f1698
  add(1534, "pop", 0.38, 8);
  add(1698, "click-crisp", 0.6, 10);
  add(1706, "bloom-reveal", 0.36, 54);

  // S10: Chapter 04 CheckCycle (starts f1800; checks @ 1814, 1832, 1850, 1868)
  add(1800, "chapter-chime", 0.42, 18);
  [1814, 1832, 1850, 1868].forEach((f) => add(f, "pop", 0.36, 8));

  // S11: Live Act 4 — Real Playwright IDE clicks @ f1982, f2056, f2136 + Callout @ f1994
  add(1982, "click-crisp", 0.58, 10);
  add(1994, "pop", 0.36, 8);
  add(2056, "click-crisp", 0.58, 10);
  add(2136, "click-crisp", 0.58, 10);

  // S12: TerminalSimulator + Brand End Lockup (starts f2205; Cmaj9 chord @ f2220)
  for (let f = 2221; f <= 2251; f += 3) {
    add(f, "key-tick", 0.2, 6);
  }
  [2257, 2271, 2285].forEach((f) => add(f, "pop", 0.3, 8));
  add(2220, "sky-breeze", 0.28, 48);

  return cues;
}

const SFX_CUES = buildSfxCues();

export const WalrusProductFilm: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: PALETTE.shaderCanvasLight }}>
      <TransitionSeries>
        {/* S1: OriginKit CloudSky + @snapcn/WordGather */}
        <TransitionSeries.Sequence durationInFrames={195}>
          <OriginCloudHookScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        {/* S2: @snapcn/LogoCollapse Brand Reveal */}
        <TransitionSeries.Sequence durationInFrames={165}>
          <MemWalLogoCollapseScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        {/* S3: @snapcn/PromptRoll + @snapcn/LaptopFrame Bezel Dive */}
        <TransitionSeries.Sequence durationInFrames={225}>
          <PromptLaptopDiveScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        {/* S4: @snapcn/TextHighlight Chapter 01 */}
        <TransitionSeries.Sequence durationInFrames={138}>
          <ChapterTextHighlightScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 18 })}
        />

        {/* S5: Live Act 1 — Real take.mp4 Eval Recall */}
        <TransitionSeries.Sequence durationInFrames={315}>
          <LiveAct1EvalRecall />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        {/* S6: @snapcn/PunchLines Chapter 02 */}
        <TransitionSeries.Sequence durationInFrames={138}>
          <ChapterPunchLinesScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 18 })}
        />

        {/* S7: Live Act 2 — Real take.mp4 Side-by-Side Verdict */}
        <TransitionSeries.Sequence durationInFrames={315}>
          <LiveAct2CompareVerdict />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={dotBloom()}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        {/* S8: @snapcn/DotBloom + WordGather Chapter 03 */}
        <TransitionSeries.Sequence durationInFrames={138}>
          <ChapterSealVaultScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 18 })}
        />

        {/* S9: Live Act 3 — Real take.mp4 SKILL.md + Skill Graph */}
        <TransitionSeries.Sequence durationInFrames={315}>
          <LiveAct3SkillGraph />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        {/* S10: @snapcn/CheckCycle Chapter 04 */}
        <TransitionSeries.Sequence durationInFrames={138}>
          <ChapterCheckCycleScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 18 })}
        />

        {/* S11: Live Act 4 — Real take.mp4 Connect Every IDE */}
        <TransitionSeries.Sequence durationInFrames={300}>
          <LiveAct4ConnectIdes />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 15 })}
        />

        {/* S12: @snapcn/TerminalSimulator + Sorbet Brand End Lockup */}
        <TransitionSeries.Sequence durationInFrames={195}>
          <TerminalEndLockupScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* 80.00s Master Score (120 BPM, 40 bars, lush audible mix + 73.5s-74.0s breath) */}
      <Audio
        src={staticFile("audio/score-master-80s.wav")}
        volume={(f) =>
          interpolate(
            f,
            [0, 15, FILM_FRAMES - 18, FILM_FRAMES],
            [0, 0.9, 0.9, 0],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }
          )
        }
      />

      {/* Frame-accurate Foley & UI SFX synced to real interactions + @snapcn beats */}
      {SFX_CUES.map((cue, idx) => (
        <Sequence
          key={`${cue.src}-${cue.at}-${idx}`}
          from={cue.at}
          durationInFrames={cue.len}
        >
          <Audio src={staticFile(`audio/${cue.src}.wav`)} volume={cue.vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
