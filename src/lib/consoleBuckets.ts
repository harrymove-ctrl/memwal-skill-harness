/**
 * Walrus Console Buckets (`https://console.walrus.xyz/buckets/`) &
 * `@mysten-incubation/walrus-console-mcp` integration layer.
 *
 * Models:
 * 1. 1-Paste `CONSOLE_CREDENTIAL_BUNDLE` parsing & owner/manager address pin validation
 * 2. Spaces -> Isolated Private Buckets (`bucketId`, `sealPolicyId`, `ownerAddress`, `anchorGroupIds`)
 * 3. Fast Bucket Creation (`create_bucket` with pre-warmed anchor group roster + 1-Bucket-per-Workspace mapping)
 * 4. Storage Mode:
 *    - "console-only": 100% Walrus Console Buckets (`SKILL.md` + `FLOW.md` stored in `console.walrus.xyz/buckets/`)
 *    - "hybrid": `SKILL.md` files in Walrus Console Buckets + runtime `[FLOW]` vector memories in `MemWal`
 */

export type SkillStorageMode = "console-only" | "hybrid";

export interface ConsoleCredentialBundle {
  v: number;
  apiKey: string;
  servicePrivateKey: string;
  webAccountAddress: string;
  keyAdminAddress: string | null;
  spaceId?: string;
  spaceName?: string;
  anchorGroupIds: string[];
}

export interface WalrusConsoleBucket {
  bucketId: string;
  slug: string;
  name: string;
  spaceId: string;
  spaceName: string;
  sealPolicyId: string;
  ownerAddress: string;
  keyAdminAddress: string | null;
  provisioningState: "active" | "provisioning";
  rosterReason: "chain_verified" | "bootstrap" | "no_other_signers";
  anchorGroupIds: string[];
  skillsCount: number;
  flowsCount: number;
  storageUsedBytes: number;
  consoleUrl: string;
  region?: string;
  isPrivate: boolean;
}

export const DEFAULT_CONSOLE_BUNDLE: ConsoleCredentialBundle = {
  v: 1,
  apiKey: "",
  servicePrivateKey: "",
  webAccountAddress:
    "0x25f79761fee2eb67ca61b21ee8574b6bf8abd1ba7bfdf933db02a864e807e981",
  keyAdminAddress:
    "0xbe908ba01d26a06e72a6d859ee0fcd2cb3f7727f67099a042b3fb9ad3c06ba8b",
  spaceId: "4540e9c7-b10a-4fbb-8853-15fa95151e26",
  spaceName: "Personal Space (5 GB · Auto-Renew)",
  anchorGroupIds: [
    "0xddcab3487be76e5fea6f48aea0061cc39b140730634f125ac36eabcbb74ae51a",
  ],
};

