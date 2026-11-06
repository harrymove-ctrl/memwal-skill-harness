import type {
  AgentVendorId,
  FlowMemoryNode,
  HostedSkillNode,
  WalrusConnectionConfig,
} from "../types";
import { RELAYER_URLS } from "./memwalBridge";
import { resolvePublicBridgeBaseUrl } from "./tatumBridge";

export function sanitizeCollectionSlug(raw: string = ""): string {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 42);
}

export interface CollectionPreset {
  slug: string;
  label: string;
  goal: string;
}

export const COLLECTION_PROMPT_PRESETS: CollectionPreset[] = [
  {
    slug: "sui-move-security",
    label: "Sui Move & SEAL Audit",
    goal: "Audit Sui Move smart contracts for capability leaks, SEAL policy access checks, PTB limits, and gRPC client usage.",
  },
  {
    slug: "tatum-treasury-ops",
    label: "Tatum Wallet & Treasury Ops",
    goal: "Screen every counterparty address with Tatum v3 Security API, guard 100K API credits with 30m cache TTL, and log treasury rules on Walrus.",
  },
  {
    slug: "frontend-ui-qa",
    label: "Frontend UI & Playwright QA",
    goal: "Enforce WCAG contrast, keyboard navigation, responsive mobile/desktop geometry checks, and headless Playwright regression verification.",
  },
];

export interface GeneratedSkillCollection {
  namespace: string;
  goal: string;
  engineUsed: "live-llm" | "domain-blueprint";
  skills: HostedSkillNode[];
  flows: FlowMemoryNode[];
}

