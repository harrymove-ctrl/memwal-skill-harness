# Walrus Memory Empirical Video QA Audit (`QA.md`)

**Gate 3 Audit Target**: `WalrusPromo` (`WalrusProductFilm.tsx`)  
**Master Outputs**:
* `video/out/walrus-memory-promo.mp4` (`80,264,915 bytes` / `76.55 MiB`, SHA-256 `65fc7eddadb9c06c1ed407f5a858363146756105267ad51aa1665a990a25c94c`)
* `video/out/walrus-memory-promo-real.mp4` (`80,264,915 bytes` / `76.55 MiB`, SHA-256 `65fc7eddadb9c06c1ed407f5a858363146756105267ad51aa1665a990a25c94c`)
* `docs/demo/preview/walrus-memory-preview-720p.mp4` (`23,810,565 bytes` / `22.71 MiB` / `23.81 MB`, `1280 x 720`)

**Contact Sheets & Extracted Stills**:
* `docs/demo/preview/motion-frames.png` (`2 x 5` composite grid of 10 motion, chapter, transition, and end-lockup stills)
* `docs/demo/preview/footage-callouts.png` (`2 x 3` composite grid of 6 real-product 3D and 0-degree flattened callout stills)
* `video/out/qa-film/*.png` (`16` full-resolution `1920 x 1080` PNG stills across Scenes 1..12)

---

## 1. Stream, Container, and Signal Integrity (`ffprobe` + `ffmpeg` Video Probes)

Verified directly via `ffprobe -v error -show_format -show_streams -of json out/walrus-memory-promo.mp4` and `ffmpeg` signal filters (`freezedetect=n=0.003:d=1.5`, `blackdetect=d=0.3`).

| Deliverable / Property | Target Specification | Measured Empirical Value | Verdict |
| :--- | :--- | :--- | :---: |
| Master Container | QuickTime / MP4 (`isom`, `avc1`, `mp41`) | `mov,mp4,m4a,3gp,3g2,mj2` (`80,264,915 bytes`) | PASS |
| Video Codec & Profile | `h264` (`libx264`) | `h264` (`High` profile, level `40`, progressive) | PASS |
| Pixel Format | `yuv420p` (`8-bit`) | `yuv420p` (`8-bit`, `1920 x 1080`) | PASS |
| Resolution & Frame Rate | `1920 x 1080` @ `30/1` fps | `1920 x 1080`, `r_frame_rate = 30/1`, `avg_frame_rate = 30/1` | PASS |
| Video Stream Duration & Frames | `80.000000s` (`2400` frames) | `80.000000s` (`nb_frames = 2400`, `7,757.8 kbps`) | PASS |
| Audio Codec & Layout | Stereo `aac` @ `48000 Hz` | `aac` (`LC`), `48000 Hz`, `2` channels (`stereo`), `260.4 kbps` | PASS |
| 720p Preview Copy | `1280 x 720`, `yuv420p`, `< 30 MB` | `1280 x 720`, `h264` (`-crf 24`), `23.81 MB` (`22.71 MiB`) | PASS |
| `blackdetect=d=0.3` | Zero black frames or drops | `0` black intervals detected (`0.00s` total) | PASS |
| `freezedetect=n=0.003:d=1.5` | Zero unintentional stalls | Only S1 calm sky hold (`1.67s..4.63s` subtle cumulus drift `< 0.003` MSE); `0` footage stalls | PASS |

---

## 2. Broadcast Loudness & Pre-Impact Breath Audit (`ffmpeg loudnorm` + `astats`)

Mastered with `video/scripts/master-loudness.sh` (`-c:v copy` lossless video passthrough + two-pass EBU R128 linear loudness normalization) and verified independently on `out/walrus-memory-promo.mp4`.

| Audio Metric | Target Specification | Pass 1 Raw Render | Mastered Final MP4 | Verdict |
| :--- | :--- | :--- | :--- | :---: |
| Integrated Loudness (`I`) | `-14.0 +- 0.8 LUFS` (mastering target `-14.0 +- 0.5`) | `-15.33 LUFS` | `-14.02 LUFS` (`summary: -14.0 LUFS`) | PASS |
| True Peak (`TP`) | `<= -1.0 dBTP` | `-2.63 dBTP` | `-1.48 dBTP` (`summary: -1.5 dBTP`) | PASS |
| Loudness Range (`LRA`) | Natural dynamic contour (`4..9 LU`) | `5.50 LU` | `5.50 LU` | PASS |
| Pre-Impact 15f Breath (`73.55s..73.95s`) | RMS `<= -55.0 dB` before `74.00s` Cmaj9 hit | Measured on master | `RMS = -77.63 dB` (`mean_volume = -77.5 dB`, `Peak = -45.80 dB`) | PASS |

