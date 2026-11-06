#!/usr/bin/env node
/**
 * Walrus Memory — 80.00s Stereo Musical Score & Motion Foley Synthesizer
 * ============================================================================
 * Deterministically synthesizes (zero network calls, seeded PRNG):
 *   1. public/audio/score-master-80s.wav (44.1 kHz, 16-bit stereo, exact 80.00s = 3,528,000 samples)
 *   2. public/audio/laptop-dive.wav      (0.90s warm low-to-high screen dive whoosh + sub settle)
 *   3. public/audio/chapter-chime.wav    (0.60s crisp Cmaj9 glass/Rhodes chapter turn chime)
 *   4. public/audio/halftone-bloom.wav   (0.70s shimmering granular mint dot-bloom wash)
 *
 * Tempo & Beat Grid:
 *   120 BPM · 30 fps · 1 beat = 0.50s (15f) · 1 bar = 2.00s (60f) · 40 bars = 80.00s (2400f)
 *
 * Mastering:
 *   Two-pass ffmpeg loudnorm (I=-14.5 LUFS, TP=-1.5 dBTP, LRA=8) with exact
 *   3,528,000-sample PCM verification and clean 1-beat silence at 73.50s–74.00s.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUT_DIR = path.resolve(__dirname, "../public/audio");

const SR = 44100;
const TAU = Math.PI * 2;
const BPM = 120;
const BEAT = 60 / BPM; // 0.50s (15 frames @ 30fps)
const BAR = BEAT * 4;  // 2.00s (60 frames @ 30fps)

/* ============================================================================
 * Core DSP Primitives (Deterministic PRNG, Cytomic TPT SVF, Chorus, Reverb)
 * ========================================================================== */

function createRng(seed = 0x57414c38) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mtof(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function clamp01(x) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

function smoothstep(x) {
  const c = clamp01(x);
  return 0.5 - 0.5 * Math.cos(Math.PI * c);
}

function panGains(pan) {
  const p = Math.max(-1, Math.min(1, pan));
  const angle = ((p + 1) * Math.PI) / 4;
  return [Math.cos(angle), Math.sin(angle)];
}

function createStereoBuffer(durationSec) {
  const length = Math.round(durationSec * SR);
  return {
    length,
    durationSec,
    L: new Float64Array(length),
    R: new Float64Array(length),
  };
}

/** Unconditionally stable Cytomic / Simper Linear Trapezoidal SVF */
function createSvf() {
  let ic1eq = 0;
  let ic2eq = 0;
  return {
    process(v0, cutoffHz, q = 0.707) {
      const fc = Math.max(20, Math.min(SR * 0.47, cutoffHz));
      const g = Math.tan((Math.PI * fc) / SR);
      const k = 1 / Math.max(0.15, q);
      const a1 = 1 / (1 + g * (g + k));
      const a2 = g * a1;
      const a3 = g * a2;
      const v3 = v0 - ic2eq;
      const v1 = a1 * ic1eq + a2 * v3;
      const v2 = ic2eq + a2 * ic1eq + a3 * v3;
      ic1eq = 2 * v1 - ic1eq;
      ic2eq = 2 * v2 - ic2eq;
      return {
        lp: v2,
        bp: v1,
        hp: v0 - k * v1 - v2,
      };
    },
  };
}

/** Stereo Dimension-D style warm modulated chorus */
function applyStereoChorus(inL, inR, wet = 0.28) {
  const n = inL.length;
  const outL = new Float64Array(n);
  const outR = new Float64Array(n);
  const maxDelay = Math.ceil(0.025 * SR);
  const bufL = new Float64Array(maxDelay);
  const bufR = new Float64Array(maxDelay);
  let writeIdx = 0;

  const readInterp = (buf, delaySamples) => {
    let pos = writeIdx - delaySamples;
    if (pos < 0) pos += maxDelay;
    const i0 = Math.floor(pos);
    const frac = pos - i0;
    const i1 = (i0 + 1) % maxDelay;
    return buf[i0] * (1 - frac) + buf[i1] * frac;
  };

  for (let i = 0; i < n; i++) {
    const t = i / SR;
    bufL[writeIdx] = inL[i];
    bufR[writeIdx] = inR[i];

    const d1 = (0.0072 + 0.0021 * Math.sin(TAU * 0.58 * t)) * SR;
    const d2 = (0.0098 + 0.0021 * Math.cos(TAU * 0.63 * t)) * SR;
    const cL = readInterp(bufL, d1) * 0.7 + readInterp(bufR, d2) * 0.3;
    const cR = readInterp(bufR, d2) * 0.7 + readInterp(bufL, d1) * 0.3;

    outL[i] = inL[i] * (1 - wet * 0.35) + cL * wet;
    outR[i] = inR[i] * (1 - wet * 0.35) + cR * wet;
    writeIdx = (writeIdx + 1) % maxDelay;
  }
  return { L: outL, R: outR };
}

/** Warm Wooden Studio Room Reverb (4 parallel damped combs + 2 series allpass per side) */
function computeStereoReverb(sendL, sendR, feedback = 0.76, damp = 0.34) {
  const n = sendL.length;
  const outL = new Float64Array(n);
  const outR = new Float64Array(n);

  const combTuningsL = [1557, 1617, 1491, 1422];
  const combTuningsR = [1557 + 23, 1617 + 23, 1491 + 23, 1422 + 23];
  const allpassTuningsL = [225, 556];
  const allpassTuningsR = [225 + 23, 556 + 23];

  const runChannel = (input, combLengths, apLengths, target) => {
    const combs = combLengths.map((len) => ({
      len,
      buf: new Float64Array(len),
      idx: 0,
      filterStore: 0,
    }));
    const allpasses = apLengths.map((len) => ({
      len,
      buf: new Float64Array(len),
      idx: 0,
    }));
    const hp = createSvf();
    const lp = createSvf();

    for (let i = 0; i < n; i++) {
      const x = input[i] * 0.028;
      let acc = 0;
      for (let c = 0; c < combs.length; c++) {
        const cb = combs[c];
        const out = cb.buf[cb.idx];
        cb.filterStore = out * (1 - damp) + cb.filterStore * damp;
        cb.buf[cb.idx] = x + cb.filterStore * feedback;
        cb.idx = (cb.idx + 1) % cb.len;
        acc += out;
      }
      for (let a = 0; a < allpasses.length; a++) {
        const ap = allpasses[a];
        const bufOut = ap.buf[ap.idx];
        const apIn = acc;
        acc = -apIn + bufOut;
        ap.buf[ap.idx] = apIn + bufOut * 0.5;
        ap.idx = (ap.idx + 1) % ap.len;
      }
      // Clean sub mud (<190 Hz) and harsh fizz (>3600 Hz) from reverb return
      const cleaned = lp.process(hp.process(acc, 190, 0.707).hp, 3600, 0.707).lp;
      target[i] = cleaned;
    }
  };

  runChannel(sendL, combTuningsL, allpassTuningsL, outL);
  runChannel(sendR, combTuningsR, allpassTuningsR, outR);
  return { L: outL, R: outR };
}

/** Transparent Lookahead Mastering Limiter (3ms lookahead, smooth release) */
function applyLookaheadLimiter(buf, ceilingLinear = 0.82) {
  const n = buf.length;
  const lookahead = Math.round(0.003 * SR);
  const attackCoeff = Math.exp(-1 / (0.0015 * SR));
  const releaseCoeff = Math.exp(-1 / (0.065 * SR));

  let env = 1.0;
  const dL = new Float64Array(lookahead);
  const dR = new Float64Array(lookahead);
  let ptr = 0;

  // Pre-fill lookahead delay and compute per-sample gain envelope
  const gains = new Float64Array(n);
  for (let i = 0; i < n + lookahead; i++) {
    const inIdx = Math.min(n - 1, i);
    const peak = Math.max(Math.abs(buf.L[inIdx]), Math.abs(buf.R[inIdx]));
    const desiredGain = peak > ceilingLinear ? ceilingLinear / peak : 1.0;
    if (desiredGain < env) {
      env = attackCoeff * env + (1 - attackCoeff) * desiredGain;
    } else {
      env = releaseCoeff * env + (1 - releaseCoeff) * desiredGain;
    }
    if (i >= lookahead) {
      gains[i - lookahead] = env;
    }
  }

  // Second pass: smooth local minimum over lookahead window so zero peaks slip past
  for (let i = 0; i < n; i++) {
    const g = gains[i];
    buf.L[i] *= g;
    buf.R[i] *= g;
    // Safety clamp at ceilingLinear
    const p = Math.max(Math.abs(buf.L[i]), Math.abs(buf.R[i]));
    if (p > ceilingLinear) {
      const s = ceilingLinear / p;
      buf.L[i] *= s;
      buf.R[i] *= s;
    }
  }
}

/** High-pass DC blocker + edge de-click + optional peak normalization */
function cleanAndNormalize(buf, targetPeak = null, fadeInSec = 0.003, fadeOutSec = 0.01) {
  const { L, R, length } = buf;
  let xL1 = 0, yL1 = 0, xR1 = 0, yR1 = 0;
  for (let i = 0; i < length; i++) {
    const xL = L[i];
    yL1 = xL - xL1 + 0.9995 * yL1;
    xL1 = xL;
    L[i] = yL1;

    const xR = R[i];
    yR1 = xR - xR1 + 0.9995 * yR1;
    xR1 = xR;
    R[i] = yR1;
  }

  const fi = Math.min(length, Math.max(8, Math.round(fadeInSec * SR)));
  const fo = Math.min(length, Math.max(8, Math.round(fadeOutSec * SR)));
  for (let i = 0; i < fi; i++) {
    const g = smoothstep(i / fi);
    L[i] *= g;
    R[i] *= g;
  }
  for (let i = 0; i < fo; i++) {
    const idx = length - 1 - i;
    const g = smoothstep(i / fo);
    L[idx] *= g;
    R[idx] *= g;
  }
  L[0] = 0;
  R[0] = 0;
  L[length - 1] = 0;
  R[length - 1] = 0;

  let maxAbs = 0;
  for (let i = 0; i < length; i++) {
    const m = Math.max(Math.abs(L[i]), Math.abs(R[i]));
    if (m > maxAbs) maxAbs = m;
  }

  if (targetPeak !== null && maxAbs > 1e-9) {
    const g = targetPeak / maxAbs;
    maxAbs = 0;
    for (let i = 0; i < length; i++) {
      L[i] *= g;
      R[i] *= g;
      const m = Math.max(Math.abs(L[i]), Math.abs(R[i]));
      if (m > maxAbs) maxAbs = m;
    }
  }

  return {
    peakLinear: maxAbs,
    peakDbFS: 20 * Math.log10(Math.max(1e-9, maxAbs)),
  };
}

/** Write canonical 44-byte RIFF PCM 16-bit Stereo 44.1 kHz WAV */
function writeWavFile(filePath, buf) {
  const dataSize = buf.length * 4;
  const out = Buffer.alloc(44 + dataSize);
  out.write("RIFF", 0);
  out.writeUInt32LE(36 + dataSize, 4);
  out.write("WAVE", 8);
  out.write("fmt ", 12);
  out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20);      // PCM
  out.writeUInt16LE(2, 22);      // Stereo
  out.writeUInt32LE(SR, 24);     // 44100 Hz
  out.writeUInt32LE(SR * 4, 28); // ByteRate
  out.writeUInt16LE(4, 32);      // BlockAlign
  out.writeUInt16LE(16, 34);     // BitsPerSample
  out.write("data", 36);
  out.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < buf.length; i++) {
    const sL = Math.max(-1, Math.min(1, buf.L[i]));
    const sR = Math.max(-1, Math.min(1, buf.R[i]));
    out.writeInt16LE(Math.round(sL * 32767), offset);
    out.writeInt16LE(Math.round(sR * 32767), offset + 2);
    offset += 4;
  }
  fs.writeFileSync(filePath, out);
}