export const INITIAL_CONSOLE_BUCKETS: WalrusConsoleBucket[] = [
  {
    bucketId: "217e53fc-36ff-4d1b-8834-04f69c2ef553",
    slug: "memwal-team-skills",
    name: "walrus-skills (MemWal Team Skills)",
    spaceId: "4540e9c7-b10a-4fbb-8853-15fa95151e26",
    spaceName: "Personal Space (5 GB · Mainnet)",
    sealPolicyId:
      "0xddcab3487be76e5fea6f48aea0061cc39b140730634f125ac36eabcbb74ae51a",
    ownerAddress: DEFAULT_CONSOLE_BUNDLE.webAccountAddress,
    keyAdminAddress: DEFAULT_CONSOLE_BUNDLE.keyAdminAddress,
    provisioningState: "active",
    rosterReason: "chain_verified",
    anchorGroupIds: [
      "0xddcab3487be76e5fea6f48aea0061cc39b140730634f125ac36eabcbb74ae51a",
    ],
    skillsCount: 15,
    flowsCount: 8,
    storageUsedBytes: 184_320,
    consoleUrl:
      "https://console.walrus.xyz/buckets/?b=217e53fc-36ff-4d1b-8834-04f69c2ef553",
    region: "Sui Mainnet · Walrus Console (console.walrus.xyz)",
    isPrivate: true,
  },
  {
    bucketId: "design-skills",
    slug: "design-skills",
    name: "Design Skills",
    spaceId: "4540e9c7-b10a-4fbb-8853-15fa95151e26",
    spaceName: "Personal Space (5 GB · Mainnet)",
    sealPolicyId:
      "0xddcab3487be76e5fea6f48aea0061cc39b140730634f125ac36eabcbb74ae51a",
    ownerAddress: DEFAULT_CONSOLE_BUNDLE.webAccountAddress,
    keyAdminAddress: DEFAULT_CONSOLE_BUNDLE.keyAdminAddress,
    provisioningState: "active",
    rosterReason: "chain_verified",
    anchorGroupIds: [
      "0xddcab3487be76e5fea6f48aea0061cc39b140730634f125ac36eabcbb74ae51a",
    ],
    skillsCount: 10,
    flowsCount: 4,
    storageUsedBytes: 112_640,
    consoleUrl:
      "https://console.walrus.xyz/buckets/?b=217e53fc-36ff-4d1b-8834-04f69c2ef553",
    region: "Sui Mainnet · Walrus Console (console.walrus.xyz)",
    isPrivate: true,
  },
  {
    bucketId: "testing",
    slug: "testing",
    name: "Testing",
    spaceId: "4540e9c7-b10a-4fbb-8853-15fa95151e26",
    spaceName: "Personal Space (5 GB · Mainnet)",
    sealPolicyId:
      "0xddcab3487be76e5fea6f48aea0061cc39b140730634f125ac36eabcbb74ae51a",
    ownerAddress: DEFAULT_CONSOLE_BUNDLE.webAccountAddress,
    keyAdminAddress: DEFAULT_CONSOLE_BUNDLE.keyAdminAddress,
    provisioningState: "active",
    rosterReason: "chain_verified",
    anchorGroupIds: [
      "0xddcab3487be76e5fea6f48aea0061cc39b140730634f125ac36eabcbb74ae51a",
    ],
    skillsCount: 3,
    flowsCount: 2,
    storageUsedBytes: 38_912,
    consoleUrl:
      "https://console.walrus.xyz/buckets/?b=217e53fc-36ff-4d1b-8834-04f69c2ef553",
    region: "Sui Mainnet · Walrus Console (console.walrus.xyz)",
    isPrivate: true,
  },
];

/**
 * Parses and validates a 1-paste `CONSOLE_CREDENTIAL_BUNDLE` JSON string from
 * Walrus Console (`https://console.walrus.xyz` -> Integrations -> Connect MCP).
 */
export function parseConsoleCredentialBundle(
  raw: string
):
  | { ok: true; bundle: ConsoleCredentialBundle }
  | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "Paste your CONSOLE_CREDENTIAL_BUNDLE JSON." };
  }

  try {
    const parsed = JSON.parse(trimmed) as Partial<ConsoleCredentialBundle> & {
      suiPrivateKey?: string;
      adminKey?: string;
      adminServicePrivateKey?: string;
    };
    const keyVal = parsed.apiKey || parsed.adminKey;
    if (
      !keyVal ||
      (!String(keyVal).startsWith("hbr_") &&
        !String(keyVal).startsWith("hbradm_"))
    ) {
      return {
        ok: false,
        error:
          "Invalid bundle: apiKey/adminKey must start with 'hbr_' or 'hbradm_'.",
      };
    }
    const privKey =
      parsed.servicePrivateKey ||
      parsed.adminServicePrivateKey ||
      parsed.suiPrivateKey;
    if (!privKey || !String(privKey).startsWith("suiprivkey1")) {
      return {
        ok: false,
        error:
          "Invalid bundle: servicePrivateKey/adminServicePrivateKey must start with 'suiprivkey1'.",
      };
    }
    if (
      !parsed.webAccountAddress ||
      !String(parsed.webAccountAddress).startsWith("0x")
    ) {
      return {
        ok: false,
        error:
          "Missing owner pin: webAccountAddress (0x...) is required so create_bucket pins you as sole owner.",
      };
    }

    return {
      ok: true,
      bundle: {
        v: Number(parsed.v || 1),
        apiKey: String(keyVal),
        servicePrivateKey: String(privKey),
        webAccountAddress: String(parsed.webAccountAddress),
        keyAdminAddress: parsed.keyAdminAddress
          ? String(parsed.keyAdminAddress)
          : null,
        spaceId: parsed.spaceId || "4540e9c7-b10a-4fbb-8853-15fa95151e26",
        spaceName: parsed.spaceName || "Personal Space (5 GB · Auto-Renew)",
        anchorGroupIds: Array.isArray(parsed.anchorGroupIds)
          ? parsed.anchorGroupIds.map(String)
          : DEFAULT_CONSOLE_BUNDLE.anchorGroupIds,
      },
    };
  } catch {
    return {
      ok: false,
      error:
        "Invalid JSON format. Copy the CONSOLE_CREDENTIAL_BUNDLE JSON from console.walrus.xyz → Integrations.",
    };
  }
}

