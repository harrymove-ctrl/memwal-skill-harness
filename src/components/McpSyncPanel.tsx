"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  RefreshCw,
  UploadCloud,
  UserPlus,
} from "lucide-react";
import type {
  AgentActivityReceipt,
  FlowMemoryNode,
  HostedSkillNode,
  WalrusConnectionConfig,
} from "../types";
import {
  buildAgentSelfUpdatingMarkdown,
  DEFAULT_CONSOLE_BUNDLE,
} from "../lib/consoleBuckets";
import { buildTatumWalrusUnifiedMcpJson } from "../lib/tatumBridge";
import {
  buildShareNamespacePullPrompt,
  buildShareNamespaceUrl,
} from "../lib/skillCollectionGenerator";
import {
  verifySuiAddressForSeal,
  type SuiAddressVerificationReport,
} from "../lib/addressVerifier";
import { cx } from "./sorbet/SorbetToolPermissions";
import { SignerOrb3D } from "./ui/walrus-3d-icons";
import { DiscreteTabs, SaveButton } from "./uselayouts";

export interface BucketSyncStatusInfo {
  state: "idle" | "syncing" | "verifying" | "success" | "error";
  message: string;
  namespace?: string;
  syncedTotal?: number;
  firstJobId?: string;
  recalledCount?: number;
  latencyMs?: number;
  verifiedBlobIds?: string[];
  verifiedAt?: string;
}

interface McpSyncPanelProps {
  config: WalrusConnectionConfig;
  skillsCount: number;
  flowsCount: number;
  skills?: HostedSkillNode[];
  flows?: FlowMemoryNode[];
  localReceipts?: AgentActivityReceipt[];
  onSelectSkill?: (skillId: string) => void;
  syncStatus: BucketSyncStatusInfo;
  onChangeConfig: (next: WalrusConnectionConfig) => void;
  onPushNamespaceToWalrus: () => void;
  onPullNamespaceFromWalrus: () => void;
  onCollapse?: () => void;
  initialView?: "sync" | "seal" | "tatum";
  layoutMode?: "tabbed" | "split";
}

type AgentId =
  | "argon"
  | "claude"
  | "cursor"
  | "codex"
  | "antigravity"
  | "tatum";

const AGENT_OPTIONS: Array<{ id: AgentId; label: string }> = [
  { id: "argon", label: "Argon Code" },
  { id: "claude", label: "Claude Code" },
  { id: "cursor", label: "Cursor" },
  { id: "codex", label: "Codex" },
  { id: "antigravity", label: "Antigravity" },
  { id: "tatum", label: "Tatum AI" },
];

interface AclMember {
  handle: string;
  role: string;
  accessRole?: "owner" | "read-write" | "read-only";
  suiAddress: string;
  isOwner: boolean;
}

const DEFAULT_MEMBERS: AclMember[] = [
  {
    handle: "@harrymove-ctrl",
    role: "Owner",
    accessRole: "owner",
    suiAddress:
      "0x25f79761fee2eb67ca61b21ee8574b6bf8abd1ba7bfdf933db02a864e807e981",
    isOwner: true,
  },
  {
    handle: "@console-key-admin",
    role: "Read & Write",
    accessRole: "read-write",
    suiAddress:
      "0xbe908ba01d26a06e72a6d859ee0fcd2cb3f7727f67099a042b3fb9ad3c06ba8b",
    isOwner: false,
  },
  {
    handle: "@teammate-qa",
    role: "Read Only",
    accessRole: "read-only",
    suiAddress:
      "0x58db5a94c291f8e704c05e8627a9210c48b8d63e091a4ef7295cc471a83029f1",
    isOwner: false,
  },
];

