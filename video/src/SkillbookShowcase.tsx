import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { Footage } from "./take/Footage";
import { SkillbookLoopScene } from "./scenes/SkillbookLoopScene";
import { SkillbookHoodScene } from "./scenes/SkillbookHoodScene";
import {
  ShowcaseProvider,
  ShowcaseOrbSwarmScene,
  ShowcaseWordmarkScene,
  ShowcaseLaptopDiveScene,
  ShowcaseChapterGatherScene,
  ShowcaseChapterHighlightScene,
  ShowcasePunchAndOrbitScene,
  ShowcaseCheckCycleScene,
  ShowcaseMetricMorphScene,
  ShowcaseDotBloomOverlay,
  ShowcaseCountGridScene,
  ShowcaseTerminalAndLockupScene,
  ShowcaseTatumAiBuilderLiveScene,
  SkillbookOrbitFlow,
} from "./scenes/SkillbookShowcaseScenes";

export const SHOWCASE_FPS = 30;
export const SHOWCASE_FRAMES = 5280; // 88 bars @ 120 BPM = 176.0s (2:56.0)
export const LAUNCH_X_FRAMES = 1320; // 22 bars @ 120 BPM = 44.0s (0:44.0)

const TAKE = "take/showcase.mp4";
const BG = "#0b0f0e";

/**
 * Full 2:56 Showcase Master (88 bars @ 120 BPM, 1920x1080, 30fps).
 * Combines MIT @snapcn/* motion primitives, custom frame-pure Skillbook physics scenes,
 * and tilted 3D live camera footage of real engineering skills (rust-async-patterns, ui-ux-qa).
 */
