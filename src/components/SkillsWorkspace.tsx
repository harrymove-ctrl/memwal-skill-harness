"use client";

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Network,
  Pencil,
  Play,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import type {
  FlowMemoryNode,
  HostedSkillNode,
  WalrusConnectionConfig,
} from "../types";
import { compileSkillMarkdown, getEnvDefaultConfig } from "../lib/memwalBridge";
import {
  getFactKindBadge,
  getSkillUseCaseStory,
} from "../lib/skillUseCaseProof";
import { GlimmScope, type GlimmScopeHandle, PALETTES } from "glimm/react";
import { useGlimmStudio } from "../lib/glimmStudio";
import { Markdown } from "@/components/blocks/markdown/markdown";
import { cx, SorbetSwitch } from "./sorbet/SorbetToolPermissions";
import { SkillForceGraph } from "./SkillForceGraph";
import {
  DiscreteTabs,
  FilterPills,
  InlineRuleEdit,
  SaveButton,
} from "./uselayouts";

interface SkillsWorkspaceProps {
  skills: HostedSkillNode[];
  flows: FlowMemoryNode[];
  activeSkill: HostedSkillNode;
  config?: WalrusConnectionConfig;
  isSharedJoinView?: boolean;
  onDismissSharedJoinView?: () => void;
  onPullNamespaceFromWalrus?: () => void;
  onSelectSkill: (skillId: string) => void;
  onUpdateSkillMarkdown: (skillId: string, markdown: string) => void;
  onSyncSkillEditToWalrus?: (
    skillId: string,
    markdown: string,
    summaryNote?: string
  ) => Promise<{
    synced: boolean;
    conflict?: boolean;
    rev?: number;
    blobId: string;
    jobId?: string;
    consoleReceiptId: string;
    message: string;
  }>;
  onUpdateFlowMemory?: (
    flowId: string,
    nextRule: string,
    nextRationale?: string
  ) => Promise<FlowMemoryNode | null>;
  onToggleRuleState?: (
    ruleId: string,
    nextState: "on" | "off"
  ) => Promise<void> | void;
  onBakeRuleIntoSkill?: (
    ruleId: string,
    skillId: string
  ) => Promise<void> | void;
  onDeleteFlow: (flowId: string) => void;
  onCreateNewSkill: (input: {
    name: string;
    category: string;
    description: string;
    markdown: string;
  }) => void;
  onAddFlowMemory?: (input: {
    skillId: string;
    rule: string;
    rationale: string;
    severity: FlowMemoryNode["severity"];
    linkedSkills: string[];
  }) => Promise<FlowMemoryNode> | void;
  onToggleSkillLink?: (sourceId: string, targetId: string) => void;
  onTestSkillInDemo?: (skillId: string) => void;
}

type WorkspaceMode = "read" | "graph" | "edit" | "create";

function stripFrontmatter(md: string): string {
  return md.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n*/, "");
}

function normalizeCategoryShort(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes("ui") || lower.includes("design") || lower.includes("craft"))
    return "UI/UX";
  if (lower.includes("qa") || lower.includes("test") || lower.includes("wallet"))
    return "QA";
  if (lower.includes("rust") || lower.includes("relayer")) return "Rust";
  return "Core";
}

