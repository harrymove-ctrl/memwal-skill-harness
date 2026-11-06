import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { rememberSkillRef } from "./memoryGateway.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const SKILLS_DIR = path.join(REPO_ROOT, "skills");
const BUCKET_INDEX_PATH = path.join(__dirname, "console-bucket-index.json");

export const DEFAULT_CONSOLE_BUCKET_ID = "217e53fc-36ff-4d1b-8834-04f69c2ef553";
export const DEFAULT_CONSOLE_SPACE_ID = "4540e9c7-b10a-4fbb-8853-15fa95151e26";
export const DEFAULT_CONSOLE_SEAL_POLICY_ID =
  "0xddcab3487be76e5fea6f48aea0061cc39b140730634f125ac36eabcbb74ae51a";
export const DEFAULT_CONSOLE_URL = `https://console.walrus.xyz/buckets/?b=${DEFAULT_CONSOLE_BUCKET_ID}`;

const DEFAULT_BLOBS = [
  "fEe2NWB1i5M0z5I-LYedaYeNAtxChegvJUf2Rui_Tho",
  "z7BHX3brsgqcmDQXh2IzmoCj4g14XioezjkuIL1Fkk0",
  "zjcqsfXK3MBg04n8LHLaKMM8IHuBCuumfn_qk46aclk",
  "zhQZcZCUElxe3vOeDLbbq9vh9K0UyzpOU-QwmUGsj1I",
  "XvqXdkl79MSND_EcvKX6LM2DRPAnytD6A_DKDbCbICY",
];

const CATEGORY_BY_SKILL = {
  "getting-started": "Core & Hub",
  "memwal-skill-hub": "Core & Hub",
  boost: "Core & Hub",
  "rules/GEMINI.md": "Core & Hub",
  "ui-ux-qa": "UI/UX & Design",
  glimm: "UI/UX & Design",
  "concise-ui-copy": "UI/UX & Design",
  "interface-bts": "UI/UX & Design",
  "react-bits-pro": "UI/UX & Design",
  "gh-issue-fixed": "Workflows",
  "linear-org-routing": "Workflows",
  routing: "Workflows",
  "walm-ticket": "Workflows",
  "memwal-dev-wallet": "QA & Testing",
  "memwal-qa": "QA & Testing",
  "memwal-review": "QA & Testing",
  "rust-async-patterns": "Rust & Relayer",
  "rust-best-practices": "Rust & Relayer",
  "rust-patterns": "Rust & Relayer",
  "rust-testing": "Rust & Relayer",
  "typesafe-ai": "AI & Routing",
};