/**
 * Fast bucket creation using cached anchor group roster (`anchorGroupIds`)
 * and 1-Bucket-per-Workspace mapping (all SKILL.md files live inside one bucket
 * so individual skill uploads never trigger extra bucket-creation PTBs).
 */
export function createConsoleBucketFast(params: {
  name: string;
  slug: string;
  bundle?: ConsoleCredentialBundle;
  existingBuckets?: WalrusConsoleBucket[];
  region?: string;
  isPrivate?: boolean;
}): WalrusConsoleBucket {
  const bundle = params.bundle || DEFAULT_CONSOLE_BUNDLE;
  const cleanSlug =
    params.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-|-$/g, "") || "new-skill-bucket";

  const shortHash = Array.from(cleanSlug)
    .reduce((acc, ch) => ((acc << 5) - acc + ch.charCodeAt(0)) | 0, 0x4f1a)
    .toString(16)
    .replace("-", "")
    .padStart(8, "0")
    .slice(0, 8);

  let randHex = "";
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint8Array(28);
    crypto.getRandomValues(bytes);
    randHex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } else {
    randHex = shortHash.repeat(7);
  }

  const bucketId = cleanSlug;
  const sealPolicyId =
    bundle.anchorGroupIds?.[0] ||
    "0x463ec47ea456b183e4c92bfbbecaf2ff62c938f0c8809a48c8325e238183eb1d";
  const priorAnchors =
    params.existingBuckets?.flatMap((b) => b.anchorGroupIds) ||
    bundle.anchorGroupIds ||
    [];
  const uniqueAnchors = Array.from(
    new Set([...priorAnchors, sealPolicyId])
  ).slice(0, 20);

  return {
    bucketId,
    slug: cleanSlug,
    name: params.name.trim() || cleanSlug,
    spaceId: bundle.spaceId || "sp_01j8personal7a9e",
    spaceName: bundle.spaceName || "Personal Space",
    sealPolicyId,
    ownerAddress: bundle.webAccountAddress,
    keyAdminAddress: bundle.keyAdminAddress,
    provisioningState: "active",
    rosterReason: priorAnchors.length > 0 ? "chain_verified" : "bootstrap",
    anchorGroupIds: uniqueAnchors,
    skillsCount: 1,
    flowsCount: 0,
    storageUsedBytes: 2_048,
    consoleUrl: `https://console.walrus.xyz/buckets/`,
    region:
      params.region || "Sui Mainnet · Walrus Console (console.walrus.xyz)",
    isPrivate: params.isPrivate ?? true,
  };
}

/**
 * Builds the 1-line CLI command for `@mysten-incubation/walrus-console-mcp`.
 */
export function buildWalrusConsoleMcpCli(params: {
  bundle: ConsoleCredentialBundle;
  bucketId: string;
  namespace: string;
}): string {
  return `claude mcp add walrus-console -e CONSOLE_API_KEY=${params.bundle.apiKey} -e CONSOLE_SERVICE_PRIVATE_KEY=${params.bundle.servicePrivateKey} -e CONSOLE_WEB_ACCOUNT_ADDRESS=${params.bundle.webAccountAddress} -e WALRUS_SKILL_BUCKET_ID=${params.bucketId} -e WALRUS_SKILL_NAMESPACE=${params.namespace} -- npx -y @mysten-incubation/walrus-console-mcp`;
}

/**
 * Builds the `.mcp.json` configuration for either:
 * - "console-only": 100% Walrus Console Buckets (`@mysten-incubation/walrus-console-mcp`)
 * - "hybrid": Walrus Console Buckets (`SKILL.md`) + MemWal (`[FLOW]` vector memories)
 */
