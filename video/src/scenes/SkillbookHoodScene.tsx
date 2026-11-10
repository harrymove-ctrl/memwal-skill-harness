import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ACCENT, BAD, Ball, BG, GEIST, INK, INK2, LINE, ON_ACCENT, RAISED, SURFACE, T, Words, clamp, lerp, rand, ramp, springAt, squash } from "./SkillbookShared";

/**
 * Under the hood, 40 seconds in one world: how a rule travels through Seal, Walrus, Sui and Tatum and
 * comes back to every agent. Every visual is computed from time inside this one function.
 */
export const HOOD_SECONDS = 40;
const GAP = 2400;
const STOPS = [0, 1, 2, 3, 4, 5].map((i) => i * GAP);
const RULE = "Drop Mutex guards before .await so workers never deadlock.";
const MONO = "'JetBrains Mono', ui-monospace, Menlo, monospace";
const GLYPHS = "ABCDEF0123456789#$%&/\\=+*";

/** Where the camera looks: it travels between the six stops on a smooth move, always forward. */
const MOVES = [5.4, 12.6, 20.6, 28.6, 34.6];
const cameraX = (t: number) => {
  // A slow creep at every stop, so no hold reads as a freeze, measured from the move that arrived there.
  let x = t * 9;
  MOVES.forEach((at, i) => {
    x = lerp(x, STOPS[i + 1]! + (t - at) * 9, ramp(t, at, at + 0.75));
  });
  return x;
};

const Caption: React.FC<{ t: number; at: number; x: number; kicker: string; text: string }> = ({ t, at, x, kicker, text }) => (
  <div style={{ position: "absolute", left: x + 130, top: 96 }}>
    <div style={{ opacity: ramp(t, at, at + 0.2), marginBottom: 10 }}><T size={30} color={ACCENT} weight={600}>{kicker}</T></div>
    <Words t={t} at={at + 0.1} text={text} size={92} step={0.1} />
  </div>
);

/** The block that is the rule, wherever it is in its journey. */
const Block: React.FC<{ x: number; y: number; w?: number; h?: number; text: string; locked?: number; scale?: number; opacity?: number }> = ({ x, y, w = 560, h = 230, text, locked = 0, scale = 1, opacity = 1 }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, borderRadius: 34, background: locked > 0.5 ? "#047857" : ACCENT, transform: `scale(${scale})`, opacity, display: "grid", placeItems: "center", padding: 30, boxSizing: "border-box", overflow: "hidden" }}>
    <span style={{ fontFamily: locked > 0.02 ? MONO : GEIST, fontWeight: 500, fontSize: 34, lineHeight: "44px", color: locked > 0.5 ? "#c9f7e6" : ON_ACCENT, textAlign: "center", overflowWrap: "anywhere" }}>{text}</span>
  </div>
);

const Lock: React.FC<{ x: number; y: number; t: number; at: number; open?: number }> = ({ x, y, t, at, open = 0 }) => {
  const drop = clamp(springAt(t, at, 13), 0, 1.15);
  if (t < at) return null;
  return (
    <svg width={190} height={230} viewBox="0 0 190 230" style={{ position: "absolute", left: x - 95, top: y - 150 - (1 - drop) * 260, opacity: clamp(drop * 2) }}>
      <path d="M50 110 V70 a45 45 0 0 1 90 0 V110" fill="none" stroke="#fff" strokeWidth={18} strokeLinecap="round" transform={`translate(0 ${-open * 26}) rotate(${open * 24} 140 110)`} />
      <rect x={20} y={104} width={150} height={112} rx={26} fill="#fff" />
      <circle cx={95} cy={152} r={15} fill="#047857" />
      <rect x={88} y={156} width={14} height={32} rx={6} fill="#047857" />
    </svg>
  );
};

