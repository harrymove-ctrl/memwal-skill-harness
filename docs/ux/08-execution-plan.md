# 8. Execution plan from Wednesday 4 November

Who does what, in order, until submission on Tuesday 10 November 2026 at 17:00 UTC. `07-build-plan.md` holds the detail for each step; this file is the running order.

## Where things stand (checked 4 Nov, 12:05)

| Item | State |
| :--- | :--- |
| Git repository | Not created |
| `src/shell/` | Built and verified on its preview; waiting for Antigravity to wire it (step 3) |
| `src/parts/`, `src/places/`, `src/hooks/` | Home, Live and Skills built and verified on their preview; waiting for wiring. Try it, Team, Agents and Landing not started |
| Agent recall logging | Missing, so Live cannot appear on real data; see `07-build-plan.md` |
| `src/App.tsx` | 2,544 lines, unchanged since 3 Nov 16:03 |
| Dark theme as default | Tokens are in; the live app stays light until step 3 adds one line to `src/main.tsx` |
| Tatum Sui RPC | Not integrated; the gateway protocol is still unconfirmed |
| Public repo and blog post | Not started |

## Running order

| When | Who | Task | Unblocks |
| :--- | :--- | :--- | :--- |
| Wed 4, first | You | Run the git baseline (step 0) | Everything, because each step can then be reviewed and undone |
| Wed 4 | Claude | Dark tokens and app shell (steps 1 and 2) | Antigravity's wiring |
| Wed 4 | Antigravity | Wrap the app in the shell, routes, old header removed (step 3) | Every new screen |
| Wed 4 | Both | Vocabulary pass (step 4) | The demo reads in plain words |
| Thu 5 | Claude, then Antigravity | Home, Live, Skills (steps 5 to 7) | The core of the demo |
| Thu 5 | Claude | Confirm the Tatum Sui gateway protocol | Step 8 |
| Fri 6 | Claude, then Antigravity | Team with the Tatum Sui RPC, Agents (steps 8 and 9) | The 30% integration score |
| Sat 7 | Claude, then Antigravity | Landing, demo space, Try it (step 10) | First impression for judges |
| Sun 8 | Claude | Proof drawer, screen states, QA (steps 11 and 12) | Presentation score |
| Sun 8 | You, with Claude's draft | Blog post | A submission requirement |
| Mon 9 | You | Rotate remaining keys, push the public repo, record the video, submit | Submission a day early |
| Tue 10 | | Buffer; the deadline is 17:00 UTC | |

## If time runs short, cut in this order

1. The Live view's bar chart (keep the number and the stream).
2. Agent disconnect, revision diff and other P1 and P2 jobs.
3. The light theme polish.

Never cut: the Tatum Sui RPC integration, the demo without a wallet, the before and after, the public repo and the blog post.

## Daily check

Each evening, the app must still run, and these must pass:

```bash
npm run build
node video/scripts/audit-ui.mjs
```

Compare the audit against the targets in `04-screens.md`, commit, and update "Wired" in `handoff-antigravity.md`.

## Prompt to paste into Antigravity

```text
You own src/App.tsx in /Volumes/Dev/memwal-skill-harness for the dark command center build. Claude builds the new components in src/shell, src/parts, src/places and src/hooks and never edits App.tsx. Do not edit those folders; write change requests under "Requests" in docs/ux/handoff-antigravity.md.

Read first, in order: docs/ux/handoff-antigravity.md, docs/ux/04-screens.md, docs/ux/05-design-system.md, docs/ux/07-build-plan.md, docs/ux/08-execution-plan.md.

Your first task is step 3. Start only when handoff-antigravity.md lists AppShell under "Ready to wire".
1. Extend RoutePath (App.tsx line 145) and PRIMARY_ROUTES (line 155) using src/shell/places.ts. Redirect /graph, /eval and /cad to their new paths. Keep /bento working. Signed in users land on /home.
2. Render the app inside AppShell, passing data from existing state and handlers.
3. Remove the old header (data-testid="clean-workspace-header", near line 1629) once AppShell provides the same controls.
4. Make dark the default by adding applyTheme(initialTheme()); to src/main.tsx before createRoot, importing both from ./shell. The isDark code needs no change. Keep the theme toggle.
5. Keep today's views as AppShell children until each new place replaces them.

Rules: never put a secret in a VITE_ variable or in client code. Do not commit or push unless the owner asks; make any commit as harrymove-ctrl with no AI attribution. Do not use em dashes in docs or commit messages.

Done when: npm run build passes, including its secret scan; node video/scripts/audit-ui.mjs reports 0px for both overflowX and mainOverflowX at 390px on every route; every old link redirects; and you have moved the entry to "Wired" in handoff-antigravity.md with what you connected and anything you could not verify.
```
