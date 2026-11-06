# Walrus Memory Music Architecture and Suno Briefs (`music.md`)

**Tempo & Grid**: `120 BPM` (`4/4` time, `1 beat = 0.50s = 15 frames @ 30fps`, `1 bar = 2.00s = 60 frames @ 30fps`)  
**Total Master Length**: `80.00s` (`2400 frames = 40.00 bars`)  
**Vocal Policy**: `100% Instrumental` (`Instrumental = ON`, zero vocals, zero spoken word, zero vocal chops)  
**Loudness Target**: Integrated `-14.0 +/- 1.0 LUFS`, True Peak `<= -1.0 dBTP` (score stem peak normalized to `-10.5 dBFS` so tactile UI clicks and callout pops sit cleanly in the `1..4 kHz` midrange pocket without pumping or clipping).

## 1. Harmonic Progression and 40-Bar Section Map

The score follows a warm four-bar harmonic cycle (`8.00s = 240 frames` per cycle) in C major / A Dorian warmth:

* **Bar 1**: `Cmaj9` (`C2` root; `C3, E3, G3, B3, D4`)
* **Bar 2**: `Am9` (`A1` root; `A2, C3, E3, G3, B3`)
* **Bar 3**: `Fmaj7(add9)` (`F1` root; `F2, A2, C3, E3, G3`)
* **Bar 4**: `G6(sus4)` (`G1` root; `G2, B2, C3, E3, A3`)

| Musical Section | Global Frames (`30fps`) | Time (`s`) | Elapsed Bars (`120 BPM`) | Covered Scenes | Arrangement & Energy Curve |
| :--- | :---: | :---: | :---: | :--- | :--- |
| **1. Intro & Swell** | `0..180` | `0.00s..6.00s` | `0.00..3.00` | Scene 1 (`CloudSky` Hook) + Scene 2 pre-collapse (`f=150..179`) | Low-passed felt Rhodes + delicate glass marimba harmonics opening from `600 Hz` to `2.4 kHz`; `0.75s` reverse atmospheric swell (`f=158..180`) pulling directly into the brand mark impact. |
| **2. Drop A (Recall Groove)** | `180..960` | `6.00s..32.00s` | `3.00..16.00` | Scene 2 Lockup (`f=180`), Scene 3 Composer + MacBook Dive, Scene 4 Ch 01 Card, Scene 5 Live Recall | Tight warm sub-bass + crisp dry pocket rim/kick groove enters on `f=180` (`WalrusLogo3D` lockup). Subtle filter lift at `f=450` (Send press -> MacBook bezel dive) and bright harmonic shimmer at `f=754..815` (`Run Live Recall` -> recalled rule banner). |
| **3. Breakdown & Riser** | `960..1470` | `32.00s..49.00s` | `16.00..24.50` | Scene 6 Ch 02 `PunchLines`, Scene 7 Side-by-Side Compare, Scene 8 Ch 03 `WordGather` | Kick drops out at `f=960` leaving warm Rhodes voicings, soft brushed shaker, and sub sustain so the `Without MemWal` vs `With MemWal` A/B cards read with calm clarity. Filtered synth riser builds across `f=1380..1470` (`dotBloom` -> Ch 03 card). |
| **4. Drop B (Graph & Agents)** | `1470..2205` | `49.00s..73.50s` | `24.50..36.75` | Scene 9 `Skills (14)` + `SkillForceGraph`, Scene 10 `CheckCycle`, Scene 11 `Connect` (`4 IDEs`) | Full groove returns on `f=1470` (`49.00s`) with an octave emerald bell/arp layer illuminating the 14-skill force graph and stepping cleanly across `Claude Code`, `Cursor`, `Codex`, and `Antigravity`. |
| **5. Mandatory 1-Beat Silence** | `2205..2220` | `73.50s..74.00s` | `36.75..37.00` | Final beat of Scene 11 before End Card | Complete `15-frame` (`0.50s`) musical cut to silence (`-inf dBFS` with `6ms` raised-cosine de-click) creating crisp contrast right before the End Card downbeat. |
| **6. Outro Resolution** | `2220..2400` | `74.00s..80.00s` | `37.00..40.00` | Scene 12 End Card (`WalrusLogo3D` + CLI + Docs URL) | Warm resolved `Cmaj9` Rhodes chord + soft sub-root bloom lands squarely on `f=2220` (`74.00s`) and decays naturally to `-inf dBFS` by `f=2400` (`80.00s`). |

## 2. Three Paste-Ready Suno `[Instrumental]` Prompts (`< 500` Characters Each)

Set **Instrumental = ON** in Suno before generating. Trim or time-align the exported `.wav` so **Drop A** lands on `6.00s` (`f=180`), **Drop B** lands on `49.00s` (`f=1470`), `73.50s..74.00s` (`f=2205..2220`) is muted via raised-cosine envelope, and the **Outro** chord resolves across `74.00s..80.00s`.

### Variant A: Warm Felt Rhodes & Crisp Breakbeat (Primary Recommendation)

> `[Instrumental] 120 BPM warm minimal electronic developer product film score, 80 seconds. Airy felt Fender Rhodes playing Cmaj9 Am9 Fmaj7 G6, deep clean sub bass, tight dry rimshot and soft kick pocket groove. Gentle intro swell drops into crisp groove at 0:06, calm spacious Rhodes breakdown at 0:32, luminous synth bell lift at 0:49, clean resolved Cmaj9 chord tail at 1:14 to 1:20. No vocals, spacious midrange.`

*Character count*: `414 characters` (`< 500` limit).

### Variant B: Minimal Glassy Electronic & Marimba Pulse

> `[Instrumental] 120 BPM minimal glassy electronic and warm marimba groove for a software design film, 80 seconds. Delicate mallet arpeggios, warm analog low-pass pad, round Moog bassline, subtle brushed percussion. Soft atmospheric opening drops at 0:06, intimate pad breakdown at 0:32, bright harmonic lift at 0:49, single warm resolved chord ringout from 1:14 to 1:20. Zero vocals, zero harsh highs.`

*Character count*: `400 characters` (`< 500` limit).

### Variant C: Precision Analog Synth & Warm Sub-Bass

> `[Instrumental] 120 BPM precision warm analog synthwave and clean downtempo house score, 80 seconds. Silky Prophet polysynth chords in C major, tight muted pluck ostinato, clean sub pulse, crisp minimal percussion. Filter opens from 0:00 into groove drop at 0:06, stripped half-time breather at 0:32, uplifting second drop at 0:49, gentle warm chord decay at 1:14 to 1:20. Instrumental only, no vocals.`

*Character count*: `397 characters` (`< 500` limit).

## 3. Deterministic Local Score Synthesis Fallback (`score-80s.wav`)

Until a Suno master stem is placed in `video/public/audio/`, `video/scripts/generate-score.mjs` (extended for the `80.00s` / `2400-frame` cut) synthesizes `video/public/audio/score-80s.wav` deterministically in pure Node.js (`44,100 Hz`, `16-bit PCM` stereo, seeded Mulberry32 PRNG, Chamberlin SVF low-pass filter, sidechain kick ducking, and `4ms` raised-cosine boundary fades):

* `at = { drop: 180, breakdown: 960, drop2: 1470, silenceStart: 2205, end: 2220, totalFrames: 2400 }`
* Enforces exact zero-amplitude silence across `f=2205..2220` (`73.50s..74.00s`) with `8ms` cosine fade-out before `f=2205` and clean chord attack on `f=2220`.
* Never emits a metronome click track or raw unshaped sine beeps.
