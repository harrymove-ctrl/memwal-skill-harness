---
name: memwal-review
description: >-
  Review and verify the latest merged MemWal (MystenLabs/MemWal) PRs for one
  environment (dev or production) with code review, automated checks,
  real user-flow tests and Railway logs, and end with a PASS / FAIL /
  INCOMPLETE verdict and a promotion recommendation. Use when asked to review
  merged PRs, verify a deploy, or decide if dev → main is safe (staging is
  retired and no longer used).
  Read-only on shared systems: never deploy, merge, migrate or message anyone.
---
# MemWal environment review (reviewer)

Review and verify the latest merged PRs for MemWal through code review, relevant automated checks, real user-flow tests, and Railway logs.

Use the current conversation's incidents, reported identifiers, and previous findings as investigation leads. Re-check their current status rather than assuming earlier conclusions still hold.

Optional overrides (ask only if the request is ambiguous):
- Target environment: infer from the current branch if blank
- PRs or time range: infer from deployment history if blank
- Specific incident or flow: optional

Fixed facts:
- Repo `MystenLabs/MemWal` (`MystenLabs/walrus-memory`); Railway project **Walrus Memory** (id `7c541ac5-535d-4240-9bad-4ad9804c2dd7`) with **dev** and **production** environments (`staging` is retired and no longer used; promotions go directly `dev → main`).
- Relayers: dev `https://relayer.dev.memwal.ai`, prod `https://relayer.memory.walrus.xyz`. `curl -s <relayer>/version | jq .build.commit` gives the deployed commit.
- Deploy targets are NOT guaranteed to be the namesake branches (see 2026-09-28 drift). Always place `build.commit` in git (`git branch -r --contains <sha>`) before claiming anything about an environment.
- GitHub account is `harrymove-ctrl` (`harrymove-ctrl <harry.phan@commandoss.com>`); check `gh auth status` first. If `gh` reports an x509 / invalid-token error inside the sandbox, use `curl` with `gh auth token`.
- Tickets: WALM team on `linear-mysten` (see `linear-org-routing` and `walm-ticket`).

## 1. Establish scope

Read repository instructions and identify the current branch.

Default environment:
- dev → dev only.
- main/production → production only after confirming the actual deployment mapping.
- (`staging` is retired — do not target or test `staging`).
- Feature branch → determine its intended base and test environment; never assume production.

For a promotion:
- Before deployment, review the promotion diff and relevant source-environment evidence.
- After deployment, validate the destination environment.
- Do not claim destination validation from source-environment results.

Do not test every environment by default. Expand only when requested or necessary to investigate a specific dependency, and explain why.

State the selected environment, change range, and intended coverage before testing.

## 2. Determine what changed and what is actually deployed

- Fetch the latest relevant branches.
- Inspect merged PRs and actual diffs, including changes hidden inside broadly titled PRs.
- Identify deployed commits for every relevant service.
- Compare against the previous deployment or requested baseline.
- Audit every merged PR's `statusCheckRollup` and its merge commit's `check-runs` + commit `status` (including Railway `Walrus Memory - *` deployment statuses): flag any PR that was merged while a CI job or Playwright E2E check was `FAILURE`, `CANCELLED`, or still `IN_PROGRESS`, or where a Railway service deployment errored/cancelled. Never recommend promotion or merge unless 100% of CI checks and Railway deploy checks are completed and `SUCCESS` (`GREEN`).
- Separate: merged into the branch; present in the deployed artifact; verified through live testing.
- Check migrations, dependency versions, configuration requirements, and compatibility across services, SDKs, MCP, and apps.
- Map changes to affected user flows and indirect consumers.
- If changes are merged but not deployed, perform local checks and mark live validation pending. Do not deploy automatically.

## 3. Run meaningful tests

- Run relevant automated tests, type checks, and builds.
- Use authorized test accounts for deployed tests.
- Confirm every app/client points to the selected environment and network.
- Exercise affected MCP flows: initialization, tool discovery, auth, remember, job-status polling, recall, and reconnect.
- Exercise account creation/lookup, delegate auth, and identity-link prerequisites where relevant.
- Test the playground and affected demo apps, including chatbot, noter, researcher, and other apps found in the repository.
- Use real browser interactions for affected UI flows.
- For shared backend, SDK, auth, contract, or deployment changes, test affected consumers even when their own code did not change.
- Scale test depth to impact. Do not run every app's full suite for unrelated changes.
- Explain skipped checks and distinguish irrelevant checks from blocked ones.

## 4. Verify writes and timing end to end

- A 202, job_id, successful build, or green /health does not prove the user flow works.
- Follow a test write to its terminal state, confirm completion, and recall the expected content.
- Check that failures surface useful errors and exhausted retries do not remain running.
- Verify indexer progress and account visibility against known on-chain state when relevant.
- Measure acceptance, preparation, upload/completion, polling, recall, and affected UI/MCP latency separately where observable.
- Investigate unexpected latency and timeout behavior. Do not increase timeouts merely to make tests pass.
- Use unique test markers and isolated test data.
- Clean up only data created by this run, where supported.
- Use local or isolated tests for fault injection; do not deliberately disrupt shared services.

## 5. Inspect Railway logs across the selected environment