/** Read PCM samples from any 16-bit stereo WAV (skipping metadata chunks) into exact targetSamples */
function readWavIntoExactBuffer(filePath, targetSamples) {
  const raw = fs.readFileSync(filePath);
  let pos = 12;
  let dataOffset = -1;
  let dataBytes = 0;
  while (pos + 8 <= raw.length) {
    const id = raw.toString("ascii", pos, pos + 4);
    const size = raw.readUInt32LE(pos + 4);
    if (id === "data") {
      dataOffset = pos + 8;
      dataBytes = size;
      break;
    }
    pos += 8 + size + (size % 2);
  }
  if (dataOffset < 0) {
    throw new Error(`No data chunk found in ${filePath}`);
  }
  const availableSamples = Math.min(
    Math.floor(dataBytes / 4),
    Math.floor((raw.length - dataOffset) / 4)
  );
  const buf = createStereoBuffer(targetSamples / SR);
  const copyCount = Math.min(targetSamples, availableSamples);
  for (let i = 0; i < copyCount; i++) {
    const off = dataOffset + i * 4;
    buf.L[i] = raw.readInt16LE(off) / 32768;
    buf.R[i] = raw.readInt16LE(off + 2) / 32768;
  }
  return buf;
}

/* ============================================================================
 * 1. SCORE-MASTER-80S.WAV (80.00s = 40 Bars @ 120 BPM)
 * ========================================================================== */

