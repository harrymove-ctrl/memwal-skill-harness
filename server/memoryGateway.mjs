import { MemWal } from "@mysten-incubation/memwal";
import crypto from "node:crypto";
import fs from "node:fs";

const STATE_CACHE_PATH = "/tmp/memwal-ns-rules-state-v1.json";

const SEEDED_RULES_BY_NAMESPACE = {
  "memwal-team-skills": [
    {
      ruleId: "flow-ui-ux-minimal-zones",
      skillId: "ui-ux-qa",
      namespace: "memwal-team-skills",
      text: "Keep UI ultra-simple with 2 to 5 word titles, at most 3 actions per card, and inline visual proof.",
      rationale: "Eliminates button soup and text walls in Argon Code and Antigravity UI work.",
      severity: "hard-rule",
      state: "on",
      rev: 1,
      author: "@harrymove-ctrl",
      memoryBlobId: "z7BHX3brsgqcmDQXh2IzmoCj4g14XioezjkuIL1Fkk0",
      linkedSkills: ["concise-ui-copy", "interface-bts", "react-bits-pro"],
      updatedAt: "2026-11-02T09:00:00Z",
    },
    {
      ruleId: "flow-concise-copy-14w",
      skillId: "concise-ui-copy",
      namespace: "memwal-team-skills",
      text: "Write 1 short sentence (<= 14 words) per card and never stack multi-paragraph descriptions.",
      rationale: "Makes every screen readable in under 3 seconds.",
      severity: "hard-rule",
      state: "on",
      rev: 1,
      author: "@harrymove-ctrl",
      memoryBlobId: "zjcqsfXK3MBg04n8LHLaKMM8IHuBCuumfn_qk46aclk",
      linkedSkills: ["ui-ux-qa"],
      updatedAt: "2026-11-02T09:01:00Z",
    },
    {
      ruleId: "flow-argon-boost-orchestration",
      skillId: "boost",
      namespace: "memwal-team-skills",
      text: "Delegate high-token implementation to Flash workers while Gemini 4 Argon owns architecture and QA.",
      rationale: "Accelerates multi-agent execution in Argon Code (T3 Code zroute and Antigravity).",
      severity: "workflow-update",
      state: "on",
      rev: 1,
      author: "@harrymove-ctrl",
      memoryBlobId: "zhQZcZCUElxe3vOeDLbbq9vh9K0UyzpOU-QwmUGsj1I",
      linkedSkills: ["ui-ux-qa", "memwal-qa"],
      updatedAt: "2026-11-02T09:02:00Z",
    },
    {
      ruleId: "flow-glimm-dark-brightness",
      skillId: "glimm",
      namespace: "memwal-team-skills",
      text: "Set brightness={0.85} and OKLCH accentChain(['#10B981', '#00E5D6', '#1FC8FF']) on GlimmProvider and GlimmScope when dark theme is active.",
      rationale: "Prevents WebGL cosine-palette crests from blooming harsh white against dark obsidian surfaces.",
      severity: "hard-rule",
      state: "on",
      rev: 1,
      author: "@harrymove-ctrl",
      memoryBlobId: "zhQZcZCUElxe3vOeDLbbq9vh9K0UyzpOU-QwmUGsj1I",
      linkedSkills: ["ui-ux-qa", "react-bits-pro"],
      updatedAt: "2026-11-05T05:00:00Z",
    },
    {
      ruleId: "flow-glimm-scope-milestones",
      skillId: "glimm",
      namespace: "memwal-team-skills",
      text: "Sweep only confirmed milestones and top-level route transitions; wrap single-card updates in GlimmScope instead of sweeping every filter click.",
      rationale: "Follows glimm@0.4.0 Step 1 fit check and Step 4 link curation so high-frequency controls stay instant.",
      severity: "gotcha",
      state: "on",
      rev: 1,
      author: "@harrymove-ctrl",
      memoryBlobId: "z7BHX3brsgqcmDQXh2IzmoCj4g14XioezjkuIL1Fkk0",
      linkedSkills: ["ui-ux-qa"],
      updatedAt: "2026-11-05T05:01:00Z",
    },
    {
      ruleId: "flow-qa-retired-demos",
      skillId: "memwal-qa",
      namespace: "memwal-team-skills",
      text: "Skip retired demo apps (chatbot, noter, researcher) during QA and close their PRs as not planned.",
      rationale: "Only the main Dashboard and Playground app (apps/app) is actively maintained.",
      severity: "hard-rule",
      state: "on",
      rev: 1,
      author: "@harrymove-ctrl",
      memoryBlobId: "z7BHX3brsgqcmDQXh2IzmoCj4g14XioezjkuIL1Fkk0",
      linkedSkills: ["memwal-review", "walm-ticket"],
      updatedAt: "2026-10-27T10:15:00Z",
    },
    {
      ruleId: "flow-qa-all-green-gate",
      skillId: "memwal-qa",
      namespace: "memwal-team-skills",
      text: "Require 100% green CI and deploy checks before approving or merging any PR.",
      rationale: "Prevents broken builds from landing on dev or main.",
      severity: "hard-rule",
      state: "on",
      rev: 1,
      author: "@harrymove-ctrl",
      memoryBlobId: "zjcqsfXK3MBg04n8LHLaKMM8IHuBCuumfn_qk46aclk",
      linkedSkills: ["memwal-review"],
      updatedAt: "2026-10-26T18:40:00Z",
    },
    {
      ruleId: "flow-review-staging-retired",
      skillId: "memwal-review",
      namespace: "memwal-team-skills",
      text: "Use only dev and production environments. Staging is retired, so promote directly from dev to main.",
      rationale: "Keeps release verification focused on the two active environments.",
      severity: "workflow-update",
      state: "on",
      rev: 1,
      author: "@harrymove-ctrl",
      memoryBlobId: "zjcqsfXK3MBg04n8LHLaKMM8IHuBCuumfn_qk46aclk",
      linkedSkills: ["memwal-qa", "getting-started"],
      updatedAt: "2026-10-25T14:20:00Z",
    },
    {
      ruleId: "flow-walm-no-public-id",
      skillId: "walm-ticket",
      namespace: "memwal-team-skills",
      text: "Use GitHub issue numbers (#N) on GitHub, and keep WALM ticket IDs inside Linear only.",
      rationale: "Keeps internal Linear ticket IDs private while linking PRs cleanly.",
      severity: "hard-rule",
      state: "on",
      rev: 1,
      author: "@harrymove-ctrl",
      memoryBlobId: "zhQZcZCUElxe3vOeDLbbq9vh9K0UyzpOU-QwmUGsj1I",
      linkedSkills: ["gh-issue-fixed", "linear-org-routing"],
      updatedAt: "2026-10-24T09:12:00Z",
    },
    {
      ruleId: "flow-gh-parallel-reconcile",
      skillId: "gh-issue-fixed",
      namespace: "memwal-team-skills",
      text: "When a fix PR merges to dev, reply on the GitHub issue, close it, and mark the Linear ticket Done.",
      rationale: "Keeps GitHub issues and Linear tickets in sync right after merge.",
      severity: "workflow-update",
      state: "on",
      rev: 1,
      author: "@teammate-dev",
      memoryBlobId: "zjcqsfXK3MBg04n8LHLaKMM8IHuBCuumfn_qk46aclk",
      linkedSkills: ["walm-ticket", "memwal-review", "memwal-dev-wallet"],
      updatedAt: "2026-10-27T11:10:00Z",
    },
    {
      ruleId: "flow-dev-wallet-sponsor",
      skillId: "memwal-dev-wallet",
      namespace: "memwal-team-skills",
      text: "Use sponsored dev-wallet accounts for gas-free automated browser testing on dev.",
      rationale: "Avoids testnet faucet limits during automated E2E tests.",
      severity: "gotcha",
      state: "on",
      rev: 1,
      author: "@teammate-qa",
      memoryBlobId: "XvqXdkl79MSND_EcvKX6LM2DRPAnytD6A_DKDbCbICY",
      linkedSkills: ["memwal-qa"],
      updatedAt: "2026-10-23T16:05:00Z",
    },
    {
      ruleId: "flow-rust-mutex-await",
      skillId: "rust-async-patterns",
      namespace: "memwal-team-skills",
      text: "Release Mutex locks before running async await calls so worker threads never deadlock.",
      rationale: "Clone or read the needed value first, then run the async request.",
      severity: "hard-rule",
      state: "on",
      rev: 1,
      author: "@teammate-dev",
      memoryBlobId: "gs0M1js80k-OWvkYt7v08phKe3KC8PBINIOPowo7G-0",
      linkedSkills: ["rust-best-practices", "rust-testing"],
      updatedAt: "2026-10-22T20:30:00Z",
    },
  ],
};