function loadLocalEnvOnce() {
  for (const name of [".env.local", ".env"]) {
    const p = path.join(REPO_ROOT, name);
    if (!fs.existsSync(p)) continue;
    try {
      const lines = fs.readFileSync(p, "utf8").split("\n");
      for (const line of lines) {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
        if (!m) continue;
        const key = m[1];
        const val = m[2].replace(/^["']|["']$/g, "");
        if (process.env[key] === undefined) {
          process.env[key] = val;
        }
      }
    } catch {
      // ignore
    }
  }
}

loadLocalEnvOnce();

function getConsoleConfig() {
  let mcpConfig = {};
  try {
    const cfgPath = path.join(
      os.homedir(),
      ".config",
      "walrus-console-mcp",
      "config.json"
    );
    if (fs.existsSync(cfgPath)) {
      mcpConfig = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
    }
  } catch {
    // ignore
  }
  return {
    apiBaseUrl:
      process.env.CONSOLE_API_BASE_URL ||
      mcpConfig.apiBaseUrl ||
      "https://api.console.walrus.xyz",
    bucketId: process.env.CONSOLE_BUCKET_ID || DEFAULT_CONSOLE_BUCKET_ID,
    spaceId: process.env.CONSOLE_SPACE_ID || DEFAULT_CONSOLE_SPACE_ID,
    sealPolicyId:
      process.env.CONSOLE_SEAL_POLICY_ID || DEFAULT_CONSOLE_SEAL_POLICY_ID,
    apiKey: process.env.CONSOLE_API_KEY || mcpConfig.apiKey || "",
    servicePrivateKey:
      process.env.CONSOLE_SERVICE_PRIVATE_KEY ||
      mcpConfig.suiPrivateKey ||
      "",
    webAccountAddress:
      process.env.CONSOLE_WEB_ACCOUNT_ADDRESS ||
      mcpConfig.webAccountAddress ||
      "0x25f79761fee2eb67ca61b21ee8574b6bf8abd1ba7bfdf933db02a864e807e981",
    keyAdminAddress:
      process.env.CONSOLE_KEY_ADMIN_ADDRESS ||
      mcpConfig.keyAdminAddress ||
      "0xbe908ba01d26a06e72a6d859ee0fcd2cb3f7727f67099a042b3fb9ad3c06ba8b",
  };
}

function resolveConsoleMcpBin() {
  const candidates = [
    "/Users/harryphan/.npm/_npx/2f8f12774739fe92/node_modules/.bin/walrus-console-mcp",
    path.join(REPO_ROOT, "node_modules", ".bin", "walrus-console-mcp"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return { cmd: c, args: [] };
  }
  return { cmd: "npx", args: ["-y", "@mysten-incubation/walrus-console-mcp"] };
}

export async function callConsoleMcpTool(toolName, toolArgs, timeoutMs = 120000) {
  const cfg = getConsoleConfig();
  const { cmd, args } = resolveConsoleMcpBin();

  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, {
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        CONSOLE_API_KEY: cfg.apiKey,
        CONSOLE_SERVICE_PRIVATE_KEY: cfg.servicePrivateKey,
        CONSOLE_WEB_ACCOUNT_ADDRESS: cfg.webAccountAddress,
        CONSOLE_KEY_ADMIN_ADDRESS: cfg.keyAdminAddress,
      },
    });

    let stdoutBuf = "";
    let stderrBuf = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      proc.kill();
      reject(new Error(`walrus-console-mcp ${toolName} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    proc.stderr.on("data", (chunk) => {
      stderrBuf += chunk.toString();
    });

    proc.stdout.on("data", (chunk) => {
      stdoutBuf += chunk.toString();
      const lines = stdoutBuf.split("\n");
      stdoutBuf = lines.pop() || "";
      for (const line of lines) {
        if (!line.trim()) continue;
        let msg;
        try {
          msg = JSON.parse(line);
        } catch {
          continue;
        }
        if (msg.id === 1) {
          proc.stdin.write(
            JSON.stringify({
              jsonrpc: "2.0",
              method: "notifications/initialized",
            }) + "\n"
          );
          proc.stdin.write(
            JSON.stringify({
              jsonrpc: "2.0",
              id: 2,
              method: "tools/call",
              params: {
                name: toolName,
                arguments: toolArgs,
              },
            }) + "\n"
          );
        } else if (msg.id === 2) {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          proc.kill();
          if (msg.error) {
            reject(new Error(msg.error.message || JSON.stringify(msg.error)));
            return;
          }
          const text = msg.result?.content?.[0]?.text || "";
          if (msg.result?.isError) {
            reject(new Error(text || `MCP tool ${toolName} returned isError`));
            return;
          }
          try {
            resolve(JSON.parse(text));
          } catch {
            resolve({ raw: text });
          }
        }
      }
    });

    proc.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    });

    proc.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(
        new Error(
          `walrus-console-mcp exited with code ${code}: ${stderrBuf.slice(0, 300)}`
        )
      );
    });

    proc.stdin.write(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "memwal-console-gateway", version: "1.0.0" },
        },
      }) + "\n"
    );
  });
}

export async function fetchLiveConsoleFiles(bucketIdOverride) {
  const cfg = getConsoleConfig();
  if (!cfg.apiKey) return [];
  const bucketId = bucketIdOverride || cfg.bucketId;
  try {
    const res = await fetch(
      `${cfg.apiBaseUrl}/api/v1/buckets/${encodeURIComponent(bucketId)}/files?limit=100`,
      {
        headers: {
          Authorization: `Bearer ${cfg.apiKey}`,
          Accept: "application/json",
        },
      }
    );
    if (!res.ok) return [];
    const body = await res.json();
    return Array.isArray(body?.data) ? body.data : [];
  } catch {
    return [];
  }
}

async function deleteLiveConsoleFile(bucketId, fileId) {
  const cfg = getConsoleConfig();
  if (!cfg.apiKey || !fileId || /^console-file-/.test(fileId)) return false;
  try {
    const res = await fetch(
      `${cfg.apiBaseUrl}/api/v1/buckets/${encodeURIComponent(bucketId)}/files/${encodeURIComponent(fileId)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${cfg.apiKey}`,
          Accept: "application/json",
        },
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

function computeSha256(text) {
  return crypto.createHash("sha256").update(String(text || ""), "utf8").digest("hex");
}

function parseFrontmatterDescription(markdown) {
  const match = String(markdown || "").match(
    /description:\s*>?-?\s*\n?([\s\S]*?)(?:\n[a-zA-Z_-]+:|\n---)/
  );
  if (match) {
    return match[1].replace(/\s+/g, " ").trim().slice(0, 220);
  }
  const heading = String(markdown || "")
    .split("\n")
    .find((line) => line.startsWith("# "));
  return heading ? heading.replace(/^#\s+/, "").trim() : "Shared team SKILL.md on Walrus.";
}

function sanitizeConsoleDescription(text) {
  return String(text || "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

function loadDiskSkillsSeed() {
  const skills = {};
  try {
    if (fs.existsSync(SKILLS_DIR)) {
      const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
      let idx = 0;
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const mdPath = path.join(SKILLS_DIR, entry.name, "SKILL.md");
        if (!fs.existsSync(mdPath)) continue;
        const markdown = fs.readFileSync(mdPath, "utf8");
        const sha256 = computeSha256(markdown);
        const blobId = DEFAULT_BLOBS[idx % DEFAULT_BLOBS.length];
        idx += 1;
        skills[entry.name] = {
          id: entry.name,
          name: entry.name,
          namespace: "memwal-team-skills",
          category: CATEGORY_BY_SKILL[entry.name] || "Workflows",
          description: parseFrontmatterDescription(markdown),
          markdown,
          relatedSkills: ["memwal-skill-hub"],
          rev: 1,
          sha256,
          fileId: `console-file-${entry.name}-r1`,
          blobId,
          bucketId: DEFAULT_CONSOLE_BUCKET_ID,
          sealPolicyId: DEFAULT_CONSOLE_SEAL_POLICY_ID,
          consoleUrl: DEFAULT_CONSOLE_URL,
          updatedAt: "2026-11-02T08:01:30Z",
          author: "@harrymove-ctrl",
        };
      }
    }
  } catch {
    // ignore seed errors
  }
  return skills;
}

function loadBucketStore() {
  try {
    if (fs.existsSync(BUCKET_INDEX_PATH)) {
      const raw = JSON.parse(fs.readFileSync(BUCKET_INDEX_PATH, "utf8"));
      if (raw && typeof raw === "object") return raw;
    }
  } catch {
    // ignore
  }
  return {};
}

function saveBucketStore(store) {
  try {
    const cleanStore = {};
    for (const [k, v] of Object.entries(store || {})) {
      if (!k.startsWith("unit-console-ns-")) {
        cleanStore[k] = v;
      }
    }
    fs.writeFileSync(BUCKET_INDEX_PATH, JSON.stringify(cleanStore, null, 2), "utf8");
  } catch {
    // ignore
  }
}

const bucketStore = loadBucketStore();

function ensureNamespaceBucket(namespace) {
  const ns = String(namespace || "memwal-team-skills").trim();
  const cfg = getConsoleConfig();
  const seedSkills = ns === "memwal-team-skills" ? loadDiskSkillsSeed() : {};

  if (!bucketStore[ns]) {
    bucketStore[ns] = {
      schema: "memwal-skill-harness/v1",
      namespace: ns,
      bucketId: cfg.bucketId,
      bucketName: "walrus-skills",
      spaceId: cfg.spaceId,
      sealPolicyId: cfg.sealPolicyId,
      consoleUrl: `https://console.walrus.xyz/buckets/?b=${cfg.bucketId}`,
      skills: seedSkills,
    };
    saveBucketStore(bucketStore);
  } else {
    bucketStore[ns].bucketId = cfg.bucketId;
    bucketStore[ns].spaceId = cfg.spaceId;
    bucketStore[ns].sealPolicyId = cfg.sealPolicyId;
    bucketStore[ns].consoleUrl = `https://console.walrus.xyz/buckets/?b=${cfg.bucketId}`;
    // Merge any disk skills not yet in store
    for (const [id, diskSkill] of Object.entries(seedSkills)) {
      if (!bucketStore[ns].skills[id]) {
        bucketStore[ns].skills[id] = diskSkill;
      } else if (!bucketStore[ns].skills[id].markdown) {
        bucketStore[ns].skills[id].markdown = diskSkill.markdown;
      }
    }
  }
  return bucketStore[ns];
}

function parseRemoteSkillTags(tags = []) {
  let rev = null;
  let shaPrefix = null;
  let author = null;
  for (const t of tags) {
    const str = String(t);
    if (str.startsWith("rev-")) {
      const n = Number(str.slice(4));
      if (Number.isFinite(n) && n >= 1) rev = n;
    } else if (str.startsWith("sha-")) {
      shaPrefix = str.slice(4);
    } else if (str.startsWith("by-")) {
      author = `@${str.slice(3)}`;
    }
  }
  return { rev, shaPrefix, author };
}

export async function reconcileBucketWithLiveConsole(namespace) {
  const bucket = ensureNamespaceBucket(namespace);
  const liveFiles = await fetchLiveConsoleFiles(bucket.bucketId);
  if (!liveFiles.length) return bucket;

  let dirty = false;
  // Sort newest first so latest upload wins if multiple exist
  const sorted = [...liveFiles].sort((a, b) =>
    String(b.updated_at || b.created_at || "").localeCompare(
      String(a.updated_at || a.created_at || "")
    )
  );
  const seenSkillIds = new Set();

  for (const file of sorted) {
    if (file.deleted_at || file.status !== "active") continue;
    const rawName = String(file.name || file.original_name || "");
    if (!rawName.endsWith(".SKILL.md")) continue;
    const skillId = rawName.replace(/\.SKILL\.md$/, "");
    if (!skillId || seenSkillIds.has(skillId)) continue;
    seenSkillIds.add(skillId);

    const existing = bucket.skills[skillId];
    const parsedTags = parseRemoteSkillTags(file.metadata?.tags || []);

    if (existing) {
      if (
        existing.fileId !== file.id ||
        existing.blobId !== file.blob_id ||
        existing.pooledBlobObjectId !== file.pooled_blob_object_id
      ) {
        existing.fileId = file.id;
        if (file.blob_id) existing.blobId = file.blob_id;
        if (file.pooled_blob_object_id) {
          existing.pooledBlobObjectId = file.pooled_blob_object_id;
        }
        existing.bucketId = bucket.bucketId;
        existing.sealPolicyId = bucket.sealPolicyId;
        existing.consoleUrl = bucket.consoleUrl;
        if (parsedTags.rev && parsedTags.rev > (existing.rev || 1)) {
          existing.rev = parsedTags.rev;
        }
        if (parsedTags.author) {
          existing.author = parsedTags.author;
        }
        if (file.updated_at) {
          existing.updatedAt = file.updated_at;
        }
        dirty = true;
      }
    }
  }

  if (dirty) {
    saveBucketStore(bucketStore);
  }
  return bucket;
}

export async function listConsoleSkills(namespace) {
  const bucket = await reconcileBucketWithLiveConsole(namespace);
  return {
    schema: bucket.schema,
    namespace: bucket.namespace,
    bucketId: bucket.bucketId,
    bucketName: bucket.bucketName,
    spaceId: bucket.spaceId,
    sealPolicyId: bucket.sealPolicyId,
    consoleUrl: bucket.consoleUrl,
    skills: Object.values(bucket.skills),
  };
}

export async function getConsoleSkill(namespace, skillId, options = {}) {
  const bucket = await reconcileBucketWithLiveConsole(namespace);
  const skill = bucket.skills[skillId] || null;
  if (!skill) return null;

  if (options.decryptFromConsole && skill.fileId && !/^console-file-/.test(skill.fileId)) {
    try {
      const tmpDest = path.join("/tmp", `decrypt-${skillId}-${Date.now()}.SKILL.md`);
      await callConsoleMcpTool("download_file", {
        bucketId: bucket.bucketId,
        fileId: skill.fileId,
        sealPolicyId: bucket.sealPolicyId,
        destPath: tmpDest,
      });
      if (fs.existsSync(tmpDest)) {
        skill.markdown = fs.readFileSync(tmpDest, "utf8");
        skill.sha256 = computeSha256(skill.markdown);
        fs.unlinkSync(tmpDest);
        saveBucketStore(bucketStore);
      }
    } catch {
      // fall back to cached markdown
    }
  }

  return skill;
}

export async function putConsoleSkill(namespace, skillId, input) {
  const bucket = await reconcileBucketWithLiveConsole(namespace);
  const current = bucket.skills[skillId] || null;

  if (
    input.ifMatchRev !== undefined &&
    input.ifMatchRev !== null &&
    current &&
    Number(input.ifMatchRev) !== Number(current.rev)
  ) {
    const conflictErr = new Error(
      `Revision conflict for ${skillId}: expected rev ${input.ifMatchRev}, found rev ${current.rev}`
    );
    conflictErr.statusCode = 409;
    conflictErr.currentSkill = current;
    throw conflictErr;
  }

  const markdown = String(input.markdown ?? current?.markdown ?? "").trim();
  if (!markdown) {
    throw new Error("Skill markdown cannot be empty");
  }

  const nextRev =
    input.forceRev !== undefined
      ? Number(input.forceRev)
      : current
        ? Number(current.rev) + 1
        : 1;
  const sha256 = computeSha256(markdown);
  const nowIso = new Date().toISOString();
  const author = input.author || current?.author || "@harrymove-ctrl";
  const description =
    input.description ||
    current?.description ||
    parseFrontmatterDescription(markdown);

  const cfg = getConsoleConfig();
  let fileId =
    input.fileId ||
    current?.fileId ||
    `console-file-${skillId}-r${nextRev}-${sha256.slice(0, 8)}`;
  let blobId =
    input.blobId ||
    current?.blobId ||
    DEFAULT_BLOBS[nextRev % DEFAULT_BLOBS.length];
  let pooledBlobObjectId = current?.pooledBlobObjectId || null;

  if (cfg.apiKey && cfg.servicePrivateKey && !input.skipRemoteUpload) {
    const previousFileId = current?.fileId;
    const tmpFilePath = path.join("/tmp", `${skillId}.SKILL.md`);
    fs.writeFileSync(tmpFilePath, `${markdown}\n`, "utf8");

    const cleanAuthorTag = `by-${String(author).replace(/^@/, "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24) || "team"}`;
    const tags = [
      "skill",
      String(bucket.namespace).slice(0, 30),
      `rev-${nextRev}`,
      `sha-${sha256.slice(0, 16)}`,
      cleanAuthorTag,
    ];

    const uploadRes = await callConsoleMcpTool("upload_file", {
      bucketId: bucket.bucketId,
      sealPolicyId: bucket.sealPolicyId,
      localPath: tmpFilePath,
      name: `${skillId}.SKILL.md`,
      description: sanitizeConsoleDescription(description),
      tags,
    });

    if (uploadRes?.fileId) {
      fileId = uploadRes.fileId;
    }

    // Fetch live file metadata to capture the on-chain Walrus blob_id and pooled_blob_object_id
    const liveFiles = await fetchLiveConsoleFiles(bucket.bucketId);
    const matchingLive = liveFiles.find((f) => f.id === fileId);
    if (matchingLive) {
      if (matchingLive.blob_id) blobId = matchingLive.blob_id;
      if (matchingLive.pooled_blob_object_id) {
        pooledBlobObjectId = matchingLive.pooled_blob_object_id;
      }
    }

    // Remove superseded fileId so the Console bucket holds 1 canonical file per skill
    if (
      previousFileId &&
      previousFileId !== fileId &&
      !/^console-file-/.test(previousFileId)
    ) {
      await deleteLiveConsoleFile(bucket.bucketId, previousFileId);
    }
  }

  // Persist updated markdown back to local skills/<id>/SKILL.md if directory exists
  try {
    const localSkillDir = path.join(SKILLS_DIR, skillId);
    if (fs.existsSync(localSkillDir) && fs.statSync(localSkillDir).isDirectory()) {
      fs.writeFileSync(path.join(localSkillDir, "SKILL.md"), `${markdown}\n`, "utf8");
    }
  } catch {
    // ignore disk write errors in read-only environments
  }

  const refResult = await rememberSkillRef(bucket.namespace, {
    id: skillId,
    bucketId: bucket.bucketId,
    fileId,
    sha256,
    rev: nextRev,
    updatedAt: nowIso,
    author,
  });

  const prevHistory = Array.isArray(current?.history) ? current.history : [];
  const nextHistory = [
    {
      rev: nextRev,
      fileId,
      blobId,
      sha256,
      updatedAt: nowIso,
      author,
    },
    ...prevHistory.filter((h) => h.rev !== nextRev),
  ].slice(0, 3);

  const updated = {
    id: skillId,
    name: input.name || current?.name || skillId,
    namespace: bucket.namespace,
    category:
      input.category ||
      current?.category ||
      CATEGORY_BY_SKILL[skillId] ||
      "Workflows",
    description,
    markdown,
    relatedSkills: Array.isArray(input.relatedSkills)
      ? input.relatedSkills
      : current?.relatedSkills || ["memwal-skill-hub"],
    rev: nextRev,
    sha256,
    fileId,
    blobId,
    pooledBlobObjectId,
    bucketId: bucket.bucketId,
    sealPolicyId: bucket.sealPolicyId,
    consoleUrl: bucket.consoleUrl,
    pointerBlobId: refResult.pointerBlobId,
    history: nextHistory,
    updatedAt: nowIso,
    author,
    authorKey: author,
  };

  bucket.skills[skillId] = updated;
  saveBucketStore(bucketStore);

  return {
    skill: updated,
    rev: nextRev,
    sha256,
    fileId,
    blobId,
    pooledBlobObjectId,
    bucketId: bucket.bucketId,
    sealPolicyId: bucket.sealPolicyId,
    consoleUrl: bucket.consoleUrl,
    pointerBlobId: refResult.pointerBlobId,
    syncedToWalrus: refResult.synced,
  };
}

export async function deleteConsoleSkill(namespace, skillId) {
  const bucket = ensureNamespaceBucket(namespace);
  const existing = bucket.skills[skillId];
  const existed = Boolean(existing);
  if (existing?.fileId && !/^console-file-/.test(existing.fileId)) {
    await deleteLiveConsoleFile(bucket.bucketId, existing.fileId);
  }
  delete bucket.skills[skillId];
  saveBucketStore(bucketStore);
  return { deleted: existed, skillId, namespace: bucket.namespace };
}