function generateScore80s() {
  const DURATION = 80.0;
  const TOTAL_SAMPLES = Math.round(DURATION * SR); // 3,528,000 exact
  const rng = createRng(0x57414c38);

  // Separate stereo stems for studio-grade mixing, sidechain ducking & FX sends
  const keysStem = createStereoBuffer(DURATION);   // Fender Rhodes + Airy Pad
  const melodyStem = createStereoBuffer(DURATION); // Marimba + Pluck Arp + Bell Lead
  const bassStem = createStereoBuffer(DURATION);   // Warm Moog Sub-Bass
  const drumsStem = createStereoBuffer(DURATION);  // Kick, Rim/Snare, 16th Shaker/Hats, Risers
  const revSend = createStereoBuffer(DURATION);    // Reverb bus send

  const sidechain = new Float64Array(TOTAL_SAMPLES).fill(1.0);

  // Rich Jazz/Electronic Voicings: Cmaj9, Am9, Fmaj9, G13sus
  const VOICINGS = {
    Cmaj9: {
      name: "Cmaj9",
      bass: 36, // C2
      fifth: 43, // G2
      rhodes: [48, 52, 55, 59, 62, 67], // C3 E3 G3 B3 D4 G4
      pad: [60, 64, 67, 71, 74],        // C4 E4 G4 B4 D5
      arp: [60, 64, 67, 71, 74, 76, 79, 83],
    },
    Am9: {
      name: "Am9",
      bass: 33, // A1
      fifth: 40, // E2
      rhodes: [45, 48, 52, 55, 59, 64], // A2 C3 E3 G3 B3 E4
      pad: [57, 60, 64, 67, 71],        // A3 C4 E4 G4 B4
      arp: [57, 60, 64, 67, 71, 72, 76, 79],
    },
    Fmaj9: {
      name: "Fmaj9",
      bass: 29, // F1 (paired with F2 warm harmonic)
      fifth: 36, // C2
      rhodes: [41, 45, 48, 52, 55, 60], // F2 A2 C3 E3 G3 C4
      pad: [57, 60, 64, 67, 72],        // A3 C4 E4 G4 C5
      arp: [57, 60, 64, 67, 69, 72, 76, 79],
    },
    G13sus: {
      name: "G13sus",
      bass: 31, // G1 (paired with G2 warm harmonic)
      fifth: 38, // D2
      rhodes: [43, 48, 50, 53, 57, 64], // G2 C3 D3 F3 A3 E4
      pad: [55, 60, 62, 65, 69, 76],    // G3 C4 D4 F4 A4 E5
      arp: [55, 60, 62, 65, 69, 72, 76, 79],
    },
  };

  // Explicit 40-bar harmonic score map so every single chapter & drop resolves musically!
  const BAR_CHORD_NAMES = [
    // Bars 0-2 (0.0s - 6.0s): Hook (Cmaj9 -> Am9 -> Fmaj9)
    "Cmaj9", "Am9", "Fmaj9",
    // Bars 3-8 (6.0s - 18.0s): DROP A (Logo Collapse -> Composer -> Laptop Dive swell)
    "Cmaj9", "Am9", "Fmaj9", "G13sus", "Am9", "G13sus",
    // Bars 9-15 (18.0s - 32.0s): Chapter 1 (Live Recall + DROP B @ Bar 11 / 22.0s)
    "Cmaj9", "G13sus", "Cmaj9", "Am9", "Fmaj9", "G13sus", "G13sus",
    // Bars 16-22 (32.0s - 46.0s): Chapter 2 (Without vs With Proof)
    "Cmaj9", "Am9", "Fmaj9", "G13sus", "Cmaj9", "Am9", "Fmaj9",
    // Bars 23-29 (46.0s - 60.0s): Chapter 3 Breakdown (46-50s half-time -> 50-60s graph groove)
    "Cmaj9", "Fmaj9", "Cmaj9", "Am9", "Fmaj9", "Am9", "G13sus",
    // Bars 30-36 (60.0s - 74.0s): Chapter 4 Final Drive (stops at 73.50s for 1-beat breath!)
    "Cmaj9", "Am9", "Fmaj9", "G13sus", "Cmaj9", "Fmaj9", "G13sus",
    // Bars 37-39 (74.0s - 80.0s): End Card resonant Cmaj9 chord ring-out
    "Cmaj9", "Cmaj9", "Cmaj9",
  ];

  const getChordAtTime = (t) => {
    const bar = Math.max(0, Math.min(39, Math.floor(t / BAR)));
    // Half-bar harmonic pickups for extra musical momentum:
    if (bar === 2 && t >= 5.25) return VOICINGS.G13sus;
    if (bar === 15 && t < 31.0) return VOICINGS.Fmaj9;
    if (bar === 22 && t >= 45.0) return VOICINGS.G13sus;
    if (bar === 35 && t < 71.0) return VOICINGS.Am9;
    return VOICINGS[BAR_CHORD_NAMES[bar]];
  };

  /* --------------------------------------------------------------------------
   * Instrument Helper 1: Authentic Fender Rhodes Mk1 Note (FM Bark + Bell Tine)
   * ------------------------------------------------------------------------ */
  function addRhodesChord(startSec, durSec, notes, vel = 1.0, strumSec = 0.016, reverbAmt = 0.35) {
    notes.forEach((midi, idx) => {
      const f = mtof(midi);
      const onset = startSec + idx * strumSec;
      const s0 = Math.round(onset * SR);
      const s1 = Math.min(TOTAL_SAMPLES, Math.round((onset + durSec) * SR));
      const basePan = -0.42 + (idx / Math.max(1, notes.length - 1)) * 0.84;
      const ph0 = rng() * TAU;
      const isTopVoice = idx >= notes.length - 2;

      for (let i = s0; i < s1; i++) {
        const t = (i - s0) / SR;
        const rem = (s1 - i) / SR;
        const atk = 1 - Math.exp(-t / 0.0045);
        const rel = rem < 0.09 ? smoothstep(rem / 0.09) : 1.0;

        // Warm FM reed bark (1:1 & 1:2) + crystalline Rhodes tine (1:7)
        const barkMod = Math.sin(TAU * f * t) * (0.48 * vel * Math.exp(-t / 0.22));
        const warmMod = Math.sin(TAU * f * 2 * t) * (0.24 * Math.exp(-t / 0.45));
        const bodyEnv = 0.72 * Math.exp(-t / 1.95) + 0.28 * Math.exp(-t / 4.2);
        const body = Math.sin(TAU * f * t + barkMod + warmMod + ph0) * bodyEnv;

        const tineEnv = Math.exp(-t / 0.26) * (isTopVoice ? 0.22 : 0.12);
        const tine =
          Math.sin(TAU * f * 7.0 * t + 0.3 * Math.sin(TAU * f * 14.0 * t) * Math.exp(-t / 0.05)) *
          tineEnv;

        // Gentle classic Rhodes stereo auto-panning (3.8 Hz)
        const autoPan = Math.max(-0.85, Math.min(0.85, basePan + 0.22 * Math.sin(TAU * 3.8 * (i / SR))));
        const [gL, gR] = panGains(autoPan);

        const sample = (body + tine) * atk * rel * vel * 0.095;
        const l = sample * gL;
        const r = sample * gR;
        keysStem.L[i] += l;
        keysStem.R[i] += r;
        revSend.L[i] += l * reverbAmt;
        revSend.R[i] += r * reverbAmt;
      }
    });
  }

  /* --------------------------------------------------------------------------
   * Instrument Helper 2: Airy Velvet Analog Pad
   * ------------------------------------------------------------------------ */
  function addVelvetPad(startSec, durSec, notes, vel = 1.0) {
    notes.forEach((midi, idx) => {
      const f = mtof(midi);
      const s0 = Math.round(startSec * SR);
      const s1 = Math.min(TOTAL_SAMPLES, Math.round((startSec + durSec) * SR));
      const [gL, gR] = panGains(-0.55 + (idx / Math.max(1, notes.length - 1)) * 1.1);
      const ph = rng() * TAU;

      for (let i = s0; i < s1; i++) {
        const t = (i - s0) / SR;
        const rem = (s1 - i) / SR;
        const env = smoothstep(t / 0.32) * smoothstep(rem / 0.35) * vel * 0.036;
        // Detuned warm triangle/saw harmonics (1st, 2nd, 3rd, 5th)
        const oscL =
          Math.sin(TAU * f * 0.9975 * t + ph) +
          0.42 * Math.sin(TAU * f * 2 * 0.998 * t + ph * 1.7) +
          0.18 * Math.sin(TAU * f * 3 * 0.9985 * t);
        const oscR =
          Math.sin(TAU * f * 1.0025 * t + ph + 0.5) +
          0.42 * Math.sin(TAU * f * 2 * 1.002 * t + ph * 1.7 + 0.3) +
          0.18 * Math.sin(TAU * f * 3 * 1.0015 * t + 0.6);

        keysStem.L[i] += oscL * env * gL;
        keysStem.R[i] += oscR * env * gR;
        revSend.L[i] += oscL * env * gL * 0.45;
        revSend.R[i] += oscR * env * gR * 0.45;
      }
    });
  }

  /* --------------------------------------------------------------------------
   * Instrument Helper 3: Rosewood Marimba & Plucky Analog Synth Arpeggio
   * ------------------------------------------------------------------------ */
  function addMarimbaNote(onsetSec, midi, vel = 1.0, panPos = 0) {
    const f = mtof(midi);
    const s0 = Math.round(onsetSec * SR);
    const dur = 0.38;
    const s1 = Math.min(TOTAL_SAMPLES, s0 + Math.round(dur * SR));
    const [gL, gR] = panGains(panPos);

    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / SR;
      const atk = smoothstep(t / 0.0022);
      // Rosewood bar 1 : 3.98 overtone + soft wooden mallet tap
      const body =
        Math.sin(TAU * f * t) * Math.exp(-t / 0.13) +
        0.34 * Math.sin(TAU * f * 3.98 * t) * Math.exp(-t / 0.024) +
        0.14 * Math.sin(TAU * f * 2.0 * t) * Math.exp(-t / 0.06);
      const mallet = Math.sin(TAU * 1380 * t) * Math.exp(-t / 0.004) * 0.18;
      const x = (body + mallet) * atk * vel * 0.095;
      melodyStem.L[i] += x * gL;
      melodyStem.R[i] += x * gR;
      revSend.L[i] += x * gL * 0.25;
      revSend.R[i] += x * gR * 0.25;
    }
  }

  function addPluckSynthNote(onsetSec, midi, durSec = 0.28, vel = 1.0, panPos = 0, brightness = 1.0) {
    const f = mtof(midi);
    const s0 = Math.round(onsetSec * SR);
    const s1 = Math.min(TOTAL_SAMPLES, s0 + Math.round(durSec * SR));
    const [gL, gR] = panGains(panPos);
    const svf = createSvf();

    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / SR;
      const rem = (s1 - i) / SR;
      const ampEnv = smoothstep(t / 0.0025) * Math.exp(-t / (durSec * 0.68)) * smoothstep(rem / 0.015);
      // Rich band-limited sawtooth + octave shimmer through fast filter envelope
      let saw = 0;
      for (let h = 1; h <= 6; h++) {
        if (f * h < SR * 0.44) {
          saw += (Math.sin(TAU * f * h * t) / h) * (h === 2 ? 1.25 : 1.0);
        }
      }
      const cutoff = (650 + 4600 * brightness * Math.exp(-t / 0.075));
      const filtered = svf.process(saw, cutoff, 1.35).lp;
      const x = filtered * ampEnv * vel * 0.115;
      melodyStem.L[i] += x * gL;
      melodyStem.R[i] += x * gR;
      revSend.L[i] += x * gL * 0.34;
      revSend.R[i] += x * gR * 0.34;
    }
  }

  function addCrystallineBell(onsetSec, midi, durSec = 1.1, vel = 1.0, panPos = 0) {
    const f = mtof(midi);
    const s0 = Math.round(onsetSec * SR);
    const s1 = Math.min(TOTAL_SAMPLES, s0 + Math.round(durSec * SR));
    const [gL, gR] = panGains(panPos);

    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / SR;
      const rem = (s1 - i) / SR;
      const env = smoothstep(t / 0.003) * Math.exp(-t / (durSec * 0.42)) * smoothstep(rem / 0.03);
      const modIdx = 1.65 * Math.exp(-t / 0.18);
      const bell =
        Math.sin(TAU * f * t + modIdx * Math.sin(TAU * f * 3.0 * t)) +
        0.28 * Math.sin(TAU * f * 2.002 * t) * Math.exp(-t / 0.22);
      const x = bell * env * vel * 0.082;
      melodyStem.L[i] += x * gL;
      melodyStem.R[i] += x * gR;
      revSend.L[i] += x * gL * 0.52;
      revSend.R[i] += x * gR * 0.52;
    }
  }

  /* --------------------------------------------------------------------------
   * Instrument Helper 4: Warm Moog Ladder-Filtered Sub-Bass
   * ------------------------------------------------------------------------ */
  function addMoogBass(onsetSec, durSec, midi, vel = 1.0, slideFromMidi = null) {
    const fTarget = mtof(midi);
    const fStart = slideFromMidi ? mtof(slideFromMidi) : fTarget * 1.03;
    const s0 = Math.round(onsetSec * SR);
    const s1 = Math.min(TOTAL_SAMPLES, s0 + Math.round(durSec * SR));
    const svf1 = createSvf();
    const svf2 = createSvf();
    let ph = 0;

    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / SR;
      const rem = (s1 - i) / SR;
      const f = fTarget + (fStart - fTarget) * Math.exp(-t / 0.035);
      ph += (TAU * f) / SR;

      const env = smoothstep(t / 0.006) * smoothstep(rem / 0.025) * (0.78 * Math.exp(-t / 0.85) + 0.22);
      // Pure sub fundamental + warm 2nd/3rd/4th analog harmonics so bass is audible on laptop AND subwoofers
      const subSine = Math.sin(ph);
      const warmHarmonics =
        0.58 * Math.sin(ph * 2) +
        0.32 * Math.sin(ph * 3) +
        0.18 * Math.sin(ph * 4);
      const filtCut = 170 + 440 * Math.exp(-t / 0.11) * vel;
      const stage1 = svf1.process(warmHarmonics, filtCut, 1.15).lp;
      const stage2 = svf2.process(stage1, filtCut * 1.1, 0.85).lp;

      const mono = Math.tanh((subSine * 0.92 + stage2 * 0.85) * 1.35) * env * vel * 0.255;
      bassStem.L[i] += mono;
      bassStem.R[i] += mono;
    }
  }

  /* --------------------------------------------------------------------------
   * Instrument Helper 5: Warm 120 BPM Drum Kit & Risers
   * ------------------------------------------------------------------------ */
  function addKick(onsetSec, vel = 1.0, duckDepth = 0.62) {
    const s0 = Math.round(onsetSec * SR);
    const dur = 0.36;
    const s1 = Math.min(TOTAL_SAMPLES, s0 + Math.round(dur * SR));
    const beaterSvf = createSvf();
    let ph = 0;

    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / SR;
      // Punchy rounded pitch envelope: 158 Hz -> 48 Hz
      const f = 48 + 110 * Math.exp(-t / 0.032) + 85 * Math.exp(-t / 0.008);
      ph += (TAU * f) / SR;
      const bodyEnv = smoothstep(t / 0.0018) * Math.exp(-t / 0.155);
      const subBody = Math.sin(ph) * bodyEnv;
      // Warm felt beater transient around 1.9 kHz (never harsh clicky)
      const beater =
        beaterSvf.process(rng() * 2 - 1, 1950, 1.4).bp * Math.exp(-t / 0.0065) * 0.32 +
        Math.sin(TAU * 220 * t) * Math.exp(-t / 0.014) * 0.22;

      const x = Math.tanh((subBody + beater) * 1.55) * 0.44 * vel;
      drumsStem.L[i] += x;
      drumsStem.R[i] += x;
    }

    // Sidechain ducking curve for Bass & Keys
    const duckSamples = Math.round(0.26 * SR);
    for (let j = 0; j < duckSamples; j++) {
      const idx = s0 + j;
      if (idx >= TOTAL_SAMPLES) break;
      const dt = j / SR;
      const atk = smoothstep(dt / 0.006);
      const recovery = 1 - duckDepth * vel * atk * Math.exp(-dt / 0.095);
      if (recovery < sidechain[idx]) sidechain[idx] = recovery;
    }
  }

  function addRimSnare(onsetSec, vel = 1.0, withClapLayer = false) {
    const s0 = Math.round(onsetSec * SR);
    const dur = 0.24;
    const s1 = Math.min(TOTAL_SAMPLES, s0 + Math.round(dur * SR));
    const bp = createSvf();
    const hp = createSvf();

    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / SR;
      // Crisp woody rimshot body (410 Hz + 1120 Hz + 225 Hz snare drum fundamental)
      const rim =
        (Math.sin(TAU * (215 + 90 * Math.exp(-t / 0.01)) * t) * Math.exp(-t / 0.032) * 0.55 +
          Math.sin(TAU * 435 * t) * Math.exp(-t / 0.016) * 0.38 +
          Math.sin(TAU * 1160 * t) * Math.exp(-t / 0.008) * 0.25) *
        smoothstep(t / 0.001);

      // Brushed snare wires
      const n = rng() * 2 - 1;
      const wires =
        bp.process(n, 2600, 0.95).bp * Math.exp(-t / 0.062) * 0.48 +
        hp.process(n, 5200, 0.75).hp * Math.exp(-t / 0.042) * 0.26;

      const x = Math.tanh((rim + wires) * 1.35) * 0.28 * vel;
      drumsStem.L[i] += x * 0.97;
      drumsStem.R[i] += x * 1.03;
      revSend.L[i] += x * 0.22;
      revSend.R[i] += x * 0.24;
    }

    if (withClapLayer) {
      // Soft stereo micro-flam clap tail in Final Drive climax
      const offsets = [0.008, 0.017, 0.027];
      offsets.forEach((off, k) => {
        const cs0 = Math.round((onsetSec + off) * SR);
        const cs1 = Math.min(TOTAL_SAMPLES, cs0 + Math.round(0.14 * SR));
        const cSvf = createSvf();
        const [gL, gR] = panGains(k === 1 ? -0.32 : 0.32);
        for (let i = cs0; i < cs1; i++) {
          const t = (i - cs0) / SR;
          const burst = cSvf.process(rng() * 2 - 1, 1850, 1.3).bp * Math.exp(-t / 0.055) * 0.11 * vel;
          drumsStem.L[i] += burst * gL;
          drumsStem.R[i] += burst * gR;
        }
      });
    }
  }

  function addShakerHat(onsetSec, vel = 1.0, open = false, panPos = 0) {
    const s0 = Math.round(onsetSec * SR);
    const dur = open ? 0.20 : 0.065;
    const s1 = Math.min(TOTAL_SAMPLES, s0 + Math.round(dur * SR));
    const hp = createSvf();
    const bp = createSvf();
    const [gL, gR] = panGains(panPos);

    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / SR;
      const atk = smoothstep(t / (open ? 0.003 : 0.002));
      const decay = Math.exp(-t / (open ? 0.068 : 0.017));
      const n = rng() * 2 - 1;
      const metallic =
        hp.process(n, open ? 7200 : 8200, 0.9).hp * 0.65 +
        bp.process(n, 5400, 1.8).bp * 0.35;
      const x = metallic * atk * decay * vel * 0.11;
      drumsStem.L[i] += x * gL;
      drumsStem.R[i] += x * gR;
    }
  }

  function addWarmTom(onsetSec, midi, vel = 1.0, panPos = 0) {
    const f0 = mtof(midi);
    const s0 = Math.round(onsetSec * SR);
    const s1 = Math.min(TOTAL_SAMPLES, s0 + Math.round(0.24 * SR));
    const [gL, gR] = panGains(panPos);
    let ph = 0;
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / SR;
      const f = f0 * (1 + 0.55 * Math.exp(-t / 0.026));
      ph += (TAU * f) / SR;
      const x = Math.tanh(Math.sin(ph) * 1.3) * smoothstep(t / 0.002) * Math.exp(-t / 0.085) * vel * 0.25;
      drumsStem.L[i] += x * gL;
      drumsStem.R[i] += x * gR;
      revSend.L[i] += x * gL * 0.22;
      revSend.R[i] += x * gR * 0.22;
    }
  }

  function addFilterRiser(startSec, endSec, vel = 1.0, withPitchGlide = true) {
    const s0 = Math.round(startSec * SR);
    const s1 = Math.min(TOTAL_SAMPLES, Math.round(endSec * SR));
    const dur = Math.max(0.05, endSec - startSec);
    const svfL = createSvf();
    const svfR = createSvf();
    let glidePh = 0;

    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / SR;
      const p = clamp01(t / dur);
      // Micro-tighten last 25ms so the downbeat drop hits super crisply
      const preDrop = p > 0.96 ? smoothstep((1 - p) / 0.04) * 0.5 + 0.5 : 1.0;
      const env = Math.pow(p, 2.0) * smoothstep(t / 0.06) * preDrop * vel;
      const cut = 320 + 5800 * Math.pow(p, 2.15);

      const bL = svfL.process(rng() * 2 - 1, cut, 2.1).bp;
      const bR = svfR.process(rng() * 2 - 1, cut * 1.05, 2.1).bp;

      let tonal = 0;
      if (withPitchGlide) {
        const gf = mtof(60) * Math.pow(2, p); // C4 -> C5 octave harmonic lift
        glidePh += (TAU * gf) / SR;
        tonal = Math.sin(glidePh) * 0.045 * env;
      }

      drumsStem.L[i] += bL * 0.16 * env + tonal;
      drumsStem.R[i] += bR * 0.16 * env + tonal;
      revSend.L[i] += bL * 0.09 * env;
      revSend.R[i] += bR * 0.09 * env;
    }
  }

  function addDownbeatShimmerCrash(onsetSec, vel = 1.0, durSec = 1.8) {
    const s0 = Math.round(onsetSec * SR);
    const s1 = Math.min(TOTAL_SAMPLES, s0 + Math.round(durSec * SR));
    const hpL = createSvf();
    const hpR = createSvf();
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / SR;
      const env = smoothstep(t / 0.005) * Math.exp(-t / (durSec * 0.36)) * vel * 0.085;
      const cL = hpL.process(rng() * 2 - 1, 5600, 0.8).hp * env;
      const cR = hpR.process(rng() * 2 - 1, 5900, 0.8).hp * env;
      drumsStem.L[i] += cL;
      drumsStem.R[i] += cR;
      revSend.L[i] += cL * 0.4;
      revSend.R[i] += cR * 0.4;
    }
  }

  /* ==========================================================================
   * Musical Arrangement Sequencing Across All 40 Bars (0.00s .. 80.00s)
   * ======================================================================== */

  // 1. HARMONIC KEYS & PAD ARRANGEMENT (Bars 0..36 + End Card Bars 37..39)
  for (let bar = 0; bar < 37; bar++) {
    const barStart = bar * BAR;
    const ch = VOICINGS[BAR_CHORD_NAMES[bar]];

    if (bar < 3) {
      // 0.00s - 6.00s (Hook): Lush human-strummed Rhodes + airy high pad
      addRhodesChord(barStart, BAR + 0.25, ch.rhodes, 0.95, 0.022, 0.42);
      addVelvetPad(barStart, BAR + 0.35, ch.pad, bar === 2 ? 1.05 : 0.88);
    } else if (bar === 23 || bar === 24) {
      // 46.00s - 50.00s (Half-time Breakdown): Spacious sustained Rhodes + warm pad
      addRhodesChord(barStart, BAR + 0.30, ch.rhodes, 0.92, 0.024, 0.48);
      addVelvetPad(barStart, BAR + 0.35, ch.pad, 0.95);
    } else if (bar === 36) {
      // 72.00s - 73.50s (Bar 36 before mandatory 1-beat silence at 73.50s!):
      // Beat 0..2 sustained G13sus + crisp accented punctuation on Beat 2 (73.00s) releasing cleanly before 73.50s!
      addRhodesChord(barStart, 1.02, ch.rhodes, 1.05, 0.012, 0.30);
      addRhodesChord(barStart + 1.0, 0.46, ch.rhodes.map((m, k) => (k === 5 ? m + 3 : m)), 1.12, 0.008, 0.25);
      addVelvetPad(barStart, 1.46, ch.pad, 1.05);
    } else {
      // Propulsive Neo-Soul / Melodic House Rhodes Comping in Groove Sections:
      // Downbeat warm chord + syncopated "and of 2" (t + 1.25s) + gentle top pickup on "and of 4" (t + 1.75s)
      const isClimax = bar >= 30;
      const baseVel = isClimax ? 1.08 : 0.94;
      addRhodesChord(barStart, 1.30, ch.rhodes, baseVel, 0.014, 0.32);
      addRhodesChord(barStart + 1.25, 0.52, ch.rhodes.slice(1), baseVel * 0.78, 0.010, 0.28);
      if (bar % 2 === 1 && bar !== 8 && bar !== 29) {
        addRhodesChord(barStart + 1.75, 0.28, ch.rhodes.slice(2), baseVel * 0.62, 0.008, 0.24);
      }
      addVelvetPad(barStart, BAR + 0.2, ch.pad, isClimax ? 1.10 : 0.78);
    }
  }

  // 2. MARIMBA PULSE, PLUCKY SYNTH ARPEGGIO & CRYSTALLINE COUNTER-MELODY
  // 2A. 0.00s - 6.00s (Hook): Subtle warm 8th-note marimba pulse
  const HOOK_MARIMBA_IDX = [0, 2, 4, 2, 5, 4, 2, 3];
  for (let bar = 0; bar < 3; bar++) {
    const ch = VOICINGS[BAR_CHORD_NAMES[bar]];
    for (let e = 0; e < 8; e++) {
      const t = bar * BAR + e * (BEAT * 0.5);
      const fade = 0.55 + 0.45 * clamp01(t / 4.5);
      const note = ch.arp[HOOK_MARIMBA_IDX[e]];
      addMarimbaNote(t, note, (e % 2 === 0 ? 0.72 : 0.50) * fade, e % 2 === 0 ? -0.32 : 0.32);
    }
  }

  // 2B. 6.00s - 22.00s (Drop A & Early Ch.1): Crisp rhythmic marimba + subtle pluck interlock
  const GROOVE_MARIMBA_STEPS = [
    { s: 0, idx: 2, v: 0.78 },
    { s: 3, idx: 4, v: 0.72 },
    { s: 6, idx: 5, v: 0.82 },
    { s: 8, idx: 3, v: 0.65 },
    { s: 11, idx: 6, v: 0.76 },
    { s: 14, idx: 4, v: 0.68 },
  ];
  for (let bar = 3; bar < 11; bar++) {
    const barStart = bar * BAR;
    const ch = VOICINGS[BAR_CHORD_NAMES[bar]];
    for (const st of GROOVE_MARIMBA_STEPS) {
      const t = barStart + st.s * (BEAT / 4);
      addMarimbaNote(t, ch.arp[st.idx], st.v, (st.s % 2 === 0 ? -1 : 1) * 0.38);
    }
    // Uplifting rising pluck notes during Laptop Dive swell (16.00s - 18.00s, Bar 8)
    if (bar === 8) {
      for (let s = 0; s < 16; s++) {
        const t = barStart + s * (BEAT / 4);
        const p = s / 15;
        const note = ch.arp[s % ch.arp.length] + (s >= 8 ? 12 : 0);
        addPluckSynthNote(t, note, 0.22, 0.55 + 0.45 * p, -0.5 + p, 0.6 + 0.6 * p);
      }
    }
  }

  // Sparkle chime accent right on DROP A (6.00s) and Live App arrival (18.00s)
  [72, 76, 79, 83, 86].forEach((m, k) => addCrystallineBell(6.0 + k * 0.035, m, 1.4, 0.85, -0.4 + k * 0.2));
  [72, 76, 79, 86].forEach((m, k) => addCrystallineBell(18.0 + k * 0.03, m, 1.2, 0.78, -0.3 + k * 0.2));

  // 2C. 22.00s - 46.00s (DROP B Lift @ 22.00s / f=660 through Chapters 1 & 2):
  // Bright, genuinely musical 16th-note plucky synth arpeggio + memorable 4-bar lead motif!
  const PLUCK_ARP_PATTERN = [0, 2, 4, 5, 7, 5, 4, 2, 1, 3, 5, 6, 7, 6, 4, 3];
  for (let bar = 11; bar < 23; bar++) {
    const barStart = bar * BAR;
    for (let s = 0; s < 16; s++) {
      const t = barStart + s * (BEAT / 4);
      // Leave clean space during the subtle drum fill at 31.50s - 32.00s
      if (t >= 31.5 && t < 32.0) continue;
      const ch = getChordAtTime(t);
      const note = ch.arp[PLUCK_ARP_PATTERN[s] % ch.arp.length];
      const accent = s % 4 === 0 ? 0.92 : s % 4 === 2 ? 0.76 : 0.56;
      const panPos = ((s % 4) - 1.5) * 0.28;
      const bright = bar >= 16 ? 1.08 : 0.95;
      addPluckSynthNote(t, note, 0.24, accent, panPos, bright);
    }
  }

  // Singing C-major / Lydian bell-pluck counter-melody weaving over Bars 11..22 (22.0s - 46.0s)
  // Expressed as [beatOffsetWithin8Secs, midiNote, vel, dur]
  const SHOWCASE_MELODY_4BAR = [
    [0.0, 76, 0.95, 0.9],   // E5 (Bar 1: Cmaj9)
    [1.5, 79, 0.88, 0.8],   // G5
    [2.5, 83, 0.92, 0.9],   // B5
    [3.5, 86, 0.85, 0.7],   // D6
    [4.0, 84, 0.94, 1.1],   // C6 (Bar 2: Am9)
    [6.0, 79, 0.84, 0.8],   // G5
    [7.0, 76, 0.80, 0.8],   // E5
    [8.0, 81, 0.92, 1.0],   // A5 (Bar 3: Fmaj9)
    [9.5, 79, 0.86, 0.7],   // G5
    [10.5, 76, 0.88, 0.8],  // E5
    [11.5, 74, 0.82, 0.6],  // D5
    [12.0, 79, 0.95, 1.2],  // G5 (Bar 4: G13sus)
    [14.0, 81, 0.88, 0.8],  // A5
    [15.0, 83, 0.90, 0.8],  // B5 pickup -> resolves to E5/C6!
  ];
  // Cycle 1: 22.0s - 30.0s, Cycle 2: 32.0s - 40.0s, Cycle 3 (half): 40.0s - 46.0s
  for (const baseSec of [22.0, 32.0, 40.0]) {
    for (const [bOff, midi, vel, dur] of SHOWCASE_MELODY_4BAR) {
      const t = baseSec + bOff * BEAT;
      if (t >= 45.5) continue;
      addCrystallineBell(t, midi, dur, vel * 0.88, (bOff % 2 === 0 ? -1 : 1) * 0.24);
      addMarimbaNote(t, midi - 12, vel * 0.55, (bOff % 2 === 0 ? 1 : -1) * 0.20);
    }
  }

  // 2D. 46.00s - 60.00s (Chapter 3 Breakdown: Skill Graph):
  // Sparkling crystalline bell arpeggio in 46-50s half-time, continuing as warm pluck+bell weave 50-60s
  const BREAKDOWN_SPARKLE = [2, 4, 6, 7, 6, 4, 5, 7, 3, 5, 6, 7, 5, 4, 2, 4];
  for (let bar = 23; bar < 30; bar++) {
    const barStart = bar * BAR;
    for (let s = 0; s < 16; s++) {
      const t = barStart + s * (BEAT / 4);
      if (t >= 59.5) continue;
      const ch = getChordAtTime(t);
      const note = ch.arp[BREAKDOWN_SPARKLE[s] % ch.arp.length] + (s % 4 === 3 ? 12 : 0);
      const panPos = Math.sin((s / 16) * TAU) * 0.52;
      if (bar < 25) {
        // 46.0s - 50.0s: Crystalline bell arp sparkling over half-time Rhodes & bass
        addCrystallineBell(t, note, 0.55, s % 2 === 0 ? 0.78 : 0.54, panPos);
      } else {
        // 50.0s - 60.0s: Interactive graph opens -> warm pluck + bell harmonic lock
        addPluckSynthNote(t, ch.arp[PLUCK_ARP_PATTERN[s] % ch.arp.length], 0.24, s % 2 === 0 ? 0.82 : 0.56, panPos, 1.0);
        if (s % 4 === 0) {
          addCrystallineBell(t, note, 0.65, 0.72, -panPos);
        }
      }
    }
  }

  // 2E. 60.00s - 73.50s (Chapter 4 Final Drive: One MCP Config):
  // Full uplifting climax with harmonic shimmer, bright plucky arp & triumphant octave-lifted motif!
  for (let bar = 30; bar < 37; bar++) {
    const barStart = bar * BAR;
    for (let s = 0; s < 16; s++) {
      const t = barStart + s * (BEAT / 4);
      if (t > 73.15) break; // Clean cutoff before 73.50s breath!
      const ch = getChordAtTime(t);
      const note = ch.arp[PLUCK_ARP_PATTERN[s] % ch.arp.length];
      const accent = s % 4 === 0 ? 1.02 : s % 2 === 0 ? 0.82 : 0.62;
      const panPos = ((s % 4) - 1.5) * 0.34;
      addPluckSynthNote(t, note, Math.min(0.24, Math.max(0.08, 73.45 - t)), accent, panPos, 1.2);
      // Octave harmonic shimmer on 8th notes
      if (s % 2 === 0 && t < 73.05) {
        addCrystallineBell(t, Math.min(91, note + 12), Math.min(0.55, 73.46 - t), 0.62, -panPos);
      }
    }
  }
  for (const baseSec of [60.0, 68.0]) {
    for (const [bOff, midi, vel, dur] of SHOWCASE_MELODY_4BAR) {
      const t = baseSec + bOff * BEAT;
      if (t > 73.02) break;
      const clampedDur = Math.min(dur, Math.max(0.12, 73.46 - t));
      addCrystallineBell(t, midi, clampedDur, vel * 1.04, (bOff % 2 === 0 ? -1 : 1) * 0.28);
      addPluckSynthNote(t, midi - 12, Math.min(0.32, clampedDur), vel * 0.72, 0, 1.25);
    }
  }
  // Final climax punctuation bell chord at 73.00s (Beat 2 of Bar 36), releasing cleanly by 73.48s
  [74, 79, 81, 86].forEach((m, k) => addCrystallineBell(73.0, m, 0.44, 0.85, -0.3 + k * 0.2));

  // 3. WARM MOOG SUB-BASS ARRANGEMENT (Bars 3..36 + End Card)
  // Groovy 120 BPM melodic house pattern (beat offsets inside a 4-beat bar)
  const BASS_GROOVE = [
    { b: 0.0, dur: 0.68, vel: 1.0, fifth: false, oct: 0 },
    { b: 0.75, dur: 0.22, vel: 0.68, fifth: false, oct: 12 },
    { b: 1.5, dur: 0.45, vel: 0.90, fifth: false, oct: 0 },
    { b: 2.0, dur: 0.45, vel: 0.85, fifth: false, oct: 0 },
    { b: 2.75, dur: 0.22, vel: 0.70, fifth: true, oct: 0 },
    { b: 3.0, dur: 0.45, vel: 0.92, fifth: false, oct: 0 },
    { b: 3.5, dur: 0.42, vel: 0.78, fifth: true, oct: 0 },
  ];

  // Subtle warm sub swell under the Hook's last bar (4.0s - 6.0s)
  addMoogBass(4.0, 1.95, VOICINGS.Fmaj9.bass + 12, 0.55);

  for (let bar = 3; bar < 37; bar++) {
    const barStart = bar * BAR;
    const ch = VOICINGS[BAR_CHORD_NAMES[bar]];

    if (bar === 23 || bar === 24) {
      // 46.00s - 50.00s Breakdown: Deep warm sustained half-bar Moog bass notes
      addMoogBass(barStart, 1.22, ch.bass, 0.92);
      addMoogBass(barStart + 1.25, 0.72, ch.fifth, 0.78);
    } else if (bar === 36) {
      // 72.00s - 73.50s: Drives to Beat 2 (73.00s) and stops cleanly at 73.47s!
      addMoogBass(72.0, 0.68, ch.bass, 1.04);
      addMoogBass(72.75, 0.22, ch.bass + 12, 0.78);
      addMoogBass(73.0, 0.46, ch.bass, 1.08);
    } else {
      const isClimax = bar >= 30;
      const gainMul = isClimax ? 1.08 : 1.0;
      for (const hit of BASS_GROOVE) {
        const t = barStart + hit.b * BEAT;
        if (t >= 31.65 && t < 32.0) continue; // Breathe slightly under Chapter 2 tom fill
        const localCh = getChordAtTime(t);
        const note = (hit.fifth ? localCh.fifth : localCh.bass) + hit.oct;
        addMoogBass(t, hit.dur * BEAT * 2, note, hit.vel * gainMul);
      }
    }
  }

  // 4. CRISP 120 BPM DRUM GROOVE, FILLS & FILTER RISERS
  // 4A. Risers at structural transitions:
  addFilterRiser(4.5, 6.0, 0.95, true);    // Hook -> DROP A (6.00s)
  addFilterRiser(16.0, 18.0, 1.05, true);  // Laptop Dive uplifting swell (16.00s - 18.00s)
  addFilterRiser(21.0, 22.0, 0.72, false); // Mini-lift into DROP B (22.00s)
  addFilterRiser(58.5, 60.0, 1.12, true);  // Breakdown -> Chapter 4 Climax (60.00s)

  // Downbeat shimmer crashes on major drops
  addDownbeatShimmerCrash(6.0, 1.0, 1.9);
  addDownbeatShimmerCrash(18.0, 0.85, 1.6);
  addDownbeatShimmerCrash(22.0, 0.95, 1.8);
  addDownbeatShimmerCrash(32.0, 0.85, 1.6);
  addDownbeatShimmerCrash(50.0, 0.80, 1.5);
  addDownbeatShimmerCrash(60.0, 1.15, 2.2);

  // 4B. Bar-by-bar Drums (Bars 3..36)
  for (let bar = 3; bar < 37; bar++) {
    const barStart = bar * BAR;
    const isClimax = bar >= 30;

    if (bar === 23 || bar === 24) {
      // 46.00s - 50.00s (Half-time pulse for 2 bars in Chapter 3 Breakdown):
      addKick(barStart + 0.0, 0.92, 0.48);
      addKick(barStart + 2.5 * BEAT, 0.68, 0.35);
      addRimSnare(barStart + 2.0 * BEAT, 0.78, false); // Half-time rim on Beat 3!
      for (let e = 0; e < 8; e++) {
        const t = barStart + e * (BEAT * 0.5);
        addShakerHat(t, e % 2 === 1 ? 0.58 : 0.32, e === 7, (e % 2 === 0 ? -1 : 1) * 0.3);
      }
      continue;
    }

    if (bar === 36) {
      // 72.00s - 73.50s: 3 beats of climax drive ending crisply on Beat 2 (73.00s) -> 73.50s silence!
      addKick(72.0, 1.05, 0.62);
      addKick(72.5, 0.96, 0.58);
      addRimSnare(72.5, 1.0, true);
      addKick(73.0, 1.12, 0.62);
      addRimSnare(73.0, 0.95, true);
      addDownbeatShimmerCrash(73.0, 0.75, 0.46);
      for (let s = 0; s < 9; s++) {
        const swing = s % 2 === 1 ? 0.005 : 0;
        const t = 72.0 + s * (BEAT / 4) + swing;
        if (t <= 73.12) {
          addShakerHat(t, s % 4 === 2 ? 0.85 : 0.48, s === 2 || s === 6, (s % 2 === 0 ? -1 : 1) * 0.28);
        }
      }
      continue;
    }

    // Standard propulsive 120 BPM groove bars
    for (let b = 0; b < 4; b++) {
      const beatTime = barStart + b * BEAT;

      // Subtle space at end of Laptop Dive (17.5s) and Chapter 2 fill (31.5s) & Climax snare riser (59.0s)
      const isDiveBreath = bar === 8 && b === 3;
      const isCh2Fill = bar === 15 && b === 3;
      const isClimaxRiser = bar === 29 && b >= 2;

      if (!isDiveBreath && !isCh2Fill && !isClimaxRiser) {
        addKick(beatTime, b === 0 ? 1.02 : 0.93, 0.62);
        // Syncopated ghost kick pickup every 4th bar for warm forward bounce
        if (bar % 4 === 2 && b === 3) {
          addKick(beatTime + 0.75 * BEAT, 0.62, 0.35);
        }
      }

      if ((b === 1 || b === 3) && !isCh2Fill && !isClimaxRiser) {
        addRimSnare(beatTime, isClimax ? 1.06 : 0.94, isClimax);
      }
    }

    // Tight 16th-note stereo shaker & hi-hats with subtle +5ms human groove swing
    for (let s = 0; s < 16; s++) {
      const swing = s % 2 === 1 ? 0.0055 : 0;
      const t = barStart + s * (BEAT / 4) + swing;
      if (t >= 31.5 && t < 32.0) continue;
      if (t >= 59.0 && t < 60.0) continue;
      const isOffbeat8th = s % 4 === 2;
      const vel = isOffbeat8th ? (isClimax ? 0.95 : 0.84) : s % 4 === 0 ? 0.56 : 0.44;
      const panPos = (s % 2 === 0 ? -1 : 1) * (isOffbeat8th ? 0.22 : 0.32);
      addShakerHat(t, vel, isOffbeat8th, panPos);
    }

    // Subtle 1-beat / half-bar rhythmic fill at 31.50s - 32.00s into Chapter 2!
    if (bar === 15) {
      addRimSnare(31.50, 0.82, false);
      addWarmTom(31.625, 55, 0.88, -0.35); // G3 high tom
      addWarmTom(31.750, 50, 0.94, 0.05);  // D3 mid tom
      addWarmTom(31.875, 43, 1.02, 0.38);  // G2 floor tom -> lands on C2 @ 32.00s!
      addShakerHat(31.750, 0.85, true, 0.25);
    }

    // Accelerating snare roll in 58.50s - 60.00s building into Chapter 4 Final Drive!
    if (bar === 29) {
      const rollHits = [
        [58.50, 0.58], [58.75, 0.64],
        [59.00, 0.70], [59.125, 0.74], [59.25, 0.79], [59.375, 0.84],
        [59.50, 0.89], [59.625, 0.94], [59.75, 1.00], [59.875, 1.06],
      ];
      for (const [rt, rv] of rollHits) {
        addRimSnare(rt, rv, rv > 0.85);
      }
    }
  }

  // 5. END CARD RESOLUTION AT 74.00s - 80.00s (Right after 73.50s-74.00s 1-beat silence!)
  {
    const T_END = 74.0;
    // Warm resonant Cmaj9 Rhodes + upper extension (C3 E3 G3 B3 D4 E4 G4 B4)
    const endRhodes = [48, 52, 55, 59, 62, 64, 67, 71];
    addRhodesChord(T_END, 5.85, endRhodes, 1.12, 0.020, 0.55);
    addVelvetPad(T_END, 5.80, [60, 64, 67, 71, 74, 79], 1.15);

    // Deep warm Moog C2 + C1 sub-root decaying smoothly to 80.00s
    const s0 = Math.round(T_END * SR);
    const s1 = TOTAL_SAMPLES;
    const fSub1 = mtof(24); // C1 (32.7 Hz)
    const fSub2 = mtof(36); // C2 (65.4 Hz)
    for (let i = s0; i < s1; i++) {
      const t = (i - s0) / SR;
      const tail = smoothstep((DURATION - i / SR) / 0.8);
      const env = smoothstep(t / 0.008) * Math.exp(-t / 2.35) * tail;
      const sub =
        Math.tanh((0.68 * Math.sin(TAU * fSub2 * t) + 0.52 * Math.sin(TAU * fSub1 * t) + 0.24 * Math.sin(TAU * fSub2 * 2 * t)) * 1.3) *
        env *
        0.30;
      bassStem.L[i] += sub;
      bassStem.R[i] += sub;
    }

    // Soft cushioned sub-kick + brush halo + crystalline Cmaj9 bell harp at 74.00s
    addKick(T_END, 0.95, 0.28);
    addDownbeatShimmerCrash(T_END, 0.72, 3.2);
    [60, 64, 67, 71, 74, 76, 79, 83].forEach((m, k) => {
      addCrystallineBell(T_END + k * 0.028, m + 12 <= 91 ? m + 12 : m, 4.4, 0.86, -0.5 + k * 0.14);
    });
  }

  /* ==========================================================================
   * Studio Mixdown: Chorus, Ping-Pong Delay, Section Filter Automation, Reverb,
   * Sidechain Ducking & Mandatory Clean 1-Beat Silence Gate (73.50s - 74.00s)
   * ======================================================================== */

  // 1. Stereo Dimension Chorus on Rhodes + Pad
  const chorusedKeys = applyStereoChorus(keysStem.L, keysStem.R, 0.30);

  // 2. Dynamic warm filter sweep on Keys stem (opens in Hook, lifts in Laptop Dive & Climax)
  const keysLpL = createSvf();
  const keysLpR = createSvf();
  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    const t = i / SR;
    let cut = 4200;
    if (t < 6.0) {
      cut = 950 + 3800 * Math.pow(clamp01(t / 6.0), 1.6);
    } else if (t >= 16.0 && t < 18.0) {
      cut = 2800 + 3800 * Math.pow((t - 16.0) / 2.0, 1.5);
    } else if (t >= 46.0 && t < 50.0) {
      cut = 2600 + 1200 * ((t - 46.0) / 4.0);
    } else if (t >= 58.0 && t < 60.0) {
      cut = 3200 + 3800 * Math.pow((t - 58.0) / 2.0, 1.5);
    } else if (t >= 60.0 && t < 73.5) {
      cut = 5800;
    } else if (t >= 74.0) {
      cut = 4800 * Math.exp(-(t - 74.0) / 3.8) + 750;
    }
    chorusedKeys.L[i] = keysLpL.process(chorusedKeys.L[i], cut, 0.78).lp;
    chorusedKeys.R[i] = keysLpR.process(chorusedKeys.R[i], cut, 0.78).lp;
  }

  // 3. Filtered Dotted-8th (0.375s) Stereo Ping-Pong Delay on Melody/Arp stem
  const delaySamples = Math.round(BEAT * 0.75 * SR);
  const dBufL = new Float64Array(TOTAL_SAMPLES);
  const dBufR = new Float64Array(TOTAL_SAMPLES);
  const dLpL = createSvf();
  const dLpR = createSvf();
  const dHpL = createSvf();
  const dHpR = createSvf();
  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    let fbL = i >= delaySamples ? dBufR[i - delaySamples] * 0.30 : 0;
    let fbR = i >= delaySamples ? dBufL[i - delaySamples] * 0.30 : 0;
    // Clear delay feedback across the 73.50s-74.00s silence so zero echo bleeds into 74.00s!
    const sec = i / SR;
    if (sec >= 73.48 && sec < 74.0) {
      fbL = 0;
      fbR = 0;
    }
    dBufL[i] = dLpL.process(dHpL.process(melodyStem.L[i] + fbL, 280, 0.7).hp, 3400, 0.7).lp;
    dBufR[i] = dLpR.process(dHpR.process(melodyStem.R[i] + fbR, 280, 0.7).hp, 3400, 0.7).lp;
    melodyStem.L[i] += fbL * 0.85;
    melodyStem.R[i] += fbR * 0.85;
  }

  // 4. Stereo Algorithmic Room Reverb
  const reverbOut = computeStereoReverb(revSend.L, revSend.R, 0.77, 0.33);

  // 5. Sum Stems with Sidechain Ducking + Master Breath Gate (73.50s - 74.00s) + Master Fades
  const master = createStereoBuffer(DURATION);
  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    const t = i / SR;
    const scBass = sidechain[i];
    const scHarmonic = 1 - (1 - scBass) * 0.52; // Gentler ducking on chords/melody/reverb

    let l =
      drumsStem.L[i] * 1.05 +
      bassStem.L[i] * scBass * 1.04 +
      chorusedKeys.L[i] * scHarmonic * 1.05 +
      melodyStem.L[i] * scHarmonic * 1.02 +
      reverbOut.L[i] * scHarmonic * 0.92;

    let r =
      drumsStem.R[i] * 1.05 +
      bassStem.R[i] * scBass * 1.04 +
      chorusedKeys.R[i] * scHarmonic * 1.05 +
      melodyStem.R[i] * scHarmonic * 1.02 +
      reverbOut.R[i] * scHarmonic * 0.92;

    // Warm master console saturation with open crest factor
    l = Math.tanh(l * 0.92);
    r = Math.tanh(r * 0.92);

    // Mandatory 1-beat clean silence / breath: 73.50s - 74.00s (f=2205..2220)
    let breathGate = 1.0;
    if (t >= 73.40 && t < 73.50) {
      breathGate = smoothstep((73.50 - t) / 0.10);
    } else if (t >= 73.50 && t < 73.998) {
      breathGate = 0.0;
    } else if (t >= 73.998 && t < 74.002) {
      breathGate = smoothstep((t - 73.998) / 0.004);
    }

    // Smooth intro air-in (0.18s) and natural final decay to silence at 80.00s
    const fadeIn = smoothstep(t / 0.18);
    const fadeOut = t > 78.2 ? smoothstep((DURATION - t) / 1.8) : 1.0;

    master.L[i] = l * breathGate * fadeIn * fadeOut;
    master.R[i] = r * breathGate * fadeIn * fadeOut;
  }

  // DC block + Lookahead Limiter at -1.7 dBFS (0.822) so ffmpeg two-pass loudnorm operates 100% linearly
  cleanAndNormalize(master, null, 0.015, 0.05);
  applyLookaheadLimiter(master, 0.82);

  // Enforce exact zero in [73.505s, 73.995s]
  const silenceStart = Math.round(73.505 * SR);
  const silenceEnd = Math.round(73.995 * SR);
  for (let i = silenceStart; i < silenceEnd; i++) {
    master.L[i] = 0;
    master.R[i] = 0;
  }

  // Two-pass FFmpeg EBU R128 loudnorm -> I=-14.5 LUFS, TP=-1.5 dBTP, LRA=8
  const tmpRaw = path.join(os.tmpdir(), `score-master-80s-raw-${process.pid}.wav`);
  const tmpNorm = path.join(os.tmpdir(), `score-master-80s-norm-${process.pid}.wav`);
  writeWavFile(tmpRaw, master);

  const pass1Stderr = execFileSync(
    "sh",
    [
      "-c",
      `ffmpeg -hide_banner -nostats -i "${tmpRaw}" -af "loudnorm=I=-14.5:TP=-1.5:LRA=8:print_format=json" -f null - 2>&1`,
    ],
    { encoding: "utf8" }
  );

  const jsonMatch = pass1Stderr.match(/\{[\s\S]*"input_i"[\s\S]*?\}/);
  if (!jsonMatch) {
    throw new Error(`Failed to parse ffmpeg loudnorm JSON:\n${pass1Stderr}`);
  }
  const ln = JSON.parse(jsonMatch[0]);

  const loudnormPass2 = [
    "loudnorm=I=-14.5:TP=-1.5:LRA=8",
    `measured_I=${ln.input_i}`,
    `measured_TP=${ln.input_tp}`,
    `measured_LRA=${ln.input_lra}`,
    `measured_thresh=${ln.input_thresh}`,
    `offset=${ln.target_offset}`,
    "linear=true",
  ].join(":");

  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      tmpRaw,
      "-af",
      `${loudnormPass2},aresample=${SR}`,
      "-ar",
      String(SR),
      "-ac",
      "2",
      "-c:a",
      "pcm_s16le",
      tmpNorm,
    ],
    { encoding: "utf8" }
  );

  // Read back into exact 3,528,000 stereo samples, guarantee bit-clean silence at 73.505s–73.995s, and write canonical RIFF WAV
  const finalBuf = readWavIntoExactBuffer(tmpNorm, TOTAL_SAMPLES);
  for (let i = silenceStart; i < silenceEnd; i++) {
    finalBuf.L[i] = 0;
    finalBuf.R[i] = 0;
  }
  finalBuf.L[0] = 0;
  finalBuf.R[0] = 0;
  finalBuf.L[TOTAL_SAMPLES - 1] = 0;
  finalBuf.R[TOTAL_SAMPLES - 1] = 0;

  const outPath = path.join(OUT_DIR, "score-master-80s.wav");
  writeWavFile(outPath, finalBuf);

  fs.rmSync(tmpRaw, { force: true });
  fs.rmSync(tmpNorm, { force: true });

  let maxAbs = 0;
  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    const m = Math.max(Math.abs(finalBuf.L[i]), Math.abs(finalBuf.R[i]));
    if (m > maxAbs) maxAbs = m;
  }

  return {
    file: "score-master-80s.wav",
    duration: DURATION,
    samples: TOTAL_SAMPLES,
    peakLinear: maxAbs,
    peakDbFS: 20 * Math.log10(Math.max(1e-9, maxAbs)),
  };
}

