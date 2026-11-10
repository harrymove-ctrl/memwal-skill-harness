# Skillbook Full Showcase Video & X Launch Cut

## 1. Overview & Technical Specifications

1. **Master Showcase Composition (`Skillbook-Showcase`)**: `176.0s` (`2:56.0`), `88 bars` at `120 BPM` (`1 bar = 2.0s = 60 frames`, `1 beat = 0.5s = 15 frames`), `1920x1080`, `30 fps` (`5280 frames`), `H.264 yuv420p`, `AAC 48 kHz stereo` mastered to `-14 LUFS` and `<= -1 dBTP`, zero voiceover.
2. **X Launch Cut (`Skillbook-Launch-X`)**: `44.0s` (`0:44.0`), `22 bars` at `120 BPM` (`1320 frames` at `30 fps`), `1920x1080`, re-timed from the same scene components and sound bank.
3. **Audience & Voice**: Plain, direct user-addressed English (`you`, `your team`, `your agents`), zero character names, zero mock labels, zero internal tracker identifiers, zero exposed keys.

## 2. Brand & Token Inheritance (`src/shell/tokens.css`)

Every motion card, callout, and `@snapcn/*` provider token derives from `src/shell/tokens.css`:

| Token | Value | Source | Role in Video |
|---|---|---|---|
| `BG` | `#0b0f0e` | `tokens.css` `.dark --cc-bg` | Primary dark stage and dot-grid ground |
| `SURFACE` | `#121816` | `tokens.css` `.dark --cc-surface` | Motion card and terminal surfaces |
| `SURFACE_2` | `#18201e` | `tokens.css` `.dark --cc-surface-2` | Elevated tiles and agent pills |
| `RAISED` | `#1d2624` | `tokens.css` `.dark --cc-raised` | Interactive pills and controls |
| `LINE` | `rgba(255, 255, 255, 0.09)` | `tokens.css` `.dark --cc-line` | Hairline borders |
| `INK` | `#f4f6f5` | `tokens.css` `.dark --cc-ink` | Primary headline and UI ink |
| `INK_2` | `#a7b0ad` | `tokens.css` `.dark --cc-ink-2` | Supporting labels and subcopy |
| `ACCENT` | `#34d399` | `tokens.css` `.dark --cc-accent` | Single emerald highlight, rings, active switches |
| `ON_ACCENT` | `#04140d` | `tokens.css` `.dark --cc-on-accent` | Ink over emerald fills |
| `WARN` | `#f59e0b` | `tokens.css` `.dark --cc-warn` | Amber role accent |
| `DANGER` | `#f87171` | `tokens.css` `.dark --cc-danger` | Refused key and without-rules verdict |

## 3. Master Timeline (`88 Bars` = `176.0s` = `5280 Frames @ 30fps`)

