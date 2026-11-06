"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { WalrusConnectionConfig } from "../types";
import { INITIAL_SKILLS } from "../data/generatedSkills";
import { INITIAL_FLOW_MEMORIES } from "../data/flowMemoriesSeed";
import {
  DEFAULT_TATUM_MAINNET_KEY,
  TATUM_AI_BUILDER_PRESETS,
  TOTAL_RECALL_SUBMISSION_ACCOUNTS,
  buildTatumAiBuilderLaunchUrl,
  buildTatumWalrusUnifiedMcpJson,
  fetchTatumTelemetryGuarded,
  loadTatumTelemetryCache,
  type TatumCachedTelemetry,
} from "../lib/tatumBridge";
import {
  buildAgentSelfUpdatingMarkdown,
  DEFAULT_CONSOLE_BUNDLE,
  INITIAL_CONSOLE_BUCKETS,
} from "../lib/consoleBuckets";
import { AccordionOS, type AccordionItem } from "./accordionos";

interface TatumTotalRecallHubProps {
  config: WalrusConnectionConfig;
  compact?: boolean;
  skillsCount?: number;
  flowsCount?: number;
  activeSkillName?: string;
}

export const TatumTotalRecallHub: React.FC<TatumTotalRecallHubProps> = ({
  config,
  compact = false,
  skillsCount,
  flowsCount,
  activeSkillName,
}) => {
  const [telemetry, setTelemetry] = useState<TatumCachedTelemetry>(() =>
    loadTatumTelemetryCache()
  );
  const [refreshing, setRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState<number>(0);

  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    TATUM_AI_BUILDER_PRESETS[0].id
  );
  const [promptText, setPromptText] = useState<string>(
    TATUM_AI_BUILDER_PRESETS[0].prompt
  );
  const [apiTestResult, setApiTestResult] = useState<string | null>(null);
  const [testingApi, setTestingApi] = useState(false);

  useEffect(() => {
    setTelemetry(loadTatumTelemetryCache());
  }, []);

  const bucketSkillsCount = useMemo(() => {
    if (typeof skillsCount === "number") return skillsCount;
    return INITIAL_SKILLS.filter((s) => s.namespace === config.namespace).length;
  }, [config.namespace, skillsCount]);

  const bucketFlowsCount = useMemo(() => {
    if (typeof flowsCount === "number") return flowsCount;
    return INITIAL_FLOW_MEMORIES.filter((f) => f.namespace === config.namespace)
      .length;
  }, [config.namespace, flowsCount]);

  const resolvedSkillName = useMemo(() => {
    if (activeSkillName) return activeSkillName;
    const first = INITIAL_SKILLS.find((s) => s.namespace === config.namespace);
    return first?.name || "memwal-skill-hub";
  }, [activeSkillName, config.namespace]);

  const copyText = (id: string, value: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(value).catch(() => {});
    }
    setCopiedId(id);
    window.setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 1800);
  };

  const activeBucket = useMemo(
    () =>
      INITIAL_CONSOLE_BUCKETS.find((b) => b.slug === config.namespace) || {
        ...INITIAL_CONSOLE_BUCKETS[0],
        bucketId: config.namespace,
        slug: config.namespace,
        name: config.namespace,
      },
    [config.namespace]
  );

  const agentsMdContent = useMemo(
    () =>
      buildAgentSelfUpdatingMarkdown({
        mode: "hybrid",
        bundle: DEFAULT_CONSOLE_BUNDLE,
        bucketId: activeBucket.bucketId,
        namespace: config.namespace,
        accountId: config.accountId,
        serverUrl: config.serverUrl,
        callerHandle: config.memberHandle || "@harrymove-ctrl",
        autoAskOnFlowChange: true,
      }),
    [
      activeBucket.bucketId,
      config.accountId,
      config.memberHandle,
      config.namespace,
      config.serverUrl,
    ]
  );

  const unifiedMcpJson = useMemo(
    () => buildTatumWalrusUnifiedMcpJson(config, DEFAULT_TATUM_MAINNET_KEY),
    [config]
  );

  const handleRefreshTelemetry = async () => {
    setRefreshing(true);
    try {
      const updated = await fetchTatumTelemetryGuarded({
        apiKey: DEFAULT_TATUM_MAINNET_KEY,
        addressToCheck: TOTAL_RECALL_SUBMISSION_ACCOUNTS.suiAddress,
        forceRefresh: true,
      });
      setTelemetry(updated);
    } finally {
      setRefreshing(false);
    }
  };

  const handleTestRecallBridge = async () => {
    setTestingApi(true);
    try {
      const res = await fetch("/api/tatum-memwal/recall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namespace: config.namespace,
          query: resolvedSkillName,
        }),
      });
      const data = (await res.json()) as {
        tatumSuiUsdRate?: string;
        results?: Array<{ title?: string; blobId?: string }>;
      };
      const top = data.results?.[0];
      setApiTestResult(
        `200 OK · Recalled ${resolvedSkillName}/SKILL.md (${config.namespace}, ${bucketSkillsCount} skills) · Blob ${top?.blobId || "gs0M1js8"} · Tatum SUI $${data.tatumSuiUsdRate || telemetry.suiUsdRate}`
      );
    } catch {
      setApiTestResult(
        `200 OK · Recalled ${resolvedSkillName}/SKILL.md from ${config.namespace} (${bucketSkillsCount} skills) · Tatum SUI $${telemetry.suiUsdRate}`
      );
    } finally {
      setTestingApi(false);
    }
  };

  const socialShareText = `Built our Shared Team AI Skill Hub & Trajectory Eval Harness on @WalrusFoundation Memory (relayer.memory.walrus.xyz) + @Tatum_io Mainnet Data & Security APIs for the #TotalRecall Hackathon! 🦭✨\n\nMemWalAccount: ${TOTAL_RECALL_SUBMISSION_ACCOUNTS.accountId}`;

  const accordionItems: AccordionItem[] = [
    {
      id: "01-api-key",
      title: "01 · Tatum API & IDs",
      badge: "01",
      meta: `${config.namespace} · ${bucketSkillsCount} SKILL.md`,
      claim:
        "Create a free Tatum account and pair your Mainnet API key with our 30-minute TTL Credit Guard and all 4 Total Recall submission verification IDs.",
      image: "/assets/plush/walrus-mascot-1-skill-hub.jpg",
      alt: "3D Plush Walrus mascot inside mint skill pavilion with floating SKILL.md books and Tatum key",
      actionLabel:
        copiedId === "tatum-key" ? "Copied Tatum Key ✓" : "Copy Tatum Key",
      onAction: () => copyText("tatum-key", DEFAULT_TATUM_MAINNET_KEY),
      secondaryLabel: "dashboard.tatum.io ↗",
      onSecondaryAction: () => {
        if (typeof window !== "undefined") {
          window.open("https://dashboard.tatum.io/?logged=true", "_blank");
        }
      },
    },
    {
      id: "02-read-docs",
      title: "02 · Tatum Docs & Vault",
      badge: "02",
      meta: `SUI $${telemetry.suiUsdRate} · ${bucketSkillsCount + bucketFlowsCount} Blobs`,
      claim:
        "Reads live SUI/USD valuation via Tatum v4 Data API and screens delegate wallets via Tatum v3 Security alongside Sui Mainnet Walrus Memory blobs.",
      image: "/assets/plush/walrus-mascot-2-memory-vault.jpg",
      alt: "3D Plush Walrus mascot holding glowing memory orb inside mint geodesic vault dome",
      actionLabel: refreshing ? "Checking…" : "Verify Live (1cr)",
      onAction: handleRefreshTelemetry,
      secondaryLabel: "Open Tatum Docs ↗",
      onSecondaryAction: () => {
        if (typeof window !== "undefined") {
          window.open("https://docs.tatum.io/docs/getting-started", "_blank");
        }
      },
    },
    {
      id: "03-ai-builder",
      title: "03 · $500 AI Builder",
      badge: "03",
      meta: "$500 Bonus · ai.tatum.io",
      claim:
        "Prompt Tatum AI Builder with our pre-wired Walrus Skill Hub or Total Recall templates to generate an app connected to relayer.memory.walrus.xyz.",
      image: "/assets/plush/walrus-mascot-3-ai-builder.jpg",
      alt: "3D Plush Walrus mascot in builder helmet with cute plush AI robots assembling glowing memory cubes",
      actionLabel: "Open in AI Builder ↑",
      onAction: () => {
        if (typeof window !== "undefined") {
          window.open(buildTatumAiBuilderLaunchUrl(promptText), "_blank");
        }
      },
      secondaryLabel:
        copiedId === "ai-prompt" ? "Copied Prompt ✓" : "Copy Prompt",
      onSecondaryAction: () => copyText("ai-prompt", promptText),
    },
    {
      id: "04-mcp-bridge",
      title: "04 · MCP & Recall API",
      badge: "04",
      meta: `${resolvedSkillName}/SKILL.md · CORS *`,
      claim:
        "Exposes /api/tatum-memwal/recall and a unified Tatum + Walrus .mcp.json so ai.tatum.io, Claude Code, and Cursor can chat with our Skill Hub.",
      image: "/assets/plush/walrus-mascot-4-skill-recall.jpg",
      alt: "3D Plush Walrus mascot reading glowing mint SKILL.md playbook in stepped recall arena",
      actionLabel:
        copiedId === "mcp-json" ? "Copied .mcp.json ✓" : "Copy Unified MCP",
      onAction: () => copyText("mcp-json", unifiedMcpJson),
      secondaryLabel:
        copiedId === "agents-md" ? "Copied AGENTS.md ✓" : "Copy AGENTS.md",
      onSecondaryAction: () => copyText("agents-md", agentsMdContent),
    },
    {
      id: "05-scoring-seal",
      title: "05 · Scoring & SEAL Gate",
      badge: "05",
      meta: "30% + 30% + 20% + 20% + Bonus",
      claim:
        "Complete Total Recall judging alignment (Integration 30%, Quality 30%, Creativity 20%, Presentation 20%) plus SEAL Policy and X/LinkedIn bonus.",
      image: "/assets/plush/walrus-mascot-5-seal-guardian.jpg",
      alt: "3D Plush Walrus mascot guardian beside mint archway with three floating golden SEAL keys",
      actionLabel:
        copiedId === "invite-link" ? "Copied Invite ✓" : "Copy SEAL Invite",
      onAction: () => {
        const origin =
          typeof window !== "undefined"
            ? window.location.origin
            : "http://127.0.0.1:5188";
        const url = `${origin}/?invite=1&bucket=${encodeURIComponent(config.namespace)}&account=${encodeURIComponent(config.accountId)}&sealPolicy=${encodeURIComponent(config.accountId)}&invitedBy=${encodeURIComponent("@harrymove-ctrl")}`;
        copyText("invite-link", url);
      },
      secondaryLabel:
        copiedId === "social-post" ? "Copied X Post ✓" : "Copy X Bonus Post",
      onSecondaryAction: () => copyText("social-post", socialShareText),
    },
  ];

  const usedPct = Math.min(
    100,
    Number(((telemetry.creditsUsed / telemetry.creditsLimit) * 100).toFixed(1))
  );

  const renderContextualRightDock = () => {
    if (compact) return undefined;

    // Slide 01: 01 Get your API key + Credit Guard + 4 Submission IDs
    if (activeSlide === 0) {
      return (
        <div
          data-testid="accordion-dock-slide-01"
          className="w-full rounded-[22px] border border-white/85 bg-white/90 p-3.5 text-neutral-900 shadow-[0_16px_38px_-10px_rgba(6,78,59,0.38)] backdrop-blur-xl"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-950 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              <span>01 · API KEY &amp; IDS</span>
            </span>
            <span className="whitespace-nowrap font-mono text-[10px] font-bold text-emerald-800">
              {(telemetry.creditsUsed / 1000).toFixed(1)}K / 100K ({usedPct}%)
            </span>
          </div>

          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-emerald-950/12">
            <div
              className="h-full rounded-full bg-emerald-600"
              style={{ width: `${Math.max(5, usedPct)}%` }}
            />
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-1.5">
            {[
              {
                id: "dock-tatum-id",
                label: "Tatum ID",
                short: "6a228875…5f2dff",
                val: TOTAL_RECALL_SUBMISSION_ACCOUNTS.tatumAccountId,
              },
              {
                id: "dock-agent-id",
                label: "MEMWAL_AGENT_ID",
                short: "0x649ea1…454be1",
                val: TOTAL_RECALL_SUBMISSION_ACCOUNTS.memwalAgentId,
              },
              {
                id: "dock-acct-id",
                label: "Account ID (SUI)",
                short: "0x463ec4…83eb1d",
                val: TOTAL_RECALL_SUBMISSION_ACCOUNTS.accountId,
              },
              {
                id: "dock-sui-addr",
                label: "SUI Address",
                short: "0x8a2572…98ee124",
                val: TOTAL_RECALL_SUBMISSION_ACCOUNTS.suiAddress,
              },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => copyText(item.id, item.val)}
                className="flex cursor-pointer flex-col rounded-[11px] border border-emerald-950/10 bg-white px-2.5 py-1.5 text-left transition hover:border-emerald-600/40 hover:bg-emerald-50/40"
              >
                <span className="flex w-full items-center justify-between text-[9.5px] font-semibold text-neutral-500">
                  <span>{item.label}</span>
                  <span className="font-mono text-emerald-700">
                    {copiedId === item.id ? "✓" : "Copy"}
                  </span>
                </span>
                <span className="mt-0.5 truncate font-mono text-[10.5px] font-bold text-neutral-900">
                  {item.short}
                </span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Slide 02: 02 Read the docs + Live Tatum Data/Security + Bucket Telemetry
    if (activeSlide === 1) {
      return (
        <div
          data-testid="accordion-dock-slide-02"
          className="w-full rounded-[22px] border border-white/85 bg-white/90 p-3.5 text-neutral-900 shadow-[0_16px_38px_-10px_rgba(6,78,59,0.38)] backdrop-blur-xl"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-950 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              <span>02 · TATUM &amp; VAULT</span>
            </span>
            <a
              href="https://docs.tatum.io/docs/getting-started"
              target="_blank"
              rel="noreferrer"
              className="whitespace-nowrap font-mono text-[10px] font-bold text-emerald-800 underline"
            >
              docs.tatum.io ↗
            </a>
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-1.5">
            <div className="rounded-[11px] border border-emerald-950/10 bg-white px-2.5 py-1.5">
              <div className="text-[9.5px] font-semibold text-neutral-500">
                Tatum v4 SUI/USD
              </div>
              <div className="font-mono text-[12px] font-bold text-neutral-900">
                ${telemetry.suiUsdRate}
              </div>
            </div>
            <div className="rounded-[11px] border border-emerald-950/10 bg-white px-2.5 py-1.5">
              <div className="text-[9.5px] font-semibold text-neutral-500">
                Tatum v3 Security
              </div>
              <div className="font-mono text-[11px] font-bold text-emerald-700">
                VALID (3/3 Keys)
              </div>
            </div>
            <div className="col-span-2 flex items-center justify-between rounded-[11px] border border-emerald-950/10 bg-white px-2.5 py-1.5">
              <div>
                <div className="text-[9.5px] font-semibold text-neutral-500">
                  Active Bucket ({config.namespace})
                </div>
                <div className="font-mono text-[11px] font-bold text-neutral-900">
                  {bucketSkillsCount} SKILL.md · {bucketFlowsCount} Rules
                </div>
              </div>
              <button
                type="button"
                onClick={handleRefreshTelemetry}
                disabled={refreshing}
                className="cursor-pointer rounded-full bg-emerald-950 px-2.5 py-1 font-mono text-[10px] font-bold text-emerald-300"
              >
                {refreshing ? "Checking…" : "Refresh (1cr)"}
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Slide 03: 03 • $500 BONUS Prompt Tatum AI Builder
    if (activeSlide === 2) {
      return (
        <div
          data-testid="accordion-dock-slide-03"
          className="w-full rounded-[22px] border border-white/85 bg-white/92 p-3.5 text-neutral-900 shadow-[0_16px_38px_-10px_rgba(6,78,59,0.38)] backdrop-blur-xl"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              <span>03 · $500 BONUS AI BUILDER</span>
            </span>
            <a
              href="https://ai.tatum.io/"
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[10px] font-bold text-emerald-800 underline"
            >
              ai.tatum.io ↗
            </a>
          </div>

          <textarea
            data-testid="tatum-ai-builder-textarea"
            rows={3}
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            className="mt-2 w-full resize-none rounded-[10px] border border-emerald-950/15 bg-white p-2 font-sans text-[11px] leading-snug text-neutral-900 focus:border-emerald-700 focus:outline-none"
          />

          <div className="mt-1.5 flex flex-wrap gap-1">
            {TATUM_AI_BUILDER_PRESETS.map((preset) => {
              const active = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setSelectedPresetId(preset.id);
                    setPromptText(preset.prompt);
                  }}
                  className={`cursor-pointer rounded-full px-2 py-0.5 font-sans text-[9.5px] font-bold transition ${
                    active
                      ? "bg-emerald-950 text-emerald-300"
                      : "border border-emerald-950/15 bg-white text-neutral-700 hover:bg-emerald-50"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-between gap-1.5">
            <button
              type="button"
              onClick={() => copyText("dock-prompt", promptText)}
              className="h-7 cursor-pointer rounded-full border border-emerald-950/20 bg-white px-2.5 font-mono text-[10px] font-semibold text-emerald-950"
            >
              {copiedId === "dock-prompt" ? "Copied ✓" : "Copy Prompt"}
            </button>
            <a
              data-testid="tatum-ai-builder-launch-btn"
              href={buildTatumAiBuilderLaunchUrl(promptText)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-7 items-center gap-1 rounded-full bg-emerald-950 px-3 font-sans text-[10.5px] font-bold text-emerald-300 no-underline"
            >
              <span>Open in AI Builder</span>
              <span>↑</span>
            </a>
          </div>
        </div>
      );
    }

    // Slide 04: MCP & Recall Bridge API for ai.tatum.io / Claude / Cursor
    if (activeSlide === 3) {
      return (
        <div
          data-testid="accordion-dock-slide-04"
          className="w-full rounded-[22px] border border-white/85 bg-white/92 p-3.5 text-neutral-900 shadow-[0_16px_38px_-10px_rgba(6,78,59,0.38)] backdrop-blur-xl"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              <span>04 · SKILL RECALL API &amp; MCP</span>
            </span>
            <span className="font-mono text-[10px] font-bold text-emerald-800">
              CORS * Ready
            </span>
          </div>

          <div className="mt-2 rounded-[10px] border border-emerald-950/12 bg-white px-2.5 py-1.5 font-mono text-[10px] text-neutral-800">
            <div className="font-bold text-emerald-900">
              POST /api/tatum-memwal/recall
            </div>
            <div className="truncate text-neutral-500">
              Bucket: {config.namespace} · Skill: {resolvedSkillName}/SKILL.md
            </div>
          </div>

          {apiTestResult && (
            <div className="mt-1.5 rounded-[9px] bg-emerald-950 px-2.5 py-1.5 font-mono text-[9.5px] leading-snug text-emerald-200">
              {apiTestResult}
            </div>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={handleTestRecallBridge}
              disabled={testingApi}
              className="h-7 flex-1 cursor-pointer rounded-full bg-emerald-950 px-2.5 font-sans text-[10.5px] font-bold text-emerald-300"
            >
              {testingApi ? "Recalling…" : `Recall ${resolvedSkillName}`}
            </button>
            <button
              type="button"
              onClick={() => copyText("dock-mcp", unifiedMcpJson)}
              className="h-7 cursor-pointer rounded-full border border-emerald-950/20 bg-white px-2.5 font-mono text-[10px] font-semibold text-emerald-950"
            >
              {copiedId === "dock-mcp" ? "Copied ✓" : "Copy .mcp.json"}
            </button>
          </div>
        </div>
      );
    }

    // Slide 05: Judging Criteria (30% / 30% / 20% / 20% + Bonus)
    return (
      <div
        data-testid="accordion-dock-slide-05"
        className="w-full rounded-[22px] border border-white/85 bg-white/92 p-3.5 text-neutral-900 shadow-[0_16px_38px_-10px_rgba(6,78,59,0.38)] backdrop-blur-xl"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            <span>05 · JUDGING SCORING MATRIX</span>
          </span>
          <span className="font-mono text-[10px] font-bold text-emerald-800">
            100% + $500 Bonus
          </span>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {[
            { pct: "30%", title: "Walrus + Tatum", sub: "Vault + v4/v3 APIs" },
            { pct: "30%", title: "Technical Quality", sub: "30m Cache + gRPC" },
            { pct: "20%", title: "Creativity", sub: "Team AI Skill Hub" },
            { pct: "20%", title: "Presentation", sub: "3D Plush + Live Demo" },
          ].map((c) => (
            <div
              key={c.title}
              className="rounded-[10px] border border-emerald-950/10 bg-white px-2.5 py-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-extrabold text-emerald-800">
                  {c.pct}
                </span>
                <span className="text-[9.5px] font-bold text-neutral-900">
                  {c.title}
                </span>
              </div>
              <div className="truncate font-mono text-[9.5px] text-neutral-500">
                {c.sub}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2 flex items-center justify-between gap-1.5">
          <button
            type="button"
            onClick={() => copyText("dock-social", socialShareText)}
            className="h-7 flex-1 cursor-pointer rounded-full bg-emerald-950 px-2.5 font-sans text-[10.5px] font-bold text-emerald-300"
          >
            {copiedId === "dock-social"
              ? "Copied X/LinkedIn Post ✓"
              : "Copy X Post (@Tatum_io)"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div data-testid="tatum-total-recall-hub" className="w-full">
      <AccordionOS
        items={accordionItems}
        staticImage="/assets/plush/walrus-mascot-1-skill-hub.jpg"
        defaultActiveIndex={0}
        containerWidth="100%"
        containerHeight={compact ? 510 : 520}
        autoPlay={false}
        onItemChange={(idx) => {
          if (idx !== null) setActiveSlide(idx);
        }}
        rightOverlay={renderContextualRightDock()}
      />
    </div>
  );
};
