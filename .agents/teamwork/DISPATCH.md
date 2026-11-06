# Argon Dispatch Table: Phase 3 to Phase 6 Execution

| Workstream | Owner / Model Role | Disjoint File Scope | Verification Command & Gate | Status |
| :--- | :--- | :--- | :--- | :--- |
| **WS-1: Frontend Real API Cutover & Sync State** | `Argon Primary` (`implementation`) | `src/lib/api.ts`, `src/lib/consoleSkillsApi.ts`, `src/App.tsx` (removed dead `src/components/SkillInspector.tsx`) | `npx vitest run && npm run build` | DONE (`10/10` Vitest passed, `0` TS errors) |
| **WS-2: Dual-Store `[SKILL_REF:]` & `memwal-skill-hub` Sync** | `Argon Primary` (`implementation`) | `scripts/migrate-skills-to-console.mjs`, `skills/memwal-skill-hub/SKILL.md` | `node scripts/migrate-skills-to-console.mjs --refs-only --dry-run` | DONE (`19` `[SKILL_REF]` pointers verified) |
| **WS-3: `If-Match` `409` Conflict & Allowlist Guard** | `Argon Primary` (`implementation`) | `server/namespaceSkillsApi.mjs`, `server/consoleGateway.mjs`, `src/components/SkillsWorkspace.tsx` | `npx vitest run src/lib/memoryGateway.test.ts` | DONE (`409` conflict + `403` allowlist verified) |
| **WS-4: Playwright Reload Persistence & Conflict E2E** | `Argon Primary` (`test`) | `src/lib/memoryGateway.test.ts`, `scripts/verify-e2e-console-rules.mjs` | `node scripts/verify-e2e-console-rules.mjs` | DONE (`ALL CHECKS PASSED`) |
