#!/usr/bin/env node
/**
 * Walrus Memory — Deterministic Pure-Node Audio Synthesizer
 * Generates 44,100 Hz, 16-bit Stereo PCM WAV soundtrack + 6 tactile UI/motion SFX
 * Zero external dependencies, zero network calls, peak ceiling strictly <= -3.0 dBFS.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUT_DIR = path.resolve(__dirname, "../public/audio");

const SAMPLE_RATE = 44100;
const TWO_PI = Math.PI * 2;

/** Deterministic Mulberry32 PRNG so every WAV byte is 100% reproducible */
function createRng(seed = 0x57414c52) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** MIDI note to Hz */
function mtof(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Smooth raised-cosine S-curve [0..1] */
function smoothstep(x) {
  const c = Math.max(0, Math.min(1, x));
  return 0.5 - 0.5 * Math.cos(Math.PI * c);
}

/** Allocate stereo Float64 buffers */
function createStereoBuffer(durationSec) {
  const length = Math.round(durationSec * SAMPLE_RATE);
  return {
    length,
    durationSec,
    left: new Float64Array(length),
    right: new Float64Array(length),
  };
}

/** Equal-power stereo panner (-1 = full left, 0 = center, +1 = full right) */
function panGains(pan) {
  const angle = ((Math.max(-1, Math.min(1, pan)) + 1) * Math.PI) / 4;
  return [Math.cos(angle), Math.sin(angle)];
}

/** Chamberlin 2-pole State Variable Filter (lowpass, bandpass, highpass) */
function createSvf() {
  let low = 0;
  let band = 0;
  return {
    process(input, cutoffHz, q = 0.8) {
      const clampedCutoff = Math.max(20, Math.min(SAMPLE_RATE * 0.42, cutoffHz));
      const f = 2 * Math.sin((Math.PI * clampedCutoff) / SAMPLE_RATE);
      const damp = Math.min(1.95, 1 / Math.max(0.5, q));
      low += f * band;
      const high = input - low - damp * band;
      band += f * high;
      return { low, band, high };
    },
  };
}

/** Remove DC offset, apply micro edge de-click, and normalize peak to targetPeak */
function finalizeAndNormalize(buf, targetPeak, fadeInSec = 0.003, fadeOutSec = 0.008) {
  const { left, right, length } = buf;

  // High-pass DC blocker (R = 0.9995 -> ~3.5 Hz cutoff)
  let xL1 = 0,
    yL1 = 0,
    xR1 = 0,
    yR1 = 0;
  for (let i = 0; i < length; i++) {
    const xL = left[i];
    const yL = xL - xL1 + 0.9995 * yL1;
    xL1 = xL;
    yL1 = yL;
    left[i] = yL;

    const xR = right[i];
    const yR = xR - xR1 + 0.9995 * yR1;
    xR1 = xR;
    yR1 = yR;
    right[i] = yR;
  }

  // Smooth boundary fades to guarantee zero start/end sample clicks
  const fadeInSamples = Math.min(length, Math.max(16, Math.round(fadeInSec * SAMPLE_RATE)));
  const fadeOutSamples = Math.min(length, Math.max(16, Math.round(fadeOutSec * SAMPLE_RATE)));

  for (let i = 0; i < fadeInSamples; i++) {
    const g = smoothstep(i / fadeInSamples);
    left[i] *= g;
    right[i] *= g;
  }
  for (let i = 0; i < fadeOutSamples; i++) {
    const idx = length - 1 - i;
    const g = smoothstep(i / fadeOutSamples);
    left[idx] *= g;
    right[idx] *= g;
  }
  left[0] = 0;
  right[0] = 0;
  left[length - 1] = 0;
  right[length - 1] = 0;

  // Measure peak & normalize strictly to targetPeak (never exceeding -3 dBFS / 0.707)
  const safeCeiling = Math.min(targetPeak, 0.705);
  let maxAbs = 0;
  for (let i = 0; i < length; i++) {
    const aL = Math.abs(left[i]);
    const aR = Math.abs(right[i]);
    if (aL > maxAbs) maxAbs = aL;
    if (aR > maxAbs) maxAbs = aR;
  }

  const gain = maxAbs > 1e-9 ? safeCeiling / maxAbs : 0;
  let finalPeak = 0;
  for (let i = 0; i < length; i++) {
    left[i] *= gain;
    right[i] *= gain;
    const m = Math.max(Math.abs(left[i]), Math.abs(right[i]));
    if (m > finalPeak) finalPeak = m;
  }

  return {
    peakLinear: finalPeak,
    peakDbFS: 20 * Math.log10(Math.max(1e-9, finalPeak)),
  };
}

/** Encode stereo Float64 buffer as 44.1kHz 16-bit PCM RIFF WAV */
function writeWavFile(filePath, buf) {
  const numChannels = 2;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = SAMPLE_RATE * blockAlign;
  const dataSize = buf.length * blockAlign;
  const fileBuffer = Buffer.alloc(44 + dataSize);

  fileBuffer.write("RIFF", 0);
  fileBuffer.writeUInt32LE(36 + dataSize, 4);
  fileBuffer.write("WAVE", 8);
  fileBuffer.write("fmt ", 12);
  fileBuffer.writeUInt32LE(16, 16); // PCM header chunk size
  fileBuffer.writeUInt16LE(1, 20); // AudioFormat = 1 (PCM)
  fileBuffer.writeUInt16LE(numChannels, 22);
  fileBuffer.writeUInt32LE(SAMPLE_RATE, 24);
  fileBuffer.writeUInt32LE(byteRate, 28);
  fileBuffer.writeUInt16LE(blockAlign, 32);
  fileBuffer.writeUInt16LE(bitsPerSample, 34);
  fileBuffer.write("data", 36);
  fileBuffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < buf.length; i++) {
    const sL = Math.max(-1, Math.min(1, buf.left[i]));
    const sR = Math.max(-1, Math.min(1, buf.right[i]));
    fileBuffer.writeInt16LE(Math.round(sL * 32767), offset);
    fileBuffer.writeInt16LE(Math.round(sR * 32767), offset + 2);
    offset += 4;
  }

  fs.writeFileSync(filePath, fileBuffer);
}

