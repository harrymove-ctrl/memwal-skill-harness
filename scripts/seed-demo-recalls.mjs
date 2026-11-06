#!/usr/bin/env node
/*
 * Writes sample recall logs into a demo space, so Live has something to show before real agents
 * have run there. Each line is a paid, permanent write to Walrus mainnet.
 *
 * Prefer real recalls: connect two agents to the demo space and let them work. If you use this
 * instead, say on camera and in the blog post that the activity is sample data. Each line carries
 * [seeded:true], so the memory itself says what it is.
 *
 * Shows the plan and writes nothing unless you pass --yes:
 *   node --env-file=.env.local scripts/seed-demo-recalls.mjs --namespace my-demo-space
 *   node --env-file=.env.local scripts/seed-demo-recalls.mjs --namespace my-demo-space --yes
 */
import { MemWal } from "@mysten-incubation/memwal";

const PROTECTED_SPACES = new Set(["memwal-team-skills"]);

const SAMPLE = [
  ["claude-code", "@demo-teammate-a", "memwal-qa", 2],
  ["cursor", "@demo-teammate-b", "memwal-review", 1],
  ["claude-code", "@demo-teammate-a", "memwal-review", 1],
  ["codex", "@demo-teammate-c", "memwal-qa", 2],
];

function argument(name) {
  const at = process.argv.indexOf(name);
  return at >= 0 ? process.argv[at + 1] : undefined;
}

const namespace = argument("--namespace");
const confirmed = process.argv.includes("--yes");

if (!namespace) {
  console.error("Pass --namespace with the demo space to write to.");
  process.exit(2);
}
if (PROTECTED_SPACES.has(namespace)) {
  console.error(`${namespace} is a real team space. Sample activity does not belong there.`);
  process.exit(2);
}

const lines = SAMPLE.map(
  ([agent, author, target, rules]) =>
    `[AGENT_LOG:RECALL] [agent:${agent}] [author:${author}] [target:${target}] [rules:${rules}] [seeded:true]`
);

console.log(`Space: ${namespace}`);
for (const line of lines) console.log(`  ${line}`);

if (!confirmed) {
  console.log("Nothing was written. Add --yes to write these to Walrus mainnet.");
  process.exit(0);
}

const key = process.env.MEMWAL_PRIVATE_KEY;
const accountId = process.env.MEMWAL_ACCOUNT_ID || process.env.VITE_MEMWAL_ACCOUNT_ID;
if (!key || !accountId) {
  console.error("MEMWAL_PRIVATE_KEY and MEMWAL_ACCOUNT_ID must be set.");
  process.exit(2);
}

const client = MemWal.create({
  key,
  accountId,
  serverUrl: process.env.MEMWAL_SERVER_URL || "https://relayer.memory.walrus.xyz",
  namespace,
});

for (const line of lines) {
  const accepted = await client.remember(line, { namespace });
  console.log(`Accepted: ${accepted?.job_id ?? "no job id returned"}`);
}
console.log("Accepted means queued. Check Live in a minute or two.");
