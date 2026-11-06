#!/usr/bin/env node
/**
 * Deterministic 42.00s (120 BPM, 44.1 kHz Stereo PCM) Score + Tactile SFX Engine
 * for the MemWal Skills x Tatum Director's Cut.
 *
 * Picture-locked musical anchors:
 * 1. 0.00s (f0): Immediate warm Cmaj9 pad + crystalline bell shimmer + 16th-note pluck arp
 * 2. 8.00s (f240): DROP A on LogoCollapse impact onto the MemWal mark
 * 3. 18.50s (f555): Breakdown on white wash into ClickType
 * 4. 23.50s (f705): DROP B on App Reveal + 3 live 1080p app recordings
 * 5. 38.00s (f1140): Final resolution chord on EmeraldDotBloom -> CloudSky lockup, decays to 42.0s
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "../public/audio");
fs.mkdirSync(OUT_DIR, { recursive: true });

const SR = 44100;
const TAU = Math.PI * 2;
const FPS = 30;

function rngFrom(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

function buffer(sec) {
  const n = Math.round(sec * SR);
  return { n, L: new Float32Array(n), R: new Float32Array(n) };
}
function pan(p) {
  const a = ((p + 1) * Math.PI) / 4;
  return [Math.cos(a), Math.sin(a)];
}
function onePoleLP(cut) {
  const k = 1 - Math.exp((-TAU * cut) / SR);
  let z = 0;
  return (x) => (z += k * (x - z));
}
function svf() {
  let lp = 0;
  let bp = 0;
  return (x, cut, q = 0.7) => {
    const f = 2 * Math.sin((Math.PI * Math.min(cut, SR / 6)) / SR);
    const hp = x - lp - bp / q;
    bp += f * hp;
    lp += f * bp;
    return { lp, bp, hp };
  };
}

function writeWav(file, buf, peak) {
  let max = 0;
  for (let i = 0; i < buf.n; i++) {
    max = Math.max(max, Math.abs(buf.L[i]), Math.abs(buf.R[i]));
  }
  const g = max > 0 ? peak / max : 1;
  const fadeN = Math.round(0.004 * SR);
  const data = Buffer.alloc(buf.n * 4);
  for (let i = 0; i < buf.n; i++) {
    let e = 1;
    if (i < fadeN) e = i / fadeN;
    if (i > buf.n - fadeN) e = (buf.n - i) / fadeN;
    data.writeInt16LE(
      Math.round(Math.max(-1, Math.min(1, buf.L[i] * g * e)) * 32767),
      i * 4,
    );
    data.writeInt16LE(
      Math.round(Math.max(-1, Math.min(1, buf.R[i] * g * e)) * 32767),
      i * 4 + 2,
    );
  }
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write("WAVE", 8);
  h.write("fmt ", 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(2, 22);
  h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 4, 28);
  h.writeUInt16LE(4, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(data.length, 40);
  fs.writeFileSync(path.join(OUT_DIR, file), Buffer.concat([h, data]));
  console.log(
    `wrote ${file}  ${(buf.n / SR).toFixed(2)}s  peak ${(20 * Math.log10(peak)).toFixed(1)} dBFS`,
  );
}

function score(file, at) {
  const DUR = 42.0;
  const out = buffer(DUR);
  const rng = rngFrom(0x5eed2026);
  const BEAT = 0.5;
  const BAR = 2.0;
  const T0 = at.drop / FPS;
  const T_BREAK = at.breakdown / FPS;
  const T_DROP2 = at.drop2 / FPS;
  const T_END = at.end / FPS;

  const CHORDS = [
    { root: 36, notes: [48, 52, 55, 59, 62] },
    { root: 33, notes: [45, 48, 52, 55, 59] },
    { root: 29, notes: [41, 45, 48, 52, 55] },
    { root: 31, notes: [43, 47, 50, 52, 57] },
  ];
  const chordAt = (t) => {
    const bar = Math.floor((t - T0) / BAR + 1000) - 1000;
    return CHORDS[((bar % 4) + 4) % 4];
  };
  const section = (t) =>
    t < T0
      ? "intro"
      : t < T_BREAK
        ? "A"
        : t < T_DROP2
          ? "break"
          : t < T_END
            ? "B"
            : "outro";

  const duck = new Float32Array(out.n).fill(1);
  const add = (i, l, r) => {
    if (i >= 0 && i < out.n) {
      out.L[i] += l;
      out.R[i] += r;
    }
  };

  // 1. Warm polyphonic pad starting immediately on Frame 0 (zero dead air)
  const padLP = [svf(), svf()];
  const padVoices = [];
  for (let bar = -5; bar < 16; bar++) {
    const start = T0 + bar * BAR;
    if (start + BAR < 0) continue;
    const ch = CHORDS[((bar % 4) + 4) % 4];
    ch.notes.forEach((m, k) =>
      padVoices.push({
        start,
        end: start + BAR + 0.3,
        f: mtof(m),
        k,
        ph: rng() * TAU,
      }),
    );
  }
  const padBuf = buffer(DUR);
  for (const v of padVoices) {
    const s0 = Math.max(0, Math.round(v.start * SR));
    const s1 = Math.min(out.n, Math.round(v.end * SR));
    const [gl, gr] = pan(-0.5 + v.k * 0.25);
    for (let i = s0; i < s1; i++) {
      const t = i / SR - v.start;
      // If voice covers t=0, start full right away
      const attackEnv = v.start <= 0 ? clamp01((i / SR) / 0.04) : clamp01(t / 0.22);
      const env = attackEnv * clamp01((v.end - i / SR) / 0.3);
      let sL = 0;
      let sR = 0;
      for (let h = 1; h <= 7; h++) {
        const amp = 1 / h;
        sL += amp * Math.sin(TAU * v.f * h * 0.998 * t + v.ph * h);
        sR += amp * Math.sin(TAU * v.f * h * 1.002 * t + v.ph * h + 0.3);
      }
      padBuf.L[i] += sL * env * gl * 0.052;
      padBuf.R[i] += sR * env * gr * 0.052;
    }
  }
  for (let i = 0; i < out.n; i++) {
    const t = i / SR;
    const sec = section(t);
    let cut = 1200;
    if (sec === "intro") cut = 950 + 2100 * Math.pow(clamp01(t / T0), 1.6);
    else if (sec === "A") cut = 2800;
    else if (sec === "break")
      cut = 1550 + 1850 * clamp01((t - T_BREAK) / (T_DROP2 - T_BREAK));
    else if (sec === "B") cut = 3450;
    else cut = 3450 * Math.exp(-(t - T_END) / 2.3) + 520;
    padBuf.L[i] = padLP[0](padBuf.L[i], cut).lp;
    padBuf.R[i] = padLP[1](padBuf.R[i], cut).lp;
  }

  // 2. Pluck arp starting right on Frame 2 (0.06s) so opening CloudSky glistens
  const ARP = [0, 2, 1, 3, 4, 3, 1, 2];
  for (let step = -64; step < 128; step++) {
    const t = T0 + step * (BEAT / 2);
    if (t < 0.05 || t >= T_END) continue;
    const sec = section(t);
    const ch = chordAt(t);
    const m = ch.notes[ARP[((step % 8) + 8) % 8]] + 12;
    const f = mtof(m);
    let vel =
      sec === "intro"
        ? 0.42 + 0.22 * clamp01(t / T0)
        : sec === "break"
          ? 0.74
          : sec === "A"
            ? 0.56
            : 0.72;
    if (step % 2 !== 0) vel *= 0.62;
    const [gl, gr] = pan(step % 2 === 0 ? -0.35 : 0.35);
    const s0 = Math.round(t * SR);
    const len = Math.round(0.32 * SR);
    for (let j = 0; j < len; j++) {
      const tt = j / SR;
      const env = clamp01(tt / 0.003) * Math.exp(-tt / 0.092);
      const x =
        (Math.sin(TAU * f * tt) +
          0.3 * Math.sin(TAU * f * 2 * tt) * Math.exp(-tt / 0.03)) *
        env *
        vel *
        0.062;
      add(s0 + j, x * gl, x * gr);
    }
  }

  // 3. Drums + sidechain ducking
  const kick = (t, vel = 1) => {
    const s0 = Math.round(t * SR);
    const len = Math.round(0.42 * SR);
    let ph = 0;
    for (let j = 0; j < len; j++) {
      const tt = j / SR;
      const f = 46 + 95 * Math.exp(-tt / 0.035);
      ph += (TAU * f) / SR;
      const env = Math.exp(-tt / 0.16) * clamp01(tt / 0.002);
      const click = Math.exp(-tt / 0.004) * 0.25;
      const x =
        Math.tanh((Math.sin(ph) * env + click * (rng() * 2 - 1)) * 1.6) *
        0.42 *
        vel;
      add(s0 + j, x, x);
    }
    const dl = Math.round(0.3 * SR);
    for (let j = 0; j < dl; j++) {
      const k = s0 + j;
      if (k < out.n) {
        duck[k] = Math.min(duck[k], 1 - 0.55 * Math.exp(-j / SR / 0.11));
      }
    }
  };
  const noiseHit = (t, dur, cutHP, vel, panPos = 0, decay = 0.05) => {
    const s0 = Math.round(t * SR);
    const len = Math.round(dur * SR);
    const f = svf();
    const [gl, gr] = pan(panPos);
    for (let j = 0; j < len; j++) {
      const tt = j / SR;
      const env = Math.exp(-tt / decay) * clamp01(tt / 0.001);
      const x = f(rng() * 2 - 1, cutHP, 0.8).hp * env * vel;
      add(s0 + j, x * gl, x * gr);
    }
  };
  const clap = (t, vel = 1) => {
    for (let k = 0; k < 3; k++) {
      noiseHit(t + k * 0.011, 0.03, 1400, 0.16 * vel, 0, 0.008);
    }
    noiseHit(t + 0.033, 0.25, 1200, 0.2 * vel, 0, 0.07);
  };

  // Gentle pulse sub-thump on Frame 0 so the opening logo lands with authority
  kick(0.02, 0.58);

  for (let beat = 0; beat < 64; beat++) {
    const t = T0 + beat * BEAT;
    if (t >= T_END) break;
    const sec = section(t);
    const inBar = beat % 4;
    if (sec === "A" || sec === "B") {
      const gapA = sec === "A" && t > T_BREAK - 2 * BEAT - 0.01;
      if (!gapA) kick(t, inBar === 0 ? 1 : 0.88);
      if ((inBar === 1 || inBar === 3) && !gapA) {
        clap(t, sec === "B" ? 1 : 0.85);
      }
      noiseHit(t + BEAT / 2, 0.22, 6500, 0.09, 0.25, 0.06);
      noiseHit(t, 0.05, 8000, 0.05, -0.3, 0.015);
      noiseHit(t + BEAT / 4, 0.04, 9000, 0.035, 0.3, 0.012);
      noiseHit(t + (3 * BEAT) / 4, 0.04, 9000, 0.035, -0.2, 0.012);
    } else if (sec === "break") {
      noiseHit(t + BEAT / 2, 0.05, 8500, 0.05, 0.3, 0.014);
      if (t >= T_DROP2 - BAR - 0.01) {
        const steps = t >= T_DROP2 - BEAT * 2 ? 4 : 2;
        for (let k = 0; k < steps; k++) {
          const rollT = t + (k * BEAT) / steps;
          const prog = clamp01((rollT - (T_DROP2 - BAR)) / BAR);
          noiseHit(rollT, 0.09, 1500, 0.06 + 0.12 * prog, 0, 0.035);
        }
      }
    }
  }
  kick(T_END, 1.15);
  noiseHit(T_END, 2.6, 3500, 0.12, 0, 0.6);

  // 4. Warm intro bass swell + 8th-note sub bass on Drops
  for (let bar = -4; bar < 0; bar++) {
    const t = T0 + bar * BAR;
    if (t < 0) continue;
    const ch = chordAt(t);
    const f = mtof(ch.root + 12);
    const len = Math.round(1.85 * SR);
    const s0 = Math.round(t * SR);
    for (let j = 0; j < len; j++) {
      const tt = j / SR;
      const env = clamp01(tt / 0.06) * clamp01((len / SR - tt) / 0.18);
      const x = Math.sin(TAU * f * tt) * 0.12 * env;
      add(s0 + j, x, x);
    }
  }
  for (let step = 0; step < 128; step++) {
    const t = T0 + step * (BEAT / 2);
    if (t >= T_END) break;
    const sec = section(t);
    if (sec === "break" && step % 4 !== 0) continue;
    const ch = chordAt(t);
    const f = mtof(ch.root + 12);
    const vel = step % 2 === 0 ? 1 : 0.7;
    const len = Math.round((sec === "break" ? 1.9 : 0.23) * SR);
    const s0 = Math.round(t * SR);
    for (let j = 0; j < len; j++) {
      const tt = j / SR;
      const env = clamp01(tt / 0.004) * clamp01((len / SR - tt) / 0.03);
      const x =
        Math.tanh(
          (Math.sin(TAU * f * tt) + 0.35 * Math.sin(TAU * f * 2 * tt)) * 1.3,
        ) *
        0.16 *
        vel *
        env;
      add(s0 + j, x, x);
    }
  }
  {
    const s0 = Math.round(T_END * SR);
    const f = mtof(24);
    for (let j = 0; j < Math.round(3.8 * SR); j++) {
      const tt = j / SR;
      const x = Math.sin(TAU * f * tt) * Math.exp(-tt / 1.3) * 0.28;
      add(s0 + j, x, x);
    }
  }

  // 5. FM Bell Lead Motif + Frame-0 & Drop Sparkles
  const MOTIF = [
    [0, 76],
    [1.5, 79],
    [3, 74],
    [4, 76],
    [6, 72],
    [8, 76],
    [9.5, 79],
    [11, 81],
    [12, 79],
    [14, 76],
  ];
  const bell = (t, m, vel, dur = 1.2) => {
    const f = mtof(m);
    const s0 = Math.round(t * SR);
    const len = Math.round(dur * SR);
    for (let j = 0; j < len; j++) {
      const tt = j / SR;
      const env = clamp01(tt / 0.004) * Math.exp(-tt / (dur * 0.35));
      const modI = 2.2 * Math.exp(-tt / 0.25);
      const x =
        Math.sin(TAU * f * tt + modI * Math.sin(TAU * f * 3.5 * tt)) *
        env *
        vel *
        0.07;
      add(s0 + j, x * 0.85, x);
      add(s0 + j + Math.round(0.19 * SR), x * 0.25, x * 0.35);
    }
  };
  // Frame-0 crystalline Cmaj9 bell chord
  [64, 67, 71, 74].forEach((m, k) => bell(0.02 + k * 0.045, m, 0.65, 1.5));
  // Drop A sparkle
  [76, 79, 83, 86].forEach((m, k) => bell(T0 + k * 0.06, m, 0.72, 1.6));
  // Drop B motif across App Reveal & Live App Footage
  for (let rep = 0; rep < 3; rep++) {
    for (const [b, m] of MOTIF) {
      const t = T_DROP2 + rep * 16 * BEAT * 0.75 + b * BEAT * 0.75;
      if (t < T_END - 0.3) bell(t, m, 0.88);
    }
  }
  // Final CloudSky resolution chord
  [60, 64, 67, 71, 74, 79].forEach((m, k) =>
    bell(T_END + k * 0.03, m, 0.8, 3.8),
  );

  // 6. Risers into Drops & End Card
  const riser = (tEnd, dur, vel) => {
    const s0 = Math.round((tEnd - dur) * SR);
    const len = Math.round(dur * SR);
    const f = svf();
    for (let j = 0; j < len; j++) {
      const p = j / len;
      const cut = 300 + 7000 * p * p;
      const x = f(rng() * 2 - 1, cut, 1.6).bp * Math.pow(p, 2.2) * vel;
      add(
        s0 + j,
        x * (0.8 + 0.2 * Math.sin(j / 900)),
        x * (0.8 + 0.2 * Math.cos(j / 900)),
      );
    }
  };
  riser(T0, 1.8, 0.34);
  riser(T_BREAK, 1.8, 0.28);
  riser(T_DROP2, 1.9, 0.4);
  riser(T_END, 1.2, 0.28);

  // 7. Master ping-pong delay + tape glue
  const delayN = Math.round(BEAT * 0.75 * SR);
  const dL = new Float32Array(out.n);
  const dR = new Float32Array(out.n);
  const lpL = onePoleLP(3500);
  const lpR = onePoleLP(3500);
  for (let i = 0; i < out.n; i++) {
    const t = i / SR;
    let l = out.L[i] + padBuf.L[i] * duck[i];
    let r = out.R[i] + padBuf.R[i] * duck[i];
    if (i >= delayN) {
      l += dR[i - delayN] * 0.27;
      r += dL[i - delayN] * 0.27;
    }
    dL[i] = lpL(l);
    dR[i] = lpR(r);
    const fin = clamp01(t / 0.04);
    const fout = clamp01((DUR - t) / 1.8);
    out.L[i] = Math.tanh(l * 1.38) * fin * fout;
    out.R[i] = Math.tanh(r * 1.38) * fin * fout;
  }
  writeWav(file, out, Math.pow(10, -1.6 / 20));
}

function whoosh(file, dur, seed, up = true) {
  const b = buffer(dur);
  const rng = rngFrom(seed);
  const fL = svf();
  const fR = svf();
  for (let i = 0; i < b.n; i++) {
    const p = i / b.n;
    const env = Math.sin(Math.PI * Math.pow(p, up ? 0.8 : 1.3));
    const cut = up ? 400 + 5200 * p : 5600 - 5000 * p;
    const n = rng() * 2 - 1;
    const panP = -0.8 + 1.6 * p;
    const [gl, gr] = pan(panP);
    b.L[i] = fL(n, cut, 1.2).bp * env * gl;
    b.R[i] = fR(n, cut, 1.2).bp * env * gr;
  }
  writeWav(file, b, Math.pow(10, -6 / 20));
}

function pop() {
  const b = buffer(0.18);
  for (let i = 0; i < b.n; i++) {
    const t = i / SR;
    const f = 900 + 700 * Math.exp(-t / 0.012);
    const x =
      Math.sin(TAU * f * t) * Math.exp(-t / 0.035) * clamp01(t / 0.001);
    b.L[i] = x;
    b.R[i] = x;
  }
  writeWav("pop.wav", b, Math.pow(10, -7 / 20));
}

function press() {
  const b = buffer(1.05);
  const rng = rngFrom(77);
  const f = svf();
  for (let i = 0; i < b.n; i++) {
    const t = i / SR;
    const thock =
      Math.sin(TAU * (180 + 220 * Math.exp(-t / 0.01)) * t) *
      Math.exp(-t / 0.04);
    const halo =
      f(rng() * 2 - 1, 4200 - 2000 * clamp01(t / 1.05), 2.5).bp *
      Math.exp(-t / 0.35) *
      clamp01(t / 0.03) *
      0.8;
    const ring =
      (Math.sin(TAU * 1568 * t) + 0.5 * Math.sin(TAU * 2349 * t)) *
      Math.exp(-t / 0.3) *
      0.18;
    b.L[i] = thock * 0.9 + halo + ring;
    b.R[i] = thock * 0.9 + halo * 0.9 + ring * 1.1;
  }
  writeWav("press-halo.wav", b, Math.pow(10, -5 / 20));
}

score("soundtrack.wav", { drop: 240, breakdown: 555, drop2: 705, end: 1140 });
whoosh("whoosh.wav", 0.5, 11, true);
whoosh("whip.wav", 0.32, 23, false);
pop();
press();