export const SkillbookHoodScene: React.FC<{ speed?: number }> = ({ speed = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (frame / fps) * speed - 0.4;
  const cam = cameraX(t);

  /* 0: the rule is typed, the ball strikes it, and its letters fall into a solid block. */
  const typed = Math.round(clamp((t - 0.5) / 1.6) * RULE.length);
  const strike = 2.85;
  const gather = ramp(t, strike, strike + 0.75);
  const blockIn = clamp(springAt(t, strike + 0.6, 12), 0, 1.1);
  const ballIn = clamp((t - 2.25) / 0.6);

  /* 1: Seal. The text scrambles from the left, and a lock drops. */
  const scrambled = clamp((t - 7.4) / 2.3);
  const sealedText = RULE.split("").map((c, i) => {
    if (c === " ") return " ";
    return i / RULE.length < scrambled ? GLYPHS[Math.floor(rand(i * 3 + Math.floor(t * 14)) * GLYPHS.length)] : c;
  }).join("");
  const lockAt = 9.8;

  /* 2: Walrus. The block breaks into slivers that spread across storage nodes. */
  const COLS = 18;
  const ROWS_N = 8;
  const nodeX = (c: number) => STOPS[2]! + 960 - (COLS - 1) * 44 + c * 88;
  const nodeY = (r: number) => 690 - (ROWS_N - 1) * 42 + r * 84 + 40;
  const memories = Math.round(ramp(t, 15.2, 19.6) * 94);

  /* 3: Sui. One key passes, the next is refused. */
  const gateX = STOPS[3]! + 1120;
  const keyA = ramp(t, 22.6, 24.0);
  const passA = ramp(t, 24.0, 24.7);
  const keyB = ramp(t, 25.4, 26.6);
  const refuse = t > 26.6 ? Math.exp(-(t - 26.6) * 3) * Math.sin((t - 26.6) * 16) * 22 : 0;
  const backB = ramp(t, 27.0, 27.7);

  /* 4: Tatum. The list is read from the chain, row by row. */
  const READS = ["Account", "Owner", "Agent key", "Agent key", "Agent key"];
  const scanY = ramp(t, 30.0, 33.2);

  /* 5: Recall. The slivers return, the lock opens, and three agents read the same rule. */
  const back = ramp(t, 35.1, 36.0);
  const unlock = ramp(t, 35.95, 36.25);
  const agents = ["Claude Code", "Cursor", "Codex"];

  /* The ball travels the whole world and never teleports. */
  const ball = (() => {
    const route: { at: number; x: number; y: number; h: number }[] = [
      { at: 2.25, x: 480, y: -80, h: 0 },
      { at: strike, x: 700, y: 600, h: 120 },
      { at: 4.3, x: 960, y: 900, h: 230 },
      { at: 6.2, x: STOPS[1]! + 500, y: 870, h: 620 },
      { at: 9.8, x: STOPS[1]! + 500, y: 870, h: 0 },
      { at: 13.4, x: STOPS[2]! + 180, y: 960, h: 560 },
      { at: 21.0, x: STOPS[2]! + 180, y: 960, h: 0 },
      { at: 22.2, x: STOPS[3]! + 270, y: 930, h: 460 },
      { at: 29.3, x: STOPS[3]! + 270, y: 930, h: 0 },
      { at: 30.0, x: STOPS[4]! + 330, y: 200, h: 520 },
      { at: 33.2, x: STOPS[4]! + 330, y: 940, h: 0 },
      { at: 35.0, x: STOPS[5]! + 360, y: 960, h: 540 },
      { at: 40, x: STOPS[5]! + 360, y: 960, h: 0 },
    ];
    if (t <= route[0]!.at) return { x: route[0]!.x, y: route[0]!.y };
    for (let i = 1; i < route.length; i += 1) {
      const a = route[i - 1]!;
      const b = route[i]!;
      if (t <= b.at) {
        const u = (t - a.at) / (b.at - a.at);
        const e = b.h === 0 ? ramp(t, a.at, b.at) : u;
        return { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e) - Math.sin(u * Math.PI) * b.h };
      }
    }
    return { x: route[route.length - 1]!.x, y: route[route.length - 1]!.y };
  })();
  const contacts = [strike, 4.3, 6.2, 13.4, 22.2, 30.0, 35.0];
  const hit = Math.max(...contacts.map((at) => squash(t, at)));

  const blockX = (() => {
    const onward = lerp(960, STOPS[1]! + 960, ramp(t, 5.4, 6.15));
    return lerp(onward, STOPS[2]! + 960, ramp(t, 12.6, 13.35));
  })();
  const shatter = ramp(t, 14.2, 14.5);

  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, transform: `translateX(${-cam}px)` }}>
        <div style={{ position: "absolute", left: -500, top: -300, width: 14400, height: 1700, backgroundImage: "radial-gradient(rgba(255,255,255,.075) 1.6px, transparent 1.7px)", backgroundSize: "44px 44px" }} />

        {/* 0: The rule */}
        <Caption t={t} at={0.1} x={STOPS[0]!} kicker="Under the hood" text="It starts as one line." />
        <div style={{ position: "absolute", left: 210, top: 560, width: 1500, height: 118, borderRadius: 30, background: RAISED, boxShadow: `inset 0 0 0 1px ${LINE}`, opacity: 1 - ramp(t, strike + 0.2, strike + 0.7) }}>
        </div>
        <div style={{ position: "absolute", left: 250, top: 594, display: "flex", whiteSpace: "pre" }}>
          {RULE.slice(0, typed).split("").map((ch, i) => {
            const delay = rand(i + 2) * 0.28;
            const g = ramp(t, strike + delay, strike + delay + 0.5);
            const startX = 250 + i * 29;
            return (
              <span key={i} style={{ fontFamily: GEIST, fontSize: 50, fontWeight: 500, color: INK, display: "inline-block", width: ch === " " ? 16 : undefined, transform: `translate(${(960 - startX) * g * 0.98}px, ${g * (Math.sin(i) * 26)}px) scale(${1 - g * 0.8})`, opacity: 1 - ramp(t, strike + 0.55, strike + 0.8) }}>{ch}</span>
            );
          })}
        </div>
        {t > strike + 0.5 && t < 14.5 && (
          <Block x={blockX} y={620} text={t < 7.4 ? RULE : sealedText} locked={scrambled} scale={clamp(blockIn, 0, 1.1) * (1 - shatter)} />
        )}

        {/* 1: Seal */}
        <Caption t={t} at={6.3} x={STOPS[1]!} kicker="Seal" text="Encrypted before storage." />
        {t < 14.5 && <Lock x={blockX} y={480} t={t} at={lockAt} />}

        {/* 2: Walrus */}
        <Caption t={t} at={13.6} x={STOPS[2]!} kicker="Walrus" text="Stored across many nodes." />
        {Array.from({ length: COLS * ROWS_N }).map((_, i) => {
          const c = i % COLS;
          const r = Math.floor(i / COLS);
          const arrive = 14.4 + rand(i + 5) * 3.6;
          const fly = ramp(t, arrive - 0.5, arrive);
          const seen = ramp(t, 13.4, 13.9);
          const startX = STOPS[2]! + 960 + (rand(i) - 0.5) * 200;
          const startY = 620 + (rand(i + 9) - 0.5) * 90;
          return (
            <React.Fragment key={i}>
              <div style={{ position: "absolute", left: nodeX(c) - 12, top: nodeY(r) - 12, width: 24, height: 24, borderRadius: 12, background: fly > 0.98 ? ACCENT : RAISED, opacity: seen }} />
              {t > 14.2 && fly < 1 && (
                <div style={{ position: "absolute", left: lerp(startX, nodeX(c), fly) - 14, top: lerp(startY, nodeY(r), fly) - 6, width: 28, height: 12, borderRadius: 4, background: ACCENT, opacity: t > arrive ? 0 : 1, transform: `rotate(${(1 - fly) * rand(i + 1) * 300}deg)` }} />
              )}
            </React.Fragment>
          );
        })}
        <div style={{ position: "absolute", left: STOPS[2]! + 1320, top: 110, textAlign: "right", width: 480, opacity: ramp(t, 15, 15.4) }}>
          <T size={130} weight={500} style={{ fontVariantNumeric: "tabular-nums" }}>{memories}</T>
          <div><T size={30} color={INK2}>memories on mainnet</T></div>
        </div>

        {/* 3: Sui */}
        <Caption t={t} at={21.1} x={STOPS[3]!} kicker="Sui" text="The contract checks every key." />
        <div style={{ position: "absolute", left: gateX, top: 340, width: 660, height: 610, borderRadius: 36, background: SURFACE, boxShadow: `inset 0 0 0 2px ${t > 26.5 && t < 27.5 ? BAD : t > 23.9 && t < 25 ? ACCENT : LINE}`, padding: 44, boxSizing: "border-box", opacity: ramp(t, 21.0, 21.6) }}>
          <T size={28} color={INK2}>namespace_skill_vault.move</T>
          <pre style={{ fontFamily: MONO, fontSize: 28, lineHeight: "44px", color: INK, margin: "26px 0 0", whiteSpace: "pre" }}>{`assert!(
  is_owner || is_delegate,
  EDelegateNotAuthorized
);`}</pre>
          <div style={{ marginTop: 54, display: "flex", alignItems: "center", gap: 26, height: 120 }}>
            {t > 24.0 && t < 25.4 && <><div style={{ width: 96, height: 96, borderRadius: 48, background: ACCENT, display: "grid", placeItems: "center", transform: `scale(${clamp(springAt(t, 24.0, 14), 0, 1.1)})` }}><T size={56} color={ON_ACCENT} weight={600}>✓</T></div><T size={44}>Key on the account</T></>}
            {t > 26.6 && t < 28.6 && <><div style={{ width: 96, height: 96, borderRadius: 48, background: BAD, display: "grid", placeItems: "center", transform: `scale(${clamp(springAt(t, 26.6, 14), 0, 1.1)})` }}><T size={56} color="#2a0808" weight={600}>×</T></div><T size={44}>Refused</T></>}
          </div>
        </div>
        {/* The first key goes through the gate; the second bounces off. */}
        <div style={{ position: "absolute", left: lerp(STOPS[3]! + 150, gateX - 470, keyA) + passA * 1240, top: 560, padding: "22px 34px", borderRadius: 26, background: ACCENT, opacity: ramp(t, 21.8, 22.2) * (1 - ramp(t, 24.4, 24.7)) }}>
          <T size={40} color={ON_ACCENT} weight={600}>Your agent's key</T>
        </div>
        <div style={{ position: "absolute", left: lerp(lerp(STOPS[3]! + 150, gateX - 490, keyB), STOPS[3]! + 150, backB) + refuse, top: 700, padding: "22px 34px", borderRadius: 26, background: RAISED, boxShadow: `inset 0 0 0 1px ${LINE}`, opacity: ramp(t, 25.0, 25.4) * (1 - ramp(t, 27.5, 27.8)) }}>
          <T size={40} color={INK2}>Someone else's key</T>
        </div>

        {/* 4: Tatum */}
        <Caption t={t} at={29.4} x={STOPS[4]!} kicker="Tatum" text="Read through its Sui gateway." />
        <div style={{ position: "absolute", left: STOPS[4]! + 480, top: 340, width: 1100, height: 640 }}>
          {READS.map((label, i) => {
            const read = scanY * READS.length > i + 0.4;
            return (
              <div key={`${label}${i}`} style={{ position: "absolute", left: 0, top: i * 124, width: 1100, height: 106, borderRadius: 24, background: SURFACE, boxShadow: `inset 0 0 0 1px ${LINE}`, opacity: ramp(t, 29.5 + i * 0.08, 29.9 + i * 0.08), display: "flex", alignItems: "center", padding: "0 36px", boxSizing: "border-box", justifyContent: "space-between" }}>
                <T size={42}>{label}</T>
                {read ? <div style={{ display: "flex", gap: 16, alignItems: "center" }}><T size={32} color={ACCENT}>Read from the chain</T><T size={40} color={ACCENT} weight={600}>✓</T></div> : <T size={32} color={INK2}>Reading</T>}
              </div>
            );
          })}
          <div style={{ position: "absolute", left: -20, width: 1140, height: 4, top: scanY * 620, background: ACCENT, opacity: t > 30 && t < 33.3 ? 1 : 0 }} />
        </div>

        {/* 5: Recall */}
        <Caption t={t} at={35.05} x={STOPS[5]!} kicker="Recall" text="Every agent reads the same rule." />
        {t > 34.9 && Array.from({ length: 70 }).map((_, i) => {
          const a = rand(i) * Math.PI * 2;
          const d = 700 + rand(i + 7) * 500;
          const u = ramp(t, 34.9 + rand(i + 3) * 0.5, 35.95);
          return <div key={i} style={{ position: "absolute", left: STOPS[5]! + 620 + Math.cos(a) * d * (1 - u) - 14, top: 610 + Math.sin(a) * d * (1 - u) - 6, width: 28, height: 12, borderRadius: 4, background: ACCENT, opacity: u >= 1 ? 0 : 1, transform: `rotate(${(1 - u) * rand(i + 1) * 300}deg)` }} />;
        })}
        {t > 35.8 && (
          <>
            <Block x={STOPS[5]! + 620} y={610} text={unlock < 0.5 ? sealedText : RULE} locked={1 - unlock} scale={clamp(springAt(t, 35.8, 14), 0, 1.06)} />
            {unlock < 1 && <Lock x={STOPS[5]! + 620} y={470} t={t} at={35.8} open={unlock} />}
          </>
        )}
        {agents.map((name, i) => {
          const at = 36.4 + i * 0.32;
          const pop = clamp(springAt(t, at, 12), 0, 1.06);
          const shown = Math.round(clamp((t - at - 0.1) / 1.1) * 34);
          const line = 36.2 + i * 0.32;
          return (
            <React.Fragment key={name}>
              <div style={{ position: "absolute", left: STOPS[5]! + 900, top: 610 + (i - 1) * 8, width: 170 * ramp(t, line, line + 0.3), height: 3, background: ACCENT, transformOrigin: "0 50%", transform: `rotate(${(i - 1) * 28}deg)` }} />
              <div style={{ position: "absolute", left: STOPS[5]! + 1060, top: 340 + i * 200, width: 760, height: 170, borderRadius: 28, background: SURFACE, boxShadow: `inset 0 0 0 1px ${LINE}`, padding: 28, boxSizing: "border-box", transform: `scale(${pop})`, opacity: clamp(pop * 1.5) }}>
                <T size={36} weight={600}>{name}</T>
                <div style={{ marginTop: 14 }}><T size={29} color={INK2}>{RULE.slice(0, shown)}</T></div>
              </div>
            </React.Fragment>
          );
        })}

        {t > 2.25 && <Ball x={ball.x} y={ball.y} hit={hit} />}
      </div>
    </AbsoluteFill>
  );
};
