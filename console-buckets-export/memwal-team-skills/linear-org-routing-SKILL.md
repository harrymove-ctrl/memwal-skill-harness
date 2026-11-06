---
name: linear-org-routing
description: >-
  Use this when working with Linear issues/projects and the path or repo could
  belong to either Mysten Labs or CommandOSS — resolve which MCP server to call
  before any Linear tool use.
---
# Linear org routing

Use this whenever Linear work could touch more than one workspace (e.g. Mysten Labs vs CommandOSS). Linear MCP is one org per auth session, so this bot keeps separate servers and picks by path.

## Before any Linear tool call

1. Resolve the **working directory** for the task:
   - Prefer the path on the user's machine for the repo/folder they named or have open.
   - If they only named a project (MemWal, Prydea, …), map it through `registry.yaml` in this skill folder.
2. Read `registry.yaml` beside this skill (same folder as `SKILL.md`).
3. Match the path (or project name) against `path_patterns` / `name_patterns` **in order**. First match wins.
4. Use only the matched entry's `mcp_server` name for Linear tools. Never call a different Linear server for that task.
5. If nothing matches:
   - Ask which org (Mysten Labs / CommandOSS), or
   - Use `default_mcp_server` only when the user explicitly says the default is fine.
6. Say the choice briefly once ("using `linear-mysten` for this MemWal path") then proceed.

## Registry shape

```yaml
default_mcp_server: null
orgs:
  - id: mysten
    label: Mysten Labs
    mcp_server: linear-mysten
    path_patterns: [...]
    name_patterns: [...]
```

`mcp_server` must match the installed MCP server name exactly (`linear-mysten`, `linear-commandoss`).

## Editing the registry

When the user adds a repo or folder to an org, update `registry.yaml` only — do not hard-code paths into this recipe.

## MCP setup notes (for humans / install)

Two stdio servers, same Linear endpoint, **separate** auth dirs:

```text
linear-mysten:      MCP_REMOTE_CONFIG_DIR=<auth-dir>/mysten-labs
linear-commandoss:  MCP_REMOTE_CONFIG_DIR=<auth-dir>/commandoss
command: npx
args: ["-y", "mcp-remote", "https://mcp.linear.app/mcp"]
```

Authenticate each server once (pick the right Linear org in the OAuth flow). Do not reuse one auth dir for both.

## Live Flow Memories (Walrus Recalled)
- **[FLOW:linear-org-routing]** (hard-rule · blob `gs0M1js80k-OWvkYt7v08phKe3KC8PBINIOPowo7G-0` · by `@harrymove-ctrl`): Always select the linear-mysten MCP server for any MemWal or Walrus Memory path, never linear-commandoss.
  - *Rationale*: Prevents querying or creating WALM tickets in the wrong Linear organization.
