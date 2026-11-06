# 5. Design direction and system

## Three directions

Concept stills for each are in `docs/ux/concepts/` (built with the Stageshow kit; see `docs/ux/concepts/README.md`). The chosen direction, B, is shot for every screen in `docs/ux/concepts/stills-dark/`.

| | A. Calm workspace | B. Command center | C. Guided story |
| :--- | :--- | :--- | :--- |
| **Feel** | A quiet tool you live in, like Linear or Notion | A live operations screen for agents | A friendly, step by step product page |
| **Ground** | Warm white, gray hairlines | Near black, surface steps | White with soft emerald tint cards |
| **Home leads with** | Getting started checklist and activity | Live agents and rules applied today | The before and after card and three steps |
| **Best for** | Daily use by a team | A wow moment on a big screen | Judges and first time visitors |
| **Risk** | Can look plain if the activity feed is empty | Dark UIs hide hierarchy if overused; hard on long SKILL.md reading | Feels like marketing once you use it daily |

## Decision (2026-11-03)

The owner chose **B. Command center** for the whole product. The original recommendation was A with C's Home card; B is the decision.

How B handles its known risks:

1. **Long documents:** SKILL.md renders on a raised reading surface (`surface` one step lighter than the page) with full contrast body text at 15px and a 68 character measure, so reading stays comfortable on dark.
2. **Hierarchy:** depth comes from surface steps, not shadows. One lit color (emerald) marks the single primary action and live states only.
3. **First visit:** Home keeps C's before and after card and the getting started checklist, styled dark, so the story still lands in the first screen.
4. **Light theme:** the theme toggle stays; light is a fallback, designed second.

## Tokens

### Color (dark first)

Dark is the default theme. Light is the fallback and is designed second.

| Token | Dark (default) | Light (fallback) | Use |
| :--- | :--- | :--- | :--- |
| `bg` | `#0b0f0e` | `#f7f7f4` | Page ground, the darkest step |
| `surface` | `#121816` | `#ffffff` | Cards, panels, the sidebar |
| `surface-2` | `#18201e` | `#f1f2ee` | Inputs, hover, selected nav item |
| `raised` | `#1d2624` | `#ffffff` | The SKILL.md reading surface and popovers |
| `line` | `rgba(255,255,255,0.09)` | `rgba(20,20,19,0.08)` | Hairlines |
| `ink` | `#f4f6f5` | `#141413` | Primary text |
| `ink-2` | `#a7b0ad` | `#52525b` | Secondary text |
| `ink-3` | `#8f9996` | `#6b6b74` | Placeholder, meta, timestamps |
| `accent` | `#34d399` | `#047857` | The one primary action, live dots, verified marks, chart bars |
| `on-accent` | `#04140d` | `#ffffff` | Text on a filled accent button |
| `accent-soft` | `rgba(52,211,153,0.14)` | `rgba(4,120,87,0.10)` | Selected rows, success pills |
| `warn` | `#f59e0b` | `#a84e07` | Flagged address, pending key |
| `danger` | `#f87171` | `#dc2626` | Failed save, delete, the "without rules" verdict |

Rules for the dark look:

1. **Depth from surface steps, not shadows.** `bg` under `surface` under `surface-2` under `raised`. Shadows only on floating layers (menus, the proof drawer).
2. **One lit color.** Emerald appears on the primary action, live status, verified marks and charts only. Never on body text or section titles.
3. **No pure black and no pure white.** `bg` and `ink` above keep contrast high without glare.
4. **Contrast floors:** `ink` on `surface` and `ink-2` on `surface` pass WCAG 4.5:1; `ink-3` is for meta only, never for anything a user must read to act. Four values changed on 4 Nov when measured during the build: light `warn` was `#b45309` (4.47:1 on `surface-2`), dark `ink-3` was `#77817e` (3.86:1 on `raised`), light `ink-3` was `#8a8a93` (3.04:1 on `surface-2`), and light `accent` was `#059669` (3.77:1 with white button text). All four now pass 4.5:1 on every surface.
5. **Reading surface.** SKILL.md renders on `raised` with `ink` body text at 15px, line height 1.6 and a 68 character measure.
6. **No purple, no gradients on text, no glow** except the focus ring and the live dot.

### Type

| Role | Size and weight | Font |
| :--- | :--- | :--- |
| Page title | 28px, 600 | Inter |
| Section title | 20px, 600 | Inter |
| Body | 14px (16px on mobile), 400 | Inter |
| Meta and labels | 12px, 500 | Inter |
| Code, commands, ids | 13px, 500 | JetBrains Mono |
| Hero number (Home stats only) | 40px, 600, tabular numerals | Inter |

### Shape and space

| Token | Value |
| :--- | :--- |
| Spacing grid | 4px; card padding 16 or 20px; section gap 24px |
| Radius | 8px controls, 12px cards, 16px windows and drawers |
| Shadow | One soft shadow for floating layers only; cards use hairlines |
| Control height | 32px desktop, 40px inputs, 44px mobile primary |
| Focus ring | 2px accent, 2px offset |

### Components to build (in this order)

1. `AppShell`: sidebar, header with space switcher and user menu, mobile bottom bar.
2. `IdPill`: truncated monospace identifier with copy and tooltip.
3. `RuleRow`: text, author, age, toggle, menu, with saving and failed states.
4. `ActivityRow`: actor avatar or agent logo, sentence, time, proof link.
5. `ChecklistCard`: steps with their own buttons and live ticks.
6. `VerdictCard`: one side of Try it, with verdict pill and streaming plan.
7. `MemberRow`: avatar, handle, `IdPill`, role, verification line.
8. `AgentTile`: logo, name, status dot, last seen.
9. `ProofDrawer`: grouped ids with external links.
10. `StateFrame`: shared loading, empty, error, offline and read only wrappers.

## Microcopy rules

1. Name the thing, then the result: "Rule saved", "Claude Code recalled 2 rules".
2. No protocol words in primary copy: say "verified on Sui", not "SEAL protected"; "your key", not "delegate key", except in the advanced sign in.
3. One helper line at most under a field, 60 characters or fewer.
4. Errors say what failed, what was kept, and what to do: "Couldn't save to Console. Your edit is kept. Retry".