---

## 3. 16-Frame Palette & Brand Hue Audit (`video/src/palette.ts` Conformance)

Every extracted `1920 x 1080` PNG still (`10` motion/chapter/transition stills + `6` live-product/callout stills, `32,400` sampled pixels per frame on an `8px` grid) was classified in HSV space against `PALETTE` tokens auto-generated from `src/index.css`, `src/components/react-bits/fullscreen-shader-background.tsx`, and `src/components/SkillsWorkspace.tsx`:
* **Sorbet Neutrals** (`S < 0.14` or `V < 0.08`): `#f5f6f1` (`shaderCanvasLight`), `#f8f8f7` (`paper`), `#ffffff` (`card`), `#f4f4f5` (`fill`), `#e4e4e7` (`border`), `#141413` (`ink`), `#080c0b` (`shaderCanvasDark`).
* **Approved Brand & Category Hues**: Mint/Teal `[140..188 deg]` (`#10b981`, `#14b8a6`, `#047857`), Sky/Workflows Blue `[188..232 deg]` (`#bae6fd`, `#60a5fa`, `#3b82f6`), Design System Purple `[252..292 deg]` (`#a855f7`), Rust/Relayer Amber `[24..56 deg]` (`#f59e0b`), and Destructive Diff Red `[345..360, 0..18 deg]` (`#ef4444`).

| Frame Still (`video/out/qa-film/`) | Timestamp | Sorbet Neutral | Mint / Teal | Sky Blue | Amber / Purple / Red | Foreign Hue (`< 2.0%` max) | Verdict |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `m01_s1_cloudsky_t03.2s.png` | `03.20s` | `54.29%` | `0.58%` | `45.10%` | `0.02%` | `0.0123%` | PASS |
| `m02_s2_logocollapse_t08.8s.png` | `08.80s` | `82.56%` | `17.38%` | `0.00%` | `0.02%` | `0.0247%` | PASS |
| `m03_s3_promptroll_laptop_t14.5s.png` | `14.50s` | `87.96%` | `11.81%` | `0.11%` | `0.08%` | `0.0340%` | PASS |
| `m04_s3_bezel_dive_t17.2s.png` | `17.20s` | `94.11%` | `5.56%` | `0.15%` | `0.16%` | `0.0278%` | PASS |
| `m05_s4_ch01_texthighlight_t20.0s.png` | `20.00s` | `81.26%` | `18.61%` | `0.01%` | `0.09%` | `0.0370%` | PASS |
| `f01_s5_run_live_recall_t25.1s.png` | `25.10s` | `93.53%` | `6.46%` | `0.00%` | `0.00%` | `0.0031%` | PASS |
| `f02_s5_callout_0deg_t29.0s.png` | `29.00s` | `93.10%` | `6.50%` | `0.01%` | `0.35%` | `0.0340%` | PASS |
| `m06_s6_ch02_punchlines_t34.8s.png` | `34.80s` | `82.44%` | `17.56%` | `0.00%` | `0.00%` | `0.0000%` | PASS |
| `f03_s7_compare_callout_0deg_t38.5s.png` | `38.50s` | `95.42%` | `4.24%` | `0.04%` | `0.27%` | `0.0278%` | PASS |
| `m07_t7_dotbloom_iris_t46.25s.png` | `46.25s` | `82.41%` | `17.57%` | `0.01%` | `0.01%` | `0.0000%` | PASS |
| `m08_s8_ch03_wordgather_t48.4s.png` | `48.40s` | `85.18%` | `14.77%` | `0.02%` | `0.02%` | `0.0093%` | PASS |
| `f04_s9_skillmd_callout_0deg_t53.0s.png` | `53.00s` | `95.95%` | `3.93%` | `0.05%` | `0.03%` | `0.0340%` | PASS |
| `f05_s9_live_skillforcegraph_t58.5s.png` | `58.50s` | `97.06%` | `2.75%` | `0.05%` | `0.11%` | `0.0247%` | PASS |
| `m09_s10_ch04_checkcycle_t62.8s.png` | `62.80s` | `83.71%` | `16.10%` | `0.06%` | `0.08%` | `0.0556%` | PASS |
| `f06_s11_connect_ides_callout_0deg_t68.5s.png` | `68.50s` | `93.18%` | `6.71%` | `0.07%` | `0.03%` | `0.0000%` | PASS |
| `m10_s12_terminal_endlockup_t78.0s.png` | `78.00s` | `85.64%` | `14.34%` | `0.00%` | `0.02%` | `0.0062%` | PASS |

