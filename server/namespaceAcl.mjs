/*
 * The member list for each space: who can do what. Kept in memory and on disk, and written to
 * Walrus Memory so another server instance can recall it.
 */
import { MemWal } from "@mysten-incubation/memwal";
import fs from "node:fs";

const DEFAULT_NAMESPACE =
  process.env.MEMWAL_NAMESPACE || process.env.VITE_MEMWAL_NAMESPACE || "memwal-team-skills";

function sanitizeSlug(raw) {
  return (
    String(raw || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "ai-skill-collection"
  );
}

function createServerMemWal(namespace) {
  const key = process.env.MEMWAL_PRIVATE_KEY || process.env.VITE_MEMWAL_DELEGATE_KEY;
  if (!key) throw new Error("MEMWAL_PRIVATE_KEY is not configured on the server");
  return MemWal.create({
    key,
    accountId:
      process.env.MEMWAL_ACCOUNT_ID ||
      process.env.VITE_MEMWAL_ACCOUNT_ID ||
      "0x463ec47ea456b183e4c92bfbbecaf2ff62c938f0c8809a48c8325e238183eb1d",
    serverUrl: (process.env.MEMWAL_SERVER_URL || process.env.VITE_MEMWAL_SERVER_URL || "https://relayer.memory.walrus.xyz").replace(/\/+$/, ""),
    namespace: (namespace || DEFAULT_NAMESPACE).trim(),
  });
}

const ACL_STORE_PATH = "/tmp/memwal-shared-acl-v1.json";

const DEFAULT_ACL_MEMBERS = [
  {
    handle: "@harrymove-ctrl",
    role: "Owner",
    accessRole: "owner",
    suiAddress:
      "0x649ea1b57ec22e128fbbedfc89c2fb6803466c717226d1eb5bc2f9fa5f454be1",
    isOwner: true,
    addedAt: "2026-10-28T10:00:00Z",
  },
  {
    handle: "@mysten-dev",
    role: "Read & Write",
    accessRole: "read-write",
    suiAddress:
      "0x8a2572a955f053a9f7859477b5ecae3c81391901da5e174046c7bb67f98ee124",
    isOwner: false,
    addedAt: "2026-10-28T11:00:00Z",
  },
  {
    handle: "@teammate-qa",
    role: "Read Only",
    accessRole: "read-only",
    suiAddress:
      "0x58db5a94c291f8e704c05e8627a9210c48b8d63e091a4ef7295cc471a83029f1",
    isOwner: false,
    addedAt: "2026-10-28T12:00:00Z",
  },
];

const sharedAclByNamespace = new Map();

function loadSharedAclFromDisk() {
  try {
    if (fs.existsSync(ACL_STORE_PATH)) {
      const raw = JSON.parse(fs.readFileSync(ACL_STORE_PATH, "utf8"));
      if (raw && typeof raw === "object") {
        for (const [ns, list] of Object.entries(raw)) {
          if (Array.isArray(list)) {
            sharedAclByNamespace.set(ns, list);
          }
        }
      }
    }
  } catch {
    // ignore disk read errors
  }
}

function saveSharedAclToDisk() {
  try {
    const obj = {};
    for (const [ns, list] of sharedAclByNamespace.entries()) {
      obj[ns] = list;
    }
    fs.writeFileSync(ACL_STORE_PATH, JSON.stringify(obj, null, 2), "utf8");
  } catch {
    // ignore disk write errors
  }
}

loadSharedAclFromDisk();

export async function getNamespaceAcl(namespace) {
  const ns = sanitizeSlug(namespace || DEFAULT_NAMESPACE);
  if (sharedAclByNamespace.has(ns)) {
    return sharedAclByNamespace.get(ns);
  }
  // Try recalling [SEAL_ACL:<ns>] from Walrus Mainnet
  try {
    const client = createServerMemWal(ns);
    const recalled = await client.recall(`[SEAL_ACL:${ns}]`, {
      namespace: ns,
      limit: 5,
    });
    const hits = Array.isArray(recalled?.results) ? recalled.results : [];
    for (const h of hits) {
      const text = String(h?.text || "");
      if (text.includes(`[SEAL_ACL:${ns}]`)) {
        const jsonStart = text.indexOf("[", text.indexOf("]") + 1);
        if (jsonStart >= 0) {
          const parsed = JSON.parse(text.slice(jsonStart).trim());
          if (Array.isArray(parsed) && parsed.length > 0) {
            sharedAclByNamespace.set(ns, parsed);
            saveSharedAclToDisk();
            return parsed;
          }
        }
      }
    }
  } catch {
    // fallback to default members
  }
  const seeded = DEFAULT_ACL_MEMBERS.map((m) => ({ ...m }));
  sharedAclByNamespace.set(ns, seeded);
  saveSharedAclToDisk();
  return seeded;
}

export async function updateNamespaceAcl(namespace, updater) {
  const ns = sanitizeSlug(namespace || DEFAULT_NAMESPACE);
  const current = await getNamespaceAcl(ns);
  const next = updater(Array.isArray(current) ? [...current] : []);
  sharedAclByNamespace.set(ns, next);
  saveSharedAclToDisk();

  // Persist to Walrus Mainnet asynchronously so other instances/browsers can recall it
  let walrusJobId = null;
  try {
    const client = createServerMemWal(ns);
    const saved = await client.remember(
      `[SEAL_ACL:${ns}] [updated:${new Date().toISOString()}]\n${JSON.stringify(next)}`,
      { namespace: ns }
    );
    walrusJobId = saved?.id || saved?.blobId || null;
  } catch {
    // keep in-memory + disk state even if relayer is slow
  }
  return { members: next, walrusJobId };
}
