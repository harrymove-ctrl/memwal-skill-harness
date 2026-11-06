# UI and UX plan

The plan for turning the harness into a product a team (and a judge) understands in 10 seconds. Read in order.

| File | What it answers |
| :--- | :--- |
| [`01-audit.md`](01-audit.md) | What is wrong with the current UI, measured, and what to keep |
| [`02-users-and-jobs.md`](02-users-and-jobs.md) | Who uses it, the words to use, and the full checklist of what each person can do, with today's status and priority |
| [`03-flows.md`](03-flows.md) | The five key flows and the state machines for saving a skill and a rule's life |
| [`04-screens.md`](04-screens.md) | The new navigation, every screen's purpose, primary action, layout, states and acceptance checks |
| [`05-design-system.md`](05-design-system.md) | The three directions, the decision (B), dark first tokens and components |
| [`06-hackathon-plan.md`](06-hackathon-plan.md) | Judging criteria, submission gaps, the seven day plan, demo script and blog outline |
| [`07-build-plan.md`](07-build-plan.md) | The engineering steps for the dark command center: owner, files, order, done when, open questions |
| [`08-execution-plan.md`](08-execution-plan.md) | Who does what each day until submission, what to cut first, and a prompt to paste into Antigravity |
| [`handoff-antigravity.md`](handoff-antigravity.md) | The contract with Antigravity, which owns `src/App.tsx`: what Claude ships, what Antigravity wires |
| [`concepts/`](concepts/) | Concept stills: `stills-dark/` is the chosen direction for every screen, `stills/` the light originals |
| [`../brand/`](../brand/README.md) | The logo: the idea, every file, sizes, colors and rules |
| [`audit/`](audit/) | Before screenshots and raw audit numbers |
| [`qa/`](qa/) | After screenshots, flow videos and results for the shell and places, from `video/scripts/qa-shell.mjs` and `qa-places.mjs` |

## The decisions this plan needs from the owner

1. Visual direction: decided 2026-11-03, **B. Command center** (see `05-design-system.md`).
2. Owner of `src/App.tsx` during the build: decided 2026-11-03, **Antigravity**.
3. Confirm the five place navigation: Home, Skills, Try it, Team, Agents.
4. Confirm the public repo name for the submission.

## How to re-run the audit

```bash
pnpm dev
node video/scripts/audit-ui.mjs
```

It writes `before-*.png` and `metrics.json` into `docs/ux/audit/`. Run it again after each screen ships and compare against the targets in `04-screens.md`.