**Peak foreign hue ratio across all 16 frames**: `0.0556%` (`36x` cleaner than the `< 2.0%` Gate 3 ceiling).

---

## 4. Callout Flattening, Non-Overlap, and Vision OCR Readability Audit

During every callout window in `LiveProductActs.tsx`, the 3D stage camera smoothly relaxes from its `8..11 deg` perspective yaw to `0.0 deg` flat (`level == 0.000`), holds for `>= 128 frames` (`4.27s..4.67s`, exceeding the `>= 90f` / `3.0s` minimum), and keeps both target ring and 2-line explainer card clear of frame edges (`>= 48px` rule) and clear of each other (`0.0 px^2` ring-to-card overlap). Native macOS `VNRecognizeTextRequest` OCR confirmed 100% verbatim legibility at `31px..41px` rendered glyph height (`>= 28px` phone readability floor).

| Scene & Act | Global Frame Window (`Hold`) | Sample Still (`Camera Tilt`) | Projected Target Ring (`x, y, w, h`) | Projected Callout Card (`x, y, w, h`) | Min Edge Margin | Ring/Card Overlap | Vision OCR Readback (`Rendered Height`) | Verdict |
| :--- | :---: | :---: | :--- | :--- | :---: | :---: | :--- | :---: |
| `S5` `LiveAct1EvalRecall` | `f=828..956` (`128f` / `4.27s`) | `f02` @ `29.0s` (`0.0 deg`) | `57, 746, 1806, 139` | `1118, 84, 639, 132` | `83.8 px` | `0.0 px^2` | `"Team rule recalled"` (`31px`) / `"Fetched live from Walrus before acting"` (`33px`) | PASS |
| `S7` `LiveAct2CompareVerdict` | `f=1110..1250` (`140f` / `4.67s`) | `f03` @ `38.5s` (`0.0 deg`) | `993, 118, 784, 76` | `1019, 871, 609, 132` | `77.4 px` | `0.0 px^2` | `"With Walrus Memory"` (`39px`) / `"Closes retired-app PR as not planned"` (`31px`) | PASS |
| `S9` `LiveAct3SkillGraph` | `f=1534..1674` (`140f` / `4.67s`) | `f04` @ `53.0s` (`0.0 deg`) | `361, 402, 1231, 91` | `679, 514, 594, 132` | `434.5 px` | `0.0 px^2` | `"Rules live with skills"` (`31px`) / `"Update once and every agent follows"` (`33px`) | PASS |
| `S11` `LiveAct4ConnectIdes` | `f=1994..2134` (`140f` / `4.67s`) | `f06` @ `68.5s` (`0.0 deg`) | `457, 335, 642, 88` | `924, 580, 564, 132` | `367.7 px` | `0.0 px^2` | `"Every coding agent"` (`36px`) / `"One MCP config shares team memory"` (`41px`) | PASS |

---

## 5. Secret, Internal ID, and Mock-Tag DLP Audit (`ripgrep` + Apple Vision OCR)

Scanned both the entire Remotion source tree (`video/src/**`) via `ripgrep` and all `16` rendered `1920 x 1080` PNG keyframes (`390` recognized OCR text spans across `video/out/qa-film/*.png`) via compiled macOS `Vision` (`VNRecognizeTextRequest`, `.accurate` recognition level, language correction disabled so hex/key tokens are never auto-corrected).