function buildDomainBlueprintCollection(params: {
  namespace: string;
  goal: string;
  authorHandle: string;
}): GeneratedSkillCollection {
  const slug = sanitizeCollectionSlug(params.namespace) || "custom-skills";
  const goal =
    params.goal.trim() ||
    `Shared team playbooks and learned rules for ${slug}.`;
  const nowIso = new Date().toISOString();
  const lower = `${slug} ${goal}`.toLowerCase();

  let domainCategory = "Core Engineering Rules";
  let focusA = {
    suffix: "architecture",
    title: "Architecture & Guardrails",
    bullets: [
      `Always run \`memwal_recall\` on namespace \`${slug}\` before modifying core modules.`,
      "Keep changes minimal and surgical; avoid speculative abstractions or unrequested schema churn.",
      "Document public interfaces and verify downstream blast radius before shipping.",
    ],
  };
  let focusB = {
    suffix: "workflow",
    title: "Implementation & Delivery Workflow",
    bullets: [
      "Reproduce any reported bug or edge case deterministically before authoring a fix.",
      "Run static typechecks and unit tests locally before opening or updating a pull request.",
      `Record newly approved team rules in \`${slug}\` via \`memwal_remember\` with an \`[AGENT_LOG]\` receipt.`,
    ],
  };
  let focusC = {
    suffix: "verification",
    title: "End-to-End QA & Release Gate",
    bullets: [
      "Verify live integration paths against real endpoints rather than mocked-only assumptions.",
      "Require 100% green CI and deploy checks before marking any task complete.",
      "Attach verifiable receipts (commit hashes, blob IDs, or screenshots) on completion.",
    ],
  };
  let rule1 = `Always recall active team rules from "${slug}" before writing code so prior fixes are never regressed.`;
  let rationale1 = `Goal alignment: ${goal}`;
  let rule2 = `Whenever a fix or review uncovers a non-obvious gotcha in "${slug}", save a [FLOW] rule and an [AGENT_LOG] receipt.`;
  let rationale2 =
    "Keeps every coding agent across Claude Code, Cursor, Codex, and Antigravity synchronized on Sui Mainnet.";

  if (lower.includes("move") || lower.includes("seal") || lower.includes("sui")) {
    domainCategory = "Sui Move & SEAL Security";
    focusA = {
      suffix: "capability-guard",
      title: "Move Capability & SEAL Policy Guardrails",
      bullets: [
        "Enforce witness and capability-object checks on every privileged Move entry function.",
        "Validate `seal_approve` caller authorization against the active `MemWalAccount` delegate roster.",
        "Use `@mysten/sui/grpc` (`SuiGrpcClient`) for fullnode reads; never generate retired Sui JSON-RPC calls.",
      ],
    };
    focusB = {
      suffix: "ptb-safety",
      title: "Programmable Transaction Block & Gas Safety",
      bullets: [
        "Bound vector iterations and shared-object locks inside PTBs to prevent execution gas spikes.",
        "Check integer precision (`u64` / `u128`) and coin balance splits before transfer.",
        "Screen new delegate wallet addresses (`0x...`) for Move object confusion before `add_delegate_key`.",
      ],
    };
    focusC = {
      suffix: "mainnet-audit",
      title: "Mainnet Contract & Blob Verification",
      bullets: [
        "Verify package IDs, registry shared objects, and `access_counter_version` on Sui Mainnet gRPC.",
        "Confirm SEAL encryption round-trips against `https://relayer.memory.walrus.xyz`.",
        "Record audited blob receipts so teammates can verify every security check on Walruscan.",
      ],
    };
    rule1 =
      "Never pass a Move Package or Shared Object ID into account::add_delegate_key; verify wallet ownership via Sui Mainnet gRPC first.";
    rationale1 =
      "Move Object IDs share 32-byte 0x hex format with wallets but cannot sign SEAL session keys.";
    rule2 =
      "Use SuiGrpcClient (@mysten/sui/grpc) exclusively for Sui Mainnet reads instead of deprecated JSON-RPC methods.";
    rationale2 =
      "Prevents broken fullnode calls when coding agents scaffold Sui SDK integrations.";
  } else if (
    lower.includes("tatum") ||
    lower.includes("treasury") ||
    lower.includes("wallet") ||
    lower.includes("budget")
  ) {
    domainCategory = "Tatum Security & Treasury Ops";
    focusA = {
      suffix: "address-screening",
      title: "Tatum v3 Wallet Security & Sanctions Screening",
      bullets: [
        "Screen every external `0x...` address with Tatum `/v3/security/address/{address}` before granting vault access or sending funds.",
        "Block any address flagged as `malicious`, phishing, or sanctioned and persist an audit receipt on Walrus Memory.",
        "Reject Bech32 private keys (`suiprivkey1...`) immediately on client input.",
      ],
    };
    focusB = {
      suffix: "credit-guard",
      title: "Tatum API Quota & 30-Minute Cache Guard",
      bullets: [
        "Cache `/v4/data/rate/symbol` SUI/USD quotes and per-address security checks for 30 minutes.",
        "Never attach `setInterval` background polling to Tatum endpoints so the 100K credit budget stays protected.",
        "Expose manual refresh only when an operator explicitly requests live re-verification.",
      ],
    };
    focusC = {
      suffix: "ai-builder-bridge",
      title: "Tatum AI Builder & MCP Cloud Sync",
      bullets: [
        "Keep CORS-enabled HTTPS endpoints (`/api/tatum-memwal/chat`, `/recall`, `/remember`, `/mcp`) live for `ai.tatum.io`.",
        "Tag every cross-agent write with `[AGENT_LOG]` so web and CLI operators see exact execution provenance.",
        "Verify SUI/USD valuation alongside Walrus blob storage epochs before bulk uploads.",
      ],
    };
    rule1 =
      "Always cache Tatum v4 exchange rates and v3 address checks with a 30-minute TTL and zero background polling.";
    rationale1 =
      "Protects the 100K Mainnet API credit quota while keeping SUI/USD and security checks responsive.";
    rule2 =
      "Screen every newly invited Sui address via Tatum v3 Security API before authorizing SEAL decryption.";
    rationale2 =
      "Prevents compromised or sanctioned wallets from joining shared team memory vaults.";
  } else if (
    lower.includes("ui") ||
    lower.includes("ux") ||
    lower.includes("frontend") ||
    lower.includes("playwright") ||
    lower.includes("qa")
  ) {
    domainCategory = "UI Audit & Browser QA";
    focusA = {
      suffix: "design-tokens",
      title: "Semantic Tokens & Responsive Hierarchy",
      bullets: [
        "Use semantic CSS variables rather than hardcoded hex colors so light and dark themes stay balanced.",
        "Keep primary navigation focused on human jobs-to-be-done with zero duplicate CTAs on the same screen.",
        "Test longest realistic strings (`0x...` 66-char addresses, 44-char blob IDs) against horizontal overflow.",
      ],
    };
    focusB = {
      suffix: "state-machines",
      title: "Interactive State Machine Modeling",
      bullets: [
        "Explicitly model `idle`, `loading`, `success`, `empty`, and `error` states on every async action.",
        "Disable submit triggers while in flight to guard against rapid double-clicks.",
        "Ensure keyboard-only Tab/Escape navigation works cleanly across modals and drawers.",
      ],
    };
    focusC = {
      suffix: "playwright-gate",
      title: "Headless Playwright Visual & DOM Verification",
      bullets: [
        "Verify live rendered views in headless Chrome at both `1440x900` desktop and `390x844` mobile viewports.",
        "Assert `scrollWidth <= innerWidth` and zero uncaught console or page errors.",
        "Capture deterministic before and after screenshots for every UI change.",
      ],
    };
    rule1 =
      "Verify every UI workflow in headless Playwright at 1440x900 and 390x844 with scrollWidth <= innerWidth before shipping.";
    rationale1 =
      "Catches clipped cards, flex-direction regressions, and mobile overflow that static typechecks miss.";
    rule2 =
      "Guard every async button with explicit loading and error states so double-clicks cannot queue duplicate network jobs.";
    rationale2 =
      "Prevents duplicate Walrus blob uploads and confusing stale button labels.";
  }

  const s1Id = `${slug}-${focusA.suffix}`;
  const s2Id = `${slug}-${focusB.suffix}`;
  const s3Id = `${slug}-${focusC.suffix}`;

  const makeMarkdown = (id: string, title: string, bullets: string[]) => `---
name: ${id}
category: "${domainCategory}"
description: "${title} for ${slug}"
---

# ${title}

> **Collection Goal (\`${slug}\`)**: ${goal}

## Core Playbook Rules

${bullets.map((b, idx) => `${idx + 1}. ${b}`).join("\n")}
`;

  const skills: HostedSkillNode[] = [
    {
      id: s1Id,
      name: s1Id,
      namespace: slug,
      category: domainCategory,
      description: `${focusA.title} (${goal.slice(0, 90)})`,
      markdown: makeMarkdown(s1Id, focusA.title, focusA.bullets),
      relatedSkills: [s2Id, s3Id],
      blobId: `pending_${s1Id}`,
      updatedAt: nowIso,
      authorKey: params.authorHandle,
    },
    {
      id: s2Id,
      name: s2Id,
      namespace: slug,
      category: domainCategory,
      description: `${focusB.title} for ${slug}`,
      markdown: makeMarkdown(s2Id, focusB.title, focusB.bullets),
      relatedSkills: [s1Id, s3Id],
      blobId: `pending_${s2Id}`,
      updatedAt: nowIso,
      authorKey: params.authorHandle,
    },
    {
      id: s3Id,
      name: s3Id,
      namespace: slug,
      category: domainCategory,
      description: `${focusC.title} for ${slug}`,
      markdown: makeMarkdown(s3Id, focusC.title, focusC.bullets),
      relatedSkills: [s1Id, s2Id],
      blobId: `pending_${s3Id}`,
      updatedAt: nowIso,
      authorKey: params.authorHandle,
    },
  ];

  const flows: FlowMemoryNode[] = [
    {
      id: `flow-${slug}-1-${Date.now()}`,
      skillId: s1Id,
      namespace: slug,
      rule: rule1,
      rationale: rationale1,
      severity: "hard-rule",
      blobId: `pending_flow_${slug}_1`,
      createdAt: nowIso,
      authorHandle: params.authorHandle,
      authorDelegateKey: "dk_walrus_live",
      linkedSkills: [s2Id],
      similarityScore: 0.97,
    },
    {
      id: `flow-${slug}-2-${Date.now() + 1}`,
      skillId: s3Id,
      namespace: slug,
      rule: rule2,
      rationale: rationale2,
      severity: "workflow-update",
      blobId: `pending_flow_${slug}_2`,
      createdAt: nowIso,
      authorHandle: params.authorHandle,
      authorDelegateKey: "dk_walrus_live",
      linkedSkills: [s1Id],
      similarityScore: 0.95,
    },
  ];

  return {
    namespace: slug,
    goal,
    engineUsed: "domain-blueprint",
    skills,
    flows,
  };
}