/* ============================================================================
 * 1. SOUNDTRACK.WAV (42.5s @ 96 BPM — Warm Fable/Linear Minimal Electronic Bed)
 *    Progression: Cmaj9 -> Am9 -> Fmaj7(add9) -> G6
 *    Peak normalized to 0.28 (-11.06 dBFS) with 1.2s fade-in and 2.2s fade-out
 * ========================================================================== */
function generateSoundtrack() {
  const duration = 42.5;
  const buf = createStereoBuffer(duration);
  const rng = createRng(0x20261101);

  const bpm = 96;
  const beatSec = 60 / bpm; // 0.625s
  const barSec = beatSec * 4; // 2.50s -> 17 bars = 42.5s exact!

  const chords = [
    // Cmaj9: C3, E3, G3, B3, D4 | Sub C2 | Shimmer E5, G5, B5, D6
    {
      notes: [48, 52, 55, 59, 62],
      sub: 36,
      shimmer: [76, 79, 83, 86],
    },
    // Am9: A2, C3, E3, G3, B3 | Sub A1 | Shimmer C5, E5, G5, B5
    {
      notes: [45, 48, 52, 55, 59],
      sub: 33,
      shimmer: [72, 76, 79, 83],
    },
    // Fmaj7(add9): F2, A2, C3, E3, G3 | Sub F1 | Shimmer A4, C5, E5, G5
    {
      notes: [41, 45, 48, 52, 55],
      sub: 29,
      shimmer: [69, 72, 76, 79],
    },
    // G6: G2, B2, D3, E3, A3 | Sub G1 | Shimmer B4, D5, E5, A5
    {
      notes: [43, 47, 50, 52, 57],
      sub: 31,
      shimmer: [71, 74, 76, 81],
    },
  ];

  // Add Warm Rhodes + Pad voices per bar (17 bars covers 0.0s .. 42.5s)
  const totalBars = 17;
  for (let bar = 0; bar < totalBars; bar++) {
    const chord = chords[bar % chords.length];
    const barStart = bar * barSec;
    const noteDur = barSec + 0.45; // slight lush overlap across barlines

    // Subtle dynamic swell across narrative chapters (warmer in intro, fuller in Eval & Bloom)
    const chapterLift =
      bar >= 10 && bar <= 15 ? 1.15 : bar === 0 || bar === 16 ? 0.88 : 1.0;

    // 1A. Warm Fender Rhodes + Velvet Pad voices
    chord.notes.forEach((midi, idx) => {
      const freq = mtof(midi);
      const pan = -0.45 + (idx / (chord.notes.length - 1)) * 0.9;
      const [gL, gR] = panGains(pan);
      const startSample = Math.round((barStart + idx * 0.018) * SAMPLE_RATE); // gentle human strum
      const endSample = Math.min(
        buf.length,
        startSample + Math.round(noteDur * SAMPLE_RATE)
      );

      const detuneRatioL = Math.pow(2, -3.5 / 1200);
      const detuneRatioR = Math.pow(2, 3.5 / 1200);
      const phaseOffset = rng() * TWO_PI;

      for (let i = startSample; i < endSample; i++) {
        const t = (i - startSample) / SAMPLE_RATE;
        const attack = 1 - Math.exp(-t / 0.028);
        const release =
          t > barSec - 0.12
            ? Math.exp(-(t - (barSec - 0.12)) / 0.24)
            : 1.0;

        // Rhodes electric piano tine + warm fundamental body
        const tineEnv = Math.exp(-t / 0.19) * 0.22;
        const bodyEnv = Math.exp(-t / 2.4) * 0.72 + 0.28;
        const mod = Math.sin(TWO_PI * freq * 2.0 * t) * (0.35 * Math.exp(-t / 0.35));
        const rhodes =
          Math.sin(TWO_PI * freq * t + mod + phaseOffset) * bodyEnv +
          Math.sin(TWO_PI * freq * 3.0 * t) * tineEnv * 0.35;

        // Velvet detuned warm pad layer
        const padEnv = smoothstep(t / 0.45) * release;
        const padL = Math.sin(TWO_PI * freq * detuneRatioL * t + phaseOffset) * padEnv;
        const padR = Math.sin(TWO_PI * freq * detuneRatioR * t + phaseOffset + 0.4) * padEnv;

        const voiceGain = 0.115 * chapterLift * attack * release;
        buf.left[i] += (rhodes * 0.65 * gL + padL * 0.48) * voiceGain;
        buf.right[i] += (rhodes * 0.65 * gR + padR * 0.48) * voiceGain;
      }
    });

    // 1B. Gentle Sub-Bass Pulse @ 96 BPM (dotted groove: beat 0, beat 1.5, beat 3.0)
    const subHits = [
      { beat: 0.0, dur: 0.82, vel: 1.0 },
      { beat: 1.5, dur: 0.72, vel: 0.78 },
      { beat: 2.5, dur: 0.55, vel: 0.62 },
      { beat: 3.0, dur: 0.75, vel: 0.82 },
    ];
    const subFreq = mtof(chord.sub);
    for (const hit of subHits) {
      // Skip heavy pulse on the final outro bar so chord breathes cleanly out
      if (bar === totalBars - 1 && hit.beat > 0) continue;
      const hitStart = Math.round((barStart + hit.beat * beatSec) * SAMPLE_RATE);
      const hitEnd = Math.min(
        buf.length,
        hitStart + Math.round(hit.dur * SAMPLE_RATE)
      );
      for (let i = hitStart; i < hitEnd; i++) {
        const t = (i - hitStart) / SAMPLE_RATE;
        const env =
          smoothstep(t / 0.016) *
          Math.exp(-t / (hit.dur * 0.58)) *
          smoothstep((hit.dur - t) / 0.04);
        // Subtle pitch settle on attack for tactile Linear warmth
        const pitchBend = 1 + 0.08 * Math.exp(-t / 0.025);
        const subRaw =
          Math.sin(TWO_PI * subFreq * pitchBend * t) +
          0.26 * Math.sin(TWO_PI * subFreq * 2 * t);
        const subSample = Math.tanh(subRaw * 1.25) * 0.19 * hit.vel * chapterLift * env;
        buf.left[i] += subSample;
        buf.right[i] += subSample;
      }
    }

    // 1C. Airy Shimmer Eighth-Note Harmonics (delicate glass pulse in background)
    for (let step = 0; step < 8; step++) {
      if (bar === 0 && step < 2) continue;
      const noteMidi = chord.shimmer[(step + bar) % chord.shimmer.length];
      const sFreq = mtof(noteMidi);
      const stepTime = barStart + step * (beatSec * 0.5);
      const sStart = Math.round(stepTime * SAMPLE_RATE);
      const sDur = 0.42;
      const sEnd = Math.min(buf.length, sStart + Math.round(sDur * SAMPLE_RATE));
      const pan = ((step % 2 === 0 ? -1 : 1) * 0.52);
      const [gL, gR] = panGains(pan);
      const vel = step % 2 === 0 ? 0.032 : 0.021;

      for (let i = sStart; i < sEnd; i++) {
        const t = (i - sStart) / SAMPLE_RATE;
        const env = smoothstep(t / 0.008) * Math.exp(-t / 0.14);
        const bell =
          Math.sin(TWO_PI * sFreq * t) +
          0.25 * Math.sin(TWO_PI * sFreq * 2.0 * t) * Math.exp(-t / 0.05);
        buf.left[i] += bell * vel * chapterLift * env * gL;
        buf.right[i] += bell * vel * chapterLift * env * gR;
      }
    }
  }

  // Soft Stereo eighth-note ping-pong ambience + Warm Low-Pass Filtering
  const delaySamples = Math.round(beatSec * 0.5 * SAMPLE_RATE);
  const svfL = createSvf();
  const svfR = createSvf();
  for (let i = 0; i < buf.length; i++) {
    const sec = i / SAMPLE_RATE;
    if (i >= delaySamples) {
      buf.left[i] += buf.right[i - delaySamples] * 0.14;
      buf.right[i] += buf.left[i - delaySamples] * 0.14;
    }
    // Gentle filter breathing from 1150 Hz -> 1850 Hz across chapters
    const filterCutoff =
      1250 +
      420 * Math.sin((TWO_PI * sec) / 10.0) +
      (sec > 24.0 && sec < 38.0 ? 350 : 0);
    buf.left[i] = svfL.process(buf.left[i], filterCutoff, 0.72).low;
    buf.right[i] = svfR.process(buf.right[i], filterCutoff, 0.72).low;
  }

  // Normalize to -11.06 dBFS (0.28 linear) with requested 1.2s fade-in and 2.2s fade-out
  const stats = finalizeAndNormalize(buf, 0.28, 1.2, 2.2);
  const outPath = path.join(OUT_DIR, "soundtrack.wav");
  writeWavFile(outPath, buf);
  return { file: "soundtrack.wav", duration, ...stats };
}

