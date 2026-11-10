import React from "react";
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile } from "remotion";
import { Footage } from "./take/Footage";
import { BG } from "./scenes/SkillbookShared";
import { Card1, Card2, Card3, Card4, EndCardScene, Iris, LaptopDiveScene, StingScene } from "./scenes/SkillbookMoments";
import { SkillbookLoopScene } from "./scenes/SkillbookLoopScene";
import { SkillbookHoodScene } from "./scenes/SkillbookHoodScene";

const DEMO = "take/demo.mp4";
const Take: React.FC<React.ComponentProps<typeof Footage>> = (props) => <Footage src={DEMO} background={BG} {...props} />;

const Intro: React.FC = () => <OffthreadVideo src={staticFile("take/intro.mp4")} muted style={{ width: "100%", height: "100%" }} />;

/** Chapter 1, Teach: real Skills screen. */
const Teach: React.FC = () => (
  <Take
    from={0.3}
    rate={0.7}
    frames={924}
    tilt={8}
    camera={[
      { t: 0.3, zoom: 1.2, u: 0.66, v: 0.36 },
      { t: 3.0, zoom: 1.26, u: 0.66, v: 0.62 },
      { t: 7.6, zoom: 1.26, u: 0.66, v: 0.62 },
      { t: 8.4, zoom: 1.2, u: 0.66, v: 0.36 },
      { t: 11.2, zoom: 1.22, u: 0.66, v: 0.36 },
    ]}
    callouts={[
      { from: 24, to: 250, box: { x: 793, y: 253, w: 1066, h: 84 }, card: { x: 400, y: 660 }, what: "Team rules, beside the skill", why: "Each one shows who wrote it and when", side: "below" },
      { from: 660, to: 900, box: { x: 793, y: 253, w: 1066, h: 84 }, card: { x: 400, y: 660 }, what: "Teach it in one line", why: "It joins the skill with its author", side: "below" },
    ]}
  />
);

/** Chapter 2, Recall: Live, then Agents. */
const Recall: React.FC = () => (
  <AbsoluteFill>
    <Take
      from={25.29}
      rate={1}
      frames={1044}
      tilt={8}
      camera={[
        { t: 25.29, zoom: 1.1, u: 0.58, v: 0.34 },
        { t: 29.39, zoom: 1.16, u: 0.58, v: 0.7 },
        { t: 32.89, zoom: 1.16, u: 0.58, v: 0.7 },
        { t: 34.09, zoom: 1.12, u: 0.6, v: 0.3 },
        { t: 42.69, zoom: 1.14, u: 0.6, v: 0.34 },
      ]}
      callouts={[
        { from: 200, to: 450, box: { x: 409, y: 721, w: 1450, h: 72 }, card: { x: 1000, y: 420 }, what: "Every recall is logged", why: "See which agent used which rule", side: "above" },
        { from: 560, to: 860, box: { x: 384, y: 108, w: 1500, h: 146 }, card: { x: 1090, y: 620 }, what: "One setup for each agent", why: "Claude Code, Cursor, Codex and more", side: "below" },
      ]}
    />
  </AbsoluteFill>
);

/** Chapter 3, Change: Try it. */
const Change: React.FC = () => (
  <Take
    from={43.79}
    rate={0.55}
    frames={762}
    tilt={8}
    camera={[
      { t: 43.79, zoom: 1.14, u: 0.6, v: 0.26 },
      { t: 46.09, zoom: 1.18, u: 0.6, v: 0.4 },
      { t: 50.59, zoom: 1.18, u: 0.6, v: 0.42 },
    ]}
    callouts={[
      { from: 280, to: 720, box: { x: 384, y: 317, w: 1500, h: 236 }, card: { x: 420, y: 790 }, what: "Same task, different call", why: "The rule that changed it is named", side: "below" },
    ]}
  />
);

const TeamShot: React.FC = () => (
  <Take
    from={53.19}
    rate={0.4}
    frames={540}
    tilt={8}
    camera={[
      { t: 53.19, zoom: 1.14, u: 0.6, v: 0.32 },
      { t: 56.79, zoom: 1.2, u: 0.6, v: 0.5 },
    ]}
    callouts={[
      { from: 80, to: 500, box: { x: 409, y: 564, w: 1450, h: 107 }, card: { x: 420, y: 870 }, what: "Members read from the chain", why: "Checked on Sui through the Tatum gateway", side: "below" },
    ]}
  />
);

const ProofShot: React.FC = () => (
  <Take
    from={60.99}
    rate={0.7}
    frames={630}
    tilt={8}
    camera={[
      { t: 60.99, zoom: 1.1, u: 0.72, v: 0.3 },
      { t: 62.89, zoom: 1.16, u: 0.76, v: 0.34 },
      { t: 68.19, zoom: 1.16, u: 0.76, v: 0.6 },
    ]}
    callouts={[
      { from: 60, to: 320, box: { x: 1225, y: 165, w: 671, h: 72 }, card: { x: 380, y: 300 }, what: "Real memories on mainnet", why: "The live count from Walrus Memory", side: "left" },
      { from: 370, to: 620, box: { x: 1200, y: 640, w: 720, h: 400 }, card: { x: 380, y: 660 }, what: "Every rule has a record", why: "Each one links to its Walrus blob", side: "left" },
    ]}
  />
);

type Part = { id: string; frames: number; render: React.FC; iris?: boolean };
export const PARTS: Part[] = [
  { id: "intro", frames: 870, render: Intro },
  { id: "loop", frames: 900, render: SkillbookLoopScene },
  { id: "sting", frames: 180, render: StingScene },
  { id: "dive", frames: 300, render: LaptopDiveScene },
  { id: "card1", frames: 150, render: Card1 },
  { id: "teach", frames: 924, render: Teach },
  { id: "card2", frames: 150, render: Card2 },
  { id: "recall", frames: 1044, render: Recall },
  { id: "card3", frames: 150, render: Card3 },
  { id: "change", frames: 762, render: Change },
  { id: "card4", frames: 150, render: Card4 },
  { id: "team", frames: 540, render: TeamShot },
  { id: "proof", frames: 630, render: ProofShot },
  { id: "hood", frames: 2400, render: SkillbookHoodScene },
  { id: "end", frames: 600, render: EndCardScene },
];
export const SKILLBOOK_FRAMES = PARTS.reduce((sum, part) => sum + part.frames, 0);

/** Parts overlap by the iris: each opens over the last 24 frames of the one before. */
export const SkillbookDemo: React.FC = () => {
  let at = 0;
  return (
    <AbsoluteFill style={{ background: BG }}>
      {PARTS.map((part, i) => {
        const from = i === 0 ? 0 : at - 24;
        const duration = part.frames + (i === 0 ? 0 : 24);
        at += part.frames;
        const Render = part.render;
        return (
          <Sequence key={part.id} from={from} durationInFrames={duration} name={part.id}>
            {i === 0 ? <Render /> : <Iris><Render /></Iris>}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