/**
 * Generates a tailored SKILL.md + Team Rule collection for a new namespace.
 * Uses live OpenRouter / OpenAI chat completion when an API key is provided,
 * and falls back cleanly to the deterministic domain blueprint generator.
 */
export async function generateSkillCollectionFromPrompt(params: {
  namespace: string;
  goal: string;
  authorHandle: string;
  apiKey?: string;
}): Promise<GeneratedSkillCollection> {
  const slug = sanitizeCollectionSlug(params.namespace) || "custom-skills";
  const goal =
    params.goal.trim() ||
    `Shared team playbooks and learned rules for ${slug}.`;
  const storedKey =
    typeof window !== "undefined" &&
    typeof window.localStorage?.getItem === "function"
      ? window.localStorage.getItem("memwal_openrouter_api_key")?.trim() || ""
      : "";
  const apiKey = (params.apiKey ?? storedKey).trim();

  if (apiKey.length >= 20) {
    try {
      const isOpenRouter = apiKey.startsWith("sk-or-");
      const endpoint = isOpenRouter
        ? "https://openrouter.ai/api/v1/chat/completions"
        : "https://api.openai.com/v1/chat/completions";
      const model = isOpenRouter ? "openai/gpt-4o-mini" : "gpt-4o-mini";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.3,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                'You are an AI Skill Architect generating concise, actionable SKILL.md playbooks and team rules in English (never use em-dashes or en-dashes). Return strict JSON: {"category":"string","skills":[{"suffix":"kebab-slug","title":"string","description":"string","bullets":["string","string","string"]}],"rules":[{"rule":"string","rationale":"string","severity":"hard-rule"|"workflow-update"|"gotcha"}]} with exactly 3 skills and 2 rules.',
            },
            {
              role: "user",
              content: `Collection namespace: "${slug}"\nGoal: "${goal}"`,
            },
          ],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content;
        if (typeof content === "string") {
          const parsed = JSON.parse(content) as {
            category?: string;
            skills?: Array<{
              suffix?: string;
              title?: string;
              description?: string;
              bullets?: string[];
            }>;
            rules?: Array<{
              rule?: string;
              rationale?: string;
              severity?: FlowMemoryNode["severity"];
            }>;
          };
          if (Array.isArray(parsed.skills) && parsed.skills.length >= 2) {
            const nowIso = new Date().toISOString();
            const cat = parsed.category?.trim() || "AI Generated Playbooks";
            const builtSkills: HostedSkillNode[] = parsed.skills
              .slice(0, 3)
              .map((s, idx) => {
                const sfx =
                  sanitizeCollectionSlug(s.suffix || `skill-${idx + 1}`) ||
                  `skill-${idx + 1}`;
                const id = sfx.startsWith(slug) ? sfx : `${slug}-${sfx}`;
                const title = s.title?.trim() || id;
                const bullets =
                  Array.isArray(s.bullets) && s.bullets.length > 0
                    ? s.bullets
                    : [goal];
                const md = `---\nname: ${id}\ncategory: "${cat}"\ndescription: "${(
                  s.description || title
                ).replace(/"/g, "'")}"\n---\n\n# ${title}\n\n> **Collection Goal (\`${slug}\`)**: ${goal}\n\n## Core Playbook Rules\n\n${bullets
                  .map((b, i) => `${i + 1}. ${b}`)
                  .join("\n")}\n`;
                return {
                  id,
                  name: id,
                  namespace: slug,
                  category: cat,
                  description: s.description?.trim() || title,
                  markdown: md,
                  relatedSkills: [],
                  blobId: `pending_${id}`,
                  updatedAt: nowIso,
                  authorKey: params.authorHandle,
                };
              });

            const ids = builtSkills.map((s) => s.id);
            for (const s of builtSkills) {
              s.relatedSkills = ids.filter((other) => other !== s.id);
            }

            const builtFlows: FlowMemoryNode[] = (parsed.rules || [])
              .slice(0, 2)
              .map((r, idx) => ({
                id: `flow-${slug}-llm-${Date.now() + idx}`,
                skillId: builtSkills[idx % builtSkills.length].id,
                namespace: slug,
                rule:
                  r.rule?.trim() ||
                  `Recall "${slug}" skills before modifying related modules.`,
                rationale: r.rationale?.trim() || goal,
                severity: r.severity || "hard-rule",
                blobId: `pending_flow_${slug}_${idx}`,
                createdAt: nowIso,
                authorHandle: params.authorHandle,
                authorDelegateKey: "dk_walrus_live",
                linkedSkills: ids.slice(0, 2),
                similarityScore: 0.98,
              }));

            return {
              namespace: slug,
              goal,
              engineUsed: "live-llm",
              skills: builtSkills,
              flows: builtFlows,
            };
          }
        }
      }
    } catch {
      // Fall back to deterministic domain blueprint
    }
  }

  return buildDomainBlueprintCollection({
    namespace: slug,
    goal,
    authorHandle: params.authorHandle,
  });
}

