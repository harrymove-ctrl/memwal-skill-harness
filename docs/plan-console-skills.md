# Plan: SKILL.md files in a Walrus Console bucket, team rules in Walrus Memory

Status: draft for review, 2026-11-02.

## Goal

Make the product's claim true end to end:

- **Every SKILL.md file lives in a Walrus Console bucket.** One bucket per team namespace (for example `memwal-team-skills`). Files are Seal encrypted by Console.
- **Every team rule lives in Walrus Memory.** One Walrus Memory namespace with the same name. Rules are written once and recalled by every agent.
- **The app reads and writes both stores for real.** It says "Synced" only after a write has been confirmed.

## Where things stand today

A code audit (file and line references are in the session notes) found:

1. **Nothing talks to Walrus Console.** `src/lib/consoleBuckets.ts` only builds config strings. "Buckets" created in onboarding are local objects.
2. **Skills live in browser state and localStorage.** The starting list is a file bundled at build time (`src/data/generatedSkills.ts`). "Save & Sync" writes a `[SKILL:]` text memory into Walrus Memory, not a Console file.
3. **Team rules are written to Walrus Memory, but edits, toggles and deletes are not.** An edit adds a second memory and keeps the old one. A toggle is component state that resets on remount. A delete is local, so the next pull brings the rule back.
4. **Pull Latest is a single semantic recall capped at 80 results.** It is not a full listing, and when there are several versions the oldest one wins.
5. **Many success messages are unconditional.** That covers the "Synced" badge, "Console receipt", "verified live agent recall", and blob links that point at unrelated fallback blobs.
6. **Secrets reach the browser.** The real delegate key and the account owner's secret key are inside the built bundle in `dist/`, because they use `VITE_` variable names. A delegate key, a Tatum key, an Enoki key and a Console `hbr_` key are also hardcoded as fallbacks in source.
7. **Walrus Memory is append-only from the SDK.** `@mysten-incubation/memwal` 0.1.10 has no delete. Only the test mock has `forget`.

## Target architecture

```
Browser (no secrets)
   │  fetch /api/skills, /api/rules  (wallet-signed session)
   ▼
Harness server (Node 24)
   ├─ Console gateway ── stdio MCP client ──► @mysten-incubation/walrus-console-mcp ──► console.walrus.xyz
   │     list_files, upload_file, download_file, update_file, delete_file,
   │     get_file_status, get/update_bucket_metadata
   └─ Memory gateway ── @mysten-incubation/memwal (server key) ──► Walrus Memory relayer
         rememberBulk, listMemories, recall
Coding agents (Claude Code, Cursor, Codex, Antigravity)
   ├─ walrus-console-mcp  → download_file the SKILL.md
   └─ memwal-mcp          → memwal_recall the team rules
```

Why the server runs the official Console MCP instead of calling the Console API directly: the MCP already does Seal policy checks, encryption and decryption, and owner address pinning. Reimplementing that is the riskiest part of the job and gains nothing. The server launches the pinned package as a child process over stdio, with `CONSOLE_MCP_ALLOWED_DIRS` set to one server-owned work folder.

### Console bucket layout (one bucket per namespace)

| Item | Value |
| :--- | :--- |
| File name | `<skill-id>.SKILL.md` |
| File tags | `skill:<id>`, `category:<category>`, `rev:<n>`, `sha256:<content hash>` |
| File description | the skill's one-line description |
| Bucket metadata | `{ "schema": "memwal-skill-harness/v1", "namespace": "...", "memwalAccountId": "...", "index": { "<skill-id>": { "fileId": "...", "rev": n, "sha256": "...", "updatedAt": "...", "author": "0x..." } } }` |

Console has no in-place content update, so a save is: write the new file, wait for it, move the pointer, then delete the old one.

1. Upload the new revision with `upload_file`.
2. Poll `get_file_status` until it reports `completed`.
3. Point the bucket metadata index at the new `fileId` with `update_bucket_metadata`.
4. Delete the previous revision with `delete_file`. Keep the last 3 revisions if history is wanted.

Readers only trust the index, so a half-finished save is never visible. Two people saving the same skill at once is caught by comparing `rev` before step 3. The loser gets a conflict and reloads.

### Walrus Memory layout (same namespace name)

Rules are an event log, because the store cannot delete:

| Memory text prefix | Meaning |
| :--- | :--- |
| `[RULE:<ruleId>] [skill:<id>] [severity:...] [author:...]` + rule text | a rule is created, or replaced by a newer revision |
| `[RULE_STATE:<ruleId>] [state:on\|off\|deleted] [author:...]` | toggle or delete |
| `[AGENT_LOG:...]` | activity receipts (kept as today) |
| `[SKILL_REF:<id>] [bucket:<bucketId>] [file:<fileId>] [rev:n] [sha256:...]` | pointer so an agent that only has memwal-mcp can find the canonical file |

