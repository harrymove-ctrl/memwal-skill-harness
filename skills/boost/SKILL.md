---
name: boost
description: Invoke the Antigravity Boost (Teamwork) multi-agent orchestrator on Gemini 4 Argon (zroute/gemini-4-argon or Antigravity CLI). Decomposes complex tasks into .agents/teamwork/ state files (ORIGINAL_REQUEST.md, BRIEFING.md, DISPATCH.md), dispatches parallel Argon worker/QA subagents via delegate_task (or native Antigravity subagents), and runs an empirical integrity verification gate before completion.
---

# Boost (`/boost`) — Multi-Agent Orchestrator for Gemini 4 Argon

This skill brings Antigravity's `/boost` (`teamwork_preview` / `teamwork_orchestrator`) multi-agent swarm workflow to **Gemini 4 Argon** across both:
1. **T3 Code (`zroute` provider / `zroute/gemini-4-argon` on Pi runtime)** via T3's `orchestrator_capabilities` + `delegate_task`
2. **Antigravity CLI (`agy`)** via native `/boost` (`teamwork_interviewer` -> `teamwork_orchestrator` -> worker/auditor subagents)

## How to invoke

- **Slash command (T3 Code `zroute` or `agy` CLI):**
  ```text
  /boost <your task or feature request>
  /boost [skip-interview] <your task or feature request>
  ```
- **Inline skill chip (T3 Code):**
  ```text
  $boost <your task or feature request>
  /skill:boost <your task or feature request>
  ```

## Execution Protocol (when running on `zroute/gemini-4-argon` in T3 Code / Pi)

### Phase 1 — Scope & Interview Gate (`[skip-interview]` supported)
1. If the user's request has critical ambiguities **and** does not include `[skip-interview]` (or "do all", "handle all", "autonomous"):
   - Write `.agents/teamwork/interviewer/prompt_draft.md` capturing the request verbatim and listing concise `[OPEN: ...]` questions.
   - Ask the user the minimal clarifying questions needed before spawning workers.
2. If the request is clear or includes `[skip-interview]` / autonomous execution intent:
   - Proceed directly to Phase 2 without blocking on questions.

### Phase 2 — Teamwork Workspace Initialization (`.agents/teamwork/`)
Record authoritative state files in `.agents/teamwork/`:
1. **`.agents/teamwork/ORIGINAL_REQUEST.md`** — Verbatim user request, active constraints, and integrity mode (`Development` or `Demo`).
2. **`.agents/teamwork/BRIEFING.md`** — Codebase architecture summary, affected modules, acceptance criteria, and verification commands.
3. **`.agents/teamwork/DISPATCH.md`** — Workstream decomposition table assigning disjoint file scopes and verification targets to each subagent.

### Phase 3 — Parallel Multi-Agent Dispatch on `zroute/gemini-4-argon`
1. Call `orchestrator_capabilities` once to confirm the active `zroute` provider instance (`zroute-native`) and model (`zroute/gemini-4-argon`).
2. For independent workstreams (survey, implementation, tests/QA), spawn child agents via `delegate_task`:
   - `role`: `"research"`, `"implementation"`, `"test"`, or `"review"`
   - `target`: `{ providerInstanceId: "zroute-native", model: "zroute/gemini-4-argon", options: { thinking: "high" } }`
   - Give each worker its exact assignment from `.agents/teamwork/DISPATCH.md` and point it to `.agents/teamwork/ORIGINAL_REQUEST.md`.
   - Use `isolation: "worktree"` only when parallel workers would otherwise edit overlapping files; use `isolation: "shared"` when file scopes are strictly disjoint.

### Phase 4 — Integrity Audit & Empirical Verification Gate
Before reporting completion:
1. **No Facades / No Hardcoded Outputs:** Verify every changed file maintains real state and genuine runtime behavior.
2. **Empirical Suite Execution:** Run the project's real build, typecheck, and verification commands end-to-end (for `near-ai-chat`: `pnpm check:near`, `pnpm sandbox:probe`, `pnpm check:cases`, `pnpm check:tools`, `pnpm eval`).
3. **Synthesize Deliverable:** Summarize completed workstreams, verification evidence, and updated files.
