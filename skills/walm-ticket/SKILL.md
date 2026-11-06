---
name: walm-ticket
description: >-
  Use when creating or drafting a Linear ticket for Walrus Memory (WALM team,
  linear-mysten), including from a GitHub issue; follows the team ticket
  template and links the GitHub issue both ways.
---
# WALM ticket template

Use linear-mysten only (Mysten Labs, WALM team). Template: linear.app/mysten-labs/team/WALM/new?template=... (Thanos's). Draft first and show the user before creating unless they said to create directly.

## Fields (fill every one)
1. **Title**: start with the surface in brackets: [Relayer], [SDK], [MCP], [Dashboard], [Ops], [Docs]. Then the outcome (what is true when done), not the task.
2. **Problem**: what is wrong or missing today, who hits it, evidence (user report, GitHub issue, log line, review finding, Slack thread). Facts, not the fix.
3. **Desired behavior**: what the user or calling app sees when done, from their side, with exact copy, error text or API response where it matters.
4. **Scope**: list by surface (relayer, SDK, MCP, dashboard, config, tests). Call out any migration, flag, contract change or rollout step.
5. **Out of scope**: what it deliberately does not do and where that lives (ticket id or "not planned").
6. **Acceptance criteria**: one checkable statement per line, verifiable without asking. End with a Demo line: where it is shown (`dev`, test account, script — note: `staging` is retired; `dev` and `production` are the only active environments) and what the reviewer sees.
7. **Proposed estimate**: story points on the CommandOSS SP scale, including code review effort. Above 5 means split the ticket. Always set before starting work.
8. **Blocked by**: ticket ids or a named decision, or "none, can start immediately".
9. **Source**: link to where it came from (Slack thread, GitHub issue, meeting and date, review finding, user report, parent ticket).

## GitHub issue & PR linking
When the ticket comes from or relates to a GitHub issue or PR:
- Put the full GitHub issue URL in Source and attach it to the Linear issue (`create_attachment`, or links on `save_issue`).
- Ask the user before commenting the Linear ticket link back on the GitHub issue (it posts as them).
- **NEVER expose internal `WALM-*` IDs on public GitHub**:
  - Do **not** use `walm-*` or `WALM-*` in GitHub branch names (use `fix/issue-<N>-<slug>` or `fix/<slug>` instead).
  - Do **not** include `WALM-*` in GitHub PR titles, PR bodies, commit messages, code comments, or changelogs (`CHANGELOG.md` / `changelog.mdx`).
  - On GitHub PRs, reference only the public GitHub issue (e.g. `Fixes #<N>` in the PR body and `(#<N>)` in changelogs).
  - Instead, post/attach the GitHub PR URL **on the Linear `WALM-*` ticket** (via `save_comment` / `create_attachment` / `save_issue` on `linear-mysten`) and update the Linear ticket status there.

## Parallel Post-Merge Reconciliation (`walm-ticket` + `gh-issue-fixed` + `memwal-review` + `memwal-dev-wallet`)
Whenever a PR that solves a GitHub issue has **100% CI checks GREEN (`SUCCESS`)** and **`APPROVED`** review and is merged into `dev`, execute these three steps in parallel:
1. **`walm-ticket` (Linear `linear-mysten`)**: Move the `WALM-*` ticket(s) to **`Done`** (`save_issue`) and post a comment (`save_comment`) with the merged PR URL, merge commit SHA, release version, and closed GitHub issue(s).
2. **`gh-issue-fixed` (GitHub Issue)**: Post the merged-fix reply on every GitHub issue solved by the PR (never mentioning `WALM-*`) and close the GitHub issue (`gh issue close <N> --repo MystenLabs/MemWal` if still `OPEN`).
3. **`memwal-review` + `memwal-dev-wallet` (`dev` Verification)**: Verify the `dev` deployment (`https://relayer.dev.memwal.ai/version`, `/health`, Railway `dev` logs, and `memwal-dev-wallet` E2E check) to confirm the merged changes run cleanly on `dev`.

## Retired Standalone Demo Apps (`apps/chatbot`, `apps/noter`, `apps/researcher`)
- The standalone demo applications (`apps/chatbot`, `apps/noter`, `apps/researcher`) are **disabled and no longer maintained** (note: `apps/app`, the core Dashboard / Playground web console, remains actively maintained).
- Do **not** create or implement new `WALM-*` tickets for `apps/chatbot`, `apps/noter`, or `apps/researcher`.
- If an existing open `WALM-*` ticket targets `apps/chatbot`, `apps/noter`, or `apps/researcher`, move it to **`Canceled`** on Linear with a comment explaining that the standalone demo app is retired and no longer maintained, close any associated open PR, and close the corresponding GitHub issue (`--reason "not planned"`) using the retired demo app reply in `gh-issue-fixed`.

## Before creating
- Search existing WALM issues for duplicates.
- Verify linear-mysten is the WALM workspace, not CommandOSS.
