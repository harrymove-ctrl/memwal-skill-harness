#!/usr/bin/env node
// One real agent recall, done the way a connected agent does it: read the team's rules for a skill from
// Walrus Memory, then save the receipt the Live screen reads. The receipt is a paid mainnet write and
// cannot be deleted, so this refuses to run twice unless --again is passed. It never prints a key.
//   node scripts/log-one-recall.mjs
import { MemWal } from "@mysten-incubation/memwal";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const MARKER = ".tmp/one-recall-logged.json";
if (existsSync(MARKER) && !process.argv.includes("--again")) {
  console.log("Already logged:", readFileSync(MARKER, "utf8"));
  process.exit(0);
}

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
}

const namespace = process.env.VITE_MEMWAL_NAMESPACE || "memwal-team-skills";
const skill = "memwal-qa";
const agent = "claude-code";
const author = "@harrymove-ctrl";

const client = MemWal.create({
  key: process.env.MEMWAL_PRIVATE_KEY,
  accountId: process.env.VITE_MEMWAL_ACCOUNT_ID,
  serverUrl: process.env.VITE_MEMWAL_SERVER_URL || "https://relayer.memory.walrus.xyz",
  namespace,
});

const recalled = await client.recall(`[RULE] [skill:${skill}] team rules for ${skill}`, { namespace, limit: 30, sort: "recent" });
const hits = (recalled?.results ?? []).filter((row) => String(row.text ?? "").includes(`[skill:${skill}]`) && String(row.text ?? "").startsWith("[RULE:"));
const ids = new Set(hits.map((row) => String(row.text).match(/^\[RULE:([^\]]+)\]/)?.[1]));
console.log(`Recalled ${ids.size} rules for ${skill} from Walrus Memory`);
if (ids.size === 0) {
  console.log("Nothing recalled, so nothing was logged.");
  process.exit(1);
}

const receipt = `[AGENT_LOG:RECALL] [agent:${agent}] [author:${author}] [target:${skill}] [rules:${ids.size}]`;
const saved = await client.remember(receipt, { namespace });
const record = { at: new Date().toISOString(), receipt, id: saved?.id ?? null, blobId: saved?.blobId ?? null, jobId: saved?.job_id ?? saved?.jobId ?? null };
writeFileSync(MARKER, JSON.stringify(record, null, 2));
console.log("Logged:", JSON.stringify(record));
console.log("LOG_RECALL_OK");
