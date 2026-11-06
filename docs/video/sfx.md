# Walrus Memory Frame-Accurate SFX Cue Sheet (`sfx.md`)

**Frame Rate & Grid**: `30 fps`, `2400 frames` (`80.00s`), `120 BPM` (`1 beat = 15f = 0.50s`, `1 bar = 60f = 2.00s`)  
**Sample Format**: `44,100 Hz`, `16-bit PCM` stereo WAV (`video/public/audio/*.wav`), mixed to `48,000 Hz` stereo AAC in final MP4  
**Master Loudness Spec**: Integrated `-14.0 +/- 1.0 LUFS`, True Peak `<= -1.0 dBTP`, `0` clipped samples (`max_volume <= -1.0 dB`).

## 1. Three-Layer Audio Architecture & Headroom Discipline

1. **Layer 1: Harmonic Score Bed (`score-80s.wav`)**
   * Runs `f=0..2400` at `volume=0.60` (`-10.5 dBFS` stem peak), muted to `0.00` during the mandatory `1-beat` silence window `f=2205..2220` (`73.50s..74.00s`) before resolving on the `f=2220` End Card chord.
2. **Layer 2: Authentic UI Interaction Foley (`click-crisp.wav`, `key-tick.wav`, `wheel-tick.wav`, `press-halo.wav`)**
   * Frame-locked to real Playwright pointer clicks recorded in `video/src/take/beats.json` (`Run Live Recall`, `Graph` toggle, and all four `Connect` IDE tabs) plus composer typing, slot-reel detents, and `@snapcn/terminal-simulator` CLI typing.
3. **Layer 3: Designed Transition & Callout Cues (`sky-breeze.wav`, `collapse-impact.wav`, `pop.wav`, `whoosh.wav`, `whip.wav`, `bloom-reveal.wav`)**
   * Synthesized deterministically via seeded PRNG + Chamberlin SVF bandpass/low-pass filters + DC blocker + raised-cosine de-clicking (`sample[0] = 0`, `sample[N-1] = 0`).

## 2. Verified WAV Asset Inventory (`video/public/audio/`)

| Asset Filename | Duration | Stem Peak (`<= -3.0 dBFS`) | Sonic Character & Synthesis Role |
| :--- | :---: | :---: | :--- |
| `score-80s.wav` | `80.00s` | `-10.5 dBFS` | `120 BPM` `Cmaj9 -> Am9 -> Fmaj7 -> G6` felt Rhodes, sub pulse, pocket percussion, `f=2205..2220` silence gate |
| `sky-breeze.wav` | `1.60s` | `-5.7 dBFS` | Filtered stereo air + crystalline bell harmonic for `CloudSky` hook and End Card breath |
| `collapse-impact.wav` | `1.40s` | `-3.6 dBFS` | `0.65s` reverse vacuum whoosh + warm sub-drop + mint harmonic chime for `@snapcn/logo-collapse` |
| `click-crisp.wav` | `0.25s` | `-5.2 dBFS` | Tactile damped switch transient locked to real app pointer clicks in `take.mp4` |
| `key-tick.wav` | `0.12s` | `-7.5 dBFS` | Soft lubed mechanical keycap tick for composer prompt and End Card CLI typing |
| `wheel-tick.wav` | `0.22s` | `-6.4 dBFS` | Glass marimba detent for `PromptRoll` (`word-wheel`) and `@snapcn/check-cycle` IDE slot rolls |
| `press-halo.wav` | `1.10s` | `-4.8 dBFS` | Tactile button press transient + warm emerald shimmer halo on composer Send (`f=450`) |
| `pop.wav` | `0.18s` | `-6.0 dBFS` | Soft organic wooden-glass pop fired whenever a `0-deg` flattened Explainer Callout ring opens |
| `whoosh.wav` | `0.50s` | `-5.4 dBFS` | Bandpass-swept pink noise transition cue on `slide-from-bottom`, `slide-from-right`, and bezel dive |
| `whip.wav` | `0.32s` | `-5.1 dBFS` | Fast high-Q stereo panner whip for `@snapcn/punch-lines` card slam |
| `bloom-reveal.wav` | `1.80s` | `-4.2 dBFS` | Rising emerald fifth + airy shimmer for recalled rule banner, `dotBloom`, and **DROP B** |

## 3. Master Frame-Accurate Cue Sheet (`f=0..2400` @ `30fps`)

