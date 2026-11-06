import type React from "react";
import { Composition } from "remotion";
import "./lib/fonts";
import { FILM_FRAMES, WalrusProductFilm } from "./WalrusProductFilm";
import { PROMO_FRAMES, WalrusPromoVideo } from "./WalrusPromoVideo";
import { REAL_FRAMES, WalrusPromoReal } from "./PromoReal";
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

const HD = { fps: 30, width: 1920, height: 1080 } as const;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Master 80.00s (2400f) @snapcn + Real Product Film */}
      <Composition
        id="WalrusPromo"
        component={WalrusProductFilm}
        durationInFrames={FILM_FRAMES}
        {...HD}
      />

      {/* Individual Scenes for Studio & Still QA */}
      <Composition
        id="Film-S1-OriginCloudHook"
        component={OriginCloudHookScene}
        durationInFrames={195}
        {...HD}
      />
      <Composition
        id="Film-S2-LogoCollapse"
        component={MemWalLogoCollapseScene}
        durationInFrames={165}
        {...HD}
      />
      <Composition
        id="Film-S3-PromptLaptopDive"
        component={PromptLaptopDiveScene}
        durationInFrames={225}
        {...HD}
      />
      <Composition
        id="Film-S4-Chapter01-TextHighlight"
        component={ChapterTextHighlightScene}
        durationInFrames={138}
        {...HD}
      />
      <Composition
        id="Film-S5-LiveAct1-EvalRecall"
        component={LiveAct1EvalRecall}
        durationInFrames={315}
        {...HD}
      />
      <Composition
        id="Film-S6-Chapter02-PunchLines"
        component={ChapterPunchLinesScene}
        durationInFrames={138}
        {...HD}
      />
      <Composition
        id="Film-S7-LiveAct2-CompareVerdict"
        component={LiveAct2CompareVerdict}
        durationInFrames={315}
        {...HD}
      />
      <Composition
        id="Film-S8-Chapter03-DotBloom"
        component={ChapterSealVaultScene}
        durationInFrames={138}
        {...HD}
      />
      <Composition
        id="Film-S9-LiveAct3-SkillGraph"
        component={LiveAct3SkillGraph}
        durationInFrames={315}
        {...HD}
      />
      <Composition
        id="Film-S10-Chapter04-CheckCycle"
        component={ChapterCheckCycleScene}
        durationInFrames={138}
        {...HD}
      />
      <Composition
        id="Film-S11-LiveAct4-ConnectIdes"
        component={LiveAct4ConnectIdes}
        durationInFrames={300}
        {...HD}
      />
      <Composition
        id="Film-S12-TerminalEndLockup"
        component={TerminalEndLockupScene}
        durationInFrames={195}
        {...HD}
      />

      {/* Legacy reference compositions */}
      <Composition
        id="WalrusPromoRealRef"
        component={WalrusPromoReal}
        durationInFrames={REAL_FRAMES}
        {...HD}
      />
      <Composition
        id="WalrusPromoMotionV2"
        component={WalrusPromoVideo}
        durationInFrames={PROMO_FRAMES}
        {...HD}
      />
    </>
  );
};