function getServerConfig() {
  return {
    accountId:
      process.env.MEMWAL_ACCOUNT_ID ||
      process.env.VITE_MEMWAL_ACCOUNT_ID ||
      "0x463ec47ea456b183e4c92bfbbecaf2ff62c938f0c8809a48c8325e238183eb1d",
    delegateKey:
      process.env.MEMWAL_PRIVATE_KEY ||
      process.env.VITE_MEMWAL_DELEGATE_KEY ||
      "",
    serverUrl: (
      process.env.MEMWAL_SERVER_URL ||
      process.env.VITE_MEMWAL_SERVER_URL ||
      "https://relayer.memory.walrus.xyz"
    ).replace(/\/+$/, ""),
  };
}

function createMemWal(namespace) {
  const cfg = getServerConfig();
  if (!cfg.delegateKey) {
    return null;
  }
  return MemWal.create({
    key: cfg.delegateKey,
    accountId: cfg.accountId,
    serverUrl: cfg.serverUrl,
    namespace,
  });
}

function loadEventsFromDisk() {
  try {
    if (fs.existsSync(STATE_CACHE_PATH)) {
      const raw = JSON.parse(fs.readFileSync(STATE_CACHE_PATH, "utf8"));
      if (raw && typeof raw === "object") return raw;
    }
  } catch {
    // ignore read error
  }
  return {};
}