/* ============================================================================
 * 2. LAPTOP-DIVE.WAV (0.90s — Warm Low-to-High Screen Dive Whoosh + Sub Settle)
 * ========================================================================== */

function generateLaptopDive() {
  const duration = 0.90;
  const buf = createStereoBuffer(duration);
  const rng = createRng(0x44495645);
  const svfL = createSvf();
  const svfR = createSvf();
  const warmLpL = createSvf();
  const warmLpR = createSvf();

  let subPhase = 0;
  let dopplerPhase = 0;

  for (let i = 0; i < buf.length; i++) {
    const t = i / SR;
    const p = t / duration;
    let sL = 0;
    let sR = 0;

    // Part A (0.00s - 0.72s): Warm low-to-high cinematic air whoosh widening across stereo field
    if (t < 0.76) {
      const wp = clamp01(t / 0.72);
      const whooshEnv = smoothstep(t / 0.08) * Math.sin(Math.PI * Math.pow(wp, 0.78));
      const sweepCutoff = 165 + 2950 * Math.pow(wp, 1.75);

      const nL = rng() * 2 - 1;
      const nR = rng() * 2 - 1;
      const bpL = svfL.process(nL, sweepCutoff, 1.55);
      const bpR = svfR.process(nR, sweepCutoff * 1.07, 1.55);

      // Smooth left-to-right-to-center spatial dive trajectory
      const panSweep = Math.sin(TAU * 0.75 * wp) * 0.45;
      const [gL, gR] = panGains(panSweep);

      // Subtle rising harmonic air chord (C3 -> C4 glide)
      const glideHz = 130.81 * Math.pow(2, 1.25 * wp);
      dopplerPhase += (TAU * glideHz) / SR;
      const airChord =
        (Math.sin(dopplerPhase) + 0.45 * Math.sin(dopplerPhase * 1.5)) * 0.16 * whooshEnv;

      sL += (bpL.bp * 0.78 + bpL.lp * 0.28) * whooshEnv * gL * 0.95 + airChord;
      sR += (bpR.bp * 0.78 + bpR.lp * 0.28) * whooshEnv * gR * 0.95 + airChord;
    }

    // Part B (0.48s - 0.90s): Cushioned warm sub settle + delicate C5/G5 lock shimmer
    if (t >= 0.48) {
      const st = t - 0.48;
      const tail = smoothstep((duration - t) / 0.08);
      const subHz = 47 + 58 * Math.exp(-st / 0.055);
      subPhase += (TAU * subHz) / SR;
      const subEnv = smoothstep(st / 0.008) * Math.exp(-st / 0.16) * tail;
      const subBody = Math.tanh((Math.sin(subPhase) + 0.26 * Math.sin(subPhase * 2)) * 1.35) * subEnv * 0.58;

      const lockTone =
        (Math.sin(TAU * mtof(72) * st) + 0.5 * Math.sin(TAU * mtof(79) * st)) *
        smoothstep(st / 0.005) *
        Math.exp(-st / 0.14) *
        tail *
        0.11;

      sL += subBody + lockTone * 0.92;
      sR += subBody + lockTone * 1.08;
    }

    buf.L[i] = warmLpL.process(sL, 5800, 0.707).lp;
    buf.R[i] = warmLpR.process(sR, 5800, 0.707).lp;
  }

  const stats = cleanAndNormalize(buf, 0.60, 0.012, 0.035);
  writeWavFile(path.join(OUT_DIR, "laptop-dive.wav"), buf);
  return { file: "laptop-dive.wav", duration, samples: buf.length, ...stats };
}