- Confirm the Railway project, environment, services, and deployed commits (`railway status --json`; walk `environments.edges[].node.serviceInstances.edges[].node.{serviceName, latestDeployment.meta.{branch,commitHash}}`).
- Inspect every service in that environment for failure signals, then investigate affected services and dependencies in depth.
- Include relayer, indexer, sidecar/MCP, workers, demo apps, and supporting services hosted on Railway. Identify components sharing a deployment.
- Review deployment, build, startup, runtime, and HTTP logs where available.
- Cover the relevant deployment-to-present window and a comparable pre-deployment baseline where retention allows.
- Use filtering, pagination, and time windows. Do not rely only on the last few log lines.
- Look for crashes, restarts, OOMs, migration errors, connection failures, unexpected 4xx/5xx, slow requests, timeouts, repeated retries, queue backlogs, stuck jobs, and checkpoint decoding failures.
- Correlate events across services and live tests using timestamps, request IDs, job IDs, account IDs, and transaction digests.
- Check available metrics for resource pressure, queue growth, indexer lag, and latency changes.
- Distinguish new regressions, pre-existing issues, and expected negative-test errors.
- For significant findings, capture frequency, first/last occurrence, representative redacted logs, and user impact.
- State log retention gaps, unavailable sources, and sampling limitations.
- Check whether health/readiness reporting reflects actual behavior.

## 6. Trace failures and check existing fixes

For each failure:
- Identify the failing component separately from the app or team experiencing the symptom.
- Trace the sequence from request acceptance to the failing operation.
- Distinguish confirmed cause from a hypothesis.
- Search the latest relevant branches and merged PRs for an existing fix before proposing new work.
- Inspect the implementation, not just PR titles or descriptions.
- Report whether the fix is: not implemented; open in a PR; merged but not deployed; deployed but not verified; verified in the selected environment.
- Link the relevant PR and commit.
- Do not suggest reimplementing a fix already merged.
- Do not call an issue resolved merely because a fix exists in code.

## 7. Execution boundaries

- Take the time needed to complete meaningful verification. Stop repeating checks once sufficient evidence exists.
- Use approved credentials without exposing secrets.
- Preserve unrelated local changes.
- Do not deploy, merge, run migrations, change shared configuration, or apply fixes during this review.
- Limit live mutations to isolated authorized test activity.
- Complete independent checks before asking for missing access or approval.
- Do not create tickets or send messages unless requested.
- Do not claim live success based on code inspection, mocks, or tests against another commit or environment.

## 8. Communicate clearly throughout

- Give concise progress updates with findings, uncertainty, and the next check.
- Lead with the practical result, not a chronological tool transcript.
- Explain technical errors in plain language and connect them to user impact.
- Clearly name which component failed; do not blame the consuming app without evidence.
- Use exact error text, timestamps with timezone, and identifiers only where they help substantiate the finding.
- Correct earlier conclusions explicitly when new evidence changes them.
- Match the user's language. Keep team-message drafts in concise, natural English unless requested otherwise.

## Final response

Start with:
"[Environment]: PASS / FAIL / INCOMPLETE — [one-sentence conclusion]."

Then provide:

**A. Scope**
- Branch, reviewed baseline, deployed service commits, and PRs covered.
- Changes merged but not yet deployed.

**B. Findings** — compact table:
Issue / Failing component / Evidence and user impact / Existing fix or PR / Deployment and verification status

**C. Tests** — compact table:
Flow / Environment and tested commit / Result / Timing / Evidence

**D. Railway review**
- Significant findings and affected services.
- Coverage window, unavailable logs, and remaining gaps.

**E. Next steps**
- Concrete actions in priority order.
- Separate new implementation from deploying existing fixes and completing validation.
- State whether promotion is recommended, or whether the deployed promotion is verified.
- If a known incident is involved, include a short ready-to-send update explaining what happened, what is already fixed, and what remains. Draft only; do not send.

Verdict rules:
- FAIL: a relevant failure is confirmed. Also disclose any incomplete checks.
- INCOMPLETE: essential validation is missing and no confirmed failure already determines the verdict.
- PASS: relevant checks passed against the intended deployed commits, with explicit coverage limits.
- Never imply other environments were verified or guarantee that no bugs exist.

## 9. Parallel Post-Merge Reconciliation (`memwal-review` + `memwal-dev-wallet` + `gh-issue-fixed` + `walm-ticket`)

Whenever an `APPROVED` + `100% CI GREEN` PR that solves a GitHub issue is merged into `dev`, run these three workflows in parallel:
1. **`memwal-review` + `memwal-dev-wallet` (`dev` Verification)**: Verify the newly deployed `dev` commit on `https://relayer.dev.memwal.ai/version` and `/health`, inspect Railway `dev` logs and release workflow runs (`Release SDK`, `Release Python SDK`, `Release Walrus Memory OpenClaw Plugin`), and execute a `memwal-dev-wallet` / SDK end-to-end runtime check against `dev`.
2. **`gh-issue-fixed` (GitHub Issue Reply & Close)**: Post the standard merged-fix comment on every GitHub issue solved by the PR (naming the PR URL and release version, without any `WALM-*` IDs) and close the GitHub issue (`gh issue close <N> --repo MystenLabs/MemWal` if it is still `OPEN`).
3. **`walm-ticket` (Linear `linear-mysten`)**: Update the corresponding `WALM-*` ticket(s) to **`Done`** and post a comment linking the merged PR URL, merge commit SHA, release version, and closed GitHub issue(s).

## 10. Retired Standalone Demo Apps (`apps/chatbot`, `apps/noter`, `apps/researcher`)

- The standalone demo applications (`apps/chatbot`, `apps/noter`, `apps/researcher`) are **disabled and no longer maintained** (note: `apps/app`, the core Dashboard / Playground web console, remains actively maintained).
- Do not implement fixes or merge PRs targeting `apps/chatbot`, `apps/noter`, or `apps/researcher`. Close open PRs targeting those demo apps, close their GitHub issues (`--reason "not planned"`) with a note that the demo apps are retired and no longer maintained, and move corresponding Linear `WALM-*` tickets to **`Canceled`**.