export const SkillbookShowcase: React.FC = () => {
  return (
    <ShowcaseProvider>
      <AbsoluteFill style={{ backgroundColor: BG }}>
        {/* S01 (0..240, Bars 1..4): OrbSwarm Cold Open */}
        <Sequence from={0} durationInFrames={240}>
          <ShowcaseOrbSwarmScene speed={0.68} />
        </Sequence>

        {/* S02 (240..480, Bars 5..8): BlockWordmark + Walrus Glint Mark */}
        <Sequence from={240} durationInFrames={240}>
          <ShowcaseWordmarkScene />
        </Sequence>

        {/* S03 (480..660, Bars 9..11): 3D LaptopFrame Open -> Zoom-to-Screen */}
        <Sequence from={480} durationInFrames={180}>
          <ShowcaseLaptopDiveScene speed={1.04} />
        </Sequence>

        {/* S04 (660..780, Bars 12..13): Chapter 01 WordGather */}
        <Sequence from={660} durationInFrames={120}>
          <ShowcaseChapterGatherScene speed={0.82} />
        </Sequence>

        {/* S05A (780..1080, Bars 14..18): Live Act 1A - Clean Signed-Out Gate -> Slush + Enoki Modal */}
        <Sequence from={780} durationInFrames={300}>
          <Footage
            src={TAKE}
            from={0}
            rate={1}
            frames={300}
            background={BG}
            tilt={-8}
            camera={[
              { t: 0, zoom: 1.06, u: 0.48, v: 0.34 },
              { t: 3.8, zoom: 1.14, u: 0.48, v: 0.48 },
              { t: 9.6, zoom: 1.2, u: 0.5, v: 0.54 },
            ]}
            callouts={[
              {
                from: 18,
                to: 106,
                box: { x: 384, y: 108, w: 1500, h: 228 },
                what: "Zero leaked account state",
                why: "Nothing loads before you verify your identity.",
                side: "below",
                card: { x: 409, y: 368 },
              },
              {
                from: 136,
                to: 274,
                box: { x: 645, y: 365, w: 630, h: 351 },
                what: "Slush wallet or Google Enoki zkLogin",
                why: "Sign one gasless message to unlock your team space.",
                side: "below",
                card: { x: 590, y: 744 },
              },
            ]}
          />
        </Sequence>

        {/* S05B (1080..1380, Bars 19..23): Live Act 1B - Unlocked Space + 3D Signer Orbs */}
        <Sequence from={1080} durationInFrames={300}>
          <Footage
            src={TAKE}
            from={18.8}
            rate={1}
            frames={300}
            background={BG}
            tilt={8}
            camera={[
              { t: 18.8, zoom: 1.06, u: 0.54, v: 0.46 },
              { t: 23.6, zoom: 1.15, u: 0.48, v: 0.68 },
              { t: 28.6, zoom: 1.12, u: 0.44, v: 0.74 },
            ]}
            callouts={[
              {
                from: 18,
                to: 138,
                box: { x: 1269, y: 235, w: 615, h: 179 },
                what: "memwal-team-skills unlocked",
                why: "20 engineering skills and live recalls load from Walrus.",
                side: "below",
                card: { x: 1090, y: 444 },
              },
              {
                from: 156,
                to: 280,
                box: { x: 409, y: 721, w: 1450, h: 250 },
                what: "3D dithered signer orbs and Proof links",
                why: "Every recall and rule change carries an on-chain receipt.",
                side: "above",
                card: { x: 520, y: 492 },
              },
            ]}
          />
        </Sequence>

        {/* S06 (1380..1860, Bars 24..31): SkillbookLoopScene (15s physics narrative) */}
        <Sequence from={1380} durationInFrames={480}>
          <SkillbookLoopScene />
        </Sequence>

        {/* S07 (1860..1980, Bars 32..33): Chapter 02 TextHighlight */}
        <Sequence from={1860} durationInFrames={120}>
          <ShowcaseChapterHighlightScene />
        </Sequence>

        {/* S08 (1980..2460, Bars 34..41): Live Act 2 - Teach a Concurrency Rule on rust-async-patterns */}
        <Sequence from={1980} durationInFrames={480}>
          <Footage
            src={TAKE}
            from={29.4}
            rate={1}
            frames={480}
            background={BG}
            tilt={-8}
            camera={[
              { t: 29.4, zoom: 1.08, u: 0.56, v: 0.42 },
              { t: 35.2, zoom: 1.18, u: 0.64, v: 0.38 },
              { t: 41.3, zoom: 1.14, u: 0.62, v: 0.34 },
              { t: 45.2, zoom: 1.1, u: 0.58, v: 0.36 },
            ]}
            callouts={[
              {
                from: 168,
                to: 332,
                box: { x: 793, y: 337, w: 1066, h: 78 },
                what: "Codify production Rust concurrency rules",
                why: "Every agent learns Semaphore and CancellationToken bounds.",
                side: "below",
                card: { x: 830, y: 468 },
              },
              {
                from: 364,
                to: 464,
                box: { x: 793, y: 253, w: 1066, h: 84 },
                what: "Active across your whole team immediately",
                why: "Signed by @mysten-dev and ready for sub-70 ms agent recall.",
                side: "below",
                card: { x: 830, y: 468 },
              },
            ]}
          />
        </Sequence>

        {/* S09 (2460..2640, Bars 42..44): PunchLines + SkillbookOrbitFlow */}
        <Sequence from={2460} durationInFrames={180}>
          <ShowcasePunchAndOrbitScene />
        </Sequence>

        {/* S10A (2640..2850, Bars 45..48.5): Live Act 3A - Five 3D Agent Brand Logos & MCP Setup */}
        <Sequence from={2640} durationInFrames={210}>
          <Footage
            src={TAKE}
            from={47.0}
            rate={1.4}
            frames={210}
            background={BG}
            tilt={8}
            camera={[
              { t: 47.0, zoom: 1.08, u: 0.56, v: 0.28 },
              { t: 53.5, zoom: 1.14, u: 0.58, v: 0.26 },
              { t: 56.8, zoom: 1.12, u: 0.54, v: 0.46 },
            ]}
            callouts={[
              {
                from: 12,
                to: 102,
                box: { x: 384, y: 108, w: 1500, h: 144 },
                what: "Five 3D agent harnesses, one namespace",
                why: "Switch Claude Code, Cursor, Codex, Antigravity, or Tatum AI.",
                side: "below",
                card: { x: 420, y: 286 },
              },
              {
                from: 114,
                to: 198,
                box: { x: 384, y: 276, w: 1500, h: 410 },
                what: "Private key stays in your shell",
                why: "Only $MEMWAL_PRIVATE_KEY is referenced; secrets never touch the app.",
                side: "below",
                card: { x: 540, y: 724 },
              },
            ]}
          />
        </Sequence>

        {/* S10B (2850..3060, Bars 48.5..51): Live Act 3B - Real Computer Use on dashboard.tatum.io/ai-builder */}
        <Sequence from={2850} durationInFrames={210}>
          <ShowcaseTatumAiBuilderLiveScene totalFrames={210} />
        </Sequence>

        {/* S11 (3060..3180, Bars 52..53): Chapter 04 CheckCycle */}
        <Sequence from={3060} durationInFrames={120}>
          <ShowcaseCheckCycleScene />
        </Sequence>

        {/* S12 (3180..3540, Bars 54..59): Live Act 4 - Try It on rust-async-patterns & ui-ux-qa */}
        <Sequence from={3180} durationInFrames={360}>
          <Footage
            src={TAKE}
            from={62.2}
            rate={1}
            frames={360}
            background={BG}
            tilt={-8}
            camera={[
              { t: 62.2, zoom: 1.08, u: 0.6, v: 0.36 },
              { t: 65.5, zoom: 1.12, u: 0.58, v: 0.48 },
              { t: 71.8, zoom: 1.12, u: 0.6, v: 0.48 },
            ]}
            callouts={[
              {
                from: 96,
                to: 202,
                box: { x: 1146, y: 317, w: 738, h: 364 },
                what: "rust-async-patterns: zero Tokio deadlocks",
                why: "Drops the Mutex guard before .await using live Walrus rules.",
                side: "below",
                card: { x: 420, y: 790 },
              },
              {
                from: 286,
                to: 348,
                box: { x: 1146, y: 317, w: 738, h: 364 },
                what: "ui-ux-qa: clean hierarchy and visual proof",
                why: "Every skill adapts agent behavior from shared team memory.",
                side: "below",
                card: { x: 420, y: 790 },
              },
            ]}
          />
        </Sequence>

        {/* S13 (3540..3720, Bars 60..62): SkillbookMetricMorph (Deadlock Prevented Chart) */}
        <Sequence from={3540} durationInFrames={180}>
          <ShowcaseMetricMorphScene />
        </Sequence>

        {/* S14A (3720..3900, Bars 63..65): Live Act 5A - Team 3D Dithered Orbs + Tatum Sui RPC */}
        <Sequence from={3720} durationInFrames={180}>
          <Footage
            src={TAKE}
            from={77.2}
            rate={1}
            frames={180}
            background={BG}
            tilt={8}
            camera={[
              { t: 77.2, zoom: 1.1, u: 0.52, v: 0.56 },
              { t: 83.0, zoom: 1.16, u: 0.48, v: 0.58 },
            ]}
            callouts={[
              {
                from: 24,
                to: 162,
                box: { x: 409, y: 457, w: 1450, h: 220 },
                what: "3D dithered signer orbs verified via Tatum",
                why: "Every owner and delegate key is checked directly against Sui.",
                side: "below",
                card: { x: 420, y: 786 },
              },
            ]}
          />
        </Sequence>

        {/* Halftone DotBloom Transition straddling cut at 3720 (DOT_BLOOM_CUT = 16) */}
        <Sequence from={3720 - 16} durationInFrames={30}>
          <ShowcaseDotBloomOverlay />
        </Sequence>

        {/* S14B (3900..4140, Bars 66..69): Live Act 5B - Mainnet Proof Drawer */}
        <Sequence from={3900} durationInFrames={240}>
          <Footage
            src={TAKE}
            from={88.8}
            rate={1}
            frames={240}
            background={BG}
            tilt={-8}
            camera={[
              { t: 88.8, zoom: 1.08, u: 0.66, v: 0.42 },
              { t: 93.0, zoom: 1.14, u: 0.7, v: 0.48 },
              { t: 96.6, zoom: 1.14, u: 0.7, v: 0.56 },
            ]}
            callouts={[
              {
                from: 48,
                to: 222,
                box: { x: 1200, y: 84, w: 700, h: 900 },
                what: "Mainnet cryptographic proof drawer",
                why: "Inspect the Sui account, Seal package, and 94 Walrus blobs live.",
                side: "left",
                card: { x: 320, y: 410 },
              },
            ]}
          />
        </Sequence>

        {/* S15 (4140..4800, Bars 70..80): SkillbookHoodScene (Seal -> Walrus -> Sui -> Tatum -> Recall) */}
        <Sequence from={4140} durationInFrames={660}>
          <SkillbookHoodScene speed={1.78} />
        </Sequence>

        {/* S16 (4800..4980, Bars 81..83): CountGrid Payoff (1 -> 94+ mainnet memories) */}
        <Sequence from={4800} durationInFrames={180}>
          <ShowcaseCountGridScene speed={0.85} />
        </Sequence>

        {/* S17 (4980..5280, Bars 84..88): TerminalSimulator -> 1-Beat Breath -> 5.0s End Lockup */}
        <Sequence from={4980} durationInFrames={300}>
          <ShowcaseTerminalAndLockupScene
            terminalFrames={135}
            breathFrames={15}
            lockupFrames={150}
            terminalSpeed={1.22}
          />
        </Sequence>
      </AbsoluteFill>
    </ShowcaseProvider>
  );
};

