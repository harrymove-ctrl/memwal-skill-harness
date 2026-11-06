# Walrus Memory promo, v2 cut sheet

1920x1080, 30 fps, 42.0 s (1260 frames), stereo. Output: `out/walrus-memory-promo-v2.mp4`.
This replaces `CREATIVE_DIRECTOR_SCRIPT.md`, which quoted eval numbers (38% to 96%) and a domain that do not exist in the app.

## Scenes

| Frames | Scene | Source | What happens |
| :--- | :--- | :--- | :--- |
| 0 to 165 | Cloud sky + Word Gather | `scenes/Scene1SkyIntro.tsx` | "Shared memory every agent recalls." over the OriginKit cloud sky |
| 156 to 336 | Logo Collapse | `scenes/Scene2LogoCollapse.tsx` | Context cards collapse into the mark; logo lands on f220 |
| 327 to 580 | Prompt Roll | `scenes/ScenePromptRoll.tsx` (custom; snapcn Prompt Roll is a paid component) | "Give every agent your team's [QA flows, review checklists, Rust patterns, issue replies, SKILL.md graph] on Walrus." Camera whips to the send button, which draws itself in; the press makes a halo, the arrow flies off, the frame washes to white |
| 580 to 769 | Click Type | `scenes/SceneClickType.tsx` wrapping the official `@snapcn/click-type` | Hard cut from white; cursor clicks the composer, prompt "Review PRs, then promote to main" types at the caret |
| 760 to 1132 | App Reveal | `scenes/SceneAppReveal.tsx` (custom; snapcn App Reveal is a paid component) | Wordmark holds, folds into the header of a card that builds around it, camera dives, rolls and settles while the greeting types; chips land on the beat; input bar arrives; pointer runs the trajectory eval for `memwal-review` |
| 1120 to 1260 | End card | `scenes/SceneEndCard.tsx` | Mark, "Your team's skills, recalled by every agent.", `npx @mysten-incubation/memwal-mcp`, `docs.wal.app/walrus-memory` |

## Real data on screen

- Namespace `memwal-team-skills` with 14 skills (README, `skills/`).
- Verdict strings `FAIL / STALE RULE` and `PASS · WALRUS RECALL` from `src/components/TrajectoryEvalHarness.tsx`.
- Team rule and blob `zjcqsfXK…aclk` by `@harrymove-ctrl` from `src/data/flowMemoriesSeed.ts` (memwal-review).

## Sound

`scripts/generate-score.mjs` writes a deterministic 120 BPM score anchored on the logo hit:

| Time | Frame | Section |
| :--- | :--- | :--- |
| 0.00 s | 0 | Intro: pad, airy arp, filter opening, reverse swell |
| 7.33 s | 220 | Drop A on the logo landing |
| 19.33 s | 580 | Breakdown under Click Type |
| 25.33 s | 760 | Drop B on the App Reveal wordmark |
| 37.33 s | 1120 | Final chord on the end card, rings out |

SFX cues (typing, wheel ticks, whip, press halo, pops, click, pass chime) are built in `src/WalrusPromoVideo.tsx` from the same frame constants the scenes use.

## snapcn components

Installed from the registry into `src/components/snap-cn/` and `src/lib/snap-cn-ui/`: word-gather, logo-collapse, click-type, plus their dependencies (input, caret, cursor-track, snap-cn-ui core). Scenes 1 and 2 still use the earlier local ports in `src/components/snapcn/`. Prompt Roll and App Reveal return HTTP 402 from the registry, so those two scenes are custom builds of the published descriptions.

## Commands

```bash
npm run audio:gen
npm run render
npm run qa:stills -- '[["S5-AppReveal",340]]'
```

Rendering needs Chromium, which the Claude Code Bash sandbox blocks; run renders from a normal terminal. Google Fonts load at render time, so the machine needs network access.
