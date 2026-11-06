# Walrus Memory — Creative Director Script & Audio Architecture

**Project**: `Walrus Memory — Namespace Skill Graph & Trajectory Eval Harness` (`memwal-skill-harness`)  
**Format**: `1920 × 1080` (16:9 Full HD) · `30 fps` · `42.0s` (`1,260 frames`) · Stereo `44.1 kHz / 16-bit PCM`  
**Workflow Compliance**: `demo-video-director` Gates 1, 2, 3, Gate 6 & Mandatory Checklist E  
**Narration Policy**: **Zero voiceover / zero AI-slop narration.** Story is carried by kinetic chapter cards, authentic UI choreography, verifiable Walrus blob receipts, and Fable/Linear-grade harmonic sound design.

---

## Gate 1 — Creative Brief & 6-Scene Beat Sheet (`42.0s / 1260f @ 30fps`)

### 1.1 Creative Brief & `no-ai-slop` Copy Discipline
- **Core Thesis**: Every coding agent (`Claude Code`, `Cursor`, `Antigravity`, `Codex`) starts cold unless team skills, SDK migration rules, and delegate signers live in a shared, verifiable memory namespace. **Walrus Memory** unifies your team's `SKILL.md` graph, Ed25519 delegate keys, and on-chain Walrus blob receipts behind a single MCP namespace — lifting real multi-step trajectory eval pass rates from **`38%` → `96% PASS`**.
- **Copy Rules Enforced**:
  - Direct, concrete engineering copy (`≤ 8 words` per headline beat; zero banned buzzwords like *"seamlessly"*, *"revolutionary"*, *"unleash"*, or *"next-gen"*).
  - Zero `"mock"` tags anywhere on screen. Real verifiable Walrus Blob ID (`z7BHX3brsgqcmDQXh2IzmoCj4g14XioezjkuIL1Fkk0`), real package command (`npx @mysten-incubation/memwal-mcp`), and real contributor handle (`@harrymove-ctrl`).
  - **9-frame (`0.30s`) optical cross-dissolve overlaps** between consecutive scenes prevent static cut flashes and maintain continuous visual momentum.

### 1.2 Master 6-Scene Beat Sheet (`1260 Frames @ 30fps`)

| Scene | Global Time | Global Frames | Duration | Visual Stage & `@snapcn` Choreography | On-Screen Copy & Real Product Artifacts |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Scene 1** | `0.0s–5.5s` | `f0–f165` | `165f` (`5.5s`) | **OriginKit `CloudSky (preset=base)` + `@snapcn/word-gather` Intro** — Graded Azure sky (`#3b82f6` → `#dff2fe`) with flat-base cumulus clouds drifting gently across frame; blurred typographic tokens converge into crisp optical focus. | Headline: **`"Shared memory every agent recalls."`**<br>Subtitle: **`"One namespace. Zero cold starts."`** |
| **Scene 2** | `5.2s–11.5s` | `f156–f345` | `189f` (`6.3s`) | **`@snapcn/logo-collapse` Brand Reveal** — 8 scattered context plates & real Walrus plush/mascot cards implode radially onto dark Obsidian `ChromaCurrent` (`#080c0b` + `#34d996` emerald streams), punching in the 3D Bayer-4 dithered `WalrusLogo3D` mark + lockup at `f196`. | Plates: `SKILL.md`, `Delegate Key`, `Blob Receipt`, `Sui gRPC`, Walrus mascot cards<br>Lockup: **`Walrus Memory`** · `SHARED SKILL GRAPH & HARNESS` |
| **Scene 3** | `11.2s–17.5s` | `f336–f525` | `189f` (`6.3s`) | **Demo App `ChromaCurrent` Light Stage + `@snapcn/click-type`** — Warm Sorbet `#f5f6f1` stage; `@harrymove-ctrl` cursor glides smoothly into the composer, clicks input focus, and types command with live MCP namespace pill active. | Handle: `@harrymove-ctrl` · Pill: `memwal://mysten-team`<br>Typed Prompt: **`"Sync @mysten/sui gRPC skill + delegate key"`** |
| **Scene 4** | `17.2s–24.5s` | `f516–f735` | `219f` (`7.3s`) | **`@snapcn/prompt-roll` (`WordWheel`)** — Detented vertical slot drum cycles smoothly through 4 live recall primitives inside the composer above connected IDE badges. | **`"Recall [Sui gRPC SDK rules → Walrus blob receipts → team SKILL.md graph → shared delegate keys] across every IDE"`**<br>Badges: `Claude Code` · `Cursor` · `Antigravity` · `Codex` |
| **Scene 5** | `24.2s–32.0s` | `f726–f960` | `234f` (`7.8s`) | **`@snapcn/prompt-send` + Live Trajectory Eval Delta** — Dark Obsidian `ChromaCurrent` stage; types eval command, clicks emerald Send button (`f822`), and snaps open the live A/B Trajectory Eval comparison card (`f846`–`f870`). | Prompt: **`"Run Trajectory Eval: Without vs With Team Memory"`**<br>Delta: **`Without Memory: 38%`** → **`With Walrus Memory: 96% PASS`**<br>Blob ID: `z7BHX3brsgqcmDQXh2IzmoCj4g14XioezjkuIL1Fkk0` |
| **Scene 6** | `31.7s–42.0s` | `f951–f1260` | `309f` (`10.3s`) | **`@snapcn/app-reveal` (`DotBloom` → Full 3-Pane Workspace → Final Brand CTA Card)** — `#10b981` emerald dot blooms full-screen (`f957`), unveiling the live 3-pane `memwal-skill-harness` workspace (Skill Graph + Delegate Key Signers + Trajectory Eval Harness), then settles into the actionable CTA end card (`f1125–f1260`). | Workspace: **3-Pane `memwal-skill-harness`**<br>CTA URL: **`memwal.mystenlabs.com`**<br>CLI: **`npx @mysten-incubation/memwal-mcp`** |

