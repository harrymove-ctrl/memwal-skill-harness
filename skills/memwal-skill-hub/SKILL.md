---
name: memwal-skill-hub
description: >-
  Host, fetch, and evolve shared team agent skills (`SKILL.md`) and learned Team
  Rules on Walrus Console (`217e53fc-36ff-4d1b-8834-04f69c2ef553`) and Walrus
  Memory using a shared Account ID, Delegate Key, and Namespace via
  `@mysten-incubation/memwal-mcp` and `@mysten-incubation/walrus-console-mcp`.
---
# MemWal Skill Hub & Team Rule Sync (`memwal-mcp` + `walrus-console-mcp`)

Use this skill in **Argon Code (`zroute/gemini-4-argon`)**, **Claude Code**, **Cursor**, **Codex**, or **Antigravity** whenever a team member wants to:
1. **Fetch / pull shared skills (`SKILL.md`)** and their active **Team Rules** from Walrus Console bucket [`217e53fc-36ff-4d1b-8834-04f69c2ef553`](https://console.walrus.xyz/buckets/?b=217e53fc-36ff-4d1b-8834-04f69c2ef553) and Walrus Memory namespace `memwal-team-skills` into `~/.agents/skills/` and `~/.gemini/config/skills/`.
2. **Host / push a new or updated `SKILL.md`** revision into the shared Walrus Console bucket (`217e53fc-36ff-4d1b-8834-04f69c2ef553`, SEAL Policy ID `0xddcab3487be76e5fea6f48aea0061cc39b140730634f125ac36eabcbb74ae51a`) and publish a `[SKILL_REF:<id>]` pointer so teammates can pull it.
3. **Teach a Skill (Add / Toggle / Bake Team Rule)**: Record a newly discovered rule (`[RULE:<ruleId>]`) or state transition (`[RULE_STATE:<ruleId>]`) so every teammate's coding agent folds the latest active rules deterministically.

## 1. Memory & Console Tagging Contract inside a Namespace Folder

A Walrus `namespace` acts as a shared **Skill Folder** (for example, `memwal-team-skills`). Every entry uses one of four structured records:

1. **Skill Revision Pointer (`[SKILL_REF:<skill-name>]`)**:
   ```json
   [SKILL_REF:ui-ux-qa]
   {"id":"ui-ux-qa","bucketId":"217e53fc-36ff-4d1b-8834-04f69c2ef553","fileId":"169bbc92-08b6-4b93-99f6-82f793b9eaa0","sha256":"...","rev":1,"updatedAt":"2026-11-02T16:43:29Z","author":"@harrymove-ctrl"}
   ```
   When `walrus-console-mcp` (`download_file`) is configured, download `<skill-name>.SKILL.md` by `fileId` from bucket `217e53fc-36ff-4d1b-8834-04f69c2ef553`. Otherwise fall back to `GET /api/ns/memwal-team-skills/skills/<skill-name>` or the newest `[SKILL:<skill-name>]` memory payload.
2. **Base Skill Definition (`[SKILL:<skill-name>]`)**:
   ```text
   [SKILL:memwal-qa]
   # Full SKILL.md markdown content...
   ```
3. **Structured Team Rule (`[RULE:<ruleId>]`)**:
   ```text
   [RULE:flow-ui-ux-minimal-zones] [skill:ui-ux-qa] [state:on] [rev:1] [author:@harrymove-ctrl] [severity:hard-rule]
   {"ruleId":"flow-ui-ux-minimal-zones","skillId":"ui-ux-qa","text":"Keep UI ultra-simple with 2 to 5 word titles, at most 3 actions per card, and inline visual proof.","state":"on","rev":1}
   ```
4. **Rule Lifecycle State (`[RULE_STATE:<ruleId>]`)**:
   ```text
   [RULE_STATE:flow-ui-ux-minimal-zones] [state:off] [rev:2]
   {"ruleId":"flow-ui-ux-minimal-zones","state":"off","rev":2,"updatedAt":"2026-11-03T12:05:00Z"}
   ```
   Legacy `[FLOW:<skill-name>]` entries remain supported as `state: "on"`, `rev: 1`.

## 2. Deterministic Rule Folding (`newest-wins`)

When syncing or recalling rules for `<skill-name>`:
1. Fold all `[RULE:<ruleId>]`, `[RULE_STATE:<ruleId>]`, and legacy `[FLOW:<skill-name>]` events in chronological order (or newest-first by `rev` and `updatedAt`).
2. Exclude any rule whose folded `state` is `"off"` or `"deleted"`.
3. Append only active (`state === "on"`) rules to the bottom of the local `~/.agents/skills/<skill-name>/SKILL.md` under `## Learned Team Rules (Synced from Walrus)`.