/* ============================================================================
 * 3. CHAPTER-CHIME.WAV (0.60s — Crisp Cmaj9 Glass / Rhodes Chapter Turn Chime)
 * ========================================================================== */

function generateChapterChime() {
  const duration = 0.60;
  const buf = createStereoBuffer(duration);

  // Crisp Cmaj9 upper voicing: C5, E5, G5, B5, D6
  const notes = [72, 76, 79, 83, 86];

  notes.forEach((midi, idx) => {
    const f = mtof(midi);
    const onset = 0.004 + idx * 0.017; // Crisp 17ms upward harp/Rhodes roll
    const s0 = Math.round(onset * SR);
    const panPos = -0.44 + (idx / (notes.length - 1)) * 0.88;
    const [gL, gR] = panGains(panPos);

    for (let i = s0; i < buf.length; i++) {
      const t = (i - s0) / SR;
      const tail = smoothstep((duration - i / SR) / 0.075);
      const atk = smoothstep(t / 0.0022);

      // Warm Rhodes body + FM bell-tine (1:7) + crystalline glass 2nd/3rd partial
      const bark = Math.sin(TAU * f * 2 * t) * (0.28 * Math.exp(-t / 0.09));
      const rhodes = Math.sin(TAU * f * t + bark) * Math.exp(-t / 0.25);
      const tine = Math.sin(TAU * f * 7.0 * t) * Math.exp(-t / 0.055) * 0.15;
      const glass = Math.sin(TAU * f * 2.001 * t) * Math.exp(-t / 0.14) * 0.24;
      const mallet = idx === 0 ? Math.sin(TAU * 1650 * t) * Math.exp(-t / 0.004) * 0.16 : 0;

      const sample = (rhodes + tine + glass + mallet) * atk * tail * (0.24 - idx * 0.015);
      buf.L[i] += sample * gL;
      buf.R[i] += sample * gR;
    }
  });

  // Delicate 19ms stereo early-reflection air
  const tap = Math.round(0.019 * SR);
  for (let i = buf.length - 1; i >= tap; i--) {
    buf.L[i] += buf.R[i - tap] * 0.16;
    buf.R[i] += buf.L[i - tap] * 0.14;
  }

  const stats = cleanAndNormalize(buf, 0.58, 0.002, 0.04);
  writeWavFile(path.join(OUT_DIR, "chapter-chime.wav"), buf);
  return { file: "chapter-chime.wav", duration, samples: buf.length, ...stats };
}

