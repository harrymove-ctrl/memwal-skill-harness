# Walrus Memory Master Script (`80.00s` Real-Product Film)

**Project**: `Walrus Memory` (`memwal-skill-harness`)  
**Canvas**: `1920 x 1080` (`16:9` Full HD), `30 fps`, `2400 frames` (`80.00s`)  
**Musical Grid**: `120 BPM` (`1 beat = 15 frames = 0.50s`, `1 bar = 60 frames = 2.00s`, `40.00 bars` total)  
**Audio Policy**: Zero voiceover and zero bottom transcript subtitles. Kinetic chapter cards, real recorded UI footage (`video/public/take/take.mp4`), flattened 2-line explainer callouts, harmonic score, and tactile UI sound effects carry the entire story.

## 1. Story Thesis and Copy Guardrails

Every coding agent starts cold when team conventions sit trapped inside chat logs or static prompt files. Walrus Memory stores your team's `SKILL.md` skill graph and live flow rules inside one shared Walrus namespace accessed through `@mysten-incubation/memwal-mcp`. You teach a rule once, and every run across Claude Code, Cursor, Codex, and Antigravity recalls that rule live before your agent acts.

### Enforced Writing Rules

1. **Neutral User-Addressed Voice**: Address the viewer directly as `you` and `your`. Zero fictional persona names and zero personal handles appear in copy or callouts. Fixtures refer strictly to roles (`Teammate`, `Reviewer`, `Your coding agent`).
2. **Strict Anti-Slop Copy Caps**:
   * Hook lines and chapter cards: `<= 8 words` per line, maximum `2 lines` per card.
   * Callout Line 1 (`what`): `<= 6 words`, `36px`, weight `650`, `#141413` (`PALETTE.ink`).
   * Callout Line 2 (`why`): `<= 9 words`, `28px`, weight `500`, `#52525b` (`PALETTE.ink2`).
   * Every callout remains open for `>= 4.00s` (`>= 120 frames`), with `>= 3.00s` (`>= 90 frames`) between consecutive text cards.
3. **Verifiable Product Artifacts Only**: Every screen recording, rule recall banner, side-by-side trajectory comparison, 14-skill force graph, and `.mcp.json` configuration comes directly from the live `memwal-skill-harness` application (`http://localhost:5188`) with sensitive keys redacted at capture time.

## 2. TransitionSeries Frame Math (`2400 Frames = 40.00 Bars`)

All twelve scenes assemble inside a deterministic Remotion `<TransitionSeries>` where eleven `15-frame` (`1 beat = 0.50s`) transitions overlap adjacent scenes:

* Sum of raw scene durations (`D1..D12`): `165 + 165 + 255 + 105 + 345 + 105 + 345 + 105 + 345 + 105 + 345 + 180 = 2565 frames`
* Sum of eleven transition overlaps (`T1..T11`): `11 x 15 = 165 frames`
* Exact rendered master duration: `2565 - 165 = 2400 frames` (`80.00s = 40.00 bars @ 120 BPM`)

## 3. Bar-by-Bar 12-Scene Master Cut (`80.00s`)