The current rule set comes from folding every event per `ruleId`, newest first. Reads use `listMemories` with paging, never a capped semantic recall. Existing `[FLOW:<skill>]` memories are read as legacy rules, and the migration gives each a stable `ruleId`. The `memwal-skill-hub` skill teaches agents the same fold, so a disabled or deleted rule is ignored even when a raw `memwal_recall` returns it.

## Phases

### Phase 0 status (2026-11-02)

Done in code:
- The client reads only named public `VITE_` values (`src/lib/memwalBridge.ts`, `src/lib/walletAuth.ts`, typed in `src/vite-env.d.ts`).
- Hardcoded keys are removed from `src/` and `server/`. Missing server keys now fail with a clear error instead of falling back.
- Secret env vars use non-`VITE_` names: `MEMWAL_PRIVATE_KEY`, `MEMWAL_OWNER_SECRET_KEY`, `TATUM_API_KEY`, `ENOKI_API_KEY`.
- Tatum calls send no key from the browser. The proxy adds `TATUM_API_KEY` (in dev, configured in `vite.config.ts`).
- The sponsor endpoint ignores caller-supplied move call targets.
- `npm run build` runs `scripts/check-bundle-secrets.mjs`, and the build is clean.
- New delegate key registered on mainnet, verified, and in `.env.local`. Add transaction: `AFZNLNKPeb5nrhVCqi8qJKRrbxVXkEZUMwnK89LW1eLT`.

- Railway (project `angelic-friendship`, service `memwal-skill-harness`, production): `MEMWAL_PRIVATE_KEY` set to the new key, `VITE_MEMWAL_DELEGATE_KEY` deleted, clean build deployed. The live JS has no secret, and the live API works.
- Old delegate key revoked on chain. Remove transaction: `AhjZxscsA8wZT38HYpNwH9M3VM1rtLvnZNddLzG3d4F1`.

Still open (dashboard actions only the owner can take):
- Revoke the two Console `hbr_live` keys and the Console service key at console.walrus.xyz → Integrations.
- Rotate the Tatum key (dashboard.tatum.io) and the Enoki private key (Enoki portal), then update `.env.local` and Railway.

### Phase 0. Contain the secrets (do first, small)

- Rotate the delegate key, the owner secret key, the Enoki key, the Tatum key and the Console `hbr_` key. Every one of them sits in source or in a built bundle.
- Remove `VITE_MEMWAL_DELEGATE_KEY` and `VITE_MEMWAL_OWNER_SECRET_KEY` from the client, and delete every hardcoded fallback secret.
- Rebuild `dist/` and redeploy, then confirm the new bundle contains no secret. Add a build check that fails on `suiprivkey1`, `hbr_` or a 64 hex character string in `dist/`.
- **Done when:** the build check passes and the deployed site's JS contains no key.

### Phase 1. Server gateways

- Pin `@mysten-incubation/walrus-console-mcp@0.1.1` in `server/`, and run it with Node 24.22.1 LTS. It rejects Node 25, which this machine runs today.
- Add `server/consoleGateway.mjs`. It holds one MCP client session and wraps list, download, upload with status polling, delete and the metadata index. It keeps a small cache keyed by `fileId` and `sha256`.
- Add `server/memoryGateway.mjs`. It covers paged `listMemories`, the rule fold, and `rememberBulk` with `rememberBulkAndWait`, so callers get the real blob id back.
- Credentials are server-only environment variables: `CONSOLE_API_KEY`, `CONSOLE_SERVICE_PRIVATE_KEY`, the two pinned addresses, `MEMWAL_ACCOUNT_ID` and `MEMWAL_PRIVATE_KEY`.
- **Done when:** a script lists the real bucket, round-trips one SKILL.md, and writes and folds one rule against the real services.

### Phase 2. HTTP API

| Method and path | Does |
| :--- | :--- |
| `GET /api/ns/:ns/skills` | index from bucket metadata, plus each skill's description |
| `GET /api/ns/:ns/skills/:id` | decrypted SKILL.md content, `rev`, `sha256`, `fileId` |
| `PUT /api/ns/:ns/skills/:id` | new revision with the 4-step save, `If-Match: <rev>`, `409` on conflict |
| `DELETE /api/ns/:ns/skills/:id` | removes it from the index, then deletes the files |
| `GET /api/ns/:ns/rules` | folded current rules, each with its latest blob id |
| `POST /api/ns/:ns/rules` | new rule or new revision |
| `POST /api/ns/:ns/rules/:ruleId/state` | `on`, `off` or `deleted` |
| `POST /api/ns/:ns/rules/:ruleId/bake` | appends the rule to the SKILL.md as a new revision, then marks the rule `off` |