---

## Gate 2 — Visual Design System & Motion Tokens

All surface and accent tokens inherit directly from [`snap-cn-ui.ts`](file:///Volumes/Dev/memwal-skill-harness/video/src/lib/snap-cn-ui.ts) with zero unapproved foreign hues.

### 2.1 Color Palette & WCAG AA+ Contrast Audit

| Token Role | Name | Hex / Value | Usage & WCAG AA+ Contrast Verification |
| :--- | :--- | :--- | :--- |
| **Light Canvas** | **Sorbet** | `#f5f6f1` | Scene 3 & 4 light `ChromaCurrent` stage canvas (`16.8:1` vs `#141413` primary ink — **AAA**) |
| **Light Surface** | **Pure / Mist** | `#ffffff` / `#f1f5f3` | Composer shell, IDE pills, elevated cards (`border: rgba(20, 20, 19, 0.10)`) |
| **Dark Canvas** | **Obsidian** | `#080c0b` | Scene 2, 5 & 6 dark `ChromaCurrent` canvas (`18.6:1` vs `#f8fafc` primary ink — **AAA**) |
| **Dark Surface** | **Basalt / Slate** | `#111615` / `#18201e` | Dark composer, Trajectory Eval delta card, 3-pane workspace (`border: rgba(255, 255, 255, 0.11)`) |
| **Primary Accent (Dark)** | **Phosphor Emerald** | `#34d996` / `#10b981` | `ChromaCurrent` ribbons, `DotBloom` portal, `96% PASS` meter (`10.7:1` on `#080c0b` — **AAA**) |
| **Primary Accent (Light)** | **Deep Emerald** | `#059669` | Light-stage badges, active MCP pill text & focus ring (`4.65:1` on `#ffffff` — **AA+**) |
| **Intro Atmosphere** | **Sky Azure Gradient** | `#3b82f6` → `#dff2fe` | Scene 1 `OriginKit CloudSky (preset=base)` graded zenith-to-horizon sky with `#0f172a` deep ink (`13.4:1` on lower sky — **AAA**) |

### 2.2 Typography, Safe Areas & Motion Physics
- **Display & UI Font (`fontFamily`)**: `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
  - Hero Display: `64px–76px`, weight `600–700`, tracking `-0.032em`, line-height `1.08`.
  - Card & Composer Copy: `28px–34px`, weight `500–600`, tracking `-0.015em` (strictly `≥ 28px` for mobile/X feed legibility).
- **Technical Monospace (`monoFamily`)**: `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace`
  - Used exclusively for MCP namespace URIs (`memwal://...`), Walrus Blob IDs (`z7BHX3brsgqcmDQXh2IzmoCj4g14XioezjkuIL1Fkk0`), eval percentages (`38%` → `96% PASS`), and CLI CTA (`npx @mysten-incubation/memwal-mcp`).
- **10% Broadcast & Social Safe Area**:
  - Horizontal safe inset: `192px` left / `192px` right (`x ∈ [192, 1728]`).
  - Vertical safe inset: `108px` top / `108px` bottom (`y ∈ [108, 972]`).
  - All primary headlines, lockups, eval numbers, and CTA commands remain strictly inside this `1536 × 864` title-safe zone.
- **Deterministic Frame-Pure Motion Curves**:
  - **Spring Lockups (`LogoCollapse`, Eval Card, Workspace)**: `mass: 0.9, damping: 16, stiffness: 170` (crisp settle, zero rubbery overshoot).
  - **Cursor & `WordWheel` Slot Detents**: `Easing.bezier(0.22, 1, 0.36, 1)` quintic out-curve (`14f` per slot roll, `31f` readable hold).
  - **Scene Overlaps**: `9 frames` (`0.30s`) cross-dissolve between adjacent scenes (`f156–f165`, `f336–f345`, `f516–f525`, `f726–f735`, `f951–f960`).

---

## Gate 3 — Suno `[Instrumental]` Prompt & Frame-Accurate SFX Cue Sheet

### 3.1 Suno `[Instrumental]` Brief (`< 500` Characters)

> `[Instrumental] 96 BPM warm minimal electronic launch film score, Fable and Linear aesthetic. Felt Rhodes electric piano playing Cmaj9 Am9 Fmaj7 G6, warm analog low-pass pad, tight clean sub-bass pulse, delicate glass marimba harmonics, subtle stereo air. Builds gently into luminous emerald chord lift at 0:32, resolves cleanly at 0:42. Zero vocals, zero harsh percussion.`

*(Character count: **372 characters** — verified `< 500` chars.)*

**Harmonic & Tempo Architecture (`soundtrack.wav` — `96 BPM`, `17 bars = 42.50s`)**:
- `1 beat = 0.625s (18.75f)` · `1 bar (4/4) = 2.50s (75f)` · `4-bar harmonic cycle = 10.0s (300f)`
- **Chord Progression**: `Cmaj9` → `Am9` → `Fmaj7(add9)` → `G6`
- **Mix Headroom**: Normalized to **`0.28` peak (`-11.06 dBFS`)** with `1.2s` smooth fade-in and `2.2s` smooth fade-out so UI clicks, key ticks, marimba detents, and sub-impacts cut cleanly through without ducking artifacts or clipping.

### 3.2 Frame-Accurate SFX Cue Sheet (`30 fps`, Global Frames `0–1260`)

All 7 audio assets reside in [`public/audio/`](file:///Volumes/Dev/memwal-skill-harness/video/public/audio) and are synthesized deterministically by [`generate-audio.mjs`](file:///Volumes/Dev/memwal-skill-harness/video/scripts/generate-audio.mjs).

| Cue # | Global Frame | Time (`s`) | Scene (Local Frame) | Asset File (`public/audio/`) | Gain (`volume`) | Visual Sync Target & Sonic Role |
| :---: | :---: | :---: | :---: | :--- | :---: | :--- |
| **00** | `f0` | `0.00s` | Global (`f0–f1260`) | `soundtrack.wav` | `1.00` | Warm 96 BPM `Cmaj9 → Am9 → Fmaj7 → G6` Rhodes + sub-bass bed (`-11.1 dBFS` peak) |
| **01** | `f6` | `0.20s` | Scene 1 (`f6`) | `sky-breeze.wav` | `0.62` | `CloudSky` cumulus drift + crystalline bell harmonic as `WordGather` headline converges |
| **02** | `f66` | `2.20s` | Scene 1 (`f66`) | `sky-breeze.wav` | `0.36` | Soft secondary atmospheric shimmer as `"One namespace. Zero cold starts."` locks in |
| **03** | `f176` | `5.87s` | Scene 2 (`f20`) | `collapse-impact.wav` | `0.78` | `0.00–0.65s` reverse vacuum whoosh pulls 8 plates inward; `+0.65s` (`f196`) sub-drop + emerald chime hits `WalrusLogo3D` reveal |
| **04** | `f366` | `12.20s` | Scene 3 (`f30`) | `click-crisp.wav` | `0.68` | `@harrymove-ctrl` pointer clicks Sorbet light composer input & activates MCP pill |
| **05** | `f381–f454` | `12.70s–15.13s` | Scene 3 (`f45–f118`) | `key-tick.wav` *(×16 cues, every `4–5f`)* | `0.42` | Lubed mechanical keycap ticks synced to `"Sync @mysten/sui gRPC skill + delegate key"` |
| **06** | `f474` | `15.80s` | Scene 3 (`f138`) | `click-crisp.wav` | `0.60` | Tactile confirmation click locking namespace sync pill |
| **07** | `f546` | `18.20s` | Scene 4 (`f30`) | `wheel-tick.wav` | `0.60` | `WordWheel` slot 1 marimba/glass detent: `"Sui gRPC SDK rules"` |
| **08** | `f591` | `19.70s` | Scene 4 (`f75`) | `wheel-tick.wav` | `0.64` | `WordWheel` slot 2 marimba/glass detent: `"Walrus blob receipts"` |
| **09** | `f636` | `21.20s` | Scene 4 (`f120`) | `wheel-tick.wav` | `0.68` | `WordWheel` slot 3 marimba/glass detent: `"team SKILL.md graph"` |
| **10** | `f681` | `22.70s` | Scene 4 (`f165`) | `wheel-tick.wav` | `0.72` | `WordWheel` slot 4 marimba/glass detent: `"shared delegate keys"` + 4 IDE badges |
| **11** | `f748–f805` | `24.93s–26.83s` | Scene 5 (`f22–f79`) | `key-tick.wav` *(×14 cues, every `4–5f`)* | `0.42` | Tactile keycap cadence typing `"Run Trajectory Eval: Without vs With Team Memory"` |
| **12** | `f822` | `27.40s` | Scene 5 (`f96`) | `click-crisp.wav` | `0.76` | Crisp pointer click on emerald **Send / Run Eval** button |
| **13** | `f846` | `28.20s` | Scene 5 (`f120`) | `wheel-tick.wav` | `0.58` | Live Trajectory Eval comparison card snaps open (`Without Memory: 38%`) |
| **14** | `f870` | `29.00s` | Scene 5 (`f144`) | `bloom-reveal.wav` | `0.54` | Emerald chord lift as `With Walrus Memory: 96% PASS` + Blob `z7BHX3...1Fkk0` locks |
| **15** | `f957` | `31.90s` | Scene 6 (`f6`) | `bloom-reveal.wav` | `0.82` | `#10b981` `DotBloom` expands full-screen into the 3-pane `memwal-skill-harness` workspace |
| **16** | `f1035` | `34.50s` | Scene 6 (`f84`) | `click-crisp.wav` | `0.52` | Subtle workspace inspection focus lock across Skill Graph + Delegate Signers + Eval panes |
| **17** | `f1125` | `37.50s` | Scene 6 (`f174`) | `sky-breeze.wav` | `0.46` | Crystalline harmonic breath settling onto final CTA (`memwal.mystenlabs.com · npx @mysten-incubation/memwal-mcp`) |

---

## Gate 6 & Checklist E — Audio Synthesis & QA Verification Summary

### 4.1 Verified WAV Asset Telemetry (`ffprobe` + `ffmpeg volumedetect`)

| File | Duration | Format | Channels | Sample Rate | Measured Peak (`dBFS`) | Mean RMS (`dBFS`) | Ceiling Check (`≤ -3.0 dBFS`) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| [`soundtrack.wav`](file:///Volumes/Dev/memwal-skill-harness/video/public/audio/soundtrack.wav) | `42.500s` | `pcm_s16le` | `2` (Stereo) | `44,100 Hz` | **`-11.06 dBFS`** (`0.2800`) | `-24.9 dBFS` | **PASS** |
| [`sky-breeze.wav`](file:///Volumes/Dev/memwal-skill-harness/video/public/audio/sky-breeze.wav) | `1.600s` | `pcm_s16le` | `2` (Stereo) | `44,100 Hz` | **`-5.68 dBFS`** (`0.5200`) | `-21.0 dBFS` | **PASS** |
| [`collapse-impact.wav`](file:///Volumes/Dev/memwal-skill-harness/video/public/audio/collapse-impact.wav) | `1.400s` | `pcm_s16le` | `2` (Stereo) | `44,100 Hz` | **`-3.61 dBFS`** (`0.6600`) | `-18.5 dBFS` | **PASS** |
| [`click-crisp.wav`](file:///Volumes/Dev/memwal-skill-harness/video/public/audio/click-crisp.wav) | `0.250s` | `pcm_s16le` | `2` (Stereo) | `44,100 Hz` | **`-5.19 dBFS`** (`0.5500`) | `-28.4 dBFS` | **PASS** |
| [`key-tick.wav`](file:///Volumes/Dev/memwal-skill-harness/video/public/audio/key-tick.wav) | `0.120s` | `pcm_s16le` | `2` (Stereo) | `44,100 Hz` | **`-7.54 dBFS`** (`0.4200`) | `-24.5 dBFS` | **PASS** |
| [`wheel-tick.wav`](file:///Volumes/Dev/memwal-skill-harness/video/public/audio/wheel-tick.wav) | `0.220s` | `pcm_s16le` | `2` (Stereo) | `44,100 Hz` | **`-6.38 dBFS`** (`0.4800`) | `-21.8 dBFS` | **PASS** |
| [`bloom-reveal.wav`](file:///Volumes/Dev/memwal-skill-harness/video/public/audio/bloom-reveal.wav) | `1.800s` | `pcm_s16le` | `2` (Stereo) | `44,100 Hz` | **`-4.15 dBFS`** (`0.6200`) | `-19.6 dBFS` | **PASS** |

### 4.2 Checklist E Sign-Off Criteria for Final Remotion Master
- [x] **Deterministic Offline Audio Generation**: Pure Node.js ESM (`node scripts/generate-audio.mjs`) with seeded Mulberry32 PRNG, Chamberlin SVF low-pass/bandpass filtering, DC-offset high-pass blocker, and raised-cosine boundary de-clicking (`sample[0] = 0`, `sample[N-1] = 0`). Zero external network fetches.
- [x] **Zero Harsh Clipping & Balanced Headroom**: Every asset verified `≤ -3.61 dBFS` peak; `soundtrack.wav` sits warmly at `-11.06 dBFS` peak (`-24.9 dBFS` RMS) so tactile UI foley cuts through cleanly without bus distortion.
- [x] **Single Pointer Rule**: Only the custom `@harrymove-ctrl` vector cursor appears in interactive scenes (Scenes 3 & 5) — never stacked over a second OS cursor.
- [x] **Zero Text/Callout Overlap & 10% Safe Area**: All cards, badges, and headlines stay inside `[192..1728, 108..972]` with zero callout-over-text collisions.
- [x] **Clean Separation of Concerns**: All video assets, scripts, and audio stay strictly inside `video/` without mutating application runtime code.

---

## Gate 5 — Empirical Final Render QA Sign-Off (`video-qa-auditor`, 7/7 PASS)

- **Master Output**: [`out/walrus-memory-promo.mp4`](file:///Volumes/Dev/memwal-skill-harness/video/out/walrus-memory-promo.mp4) (`43.08 MB`, CRF 17, lossless PNG intermediates)
- **Poster Frame**: [`out/walrus-memory-poster.png`](file:///Volumes/Dev/memwal-skill-harness/video/out/walrus-memory-poster.png)

| Checklist | Gate Criterion | Verdict | Empirical Proof |
| :--- | :--- | :---: | :--- |
| **A** | Typography `>= 22px`, 10% safe area (`[192..1728] × [108..972]`), zero overlap/orphans | **PASS** | All `fontSize` declarations `>= 22px`; Scene 2 radial plates sit inside `[306..1614] × [192..888]` (`32px` clear of top pill); `"MCP Sync · Live"` single-line `nowrap`. |
| **B** | WCAG AA+ contrast, crisp borders, surface depth | **PASS** | Measured pixel contrast across Scenes 1–6: `6.09:1` to `19.29:1` (WCAG AA+ / AAA). |
| **C** | Zero blank/flicker frames, clean scene holds | **PASS** | Full 1,260-frame pixel scan: `0` frames with `std_dev == 0` (`min std_dev = 10.43`), `0` black frames (`min luma = 13.82`), `0` single-frame flickers; seamless `DotBloom` handoff (`frames 955..985`). |
| **D** | Authentic Walrus Memory domain data, sharp icons/mascots | **PASS** | Real repo Blob ID `z7BHX3br...Fkk0`, `@mysten-incubation/memwal-mcp`, `ns://walrus-team-core`, `cmk:sui-sdk`, `38% -> 96%` (`+58%`), crisp 3D `WalrusLogo3D` & plush cards. |
| **E** | Valid stereo audio, zero clipping (`max_volume <= -1.0 dB`) | **PASS** | Stereo AAC `48,000 Hz`, `mean_volume = -27.8 dB`, `max_volume = -6.2 dB`, `0` clipped samples across `4,036,608` samples. |
| **F** | Hook `< 2s`, clean CTA end card hold `>= 3.5s` | **PASS** | Opening `CloudSky` + `WordGather` hook converges in `0.17s–1.40s`; Final Brand End Card holds 100% opacity for `111 frames` (`3.70s`, `frames 1149..1259`). |
| **G** | Exact `1920x1080`, `30fps`, H.264 `yuv420p` MP4 playability | **PASS** | `ffprobe`: `h264` (`High` L4.0, `avc1`), `pix_fmt: yuv420p`, `1920x1080`, `30/1` fps, `1260` frames (`42.000000s`). |