export const SkillsWorkspace: React.FC<SkillsWorkspaceProps> = ({
  skills,
  flows,
  activeSkill,
  config,
  onPullNamespaceFromWalrus,
  onSelectSkill,
  onUpdateSkillMarkdown,
  onSyncSkillEditToWalrus,
  onUpdateFlowMemory,
  onToggleRuleState,
  onBakeRuleIntoSkill,
  onDeleteFlow,
  onCreateNewSkill,
  onAddFlowMemory,
  onToggleSkillLink,
  onTestSkillInDemo,
}) => {
  const uid = useId();
  const effectiveConfig = useMemo(
    () => config ?? getEnvDefaultConfig(),
    [config]
  );
  const isReadOnly = effectiveConfig.accessRole === "read-only";

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [mode, setMode] = useState<WorkspaceMode>("read");
  const [copiedSkill, setCopiedSkill] = useState(false);

  // Edit SKILL.md state
  const [editDraft, setEditDraft] = useState(activeSkill.markdown);
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "conflict" | "failed"
  >("idle");
  const [saveBannerMsg, setSaveBannerMsg] = useState<string | null>(null);

  // Add Fact / Rule state
  const [newRuleText, setNewRuleText] = useState("");
  const [newRuleRationale, setNewRuleRationale] = useState("");
  const [newRuleSeverity, setNewRuleSeverity] =
    useState<FlowMemoryNode["severity"]>("hard-rule");
  const [showFactBuilder, setShowFactBuilder] = useState(false);
  const [addingRuleState, setAddingRuleState] = useState<
    "idle" | "saving" | "saved"
  >("idle");
  const [ruleActionBanner, setRuleActionBanner] = useState<string | null>(null);
  const ruleInputRef = useRef<HTMLInputElement | null>(null);
  const skillScopeRef = useRef<GlimmScopeHandle>(null);
  const {
    activePalette,
    bandTight,
    direction,
    brightness,
    triggerPageSweep,
  } = useGlimmStudio();

  // Create New Skill state
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillDesc, setNewSkillDesc] = useState("");
  const [newSkillMd, setNewSkillMd] = useState(
    `---\nname: my-team-skill\ndescription: Shared team workflow synced on Walrus.\n---\n# My Team Skill\n\n## Steps\n1. Recall active rules from Walrus.\n2. Verify output before shipping.\n`
  );

  useEffect(() => {
    setEditDraft(activeSkill.markdown);
    setSaveState("idle");
    setSaveBannerMsg(null);
    setShowFactBuilder(false);
    setRuleActionBanner(null);
  }, [activeSkill.id, activeSkill.markdown]);

  const currentSkillFlows = useMemo(
    () =>
      flows.filter(
        (f) => f.skillId === activeSkill.id && f.state !== "deleted"
      ),
    [flows, activeSkill.id]
  );

  const activeFlows = useMemo(
    () => currentSkillFlows.filter((f) => f.state !== "off"),
    [currentSkillFlows]
  );

  const story = useMemo(() => getSkillUseCaseStory(activeSkill), [activeSkill]);

  const availableSuggestions = useMemo(
    () =>
      story.suggestedFacts.filter(
        (sug) =>
          !currentSkillFlows.some(
            (f) => f.rule.toLowerCase().trim() === sug.rule.toLowerCase().trim()
          )
      ),
    [story.suggestedFacts, currentSkillFlows]
  );

  const compiledMarkdown = useMemo(
    () => compileSkillMarkdown(activeSkill, activeFlows),
    [activeSkill, activeFlows]
  );

  // Live-compiled readable markdown that prepends Section 0 (Active Walrus Facts & Proof)
  // so toggling or adding any Fact in Skills 19 immediately updates the SKILL.md preview!
  const liveCompiledReadableMarkdown = useMemo(() => {
    const baseBody = stripFrontmatter(activeSkill.markdown);
    const factTableRows =
      currentSkillFlows.length > 0
        ? currentSkillFlows
            .map((f) => {
              const isOn = f.state !== "off";
              const badge = getFactKindBadge(f.severity, f.rule);
              return `| **${badge.label}** | ${f.rule} [2] | ${badge.phaseTarget} | ${
                isOn ? "ENFORCED IN PLAN" : "OFF (BYPASSED)"
              } |`;
            })
            .join("\n")
        : `| **BASE** | Base \`${activeSkill.id}.SKILL.md\` only [1] | All Phases | Add a Fact above to inject live overrides |`;

    const statusCallout =
      activeFlows.length > 0
        ? [
            `> [!IMPORTANT]`,
            `> **Live Walrus Proof (${activeFlows.length}/${currentSkillFlows.length} Facts Active)**: ${story.provenAgentAction} (${story.measurableImpact}).`,
          ].join("\n")
        : [
            `> [!WARNING]`,
            `> **All Walrus Team Facts Toggled OFF**: ${story.brokenAgentAction}. Turn a Fact ON above to restore protection.`,
          ].join("\n");

    return [
      `## 0. Live Walrus Team Facts & Use-Case Proof (${activeFlows.length}/${currentSkillFlows.length} Active)`,
      ``,
      statusCallout,
      ``,
      `| Kind | Team Fact / Rule (Walrus Memory) | Plan Phase | Live Status |`,
      `| :--- | :--- | :--- | :--- |`,
      factTableRows,
      ``,
      baseBody,
    ].join("\n");
  }, [activeSkill, currentSkillFlows, activeFlows, story]);

  const filteredSkills = useMemo(() => {
    const priorityOrder: Record<string, number> = {
      "ui-ux-qa": 1,
      "concise-ui-copy": 2,
      boost: 3,
      "interface-bts": 4,
      "react-bits-pro": 5,
      "memwal-qa": 6,
      "memwal-skill-hub": 7,
    };
    const q = search.trim().toLowerCase();
    return [...skills]
      .sort((a, b) => {
        const pa = priorityOrder[a.id] ?? 99;
        const pb = priorityOrder[b.id] ?? 99;
        if (pa !== pb) return pa - pb;
        return a.name.localeCompare(b.name);
      })
      .filter((s) => {
        const catShort = normalizeCategoryShort(s.category);
        if (activeCategory !== "All" && catShort !== activeCategory) {
          return false;
        }
        if (!q) return true;
        return (
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
        );
      });
  }, [skills, search, activeCategory]);

  const handleCopySkill = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(compiledMarkdown);
    }
    setCopiedSkill(true);
    setTimeout(() => setCopiedSkill(false), 1600);
  };

  const handleSaveSkillRevision = async () => {
    if (isReadOnly) return;
    setSaveState("saving");
    setSaveBannerMsg(null);
    onUpdateSkillMarkdown(activeSkill.id, editDraft);
    if (onSyncSkillEditToWalrus) {
      const res = await onSyncSkillEditToWalrus(activeSkill.id, editDraft);
      if (res?.conflict) {
        setSaveState("conflict");
        setSaveBannerMsg(res.message);
        return;
      }
      setSaveState("saved");
      setSaveBannerMsg(res?.message || "Saved new SKILL.md revision.");
      setTimeout(() => setSaveState("idle"), 2000);
    } else {
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1600);
    }
  };

  const commitNewFact = async (
    ruleText: string,
    rationaleText?: string,
    severityVal: FlowMemoryNode["severity"] = "hard-rule"
  ) => {
    const clean = ruleText.trim();
    if (!clean || !onAddFlowMemory || isReadOnly) return;
    setAddingRuleState("saving");
    try {
      await onAddFlowMemory({
        skillId: activeSkill.id,
        rule: clean,
        rationale:
          rationaleText?.trim() || `Added in Skills for ${activeSkill.name}`,
        severity: severityVal,
        linkedSkills: [],
      });
      setNewRuleText("");
      setNewRuleRationale("");
      setShowFactBuilder(false);
      skillScopeRef.current?.play({
        change: () => {
          setAddingRuleState("saved");
          setRuleActionBanner(
            `Added Fact to ${activeSkill.name} & injected into Section 0 of SKILL.md!`
          );
        },
      });
      setTimeout(() => setRuleActionBanner(null), 2800);
    } finally {
      setTimeout(() => setAddingRuleState("idle"), 1400);
    }
  };

  const handleAddRuleAction = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isReadOnly) return;
    const clean = newRuleText.trim();
    if (clean) {
      await commitNewFact(clean, newRuleRationale, newRuleSeverity);
      return;
    }
    const nextSug = availableSuggestions[0] || story.suggestedFacts[0];
    if (!showFactBuilder && nextSug) {
      setNewRuleText(nextSug.rule);
      setNewRuleRationale(nextSug.rationale);
      setNewRuleSeverity(nextSug.severity);
      setShowFactBuilder(true);
      setTimeout(() => {
        ruleInputRef.current?.focus();
        ruleInputRef.current?.select();
      }, 30);
    } else {
      setShowFactBuilder((v) => !v);
      setTimeout(() => ruleInputRef.current?.focus(), 30);
    }
  };

  const handleToggleAllFactsForProof = async () => {
    if (isReadOnly || !onToggleRuleState || currentSkillFlows.length === 0)
      return;
    const targetState: "on" | "off" = activeFlows.length > 0 ? "off" : "on";
    for (const f of currentSkillFlows) {
      if ((f.state !== "off") !== (targetState === "on")) {
        await onToggleRuleState(f.id, targetState);
      }
    }
    skillScopeRef.current?.play({
      change: () => {
        setRuleActionBanner(
          targetState === "off"
            ? `Simulated Agent Failure: All ${currentSkillFlows.length} Walrus Facts turned OFF.`
            : `Restored Walrus Protection: All ${currentSkillFlows.length} Facts turned ON!`
        );
      },
    });
    triggerPageSweep(undefined, {
      palette: targetState === "off" ? PALETTES.ember : activePalette,
      direction: targetState === "off" ? "rtl" : "ltr",
      sweepMs: 680,
      label: targetState === "off" ? "skills:simulate-fail" : "skills:restore-fix",
    });
    setTimeout(() => setRuleActionBanner(null), 2800);
  };

  const handleCreateSkillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim() || isReadOnly) return;
    onCreateNewSkill({
      name: newSkillName.trim(),
      category: "UI/UX & Design",
      description:
        newSkillDesc.trim() || "Shared team skill synced on Walrus.",
      markdown: newSkillMd,
    });
    setNewSkillName("");
    setNewSkillDesc("");
    setMode("read");
  };

  return (
    <div
      data-testid="skills-essential-workbench"
      className="grid grid-cols-1 gap-4 lg:grid-cols-[248px_minmax(0,1fr)]"
    >
      {/* ====================================================================
          LEFT PANE: COMPACT SKILL INDEX (1-LINE PILLS + CLEAN LIST)
         ==================================================================== */}
      <aside className="flex flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-3 shadow-2xs dark:border-white/10 dark:bg-[#111514]">
        <div>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${skills.length} skills…`}
              className="h-8 w-full rounded-xl border border-neutral-200/80 bg-neutral-50 pr-2.5 pl-8 text-xs text-neutral-900 outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-black/30 dark:text-white"
            />
          </div>

          <FilterPills
            categories={["All", "UI/UX", "QA", "Core", "Rust"]}
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
            className="mt-2"
          />

          <div className="mt-2 max-h-[500px] space-y-0.5 overflow-y-auto pr-0.5">
            {filteredSkills.map((s) => {
              const selected = s.id === activeSkill.id && mode !== "create";
              const ruleCount = flows.filter(
                (f) =>
                  f.skillId === s.id &&
                  f.state !== "off" &&
                  f.state !== "deleted"
              ).length;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onSelectSkill(s.id);
                    if (mode === "create") setMode("read");
                  }}
                  className={cx(
                    "flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-left text-xs transition",
                    selected
                      ? "bg-neutral-900 font-semibold text-white dark:bg-emerald-500 dark:text-neutral-950"
                      : "font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-white/[0.06]"
                  )}
                >
                  <span className="truncate font-mono text-xs">{s.name}</span>
                  {ruleCount > 0 && (
                    <span
                      className={cx(
                        "shrink-0 rounded-full px-1.5 py-0.2 font-mono text-[10px] font-bold",
                        selected
                          ? "bg-white/20 text-white dark:bg-black/20 dark:text-neutral-950"
                          : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      )}
                    >
                      +{ruleCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {!isReadOnly && (
          <button
            type="button"
            onClick={() => setMode("create")}
            className="mt-3 inline-flex h-8 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-neutral-200/80 bg-neutral-50 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-200 dark:hover:bg-white/10"
          >
            <Plus className="size-3.5" />
            <span>New Skill</span>
          </button>
        )}
      </aside>

      {/* ====================================================================
          RIGHT PANE: USE-CASE PROOF + TEAM RULES + LIVE-COMPILED SKILL.MD
         ==================================================================== */}
      <div className="min-w-0 rounded-2xl border border-neutral-200/90 bg-white shadow-2xs dark:border-white/10 dark:bg-[#111514]">
        {/* TOP HEADER BAR */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200/80 px-4 py-3 dark:border-white/10">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-mono text-sm font-bold text-neutral-900 dark:text-white">
              {activeSkill.name}
            </h1>
            <a
              href="https://console.walrus.xyz/buckets/?b=217e53fc-36ff-4d1b-8834-04f69c2ef553"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-800 hover:bg-emerald-500/15 dark:text-emerald-300"
            >
              <span>
                Bucket 217e53fc… · rev {activeSkill.rev ?? 1}
                {activeSkill.fileId &&
                !activeSkill.fileId.startsWith("console-file-")
                  ? ` · ${activeSkill.fileId.slice(0, 8)}`
                  : ""}
              </span>
              <ExternalLink className="size-2.5" />
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <DiscreteTabs
              layoutId="skills-view-mode"
              size="sm"
              activeId={mode === "create" ? "read" : mode}
              onChange={(id) => setMode(id as WorkspaceMode)}
              items={[
                {
                  id: "read",
                  label: "Read",
                  icon: <BookOpen className="size-3" />,
                },
                {
                  id: "graph",
                  label: "Graph",
                  icon: <Network className="size-3" />,
                },
                ...(!isReadOnly
                  ? [
                      {
                        id: "edit",
                        label: "Edit",
                        icon: <Pencil className="size-3" />,
                      },
                    ]
                  : []),
              ]}
            />

            {onTestSkillInDemo && (
              <button
                type="button"
                onClick={() => onTestSkillInDemo(activeSkill.id)}
                className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-xl border border-neutral-200/80 bg-white px-2.5 font-mono text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-200"
              >
                <Play className="size-3 fill-current" />
                <span>Test Plan</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopySkill}
              className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-xl bg-neutral-900 px-2.5 font-mono text-xs font-semibold text-white hover:bg-neutral-800 dark:bg-emerald-500 dark:text-neutral-950"
            >
              {copiedSkill ? (
                <>
                  <Check className="size-3" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="size-3" />
                  <span>Copy .md</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* MODE: CREATE NEW SKILL */}
        {mode === "create" && (
          <form onSubmit={handleCreateSkillSubmit} className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                Create Shared Skill
              </h2>
              <button
                type="button"
                onClick={() => setMode("read")}
                className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              >
                Cancel
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                type="text"
                required
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                placeholder="skill-slug (e.g. pr-security-gate)"
                className="h-9 rounded-xl border border-neutral-200 px-3 font-mono text-xs outline-none focus:border-emerald-500 dark:border-white/12 dark:bg-black/30 dark:text-white"
              />
              <input
                type="text"
                value={newSkillDesc}
                onChange={(e) => setNewSkillDesc(e.target.value)}
                placeholder="Short 1-line summary…"
                className="h-9 rounded-xl border border-neutral-200 px-3 text-xs outline-none focus:border-emerald-500 dark:border-white/12 dark:bg-black/30 dark:text-white"
              />
            </div>
            <textarea
              rows={10}
              value={newSkillMd}
              onChange={(e) => setNewSkillMd(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 p-3 font-mono text-xs outline-none focus:border-emerald-500 dark:border-white/12 dark:bg-black/30 dark:text-white"
            />
            <div className="flex justify-end">
              <SaveButton
                state="idle"
                idleLabel="Create Skill"
                onClick={() => {}}
              />
            </div>
          </form>
        )}

        {/* MODE: GRAPH */}
        {mode === "graph" && (
          <div className="p-3">
            <SkillForceGraph
              namespace={effectiveConfig.namespace}
              accountId={effectiveConfig.accountId}
              skills={skills}
              flowMemories={flows.filter((f) => f.state !== "deleted")}
              selectedSkillId={activeSkill.id}
              selectedFlowId={null}
              highlightedFlowIds={[]}
              isEvalAnimating={false}
              searchQuery={search}
              selectedCategory="all"
              onSelectSkill={(id) => onSelectSkill(id)}
              onSelectFlow={() => {}}
              onCreateNewSkill={onCreateNewSkill}
              onAddFlowMemory={onAddFlowMemory}
              onDeleteFlow={onDeleteFlow}
              onToggleSkillLink={onToggleSkillLink}
            />
          </div>
        )}

        {/* MODE: EDIT SKILL.MD */}
        {mode === "edit" && (
          <div className="space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold text-neutral-800 dark:text-neutral-200">
                Edit {activeSkill.name}/SKILL.md (rev {activeSkill.rev ?? 1})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMode("read")}
                  className="h-8 cursor-pointer rounded-xl border border-neutral-200 px-3 text-xs font-medium text-neutral-600 hover:bg-neutral-50 dark:border-white/12 dark:text-neutral-300"
                >
                  Done
                </button>
                <SaveButton
                  testId="save-sync-skill-btn"
                  state={saveState}
                  idleLabel="Save & Sync"
                  savingLabel="Syncing…"
                  savedLabel="Synced"
                  onClick={() => void handleSaveSkillRevision()}
                />
              </div>
            </div>

            {saveBannerMsg && (
              <div
                data-testid="skill-save-banner"
                className={cx(
                  "flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs font-medium",
                  saveState === "conflict"
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200"
                    : "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                )}
              >
                <span>{saveBannerMsg}</span>
                {saveState === "conflict" && (
                  <button
                    type="button"
                    data-testid="reload-conflict-skill-btn"
                    onClick={() => {
                      onPullNamespaceFromWalrus?.();
                      setSaveState("idle");
                      setSaveBannerMsg(null);
                    }}
                    className="cursor-pointer rounded-lg bg-amber-600 px-2.5 py-1 font-mono text-[10.5px] font-bold text-white hover:bg-amber-500"
                  >
                    Reload Latest
                  </button>
                )}
              </div>
            )}

            <textarea
              rows={18}
              value={editDraft}
              onChange={(e) => setEditDraft(e.target.value)}
              className="w-full rounded-xl border border-neutral-200/90 bg-neutral-50 p-3.5 font-mono text-xs leading-relaxed text-neutral-900 outline-none focus:border-emerald-500 dark:border-white/12 dark:bg-black/40 dark:text-neutral-100"
            />
          </div>
        )}

        {/* MODE: READ (COMPACT TEAM RULES + FRONT-AND-CENTER HEXTAUI SKILL.MD) */}
        {mode === "read" && (
          <div className="divide-y divide-neutral-200/80 dark:divide-white/10">
            {/* ==============================================================
                COMPACT TEAM RULES & LIVE PROOF BAR (Keeps SKILL.md at y ~ 250px!)
               ============================================================== */}
            <div
              data-testid="skills-rules-card"
              className="bg-neutral-50/40 px-4 py-3 dark:bg-white/[0.015]"
            >
              {/* Header Row: TEAM RULES + Live Proof Pill + Simulate Toggle */}
              <div
                data-testid="skill-usecase-proof-strip"
                className="flex flex-wrap items-center justify-between gap-2"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold tracking-wider text-neutral-800 uppercase dark:text-neutral-200">
                    Team Rules
                  </span>
                  <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                    {activeFlows.length}/{currentSkillFlows.length} active
                  </span>
                  <span
                    className={cx(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold",
                      activeFlows.length > 0
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                        : "border-amber-500/40 bg-amber-500/15 text-amber-800 dark:text-amber-300"
                    )}
                  >
                    {activeFlows.length > 0 ? (
                      <>
                        <ShieldCheck className="size-3 text-emerald-500" />
                        <span>With MemWal: {story.withVerdict}</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="size-3 text-amber-500" />
                        <span>Without MemWal: {story.withoutVerdict}</span>
                      </>
                    )}
                  </span>
                </div>

                {!isReadOnly && currentSkillFlows.length > 0 && (
                  <button
                    type="button"
                    data-testid="skills-simulate-toggle-btn"
                    onClick={() => void handleToggleAllFactsForProof()}
                    className={cx(
                      "cursor-pointer rounded-lg border px-2.5 py-0.5 font-mono text-[10px] font-bold transition",
                      activeFlows.length > 0
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-800 hover:bg-amber-500/20 dark:text-amber-300"
                        : "border-emerald-500/50 bg-emerald-500 text-neutral-950 hover:bg-emerald-400"
                    )}
                  >
                    {activeFlows.length > 0
                      ? "⚡ Simulate Failure"
                      : "⚡ Restore Fix"}
                  </button>
                )}
              </div>

              {ruleActionBanner && (
                <div
                  data-testid="skills-rule-action-banner"
                  className="mt-2 flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/12 px-3 py-1 font-mono text-[11px] font-semibold text-emerald-800 dark:text-emerald-200"
                >
                  <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
                  <span>{ruleActionBanner}</span>
                </div>
              )}

              {/* Active Rule Rows */}
              <div className="mt-2 divide-y divide-neutral-200/60 dark:divide-white/8">
                {currentSkillFlows.length === 0 ? (
                  <p className="py-1.5 text-xs text-neutral-500">
                    No team rules attached to {activeSkill.name} yet.
                  </p>
                ) : (
                  currentSkillFlows.map((f) => {
                    const labelId = `${uid}-rule-${f.id}`;
                    const isOn = f.state !== "off";
                    const badge = getFactKindBadge(f.severity, f.rule);
                    return (
                      <div
                        key={f.id}
                        className="flex items-center justify-between gap-3 py-1.5"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <span
                            className={cx(
                              "shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase",
                              badge.tone
                            )}
                          >
                            {badge.label}
                          </span>
                          <div
                            className={cx(
                              "min-w-0 flex-1",
                              isOn ? "" : "line-through opacity-50 transition"
                            )}
                          >
                            <InlineRuleEdit
                              value={f.rule}
                              disabled={isReadOnly}
                              onSave={async (nextText) => {
                                await onUpdateFlowMemory?.(
                                  f.id,
                                  nextText,
                                  f.rationale
                                );
                              }}
                            />
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                          {!isReadOnly && onBakeRuleIntoSkill && isOn && (
                            <button
                              type="button"
                              data-testid="bake-rule-row-btn"
                              onClick={async () => {
                                await onBakeRuleIntoSkill(f.id, activeSkill.id);
                                setRuleActionBanner(
                                  `Baked rule into ${activeSkill.name}.SKILL.md (rev ${(activeSkill.rev ?? 1) + 1})!`
                                );
                                setTimeout(
                                  () => setRuleActionBanner(null),
                                  3200
                                );
                              }}
                              title="Bake this runtime Fact permanently into SKILL.md on Walrus Console (rev N+1)"
                              className="inline-flex cursor-pointer items-center gap-0.5 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-800 hover:bg-emerald-500/20 dark:text-emerald-300"
                            >
                              <ArrowUpRight className="size-2.5" />
                              <span>Bake</span>
                            </button>
                          )}
                          <SorbetSwitch
                            on={isOn}
                            labelId={labelId}
                            disabled={isReadOnly}
                            onToggle={() => {
                              void onToggleRuleState?.(
                                f.id,
                                isOn ? "off" : "on"
                              );
                            }}
                          />
                          {!isReadOnly && (
                            <button
                              type="button"
                              onClick={() => onDeleteFlow(f.id)}
                              title="Delete rule"
                              className="inline-flex size-6 cursor-pointer items-center justify-center rounded-md text-neutral-400 hover:bg-rose-500/10 hover:text-rose-500"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Compact Add Rule Bar + 1-Click Suggestions */}
              {!isReadOnly && (
                <form
                  onSubmit={(e) => void handleAddRuleAction(e)}
                  className="mt-2 space-y-1.5"
                >
                  <div className="flex items-center gap-2">
                    <input
                      ref={ruleInputRef}
                      type="text"
                      data-testid="skills-add-rule-input"
                      value={newRuleText}
                      onChange={(e) => setNewRuleText(e.target.value)}
                      placeholder={`Add rule for ${activeSkill.name}…`}
                      className="h-8 min-w-0 flex-1 rounded-xl border border-neutral-200/90 bg-white px-3 text-xs text-neutral-900 outline-none focus:border-emerald-500 dark:border-white/12 dark:bg-black/40 dark:text-white"
                    />
                    <SaveButton
                      testId="skills-add-rule-btn"
                      state={addingRuleState}
                      disabled={isReadOnly}
                      idleLabel={newRuleText.trim() ? "Save Fact" : "Add"}
                      savingLabel="Saving…"
                      savedLabel="Added ✓"
                      icon={<Plus className="size-3.5" />}
                      onClick={() => void handleAddRuleAction()}
                    />
                  </div>

                  {showFactBuilder && (
                    <div
                      data-testid="skills-expanded-fact-builder"
                      className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-500/35 bg-emerald-500/[0.06] px-2.5 py-1.5 dark:bg-emerald-950/30"
                    >
                      <div className="flex items-center gap-1">
                        {(
                          [
                            { id: "hard-rule", label: "HARD RULE" },
                            { id: "gotcha", label: "FACT" },
                            { id: "trust-score", label: "PLAN GATE" },
                          ] as const
                        ).map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setNewRuleSeverity(opt.id)}
                            className={cx(
                              "cursor-pointer rounded px-1.5 py-0.5 font-mono text-[9.5px] font-bold",
                              newRuleSeverity === opt.id
                                ? "bg-emerald-600 text-white"
                                : "bg-white/80 text-neutral-600 dark:bg-black/40 dark:text-neutral-300"
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={newRuleRationale}
                        onChange={(e) => setNewRuleRationale(e.target.value)}
                        placeholder="Optional rationale…"
                        className="h-6 min-w-[180px] flex-1 rounded-lg border border-neutral-200/90 bg-white px-2 text-[11px] text-neutral-800 outline-none focus:border-emerald-500 dark:border-white/12 dark:bg-black/40 dark:text-neutral-200"
                      />
                    </div>
                  )}

                  {availableSuggestions.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {availableSuggestions.map((sug, idx) => (
                        <button
                          key={idx}
                          type="button"
                          data-testid={`skills-suggest-fact-${idx}`}
                          onClick={() =>
                            void commitNewFact(
                              sug.rule,
                              sug.rationale,
                              sug.severity
                            )
                          }
                          className="cursor-pointer rounded-lg border border-emerald-500/30 bg-emerald-500/[0.08] px-2 py-0.5 font-mono text-[10px] font-medium text-emerald-800 transition hover:bg-emerald-500/18 dark:text-emerald-300"
                        >
                          {sug.label}
                        </button>
                      ))}
                    </div>
                  )}
                </form>
              )}
            </div>

            {/* ==============================================================
                HEXTAUI PRO <MARKDOWN /> BLOCK (Immediately visible at y ~ 250px!)
               ============================================================== */}
            <GlimmScope
              ref={skillScopeRef}
              palette={activePalette}
              bandTight={Math.max(16, bandTight)}
              direction={direction}
              curve={0.12}
              sweepMs={980}
              brightness={brightness}
              pageEffect={false}
            >
              <div className="p-4">
                <Markdown
                  text={liveCompiledReadableMarkdown}
                  size="base"
                  anchors
                  title={`${activeSkill.name}.SKILL.md`}
                  badge={`Bucket 217e53fc… · rev ${activeSkill.rev ?? 1}`}
                  sources={[
                    {
                      id: "1",
                      title: `Walrus Console · ${activeSkill.id}.SKILL.md`,
                      url: "https://console.walrus.xyz/buckets/?b=217e53fc-36ff-4d1b-8834-04f69c2ef553",
                    },
                    {
                      id: "2",
                      title: `Walrus Memory · ${activeSkill.namespace} (${activeFlows.length} Active Facts)`,
                      url: "https://relayer.memory.walrus.xyz",
                    },
                  ]}
                  showToolbar
                  showDemoControls={false}
                  enableTextReveal={false}
                  maxHeightClass="max-h-[520px]"
                />
              </div>
            </GlimmScope>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillsWorkspace;
