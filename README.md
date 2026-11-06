<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/brand/lockup-full-on-dark.svg">
  <img src="public/brand/lockup-full-on-light.svg" alt="MemWal Skill Harness" height="56">
</picture>

# MemWal Skill Harness — Namespace Skill Graph & Memory Trajectory Eval

Built for **Walrus × Tatum: Total Recall ("Smart Agents for Real Life")**.

Instead of sharing static `.zip` / `.tar.gz` skill bundles whenever team workflows evolve, **MemWal Skill Harness** hosts your team's **`SKILL.md` skills** and **living Flow Memories (`[FLOW:<skill>]`)** inside a shared **Walrus Memory Namespace Folder** (`memwal-team-skills`, `design-skills`, etc.) accessed via a shared **Account ID + Delegate Key** and the existing **`@mysten-incubation/memwal-mcp`** server.

---

## Key Features

1. **Namespace as a Skill Folder + Interactive 2D Knowledge Graph**:
   - Pre-loaded with **`memwal-team-skills`** (14 `SKILL.md` skills including `memwal-skill-hub`, `memwal-qa`, `memwal-review`, `memwal-dev-wallet`, `walm-ticket`, `gh-issue-fixed`, `rust-*`, plus `rules/GEMINI.md`) and **`design-skills`** (10 UI/SwiftUI craft skills).
   - Visualizes the **Namespace Hub → Category Clusters → Skill Nodes (`[SKILL:id]`) → Cross-Skill Dependencies → Orbiting Flow Memory Blobs (`[FLOW:id]`)**.
2. **DeepSeek-Style Memory Trajectory Eval Harness**:
   - Step-by-step expandable pipeline:
     1. `STEP 1 · SKILL FETCH` — Loads base `SKILL.md` from the namespace.
     2. `STEP 2 · WALRUS RECALL` — Recalls attached `[FLOW:<skill>]` blobs (encrypted via Seal on Walrus) with similarity scores, `blob_id`, and author Delegate Key.
     3. `STEP 3 · <think> TRACE` — Shows how the agent resolves conflicts between stale base `SKILL.md` lines and newer team Flow Memories (`newest-wins`).
     4. `STEP 4 · COLD vs. WALRUS RECALL A/B VERDICT` — Side-by-side comparison proving why static skills fail and Walrus Flow Memory succeeds.
     5. `STEP 5 · + TEACH SKILL` — 1-click writeback that commits a new `[FLOW:<skill>]` node to Walrus Memory via Delegate Key, spawns the node in the 2D Graph, and updates the compiled `SKILL.md`.
3. **Zero Custom MCP Server — Reuses `@mysten-incubation/memwal-mcp`**:
   - Generates a ready-to-paste `.mcp.json` configured with `MEMWAL_ACCOUNT_ID`, `MEMWAL_PRIVATE_KEY` (delegate key), `MEMWAL_NAMESPACE`, and `MEMWAL_SERVER_URL` (`dev` or `prod`).
   - Ships with the **`memwal-skill-hub`** bootstrap skill (`skills/memwal-skill-hub/SKILL.md`) so Claude Code, Antigravity, Cursor, and Gemini CLI can pull compiled `SKILL.md` files and push `[FLOW:<skill>]` updates directly through `memwal_recall` and `memwal_remember`.

---

## Quick Start

```bash
cd /Volumes/Dev/memwal-skill-harness
pnpm install
pnpm dev
```

Open **http://localhost:5188** in your browser.
