---
name: gh-issue-fixed
description: >-
  Post the Walrus Memory reply on a MystenLabs/MemWal GitHub issue once the fix
  is merged: thank the reporter, name the PR and the release, and invite a
  reopen. Use when Henry or Hari asks to reply on the issue after the fix, says
  the issue is fixed and wants the comment posted, or runs /gh-issue-fixed.
  Don't post just because a PR merged.
---
# GitHub issue reply when the fix is merged

The repo is `MystenLabs/MemWal`. Write in American English. When this skill runs, post the comment; don't leave it as a draft.

Source: [walrus-memory-github-issue-reply-templates](https://docs.google.com/document/d/182NqV2Nf4nITJrsEdyfB_E7KnNPredZll-dWj7giHL4/edit). This skill covers only the merged-fix reply.

## When

Use it when the fix PR is **merged** and Henry or Hari (whoever asked) wants the issue comment posted.

If the fix isn't merged yet, post this instead, with the real PR URL:

```
Thanks for the detailed report. We reproduced this on <version / environment> and confirmed the root cause is <one-line cause>. A fix is in progress and tracked in <PR url>; we will update this thread when it ships.
```

## When not to use this template

Skip it for a vulnerability, or for a security, data-integrity or availability report that isn't safe to discuss in public:

- Post no template reply, and add no extra detail on the issue.
- Security routes critical items to Thanos Bourgos or Yannis.
- If there's a public holding note, it's one line with no detail, and it comes from Thanos or Yannis.

A data-loss or downtime bug that is safe to discuss in public still gets the reply below.

## Comment

Fill every bracket from the PR and leave none in the posted text. Don't invent a version.

```
Thanks for flagging this. We reproduced it, and the fix is merged in <PR url> and will be included in <release>. Please reopen if you still see it after upgrading.
```

That sentence is the whole reply. It thanks the reporter, says we reproduced the bug and merged the fix, names the release, and invites a reopen after upgrading. Don't add "not true", "invalid", "wrong" or a bare "closing".

```bash
gh issue comment <N> --repo MystenLabs/MemWal --body-file <file>
```

If the GitHub issue is still `OPEN` after the PR is merged into `dev` (for example, when merging into `dev` instead of `main`, or when a single PR fixes multiple issues), **close the GitHub issue** right after posting the comment:

```bash
gh issue close <N> --repo MystenLabs/MemWal
```

## Parallel Post-Merge Workflow (`gh-issue-fixed` + `walm-ticket` + `memwal-review` + `memwal-dev-wallet`)

Whenever a PR that solves a GitHub issue has **100% CI checks GREEN (`SUCCESS`)** and **`APPROVED`** review and is merged into `dev`, execute these three steps in parallel:
1. **`gh-issue-fixed` (GitHub Issue)**: Post the merged-fix comment above on every GitHub issue solved by the PR and ensure the issue is **CLOSED** (`gh issue close <N> --repo MystenLabs/MemWal` if still `OPEN`).
2. **`walm-ticket` (Linear `linear-mysten`)**: Move the corresponding `WALM-*` ticket(s) to **`Done`** and post a comment linking the merged PR URL, merge commit SHA, release version, and closed GitHub issue(s).
3. **`memwal-review` + `memwal-dev-wallet` (`dev` Verification)**: Verify the `dev` deployment (`https://relayer.dev.memwal.ai/version`, `/health`, Railway `dev` logs, and `memwal-dev-wallet` E2E check) to confirm the merged changes run cleanly on `dev`.

## Retired Standalone Demo Apps (`apps/chatbot`, `apps/noter`, `apps/researcher`)

The standalone demo apps (`apps/chatbot`, `apps/noter`, `apps/researcher`) are **disabled and no longer maintained** (note: `apps/app`, the core Dashboard / Playground web console, remains actively maintained).

- **Do not** open or merge PRs targeting `apps/chatbot`, `apps/noter`, or `apps/researcher`.
- If an open PR targets one of these retired demo apps, close the PR (`gh pr close <PR> --repo MystenLabs/MemWal --comment "..."`) explaining that the demo app is retired and no longer maintained.
- If an open GitHub issue targets `apps/chatbot`, `apps/noter`, or `apps/researcher`, post this reply and close the issue as `not planned`:

```
Thanks for reporting this. The standalone demo apps (`apps/chatbot`, `apps/noter`, and `apps/researcher`) have been retired and are no longer maintained as we focus on the core Walrus Memory relayer, SDKs, MCP server, OpenClaw plugin, and Dashboard (`apps/app`). Closing this issue as not planned.
```

```bash
gh issue comment <N> --repo MystenLabs/MemWal --body-file <file>
gh issue close <N> --repo MystenLabs/MemWal --reason "not planned"
```

- Also move the corresponding Linear `WALM-*` ticket (if any) to **`Canceled`** via `walm-ticket`.

## Before posting

- Make sure `gh auth status` shows the requester's own account (verify with `gh auth status`).
- **Never include internal `WALM-*` Linear ticket IDs** in the GitHub issue comment (keep `WALM-*` strictly inside Linear `linear-mysten`, and update the corresponding `WALM-*` ticket to `Done` or `Canceled` on Linear).
- **Verify real reproduction and 100% green CI**: Confirm the issue was genuinely reproduced end-to-end (`Local vs dev` / live `dev` or integration test) and the fixing PR merged with 100% green CI and deploy checks (`dev` and `production` are the only active environments; `staging` is retired).
- Check that the PR link points to the merged PR.
- Make sure `<release>` is the version the fix ships in, from the changelog or the version bump on the PR. If you don't know it, ask whoever requested the reply. Don't guess, and don't write "the next release" unless that's true.
- Post one comment, close the issue if still `OPEN`, and don't edit the issue body.
