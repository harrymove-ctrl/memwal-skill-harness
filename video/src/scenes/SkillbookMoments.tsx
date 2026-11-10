import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ACCENT, BAD, Ball, DotGrid, GEIST, INK, INK2, LINE, Mark, ON_ACCENT, RAISED, SURFACE, T, Words, clamp, lerp, rand, ramp, springAt, squash } from "./SkillbookShared";

const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

/* ---------- Logo sting: real skill cards fly in, fold into the mark, and the name lands. ---------- */
const SKILLS = [
  { name: "memwal-qa", rule: "Require green CI before approving." },
  { name: "memwal-review", rule: "Staging is retired, promote from dev." },
  { name: "ui-ux-qa", rule: "Check every state on two viewports." },
  { name: "rust-patterns", rule: "Release locks before awaiting." },
  { name: "gh-issue-fixed", rule: "Reply on the issue when it merges." },
];

export const StingScene: React.FC = () => {
  const t = useT() - 0.4;
  const fold = ramp(t, 1.15, 1.5);
  const mark = springAt(t, 1.42, 13);
  const word = ramp(t, 1.6, 1.95);
  return (
    <AbsoluteFill>
      <DotGrid />
      {SKILLS.map((skill, i) => {
        const at = i * 0.17;
        const pop = springAt(t, at, 16);
        if (t < at) return null;
        const x = 960 + (rand(i + 3) - 0.5) * 860;
        const y = 540 + (rand(i + 11) - 0.5) * 420;
        const rot = (rand(i + 21) - 0.5) * 12;
        return (
          <div key={skill.name} style={{ position: "absolute", left: lerp(x, 960, fold) - 280, top: lerp(y, 540, fold) - 80, width: 560, height: 160, borderRadius: 24, background: SURFACE, boxShadow: `inset 0 0 0 1px ${LINE}, 0 24px 50px rgba(0,0,0,.5)`, transform: `rotate(${rot * (1 - fold)}deg) scale(${clamp(pop, 0, 1.2) * (1 - fold * 0.92)})`, opacity: 1 - ramp(t, 1.38, 1.5), padding: 28, boxSizing: "border-box" }}>
            <T size={34} weight={600}>{skill.name}</T>
            <div style={{ marginTop: 12 }}><T size={25} color={INK2}>{skill.rule}</T></div>
          </div>
        );
      })}
      <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 32 * word }}>
        <Mark size={190} style={{ transform: `scale(${clamp(mark, 0, 1.2)})`, marginRight: lerp(0, 8, word) }} />
        <div style={{ width: lerp(0, 560, word), overflow: "hidden" }}>
          <T size={128} style={{ display: "inline-block", opacity: word, transform: `translateX(${(1 - word) * -60}px)` }}>Skillbook</T>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------- The question, then the laptop opens and the camera dives into the real app. ---------- */
const QUESTIONS = ["Should I approve this pull request?", "Which environment do we promote from?", "What did the team decide?"];

