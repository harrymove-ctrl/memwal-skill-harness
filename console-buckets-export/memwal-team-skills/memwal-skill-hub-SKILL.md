---
name: memwal-skill-hub
description: >-
  Host, fetch, and evolve shared team agent skills (`SKILL.md`) and learned Flow
  Memories on Walrus Memory using a shared Account ID, Delegate Key, and
  Namespace via the existing `@mysten-incubation/memwal-mcp` tools
  (`memwal_recall`, `memwal_remember`, `memwal_remember_bulk`, `memwal_restore`).
---
# MemWal Skill Hub & Flow Memory Sync (via `memwal-mcp`)

Use this skill whenever a team member wants to:
1. **Fetch / pull shared skills (`SKILL.md`)** and their learned **Flow Memories** from a shared Walrus Memory namespace (e.g., `memwal-team-skills` or `design-skills`) into `~/.agents/skills/` and `~/.gemini/config/skills/`.
2. **Host / push a new or updated `SKILL.md`** into the shared Walrus Memory namespace so teammates can pull it with their Delegate Key.
3. **Update Flow Memory ("Teach Skill")**: Record a newly discovered rule, edge case, escalation rule, or correction against a specific skill (`[FLOW:<skill-name>]`) so every teammate's agent picks up where the team left off across sessions and tools.

---

## Prerequisite: Shared Delegate Key MCP Configuration

Teammates share a Walrus Memory **Account ID** (`MEMWAL_ACCOUNT_ID`), a **Delegate Key** (`MEMWAL_PRIVATE_KEY`), and a **Namespace folder** (`MEMWAL_NAMESPACE`, e.g. `memwal-team-skills`) inside `.mcp.json` using the standard `@mysten-incubation/memwal-mcp` server:

```json
{
  "mcpServers": {
    "memwal": {
      "command": "npx",
      "args": ["-y", "@mysten-incubation/memwal-mcp"],
      "env": {
        "MEMWAL_ACCOUNT_ID": "<SHARED_ACCOUNT_ID_0x...>",
        "MEMWAL_PRIVATE_KEY": "<SHARED_DELEGATE_PRIVATE_KEY>",
        "MEMWAL_NAMESPACE": "memwal-team-skills",
        "MEMWAL_SERVER_URL": "https://relayer.dev.memwal.ai"
      }
    }
  }
}
```

*(Use `https://relayer.memory.walrus.xyz` for `production` or `https://relayer.dev.memwal.ai` for `dev`.)*

---

## Memory Tagging Contract inside a Namespace Folder

A Walrus Memory `namespace` acts as a **Skill Folder** (e.g. `memwal-team-skills`). Every memory stored inside that namespace uses one of three structured prefixes so both coding agents and the **MemWal Skill Graph & Trajectory Eval Harness UI** can parse and build the skill graph deterministically:

1. **Base Skill Definition (`[SKILL:<skill-name>]`)**:
   ```text
   [SKILL:memwal-qa]
   ---
   name: memwal-qa
   description: ...
   ---
   # Full SKILL.md content...
   ```
2. **Learned Flow Memory / Upgrade (`[FLOW:<skill-name>]`)**:
   ```text
   [FLOW:memwal-qa] [author:@harry] [severity:hard-rule] [links:memwal-dev-wallet,memwal-review]
   Standalone demo apps (apps/chatbot, apps/noter, apps/researcher) are retired and disabled. Never run QA or merge PRs for them; close PRs and mark GitHub issues as "not planned".
   ```
3. **Global Team Rule (`[RULE:<rule-name>]`)**:
   ```text
   [RULE:GEMINI.md]
   # Core Team Rules content...
   ```

---

## Workflows

### 1. Fetch / Sync Skills from Walrus Memory to Local Disk

When the user says *"pull skills from Walrus"*, *"fetch skill `<skill-name>`"*, or *"sync `memwal-team-skills`"*:

1. Call `memwal_recall` with:
   - Single skill: `query: "[SKILL:<skill-name>] [FLOW:<skill-name>]"` (with `limit: 20`)
   - Full namespace index rebuild (if empty): call `memwal_restore` first, then `memwal_recall`.
2. Separate the returned Walrus memories into:
   - The newest `[SKILL:<skill-name>]` payload (base `SKILL.md`).
   - All `[FLOW:<skill-name>]` payloads ordered newest-first (`created_at` / `blob_id`).
3. Compile the synced skill file by appending the learned Flow Memories to the bottom of `SKILL.md`:
   ```markdown
   ---
   ## Learned Team Flow Memory (Synced from Walrus Memory)
   > Namespace: `memwal-team-skills`
   - **Blob `<blob_id>` (`<created_at>`)**: <Flow Memory rule text>
   ```
4. Write to `~/.agents/skills/<skill-name>/SKILL.md` and ensure `~/.gemini/config/skills/<skill-name>` symlinks to `~/.agents/skills/<skill-name>`.

### 2. Teach a Skill (Add Flow Memory Node)

When the user says *"teach `<skill-name>` that..."*, *"update flow memory for `<skill-name>`"*, or corrects a mistake made while running `<skill-name>`:

1. Format the learned rule concisely with the `[FLOW:<skill-name>]` prefix and any related skills in `[links:...]`:
   ```text
   [FLOW:<skill-name>] [links:<related-skill-1>,<related-skill-2>]
   <Clear, actionable rule or edge case learned during this session>
   ```
2. Call `memwal_remember` with that text.
3. Poll `memwal_remember_status` (if available) or report the accepted `job_id` / `blob_id`.
4. Also append the rule locally to `~/.agents/skills/<skill-name>/SKILL.md` under `## Learned Team Flow Memory (Synced from Walrus Memory)` so the current machine has it immediately.

### 3. Host / Push Local Skills to Walrus Memory

When the user says *"push my skills in `<folder>` to Walrus"* or *"publish `<skill-name>` to the team namespace"*:

1. Read each `<skill-name>/SKILL.md` (and `rules/GEMINI.md` if present).
2. Prefix each skill with `[SKILL:<skill-name>]\n` and call `memwal_remember_bulk` (or `memwal_remember` for a single skill).
3. Report the `job_ids` / `blob_ids` so teammates and the **MemWal Skill Harness UI** can immediately visualize and pull them.

## Live Flow Memories (Walrus Recalled)
- **[FLOW:memwal-skill-hub]** (workflow-update · blob `zhQZcZCUElxe3vOeDLbbq9vh9K0UyzpOU-QwmUGsj1I` · by `@harrymove-ctrl`): Share team skills and learned tips automatically across agents using the Walrus MCP config.
  - *Rationale*: Every teammate gets the latest skill notes without manual file copying.
