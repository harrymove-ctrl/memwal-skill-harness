import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  Copy,
  FolderPlus,
  Loader2,
  RefreshCw,
  Sparkles,
  Terminal,
  X,
} from "lucide-react";
import type {
  AgentActivityReceipt,
  AgentVendorId,
  FlowMemoryNode,
  HostedSkillNode,
  WalrusConnectionConfig,
} from "../types";
import {
  createMemWalClient,
  discoverRemoteNamespaces,
  hasLiveCredentials,
  rememberBulkChunked,
  serializeAgentLogForWalrus,
  serializeFlowMemoryForWalrus,
  serializeSkillForWalrus,
} from "../lib/memwalBridge";
import {
  buildExternalAgentBootstrapPrompt,
  buildExternalAgentSetupCommand,
  COLLECTION_PROMPT_PRESETS,
  type GeneratedSkillCollection,
  generateSkillCollectionFromPrompt,
  sanitizeCollectionSlug,
} from "../lib/skillCollectionGenerator";

interface NewCollectionModalProps {
  open: boolean;
  config: WalrusConnectionConfig;
  existingNamespaces: string[];
  onClose: () => void;
  onCreatedCollection: (payload: {
    namespace: string;
    skills: HostedSkillNode[];
    flows: FlowMemoryNode[];
    receipt?: AgentActivityReceipt;
    unseededExternal?: boolean;
  }) => void;
  onPullNamespaceFromWalrus?: (targetNamespace?: string) => Promise<void> | void;
}

const VENDOR_OPTIONS: Array<{ id: AgentVendorId; label: string }> = [
  { id: "tatum-ai", label: "Tatum AI (ai.tatum.io)" },
  { id: "claude-code", label: "Claude Code" },
  { id: "cursor", label: "Cursor" },
  { id: "codex", label: "Codex" },
  { id: "antigravity", label: "Antigravity" },
  { id: "opencode", label: "OpenCode" },
];

