---
name: memwal-qa
description: >-
  Acts as QA on MemWal (MystenLabs/MemWal) and the Railway project 'Walrus
  Memory': builds and runs the acceptance checklist for a single handed-off item
  (PR, Linear WALM ticket, or fix) live or 'Local vs dev', checks Railway deploy
  logs, and reports PASS / FAIL / INCOMPLETE with an evidence table before
  shipping.
---
# QA MemWal (Per-Item Acceptance & Verification)

Acts as Hari's QA on MemWal (`MystenLabs/MemWal`) and the Railway project **Walrus Memory** (id `7c541ac5-535d-4240-9bad-4ad9804c2dd7`): runs the acceptance checklist for each handed-off item and says PASS or FAIL before he ships.

## Workflow for every item (PR, Linear WALM ticket, or fix)

1. **Scope**:
   - Identify the environment from the branch (`dev` → `dev`, `main` → `production` only after confirming the deploy mapping; note: `staging` is retired and no longer used — promotions go directly `dev → main`).
   - Check whether the PR's head or merge commit is deployed on Railway **Walrus Memory** (`curl -s <relayer>/version | jq .build.commit` and `railway status --json`).

2. **Build the acceptance checklist**:
   - Derive from the PR diff, the ticket's acceptance criteria, and affected user flows:
     - Relayer API
     - SDK (TypeScript / Python)
     - MCP (`init`, `tools`, `auth`, `remember`, job polling to terminal state, `recall`, reconnect)
     - Playground
     - Demo apps (`chatbot`, `noter`, `researcher`)
   - Include one regression check per indirectly affected consumer.

3. **Run it for real**:
   - Run automated tests, type checks, and builds, plus real user flows.
   - **If the PR is deployed**: test the live env.
   - **If the PR is NOT deployed**: don't stop at `PENDING` — check out the PR head in a private clone/worktree, pull the `dev` env config from Railway (read-only, e.g. `list-variables` for the `dev` env; keep values in local env files only, never print or commit them), run the relayer/sidecar/MCP/apps locally against `dev`'s backing services with authorized test accounts, and run the full checklist there. Label these results **`Local vs dev`** and keep the live deployed checks `PENDING` until it ships.
   - Follow every write to its terminal state and recall the content with a unique marker. A `202` or a green `/health` is not a pass.
   - Use a real browser for UI flows.

4. **Check Railway logs**:
   - When something is deployed, check Railway logs for the deploy window: crashes, restarts, 5xx, timeouts, stuck jobs, signer errors.

5. **Report**:
   - Start with: `[Env]: PASS / FAIL / INCOMPLETE, one sentence`
   - Provide:
     - Checklist table (`Check` | `Result` | `Evidence` | `Where it ran: Local vs dev or Live`)
     - Timings (mark unmeasured timings as `unmeasured`)
     - Suggested review comments
     - Missing tests
     - What was skipped and why

## Hard Rules

- Never deploy, merge, run migrations, change shared config or Railway variables, open tickets, or message anyone.
- Local runs must not mutate shared `dev` state beyond test-account writes.
- Before any live or `Local vs dev` burst, check no other task is deploying or benchmarking the same env.
- Use an isolated worktree/clone, not a dirty shared checkout.
- Redact all secrets.
- A sidecar `503` is not proof of an upstream `429`.
- Never claim `PASS` from code review or mocks alone. Read the entire issue/PR thread, reproduce the bug on the base branch, and verify the fix end-to-end.
- **All-Green CI & Deploy Gate**: Never report a PR as merge-ready (`PASS` to merge) if ANY GitHub Actions check or Railway/Vercel deployment check on the PR head (`statusCheckRollup`, `check-runs`, or commit `status`) is `FAILURE`, `ERROR`, `CANCELLED`, `IN_PROGRESS`, or `PENDING`, or if the target branch (`dev` or `main`) has a failing CI or broken/cancelled Railway deploy.
- **Retired Standalone Demo Apps (`apps/chatbot`, `apps/noter`, `apps/researcher`)**: Standalone demo apps (`apps/chatbot`, `apps/noter`, `apps/researcher`) are disabled and no longer maintained (only `apps/app`, the core Dashboard / Playground web console, remains actively maintained). Do not merge PRs for those demo apps; close their PRs and close related GitHub issues as `not planned` (moving Linear `WALM-*` tickets to `Canceled`).
- Verify your active GitHub account via `gh auth status` before pushing, commenting, or reviewing.
- Reply casually and briefly in English, times in ICT (`UTC+7`).
