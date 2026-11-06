---
name: routing
description: Route and select the correct MCP server and Linear workspace (CommandOSS/PRDEA vs MystenLabs/WALM) dynamically based on the current directory path and registry.yaml.
---

# MCP & Linear Workspace Routing Skill

Use this skill whenever an agent needs to access MCP servers or Linear issue tracking tools, ensuring operations route to the correct workspace and team based on the active project directory path.

## When to Use

- Before calling any Linear MCP tool (`list_issues`, `save_issue`, `get_team`, `list_teams`, etc.).
- When working across multi-project environments (`commandoss` vs `mysten-lab`).
- When determining which tracker workspace and team overview URL applies to the current session.

## Core Rules

1. **Path-to-Workspace Association**:
   - `/Users/synasapmob/Documents/commandoss/*` or `*Prydea*` or `*commandoss*`:
     - Linear Workspace: `https://linear.app/commandoss`
     - Team: `PRDEA`
     - Team Overview: `https://linear.app/commandoss/team/PRDEA/overview`
     - Auth Config: `~/.mcp-auth/commandoss`
   - `/Users/synasapmob/Documents/mysten-lab/*` or `*mysten*` or `*walrus*` or `*sui*`:
     - Linear Workspace: `https://linear.app/mysten-labs`
     - Team: `WALM`
     - Auth Config: `~/.mcp-auth/mysten-labs`
   - Any project with `linear.status: disabled` (e.g. `githubRepo/helloWorld`):
     - Never make Linear MCP calls.

2. **Step-by-Step Procedure**:
   - **Step 1**: Check the current working directory (`pwd` or workspace context).
   - **Step 2**: Inspect `registry.yaml` (workspace root or `~/.gemini/config/registry.yaml`).
   - **Step 3**: Identify the project matching the current path.
   - **Step 4**: Verify the configured Linear workspace. If working on Prydea, ensure you are interacting with team `PRDEA` in `commandoss` (`https://linear.app/commandoss/team/PRDEA/overview`).
   - **Step 5**: If the active MCP session is connected to a different workspace (e.g. `mysten-labs` when in Prydea), isolate session tokens via `MCP_REMOTE_CONFIG_DIR=~/.mcp-auth/commandoss` or prompt the user for the corresponding workspace re-authentication.