export const NewCollectionModal: React.FC<NewCollectionModalProps> = ({
  open,
  config,
  existingNamespaces,
  onClose,
  onCreatedCollection,
  onPullNamespaceFromWalrus,
}) => {
  const [mode, setMode] = useState<"studio-ai" | "external-agent">("studio-ai");
  const [rawSlug, setRawSlug] = useState("sui-move-security");
  const [goal, setGoal] = useState(COLLECTION_PROMPT_PRESETS[0].goal);
  const [apiKeyInput, setApiKeyInput] = useState(() =>
    typeof window !== "undefined" &&
    typeof window.localStorage?.getItem === "function"
      ? window.localStorage.getItem("memwal_openrouter_api_key") || ""
      : ""
  );
  const [showKeyInput, setShowKeyInput] = useState(false);

  const [preview, setPreview] = useState<GeneratedSkillCollection | null>(null);
  const [status, setStatus] = useState<
    | "idle"
    | "generating"
    | "preview"
    | "pushing"
    | "completed"
    | "listening"
    | "error"
  >("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [createdBlobIds, setCreatedBlobIds] = useState<string[]>([]);

  const [vendor, setVendor] = useState<AgentVendorId>("tatum-ai");
  const [showRawConfig, setShowRawConfig] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [checkingRemote, setCheckingRemote] = useState(false);
  const [detectedRemoteCount, setDetectedRemoteCount] = useState<number | null>(
    null
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const cleanSlug = useMemo(() => sanitizeCollectionSlug(rawSlug), [rawSlug]);
  const alreadyExists = useMemo(
    () =>
      Boolean(cleanSlug) &&
      existingNamespaces.some(
        (ns) => ns.toLowerCase() === cleanSlug.toLowerCase()
      ),
    [cleanSlug, existingNamespaces]
  );

  const setupCmd = useMemo(
    () =>
      buildExternalAgentSetupCommand({
        vendor,
        config,
        namespace: cleanSlug || "new-collection",
      }),
    [vendor, config, cleanSlug]
  );

  const bootstrapPrompt = useMemo(
    () =>
      buildExternalAgentBootstrapPrompt({
        vendor,
        config,
        namespace: cleanSlug || "new-collection",
        goal,
      }),
    [vendor, config, cleanSlug, goal]
  );

  if (!open) return null;

  const copyText = (id: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedId(id);
    setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1800);
  };

  const handleGeneratePreview = async () => {
    if (!cleanSlug) {
      setStatus("error");
      setStatusMessage("Enter a collection slug (for example: sui-move-security).");
      return;
    }
    setStatus("generating");
    setStatusMessage("Synthesizing SKILL.md playbooks and starter rules...");
    if (
      typeof window !== "undefined" &&
      typeof window.localStorage?.setItem === "function" &&
      apiKeyInput.trim()
    ) {
      window.localStorage.setItem(
        "memwal_openrouter_api_key",
        apiKeyInput.trim()
      );
    }
    try {
      const generated = await generateSkillCollectionFromPrompt({
        namespace: cleanSlug,
        goal,
        authorHandle: config.memberHandle || "@harrymove-ctrl",
        apiKey: apiKeyInput,
      });
      setPreview(generated);
      setStatus("preview");
      setStatusMessage(
        generated.engineUsed === "live-llm"
          ? `Generated ${generated.skills.length} SKILL.md playbooks + ${generated.flows.length} rules with Live AI.`
          : `Prepared ${generated.skills.length} domain-tailored SKILL.md playbooks + ${generated.flows.length} rules.`
      );
    } catch (err) {
      setStatus("error");
      setStatusMessage(
        err instanceof Error ? err.message : "Failed to generate skill preview."
      );
    }
  };

  const handleCreateAndPushStudio = async () => {
    if (!cleanSlug) return;
    setStatus("pushing");
    setStatusMessage(
      `Encrypting & pushing collection "${cleanSlug}" to Walrus Mainnet...`
    );

    try {
      const collection =
        preview && preview.namespace === cleanSlug
          ? preview
          : await generateSkillCollectionFromPrompt({
              namespace: cleanSlug,
              goal,
              authorHandle: config.memberHandle || "@harrymove-ctrl",
              apiKey: apiKeyInput,
            });

      const author = config.memberHandle || "@harrymove-ctrl";
      const agentName =
        collection.engineUsed === "live-llm" ? "web-studio-ai" : "web-studio";
      const diffStat = `+${collection.skills.length} SKILL.md, +${collection.flows.length} rules`;
      const logSummary = `Created collection "${cleanSlug}" with ${collection.skills.length} playbooks (${collection.skills
        .map((s) => s.name)
        .join(", ")}) and ${collection.flows.length} team rules.`;

      let resolvedBlobs: string[] = [];
      let receiptBlobId = `pending_alog_${cleanSlug}`;

      if (hasLiveCredentials(config)) {
        const client = createMemWalClient({ ...config, namespace: cleanSlug });
        const bulkItems = [
          ...collection.skills.map((s) => ({
            text: serializeSkillForWalrus(s),
            namespace: cleanSlug,
          })),
          ...collection.flows.map((f) => ({
            text: serializeFlowMemoryForWalrus(f),
            namespace: cleanSlug,
          })),
          {
            text: serializeAgentLogForWalrus({
              action: "CREATE_NAMESPACE",
              agent: agentName,
              authorHandle: author,
              target: cleanSlug,
              trigger: collection.goal,
              summary: logSummary,
              relatedSkills: collection.skills.map((s) => s.id),
              diffStat,
            }),
            namespace: cleanSlug,
          },
        ];

        const accepted = await rememberBulkChunked(client, bulkItems, 20);
        const jobIds = accepted.job_ids || [];

        for (let attempt = 0; attempt < 4 && jobIds.length > 0; attempt += 1) {
          await new Promise((r) => setTimeout(r, 1100));
          try {
            const st = await client.getRememberBulkStatus(jobIds);
            const jobs = Array.isArray(st?.results) ? st.results : [];
            const found = jobs
              .map((j) => j.blob_id)
              .filter((b): b is string => Boolean(b && b.length >= 20));
            if (found.length > 0) {
              resolvedBlobs = found;
            }
            if (
              jobs.length > 0 &&
              jobs.every((j) => j.status === "done" || j.status === "failed")
            ) {
              const jobsByIdx = jobs.map((j) => j.blob_id || "");
              collection.skills = collection.skills.map((s, idx) => ({
                ...s,
                blobId: jobsByIdx[idx] || s.blobId,
              }));
              collection.flows = collection.flows.map((f, idx) => ({
                ...f,
                blobId:
                  jobsByIdx[collection.skills.length + idx] || f.blobId,
              }));
              receiptBlobId =
                jobsByIdx[
                  collection.skills.length + collection.flows.length
                ] ||
                found[found.length - 1] ||
                `job_${jobIds[jobIds.length - 1]?.slice(0, 12)}`;
              break;
            }
          } catch {
            // job still indexing on relayer
          }
        }

        if (
          receiptBlobId.startsWith("pending_") &&
          jobIds.length > 0
        ) {
          receiptBlobId = `job_${jobIds[0].slice(0, 14)}`;
        }
      }

      const receipt: AgentActivityReceipt = {
        id: `alog-local-${Date.now()}`,
        blobId: receiptBlobId,
        namespace: cleanSlug,
        action: "CREATE_NAMESPACE",
        agent: agentName,
        authorHandle: author,
        signerVerified: true,
        target: cleanSlug,
        trigger: collection.goal,
        summary: logSummary,
        relatedSkills: collection.skills.map((s) => s.id),
        relatedBlobs: resolvedBlobs,
        diffStat,
        createdAt: new Date().toISOString(),
        sourceKind: "agent-log",
      };

      setCreatedBlobIds(resolvedBlobs);
      onCreatedCollection({
        namespace: cleanSlug,
        skills: collection.skills,
        flows: collection.flows,
        receipt,
      });
      setStatus("completed");
      setStatusMessage(
        resolvedBlobs.length > 0
          ? `Collection "${cleanSlug}" is live on Walrus Mainnet (${resolvedBlobs.length} verified blobs).`
          : `Collection "${cleanSlug}" created and queued on Walrus Mainnet relayer.`
      );
    } catch (err) {
      setStatus("error");
      setStatusMessage(
        err instanceof Error
          ? err.message
          : "Walrus Mainnet relayer rejected the bulk upload."
      );
    }
  };

  const handleRegisterExternalSlotAndCheck = async () => {
    if (!cleanSlug) return;
    setCheckingRemote(true);
    setStatus("listening");
    try {
      onCreatedCollection({
        namespace: cleanSlug,
        skills: [],
        flows: [],
        unseededExternal: true,
      });
      const remoteList = await discoverRemoteNamespaces(config);
      const hit = remoteList.find(
        (r) => r.name.toLowerCase() === cleanSlug.toLowerCase()
      );
      if (hit && hit.memoryCount > 0) {
        setDetectedRemoteCount(hit.memoryCount);
        await onPullNamespaceFromWalrus?.(cleanSlug);
        setStatus("completed");
        setStatusMessage(
          `Detected ${hit.memoryCount} live agent blob(s) in "${cleanSlug}" and synced into workspace.`
        );
      } else {
        setDetectedRemoteCount(0);
        setStatusMessage(
          `Slot "${cleanSlug}" is ready. Paste the prompt into ${vendor} and click "Check Relayer Now" once your agent finishes uploading.`
        );
      }
    } finally {
      setCheckingRemote(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Create New Skill Collection or Namespace"
      data-testid="new-collection-modal"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/65 p-3 backdrop-blur-md sm:p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="my-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white text-neutral-900 shadow-2xl sm:max-h-[calc(100dvh-2.5rem)] dark:border-white/14 dark:bg-[#0e1513] dark:text-neutral-100">
        {/* Sticky Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-neutral-200/80 bg-neutral-50/70 px-5 py-3.5 dark:border-white/10 dark:bg-white/[0.02]">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="rb-badge-mint inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[10.5px] font-bold">
                <FolderPlus className="size-3" />
                <span>New Skill Folder</span>
              </span>
            </div>
            <h2 className="mt-1 font-sans text-lg font-extrabold tracking-tight text-neutral-950 dark:text-white">
              Create Skill Folder
            </h2>
            <p className="mt-0.5 font-sans text-xs text-neutral-600 dark:text-neutral-400">
              Generate tailored <code className="font-mono">SKILL.md</code> guides and Team Rules in the browser or run one unified prompt in Tatum AI / your coding agent.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 dark:border-white/14 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 space-y-3.5 overflow-y-auto px-5 py-4">
          {/* Mode Switcher */}
          <div className="grid grid-cols-1 gap-1 rounded-xl border border-neutral-200/80 bg-neutral-100/90 p-1 sm:grid-cols-2 dark:border-white/10 dark:bg-neutral-900/90">
            <button
              type="button"
              data-testid="new-collection-mode-studio"
              onClick={() => {
                setMode("studio-ai");
                setStatus("idle");
              }}
              className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 font-sans text-xs font-bold transition ${
                mode === "studio-ai"
                  ? "rb-pill-active shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
              }`}
            >
              <Sparkles className="size-3.5 shrink-0" />
              <span>1. Generate in Browser (Instant)</span>
            </button>
            <button
              type="button"
              data-testid="new-collection-mode-external"
              onClick={() => {
                setMode("external-agent");
                setStatus("idle");
              }}
              className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 font-sans text-xs font-bold transition ${
                mode === "external-agent"
                  ? "rb-pill-active shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
              }`}
            >
              <Terminal className="size-3.5 shrink-0" />
              <span>2. One-Shot Agent Prompt (Tatum AI / MCP)</span>
            </button>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[10.5px] font-semibold text-neutral-600 dark:text-neutral-300">
              Presets:
            </span>
            {COLLECTION_PROMPT_PRESETS.map((preset) => (
              <button
                key={preset.slug}
                type="button"
                onClick={() => {
                  setRawSlug(preset.slug);
                  setGoal(preset.goal);
                  setPreview(null);
                  setStatus("idle");
                }}
                className={`cursor-pointer rounded-lg border px-2.5 py-1 font-mono text-[10.5px] font-bold transition ${
                  cleanSlug === preset.slug
                    ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-900 dark:border-emerald-400/50 dark:bg-emerald-400/15 dark:text-emerald-200"
                    : "border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100 dark:border-white/12 dark:bg-neutral-900/70 dark:text-neutral-300 dark:hover:bg-white/10"
                }`}
              >
                {preset.slug}
              </button>
            ))}
          </div>

          {/* Shared Slug & Goal Inputs */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
            <div className="sm:col-span-5">
              <label className="block font-mono text-[11px] font-bold text-neutral-700 dark:text-neutral-200">
                Folder Slug
              </label>
              <input
                type="text"
                data-testid="new-collection-slug-input"
                value={rawSlug}
                onChange={(e) => {
                  setRawSlug(e.target.value);
                  setPreview(null);
                }}
                placeholder="sui-move-security"
                className="mt-1 h-9 w-full rounded-xl border border-neutral-300 bg-white px-3 font-mono text-xs font-bold text-neutral-900 outline-none focus:border-emerald-500 dark:border-white/15 dark:bg-neutral-900 dark:text-white"
              />
              <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1 font-mono text-[10.5px]">
                <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
                  MEMWAL_NAMESPACE={cleanSlug || "..."}
                </span>
                {alreadyExists && (
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    Exists (adds to folder)
                  </span>
                )}
              </div>
            </div>

            <div className="sm:col-span-7">
              <label className="block font-mono text-[11px] font-bold text-neutral-700 dark:text-neutral-200">
                Folder Goal (What this folder teaches AI agents)
              </label>
              <textarea
                rows={2}
                data-testid="new-collection-goal-input"
                value={goal}
                onChange={(e) => {
                  setGoal(e.target.value);
                  setPreview(null);
                }}
                placeholder="Describe what skills and guardrails this collection enforces..."
                className="mt-1 w-full resize-none rounded-xl border border-neutral-300 bg-white px-3 py-2 font-sans text-xs leading-relaxed text-neutral-900 outline-none focus:border-emerald-500 dark:border-white/15 dark:bg-neutral-900 dark:text-white"
              />
            </div>
          </div>

          {mode === "studio-ai" ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-200/80 bg-neutral-50 px-3.5 py-2.5 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="font-sans text-xs text-neutral-700 dark:text-neutral-300">
                  <span className="font-bold">Engine:</span>{" "}
                  {apiKeyInput.trim().length >= 20
                    ? "Live OpenRouter / OpenAI LLM"
                    : "Instant Domain Blueprint (No API Key Required)"}
                </div>
                <button
                  type="button"
                  onClick={() => setShowKeyInput((v) => !v)}
                  className="cursor-pointer font-mono text-[11px] font-bold text-emerald-700 underline underline-offset-2 dark:text-emerald-300"
                >
                  {showKeyInput ? "Hide LLM Key" : "Optional OpenRouter/OpenAI Key"}
                </button>
              </div>

              {showKeyInput && (
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="sk-or-v1-... or sk-... (stored locally in browser only)"
                  className="h-9 w-full rounded-xl border border-neutral-300 bg-white px-3 font-mono text-xs text-neutral-900 outline-none dark:border-white/15 dark:bg-neutral-900 dark:text-white"
                />
              )}

              {preview && (
                <div
                  data-testid="new-collection-preview"
                  className="space-y-2 rounded-xl border border-neutral-200 bg-neutral-50/70 p-3 dark:border-white/12 dark:bg-neutral-900/70"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-neutral-800 dark:text-neutral-200">
                      Generated Preview: {preview.skills.length} SKILL.md +{" "}
                      {preview.flows.length} Team Rules
                    </span>
                    <span className="rb-badge-mint rounded-full px-2 py-0.5 font-mono text-[10px] font-bold">
                      +1 [AGENT_LOG] Receipt
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {preview.skills.map((s) => (
                      <div
                        key={s.id}
                        className="rounded-xl border border-neutral-200/80 bg-white p-2.5 dark:border-white/10 dark:bg-neutral-950/60"
                      >
                        <div className="truncate font-mono text-[11px] font-bold text-neutral-900 dark:text-white">
                          {s.name}/SKILL.md
                        </div>
                        <div className="mt-0.5 line-clamp-2 font-sans text-[11px] text-neutral-600 dark:text-neutral-400">
                          {s.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Target Agent Selector */}
              <div className="flex flex-wrap items-center gap-1.5">
                {VENDOR_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setVendor(opt.id)}
                    className={`h-8 cursor-pointer rounded-lg px-3 font-sans text-xs font-bold transition ${
                      vendor === opt.id
                        ? "rb-pill-active shadow-2xs"
                        : "border border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100 dark:border-white/12 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Unified One-Shot Prompt Card */}
              <div className="rounded-xl border border-emerald-500/30 bg-neutral-50/90 p-3.5 dark:border-emerald-500/25 dark:bg-neutral-900/90">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center rounded-md bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                        1-SHOT PROMPT
                      </span>
                      <span className="font-mono text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        Paste into{" "}
                        {VENDOR_OPTIONS.find((v) => v.id === vendor)?.label}
                      </span>
                    </div>
                    <p className="mt-0.5 font-sans text-[11px] text-neutral-600 dark:text-neutral-400">
                      Automatically creates folder{" "}
                      <code className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                        {cleanSlug}
                      </code>
                      , generates 3 <code className="font-mono">SKILL.md</code> playbooks + 2 Team Rules, and logs an{" "}
                      <code className="font-mono">[AGENT_LOG]</code> receipt on Walrus Mainnet.
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowRawConfig((v) => !v)}
                      className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 font-mono text-[10.5px] font-semibold whitespace-nowrap text-neutral-700 hover:bg-neutral-100 dark:border-white/14 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    >
                      <span>{showRawConfig ? "Hide Config" : "Raw Config"}</span>
                    </button>
                    <button
                      type="button"
                      data-testid="copy-agent-bootstrap-prompt-btn"
                      onClick={() => copyText("agent-prompt", bootstrapPrompt)}
                      className="rb-btn-primary inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 font-mono text-[11px] font-bold whitespace-nowrap"
                    >
                      {copiedId === "agent-prompt" ? (
                        <Check className="size-3.5 shrink-0" />
                      ) : (
                        <Copy className="size-3.5 shrink-0" />
                      )}
                      <span>
                        {copiedId === "agent-prompt"
                          ? "Copied 1-Shot Prompt!"
                          : "Copy One-Shot Prompt"}
                      </span>
                    </button>
                  </div>
                </div>

                <pre className="mt-2.5 max-h-44 overflow-y-auto rounded-xl border border-neutral-200/80 bg-neutral-950 p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap break-words text-emerald-300 dark:border-white/10">
                  {bootstrapPrompt}
                </pre>

                {showRawConfig && (
                  <div className="mt-2.5 rounded-xl border border-neutral-200 bg-white p-2.5 dark:border-white/10 dark:bg-neutral-950/80">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="font-mono text-[10.5px] font-bold text-neutral-600 dark:text-neutral-300">
                        Scoped Endpoint / MCP Config (MEMWAL_NAMESPACE={cleanSlug})
                      </span>
                      <button
                        type="button"
                        onClick={() => copyText("mcp-cmd", setupCmd)}
                        className="inline-flex h-6 shrink-0 cursor-pointer items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 px-2 font-mono text-[10px] font-bold whitespace-nowrap text-neutral-700 hover:bg-neutral-100 dark:border-white/14 dark:bg-neutral-900 dark:text-neutral-200"
                      >
                        {copiedId === "mcp-cmd" ? (
                          <Check className="size-3" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                        <span>{copiedId === "mcp-cmd" ? "Copied" : "Copy Config"}</span>
                      </button>
                    </div>
                    <pre className="max-h-28 overflow-y-auto rounded-lg bg-neutral-950 p-2.5 font-mono text-[10.5px] leading-relaxed whitespace-pre-wrap break-all text-neutral-200">
                      {setupCmd.replace(
                        config.delegateKey,
                        `${config.delegateKey.slice(0, 8)}...${config.delegateKey.slice(-6)}`
                      )}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {statusMessage && (
            <div
              data-testid="new-collection-status-banner"
              className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 font-sans text-xs font-semibold ${
                status === "error"
                  ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
              }`}
            >
              <span className="min-w-0 flex-1 break-words">{statusMessage}</span>
              <div className="flex shrink-0 items-center gap-2">
                {createdBlobIds[0] && (
                  <a
                    href={`https://walruscan.com/mainnet/blob/${createdBlobIds[0]}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rb-badge-mint rounded-full px-2.5 py-0.5 font-mono text-[10.5px] font-bold whitespace-nowrap no-underline"
                  >
                    Walruscan {createdBlobIds[0].slice(0, 8)}… ↗
                  </a>
                )}
                {status === "completed" && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="rb-pill-active cursor-pointer rounded-lg px-3 py-1 font-mono text-[10.5px] font-bold whitespace-nowrap"
                  >
                    Open Folder →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-neutral-200/80 bg-neutral-50/80 px-5 py-3 dark:border-white/10 dark:bg-white/[0.02]">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 cursor-pointer items-center rounded-xl border border-neutral-200 bg-white px-3.5 font-sans text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100 dark:border-white/14 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>

          {mode === "studio-ai" ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-testid="generate-collection-preview-btn"
                disabled={status === "generating" || status === "pushing"}
                onClick={handleGeneratePreview}
                className="rb-btn-secondary inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl px-3.5 font-sans text-xs font-bold whitespace-nowrap disabled:opacity-50"
              >
                {status === "generating" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                <span>Preview AI Playbooks</span>
              </button>

              <button
                type="button"
                data-testid="push-new-collection-btn"
                disabled={
                  !cleanSlug || status === "generating" || status === "pushing"
                }
                onClick={handleCreateAndPushStudio}
                className="rb-btn-primary inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl px-4 font-sans text-xs font-bold whitespace-nowrap disabled:opacity-50"
              >
                {status === "pushing" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <FolderPlus className="size-3.5" />
                )}
                <span>
                  {status === "pushing"
                    ? "Pushing to Walrus..."
                    : `Create "${cleanSlug || "collection"}" & Push to Walrus`}
                </span>
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="hidden font-mono text-[11px] text-neutral-500 sm:inline dark:text-neutral-400">
                {detectedRemoteCount !== null
                  ? `Relayer: ${detectedRemoteCount} blob(s) in "${cleanSlug}"`
                  : `Auto-creates "${cleanSlug}" slot`}
              </span>
              <button
                type="button"
                data-testid="listen-external-agent-btn"
                disabled={!cleanSlug || checkingRemote}
                onClick={handleRegisterExternalSlotAndCheck}
                className="rb-btn-primary inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl px-4 font-sans text-xs font-bold whitespace-nowrap disabled:opacity-50"
              >
                <RefreshCw
                  className={`size-3.5 ${checkingRemote ? "animate-spin" : ""}`}
                />
                <span>
                  {checkingRemote
                    ? "Checking Relayer..."
                    : `Create "${cleanSlug}" Slot & Check Relayer`}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