| Scene | Bars | Time (s) | Frames | Skill / Component | On-Screen Action & Copy |
|---|---|---|---|---|---|
| `S01` | `0..4` (`4`) | `0.0..8.0` | `0..240` | `@snapcn/orb-swarm` | Six-beat problem hook on `#0b0f0e` with `#34d399` glass orbs: `every session \| what if \| your coding agents \| never repeated \| an old mistake \| ever again` |
| `S02` | `4..6` (`2`) | `8.0..12.0` | `240..360` | `@snapcn/block-wordmark` + `Mark` | `Skillbook` builds out of role-colored blocks with the Walrus `Mark` glint badge |
| `S03` | `6..9` (`3`) | `12.0..18.0` | `360..540` | `@snapcn/laptop-frame` | Lid opens (`entrance="open"`) showing the clean signed-out Skillbook gate, then `finale="zoom-to-screen"` dives through the bezel into live footage |
| `S04` | `9..11` (`2`) | `18.0..22.0` | `540..660` | `@snapcn/word-gather` | Chapter 01 over dark `ChromaCurrentBackdrop`: `Sign in once. Unlock your team's space.` |
| `S05` | `11..19` (`8`) | `22.0..38.0` | `660..1140` | `Footage` (`showcase.mp4` Act 1) | Clean signed-out gate (`Sign in to load your account`) -> Sign in modal with `Slush` and `Google (Mysten Enoki zkLogin)` -> signs in -> `Live` view unlocks with WebGL background, 3D `Claude Code` badge, and glowing 3D Bayer-dithered `SignerOrb3D` avatars |
| `S06` | `19..26` (`7`) | `38.0..52.0` | `1140..1560` | `SkillbookLoopScene` | Tactile 14s loop: one white ball flips a rule switch, fills `100%` team agents, triggers `Claude Code` / `Cursor` / `Codex` cards, and types `skip staging` |
| `S07` | `26..28` (`2`) | `52.0..56.0` | `1560..1680` | `@snapcn/text-highlight` | Chapter 02 (`preset="marker"`): `You teach a rule` + highlighted `once.` |
| `S08` | `28..36` (`8`) | `56.0..72.0` | `1680..2160` | `Footage` (`showcase.mp4` Act 2) | `/skills?skill=memwal-qa`: inspects team rules beside the skill, types `Staging is retired, promote directly from dev to main`, clicks `Add rule` |
| `S09` | `36..40` (`4`) | `72.0..80.0` | `2160..2400` | `@snapcn/punch-lines` + `SkillbookOrbitFlow` | Punch cards (`One shared space. \| Claude, Cursor, Codex. \| Antigravity & Tatum AI.`) into dark 3D `OrbitFlow` (`Always in sync, across every IDE`) |
| `S10` | `40..47` (`7`) | `80.0..94.0` | `2400..2820` | `Footage` (`showcase.mp4` Act 3) | `/agents`: clicks across the five 3D brand-badged tiles (`Claude Code`, `Cursor`, `Codex`, `Antigravity`, `Tatum AI`) and shows zero-secret MCP setup |
| `S11` | `47..49` (`2`) | `94.0..98.0` | `2820..2940` | `@snapcn/check-cycle` | Chapter 04: `Rules prevent` cycling `Retired app approvals, Stale staging deploys, Repeated review bugs, Broken CI merges` |
| `S12` | `49..56` (`7`) | `98.0..112.0` | `2940..3360` | `Footage` (`showcase.mp4` Act 4) | `/try`: runs `memwal-qa` task and compares `Without the team's rules` vs `With the team's rules` plus the named rule that changed the call |
| `S13` | `56..58` (`2`) | `112.0..116.0` | `3360..3480` | `SkillbookMetricMorph` | `Closes it and saves 18m` capsule collapses into a square and slams into the recall impact bar chart (`20 skills · 5 coding agents`) |
| `S14` | `58..66` (`8`) | `116.0..132.0` | `3480..3960` | `@snapcn/dot-bloom` + `Footage` (Act 5) | Halftone `DotBloom` wipe into `/team` (emerald, amber, violet 3D Bayer-dithered `SignerOrb3D` orbs verified via Tatum Sui RPC) and `Proof` drawer (live mainnet memories and Walrus blobs) |
| `S15` | `66..80` (`14`) | `132.0..160.0` | `3960..4800` | `SkillbookHoodScene` | Under the hood horizontal world: `Seal` client-side encryption -> `Walrus` distributed slivers -> `Sui` Move key check -> `Tatum` Sui RPC scan -> `Recall` |
| `S16` | `80..83` (`3`) | `160.0..166.0` | `4800..4980` | `@snapcn/count-grid` | Counts `1` to `94+` `mainnet memories` pulling back across real captured Skillbook interface cards |
| `S17` | `83..88` (`5`) | `166.0..176.0` | `4980..5280` | `@snapcn/terminal-simulator` + `SkillbookLockup` | Runs `claude mcp add memwal` in dark terminal, pauses one beat, and resolves to the `Skillbook` lockup (`Teach your agents once. Every agent remembers.` + `pnpm dev`, held `5.0s`) |

## 4. X Launch Cut (`22 Bars` = `44.0s` = `1320 Frames @ 30fps`)

1. `0.0..4.0s` (`2 bars`): `@snapcn/orb-swarm` fast hook.
2. `4.0..8.0s` (`2 bars`): `@snapcn/block-wordmark` (`Skillbook`) + `@snapcn/laptop-frame` bezel dive.
3. `8.0..16.0s` (`4 bars`): Live Act 1 Sign-in (`Slush` + `Google · Enoki zkLogin`) unlocking `Live` recall stream & 3D signer orbs.
4. `16.0..24.0s` (`4 bars`): `@snapcn/text-highlight` (`once.`) + Live Act 2 teaching a rule on `/skills`.
5. `24.0..32.0s` (`4 bars`): Live Act 3 `/agents` 3D brand logos + Live Act 4 `/try` side-by-side verdict.
6. `32.0..38.0s` (`3 bars`): `/team` 3D orbs + `Proof` mainnet Walrus blobs.
7. `38.0..44.0s` (`3 bars`): `@snapcn/terminal-simulator` + `Skillbook` final lockup held `> 3.5s`.