/* ============================================================================
 * 2. SKY-BREEZE.WAV (1.6s — Airy Filtered Breeze + Crystalline Bell Harmonic)
 * ========================================================================== */
function generateSkyBreeze() {
  const duration = 1.6;
  const buf = createStereoBuffer(duration);
  const rng = createRng(0x534b5931);

  const svfL = createSvf();
  const svfR = createSvf();

  // Crystalline Cmaj9 harmonic partials (G5, B5, D6, E6)
  const bellNotes = [79, 83, 86, 88].map(mtof);

  for (let i = 0; i < buf.length; i++) {
    const t = i / SAMPLE_RATE;
    const progress = t / duration;

    // Smooth airy breeze envelope
    const breezeEnv =
      smoothstep(t / 0.32) * smoothstep((duration - t) / 0.55) * 0.42;
    const sweepHz = 420 + 780 * Math.sin(Math.PI * Math.pow(progress, 0.85));

    const whiteL = rng() * 2 - 1;
    const whiteR = rng() * 2 - 1;
    const fL = svfL.process(whiteL, sweepHz, 1.35);
    const fR = svfR.process(whiteR, sweepHz * 1.04, 1.35);

    let sampleL = (fL.band * 0.7 + fL.low * 0.3) * breezeEnv;
    let sampleR = (fR.band * 0.7 + fR.low * 0.3) * breezeEnv;

    // Delicate crystalline bell shimmer blooming at 0.14s
    if (t >= 0.12) {
      const bt = t - 0.12;
      bellNotes.forEach((freq, idx) => {
        const noteDelay = idx * 0.045;
        if (bt >= noteDelay) {
          const nt = bt - noteDelay;
          const env =
            smoothstep(nt / 0.018) *
            Math.exp(-nt / 0.52) *
            smoothstep((duration - t) / 0.18);
          const pan = -0.4 + idx * 0.27;
          const [gL, gR] = panGains(pan);
          const tone =
            Math.sin(TWO_PI * freq * nt) +
            0.22 * Math.sin(TWO_PI * freq * 2.002 * nt) * Math.exp(-nt / 0.18);
          sampleL += tone * env * 0.16 * gL;
          sampleR += tone * env * 0.16 * gR;
        }
      });
    }

    buf.left[i] = sampleL;
    buf.right[i] = sampleR;
  }

  const stats = finalizeAndNormalize(buf, 0.52, 0.04, 0.12);
  writeWavFile(path.join(OUT_DIR, "sky-breeze.wav"), buf);
  return { file: "sky-breeze.wav", duration, ...stats };
}