export const McpSyncPanel: React.FC<McpSyncPanelProps> = ({
  config,
  skillsCount,
  flowsCount,
  syncStatus,
  onPushNamespaceToWalrus,
  onPullNamespaceFromWalrus,
}) => {
  const [selectedAgent, setSelectedAgent] = useState<AgentId>("argon");
  const [setupFormat, setSetupFormat] = useState<
    "quick" | "mcp-json" | "agents-md"
  >("quick");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Team ACL state
  const [members, setMembers] = useState<AclMember[]>(DEFAULT_MEMBERS);
  const [inviteAddress, setInviteAddress] = useState("");
  const [inviteRole, setInviteRole] = useState<"Read & Write" | "Read Only">(
    "Read & Write"
  );
  const [verifyingWallet, setVerifyingWallet] = useState(false);
  const [walletReport, setWalletReport] =
    useState<SuiAddressVerificationReport | null>(null);

  const loadAcl = useCallback(async (ns: string) => {
    try {
      const res = await fetch(
        `/api/tatum-memwal/acl?namespace=${encodeURIComponent(ns)}`
      );
      if (!res.ok) return;
      const json = await res.json();
      if (Array.isArray(json.members) && json.members.length > 0) {
        setMembers(json.members);
      }
    } catch {
      // keep default members
    }
  }, []);

  useEffect(() => {
    void loadAcl(config.namespace);
  }, [config.namespace, loadAcl]);

  useEffect(() => {
    const clean = inviteAddress.trim();
    if (!clean) {
      setWalletReport(null);
      return;
    }
    let cancelled = false;
    setVerifyingWallet(true);
    const t = setTimeout(() => {
      void verifySuiAddressForSeal({
        input: clean,
        existingAddresses: members.map((m) => m.suiAddress),
        accountId: config.accountId,
      })
        .then((rep) => {
          if (!cancelled) setWalletReport(rep);
        })
        .finally(() => {
          if (!cancelled) setVerifyingWallet(false);
        });
    }, 240);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [inviteAddress, members, config.accountId]);

  const copyText = (text: string, id: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(text);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1600);
  };

  const mcpJsonSnippet = useMemo(
    () => buildTatumWalrusUnifiedMcpJson(config),
    [config]
  );

  const agentsMdSnippet = useMemo(
    () =>
      buildAgentSelfUpdatingMarkdown({
        mode: "hybrid",
        bundle: DEFAULT_CONSOLE_BUNDLE,
        bucketId: "217e53fc-36ff-4d1b-8834-04f69c2ef553",
        namespace: config.namespace,
        accountId: config.accountId,
        serverUrl: config.serverUrl,
        callerHandle: config.memberHandle || "@harrymove-ctrl",
      }),
    [config]
  );

  const activeSnippet = useMemo(() => {
    if (setupFormat === "mcp-json") return mcpJsonSnippet;
    if (setupFormat === "agents-md") return agentsMdSnippet;

    if (selectedAgent === "argon") {
      return [
        `# Argon Code (T3 Code zroute / Gemini 4 Argon) · Walrus Skills + UI/UX`,
        `npx -y @mysten-incubation/walrus-console-mcp config \\`,
        `  --allowed-dirs "$(pwd)" --allowed-dirs /tmp`,
        `# Bucket: https://console.walrus.xyz/buckets/?b=217e53fc-36ff-4d1b-8834-04f69c2ef553`,
        `# Skills synced: ui-ux-qa, concise-ui-copy, boost, memwal-qa (${skillsCount} total)`,
      ].join("\n");
    }
    if (selectedAgent === "claude") {
      return [
        `claude mcp add memwal \\`,
        `  -e MEMWAL_ACCOUNT_ID=${config.accountId} \\`,
        `  -e MEMWAL_NAMESPACE=${config.namespace} \\`,
        `  -e WALRUS_SKILL_BUCKET_ID=217e53fc-36ff-4d1b-8834-04f69c2ef553 \\`,
        `  -- npx -y @mysten-incubation/memwal-mcp`,
      ].join("\n");
    }
    if (selectedAgent === "codex") {
      return [
        `[mcp_servers.memwal]`,
        `command = "npx"`,
        `args = ["-y", "@mysten-incubation/memwal-mcp"]`,
        `env = { MEMWAL_ACCOUNT_ID = "${config.accountId}", MEMWAL_NAMESPACE = "${config.namespace}", WALRUS_SKILL_BUCKET_ID = "217e53fc-36ff-4d1b-8834-04f69c2ef553" }`,
      ].join("\n");
    }
    if (selectedAgent === "tatum") {
      return buildShareNamespacePullPrompt({
        namespace: config.namespace,
        accountId: config.accountId,
        serverUrl: config.serverUrl,
        accessRole: "read-only",
        skillsCount,
        flowsCount,
        invitedBy: config.memberHandle || "@harrymove-ctrl",
      });
    }
    return mcpJsonSnippet;
  }, [setupFormat, selectedAgent, config, skillsCount, flowsCount, mcpJsonSnippet, agentsMdSnippet]);

  const handleAddMember = async () => {
    if (!walletReport?.canAuthorize) return;
    const addr = walletReport.normalizedAddress || inviteAddress.trim();
    const handle = inviteAddress.endsWith(".sui")
      ? inviteAddress.trim()
      : `${addr.slice(0, 6)}…${addr.slice(-4)}`;
    try {
      const res = await fetch("/api/tatum-memwal/acl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namespace: config.namespace,
          action: "upsert",
          member: {
            handle,
            role: inviteRole,
            accessRole:
              inviteRole === "Read Only" ? "read-only" : "read-write",
            suiAddress: addr,
          },
        }),
      });
      const json = await res.json();
      if (Array.isArray(json.members)) {
        setMembers(json.members);
      }
      setInviteAddress("");
      setWalletReport(null);
    } catch {
      // ignore
    }
  };

  const handleRemoveMember = async (addr: string) => {
    try {
      const res = await fetch("/api/tatum-memwal/acl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namespace: config.namespace,
          action: "remove",
          suiAddress: addr,
        }),
      });
      const json = await res.json();
      if (Array.isArray(json.members)) {
        setMembers(json.members);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="grid grid-cols-1 gap-4 lg:grid-cols-2"
      data-testid="connect-essential-zones"
    >
      {/* ====================================================================
          CARD 1: CONNECT AGENT (ARGON CODE, CLAUDE, CURSOR, CODEX)
         ==================================================================== */}
      <section
        data-testid="connect-card-agent"
        className="flex flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-2xs dark:border-white/10 dark:bg-[#111514]"
      >
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xs font-bold tracking-wider text-neutral-900 uppercase dark:text-white">
              1. Connect Coding Agent
            </h2>

            <DiscreteTabs
              layoutId="connect-setup-format"
              size="xs"
              activeId={setupFormat}
              onChange={(id) =>
                setSetupFormat(id as "quick" | "mcp-json" | "agents-md")
              }
              items={[
                { id: "quick", label: "Quick CLI" },
                { id: "mcp-json", label: ".mcp.json" },
                { id: "agents-md", label: "AGENTS.md" },
              ]}
            />
          </div>

          {setupFormat === "quick" && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {AGENT_OPTIONS.map((agent) => {
                const active = selectedAgent === agent.id;
                return (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => setSelectedAgent(agent.id)}
                    className={cx(
                      "h-7 cursor-pointer rounded-lg px-2.5 text-xs font-medium transition",
                      active
                        ? "bg-neutral-900 text-white dark:bg-emerald-500 dark:text-neutral-950"
                        : "border border-neutral-200/80 bg-neutral-50 text-neutral-700 hover:bg-neutral-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-300"
                    )}
                  >
                    {agent.label}
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between gap-2">
            <a
              href="https://console.walrus.xyz/buckets/?b=217e53fc-36ff-4d1b-8834-04f69c2ef553"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
            >
              <span>Bucket 217e53fc… ({skillsCount} skills)</span>
              <ExternalLink className="size-3" />
            </a>

            <button
              type="button"
              data-testid="copy-agent-config-btn"
              onClick={() => copyText(activeSnippet, "agent-snippet")}
              className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-lg bg-emerald-600 px-2.5 font-mono text-[11px] font-semibold text-white hover:bg-emerald-500"
            >
              {copiedId === "agent-snippet" ? (
                <Check className="size-3" />
              ) : (
                <Copy className="size-3" />
              )}
              <span>
                {copiedId === "agent-snippet" ? "Copied" : "Copy Config"}
              </span>
            </button>
          </div>
        </div>

        <pre className="mt-2.5 max-h-52 overflow-auto rounded-xl bg-neutral-950 p-3 font-mono text-[11px] leading-relaxed text-neutral-100">
          <code>{activeSnippet}</code>
        </pre>
      </section>

      {/* ====================================================================
          CARD 2: TEAM ACCESS & BUCKET SYNC
         ==================================================================== */}
      <section
        data-testid="connect-card-team"
        className="flex flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-2xs dark:border-white/10 dark:bg-[#111514]"
      >
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xs font-bold tracking-wider text-neutral-900 uppercase dark:text-white">
              2. Team Access &amp; Sync
            </h2>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  copyText(
                    buildShareNamespaceUrl({
                      namespace: config.namespace,
                      accessRole: "read-only",
                      invitedBy: config.memberHandle || "@harrymove-ctrl",
                    }),
                    "invite-link"
                  )
                }
                className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-lg border border-neutral-200 px-2 font-mono text-[11px] font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-white/12 dark:text-neutral-200"
              >
                {copiedId === "invite-link" ? (
                  <Check className="size-3 text-emerald-500" />
                ) : (
                  <Copy className="size-3" />
                )}
                <span>
                  {copiedId === "invite-link" ? "Copied" : "Invite Link"}
                </span>
              </button>

              <button
                type="button"
                onClick={onPullNamespaceFromWalrus}
                className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-lg border border-neutral-200 px-2 font-mono text-[11px] font-semibold text-neutral-700 hover:bg-neutral-50 dark:border-white/12 dark:text-neutral-200"
              >
                <RefreshCw
                  className={cx(
                    "size-3",
                    syncStatus.state === "syncing" && "animate-spin"
                  )}
                />
                <span>Sync</span>
              </button>

              <SaveButton
                state={syncStatus.state === "syncing" ? "saving" : "idle"}
                idleLabel="Push"
                savingLabel="Pushing…"
                icon={<UploadCloud className="size-3" />}
                onClick={onPushNamespaceToWalrus}
              />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={inviteAddress}
              onChange={(e) => setInviteAddress(e.target.value)}
              placeholder="Paste 0x… Sui address or name.sui"
              className="h-8 min-w-[160px] flex-1 rounded-xl border border-neutral-200/90 bg-neutral-50 px-3 font-mono text-xs text-neutral-900 outline-none focus:border-emerald-500 dark:border-white/12 dark:bg-black/30 dark:text-white"
            />
            <select
              value={inviteRole}
              onChange={(e) =>
                setInviteRole(e.target.value as "Read & Write" | "Read Only")
              }
              className="h-8 rounded-xl border border-neutral-200/90 bg-white px-2 text-xs font-medium text-neutral-700 dark:border-white/12 dark:bg-neutral-900 dark:text-neutral-200"
            >
              <option value="Read & Write">Read &amp; Write</option>
              <option value="Read Only">Read Only</option>
            </select>
            <button
              type="button"
              disabled={!walletReport?.canAuthorize || verifyingWallet}
              onClick={() => void handleAddMember()}
              className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-xl bg-neutral-900 px-3 text-xs font-semibold text-white hover:bg-neutral-800 disabled:opacity-45 dark:bg-emerald-500 dark:text-neutral-950"
            >
              <UserPlus className="size-3.5" />
              <span>Add</span>
            </button>
          </div>

          {walletReport && (
            <div className="mt-1.5 font-mono text-[10px]">
              {walletReport.overallStatus === "blocked" ? (
                <span className="font-bold text-rose-600">
                  {walletReport.summary}
                </span>
              ) : walletReport.canAuthorize ? (
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  ✓ {walletReport.summary}
                </span>
              ) : (
                <span className="text-amber-600">{walletReport.summary}</span>
              )}
            </div>
          )}

          <div className="mt-3 divide-y divide-neutral-200/70 dark:divide-white/10">
            {members.map((m) => (
              <div
                key={m.suiAddress}
                className="flex items-center justify-between gap-2 py-2 first:pt-0.5 last:pb-0.5"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <SignerOrb3D
                    initials={m.handle.replace(/^@/, "").slice(0, 2).toUpperCase()}
                    handle={m.handle}
                    size="sm"
                    online
                  />
                  <div className="min-w-0">
                    <span className="block truncate font-mono text-xs font-bold text-neutral-900 dark:text-white">
                      {m.handle}
                    </span>
                    <span className="block truncate font-mono text-[10px] text-neutral-400">
                      {m.suiAddress.slice(0, 8)}…{m.suiAddress.slice(-4)}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={cx(
                      "rounded-full px-2 py-0.5 font-mono text-[10px] font-bold",
                      m.isOwner
                        ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                        : m.role === "Read Only"
                          ? "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                          : "bg-neutral-200/80 text-neutral-700 dark:bg-white/10 dark:text-neutral-300"
                    )}
                  >
                    {m.role}
                  </span>
                  {!m.isOwner && (
                    <button
                      type="button"
                      onClick={() => void handleRemoveMember(m.suiAddress)}
                      className="text-[11px] text-neutral-400 hover:text-rose-500"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
export default McpSyncPanel;