/**
 * 0:44 X Launch Cut (22 bars @ 120 BPM = 1320 frames @ 30fps, 1920x1080).
 * Re-timed from the exact same Showcase scenes and live take.
 */
export const SkillbookLaunchX: React.FC = () => {
  return (
    <ShowcaseProvider>
      <AbsoluteFill style={{ backgroundColor: BG }}>
        {/* X01 (0..120, 2 bars): OrbSwarm Hook */}
        <Sequence from={0} durationInFrames={120}>
          <ShowcaseOrbSwarmScene speed={1.36} />
        </Sequence>

        {/* X02 (120..180, 1 bar): Fast BlockWordmark */}
        <Sequence from={120} durationInFrames={60}>
          <ShowcaseWordmarkScene fast />
        </Sequence>

        {/* X03 (180..270, 1.5 bars): 3D LaptopFrame Dive */}
        <Sequence from={180} durationInFrames={90}>
          <ShowcaseLaptopDiveScene speed={2.06} />
        </Sequence>

        {/* X04A (270..360, 1.5 bars): Enoki + Slush Sign-In Modal */}
        <Sequence from={270} durationInFrames={90}>
          <Footage
            src={TAKE}
            from={3.8}
            rate={1}
            frames={90}
            background={BG}
            tilt={-7}
            camera={[
              { t: 3.8, zoom: 1.14, u: 0.5, v: 0.52 },
              { t: 6.6, zoom: 1.2, u: 0.5, v: 0.54 },
            ]}
            callouts={[
              {
                from: 10,
                to: 78,
                box: { x: 645, y: 365, w: 630, h: 351 },
                what: "Slush or Google Enoki zkLogin",
                why: "Zero leaked state until you sign one message.",
                side: "below",
                card: { x: 600, y: 744 },
              },
            ]}
          />
        </Sequence>

        {/* X04B (360..450, 1.5 bars): Unlocked Home + 3D Signer Orbs */}
        <Sequence from={360} durationInFrames={90}>
          <Footage
            src={TAKE}
            from={18.9}
            rate={1}
            frames={90}
            background={BG}
            tilt={7}
            camera={[
              { t: 18.9, zoom: 1.08, u: 0.52, v: 0.56 },
              { t: 21.7, zoom: 1.14, u: 0.48, v: 0.68 },
            ]}
            callouts={[]}
          />
        </Sequence>

        {/* X05 (450..630, 3 bars): Teach a Concurrency Rule Live on rust-async-patterns */}
        <Sequence from={450} durationInFrames={180}>
          <Footage
            src={TAKE}
            from={37.6}
            rate={1}
            frames={180}
            background={BG}
            tilt={-7}
            camera={[
              { t: 37.6, zoom: 1.16, u: 0.64, v: 0.38 },
              { t: 41.4, zoom: 1.12, u: 0.62, v: 0.34 },
            ]}
            callouts={[
              {
                from: 108,
                to: 168,
                box: { x: 793, y: 253, w: 1066, h: 84 },
                what: "Codify Rust async bounds once",
                why: "Live across your whole team immediately.",
                side: "below",
                card: { x: 830, y: 468 },
              },
            ]}
          />
        </Sequence>

        {/* X06 (630..750, 2 bars): SkillbookOrbitFlow (5 IDEs -> memwal-mcp) */}
        <Sequence from={630} durationInFrames={120}>
          <SkillbookOrbitFlow />
        </Sequence>

        {/* X07A (750..825, 1.25 bars): 5 3D Agent Brand Logos on /agents */}
        <Sequence from={750} durationInFrames={75}>
          <Footage
            src={TAKE}
            from={47.2}
            rate={1.2}
            frames={75}
            background={BG}
            tilt={7}
            camera={[
              { t: 47.2, zoom: 1.1, u: 0.56, v: 0.28 },
              { t: 50.0, zoom: 1.14, u: 0.58, v: 0.32 },
            ]}
            callouts={[
              {
                from: 8,
                to: 68,
                box: { x: 384, y: 108, w: 1500, h: 144 },
                what: "Five 3D coding harnesses synced",
                why: "Claude Code, Cursor, Codex, Antigravity, Tatum AI.",
                side: "below",
                card: { x: 420, y: 286 },
              },
            ]}
          />
        </Sequence>

        {/* X07B (825..900, 1.25 bars): Live Computer Use on dashboard.tatum.io/ai-builder */}
        <Sequence from={825} durationInFrames={75}>
          <ShowcaseTatumAiBuilderLiveScene totalFrames={75} />
        </Sequence>

        {/* X08 (900..1020, 2 bars): Try It Verdict (rust-async-patterns zero deadlocks) */}
        <Sequence from={900} durationInFrames={120}>
          <Footage
            src={TAKE}
            from={64.6}
            rate={1}
            frames={120}
            background={BG}
            tilt={-7}
            camera={[
              { t: 64.6, zoom: 1.1, u: 0.58, v: 0.48 },
              { t: 68.4, zoom: 1.14, u: 0.62, v: 0.48 },
            ]}
            callouts={[
              {
                from: 24,
                to: 108,
                box: { x: 1146, y: 317, w: 738, h: 364 },
                what: "Drops lock before await, zero deadlocks",
                why: "Live Walrus rule recalled in 69 ms.",
                side: "below",
                card: { x: 420, y: 790 },
              },
            ]}
          />
        </Sequence>

        {/* X09 (1020..1140, 2 bars): CountGrid 94+ Mainnet Memories */}
        <Sequence from={1020} durationInFrames={120}>
          <ShowcaseCountGridScene speed={1.28} />
        </Sequence>

        {/* Halftone DotBloom straddling cut at 1020 */}
        <Sequence from={1020 - 16} durationInFrames={30}>
          <ShowcaseDotBloomOverlay />
        </Sequence>

        {/* X10 (1140..1320, 3 bars): Fast Terminal -> 1-Beat Breath -> 3.5s End Lockup */}
        <Sequence from={1140} durationInFrames={180}>
          <ShowcaseTerminalAndLockupScene
            terminalFrames={60}
            breathFrames={15}
            lockupFrames={105}
            terminalSpeed={2.5}
          />
        </Sequence>
      </AbsoluteFill>
    </ShowcaseProvider>
  );
};
