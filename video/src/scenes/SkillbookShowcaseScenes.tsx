import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SnapCnUIProvider, type SnapCnTheme } from "@/lib/snap-cn-ui/theme";
import { ChromaCurrentBackdrop } from "@/components/backgrounds/ChromaCurrentBackdrop";
import { OrbSwarm } from "@/components/snap-cn/orb-swarm";
import { BlockWordmark } from "@/components/snap-cn/block-wordmark";
import { LaptopFrame } from "@/components/snap-cn/laptop-frame";
import { WordGather } from "@/components/snap-cn/word-gather";
import { TextHighlight } from "@/components/snap-cn/text-highlight";
import { PunchLines } from "@/components/snap-cn/punch-lines";
import { CheckCycle } from "@/components/snap-cn/check-cycle";
import { CountGrid } from "@/components/snap-cn/count-grid";
import { TerminalSimulator } from "@/components/snap-cn/terminal-simulator";
import { DotBloom } from "@/components/snap-cn/dot-bloom";
import { ACCENT, BG, GEIST, INK, INK2, Mark, ON_ACCENT, SERIF, SURFACE, T, clamp, ramp, springAt } from "./SkillbookShared";

/**
 * Concrete hex tokens derived directly from src/shell/tokens.css (.dark).
 * SnapCnUI's OKLCH mixer parses concrete hex colors cleanly.
 */
export const SKILLBOOK_SNAP_THEME: Partial<SnapCnTheme> = {
  background: "#0b0f0e",
  foreground: "#f4f6f5",
  card: "#121816",
  cardForeground: "#f4f6f5",
  primary: "#34d399",
  primaryForeground: "#04140d",
  secondary: "#18201e",
  secondaryForeground: "#f4f6f5",
  muted: "#18201e",
  mutedForeground: "#a7b0ad",
  accent: "#222b29",
  accentForeground: "#f4f6f5",
  border: "#252f2c",
  fontFamily: GEIST,
  radius: 14,
};

export const ShowcaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <SnapCnUIProvider theme={SKILLBOOK_SNAP_THEME} mode="dark">
    {children}
  </SnapCnUIProvider>
);

const MONO = "'JetBrains Mono', ui-monospace, Menlo, monospace";

const ChapterBadge: React.FC<{ step: string; label: string }> = ({ step, label }) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: 96,
        top: 76,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "10px 20px",
        borderRadius: 999,
        background: "rgba(18, 24, 22, 0.86)",
        border: "1px solid #252f2c",
        opacity: op,
        zIndex: 10,
      }}
    >
      <span style={{ fontFamily: MONO, fontSize: 20, fontWeight: 600, color: ACCENT }}>{step}</span>
      <span style={{ width: 5, height: 5, borderRadius: 99, background: "#4b5954" }} />
      <span style={{ fontFamily: GEIST, fontSize: 21, fontWeight: 500, color: INK2 }}>{label}</span>
    </div>
  );
};

/* ---------- S01: OrbSwarm Cold Open ---------- */
export const ShowcaseOrbSwarmScene: React.FC<{ speed?: number }> = ({ speed = 0.68 }) => (
  <AbsoluteFill style={{ background: BG }}>
    <OrbSwarm
      script="Why did prod | deadlock under load | Cursor held a Mutex | across .await | Claude Code already fixed it | Share rules once."
      background="#0b0f0e"
      ink="#f4f6f5"
      orbColor="#34d399"
      softness={0}
      fontFamily={GEIST}
      theme={SKILLBOOK_SNAP_THEME}
      mode="dark"
      speed={speed}
    />
  </AbsoluteFill>
);