/* ============================================================================
 * 3. COLLAPSE-IMPACT.WAV (1.4s — Reverse Whoosh 0.0–0.65s -> Sub-Drop + Chime @ 0.65s)
 * ========================================================================== */
function generateCollapseImpact() {
  const duration = 1.4;
  const hitTime = 0.65;
  const buf = createStereoBuffer(duration);
  const rng = createRng(0x434f4c50);

  const svfL = createSvf();
  const svfR = createSvf();

  // Emerald chime harmonics on impact (E5, B5, F#6, G6)
  const chimeFreqs = [mtof(76), mtof(83), mtof(90), mtof(91)];
  let subPhase = 0;
  let riserPhase = 0;

  for (let i = 0; i < buf.length; i++) {
    const t = i / SAMPLE_RATE;
    let sL = 0;
    let sR = 0;

    // Phase 1 (0.00s - 0.65s): Reverse vacuum whoosh + magnetic pull riser
    if (t < hitTime) {
      const p = t / hitTime; // 0 -> 1
      const expBuild = Math.pow(p, 2.6) * smoothstep(t / 0.05);
      // 12ms micro-tightening right before 0.65s makes the sub-drop transient pop cleanly
      const preDropTighten = p > 0.96 ? smoothstep((1 - p) / 0.04) * 0.65 + 0.35 : 1.0;

      const cutoff = 180 + 2900 * Math.pow(p, 2.2);
      const nL = svfL.process(rng() * 2 - 1, cutoff, 1.8).band;
      const nR = svfR.process(rng() * 2 - 1, cutoff * 1.06, 1.8).band;

      // Stereo narrowing as cards implode radially toward center!
      const width = 1 - 0.75 * p;
      const mid = (nL + nR) * 0.5;
      const side = (nL - nR) * 0.5 * width;

      const riserFreq = 95 + 310 * Math.pow(p, 2.4);
      riserPhase += (TWO_PI * riserFreq) / SAMPLE_RATE;
      const riserTone = Math.sin(riserPhase) * 0.35 * expBuild;

      sL += ((mid + side) * 0.85 * expBuild + riserTone) * preDropTighten;
      sR += ((mid - side) * 0.85 * expBuild + riserTone) * preDropTighten;
    }

    // Phase 2 (0.65s - 1.40s): Tight warm sub-drop + Emerald chime transient
    if (t >= hitTime) {
      const dt = t - hitTime;
      const tailFade = smoothstep((duration - t) / 0.09);

      // Pitch-dropping warm sub impact (142 Hz -> 43 Hz)
      const subFreq = 43 + 99 * Math.exp(-dt / 0.048);
      subPhase += (TWO_PI * subFreq) / SAMPLE_RATE;
      const subEnv = smoothstep(dt / 0.0025) * Math.exp(-dt / 0.24) * tailFade;
      const subBody = Math.tanh(
        (Math.sin(subPhase) + 0.28 * Math.sin(subPhase * 2)) * 1.45
      );

      // Soft punch transient body (filtered mid-snap, zero harsh clipping)
      const punchEnv = Math.exp(-dt / 0.016);
      const punch = Math.sin(TWO_PI * 240 * dt) * punchEnv * 0.32;

      sL += subBody * subEnv * 0.72 + punch;
      sR += subBody * subEnv * 0.72 + punch;

      // Luminous Emerald Chime chord
      chimeFreqs.forEach((f, idx) => {
        const pan = -0.36 + idx * 0.24;
        const [gL, gR] = panGains(pan);
        const cEnv =
          smoothstep(dt / 0.003) *
          Math.exp(-dt / (0.34 - idx * 0.04)) *
          tailFade;
        const tone =
          Math.sin(TWO_PI * f * dt) +
          0.18 * Math.sin(TWO_PI * f * 2.0 * dt) * Math.exp(-dt / 0.08);
        sL += tone * cEnv * 0.14 * gL;
        sR += tone * cEnv * 0.14 * gR;
      });
    }

    buf.left[i] = sL;
    buf.right[i] = sR;
  }

  const stats = finalizeAndNormalize(buf, 0.66, 0.015, 0.06);
  writeWavFile(path.join(OUT_DIR, "collapse-impact.wav"), buf);
  return { file: "collapse-impact.wav", duration, ...stats };
}