export const LaptopDiveScene: React.FC = () => {
  const t = useT() - 0.4;
  const roll = ramp(t, 0.9, 1.15) + ramp(t, 1.7, 1.95);
  const lid = ramp(t, 0.15, 2.3);
  const dive = ramp(t, 2.7, 4.5);
  const textOut = ramp(t, 2.5, 2.9);
  const scale = lerp(0.66, 2.02, dive * dive * (3 - 2 * dive));
  return (
    <AbsoluteFill>
      <DotGrid />
      <div style={{ position: "absolute", left: 0, right: 0, top: 96, height: 180, textAlign: "center", opacity: 1 - textOut, transform: `translateY(${-textOut * 40}px)` }}>
        <T size={28} color={INK2}>Your agent is about to ask</T>
        <div style={{ height: 96, overflow: "hidden", marginTop: 14 }}>
          <div style={{ transform: `translateY(${-roll * 96}px)` }}>
            {QUESTIONS.map((q) => (
              <div key={q} style={{ height: 96 }}><T size={70}>{q}</T></div>
            ))}
          </div>
        </div>
      </div>
      <AbsoluteFill style={{ perspective: 2200, display: "grid", placeItems: "center" }}>
        <div style={{ transform: `translateY(${lerp(170, 0, dive)}px) scale(${scale})`, transformStyle: "preserve-3d" }}>
          <div style={{ width: 960, height: 568, borderRadius: 26, background: "#151a19", boxShadow: `inset 0 0 0 2px ${LINE}`, padding: 14, boxSizing: "border-box", transformOrigin: "50% 100%", transform: `rotateX(${lerp(78, 0, lid)}deg)` }}>
            <div style={{ width: "100%", height: "100%", borderRadius: 14, overflow: "hidden", background: "#000" }}>
              <OffthreadVideo src={staticFile("take/demo.mp4")} trimBefore={60} muted style={{ width: "100%", height: "100%", objectFit: "cover" }} pauseWhenBuffering={false} playbackRate={0.01} />
            </div>
          </div>
          <div style={{ width: 1120, height: 26, marginLeft: -80, borderRadius: "0 0 22px 22px", background: "#232a29", boxShadow: `inset 0 1px 0 ${LINE}`, opacity: 1 - dive }} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------- Chapter cards ---------- */
const Kicker: React.FC<{ n: string; label: string; t: number }> = ({ n, label, t }) => (
  <div style={{ position: "absolute", left: 140, top: 150, display: "flex", gap: 20, alignItems: "baseline", opacity: ramp(t, 0.05, 0.3) }}>
    <T size={30} color={ACCENT} weight={600} style={{ fontVariantNumeric: "tabular-nums" }}>{n}</T>
    <T size={30} color={INK2}>{label}</T>
  </div>
);

/** 01: the marker sweeps under the one word that matters, and the ball lands as its full stop. */
export const Card1: React.FC = () => {
  const t = useT() - 0.4;
  const sweep = ramp(t, 0.75, 1.15);
  const fall = clamp((t - 0.95) / 0.42);
  const land = 1.37;
  const baseline = 610;
  const ballX = 1495;
  const y = t < land ? lerp(-60, baseline, fall * fall) : baseline - Math.abs(Math.sin((t - land) * 6)) * 60 * Math.exp(-(t - land) * 5);
  return (
    <AbsoluteFill>
      <DotGrid />
      <Kicker n="01" label="Teach" t={t} />
      <div style={{ position: "absolute", left: 140, top: 420 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 44 }}>
          <Words t={t} at={0.1} text="You teach it" size={170} />
          <div style={{ position: "relative", opacity: ramp(t, 0.45, 0.6) }}>
            <div style={{ position: "absolute", left: -14, right: -14, top: 34, bottom: 10, borderRadius: 16, background: ACCENT, transform: `scaleX(${sweep})`, transformOrigin: "0 50%" }} />
            <T size={170} color={sweep > 0.45 ? ON_ACCENT : INK} style={{ position: "relative" }}>once</T>
          </div>
        </div>
      </div>
      {t > 0.95 && <Ball x={ballX} y={y} r={22} hit={squash(t, land)} />}
    </AbsoluteFill>
  );
};

/** 02: each agent slams in on the beat, then all three stay. */
export const Card2: React.FC = () => {
  const t = useT() - 0.4;
  const lines = [
    { at: 0.1, name: "Claude Code" },
    { at: 0.6, name: "Cursor" },
    { at: 1.1, name: "Codex" },
  ];
  const stack = ramp(t, 1.5, 1.85);
  return (
    <AbsoluteFill>
      <DotGrid />
      <Kicker n="02" label="Recall" t={t} />
      {lines.map((line, i) => {
        if (t < line.at) return null;
        const pop = springAt(t, line.at, 20);
        const current = lines.filter((l) => t >= l.at).length - 1 === i;
        const y = lerp(470, 330 + i * 150, stack);
        const size = lerp(190, 110, stack);
        const opacity = stack > 0 ? 1 : current ? 1 : 0;
        return (
          <div key={line.name} style={{ position: "absolute", left: 140, top: y, opacity, transform: `scale(${1.25 - 0.25 * clamp(pop, 0, 1)})`, transformOrigin: "0 50%" }}>
            <T size={size}>{line.name}</T>
            <T size={size} color={INK2} style={{ marginLeft: size * 0.25 }}>recalls it.</T>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** 03: the same task flips from wrong to right. */
export const Card3: React.FC = () => {
  const t = useT() - 0.4;
  const flip = ramp(t, 1.0, 1.3);
  const angle = flip * 180;
  const front = angle < 90;
  return (
    <AbsoluteFill>
      <DotGrid />
      <Kicker n="03" label="Change" t={t} />
      <div style={{ position: "absolute", left: 140, top: 270 }}>
        <Words t={t} at={0.1} text="One rule changes the call." size={112} />
      </div>
      <div style={{ position: "absolute", left: 140, top: 500, perspective: 1600 }}>
        <div style={{ width: 1480, height: 230, borderRadius: 34, background: front ? SURFACE : ACCENT, boxShadow: `inset 0 0 0 1px ${LINE}`, transform: `rotateX(${front ? angle : angle - 180}deg) scale(${clamp(springAt(t, 0.35, 12), 0, 1.1)})`, display: "flex", alignItems: "center", gap: 44, padding: "0 60px", boxSizing: "border-box" }}>
          <div style={{ width: 96, height: 96, borderRadius: 48, display: "grid", placeItems: "center", background: front ? "rgba(248,113,113,.16)" : ON_ACCENT }}>
            <T size={60} color={front ? BAD : ACCENT} weight={600}>{front ? "×" : "✓"}</T>
          </div>
          <T size={72} color={front ? INK : ON_ACCENT}>{front ? "Approves a retired app" : "Closes it and skips the QA run"}</T>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** 04: a halftone bloom opens from the ball. */
export const Card4: React.FC = () => {
  const t = useT() - 0.4;
  const dots: React.ReactNode[] = [];
  const front = ramp(t, 0.15, 1.5) * 1500;
  for (let x = 0; x < 34; x += 1) {
    for (let y = 0; y < 20; y += 1) {
      const cx = 30 + x * 56;
      const cy = 24 + y * 54;
      const d = Math.hypot(cx - 1500, cy - 540);
      const size = clamp((front - d) / 200) * clamp(1 - (front - d) / 900, 0.18, 1) * 26;
      if (size > 0.4) dots.push(<div key={`${x}-${y}`} style={{ position: "absolute", left: cx - size / 2, top: cy - size / 2, width: size, height: size, borderRadius: "50%", background: ACCENT, opacity: 0.55 }} />);
    }
  }
  return (
    <AbsoluteFill>
      <DotGrid />
      {dots}
      <Ball x={1500} y={540} r={lerp(0, 40, ramp(t, 0, 0.2))} hit={squash(t, 0.2)} />
      <Kicker n="04" label="Team and Proof" t={t} />
      <div style={{ position: "absolute", left: 140, top: 400 }}>
        <Words t={t} at={0.35} text="Checked" size={190} />
        <Words t={t} at={0.55} text="on chain." size={190} style={{ marginTop: 10 }} />
      </div>
    </AbsoluteFill>
  );
};

/* ---------- End card: back to the sky. ---------- */
const COMMAND = "claude mcp add memwal -- npx -y @mysten-incubation/memwal-mcp";

export const EndCardScene: React.FC = () => {
  const t = useT() - 0.4;
  const typed = Math.round(clamp((t - 1.3) / 1.7) * COMMAND.length);
  const card = clamp(springAt(t, 0.2, 9), 0, 1.04);
  return (
    <AbsoluteFill style={{ background: "#3b82f6" }}>
      <Img src={staticFile("take/sky.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", transform: `scale(${1.04 + t * 0.006})` }} />
      <div style={{ position: "absolute", left: 300, top: 190, width: 1320, height: 700, borderRadius: 40, background: "rgba(255,255,255,.72)", backdropFilter: "blur(26px)", boxShadow: "inset 0 0 0 2px rgba(255,255,255,.6), 0 40px 90px rgba(10,50,110,.32)", transform: `scale(${0.96 + 0.04 * card}) translateY(${(1 - card) * 40}px)`, opacity: clamp(card * 1.6), display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 64, boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, opacity: ramp(t, 0.35, 0.65) }}>
          <Mark size={52} color="#047857" />
          <T size={38} color="#0d1714" weight={600}>Skillbook</T>
        </div>
        <div style={{ marginTop: 40 }}><Words t={t} at={0.5} text="Teach your agents once." size={98} color="#0d1714" step={0.07} /></div>
        <div style={{ marginTop: 6 }}><Words t={t} at={0.85} text="Every agent remembers." size={86} color="#04694c" serif step={0.06} /></div>
        <div style={{ marginTop: 50, width: 1140, height: 94, borderRadius: 20, background: "#0b0f0e", display: "flex", alignItems: "center", padding: "0 32px", boxSizing: "border-box", opacity: ramp(t, 1.05, 1.3) }}>
          <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, Menlo, monospace", fontSize: 29, color: ACCENT, marginRight: 18 }}>$</span>
          <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, Menlo, monospace", fontSize: 29, color: INK, whiteSpace: "nowrap" }}>{COMMAND.slice(0, typed)}</span>
          <span style={{ width: 14, height: 34, marginLeft: 4, background: ACCENT, opacity: Math.floor(t * 2.4) % 2 === 0 || typed < COMMAND.length ? 1 : 0 }} />
        </div>
        <div style={{ marginTop: 36, opacity: ramp(t, 3.1, 3.5) }}><T size={30} color="#33414a">Built on Walrus, Sui and Tatum.</T></div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- Transition: a white ball grows from one point and opens the next scene. ---------- */
export const Iris: React.FC<{ frames?: number; cx?: number; cy?: number; children: React.ReactNode }> = ({ frames = 24, cx = 960, cy = 540, children }) => {
  const frame = useCurrentFrame();
  const white = ramp(frame, 0, frames - 6) * 1300;
  const open = ramp(frame, 6, frames) * 1300;
  if (frame >= frames) return <AbsoluteFill>{children}</AbsoluteFill>;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "#fff", clipPath: `circle(${white}px at ${cx}px ${cy}px)` }} />
      <AbsoluteFill style={{ clipPath: `circle(${open}px at ${cx}px ${cy}px)` }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

export const SampleNote: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ position: "absolute", right: 40, bottom: 34, padding: "10px 18px", borderRadius: 999, background: "rgba(11,15,14,.82)", boxShadow: `inset 0 0 0 1px ${LINE}`, fontFamily: GEIST, fontSize: 24, color: INK2 }}>{text}</div>
);

export { RAISED };