- Every write needs a session signed by a wallet address that the namespace allows. Today that is the server allowlist. Later it becomes the `namespace_skill_vault` contract check.
- Remove `verify-access` auto-registration of any address, and the hardcoded fallback citations and counts.

### Phase 3. Frontend on the real API

- The browser stops building a MemWal client and holds no keys. All skill and rule traffic goes through the API.
- Add a `src/lib/api.ts` client, and wire the existing handlers to it: create, edit, save, delete, add rule, edit rule, toggle, delete rule, bake, pull and push.
- Extend the types: on `HostedSkillNode` add `bucketId`, `fileId`, `rev`, `sha256` and `syncState`. On `FlowMemoryNode` add `ruleId`, `state`, `memoryBlobId` and `rev`.
- Honest status everywhere: `saving`, `saved` with a real `fileId` or `blobId`, `conflict`, `failed` with the error. Remove the fallback blob IDs, and drop the walruscan link when there is no real blob.
- Pull Latest becomes "reload the index and rules". Push Folder becomes "upload local changes that are not saved yet".
- The bundled seed becomes an offline demo set. It shows a clear "offline sample" label and is never written back.
- Fix the namespace-blind `setSkills` match (it matches by id only).
- Delete `SkillInspector.tsx`, which is dead code.

### Phase 4. Migration

- Add `scripts/migrate-to-console.mjs`. It creates or finds the buckets `memwal-team-skills` and `design-skills`, then uploads each SKILL.md from the source folders. It is safe to re-run, because it skips a file when the `sha256` matches.
- It reads every existing `[FLOW:]` memory and writes one `[RULE:]` event per distinct rule with a stable `ruleId`.
- It writes `[SKILL_REF:]` pointers.
- It runs once with a dry-run flag first and prints a diff.

### Phase 5. Agent side

- Update `skills/memwal-skill-hub/SKILL.md`. To load a skill, an agent downloads it from the Console bucket (or reads the `[SKILL_REF:]` pointer), recalls `[RULE:]` and `[RULE_STATE:]` from Walrus Memory, and applies newest-wins. To teach a rule, it calls `memwal_remember` with a `[RULE:]` line.
- The Connect page generates config for both MCP servers, Console and Walrus Memory, for each IDE. Keys are referenced as variables, never printed.

### Phase 6. Teamspace contract (optional, after the core works)

- Replace the server allowlist with the `namespace_skill_vault` check. A caller's delegate address must be authorized for the namespace on chain before the server serves or accepts that namespace.
- Record each SKILL.md revision with a `SkillBlobCommitted` event, so changes can be audited on chain.

## Tests

- **Unit (vitest):** rule fold (create, edit, off, on, delete, legacy `[FLOW:]`), index update and conflict, bucket file naming and tags, secret scan.
- **Gateway integration:** runs against a dedicated test bucket and test namespace, behind `RUN_LIVE=1`, and cleans up after itself.
- **End to end (Playwright):**
  - Edit a skill in browser A, reload browser B, and see the new revision.
  - Toggle a rule off, reload, and it stays off.
  - Delete a rule, Pull Latest, and it stays deleted.
  - Make two conflicting saves and get a conflict message.
- **Build check:** no secrets in `dist/`.

## Risks

| Risk | Mitigation |
| :--- | :--- |
| Console MCP needs Node 22.23.4+, 24.22.1+ or 26.12.1+, and rejects Node 25 | Run the server and the MCP child on Node 24 LTS locally and on Railway |
| Console upload is asynchronous | Poll `get_file_status`, and move the index only after `completed` |
| Walrus Memory is append-only | Rule state is an event log, so readers and agents fold newest-wins |
| Console MCP is 0.1.x, so the API may change | Pin the version, and keep all calls in one gateway file |
| Latency of Seal decrypt plus Walrus reads | Server cache by `sha256`, and the list view reads only the index |
| Rotating keys breaks the current deployment | Do Phase 0 in one sitting with the redeploy |

## Decisions needed from you

1. **Console account and buckets.** Do the buckets `memwal-team-skills` and `design-skills` already exist in your Console space? If so, the bucket IDs are needed. If not, the migration creates them. Either way the server needs a Console key pair from Integrations → New API key, with read_write access.
2. **Key rotation.** Phase 0 rotates every key that sits in source today, and that includes the mainnet delegate key used in the demo. Confirm it is OK to rotate it now.
3. **History.** Keep the last 3 SKILL.md revisions in the bucket, or only the latest?
4. **Phase 6.** Include the on-chain teamspace check in this round, or after the core works?