/* ============================================================================
 * 4. HALFTONE-BLOOM.WAV (0.70s — Shimmering Granular Mint Dot-Bloom Wash)
 * ========================================================================== */

function generateHalftoneBloom() {
  const duration = 0.70;
  const buf = createStereoBuffer(duration);
  const rng = createRng(0x4d494e54);

  // Mint / Emerald Cmaj9#11 Lydian grain pitch pool (G4, B4, D5, E5, F#5, G5, B5, D6, E6, F#6, G6)
  const grainScale = [67, 71, 74, 76, 78, 79, 83, 86, 88, 90, 91].map(mtof);

  // 32 deterministic micro-enveloped harmonic droplets blooming radially from center -> wide stereo
  const numGrains = 32;
  for (let g = 0; g < numGrains; g++) {
    const progress = g / (numGrains - 1);
    const onset = 0.015 + progress * 0.46 + (rng() - 0.5) * 0.014;
    const gDur = 0.045 + rng() * 0.055;
    const s0 = Math.max(0, Math.round(onset * SR));
    const s1 = Math.min(buf.length, Math.round((onset + gDur) * SR));

    const pitchIdx = Math.min(
      grainScale.length - 1,
      Math.floor(progress * (grainScale.length - 2)) + Math.floor(rng() * 3)
    );
    const f = grainScale[pitchIdx];
    const spread = 0.15 + 0.78 * progress;
    const panPos = (g % 2 === 0 ? -1 : 1) * spread * (0.55 + 0.45 * rng());
    const [gL, gR] = panGains(panPos);
    const vel = (0.16 + 0.10 * Math.sin(Math.PI * progress)) * (0.85 + 0.3 * rng());
    const ph = rng() * TAU;

    for (let i = s0; i < s1; i++) {
      const gt = (i - s0) / Math.max(1, s1 - s0);
      // Smooth raised-cosine Hann grain window (zero clicks!)
      const win = 0.5 - 0.5 * Math.cos(TAU * gt);
      const t = (i - s0) / SR;
      const droplet =
        Math.sin(TAU * f * t + ph + 0.45 * Math.sin(TAU * f * 2 * t)) +
        0.25 * Math.sin(TAU * f * 3 * t);
      buf.L[i] += droplet * win * vel * gL;
      buf.R[i] += droplet * win * vel * gR;
    }
  }

  // Silky bandpass-swept airy mint wash underneath the halftone grains
  const washSvfL = createSvf();
  const washSvfR = createSvf();
  for (let i = 0; i < buf.length; i++) {
    const t = i / SR;
    const p = t / duration;
    const env = smoothstep(t / 0.09) * Math.sin(Math.PI * Math.pow(p, 0.82)) * 0.24;
    const sweepHz = 650 + 3600 * Math.sin(Math.PI * Math.pow(p, 0.75));
    const wL = washSvfL.process(rng() * 2 - 1, sweepHz, 1.65).bp * env;
    const wR = washSvfR.process(rng() * 2 - 1, sweepHz * 1.06, 1.65).bp * env;
    buf.L[i] += wL;
    buf.R[i] += wR;
  }

  // Soft 24ms stereo shimmer diffusion
  const rev = computeStereoReverb(buf.L, buf.R, 0.62, 0.28);
  for (let i = 0; i < buf.length; i++) {
    const tail = smoothstep((duration - i / SR) / 0.08);
    buf.L[i] = (buf.L[i] + rev.L[i] * 1.1) * tail;
    buf.R[i] = (buf.R[i] + rev.R[i] * 1.1) * tail;
  }

  const stats = cleanAndNormalize(buf, 0.58, 0.008, 0.05);
  writeWavFile(path.join(OUT_DIR, "halftone-bloom.wav"), buf);
  return { file: "halftone-bloom.wav", duration, samples: buf.length, ...stats };
}

/* ============================================================================
 * Main Entrypoint
 * ========================================================================== */

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const results = [
    generateScore80s(),
    generateLaptopDive(),
    generateChapterChime(),
    generateHalftoneBloom(),
  ];

  console.log("Walrus Memory 80s Score & Foley Synthesis Complete (44.1 kHz, 16-bit Stereo):");
  console.log("------------------------------------------------------------------------------");
  for (const r of results) {
    console.log(
      `  ${r.file.padEnd(22)} | ${r.duration.toFixed(2).padStart(5)}s | ${String(r.samples).padStart(9)} samples | Peak: ${r.peakLinear.toFixed(4)} (${r.peakDbFS.toFixed(2)} dBFS)`
    );
  }
}

main();