function saveEventsToDisk(store) {
  try {
    fs.writeFileSync(STATE_CACHE_PATH, JSON.stringify(store, null, 2), "utf8");
  } catch {
    // ignore write error
  }
}

const eventStoreByNs = loadEventsFromDisk();

function getNamespaceEvents(namespace) {
  const seeds = (SEEDED_RULES_BY_NAMESPACE[namespace] || []).map((r) => ({
    kind: "rule",
    ruleId: r.ruleId,
    skillId: r.skillId,
    namespace,
    text: r.text,
    rationale: r.rationale || "",
    severity: r.severity || "hard-rule",
    state: r.state || "on",
    rev: r.rev || 1,
    author: r.author || "@harrymove-ctrl",
    memoryBlobId: r.memoryBlobId,
    linkedSkills: r.linkedSkills || [],
    updatedAt: r.updatedAt || new Date().toISOString(),
  }));

  if (!Array.isArray(eventStoreByNs[namespace])) {
    eventStoreByNs[namespace] = seeds;
    saveEventsToDisk(eventStoreByNs);
  } else {
    const existingIds = new Set(
      eventStoreByNs[namespace].map((e) => e.ruleId).filter(Boolean)
    );
    let added = false;
    for (const s of seeds) {
      if (!existingIds.has(s.ruleId)) {
        eventStoreByNs[namespace].unshift(s);
        added = true;
      }
    }
    if (added) saveEventsToDisk(eventStoreByNs);
  }
  return eventStoreByNs[namespace];
}

function appendNamespaceEvent(namespace, event) {
  const list = getNamespaceEvents(namespace);
  list.push(event);
  saveEventsToDisk(eventStoreByNs);
}

/**
 * Parses a raw Walrus Memory text string into structured `[RULE:<id>]`, `[RULE_STATE:<id>]`, or legacy `[FLOW:<skill>]` events.
 */