| DLP Rule / Pattern | Source Code (`video/src/**`) | Rendered Frames OCR (`16` Stills, `390` Spans) | Verdict |
| :--- | :---: | :---: | :---: |
| Sui Bech32 Private Key (`suiprivkey1...`) | `0` matches | `0` matches | PASS |
| Raw Hex Secret / Digest (`[0-9a-fA-F]{40,}`) | `0` matches | `0` matches (truncated public blob ID `zjcqsfXK...aclk` only) | PASS |
| Internal Tracker IDs (`WALM-[0-9]+`) | `0` matches | `0` matches | PASS |
| Mock / Fixture Watermarks (`\bmock\b`) | `0` matches | `0` matches (`PASS * WALRUS RECALL` live run verified) | PASS |

---

## 6. Nimbus Gate 3 Mandatory Checklist (`nimbus-gate-checklist.md` Sections C, E, F)

### Section C * Visual Fidelity & Design System
- [x] **Auto-Generated Palette (`video/scripts/gen-palette.mjs` -> `video/src/palette.ts`)**: Verified programmatic token extraction citing exact lines in `src/index.css`, `fullscreen-shader-background.tsx`, and `SkillsWorkspace.tsx`.
- [x] **Zero Invented Colour Fields or Blur Blobs**: All 12 scenes sit on `PALETTE.shaderCanvasLight` (`#f5f6f1`) + `ChromaCurrentBackdrop` (with `bootSkyTop` `#bae6fd` restricted strictly to Scene 1 `OriginCloudHookScene`); peak foreign hue across 16 frames is `0.0556%` (`< 2.0%`).
- [x] **Exact App Typography Only**: Verified `Inter` (`PALETTE.fontSans`) and `JetBrains Mono` (`PALETTE.fontMono`) across all scenes, callouts, and terminal windows.
- [x] **3D Tilted Camera Rig + Flat-on-Callout Rule**: `LiveProductActs.tsx` rides a subtle 3D perspective camera (`8..11 deg` yaw, `2..2.5 deg` pitch) and smoothly relaxes to `0.0 deg` flat across every callout window (`f02`, `f03`, `f04`, `f06`), then resumes tilt cleanly.
- [x] **Framing & Phone Readability**: Real `take.mp4` fills full stage framing (`zoom 1.06..1.52`), and Vision OCR verified `31px..41px` rendered height on all 8 callout lines (`>= 28px` floor).

### Section E * Build, Automated Callout Layout & QA
- [x] **Zero Callout-Over-Text Collisions & Safe Margins**: Verified `0.0 px^2` ring-to-card overlap, `77.4px..434.5px` minimum frame-edge margins (`>= 48px`), `128f..140f` hold durations, and generated both `docs/demo/preview/motion-frames.png` and `docs/demo/preview/footage-callouts.png`.
- [x] **Single Pointer Rule**: `LiveProductActs.tsx` renders accent click-ripple pulses synced to real `clicks` timestamps in `take.mp4` without duplicating a second synthetic pointer arrow over the recorded app cursor.
- [x] **FFmpeg Automated QA Suite Passes 100%**: `ffprobe` (`1920x1080`, `30/1` fps, `2400` frames, `80.000000s`, `h264`, `yuv420p`, stereo `aac`), `loudnorm` (`-14.02 LUFS`, `-1.48 dBTP`), `73.55s..73.95s` breath (`-77.63 dB` RMS), `blackdetect` (`0` hits), `freezedetect` (`0` footage stalls), and 16-frame palette audit (`<= 0.0556%` foreign hue) all pass 100%.
- [x] **Clean Separation of Concerns**: Zero files under `src/` app logic were modified during video build, rendering, mastering, or QA.

### Section F * Anti-Drift & Formatting Hygiene
- [x] **Zero Secret / Internal ID / Mock Leaks**: `0` matches across source code and 16-frame Apple Vision OCR for `suiprivkey1`, `40+` char hex strings, `WALM-[0-9]+`, and `"mock"`.
- [x] **Zero Em-Dashes or En-Dashes in Prose**: Verified `0` occurrences of `\u2014` or `\u2013` anywhere in `docs/video/QA.md`.
- [x] **All Required Deliverables Written & Verified on Disk**: `video/out/walrus-memory-promo.mp4`, `video/out/walrus-memory-promo-real.mp4`, `docs/demo/preview/walrus-memory-preview-720p.mp4`, `docs/demo/preview/motion-frames.png`, `docs/demo/preview/footage-callouts.png`, and `docs/video/QA.md`.
