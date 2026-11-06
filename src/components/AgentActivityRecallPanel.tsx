import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Check,
  Copy,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import type { AgentActivityReceipt, WalrusConnectionConfig } from "../types";
import {
  FALLBACK_WALRUS_BLOBS_SET,
  isVerifiedWalrusBlobId,
} from "./agentActivityUtils";
import { recallNamespaceAuditTrail } from "../lib/memwalBridge";

interface AgentActivityRecallPanelProps {
  config: WalrusConnectionConfig;
  localReceipts?: AgentActivityReceipt[];
  compact?: boolean;
  onSelectSkill?: (skillId: string) => void;
}

type FilterMode = "all" | "agent-log" | "skills" | "rules";

function formatRelativeTime(iso: string): string {
  const ts = new Date(iso).getTime();
  if (!Number.isFinite(ts)) return iso;
  const diffSec = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

function actionBadgeStyle(action: AgentActivityReceipt["action"]): {
  label: string;
  cls: string;
} {
  switch (action) {
    case "CREATE_NAMESPACE":
      return {
        label: "CREATE COLLECTION",
        cls: "bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/30",
      };
    case "PUSH_SKILL":
      return {
        label: "PUSH SKILL.MD",
        cls: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30",
      };
    case "UPDATE_SKILL":
      return {
        label: "UPDATE SKILL.MD",
        cls: "bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-500/30",
      };
    case "LEARN_RULE":
      return {
        label: "LEARNED RULE",
        cls: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
      };
    default:
      return {
        label: "AGENT EXECUTION",
        cls: "bg-neutral-500/15 text-neutral-800 dark:text-neutral-300 border-neutral-500/30",
      };
  }
}

export const AgentActivityRecallPanel: React.FC<
  AgentActivityRecallPanelProps
> = ({ config, localReceipts = [], compact = false, onSelectSkill }) => {
  const [remoteReceipts, setRemoteReceipts] = useState<AgentActivityReceipt[]>(
    []
  );
  const [totalActive, setTotalActive] = useState<number>(0);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [copiedBlob, setCopiedBlob] = useState<string | null>(null);

  const runAuditRecall = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await recallNamespaceAuditTrail(config, config.namespace);
      setRemoteReceipts(res.receipts);
      setTotalActive(res.totalActiveMemories);
      setLatencyMs(res.latencyMs);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to recall namespace activity from relayer."
      );
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    void runAuditRecall();
  }, [runAuditRecall]);

  const mergedReceipts = useMemo(() => {
    const scopedLocal = localReceipts.filter(
      (r) => r.namespace === config.namespace
    );
    const seenBlobs = new Set(remoteReceipts.map((r) => r.blobId));
    const extras = scopedLocal.filter((r) => !seenBlobs.has(r.blobId));
    return [...extras, ...remoteReceipts].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [localReceipts, remoteReceipts, config.namespace]);

  const filtered = useMemo(() => {
    return mergedReceipts.filter((item) => {
      if (filter === "agent-log") return item.sourceKind === "agent-log";
      if (filter === "skills")
        return (
          item.action === "PUSH_SKILL" ||
          item.action === "UPDATE_SKILL" ||
          item.sourceKind === "inferred-skill"
        );
      if (filter === "rules")
        return (
          item.action === "LEARN_RULE" || item.sourceKind === "inferred-flow"
        );
      return true;
    });
  }, [mergedReceipts, filter]);

  const copyBlobId = (blobId: string) => {
    navigator.clipboard.writeText(blobId);
    setCopiedBlob(blobId);
    setTimeout(
      () => setCopiedBlob((prev) => (prev === blobId ? null : prev)),
      1600
    );
  };

  return (
    <div
      data-testid="agent-activity-recall-panel"
      className="space-y-3 rounded-2xl border border-neutral-900/12 bg-[var(--sheet)] p-4 dark:border-white/12"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Activity className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-sans text-sm font-extrabold text-[color:var(--ink)]">
              Agent Activity &amp; Audit Recall
            </span>
            <span className="rb-badge-mint rounded-full px-2 py-0.5 font-mono text-[10px] font-bold">
              {config.namespace} · {Math.max(totalActive, mergedReceipts.length)}{" "}
              blobs
            </span>
            {latencyMs !== null && (
              <span className="font-mono text-[10px] text-neutral-500 dark:text-neutral-400">
                {latencyMs} ms
              </span>
            )}
          </div>
          <p className="mt-0.5 font-sans text-[11.5px] text-neutral-600 dark:text-neutral-400">
            Cryptographic join of <code className="font-mono">listMemories()</code> Ed25519{" "}
            <code className="font-mono">agent_id</code> signers +{" "}
            <code className="font-mono">recall(sort=&quot;recent&quot;)</code> decrypted receipts.
          </p>
        </div>

        <button
          type="button"
          data-testid="recall-latest-activity-btn"
          disabled={loading}
          onClick={() => void runAuditRecall()}
          className="rb-btn-secondary inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 font-mono text-[11px] font-bold disabled:opacity-50"
        >
          <RefreshCw
            className={`size-3.5 ${loading ? "animate-spin" : ""}`}
          />
          <span>{loading ? "Recalling..." : "Recall Latest"}</span>
        </button>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        {(
          [
            { id: "all", label: `All (${mergedReceipts.length})` },
            {
              id: "agent-log",
              label: `Agent Receipts (${
                mergedReceipts.filter((r) => r.sourceKind === "agent-log")
                  .length
              })`,
            },
            {
              id: "skills",
              label: `Skills (${
                mergedReceipts.filter(
                  (r) =>
                    r.action === "PUSH_SKILL" || r.action === "UPDATE_SKILL"
                ).length
              })`,
            },
            {
              id: "rules",
              label: `Rules (${
                mergedReceipts.filter((r) => r.action === "LEARN_RULE").length
              })`,
            },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`cursor-pointer rounded-full px-2.5 py-1 font-mono text-[10.5px] font-bold transition ${
              filter === tab.id
                ? "rb-pill-active"
                : "border border-neutral-900/12 text-neutral-600 hover:bg-neutral-900/5 dark:border-white/12 dark:text-neutral-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 font-mono text-xs text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Receipt Feed */}
      <div
        className={`space-y-2 overflow-y-auto pr-0.5 ${
          compact ? "max-h-[420px]" : "max-h-[520px]"
        }`}
      >
        {loading && mergedReceipts.length === 0 ? (
          <div className="rounded-xl border border-neutral-900/10 p-5 text-center font-mono text-xs text-neutral-500 dark:border-white/10">
            Decrypting recent Walrus Mainnet blobs and verifying Ed25519 delegate signers...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-neutral-900/10 p-5 text-center font-sans text-xs text-neutral-500 dark:border-white/10">
            No matching activity blobs recorded in{" "}
            <code className="font-mono font-bold">{config.namespace}</code> yet.
          </div>
        ) : (
          filtered.map((item) => {
            const badge = actionBadgeStyle(item.action);
            const realWalrusBlob =
              isVerifiedWalrusBlobId(item.blobId) &&
              !FALLBACK_WALRUS_BLOBS_SET.has(item.blobId);

            return (
              <div
                key={item.id}
                data-testid="agent-activity-receipt-row"
                className="rounded-xl border border-neutral-900/10 bg-white p-3 transition hover:border-neutral-900/20 dark:border-white/10 dark:bg-neutral-900/75"
              >
                {/* Row 1: Action + Agent + Timestamp */}
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[9.5px] font-extrabold ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                    <span className="rounded-full bg-neutral-900/[0.06] px-2 py-0.5 font-mono text-[10px] font-bold text-neutral-800 dark:bg-white/10 dark:text-neutral-200">
                      {item.agent}
                    </span>
                    {item.diffStat && (
                      <span className="font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                        {item.diffStat}
                      </span>
                    )}
                  </div>
                  <span
                    title={item.createdAt}
                    className="font-mono text-[10px] text-neutral-500 dark:text-neutral-400"
                  >
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </div>

                {/* Row 2: Target + Summary + Trigger */}
                <div className="mt-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-[10.5px] text-neutral-500">
                      Target:
                    </span>
                    {onSelectSkill && item.target !== item.namespace ? (
                      <button
                        type="button"
                        onClick={() => onSelectSkill(item.target)}
                        className="cursor-pointer font-mono text-[11px] font-bold text-emerald-700 underline decoration-emerald-500/40 underline-offset-2 hover:decoration-emerald-500 dark:text-emerald-300"
                      >
                        {item.target}
                      </button>
                    ) : (
                      <span className="font-mono text-[11px] font-bold text-neutral-900 dark:text-white">
                        {item.target}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 font-sans text-xs font-medium leading-snug text-neutral-900 dark:text-neutral-100">
                    {item.summary}
                  </p>
                  {item.trigger && (
                    <p className="mt-0.5 line-clamp-1 font-mono text-[10.5px] text-neutral-500 dark:text-neutral-400">
                      Trigger: {item.trigger}
                    </p>
                  )}
                </div>

                {/* Row 3: Cryptographic Signer & Walruscan Proof Footer */}
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-900/8 pt-2 font-mono text-[10px] dark:border-white/8">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <ShieldCheck
                      className={`size-3.5 ${
                        item.signerVerified
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-neutral-400"
                      }`}
                    />
                    <span className="font-bold text-neutral-800 dark:text-neutral-200">
                      {item.authorHandle}
                    </span>
                    {item.signerSuiAddress ? (
                      <a
                        href={`https://suiscan.xyz/mainnet/account/${item.signerSuiAddress}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 underline decoration-emerald-500/40 underline-offset-2 dark:text-emerald-300"
                        title={`Ed25519 agent_id pubkey: ${item.signerPublicKeyHex || ""}`}
                      >
                        Signer {item.signerSuiAddress.slice(0, 6)}…
                        {item.signerSuiAddress.slice(-4)} ↗
                      </a>
                    ) : item.signerPublicKeyHex ? (
                      <span className="text-neutral-500">
                        PubKey {item.signerPublicKeyHex.slice(0, 8)}…
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {typeof item.sizeBytes === "number" && item.sizeBytes > 0 && (
                      <span className="text-neutral-500">
                        {(item.sizeBytes / 1024).toFixed(1)} KB
                        {item.endEpoch ? ` · Ep ${item.endEpoch}` : ""}
                      </span>
                    )}
                    {realWalrusBlob ? (
                      <>
                        <a
                          href={`https://walruscan.com/mainnet/blob/${item.blobId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rb-badge-mint inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold no-underline"
                        >
                          <span>Blob {item.blobId.slice(0, 8)}…</span>
                          <ExternalLink className="size-2.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => copyBlobId(item.blobId)}
                          className="cursor-pointer rounded px-1 py-0.5 text-neutral-500 hover:bg-neutral-900/5 dark:hover:bg-white/10"
                          title="Copy full Walrus Blob ID"
                        >
                          {copiedBlob === item.blobId ? (
                            <Check className="size-3 text-emerald-600" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </button>
                      </>
                    ) : (
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[9.5px] font-bold text-amber-800 dark:text-amber-300">
                        {item.blobId}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