| Cue # | Global Frame | Time (`s`) | Scene (Local `f`) | Asset (`public/audio/`) | Gain (`vol`) | Visual Sync Event |
| :---: | :---: | :---: | :--- | :--- | :---: | :--- |
| **00** | `f0..2400` | `0.00s..80.00s` | Master (`mute f2205..2220`) | `score-80s.wav` | `0.60` | `120 BPM` harmonic score (`Drop A` at `f=180`, `Breakdown` at `f=960`, `Drop B` at `f=1470`, silence `f=2205..2220`, `Outro` `f=2220..2400`) |
| **01** | `f4` | `0.13s` | Scene 1 (`f4`) | `sky-breeze.wav` | `0.52` | `OriginKit CloudSky` opens as `@snapcn/word-gather` anchors `"Every"` |
| **02** | `f28` | `0.93s` | Scene 1 (`f28`) | `pop.wav` | `0.30` | Remaining hook words drop into frame in `#047857` mint |
| **03** | `f62` | `2.07s` | Scene 1 (`f62`) | `sky-breeze.wav` | `0.34` | `"Every agent forgets what your team learned."` settles into `#141413` ink |
| **04** | `f160` | `5.33s` | Scene 2 (`f10`) | `collapse-impact.wav` | `0.76` | `0.65s` reverse vacuum pulls 8 category plates inward; sub-drop + chime hits **DROP A** (`WalrusLogo3D` lockup) right on `f=180` (`6.00s`) |
| **05** | `f300` | `10.00s` | Transition `T2` (`f0`) | `whoosh.wav` | `0.38` | `slide-from-bottom` transition into Scene 3 `PromptRoll` composer |
| **06** | `f308..332` | `10.27s..11.07s` | Scene 3 (`f8..32`) | `key-tick.wav` (`x7`, every `4f`) | `0.24` | Composer types `"Give your agent live"` |
| **07** | `f336` | `11.20s` | Scene 3 (`f36`) | `wheel-tick.wav` | `0.50` | Slot reel detent 1: `"team review rules"` |
| **08** | `f366` | `12.20s` | Scene 3 (`f66`) | `wheel-tick.wav` | `0.52` | Slot reel detent 2: `"QA test flows"` |
| **09** | `f396` | `13.20s` | Scene 3 (`f96`) | `wheel-tick.wav` | `0.54` | Slot reel detent 3: `"Rust SDK patterns"` |
| **10** | `f426` | `14.20s` | Scene 3 (`f126`) | `wheel-tick.wav` | `0.58` | Slot reel detent 4: `"SKILL.md graph"` |
| **11** | `f450` | `15.00s` | Scene 3 (`f150`) | `press-halo.wav` | `0.68` | Pointer clicks `#10b981` Send button; `@snapcn/laptop-frame` opens with `"memwal-mcp connected"` notch |
| **12** | `f495` | `16.50s` | Scene 3 (`f195`) | `whoosh.wav` | `0.46` | Camera dives smoothly through MacBook screen bezel (`finale="zoom-to-screen"`) into full-bleed `1920x1080` app |
| **13** | `f558` | `18.60s` | Scene 4 (`f18`) | `whip.wav` | `0.36` | Chapter 01 `@snapcn/text-highlight` sweeps `#10b981` marker behind `"Recall live"` |
| **14** | `f754` | `25.13s` | Scene 5 (`f124`) | `click-crisp.wav` | `0.64` | Real recorded click on `Run Live Recall` button (`beats.json` mark `"run"` at `t=8.93s`) |
| **15** | `f812` | `27.07s` | Scene 5 (`f182`) | `bloom-reveal.wav` | `0.36` | `Team Rule Recalled` banner expands on `/eval` (`beats.json` mark `"recalled"` at `t=10.94s`) |
| **16** | `f815` | `27.17s` | Scene 5 (`f185`) | `pop.wav` | `0.32` | **Callout 1** (`4.83s`) ring draws at `0 deg` flat camera (`"Live recall from Walrus"`) |
| **17** | `f960` | `32.00s` | Transition `T5` (`f0`) | `whoosh.wav` | `0.38` | `slide-from-right` transition into Scene 6 Chapter 02 card |
| **18** | `f964` | `32.13s` | Scene 6 (`f4`) | `whip.wav` | `0.42` | `@snapcn/punch-lines` Card 1 slides in: `"Stale static prompt"` |
| **19** | `f1005` | `33.50s` | Scene 6 (`f45`) | `pop.wav` | `0.46` | `@snapcn/punch-lines` Card 2 punches up: `"vs. live shared memory."` |
| **20** | `f1068` | `35.60s` | Scene 7 (`f18`) | `pop.wav` | `0.32` | **Callout 2A** (`4.40s`) ring opens on left card (`"Without Walrus Memory"`) |
| **21** | `f1206` | `40.20s` | Scene 7 (`f156`) | `whoosh.wav` | `0.22` | Subtle lateral camera glide from `Without MemWal` to `With MemWal` card |
| **22** | `f1224` | `40.80s` | Scene 7 (`f174`) | `pop.wav` | `0.34` | **Callout 2B** (`4.80s`) ring opens on right card (`"With Walrus Memory"`) |
| **23** | `f1380` | `46.00s` | Transition `T7` (`f0`) | `bloom-reveal.wav` | `0.48` | `@snapcn/dot-bloom` (`#10b981` halftone dots) transitions into Chapter 03 |
| **24** | `f1398` | `46.60s` | Scene 8 (`f18`) | `pop.wav` | `0.30` | Chapter 03 `@snapcn/word-gather` words converge (`"Fourteen team skills in one living graph."`) |
| **25** | `f1470` | `49.00s` | Scene 9 (`f0`) | `whoosh.wav` | `0.34` | **DROP B** downbeat cut into `/graph` `Skills (14)` workspace |
| **26** | `f1481` | `49.37s` | Scene 9 (`f11`) | `click-crisp.wav` | `0.54` | `memwal-review` opens in `Skills (14)` (`beats.json` mark `"skill-open"` at `t=28.89s`) |
| **27** | `f1492` | `49.73s` | Scene 9 (`f22`) | `pop.wav` | `0.32` | **Callout 3A** (`4.60s`) ring opens on `memwal-review` `SKILL.md` (`"Rules compiled into SKILL.md"`) |
| **28** | `f1659` | `55.30s` | Scene 9 (`f189`) | `click-crisp.wav` | `0.58` | Recorded pointer clicks `Graph` toggle (`beats.json` mark `"graph"` at `t=35.35s`) |
| **29** | `f1674` | `55.80s` | Scene 9 (`f204`) | `pop.wav` | `0.34` | **Callout 3B** (`4.07s`) ring opens on `SkillForceGraph` (`"Live namespace skill graph"`) |
| **30** | `f1800` | `60.00s` | Transition `T9` (`f0`) | `whoosh.wav` | `0.38` | `slide-from-bottom` transition into Scene 10 Chapter 04 `@snapcn/check-cycle` |
| **31** | `f1820` | `60.67s` | Scene 10 (`f20`) | `wheel-tick.wav` | `0.48` | `CheckCycle` roll 1: `"Claude Code"` |
| **32** | `f1840` | `61.33s` | Scene 10 (`f40`) | `wheel-tick.wav` | `0.50` | `CheckCycle` roll 2: `"Cursor"` |
| **33** | `f1860` | `62.00s` | Scene 10 (`f60`) | `wheel-tick.wav` | `0.52` | `CheckCycle` roll 3: `"Codex"` |
| **34** | `f1880` | `62.67s` | Scene 10 (`f80`) | `wheel-tick.wav` | `0.56` | `CheckCycle` roll 4: `"Antigravity"` |
| **35** | `f1943` | `64.77s` | Scene 11 (`f53`) | `click-crisp.wav` | `0.52` | Recorded click on `Claude Code` tab (`beats.json` `t=43.17s`) |
| **36** | `f1995` | `66.50s` | Scene 11 (`f105`) | `pop.wav` | `0.32` | **Callout 4** (`6.00s`) ring opens on IDE tab strip (`"One shared MCP config"`) |
| **37** | `f2018` | `67.27s` | Scene 11 (`f128`) | `click-crisp.wav` | `0.52` | Recorded click on `Cursor` tab (`beats.json` `t=45.45s`) |
| **38** | `f2087` | `69.57s` | Scene 11 (`f197`) | `click-crisp.wav` | `0.52` | Recorded click on `Codex` tab (`beats.json` `t=47.56s`) |
| **39** | `f2161` | `72.03s` | Scene 11 (`f271`) | `click-crisp.wav` | `0.52` | Recorded click on `Antigravity` tab (`beats.json` `t=49.84s`) |
| **40** | `f2205..2220` | `73.50s..74.00s` | Scene 11 (`f315..330`) | *(Complete Silence)* | `0.00` | Mandatory `1-beat` (`15-frame`) total silence across score and all SFX before End Card downbeat |
| **41** | `f2220` | `74.00s` | Scene 12 (`f0`) | `sky-breeze.wav` | `0.44` | End Card `WalrusLogo3D` lockup rises with resolved `Cmaj9` score chord |
| **42** | `f2236..2252` | `74.53s..75.07s` | Scene 12 (`f16..32`) | `key-tick.wav` (`x5`, every `4f`) | `0.22` | `@snapcn/terminal-simulator` pill types `npx @mysten-incubation/memwal-mcp`; holds completely still `f=2256..2400` (`4.80s`) |