export function buildExternalAgentSetupCommand(params: {
  vendor: AgentVendorId;
  config: WalrusConnectionConfig;
  namespace: string;
}): string {
  const slug = sanitizeCollectionSlug(params.namespace) || "custom-skills";
  const acct = params.config.accountId.trim();
  const key = params.config.delegateKey.trim();
  const serverUrl =
    params.config.serverUrl.trim() || RELAYER_URLS[params.config.env];
  const publicBridge = resolvePublicBridgeBaseUrl();

  if (params.vendor === "claude-code") {
    return `claude mcp add memwal -e MEMWAL_ACCOUNT_ID=${acct} -e MEMWAL_PRIVATE_KEY=${key} -e MEMWAL_NAMESPACE=${slug} -e MEMWAL_SERVER_URL=${serverUrl} -- npx -y @mysten-incubation/memwal-mcp`;
  }
  if (params.vendor === "codex") {
    return `codex mcp add memwal --env MEMWAL_ACCOUNT_ID=${acct} --env MEMWAL_PRIVATE_KEY=${key} --env MEMWAL_NAMESPACE=${slug} --env MEMWAL_SERVER_URL=${serverUrl} -- npx -y @mysten-incubation/memwal-mcp`;
  }
  if (params.vendor === "tatum-ai") {
    return JSON.stringify(
      {
        bridgeChatEndpoint: `${publicBridge}/api/tatum-memwal/chat`,
        openApiSpec: `${publicBridge}/api/tatum-memwal/openapi.json`,
        mcpHttpEndpoint: `${publicBridge}/api/tatum-memwal/mcp`,
        namespace: slug,
        accountId: acct,
      },
      null,
      2
    );
  }
  return JSON.stringify(
    {
      mcpServers: {
        memwal: {
          command: "npx",
          args: ["-y", "@mysten-incubation/memwal-mcp"],
          env: {
            MEMWAL_ACCOUNT_ID: acct,
            MEMWAL_PRIVATE_KEY: key,
            MEMWAL_NAMESPACE: slug,
            MEMWAL_SERVER_URL: serverUrl,
          },
        },
      },
    },
    null,
    2
  );
}

