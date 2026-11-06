# Argon Briefing: Phase 3 to Phase 6 Completion for Walrus Console & Team Rules

## 1. Completed Baseline (Verified Live on `2026-11-03`)

1. **Phase 0 (Secret Containment & Bundle Guard)**:
   1. `scripts/check-bundle-secrets.mjs` enforces zero private keys (`suiprivkey1`, `hbr_`, `hbradm_`, 64-hex secrets) in `dist/`.
2. **Phase 1 & Phase 2 (Server Gateways & HTTP API)**:
   1. `server/consoleGateway.mjs` connects to Walrus Console bucket `217e53fc-36ff-4d1b-8834-04f69c2ef553` (`https://api.console.walrus.xyz/api/v1/buckets/217e53fc-36ff-4d1b-8834-04f69c2ef553/files`) and `@mysten-incubation/walrus-console-mcp`.
   2. `server/memoryGateway.mjs` implements event-sourced rule folding (`[RULE:<ruleId>]`, `[RULE_STATE:<ruleId>]`, `[SKILL_REF:<id>]`, and legacy `[FLOW:<skill>]`).
   3. `server/namespaceSkillsApi.mjs` exposes `GET/PUT/DELETE /api/ns/:ns/skills(:id)` and `GET/POST /api/ns/:ns/rules(:ruleId/state|/bake)` on both `vite.config.ts` (`5188`) and `server.mjs` (`4188` and Railway).
3. **Phase 4A & UI Redesign (19 Skills Uploaded + Uselayouts UI)**:
   1. All `19` `SKILL.md` files (including `ui-ux-qa`, `concise-ui-copy`, `interface-bts`, `react-bits-pro`, `boost`) are SEAL-encrypted in bucket `217e53fc-36ff-4d1b-8834-04f69c2ef553`.
   2. `src/App.tsx`, `src/components/TrajectoryEvalHarness.tsx`, `src/components/SkillsWorkspace.tsx`, and `src/components/McpSyncPanel.tsx` use the minimal Uselayouts 3-zone design with `Argon Code` first in `Connect`.

## 2. Remaining Architecture & Implementation Targets

1. **WS-1: Frontend Full API Cutover (`src/lib/consoleSkillsApi.ts`, `src/App.tsx`)**:
   1. Ensure every skill save (`handleSyncSkillEditToWalrus`, `handleCreateNewSkill`) and rule action (`handleAddFlowMemory`, `handleUpdateFlowMemory`, `handleToggleRuleState`, `handleBakeRuleIntoSkill`, `handleDeleteFlow`) executes through `/api/ns/:ns/skills` and `/api/ns/:ns/rules` and updates real `fileId`, `blobId`, `rev`, `sha256`, and `syncState` (`saving`, `saved`, `conflict`, `failed`).
   2. Scope `setSkills` updates by both `s.id` and `s.namespace` so multi-namespace edits never collide, and remove unused `src/components/SkillInspector.tsx`.
2. **WS-2: `[SKILL_REF:]` & `[RULE:]` Dual-Store Indexing (`scripts/migrate-skills-to-console.mjs`, `skills/memwal-skill-hub/SKILL.md`)**:
   1. Write `[SKILL_REF:<id>] [bucket:217e53fc-36ff-4d1b-8834-04f69c2ef553] [file:<fileId>] [rev:1] [sha256:<hash>]` pointers and folded `[RULE:<ruleId>]` events into Walrus Memory so agents with only `memwal-mcp` can locate the canonical Console `fileId` and apply `on`/`off`/`deleted` rule state.
   2. Update `skills/memwal-skill-hub/SKILL.md` with the dual-store protocol and upload revision `2` to bucket `217e53fc-36ff-4d1b-8834-04f69c2ef553`.
3. **WS-3: Revision Conflict (`409 If-Match`) & Allowlist Session Guard (`server/namespaceSkillsApi.mjs`, `src/components/SkillsWorkspace.tsx`)**:
   1. Enforce `If-Match: <rev>` optimistic concurrency on `PUT /api/ns/:ns/skills/:id`, returning HTTP `409 Conflict` when a stale revision is saved, and surface a reload/diff banner in `SkillsWorkspace.tsx`.
   2. Validate caller address headers (`x-memwal-caller-address`) against the namespace allowlist (`0x25f79761fee2eb67ca61b21ee8574b6bf8abd1ba7bfdf933db02a864e807e981`, `0xbe908ba01d26a06e72a6d859ee0fcd2cb3f7727f67099a042b3fb9ad3c06ba8b`, and configured team delegates) on write routes.
4. **WS-4: Empirical Unit & Playwright E2E Verification (`src/lib/memoryGateway.test.ts`, `scripts/verify-e2e-console-rules.mjs`)**:
   1. Expand Vitest tests to cover rule creation, inline edit, `off` toggle, `on` toggle, `deleted` tombstone, `bake` into `SKILL.md`, and `409` revision conflict.
   2. Run headless Playwright E2E verification confirming that rule toggles, rule deletions, and skill edits persist across browser reloads against `/api/ns/memwal-team-skills/*`.