| Scene | Start `S` (`f`) | Duration `D` (`f`) | Global Span (`f`) | Time (`s`) | Elapsed Bars (`120 BPM`) | Outgoing Transition `T` | Visual Action & Real Footage Window | Exact On-Screen Copy & Explainer Callouts |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- | :--- | :--- |
| **Scene 1: Hook** | `0` | `165` | `0..165` | `0.00s..5.50s` | `0.00..2.75` | `T1=15` `fade` (`f=150..165`) | `OriginKit CloudSky` (`preset=base`, `#bae6fd` zenith blending into `#f5f6f1` horizon) with `@snapcn/word-gather` assembling headline words in `#10b981` and settling to `#141413` ink. | **Hook** (`7 words`):<br>`"Every agent forgets what your team learned."` |
| **Scene 2: Brand Lockup** | `150` | `165` | `150..315` | `5.00s..10.50s` | `2.50..5.25` | `T2=15` `slide-from-bottom` (`f=300..315`) | `@snapcn/logo-collapse` on light `#f5f6f1` `ChromaCurrent` (`#10b981` and `#14b8a6` dot streams). Radial skill and rule plates implode into the 3D `WalrusLogo3D` mark on **DROP A** at `f=180` (`6.00s`, `Bar 3.00`). | **Lockup** (`2 words`): `"Walrus Memory"`<br>**Subline** (`6 words`): `"Shared team skills and live recall"` |
| **Scene 3: Composer & Bezel Dive** | `300` | `255` | `300..555` | `10.00s..18.50s` | `5.00..9.25` | `T3=15` `fade` (`f=540..555`) | Light `#f5f6f1` stage. `PromptRoll` (`@snapcn/word-wheel` + `@snapcn/prompt-send`) cycles four recall capabilities (`f=300..449`), clicks Send at `f=450` (`15.00s`, `Bar 7.50`), then `@snapcn/laptop-frame` opens with live `take.mp4` and dives through the bezel (`f=450..540`) into full-bleed `1920x1080`. | **Lead** (`4 words`): `"Give your agent live"`<br>**Slot Reel**: `team review rules` / `QA test flows` / `Rust SDK patterns` / `SKILL.md graph`<br>**Tail** (`2 words`): `"on Walrus."`<br>**Notch Pill**: `"memwal-mcp connected"` |
| **Scene 4: Ch 01 Card** | `540` | `105` | `540..645` | `18.00s..21.50s` | `9.00..10.75` | `T4=15` `fade` (`f=630..645`) | Chapter 01 motion turn on `#f5f6f1` `ChromaCurrent` using `@snapcn/text-highlight` (`preset="marker"`, `#10b981` mint marker sweep across `"Recall live"`). | **Eyebrow**: `"01 / LIVE RECALL"`<br>**Headline** (`7 words`):<br>`"Teach once. Recall live in every run."` |
| **Scene 5: Ch 01 Footage** | `630` | `345` | `630..975` | `21.00s..32.50s` | `10.50..16.25` | `T5=15` `slide-from-right` (`f=960..975`) | Real app `/eval` (`1 Demo` tab, `take.mp4` `5.00s..15.92s` at `0.95x`). Rides `9 deg` 3D camera, clicks `Run Live Recall` at `f=754` (`25.13s`), then flattens to `0 deg` across `f=815..960` (`4.83s`) for Callout 1 on the recalled banner. | **Callout 1** (`f=815..960`, `145f = 4.83s`):<br>`what` (`4 words`): `"Live recall from Walrus"`<br>`why` (`8 words`): `"Pulls the team rule before your agent answers"` |
| **Scene 6: Ch 02 Card** | `960` | `105` | `960..1065` | `32.00s..35.50s` | `16.00..17.75` | `T6=15` `fade` (`f=1050..1065`) | Chapter 02 motion turn on `#f5f6f1` `ChromaCurrent` using `@snapcn/punch-lines`: statement card slides in (`f=960..1005`), then hero card punches up (`f=1005..1065`) with `#047857` emphasis on `"shared memory."` | **Card 1** (`3 words`): `"Stale static prompt"`<br>**Card 2** (`4 words`): `"vs. live shared memory."` |
| **Scene 7: Ch 02 Footage** | `1050` | `345` | `1050..1395` | `35.00s..46.50s` | `17.50..23.25` | `T7=15` `dotBloom` (`f=1380..1395`) | Real app `/eval` side-by-side comparison (`Without MemWal` vs `With MemWal`, `take.mp4` `14.01s..19.50s` at `0.85x` with continuous drift). Camera flattens to `0 deg` for Callout 2A (`4.40s`) on left card and Callout 2B (`4.80s`) on right card. | **Callout 2A** (`f=1068..1200`, `132f = 4.40s`):<br>`what` (`3 words`): `"Without Walrus Memory"`<br>`why` (`8 words`): `"Approves pull request for a retired demo app"`<br>**Callout 2B** (`f=1224..1368`, `144f = 4.80s`):<br>`what` (`3 words`): `"With Walrus Memory"`<br>`why` (`8 words`): `"Applies your team rule and closes the PR"` |
| **Scene 8: Ch 03 Card** | `1380` | `105` | `1380..1485` | `46.00s..49.50s` | `23.00..24.75` | `T8=15` `fade` (`f=1470..1485`) | `@snapcn/dot-bloom` (`#10b981` halftone dots) opens Chapter 03 motion card on `#f5f6f1` `ChromaCurrent` with `@snapcn/word-gather`. | **Eyebrow**: `"03 / SKILL GRAPH"`<br>**Headline** (`7 words`):<br>`"Fourteen team skills in one living graph."` |
| **Scene 9: Ch 03 Footage** | `1470` | `345` | `1470..1815` | `49.00s..60.50s` | `24.50..30.25` | `T9=15` `slide-from-bottom` (`f=1800..1815`) | **DROP B** at `f=1470` (`49.00s`). Real app `/graph` (`Skills (14)`, `take.mp4` `28.50s..40.92s` at `1.08x`). Opens `memwal-review` `SKILL.md` for `0 deg` Callout 3A (`4.60s`), clicks `Graph` at `f=1659`, and flattens for Callout 3B (`4.07s`) on `SkillForceGraph`. | **Callout 3A** (`f=1492..1630`, `138f = 4.60s`):<br>`what` (`4 words`): `"Rules compiled into SKILL.md"`<br>`why` (`8 words`): `"Edit one rule and every teammate skill updates"`<br>**Callout 3B** (`f=1674..1796`, `122f = 4.07s`):<br>`what` (`4 words`): `"Live namespace skill graph"`<br>`why` (`7 words`): `"Links fourteen skills and shared flow memories"` |
| **Scene 10: Ch 04 Card** | `1800` | `105` | `1800..1905` | `60.00s..63.50s` | `30.00..31.75` | `T10=15` `fade` (`f=1890..1905`) | Chapter 04 motion turn on `#f5f6f1` `ChromaCurrent` using `@snapcn/check-cycle` (`#10b981` ticked checkbox with `20-frame` vertical slot rolls across all four supported coding agents). | **Lead**: `"One config for"`<br>**Slot Cycle**: `Claude Code` -> `Cursor` -> `Codex` -> `Antigravity` |
| **Scene 11: Ch 04 Footage** | `1890` | `345` | `1890..2235` | `63.00s..74.50s` | `31.50..37.25` | `T11=15` `fade` (`f=2220..2235`) | Real app `/cad` (`Connect` tab, `take.mp4` `41.50s..52.08s` at `0.92x`) stepping through `Claude Code` (`f=1943`), `Cursor` (`f=2018`), `Codex` (`f=2087`), and `Antigravity` (`f=2161`) with `0 deg` Callout 4 (`6.00s`). **1-beat complete musical silence** at `f=2205..2220` (`73.50s..74.00s`). | **Callout 4** (`f=1995..2175`, `180f = 6.00s`):<br>`what` (`4 words`): `"One shared MCP config"`<br>`why` (`8 words`): `"Works across Claude Code, Cursor, Codex, and Antigravity"` |
| **Scene 12: End Card** | `2220` | `180` | `2220..2400` | `74.00s..80.00s` | `37.00..40.00` | None (ends cleanly at `f=2400`) | Final chord lands on `f=2220` (`74.00s`, `Bar 37.00`). Light `#f5f6f1` `ChromaCurrent` stage with `WalrusLogo3D` lockup, `@snapcn/terminal-simulator` compact command pill (`npx @mysten-incubation/memwal-mcp`), and docs URL settled by `f=2256` and held still for `144 frames` (`4.80s >= 4.50s`). | **Lockup** (`2 words`): `"Walrus Memory"`<br>**Line 1** (`4 words`): `"Teach your agent once."`<br>**Line 2** (`5 words`): `"Every IDE recalls it live."`<br>**CLI**: `npx @mysten-incubation/memwal-mcp`<br>**Docs**: `docs.wal.app/walrus-memory` |