/* ============================================================================
 * 4. CLICK-CRISP.WAV (0.25s — Tactile Mechanical macOS Pointer Click Transient)
 * ========================================================================== */
function generateClickCrisp() {
  const duration = 0.25;
  const buf = createStereoBuffer(duration);
  const rng = createRng(0x434c4b31);
  const svf = createSvf();

  for (let i = 0; i < buf.length; i++) {
    const t = i / SAMPLE_RATE;
    let mono = 0;

    // Primary switch actuation at t = 0.003s
    if (t >= 0.003) {
      const ct = t - 0.003;
      const bodyPitch = 1850 * Math.exp(-ct / 0.007) + 420;
      const clickTone =
        Math.sin(TWO_PI * bodyPitch * ct) * Math.exp(-ct / 0.0085) * 0.68 +
        Math.sin(TWO_PI * 3650 * ct) * Math.exp(-ct / 0.0032) * 0.32;
      const noiseBurst =
        svf.process(rng() * 2 - 1, 2900, 2.1).band * Math.exp(-ct / 0.0045) * 0.42;
      mono += clickTone + noiseBurst;
    }

    // Subtle mechanical micro-release detent at t = 0.046s
    if (t >= 0.046) {
      const rt = t - 0.046;
      const relTone =
        Math.sin(TWO_PI * 1420 * rt) * Math.exp(-rt / 0.006) * 0.21 +
        Math.sin(TWO_PI * 2680 * rt) * Math.exp(-rt / 0.0025) * 0.1;
      mono += relTone;
    }

    // Subtle stereo micro-air
    buf.left[i] = mono * 0.98;
    buf.right[i] = mono * 1.02;
  }

  const stats = finalizeAndNormalize(buf, 0.55, 0.001, 0.02);
  writeWavFile(path.join(OUT_DIR, "click-crisp.wav"), buf);
  return { file: "click-crisp.wav", duration, ...stats };
}