/* ---------- S02: BlockWordmark + Walrus Glint Mark ---------- */
export const ShowcaseWordmarkScene: React.FC<{ fast?: boolean }> = ({ fast = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const tagIn = ramp(t, fast ? 0.55 : 1.35, fast ? 0.95 : 1.9);
  const glintX = interpolate(frame, [fast ? 8 : 20, fast ? 48 : 88], [-120, 220], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: BG }}>
      <ChromaCurrentBackdrop mode="dark" intensity={0.75} />
      <AbsoluteFill style={{ opacity: 0.96 }}>
        <BlockWordmark
          text="Skillbook"
          fontSize={fast ? 148 : 158}
          color="#f4f6f5"
          colors={["#34d399", "#10b981", "#047857", "#6ee7b7"]}
          background="transparent"
          holdDuration={18}
          speed={fast ? 2.8 : 1.25}
        />
      </AbsoluteFill>

      {/* Top Walrus mark with diagonal emerald specular glint */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 158,
          display: "flex",
          justifyContent: "center",
          opacity: ramp(t, 0.1, 0.45),
          transform: `scale(${clamp(springAt(t, 0.08, 13), 0, 1.08)})`,
        }}
      >
        <div
          style={{
            position: "relative",
            width: 88,
            height: 88,
            borderRadius: 24,
            background: "#121816",
            border: "1px solid rgba(52, 211, 153, 0.38)",
            boxShadow: "0 20px 54px rgba(16, 185, 129, 0.24)",
            display: "grid",
            placeItems: "center",
            overflow: "hidden",
          }}
        >
          <Mark size={54} color={ACCENT} />
          <div
            style={{
              position: "absolute",
              top: -30,
              left: glintX,
              width: 34,
              height: 150,
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)",
              transform: "rotate(24deg)",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>

      {/* Bottom subtitle */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 138,
          textAlign: "center",
          opacity: tagIn,
          transform: `translateY(${(1 - tagIn) * 18}px)`,
        }}
      >
        <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 46, color: ACCENT }}>
          Shared team memory
        </span>
        <span style={{ fontFamily: GEIST, fontSize: 40, color: INK2, marginLeft: 14 }}>
          for every coding agent, sealed on Walrus and Sui.
        </span>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- S03: 3D LaptopFrame Open -> Zoom-to-Screen ---------- */
export const ShowcaseLaptopDiveScene: React.FC<{ speed?: number }> = ({ speed = 1.04 }) => {
  const frame = useCurrentFrame();
  const titleOp = interpolate(frame, [0, 14, 96, 122], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ background: BG }}>
      <ChromaCurrentBackdrop mode="dark" intensity={0.85} />
      <LaptopFrame
        entrance="open"
        finale="zoom-to-screen"
        bezelColor="#18201e"
        screenColor="#0b0f0e"
        theme={SKILLBOOK_SNAP_THEME}
        mode="dark"
        speed={speed}
      >
        <Img
          src={staticFile("take/cards/card-01.png")}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </LaptopFrame>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 54,
          textAlign: "center",
          opacity: titleOp,
          pointerEvents: "none",
        }}
      >
        <T size={32} color={INK2}>
          Inside your live workspace on Skillbook
        </T>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- S04: Chapter 01 WordGather ---------- */
export const ShowcaseChapterGatherScene: React.FC<{ speed?: number }> = ({ speed = 0.82 }) => (
  <AbsoluteFill style={{ background: BG }}>
    <ChromaCurrentBackdrop mode="dark" intensity={0.78} />
    <WordGather
      text="Zero leaked state before you sign in."
      maxWidth={360}
      accent="#34d399"
      fontFamily={GEIST}
      fontWeight={600}
      theme={{ ...SKILLBOOK_SNAP_THEME, background: "transparent" }}
      mode="dark"
      speed={speed}
    />
    <ChapterBadge step="01" label="Clean Auth Gate and Enoki zkLogin" />
  </AbsoluteFill>
);