export function buildExternalAgentBootstrapPrompt(params: {
  vendor: AgentVendorId;
  config: WalrusConnectionConfig;
  namespace: string;
  goal: string;
}): string {
  const slug = sanitizeCollectionSlug(params.namespace) || "custom-skills";
  const author = params.config.memberHandle || "@harrymove-ctrl";
  const publicBridge = resolvePublicBridgeBaseUrl();
  const cleanGoal = (
    params.goal.trim() ||
    `Reusable SKILL.md playbooks and team rules for ${slug}`
  ).replace(/\.+$/, "");

  return `Create & sync Walrus skill folder "${slug}" (${cleanGoal}):
1. Seed folder & 3 SKILL.md playbooks: POST ${publicBridge}/api/tatum-memwal/create-collection {"slug":"${slug}","prompt":"${cleanGoal}","author":"${author}","agent":"${params.vendor}"}
2. Save extra rules: POST ${publicBridge}/api/tatum-memwal/remember {"namespace":"${slug}","skillId":"${slug}-core","author":"${author}","text":"[FLOW:${slug}-core] ${cleanGoal}"}
3. Verify live Walrus blobs: GET ${publicBridge}/api/tatum-memwal/activity?namespace=${slug}`;
}

export function buildRuleTestAgentPrompt(params: {
  skillId: string;
  skillName: string;
  namespace: string;
  ruleText: string;
  authorHandle?: string;
  blobId?: string;
}): string {
  const slug = sanitizeCollectionSlug(params.namespace) || "mysten-incubation";
  const publicBridge = resolvePublicBridgeBaseUrl();
  const cleanRule = params.ruleText.trim();

  return `Test MemWal rule in "${slug}" for "${params.skillName}":
1. Recall rule: POST ${publicBridge}/api/tatum-memwal/recall {"namespace":"${slug}","query":"${params.skillId} ${cleanRule}","limit":5}
2. Rule to verify: "${cleanRule}"
3. Show BEFORE (without rule) vs AFTER (with rule) and cite the recalled Walruscan blob ID.`;
}

