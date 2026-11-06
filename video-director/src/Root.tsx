import type React from "react";
import { Composition } from "remotion";
import { MemWalSkillsPromo } from "./MemWalSkillsPromo";
import {
  Scene1OpeningWordGather,
  Scene2LogoCollapse,
  Scene3PromptRoll,
  Scene4ClickType,
  Scene5AppReveal,
  Scene6FinalLockup,
} from "./scenes";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MemWalSkillsPromo"
        component={MemWalSkillsPromo}
        durationInFrames={1260}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Act1-Logo-CloudSky-WordGather"
        component={Scene1OpeningWordGather}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Act2-LogoCollapse"
        component={Scene2LogoCollapse}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Act3-PromptRoll"
        component={Scene3PromptRoll}
        durationInFrames={192}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Act4-ClickType"
        component={Scene4ClickType}
        durationInFrames={198}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Act5-AppReveal"
        component={Scene5AppReveal}
        durationInFrames={315}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Act6-FinalLockup"
        component={Scene6FinalLockup}
        durationInFrames={135}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