## 4. Callout Copy and Duration Verification Matrix

| Callout ID | Scene | Global Frames | Hold Frames | Hold Seconds (`>= 4.00s`) | Line 1 (`what`, `<= 6 words`) | Word Count | Line 2 (`why`, `<= 9 words`) | Word Count |
| :--- | :---: | :---: | :---: | :---: | :--- | :---: | :--- | :---: |
| **Callout 1** | Scene 5 | `815..960` | `145f` | `4.83s` | `Live recall from Walrus` | `4` | `Pulls the team rule before your agent answers` | `8` |
| **Callout 2A** | Scene 7 | `1068..1200` | `132f` | `4.40s` | `Without Walrus Memory` | `3` | `Approves pull request for a retired demo app` | `8` |
| **Callout 2B** | Scene 7 | `1224..1368` | `144f` | `4.80s` | `With Walrus Memory` | `3` | `Applies your team rule and closes the PR` | `8` |
| **Callout 3A** | Scene 9 | `1492..1630` | `138f` | `4.60s` | `Rules compiled into SKILL.md` | `4` | `Edit one rule and every teammate skill updates` | `8` |
| **Callout 3B** | Scene 9 | `1674..1796` | `122f` | `4.07s` | `Live namespace skill graph` | `4` | `Links fourteen skills and shared flow memories` | `7` |
| **Callout 4** | Scene 11 | `1995..2175` | `180f` | `6.00s` | `One shared MCP config` | `4` | `Works across Claude Code, Cursor, Codex, and Antigravity` | `8` |

## 5. Companion X Launch Cut (`42.00s / 1260 Frames / 21.00 Bars`)

For social posts requiring a tight sub-45-second edit, the existing `WalrusPromoReal` cut (`video/src/PromoReal.tsx`, `1260 frames @ 30fps`) compresses the same four real-footage chapters (`PromptRoll` -> `Recall` -> `Compare` -> `Skills` -> `Connect` -> `End Card`) onto the identical `#f5f6f1` Sorbet palette and `120 BPM` grid while the `80.00s` (`2400-frame`) master film serves as the flagship hackathon and product showcase cut.