export function buildShareNamespaceUrl(params: {
  namespace: string;
  skillId?: string;
  accessRole?: "owner" | "read-write" | "read-only";
  invitedBy?: string;
}): string {
  const slug = sanitizeCollectionSlug(params.namespace) || "memwal-team-skills";
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "http://localhost:5188";
  const role = params.accessRole || "read-only";
  const inviter = params.invitedBy
    ? `&by=${encodeURIComponent(params.invitedBy)}`
    : "";
  const skillQuery = params.skillId
    ? `&skill=${encodeURIComponent(params.skillId)}`
    : "";
  return `${origin}/graph?ns=${encodeURIComponent(slug)}&share=1&role=${encodeURIComponent(role)}${inviter}${skillQuery}`;
}

export function buildShareNamespacePullPrompt(params: {
  namespace: string;
  accountId: string;
  serverUrl?: string;
  skillsCount?: number;
  flowsCount?: number;
  activeSkillId?: string;
  skillNames?: string[];
  accessRole?: "owner" | "read-write" | "read-only";
  invitedBy?: string;
}): string {
  const slug = sanitizeCollectionSlug(params.namespace) || "memwal-team-skills";
  const publicBridge = resolvePublicBridgeBaseUrl();
  const role = params.accessRole || "read-only";
  const isReadOnly = role === "read-only";

  return `Pull shared MemWal folder "${slug}" (Scope: ${isReadOnly ? "READ-ONLY" : "READ & WRITE"}):
1. Recall skills & rules: POST ${publicBridge}/api/tatum-memwal/recall {"namespace":"${slug}","query":"SKILL_MD FLOW","limit":30}
2. Save each [SKILL:<id>] to .agents/skills/<id>/SKILL.md and append [FLOW:<id>] rules.
3. Policy: ${isReadOnly ? "READ-ONLY — use memwal_recall only; do NOT call memwal_remember." : "READ & WRITE — use memwal_recall to read and memwal_remember to sync approved updates."}`;
}