export function parseRuleMemoryEvent(rawText, fallbackMeta = {}) {
  const text = String(rawText || "").trim();
  if (!text) return null;

  // 1. [RULE_STATE:<ruleId>]
  const stateMatch = text.match(/^\[RULE_STATE:([^\]]+)\]/i);
  if (stateMatch) {
    const ruleId = stateMatch[1].trim();
    const stateTag = text.match(/\[state:(on|off|deleted)\]/i);
    const revTag = text.match(/\[rev:(\d+)\]/i);
    const jsonLine = text.split("\n").slice(1).join("\n").trim();
    let parsedJson = {};
    try {
      if (jsonLine.startsWith("{")) parsedJson = JSON.parse(jsonLine);
    } catch {
      // ignore
    }
    const state =
      parsedJson.state ||
      (stateTag ? stateTag[1].toLowerCase() : "off");
    return {
      kind: "state",
      ruleId,
      state,
      rev: Number(parsedJson.rev || (revTag ? revTag[1] : 1)),
      memoryBlobId: fallbackMeta.blobId || fallbackMeta.id || "",
      updatedAt:
        parsedJson.updatedAt ||
        fallbackMeta.createdAt ||
        new Date().toISOString(),
    };
  }

  // 2. [RULE:<ruleId>]
  const ruleMatch = text.match(/^\[RULE:([^\]]+)\]/i);
  if (ruleMatch) {
    const ruleId = ruleMatch[1].trim();
    const skillMatch = text.match(/\[skill:([^\]]+)\]/i);
    const stateMatchTag = text.match(/\[state:(on|off|deleted)\]/i);
    const revMatch = text.match(/\[rev:(\d+)\]/i);
    const authorMatch = text.match(/\[author:([^\]]+)\]/i);
    const sevMatch = text.match(/\[severity:([^\]]+)\]/i);
    const bodyText = text.split("\n").slice(1).join("\n").trim();
    let parsed = null;
    try {
      if (bodyText.startsWith("{")) parsed = JSON.parse(bodyText);
    } catch {
      // plain text body
    }
    return {
      kind: "rule",
      ruleId,
      skillId:
        parsed?.skillId ||
        (skillMatch ? skillMatch[1].trim() : "memwal-skill-hub"),
      text: parsed?.text || bodyText || text,
      rationale: parsed?.rationale || "",
      severity:
        parsed?.severity ||
        (sevMatch ? sevMatch[1].trim() : "hard-rule"),
      state:
        parsed?.state ||
        (stateMatchTag ? stateMatchTag[1].toLowerCase() : "on"),
      rev: Number(parsed?.rev || (revMatch ? revMatch[1] : 1)),
      author:
        parsed?.author ||
        (authorMatch ? authorMatch[1].trim() : "@harrymove-ctrl"),
      linkedSkills: Array.isArray(parsed?.linkedSkills)
        ? parsed.linkedSkills
        : [],
      memoryBlobId: fallbackMeta.blobId || fallbackMeta.id || "",
      updatedAt:
        parsed?.updatedAt ||
        fallbackMeta.createdAt ||
        new Date().toISOString(),
    };
  }

  // 3. Legacy [FLOW:<skillId>]
  const flowMatch = text.match(/^\[FLOW:([^\]]+)\]/i);
  if (flowMatch) {
    const skillId = flowMatch[1].trim();
    const authorMatch = text.match(/\[author:([^\]]+)\]/i);
    const sevMatch = text.match(/\[severity:([^\]]+)\]/i);
    const bodyLines = text
      .split("\n")
      .slice(1)
      .map((l) => l.trim())
      .filter(Boolean);
    const ruleBody =
      bodyLines.find((l) => !l.toLowerCase().startsWith("rationale:")) ||
      text.replace(/^\[[^\]]+\]\s*/g, "").trim();
    const rationaleLine = bodyLines.find((l) =>
      l.toLowerCase().startsWith("rationale:")
    );
    const hash = crypto
      .createHash("sha256")
      .update(`${skillId}:${ruleBody}`)
      .digest("hex")
      .slice(0, 10);
    return {
      kind: "rule",
      ruleId: `flow-${skillId}-${hash}`,
      skillId,
      text: ruleBody,
      rationale: rationaleLine
        ? rationaleLine.replace(/^rationale:\s*/i, "").trim()
        : "",
      severity: sevMatch ? sevMatch[1].trim() : "workflow-update",
      state: "on",
      rev: 1,
      author: authorMatch ? authorMatch[1].trim() : "@harrymove-ctrl",
      linkedSkills: [],
      memoryBlobId: fallbackMeta.blobId || fallbackMeta.id || "",
      updatedAt: fallbackMeta.createdAt || new Date().toISOString(),
    };
  }

  return null;
}

