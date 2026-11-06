---
name: concise-ui-copy
description: Enforces ultra-concise, visual-first UI microcopy, release cards, wallet hubs, modals, and changelogs across web apps and games. Replaces dense multi-sentence developer paragraphs and button soup with 2-to-5 word titles, single-sentence plain-English summaries (<= 14 words), balanced 2x2 grids, and <= 3 action buttons per card. Activate whenever authoring or reviewing UI modals, wallet hubs, What's New dialogs, onboarding cards, HUD tooltips, or release notes.
---

# Concise UI Copy & Visual-First Microcopy (`concise-ui-copy`)

## Core Rules (Hard Gate)

Whenever writing or updating in-app modals, wallet hubs (`openWifHub`), leaderboards (`openTradersBoard`), `What's New` sheets (`openWhatsNewModal`), start-screen mode cards, or release feeds:

1. **Card & Section Title (`<h3>` / `<h4>`)**:
   1. Maximum **6 words** (target **2 to 5 words**).
   2. Lead with the player outcome or clear noun, never internal module names or long chain disclaimers.

2. **Card & Section Summary (`<p>` / `<small>`)**:
   1. Maximum **15 words** (target **8 to 12 words**, **1 short sentence**).
   2. Never stack 2 or 3 sentences inside a modal card or entry mode button.

3. **Zero Button Soup (Max 3 Actions per Card)**:
   1. Maximum **3 buttons/links** per `.wif-row-actions` group inside any modal card.
   2. Move secondary external links (explorers, docs, RSS feeds) into a single compact footer line at the bottom of the modal.
   3. Use balanced **2x2 grids** (or clean 4-row vertical stacks) instead of giant full-width multi-row walls of controls.

4. **Strict Zero-Dashes Prose**:
   1. Never use em-dashes, en-dashes, or spaced hyphen separators in UI copy.

## Automated Audit Script

Always run the executable auditor against UI source files before building or deploying:

```bash
node ~/.agents/skills/concise-ui-copy/scripts/audit-ui-copy.mjs <path-to-ui-file.ts>
```
