import type React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Scene1SkyIntro } from "./scenes/Scene1SkyIntro";
import { Scene2LogoCollapse } from "./scenes/Scene2LogoCollapse";
import { PROMPT_ROLL_FRAMES, ScenePromptRoll } from "./scenes/ScenePromptRoll";
import { CLICK_TYPE_FRAMES, SceneClickType, clickTypeCueFrames } from "./scenes/SceneClickType";
import { APP_REVEAL_FRAMES, SceneAppReveal } from "./scenes/SceneAppReveal";
import { END_CARD_FRAMES, SceneEndCard } from "./scenes/SceneEndCard";

/**
 * Walrus Memory promo, 42.0 s @ 30 fps (1260 frames).
 *
 *   f0     Cloud sky + Word Gather intro        (score: intro, no drums)
 *   f156   Logo Collapse, logo lands at f220    (score: DROP A on f220)
 *   f327   Prompt Roll, washes to white at f580
 *   f580   Click Type (hard cut from white)     (score: breakdown)
 *   f760   App Reveal                           (score: DROP B on f760)
 *   f1120  End card                             (score: final chord on f1120)
 */
export const PROMO_FRAMES = 1260;

const S1 = 165;
const S2 = 180;
const FADE = 9;
const FADE_END = 12;

export const START = {
  sky: 0,
  logo: S1 - FADE, // 156
  roll: S1 - FADE + S2 - FADE, // 327
  click: S1 - FADE + S2 - FADE + PROMPT_ROLL_FRAMES, // 580
  app: S1 - FADE + S2 - FADE + PROMPT_ROLL_FRAMES + CLICK_TYPE_FRAMES - FADE, // 760
  end:
    S1 - FADE + S2 - FADE + PROMPT_ROLL_FRAMES + CLICK_TYPE_FRAMES - FADE + APP_REVEAL_FRAMES - FADE_END, // 1120
};

type Cue = { at: number; src: string; vol: number; len?: number };

const everyOther = (frames: number[]) => frames.filter((_, i) => i % 2 === 0);

function typingFrames(text: string, startAt: number, fpc: number) {
  const out: number[] = [];
  for (let i = 0; i < text.length; i++) if (text[i] !== " ") out.push(startAt + Math.floor(i * fpc));
  return out;
}

function buildCues(): Cue[] {
  const c: Cue[] = [];
  const add = (at: number, src: string, vol: number, len = 60) => c.push({ at, src, vol, len });

  // Sky intro
  add(6, "sky-breeze", 0.5);
  // Logo collapse: whoosh pulls in, sub hit lands on f220
  add(START.logo + 45, "collapse-impact", 0.7);

  // Prompt roll
  const r = START.roll;
  everyOther(typingFrames("Give every agent your team's", r + 6, 1.25)).forEach((f) => add(f, "key-tick", 0.22, 6));
  add(r + 43, "pop", 0.45, 8);
  [73, 103, 133, 163].forEach((f) => add(r + f, "wheel-tick", 0.5, 10));
  everyOther(typingFrames(" on Walrus.", r + 166, 1.25)).forEach((f) => add(f, "key-tick", 0.22, 6));
  add(r + 186, "whip", 0.55, 12);
  add(r + 192, "sky-breeze", 0.25, 45);
  add(r + 223, "press-halo", 0.7, 36);
  add(r + 227, "whoosh", 0.45, 18);

  // Click type
  const ct = clickTypeCueFrames();
  add(START.click + ct.click, "click-crisp", 0.62, 10);
  everyOther(ct.keys).forEach((f) => add(START.click + f, "key-tick", 0.22, 6));

  // App reveal
  const a = START.app;
  add(a + 34, "whoosh", 0.38, 18);
  add(a + 64, "whip", 0.45, 12);
  add(a + 110, "whoosh", 0.28, 18);
  everyOther(everyOther(typingFrames("What should your agents remember today?", a + 72, 1.25))).forEach((f) =>
    add(f, "key-tick", 0.18, 6),
  );
  [150, 165, 180, 195].forEach((f) => add(a + f, "pop", 0.4, 8));
  add(a + 205, "whoosh", 0.22, 18);
  add(a + 255, "click-crisp", 0.6, 10);
  add(a + 270, "pop", 0.32, 8);
  add(a + 285, "bloom-reveal", 0.5, 54);

  // End card shimmer on top of the score's final chord
  add(START.end + 2, "sky-breeze", 0.32, 48);
  return c;
}

const CUES = buildCues();

export const WalrusPromoVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#080c0b" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={S1}>
          <Scene1SkyIntro />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: FADE })} />
        <TransitionSeries.Sequence durationInFrames={S2}>
          <Scene2LogoCollapse />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: FADE })} />
        <TransitionSeries.Sequence durationInFrames={PROMPT_ROLL_FRAMES}>
          <ScenePromptRoll />
        </TransitionSeries.Sequence>
        {/* hard cut out of the white wash */}
        <TransitionSeries.Sequence durationInFrames={CLICK_TYPE_FRAMES}>
          <SceneClickType />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: FADE })} />
        <TransitionSeries.Sequence durationInFrames={APP_REVEAL_FRAMES}>
          <SceneAppReveal />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: FADE_END })} />
        <TransitionSeries.Sequence durationInFrames={END_CARD_FRAMES}>
          <SceneEndCard />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <Audio
        src={staticFile("audio/score.wav")}
        volume={(f) =>
          interpolate(f, [0, 12, PROMO_FRAMES - 10, PROMO_FRAMES], [0, 0.6, 0.6, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
      {CUES.map((cue, i) => (
        <Sequence key={`${cue.src}-${cue.at}-${i}`} from={cue.at} durationInFrames={cue.len ?? 60}>
          <Audio src={staticFile(`audio/${cue.src}.wav`)} volume={cue.vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
