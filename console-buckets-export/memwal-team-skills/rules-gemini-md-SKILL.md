# Walrus Memory (`MystenLabs/MemWal`) — Core Team Rules for AI Coding Agents

These rules apply across all AI coding agents (Claude Code, Codex, Cursor, OpenCode, Grok, Antigravity/Gemini) when working on `MystenLabs/MemWal` (`MystenLabs/walrus-memory`).

## 1. Language & Agent Neutrality

- Always write and maintain all skills (`SKILL.md`), rule files (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`), and shared team documentation (`README.md`, `install.sh`) in **English** and in a **vendor-neutral format** (`~/.agents/skills/`, `AGENTS.md`).

## 2. GitHub Identity & Attribution Hygiene

- Before any GitHub operation (opening PRs, pushing branches, posting reviews or issue comments, merging), run `gh auth status` and confirm your intended personal GitHub account is the active account.
- Do **not** include AI attribution trailers (`Co-Authored-By`, "Generated with ...", etc.) in commit messages, PR descriptions, or review/issue comments.

## 3. Public GitHub vs Internal Linear (`WALM-*`) Separation

- `WALM-*` ticket IDs are **internal Linear identifiers** (`linear-mysten`).
- **Never** put `WALM-*` or `walm-*` in public GitHub branch names, PR titles, PR bodies/descriptions, commit messages, code comments, or changelogs (`CHANGELOG.md` / `changelog.mdx`) on `MystenLabs/MemWal` (`MystenLabs/walrus-memory`).
- On GitHub, reference only public GitHub issue numbers (`fix/issue-<N>-<slug>`, `Fixes #<N>`, `(#<N>)`).
- On Linear (`linear-mysten`), attach or comment the GitHub PR URL inside the `WALM-*` ticket and update the Linear ticket status there.

## 4. Strict PR Merge & Issue Verification Gate (Hard Merge Gate)

- **Never merge a PR unless 100% of CI checks and deploy checks are completed and `SUCCESS` (`GREEN`)**:
  - Before running `gh pr merge`, verify `gh pr checks <PR> --repo MystenLabs/walrus-memory` and `gh pr view <PR> --repo MystenLabs/walrus-memory --json mergeable,mergeStateStatus,reviewDecision,statusCheckRollup`.
  - **Zero** checks may be `FAILURE`, `ERROR`, `TIMED_OUT`, `CANCELLED`, `ACTION_REQUIRED`, `IN_PROGRESS`, `QUEUED`, or `PENDING`. Wait for every workflow (including Playwright E2E, Python/Rust/Node unit suites, SDK release verifiers, and Railway/Vercel deploy checks) to finish `SUCCESS`.
  - Confirm `reviewDecision == "APPROVED"` and `mergeable == "MERGEABLE"`.
  - Confirm the target base branch (`dev` or `main`) does not have an active broken build or failed Railway deployment. Never stack merges onto a failing deployment.
- **Read through and reproduce/test every issue and PR end-to-end before claiming fixed, approving, or merging**:
  - Never rubber-stamp or merge based only on PR titles, descriptions, or unit mocks.
  - Read the full issue thread, review comments, and code paths, reproduce the issue on the base branch, and verify the fix with real execution (unit + integration + `Local vs dev` / live `dev` E2E) before approving or merging.

## 5. Parallel Post-Merge Reconciliation (`gh-issue-fixed` + `walm-ticket` + `memwal-review` + `memwal-dev-wallet`)

Whenever an `APPROVED` + `100% CI GREEN` PR that resolves a GitHub issue is merged into `dev`, execute these three steps in parallel:
1. **`gh-issue-fixed` (GitHub Issue Reply & Close)**:
   - Post the merged-fix comment on every GitHub issue solved by the PR (naming the merged PR URL and exact release version, with zero `WALM-*` IDs).
   - If the GitHub issue is still `OPEN`, close it via `gh issue close <N> --repo MystenLabs/walrus-memory`.
2. **`walm-ticket` (Linear `linear-mysten`)**:
   - Move the corresponding `WALM-*` ticket(s) to **`Done`** and post a comment linking the merged PR URL, merge commit SHA, release version, and closed GitHub issue(s).
3. **`memwal-review` + `memwal-dev-wallet` (`dev` Verification)**:
   - Verify the `dev` deployment (`https://relayer.dev.memwal.ai/version`, `/health`, Railway `dev` logs, and release workflows) and run a `memwal-dev-wallet` / SDK end-to-end check against `dev`.

## 6. Active Environments (`dev` & `production` Only)

- The `staging` environment is **retired and no longer used**.
- Only two environments are active:
  - **`dev`**: `https://relayer.dev.memwal.ai` (tracks the `dev` branch)
  - **`production`**: `https://relayer.memory.walrus.xyz` (tracks the `main` branch; promotions go directly `dev → main`)

## 7. Standalone Demo Apps Retired (`apps/chatbot`, `apps/noter`, `apps/researcher`)

- The standalone demo applications (`apps/chatbot`, `apps/noter`, `apps/researcher`) are **disabled and no longer maintained** (note: `apps/app`, the core Dashboard / Playground web console, remains actively maintained).
- Do **not** implement fixes or merge PRs targeting `apps/chatbot`, `apps/noter`, or `apps/researcher`.
- Close any open PRs targeting those demo apps, reply on related open GitHub issues explaining that the standalone demo apps are retired and no longer maintained and close them as `not planned` (`gh issue close <N> --repo MystenLabs/walrus-memory --reason "not planned"`), and move any corresponding Linear `WALM-*` tickets to **`Canceled`**.

## Live Flow Memories (Walrus Recalled)
- **[FLOW:rules-gemini-md]** (hard-rule · blob `gs0M1js80k-OWvkYt7v08phKe3KC8PBINIOPowo7G-0` · by `@harrymove-ctrl`): Always confirm your active GitHub account is @harrymove-ctrl before pushing or commenting.
  - *Rationale*: Prevents commits or PR actions under the wrong GitHub account.