/* ---------- S07: Chapter 02 TextHighlight ---------- */
export const ShowcaseChapterHighlightScene: React.FC = () => (
  <AbsoluteFill style={{ background: BG }}>
    <ChromaCurrentBackdrop mode="dark" intensity={0.78} />
    <TextHighlight
      before="You teach a rule "
      highlight="once."
      after=" Every agent reads it."
      preset="marker"
      baseColor="#f4f6f5"
      accentColor="#34d399"
      highlightedTextColor="#ffffff"
      fontFamily={GEIST}
      fontSize={74}
      fontWeight={600}
      startAt={12}
      drawDuration={24}
      theme={{ ...SKILLBOOK_SNAP_THEME, background: "transparent" }}
      mode="dark"
    />
    <ChapterBadge step="02" label="Skills and Live Rules" />
  </AbsoluteFill>
);

/* ---------- Dark Skillbook OrbitFlow (5 IDEs converging into Walrus Hub) ---------- */
const ORBIT_AGENTS = [
  { label: "Claude Code", tint: "#d97757" },
  { label: "Cursor", tint: "#38bdf8" },
  { label: "Codex", tint: "#34d399" },
  { label: "Antigravity", tint: "#a78bfa" },
  { label: "Tatum AI", tint: "#60a5fa" },
];

