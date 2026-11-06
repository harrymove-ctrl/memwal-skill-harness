# Walrus Memory promo, real-app cut

1920x1080, 30 fps, 42.0 s (1260 frames), stereo. Composition `WalrusPromo` in `src/PromoReal.tsx`.
Output: `out/walrus-memory-promo-real.mp4`. The earlier motion-only cut stays available as `WalrusPromoMotionV2`.

The rule this cut follows: the app's real UI carries the story. Footage fills the frame on a slowly tilted camera, the tilt relaxes to flat whenever a two-line callout ("what it is" / "why it helps you") rings a real element, and the only designed motion is the Prompt Roll hook and the end card.

## Shots

| Frames | Shot | Take window | What the viewer sees | Callout |
| :--- | :--- | :--- | :--- | :--- |
| 0 to 253 | Prompt Roll (kept) | none | "Give every agent your team's [QA flows, review checklists, Rust patterns, issue replies, SKILL.md graph] on Walrus." Send button, halo, wash to white | none |
| 253 to 553 | Recall | 5.0 s to 15.4 s at 1.04x | Demo page, the cursor clicks Run Live Recall, the team rule comes back | "Team rule recalled" / "Written once by a teammate, kept on Walrus" |
| 553 to 793 | Compare | 15.4 s to 22.2 s at 0.85x | Without MemWal versus With MemWal, the real result cards, then the team rules list | "Without memory" / "Approves a PR for a retired app", then "With Walrus Memory" / "Closes it as not planned" |
| 793 to 1003 | Skills | 29.0 s to 36.9 s at 1.13x | memwal-review and its team rule, then the skill graph | "Team rules live with the skill" / "Change one, and every agent follows it" |
| 1003 to 1153 | Connect | 44.6 s to 50.2 s at 1.12x | Cursor, Codex and Antigravity tabs with the MCP config | "Every coding agent" / "One MCP config, the same team memory" |
| 1153 to 1260 | End card | none | MemWal mark, the app's tagline, `npx @mysten-incubation/memwal-mcp`, `docs.wal.app/walrus-memory` | none |

## The take

`scripts/record-take.mjs` drives the running dev server (`pnpm dev`, port 5188) with Playwright and writes `public/take/take.mp4` plus `src/take/beats.json` (beat times and target boxes).

- The page lays out like a 1280x720 window but paints at 1920x1080 (root zoom 1.5), so the UI fills the frame and stays sharp.
- An injected cursor draws on screen so every click reads.
- Secrets are masked at record time: any long hex or `suiprivkey` string shows its first four characters and dots. The Connect panel prints the real delegate key and account id, so this matters. The recorder fails if one is still visible.
- Internal tracker ids are masked the same way, and the recorder fails if one is visible on the compare screen.

Re-record:

```bash
pnpm dev
cd video && node scripts/record-take.mjs
```

Run it from a normal terminal. The Claude Code sandbox blocks Chromium.

## Sound

`scripts/generate-score.mjs` writes `public/audio/score-real.wav`: intro under the Prompt Roll, the first drop on frame 253 (first real footage), a short kick gap and the second drop on frame 793 (Skills), the final chord on frame 1153 (end card). SFX: the Prompt Roll cues, a click on every real click in the take, a soft pop when each callout opens.

## Render

```bash
cd video && TMPDIR=$PWD/.render-tmp npx remotion render src/index.ts WalrusPromo out/walrus-memory-promo-real.mp4
```

`TMPDIR` keeps Remotion's frame cache on the Dev volume; the internal disk is nearly full.
