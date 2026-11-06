# 1. Current UI audit

Captured 2026-11-03 from the running dev server (`pnpm dev`, port 5188) with `node video/scripts/audit-ui.mjs`. Screenshots and raw numbers are in `docs/ux/audit/`. Secrets on screen are masked by the audit script.

## What a first time visitor sees

| Screen | Screenshot (desktop 1280x800) | Mobile (390x844) |
| :--- | :--- | :--- |
| Sign in | `audit/before-signin-desktop.png` | `audit/before-signin-mobile.png` |
| Playground | `audit/before-playground-desktop.png` | `audit/before-playground-mobile.png` |
| Skills | `audit/before-skills-desktop.png` | `audit/before-skills-mobile.png` |
| Connect | `audit/before-connect-desktop.png` | `audit/before-connect-mobile.png` |

## Measured problems

| Screen | Words on screen | Controls under 32px tall or wide | Text elements under 12px | Distinct font sizes | Horizontal overflow at 390px |
| :--- | ---: | ---: | ---: | ---: | ---: |
| Sign in | 91 | 7 of 12 | 14 | 7 | 0px |
| Playground | 351 | 22 of 32 | 36 | 7 | 51px |
| Skills | 702 | 42 of 51 | 28 | 13 | 51px |
| Connect | 98 | 20 of 27 | 20 | 4 | 51px |

Targets for the redesign: at most 4 font sizes per screen, no text under 12px, every control at least 32px on desktop and 44px for the primary action on mobile, and 0px horizontal overflow at 390px.

## Why it feels wrong

1. **There is no story on arrival.** The first screen is a sign in card full of protocol words: "SEAL protected", "Auth required", "Enoki zkLogin", "Fast sign in (local session + read only test)", "Enter delegate key". A visitor cannot tell what the product does for a team before being asked to authenticate.
2. **Internal identifiers lead the hierarchy.** A truncated bucket hash sits in the header next to the logo, `rev 1 · 487b3b5c` sits next to every skill title, and raw `0x` addresses fill the team list. These are proof details, so they belong in a details drawer, not in the primary scan path.
3. **Monospace and uppercase are everywhere.** Labels, chips, buttons and section titles use mono and tracked caps, so nothing stands out and the screen reads as a debug console.
4. **The Playground has no clear first action.** Four skill chips, a second skill picker, three tabs, a "Copy Prompt" button, a "Verify Plan" button and a "Check Facts & Plan" button compete. Numbered panels (1, 2) suggest a sequence that the user never has to follow.
5. **Rules are split across screens.** Team rules appear on the Playground and again on Skills, with different labels ("Fact", "Plan gate", "Team rules", "Bake").
6. **The value is invisible.** Nothing shows what the team gained: rules recalled this week, agents connected, the before and after of a real decision, or proof on mainnet.
7. **Connect is half empty.** The page ends after two cards, and the agent tab list uses internal names ("Argon Code", "T3 Code zroute / Gemini 4 Argon").
8. **Mobile is broken.** Three of four screens overflow sideways by 51px, and the header controls collide.
9. **Personal skills mix with team skills.** The team space lists `react-bits-pro`, `interface-bts` and `boost` next to `memwal-qa`, so the library does not read as one team's playbook.

## What already works and should be kept

1. The three column Skills layout (library, rules, document) is the right skeleton.
2. Rule rows with an on/off toggle and an author are the right unit.
3. The Without MemWal versus With MemWal comparison is the strongest proof of value in the product.
4. The emerald accent on a warm neutral ground is a good, recognizable palette.
5. Connect already generates per agent config, which is the activation step that matters most.