/* ============================================================================
 * 5. KEY-TICK.WAV (0.12s — Soft Subtle Mechanical Keycap Tick / Lubed Switch)
 * ========================================================================== */
function generateKeyTick() {
  const duration = 0.12;
  const buf = createStereoBuffer(duration);
  const rng = createRng(0x4b455954);
  const svf = createSvf();

  let thockPhase = 0;
  for (let i = 0; i < buf.length; i++) {
    const t = i / SAMPLE_RATE;
    if (t >= 0.002) {
      const kt = t - 0.002;
      // Warm PBT keycap thock body (340 Hz -> 165 Hz)
      const thockFreq = 165 + 185 * Math.exp(-kt / 0.009);
      thockPhase += (TWO_PI * thockFreq) / SAMPLE_RATE;
      const thock = Math.sin(thockPhase) * Math.exp(-kt / 0.015) * 0.65;

      // Soft dampened switch stem tap
      const tap =
        svf.process(rng() * 2 - 1, 2150, 1.7).band * Math.exp(-kt / 0.005) * 0.45 +
        Math.sin(TWO_PI * 1950 * kt) * Math.exp(-kt / 0.004) * 0.22;

      const s = thock + tap;
      buf.left[i] = s * 1.02;
      buf.right[i] = s * 0.98;
    }
  }

  const stats = finalizeAndNormalize(buf, 0.42, 0.001, 0.015);
  writeWavFile(path.join(OUT_DIR, "key-tick.wav"), buf);
  return { file: "key-tick.wav", duration, ...stats };
}