export function buildStorageModeMcpJson(params: {
  mode: SkillStorageMode;
  bundle: ConsoleCredentialBundle;
  bucketId: string;
  namespace: string;
  accountId: string;
  delegateKey: string;
  serverUrl: string;
}): string {
  const consoleServer = {
    command: "npx",
    args: ["-y", "@mysten-incubation/walrus-console-mcp"],
    env: {
      CONSOLE_API_KEY: params.bundle.apiKey,
      CONSOLE_SERVICE_PRIVATE_KEY: params.bundle.servicePrivateKey,
      CONSOLE_WEB_ACCOUNT_ADDRESS: params.bundle.webAccountAddress,
      ...(params.bundle.keyAdminAddress
        ? { CONSOLE_KEY_ADMIN_ADDRESS: params.bundle.keyAdminAddress }
        : {}),
      WALRUS_SKILL_BUCKET_ID: params.bucketId,
      WALRUS_SKILL_NAMESPACE: params.namespace,
    },
  };

  if (params.mode === "console-only") {
    return JSON.stringify(
      {
        mcpServers: {
          "walrus-console": consoleServer,
        },
      },
      null,
      2
    );
  }

  return JSON.stringify(
    {
      mcpServers: {
        "walrus-console": consoleServer,
        memwal: {
          command: "npx",
          args: ["-y", "@mysten-incubation/memwal-mcp"],
          env: {
            MEMWAL_ACCOUNT_ID: params.accountId,
            MEMWAL_PRIVATE_KEY: params.delegateKey,
            MEMWAL_NAMESPACE: params.namespace,
            MEMWAL_SERVER_URL: params.serverUrl,
          },
        },
      },
    },
    null,
    2
  );
}

/**
 * Builds a complete, copyable/downloadable `AGENTS.md` / `SKILL.md` playbook
 * that users can paste directly into their coding agent (Claude Code, Cursor,
 * Codex, Antigravity, OpenCode).
 *
 * Teaches the agent to:
 * 1. Pull latest SKILL.md + [FLOW] memories from the isolated Walrus Console Bucket before every task
 * 2. Detect when the user approves a change, corrects a step, or updates a workflow
 * 3. Proactively ask the user for permission to push the updated SKILL.md / [FLOW] rule back to
 *    `https://console.walrus.xyz/buckets/<bucketId>` and MemWal
 */
export function buildAgentSelfUpdatingMarkdown(params: {
  mode: SkillStorageMode;
  bundle: ConsoleCredentialBundle;
  bucketId: string;
  namespace: string;
  accountId: string;
  serverUrl: string;
  callerHandle?: string;
  autoAskOnFlowChange?: boolean;
}): string {
  const caller = params.callerHandle || "@harrymove-ctrl";
  return `# Team Skills Guide (${params.namespace})

1. **Read first**: Recall \`SKILL.md\` + \`[FLOW]\` rules from **${params.namespace}** before coding.
2. **Ask before saving new tips**: Ask **${caller}** before pushing new workflow rules to **${params.namespace}**.
3. **Sync approved updates**: Save \`SKILL.md\` via \`upload_file\` and call \`memwal_remember\` with \`[FLOW:<skill>]\` + \`[AGENT_LOG:LEARN_RULE]\`.
`;
}

/**
 * Builds a single natural-language `.md` prompt that the user can copy & paste
 * directly into their coding agent chat (Claude Code, Cursor, Antigravity, Codex).
 */
export function buildOnePasteAgentPrompt(params: {
  mode: SkillStorageMode;
  bundle: ConsoleCredentialBundle;
  bucketId: string;
  namespace: string;
  accountId: string;
  delegateKey: string;
  serverUrl: string;
  callerHandle?: string;
  autoAskOnFlowChange?: boolean;
}): string {
  const caller = params.callerHandle || "@harrymove-ctrl";
  return `Sync with shared MemWal folder "${params.namespace}":
1. Recall SKILL.md & [FLOW] rules from "${params.namespace}" before coding.
2. Apply team rules on top of static SKILL.md files.
3. Ask ${caller} before calling memwal_remember to save new rules.`;
}

/**
 * Triggers a browser download of a `.md` file (e.g., `AGENTS.md` or `WALRUS-SKILL-LOOP.md`).
 */
export function downloadMarkdownFile(filename: string, content: string): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