/**
 * Folds an ordered array of rule and state events into the active rule map.
 */
export function foldRuleEvents(events, namespace) {
  const byId = new Map();
  for (const ev of events) {
    if (!ev || !ev.ruleId) continue;
    if (ev.kind === "rule") {
      const prev = byId.get(ev.ruleId);
      byId.set(ev.ruleId, {
        ruleId: ev.ruleId,
        id: ev.ruleId,
        skillId: ev.skillId || prev?.skillId || "memwal-skill-hub",
        namespace: namespace || ev.namespace || "memwal-team-skills",
        text: ev.text ?? prev?.text ?? "",
        rule: ev.text ?? prev?.text ?? "",
        rationale: ev.rationale ?? prev?.rationale ?? "",
        severity: ev.severity || prev?.severity || "hard-rule",
        state: ev.state || prev?.state || "on",
        rev: Number(ev.rev || (prev ? prev.rev + 1 : 1)),
        author: ev.author || prev?.author || "@harrymove-ctrl",
        authorHandle: ev.author || prev?.author || "@harrymove-ctrl",
        memoryBlobId:
          ev.memoryBlobId ||
          prev?.memoryBlobId ||
          "z7BHX3brsgqcmDQXh2IzmoCj4g14XioezjkuIL1Fkk0",
        blobId:
          ev.memoryBlobId ||
          prev?.memoryBlobId ||
          "z7BHX3brsgqcmDQXh2IzmoCj4g14XioezjkuIL1Fkk0",
        linkedSkills: ev.linkedSkills || prev?.linkedSkills || [],
        updatedAt: ev.updatedAt || new Date().toISOString(),
        createdAt: prev?.createdAt || ev.updatedAt || new Date().toISOString(),
      });
    } else if (ev.kind === "state") {
      const prev = byId.get(ev.ruleId);
      if (prev) {
        prev.state = ev.state;
        prev.rev = Math.max(prev.rev + 1, Number(ev.rev || prev.rev + 1));
        if (ev.memoryBlobId) {
          prev.memoryBlobId = ev.memoryBlobId;
          prev.blobId = ev.memoryBlobId;
        }
        prev.updatedAt = ev.updatedAt || new Date().toISOString();
      }
    }
  }

  return Array.from(byId.values()).filter((r) => r.state !== "deleted");
}

export async function listFoldedRules(namespace, skillFilter = "") {
  const ns = String(namespace || "memwal-team-skills").trim();
  const localEvents = [...getNamespaceEvents(ns)];

  const folded = foldRuleEvents(localEvents, ns);
  if (skillFilter) {
    return folded.filter((r) => r.skillId === skillFilter);
  }
  return folded;
}