/* ============================================================================
 * 6. WHEEL-TICK.WAV (0.22s — Clean Marimba / Glass Detented Slot Roll Tick)
 * ========================================================================== */
function generateWheelTick() {
  const duration = 0.22;
  const buf = createStereoBuffer(duration);

  // Rosewood marimba bar harmonic ratio (1 : 3.99) + delicate glass octave
  const f0 = mtof(79); // G5 = 783.99 Hz
  const fBar = f0 * 3.98;
  const fGlass = mtof(86); // D6 fifth harmonic sheen

  for (let i = 0; i < buf.length; i++) {
    const t = i / SAMPLE_RATE;
    if (t >= 0.002) {
      const wt = t - 0.002;
      const attack = smoothstep(wt / 0.0018);
      const marimba =
        Math.sin(TWO_PI * f0 * wt) * Math.exp(-wt / 0.048) * 0.72 +
        Math.sin(TWO_PI * fBar * wt) * Math.exp(-wt / 0.011) * 0.28 +
        Math.sin(TWO_PI * fGlass * wt) * Math.exp(-wt / 0.032) * 0.16;

      // Tiny wooden mallet transient
      const mallet = Math.sin(TWO_PI * 1240 * wt) * Math.exp(-wt / 0.0035) * 0.18;
      const out = (marimba + mallet) * attack;

      buf.left[i] = out * 0.96;
      buf.right[i] = out * 1.04;
    }
  }

  // Subtle 14ms stereo room reflection
  const roomDelay = Math.round(0.014 * SAMPLE_RATE);
  for (let i = buf.length - 1; i >= roomDelay; i--) {
    buf.left[i] += buf.right[i - roomDelay] * 0.12;
    buf.right[i] += buf.left[i - roomDelay] * 0.09;
  }

  const stats = finalizeAndNormalize(buf, 0.48, 0.001, 0.025);
  writeWavFile(path.join(OUT_DIR, "wheel-tick.wav"), buf);
  return { file: "wheel-tick.wav", duration, ...stats };
}

/* ============================================================================
 * 7. BLOOM-REVEAL.WAV (1.8s — Lush Rising Emerald Chord Swell + Sparkle)
 * ========================================================================== */