export const SkillbookOrbitFlow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const cx = width / 2;
  const cy = height / 2 + 24;

  const mergeStart = Math.round(fps * 1.15);
  const mergeSpring = spring({
    frame: frame - mergeStart,
    fps,
    config: { damping: 14, stiffness: 120, mass: 0.9 },
  });
  const hubScale = interpolate(mergeSpring, [0, 1], [0.2, 1]);
  const hubOp = interpolate(frame, [mergeStart - 4, mergeStart + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rayProgress = spring({
    frame: frame - (mergeStart + 8),
    fps,
    config: { damping: 15, stiffness: 130 },
  });

  return (
    <AbsoluteFill style={{ background: BG }}>
      <ChromaCurrentBackdrop mode="dark" intensity={0.85} />
      <ChapterBadge step="03" label="One Namespace Across Five Agents" />

      <div
        style={{
          position: "absolute",
          left: 96,
          top: 158,
          opacity: interpolate(frame, [0, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        <T size={64} weight={600}>
          Five coding harnesses,{" "}
        </T>
        <T size={68} serif color={ACCENT}>
          one shared memory.
        </T>
      </div>

      {/* Concentric emerald rings */}
      {[180, 300, 420].map((r) => (
        <div
          key={r}
          style={{
            position: "absolute",
            left: cx - r,
            top: cy - r,
            width: r * 2,
            height: r * 2,
            borderRadius: "50%",
            border: "1px dashed rgba(52, 211, 153, 0.18)",
          }}
        />
      ))}

      {/* Orbiting 3D-tinted agent pills */}
      {ORBIT_AGENTS.map((item, i) => {
        const enter = spring({
          frame: frame - i * 3,
          fps,
          config: { damping: 14, stiffness: 150 },
        });
        const baseAngle = (i / ORBIT_AGENTS.length) * Math.PI * 2 - Math.PI / 2;
        const angle = baseAngle + (frame / fps) * 1.15;
        const radius = interpolate(mergeSpring, [0, 1], [310, 0]);
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius * 0.72;
        const pillOp = interpolate(mergeSpring, [0.55, 0.96], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <div
            key={item.label}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: `translate(-50%, -50%) scale(${enter})`,
              opacity: pillOp,
              padding: "14px 26px",
              borderRadius: 999,
              background: "#121816",
              border: `1.5px solid ${item.tint}`,
              boxShadow: "0 16px 38px rgba(0, 0, 0, 0.45)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 99,
                background: item.tint,
                boxShadow: `0 0 12px ${item.tint}`,
              }}
            />
            <span style={{ fontFamily: GEIST, fontSize: 25, fontWeight: 600, color: INK }}>{item.label}</span>
          </div>
        );
      })}

      {/* Outgoing recall rays + settled badges after merge */}
      {rayProgress > 0.02 && (
        <svg width={width} height={height} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {ORBIT_AGENTS.map((item, i) => {
            const a = (i / ORBIT_AGENTS.length) * Math.PI * 2 - Math.PI / 2;
            const r1 = 96;
            const r2 = r1 + 260 * rayProgress;
            return (
              <line
                key={item.label}
                x1={cx + Math.cos(a) * r1}
                y1={cy + Math.sin(a) * r1 * 0.78}
                x2={cx + Math.cos(a) * r2}
                y2={cy + Math.sin(a) * r2 * 0.78}
                stroke={ACCENT}
                strokeWidth={3}
                strokeLinecap="round"
                opacity={0.78}
              />
            );
          })}
        </svg>
      )}

      {rayProgress > 0.25 &&
        ORBIT_AGENTS.map((item, i) => {
          const a = (i / ORBIT_AGENTS.length) * Math.PI * 2 - Math.PI / 2;
          const x = cx + Math.cos(a) * 380;
          const y = cy + Math.sin(a) * 380 * 0.78;
          return (
            <div
              key={`out-${item.label}`}
              style={{
                position: "absolute",
                left: x,
                top: y,
                transform: `translate(-50%, -50%) scale(${rayProgress})`,
                opacity: rayProgress,
                padding: "12px 22px",
                borderRadius: 16,
                background: "#18201e",
                border: "1px solid rgba(52, 211, 153, 0.45)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ fontFamily: MONO, fontSize: 18, color: ACCENT }}>✓</span>
              <span style={{ fontFamily: GEIST, fontSize: 22, fontWeight: 600, color: INK }}>{item.label}</span>
            </div>
          );
        })}

      {/* Central Walrus Skillbook Hub */}
      <div
        style={{
          position: "absolute",
          left: cx,
          top: cy,
          transform: `translate(-50%, -50%) scale(${hubScale})`,
          opacity: hubOp,
          width: 176,
          height: 176,
          borderRadius: 42,
          background: "#121816",
          border: "2px solid #34d399",
          boxShadow: "0 0 70px rgba(52, 211, 153, 0.35), 0 24px 60px rgba(0, 0, 0, 0.6)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <Mark size={68} color={ACCENT} />
        <span style={{ fontFamily: MONO, fontSize: 17, fontWeight: 600, color: ACCENT }}>memwal-mcp</span>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- S09: PunchLines + SkillbookOrbitFlow ---------- */
export const ShowcasePunchAndOrbitScene: React.FC = () => (
  <AbsoluteFill style={{ background: BG }}>
    <Sequence from={0} durationInFrames={90}>
      <PunchLines
        script="Five coding agents. / One shared brain. | Connect once. | Every IDE recalls."
        styles="slide,punch,punch"
        sizes="1,1.32,1.24"
        holds="34,28,28"
        accentBeat={3}
        fontSize={86}
        fontWeight={600}
        fontFamily={GEIST}
        theme={SKILLBOOK_SNAP_THEME}
        mode="dark"
      />
    </Sequence>
    <Sequence from={90} durationInFrames={90}>
      <SkillbookOrbitFlow />
    </Sequence>
  </AbsoluteFill>
);

/* ---------- S10B: Live Tatum AI Builder (dashboard.tatum.io/ai-builder) Execution ---------- */
const TATUM_AI_FRAMES = [
  {
    src: staticFile("take/tatum/tatum-01-prompt.png"),
    step: "STEP 1 · PROMPT",
    title: "Tatum AI Builder connects to Skillbook MCP",
    sub: "Requests memwal-team-skills rules and Sui owner verification on dashboard.tatum.io/ai-builder",
  },
  {
    src: staticFile("take/tatum/tatum-02-stream.png"),
    step: "STEP 2 · LIVE STREAM",
    title: "Executes live Walrus recall + Tatum v3 Security",
    sub: "Calls POST /api/tatum-memwal/recall and screens 0x8a2572... with SUI/USD rate",
  },
  {
    src: staticFile("take/tatum/tatum-04-preview.png"),
    step: "STEP 3 · LIVE APP PREVIEW",
    title: "12 Walrus Mainnet rules recalled and verified",
    sub: "Bridge Connected · OFAC / Scam Cleared · SUI Spot Rate $0.8397",
  },
  {
    src: staticFile("take/tatum/tatum-05-code.png"),
    step: "STEP 4 · CODE IMPACT",
    title: "Tokio handler refactored before and after",
    sub: "Drops std::sync::MutexGuard before .await and wraps WalrusBlobId newtypes",
  },
];

export const ShowcaseTatumAiBuilderLiveScene: React.FC<{ totalFrames?: number }> = ({
  totalFrames = 210,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const perSlide = Math.max(18, Math.floor(totalFrames / TATUM_AI_FRAMES.length));
  const idx = Math.min(TATUM_AI_FRAMES.length - 1, Math.floor(frame / perSlide));
  const localFrame = frame - idx * perSlide;
  const enter = spring({ frame: localFrame, fps, config: { damping: 16, stiffness: 140 } });
  const zoom = interpolate(localFrame, [0, perSlide], [1.0, 1.035], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const item = TATUM_AI_FRAMES[idx];

  return (
    <AbsoluteFill style={{ background: BG }}>
      <ChromaCurrentBackdrop mode="dark" intensity={0.78} />
      <ChapterBadge step="03B" label="Live Execution on dashboard.tatum.io/ai-builder" />

      <div
        style={{
          position: "absolute",
          left: 110,
          right: 110,
          top: 128,
          bottom: 168,
          borderRadius: 24,
          overflow: "hidden",
          border: "1.5px solid rgba(52, 211, 153, 0.42)",
          boxShadow: "0 36px 90px rgba(0, 0, 0, 0.68), 0 0 60px rgba(16, 185, 129, 0.18)",
          background: "#0b0f0e",
          transform: `scale(${0.97 + 0.03 * enter})`,
        }}
      >
        <Img
          src={item.src}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center top",
            transform: `scale(${zoom})`,
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: 140,
          right: 140,
          bottom: 36,
          padding: "20px 30px",
          borderRadius: 20,
          background: "rgba(14, 19, 17, 0.94)",
          border: "1.5px solid rgba(52, 211, 153, 0.45)",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        <div>
          <div style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, color: ACCENT }}>
            {item.step} · COMPUTER USE LIVE RECORDING
          </div>
          <div style={{ fontFamily: GEIST, fontSize: 28, fontWeight: 600, color: INK, marginTop: 4 }}>
            {item.title}
          </div>
          <div style={{ fontFamily: GEIST, fontSize: 20, color: INK2, marginTop: 2 }}>
            {item.sub}
          </div>
        </div>
        <div
          style={{
            padding: "10px 18px",
            borderRadius: 12,
            background: "rgba(52, 211, 153, 0.14)",
            border: "1px solid rgba(52, 211, 153, 0.4)",
            fontFamily: MONO,
            fontSize: 18,
            fontWeight: 600,
            color: ACCENT,
            whiteSpace: "nowrap",
          }}
        >
          dashboard.tatum.io/ai-builder
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- S11: Chapter 04 CheckCycle ---------- */
export const ShowcaseCheckCycleScene: React.FC = () => (
  <AbsoluteFill style={{ background: BG }}>
    <ChromaCurrentBackdrop mode="dark" intensity={0.72} />
    <CheckCycle
      headline="Before and after your team's"
      words="rules, proof, memory"
      fontFamily={GEIST}
      theme={{ ...SKILLBOOK_SNAP_THEME, background: "transparent" }}
      mode="dark"
    />
    <ChapterBadge step="04" label="Side by Side Behavioral Verdict" />
  </AbsoluteFill>
);

/* ---------- S13: SkillbookMetricMorph (Capsule -> Lock-Free Impact Chart) ---------- */
const IMPACT_BARS = [
  { label: "Without rules", mins: 45, heightPct: 0.92, bad: true, note: "Holds Mutex across await, stalls workers" },
  { label: "Recall latency", mins: 0.05, heightPct: 0.14, bad: false, note: "52 ms live Walrus read" },
  { label: "With Skillbook", mins: 1, heightPct: 0.22, bad: false, note: "Clones Arc handle, drops lock before await" },
];

export const ShowcaseMetricMorphScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const pillIn = spring({ frame, fps, config: { damping: 14, stiffness: 150 } });
  const morphAt = 32;
  const morph = spring({
    frame: frame - morphAt,
    fps,
    config: { damping: 16, stiffness: 120 },
  });

  const w = interpolate(morph, [0, 1], [780, 1280]);
  const h = interpolate(morph, [0, 1], [116, 640]);
  const radius = interpolate(morph, [0, 1], [58, 32]);
  const pillOp = interpolate(frame, [morphAt - 4, morphAt + 8], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const chartOp = interpolate(frame, [morphAt + 4, morphAt + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: BG, display: "grid", placeItems: "center" }}>
      <ChromaCurrentBackdrop mode="dark" intensity={0.82} />
      <ChapterBadge step="04B" label="Production Incident Prevented Before Merge" />

      <div
        style={{
          width: w,
          height: h,
          borderRadius: radius,
          background: "rgba(18, 24, 22, 0.94)",
          border: "1.5px solid rgba(52, 211, 153, 0.36)",
          boxShadow: "0 32px 84px rgba(0, 0, 0, 0.58), 0 0 60px rgba(16, 185, 129, 0.14)",
          transform: `scale(${pillIn})`,
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Phase 1: Verdict Capsule */}
        <div
          style={{
            position: "absolute",
            display: "flex",
            alignItems: "center",
            gap: 18,
            opacity: pillOp,
          }}
        >
          <span
            style={{
              width: 38,
              height: 38,
              borderRadius: 99,
              background: ACCENT,
              color: ON_ACCENT,
              display: "grid",
              placeItems: "center",
              fontFamily: MONO,
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            ✓
          </span>
          <T size={38} weight={600}>
            Drops lock before await, zero deadlocks
          </T>
        </div>

        {/* Phase 2: Expanded Impact Chart */}
        <div
          style={{
            opacity: chartOp,
            width: "100%",
            height: "100%",
            padding: "46px 58px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 20, color: ACCENT, fontWeight: 600 }}>
                LIVE RECALL IMPACT · RUST-ASYNC-PATTERNS
              </div>
              <div style={{ marginTop: 8 }}>
                <T size={50} weight={600}>
                  Deadlock prevented{" "}
                </T>
                <T size={52} serif color={ACCENT}>
                  before code review.
                </T>
              </div>
            </div>
            <div
              style={{
                padding: "12px 22px",
                borderRadius: 16,
                background: "rgba(52, 211, 153, 0.14)",
                border: "1px solid rgba(52, 211, 153, 0.4)",
                fontFamily: MONO,
                fontSize: 24,
                fontWeight: 600,
                color: ACCENT,
              }}
            >
              Rules recalled in 52 ms
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 28,
              alignItems: "end",
              height: 360,
              paddingTop: 24,
            }}
          >
            {IMPACT_BARS.map((bar, idx) => {
              const grow = spring({
                frame: frame - (morphAt + 12 + idx * 5),
                fps,
                config: { damping: 14, stiffness: 130 },
              });
              const barH = Math.max(36, Math.round(230 * bar.heightPct * grow));
              return (
                <div
                  key={bar.label}
                  style={{
                    background: SURFACE,
                    border: `1px solid ${bar.bad ? "rgba(248, 113, 113, 0.35)" : "rgba(52, 211, 153, 0.35)"}`,
                    borderRadius: 22,
                    padding: 24,
                    height: 330,
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontFamily: GEIST, fontSize: 24, fontWeight: 600, color: INK }}>
                      {bar.label}
                    </span>
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 26,
                        fontWeight: 700,
                        color: bar.bad ? "#f87171" : ACCENT,
                      }}
                    >
                      {bar.mins < 1 ? `${Math.round(bar.mins * 60)}s` : `${bar.mins}m`}
                    </span>
                  </div>
                  <div style={{ height: 190, display: "flex", alignItems: "flex-end" }}>
                    <div
                      style={{
                        width: "100%",
                        height: barH,
                        borderRadius: 14,
                        background: bar.bad
                          ? "linear-gradient(180deg, #f87171, rgba(248, 113, 113, 0.28))"
                          : "linear-gradient(180deg, #34d399, rgba(16, 185, 129, 0.28))",
                      }}
                    />
                  </div>
                  <div style={{ fontFamily: GEIST, fontSize: 20, color: INK2 }}>{bar.note}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- Halftone DotBloom Transition Overlay ---------- */
export const ShowcaseDotBloomOverlay: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none", zIndex: 40 }}>
    <DotBloom speed={1} />
  </AbsoluteFill>
);

/* ---------- S16: CountGrid Proof Payoff (1 -> 94+ mainnet memories) ---------- */
const SHOWCASE_CARDS = [
  staticFile("take/cards/card-01.png"),
  staticFile("take/cards/card-02.png"),
  staticFile("take/cards/card-03.png"),
  staticFile("take/cards/card-05.png"),
  staticFile("take/cards/card-06.png"),
  staticFile("take/cards/card-07.png"),
  staticFile("take/cards/card-08.png"),
  staticFile("take/cards/card-04.png"),
];

export const ShowcaseCountGridScene: React.FC<{ speed?: number }> = ({ speed = 0.85 }) => (
  <AbsoluteFill style={{ background: BG }}>
    <CountGrid
      from="1"
      to="94+"
      noun="mainnet memories"
      cards={SHOWCASE_CARDS}
      background="#0b0f0e"
      inkFrom="#f4f6f5"
      inkTo="#34d399"
      theme={SKILLBOOK_SNAP_THEME}
      mode="dark"
      speed={speed}
    />
  </AbsoluteFill>
);

/* ---------- Final End Lockup (Held cleanly >= 5.0s in Master, >= 3.5s in X Cut) ---------- */
export const SkillbookEndLockup: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const enter = clamp(springAt(t, 0.05, 12), 0, 1.04);
  const glintX = interpolate(frame, [10, 68], [-140, 260], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: BG }}>
      <ChromaCurrentBackdrop mode="dark" intensity={0.95} />

      <AbsoluteFill style={{ display: "grid", placeItems: "center" }}>
        <div
          style={{
            width: 1360,
            padding: "64px 76px",
            borderRadius: 38,
            background: "rgba(18, 24, 22, 0.88)",
            border: "1.5px solid rgba(52, 211, 153, 0.38)",
            boxShadow: "0 40px 100px rgba(0, 0, 0, 0.65), 0 0 80px rgba(16, 185, 129, 0.16)",
            transform: `scale(${0.95 + 0.05 * enter}) translateY(${(1 - enter) * 24}px)`,
            opacity: clamp(enter * 1.6),
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            boxSizing: "border-box",
          }}
        >
          {/* Animated Walrus Mark + Wordmark */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div
              style={{
                position: "relative",
                width: 72,
                height: 72,
                borderRadius: 20,
                background: "#18201e",
                border: "1px solid rgba(52, 211, 153, 0.45)",
                display: "grid",
                placeItems: "center",
                overflow: "hidden",
              }}
            >
              <Mark size={44} color={ACCENT} />
              <div
                style={{
                  position: "absolute",
                  top: -24,
                  left: glintX,
                  width: 28,
                  height: 120,
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)",
                  transform: "rotate(24deg)",
                }}
              />
            </div>
            <T size={56} weight={600}>
              Skillbook
            </T>
          </div>

          <div style={{ marginTop: 30 }}>
            <T size={86} weight={600}>
              Teach your agents once.
            </T>
          </div>
          <div style={{ marginTop: 4 }}>
            <T size={80} serif color={ACCENT}>
              Every coding harness remembers.
            </T>
          </div>

          {/* Copyable MCP command pill */}
          <div
            style={{
              marginTop: 40,
              width: "100%",
              maxWidth: 1120,
              height: 84,
              borderRadius: 18,
              background: "#0b0f0e",
              border: "1px solid #252f2c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              padding: "0 32px",
              boxSizing: "border-box",
            }}
          >
            <span style={{ fontFamily: MONO, fontSize: 26, color: ACCENT, fontWeight: 700 }}>$</span>
            <span style={{ fontFamily: MONO, fontSize: 26, color: INK }}>
              claude mcp add memwal -- npx -y @mysten-incubation/memwal-mcp
            </span>
          </div>

          {/* Live URL + protocol footer */}
          <div
            style={{
              marginTop: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 18,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontFamily: MONO, fontSize: 21, color: ACCENT, whiteSpace: "nowrap" }}>
              memwal-skill-harness-production.up.railway.app
            </span>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: "#4b5954", flexShrink: 0 }} />
            <span style={{ fontFamily: GEIST, fontSize: 22, color: INK2, whiteSpace: "nowrap" }}>
              Sealed on Walrus · Gated on Sui · Verified via Tatum RPC
            </span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------- S17: TerminalSimulator -> 1-Beat Breath -> SkillbookEndLockup ---------- */
export const ShowcaseTerminalAndLockupScene: React.FC<{
  terminalFrames: number;
  breathFrames: number;
  lockupFrames: number;
  terminalSpeed?: number;
}> = ({ terminalFrames, breathFrames, lockupFrames, terminalSpeed = 1 }) => {
  const lockupStart = terminalFrames + breathFrames;
  return (
    <AbsoluteFill style={{ background: BG }}>
      <Sequence from={0} durationInFrames={terminalFrames}>
        <AbsoluteFill style={{ background: BG }}>
          <ChromaCurrentBackdrop mode="dark" intensity={0.82} />
          <TerminalSimulator
            intro="Connect your *whole team* in one command."
            command={{
              managers: ["claude", "cursor", "codex"],
              text: "claude mcp add memwal -- npx -y @mysten-incubation/memwal-mcp",
            }}
            lines={[
              {
                type: "command",
                text: "claude mcp add memwal -e MEMWAL_NAMESPACE=memwal-team-skills -- npx -y @mysten-incubation/memwal-mcp",
                delay: 6,
              },
              {
                type: "log",
                text: "Verifying Sui account 0x463e... via Tatum RPC...",
                delay: 8,
              },
              {
                type: "log",
                text: "Decrypting 20 skills and 6 active rules via Mysten Seal...",
                delay: 8,
              },
              {
                type: "success",
                text: "Skillbook ready: 94 Walrus mainnet memories synced in 56 ms.",
                delay: 8,
              },
            ]}
            background="#121816"
            borderColor="#252f2c"
            fontFamily={GEIST}
            theme={{ ...SKILLBOOK_SNAP_THEME, background: "transparent" }}
            mode="dark"
            speed={terminalSpeed}
          />
        </AbsoluteFill>
      </Sequence>

      {/* 1-beat breath on dark contour canvas before final lockup chord */}
      {breathFrames > 0 && (
        <Sequence from={terminalFrames} durationInFrames={breathFrames}>
          <AbsoluteFill style={{ background: BG }}>
            <ChromaCurrentBackdrop mode="dark" intensity={0.55} />
          </AbsoluteFill>
        </Sequence>
      )}

      <Sequence from={lockupStart} durationInFrames={lockupFrames}>
        <SkillbookEndLockup />
      </Sequence>
    </AbsoluteFill>
  );
};