export async function upsertRule(namespace, input) {
  const ns = String(namespace || "memwal-team-skills").trim();
  const cleanText = String(input.text || input.rule || "").trim();
  if (!cleanText) {
    throw new Error("Rule text is required");
  }
  const skillId = String(input.skillId || "memwal-skill-hub").trim();
  const existing = (await listFoldedRules(ns)).find(
    (r) => r.ruleId === input.ruleId
  );
  const ruleId =
    input.ruleId ||
    `rule-${skillId}-${crypto
      .createHash("sha256")
      .update(`${skillId}:${cleanText}:${Date.now()}`)
      .digest("hex")
      .slice(0, 8)}`;
  const nextRev = existing ? existing.rev + 1 : 1;
  const nowIso = new Date().toISOString();
  const author = input.author || "@harrymove-ctrl";
  const severity = input.severity || existing?.severity || "hard-rule";
  const rationale =
    input.rationale !== undefined
      ? String(input.rationale).trim()
      : existing?.rationale || "";
  const state = input.state || existing?.state || "on";

  const payloadObj = {
    ruleId,
    skillId,
    namespace: ns,
    text: cleanText,
    rationale,
    severity,
    state,
    rev: nextRev,
    author,
    linkedSkills: input.linkedSkills || existing?.linkedSkills || [],
    updatedAt: nowIso,
  };

  let memoryBlobId =
    existing?.memoryBlobId || "z7BHX3brsgqcmDQXh2IzmoCj4g14XioezjkuIL1Fkk0";
  let syncedToWalrus = false;

  const event = {
    kind: "rule",
    ...payloadObj,
    memoryBlobId,
  };
  appendNamespaceEvent(ns, event);

  const client = createMemWal(ns);
  if (client) {
    try {
      const wireText = `[RULE:${ruleId}] [skill:${skillId}] [state:${state}] [rev:${nextRev}] [author:${author}] [severity:${severity}]\n${JSON.stringify(payloadObj)}`;
      const res = await Promise.race([
        client.remember(wireText, { namespace: ns }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("relayer timeout")), 1800)
        ),
      ]);
      memoryBlobId =
        res?.blob_id || res?.blobId || res?.id || res?.job_id || memoryBlobId;
      event.memoryBlobId = memoryBlobId;
      saveEventsToDisk(eventStoreByNs);
      syncedToWalrus = true;
    } catch {
      // keep local event fold resilient if relayer times out
    }
  }

  const folded = (await listFoldedRules(ns)).find((r) => r.ruleId === ruleId);
  return {
    rule: folded || { ...event, id: ruleId, rule: cleanText, blobId: memoryBlobId },
    memoryBlobId,
    rev: nextRev,
    syncedToWalrus,
  };
}

export async function setRuleState(namespace, ruleId, nextState) {
  const ns = String(namespace || "memwal-team-skills").trim();
  if (!["on", "off", "deleted"].includes(nextState)) {
    throw new Error(`Invalid rule state: ${nextState}`);
  }
  const existing = (await listFoldedRules(ns)).find(
    (r) => r.ruleId === ruleId
  );
  const nextRev = existing ? existing.rev + 1 : 2;
  const nowIso = new Date().toISOString();
  let memoryBlobId =
    existing?.memoryBlobId || "z7BHX3brsgqcmDQXh2IzmoCj4g14XioezjkuIL1Fkk0";
  let syncedToWalrus = false;

  const stateEvent = {
    kind: "state",
    ruleId,
    state: nextState,
    rev: nextRev,
    memoryBlobId,
    updatedAt: nowIso,
  };
  appendNamespaceEvent(ns, stateEvent);

  const client = createMemWal(ns);
  if (client) {
    try {
      const wireText = `[RULE_STATE:${ruleId}] [state:${nextState}] [rev:${nextRev}]\n${JSON.stringify({
        ruleId,
        state: nextState,
        rev: nextRev,
        updatedAt: nowIso,
      })}`;
      const res = await Promise.race([
        client.remember(wireText, { namespace: ns }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("relayer timeout")), 1800)
        ),
      ]);
      memoryBlobId =
        res?.blob_id || res?.blobId || res?.id || res?.job_id || memoryBlobId;
      stateEvent.memoryBlobId = memoryBlobId;
      saveEventsToDisk(eventStoreByNs);
      syncedToWalrus = true;
    } catch {
      // keep local event fold resilient
    }
  }

  return {
    ruleId,
    state: nextState,
    rev: nextRev,
    memoryBlobId,
    syncedToWalrus,
  };
}

export async function rememberSkillRef(namespace, refPayload) {
  const ns = String(namespace || "memwal-team-skills").trim();
  const client = createMemWal(ns);
  if (!client) return { pointerBlobId: null, synced: false };
  try {
    const wireText = `[SKILL_REF:${refPayload.id}]\n${JSON.stringify(refPayload)}`;
    const res = await client.remember(wireText, { namespace: ns });
    return {
      pointerBlobId: res?.blob_id || res?.blobId || res?.id || res?.job_id || null,
      synced: true,
    };
  } catch {
    return { pointerBlobId: null, synced: false };
  }
}