function generateBloomReveal() {
  const duration = 1.8;
  const buf = createStereoBuffer(duration);
  const rng = createRng(0x424c4f4d);

  // Lush Em9 / Cmaj9#11 Emerald Reveal Voicing: C3, G3, B3, D4, E4, F#4, B4, E5
  const chordFreqs = [48, 55, 59, 62, 64, 66, 71, 76].map(mtof);
  // Ascending sparkle notes (G5, B5, D6, F#6, G6, B6)
  const sparkleNotes = [79, 83, 86, 90, 91, 95].map(mtof);

  const svfL = createSvf();
  const svfR = createSvf();

  for (let i = 0; i < buf.length; i++) {
    const t = i / SAMPLE_RATE;
    const p = t / duration;

    // Lush bloom swell peaking around 0.62s then floating smoothly to 1.8s
    const swellEnv =
      smoothstep(t / 0.28) *
      Math.exp(-Math.max(0, t - 0.38) / 0.78) *
      smoothstep((duration - t) / 0.24);

    let padL = 0;
    let padR = 0;
    chordFreqs.forEach((f, idx) => {
      const pan = -0.6 + (idx / (chordFreqs.length - 1)) * 1.2;
      const [gL, gR] = panGains(pan);
      // Slight gentle upward pitch-bloom settle in first 120ms
      const glide = 1 - 0.012 * Math.exp(-t / 0.09);
      const vL =
        Math.sin(TWO_PI * f * glide * 0.9985 * t + idx * 0.7) +
        0.3 * Math.sin(TWO_PI * f * 2 * glide * t);
      const vR =
        Math.sin(TWO_PI * f * glide * 1.0015 * t + idx * 0.7 + 0.35) +
        0.3 * Math.sin(TWO_PI * f * 2 * glide * t + 0.2);
      padL += vL * gL * 0.14;
      padR += vR * gR * 0.14;
    });

    // Rising filter sweep (340 Hz -> 3600 Hz)
    const sweepCutoff = 340 + 3260 * smoothstep(Math.min(1, t / 0.72));
    const airL = (rng() * 2 - 1) * 0.05 * swellEnv;
    const airR = (rng() * 2 - 1) * 0.05 * swellEnv;

    let outL = svfL.process(padL * swellEnv + airL, sweepCutoff, 0.92).low;
    let outR = svfR.process(padR * swellEnv + airR, sweepCutoff * 1.03, 0.92).low;

    // Crystalline sparkle arpeggio (0.14s .. 0.74s)
    sparkleNotes.forEach((sf, idx) => {
      const onset = 0.14 + idx * 0.075;
      if (t >= onset) {
        const st = t - onset;
        const sEnv =
          smoothstep(st / 0.006) *
          Math.exp(-st / 0.32) *
          smoothstep((duration - t) / 0.14);
        const pan = (idx % 2 === 0 ? -1 : 1) * (0.25 + idx * 0.08);
        const [gL, gR] = panGains(pan);
        const chime =
          Math.sin(TWO_PI * sf * st) +
          0.24 * Math.sin(TWO_PI * sf * 2 * st) * Math.exp(-st / 0.09);
        outL += chime * sEnv * 0.095 * gL;
        outR += chime * sEnv * 0.095 * gR;
      }
    });

    buf.left[i] = outL;
    buf.right[i] = outR;
  }

  const stats = finalizeAndNormalize(buf, 0.62, 0.02, 0.12);
  writeWavFile(path.join(OUT_DIR, "bloom-reveal.wav"), buf);
  return { file: "bloom-reveal.wav", duration, ...stats };
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const results = [
    generateSoundtrack(),
    generateSkyBreeze(),
    generateCollapseImpact(),
    generateClickCrisp(),
    generateKeyTick(),
    generateWheelTick(),
    generateBloomReveal(),
  ];

  console.log("Walrus Memory Audio Synthesis Complete (44.1kHz, 16-bit Stereo PCM):");
  console.log("--------------------------------------------------------------------");
  for (const r of results) {
    console.log(
      `  ${r.file.padEnd(22)} | ${r.duration.toFixed(2).padStart(5)}s | Peak: ${r.peakLinear.toFixed(4)} (${r.peakDbFS.toFixed(2)} dBFS)`
    );
  }
}

main();
