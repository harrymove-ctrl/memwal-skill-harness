"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Copy,
  FileDiff,
  Play,
  Plus,
  ShieldCheck,
  Sparkles,
  Terminal,
  Trash2,
} from "lucide-react";
import type {
  FlowMemoryNode,
  HostedSkillNode,
  TrajectoryEvalCase,
  WalrusConnectionConfig,
} from "../types";
import {
  createMemWalClient,
  hasLiveCredentials,
  resolveDelegateProfile,
} from "../lib/memwalBridge";
import { getSkillUseCaseStory } from "../lib/skillUseCaseProof";
import { GlimmScope, type GlimmScopeHandle, PALETTES } from "glimm/react";
import { useGlimmStudio } from "../lib/glimmStudio";
import { GlimmStudioBar } from "./GlimmStudioBar";
import { Markdown, type Source } from "@/components/blocks/markdown/markdown";
import { PierreDiffViewer } from "./PierreDiffViewer";
import { cx, SorbetSwitch } from "./sorbet/SorbetToolPermissions";
import {
  DiscreteTabs,
  InlineRuleEdit,
  SaveButton,
  SmoothDropdown,
} from "./uselayouts";

interface TrajectoryEvalHarnessProps {
  skill: HostedSkillNode;
  allSkills: HostedSkillNode[];
  skillFlows: FlowMemoryNode[];
  evalCases: TrajectoryEvalCase[];
  config: WalrusConnectionConfig;
  onSelectSkill?: (skillId: string) => void;
  onOpenSkillReader?: () => void;
  onOpenConnect?: () => void;
  onHighlightFlows?: (flowIds: string[], animating: boolean) => void;
  onAddFlowMemory: (input: {
    skillId: string;
    rule: string;
    rationale: string;
    severity: FlowMemoryNode["severity"];
    linkedSkills: string[];
  }) => Promise<FlowMemoryNode> | void;
  onToggleRuleState?: (
    ruleId: string,
    nextState: "on" | "off"
  ) => Promise<void> | void;
  onUpdateFlowMemory?: (
    flowId: string,
    nextRule: string,
    nextRationale?: string
  ) => Promise<FlowMemoryNode | null> | void;
  onBakeRuleIntoSkill?: (
    ruleId: string,
    skillId: string
  ) => Promise<void> | void;
  onDeleteFlow?: (flowId: string) => void;
}

interface SuggestedFactTemplate {
  label: string;
  rule: string;
  rationale: string;
  severity: FlowMemoryNode["severity"];
}

interface SkillPlanBlueprint {
  taskPrompt: string;
  targetFiles: string;
  verificationCmd: string;
  phase1Base: string;
  phase2Base: string;
  phase3Base: string;
  suggestedFacts: SuggestedFactTemplate[];
}

const FEATURED_SKILL_IDS = [
  "memwal-qa",
  "ui-ux-qa",
  "concise-ui-copy",
  "boost",
  "glimm",
];

function getFactKindBadge(severity?: FlowMemoryNode["severity"], text = ""): {
  label: string;
  tone: string;
  phaseNum: 1 | 2 | 3;
  phaseShort: string;
} {
  const lower = text.toLowerCase();
  if (
    lower.includes("retired") ||
    lower.includes("bucket") ||
    lower.includes("staging") ||
    lower.includes("entry point") ||
    severity === "gotcha"
  ) {
    return {
      label: "FACT",
      tone: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
      phaseNum: 1,
      phaseShort: "Phase 1 Gate",
    };
  }
  if (
    lower.includes("ci") ||
    lower.includes("check") ||
    lower.includes("test") ||
    lower.includes("verify") ||
    lower.includes("1280x800") ||
    lower.includes("secret") ||
    severity === "trust-score"
  ) {
    return {
      label: "PLAN GATE",
      tone: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
      phaseNum: 3,
      phaseShort: "Phase 3 Gate",
    };
  }
  return {
    label: "HARD RULE",
    tone: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
    phaseNum: 2,
    phaseShort: "Phase 2 Gate",
  };
}

function getSkillPlanBlueprint(skill: HostedSkillNode): SkillPlanBlueprint {
  const blueprints: Record<string, SkillPlanBlueprint> = {
    "memwal-qa": {
      taskPrompt:
        "PR #942 fixes a markdown bug in apps/chatbot and all 8 CI checks are green. Build the QA & merge verification plan.",
      targetFiles: "apps/chatbot, apps/app, server/namespaceSkillsApi.mjs",
      verificationCmd: "node scripts/verify-e2e-console-rules.mjs",
      phase1Base:
        "Inspect PR #942 changed paths (apps/chatbot/*) against active repository target rules.",
      phase2Base:
        "Reproduce behavior locally vs dev with @mysten-incubation/dev-wallet and check Railway logs.",
      phase3Base:
        "Verify all GitHub Actions checks and Railway deploy health before issuing final verdict.",
      suggestedFacts: [
        {
          label: "+ Fact: Verify /api/console/status",
          rule: "Verify GET /api/console/status returns 20 active SEAL files in bucket 217e53fc-36ff-4d1b-8834-04f69c2ef553 before QA sign-off.",
          rationale: "Confirms Walrus Console bucket index is healthy before approving release.",
          severity: "hard-rule",
        },
        {
          label: "+ Fact: Staging is retired",
          rule: "Verify only dev and production environments; staging is retired so promotions go directly dev to main.",
          rationale: "Prevents wasted QA checks on deprecated staging URLs.",
          severity: "gotcha",
        },
      ],
    },
    "ui-ux-qa": {
      taskPrompt:
        "Design and verify the 2-column Fact-Check Switchboard and Plan Inspector UI at 1280x800 and 390x844.",
      targetFiles:
        "src/components/TrajectoryEvalHarness.tsx, src/components/SkillsWorkspace.tsx",
      verificationCmd: "npx vitest run && npm run build",
      phase1Base:
        "Audit UI zones, eliminate redundant stacked banners, and verify active Team Facts.",
      phase2Base:
        "Render full-width rule rows and side-by-side Without vs With MemWal terminal cards.",
      phase3Base:
        "Capture deterministic 1280x800 desktop and 390x844 mobile screenshots with zero overflow.",
      suggestedFacts: [
        {
          label: "+ Fact: HextaUI Pro Markdown",
          rule: "Render all SKILL.md and Plan previews with @hextaui-pro/markdown (sources, section pills, Copy .md).",
          rationale: "Keeps markdown rendering consistent with HextaUI Pro design system.",
          severity: "hard-rule",
        },
        {
          label: "+ Gate: 1280x800 & 390x844 proof",
          rule: "Capture both 1280x800 desktop and 390x844 mobile visual proof before marking any UI task complete.",
          rationale: "Catches mobile header clipping and toolbar wrapping early.",
          severity: "trust-score",
        },
      ],
    },
    "concise-ui-copy": {
      taskPrompt:
        "Audit and rewrite the microcopy across Playground, Skills, and Connect screens.",
      targetFiles:
        "src/components/McpSyncPanel.tsx, src/components/TrajectoryEvalHarness.tsx",
      verificationCmd: "npm run build",
      phase1Base:
        "Scan all card titles, descriptions, and action bars for word-count and button-count violations.",
      phase2Base:
        "Replace multi-sentence paragraphs with 2-to-5 word headings and <= 14 word summaries.",
      phase3Base:
        "Verify every card has <= 3 action buttons and fits cleanly on 1280px and 390px viewports.",
      suggestedFacts: [
        {
          label: "+ Rule: Zero dashes in prose",
          rule: "Never use em-dashes or en-dashes in UI labels, tooltips, or markdown artifacts.",
          rationale: "Enforces clean human-authored typography across all surfaces.",
          severity: "hard-rule",
        },
      ],
    },
    boost: {
      taskPrompt:
        "Plan and execute a multi-agent Argon + Flash run to wire Walrus Console bucket 217e53fc-36ff-4d1b-8834-04f69c2ef553.",
      targetFiles:
        ".agents/teamwork/DISPATCH.md, server/consoleGateway.mjs, src/lib/api.ts",
      verificationCmd: "node scripts/verify-e2e-console-rules.mjs",
      phase1Base:
        "Initialize .agents/teamwork/{ORIGINAL_REQUEST,BRIEFING,DISPATCH}.md with disjoint file scopes.",
      phase2Base:
        "Dispatch Flash workers on disjoint implementation and test files while Argon owns gateway logic.",
      phase3Base:
        "Run empirical unit and Playwright E2E verification suite before marking DISPATCH.md DONE.",
      suggestedFacts: [
        {
          label: "+ Fact: 3-attempt circuit breaker",
          rule: "Take over directly in Gemini 4 Argon if a Flash worker hits 3 failed attempts on a task.",
          rationale: "Prevents subagent loops on complex core logic.",
          severity: "hard-rule",
        },
      ],
    },
    glimm: {
      taskPrompt:
        "Wire glimm@0.4.0 WebGL cosine-palette sweeps and GlimmScope HTML-in-Canvas card gathers into our dark-theme console.",
      targetFiles:
        "src/lib/glimmStudio.tsx, src/components/GlimmStudioBar.tsx, src/App.tsx",
      verificationCmd: "npx vitest run && npm run build",
      phase1Base:
        "Audit route transitions vs high-frequency controls and confirm single glimm/react entry point.",
      phase2Base:
        "Wrap App in GlimmProvider with OKLCH accentChain(['#10B981', '#00E5D6', '#1FC8FF']) and brightness=0.85.",
      phase3Base:
        "Verify 60fps WebGL sweeps across palettes, bandTight, and easing curves with zero console errors.",
      suggestedFacts: [
        {
          label: "+ Rule: Set brightness=0.85 on dark theme",
          rule: "Always set brightness={0.85} on GlimmProvider and GlimmScope when dark theme is active so WebGL iridescent crests never bloom white.",
          rationale: "Prevents harsh highlight clipping on dark obsidian surfaces.",
          severity: "hard-rule",
        },
        {
          label: "+ Fact: Use GlimmScope for card updates",
          rule: "Wrap single-card updates (Fact check, Bake to SKILL.md) in GlimmScope with at=[x,y] instead of firing full-viewport sweeps on minor edits.",
          rationale: "Sizes the WebGL band to the exact container that changed.",
          severity: "gotcha",
        },
      ],
    },
  };

  return (
    blueprints[skill.id] || {
      taskPrompt: `Create a fact-checked implementation plan using ${skill.name} for repository ${skill.namespace}.`,
      targetFiles: `skills/${skill.id}/SKILL.md, src/App.tsx`,
      verificationCmd: "npx vitest run && npm run build",
      phase1Base: `Load ${skill.id}.SKILL.md from Walrus Console bucket 217e53fc-36ff-4d1b-8834-04f69c2ef553 and check active Team Facts.`,
      phase2Base: `Execute ${skill.name} implementation steps while enforcing all active Team Rules.`,
      phase3Base: `Run automated unit and integration tests (npx vitest run && npm run build) before completion.`,
      suggestedFacts: [
        {
          label: `+ Fact: Pin Bucket 217e53fc…`,
          rule: `Always resolve ${skill.id}.SKILL.md from Walrus Console bucket 217e53fc-36ff-4d1b-8834-04f69c2ef553 before execution.`,
          rationale: "Guarantees every coding agent uses the canonical SEAL-encrypted skill revision.",
          severity: "hard-rule",
        },
      ],
    }
  );
}

function buildHextaStyleAgentPrompt(
  skill: HostedSkillNode,
  activeRules: FlowMemoryNode[],
  taskPrompt: string,
  blueprint: SkillPlanBlueprint
): string {
  const bucketId =
    skill.bucketId || "217e53fc-36ff-4d1b-8834-04f69c2ef553";
  const fileId =
    skill.fileId && !skill.fileId.startsWith("console-file-")
      ? skill.fileId
      : "169bbc92-08b6-4b93-99f6-82f793b9eaa0";
  const sealPolicyId =
    skill.sealPolicyId ||
    "0xddcab3487be76e5fea6f48aea0061cc39b140730634f125ac36eabcbb74ae51a";

  const rulesBlock =
    activeRules.length > 0
      ? activeRules
          .map((r, idx) => {
            const badge = getFactKindBadge(r.severity, r.rule);
            return `   3.${idx + 1}. [${badge.label} · ${badge.phaseShort}] ${r.rule}`;
          })
          .join("\n")
      : `   3.1. No custom team facts active (using base ${skill.id}.SKILL.md).`;

  return [
    `Add and apply the "${skill.name}" skill from Walrus Console to build and execute a fact-checked plan.`,
    ``,
    `1. Configure Walrus Console & HextaUI registries in components.json / .mcp.json:`,
    `   {`,
    `     "walrusConsole": {`,
    `       "bucketId": "${bucketId}",`,
    `       "fileId": "${fileId}",`,
    `       "sealPolicyId": "${sealPolicyId}"`,
    `     }`,
    `   }`,
    `2. Pull SEAL-encrypted "${skill.id}.SKILL.md" (rev ${skill.rev ?? 1}) from Walrus Console:`,
    `   npx -y @mysten-incubation/walrus-console-mcp download --bucket ${bucketId} --file ${fileId} --out .agents/skills/${skill.id}/SKILL.md`,
    `3. Enforce ${activeRules.length} Team Facts recalled from Walrus Memory namespace "${skill.namespace}":`,
    rulesBlock,
    `4. Execute the 3-Phase Fact-Checked Plan on (${blueprint.targetFiles}):`,
    `   Task: "${taskPrompt}"`,
    `   1. Phase 1 (Scope Gate): ${blueprint.phase1Base}`,
    `   2. Phase 2 (Execution): ${blueprint.phase2Base}`,
    `   3. Phase 3 (Verification): Run \`${blueprint.verificationCmd}\``,
  ].join("\n");
}

function buildPlaygroundMarkdownOutput(
  skill: HostedSkillNode,
  allSkillFlows: FlowMemoryNode[],
  activeRules: FlowMemoryNode[],
  taskPrompt: string,
  blueprint: SkillPlanBlueprint,
  latencyMs: number
): string {
  const fileId =
    skill.fileId && !skill.fileId.startsWith("console-file-")
      ? skill.fileId
      : "169bbc92-08b6-4b93-99f6-82f793b9eaa0";

  const factRows =
    allSkillFlows.length > 0
      ? allSkillFlows
          .map((f) => {
            const isOn = f.state !== "off";
            const badge = getFactKindBadge(f.severity, f.rule);
            return `| **${badge.label}** | ${f.rule} [2] | ${badge.phaseShort} | ${
              isOn ? "ENFORCED" : "BYPASSED (OFF)"
            } |`;
          })
          .join("\n")
      : `| **BASE** | Base \`${skill.id}.SKILL.md\` only | All Phases | Add a rule on the left |`;

  return [
    `# Fact-Checked Plan: \`${skill.name}\``,
    ``,
    `> [!IMPORTANT]`,
    `> Checked **${activeRules.length}/${allSkillFlows.length} active Team Facts** from Walrus Memory [2] and **\`${skill.id}.SKILL.md\`** (\`rev ${skill.rev ?? 1}\`, file \`${fileId.slice(0, 8)}…\`) from Walrus Console Bucket [1] in **${latencyMs}ms**.`,
    ``,
    `## 1. Fact & Rule Compliance Matrix`,
    ``,
    `| Type | Team Fact / Rule | Gate | Status |`,
    `| :--- | :--- | :--- | :--- |`,
    factRows,
    ``,
    `## 2. Full 3-Phase Execution Plan`,
    ``,
    `1. **Phase 1 (Fact & Scope Gate)**: ${blueprint.phase1Base}`,
    `2. **Phase 2 (Implementation)**: ${blueprint.phase2Base} (\`${blueprint.targetFiles}\`).`,
    `3. **Phase 3 (Verification Gate)**: ${blueprint.phase3Base}`,
    ``,
    `\`\`\`bash title="Verification Commands"`,
    `# Task: ${taskPrompt}`,
    `${blueprint.verificationCmd}`,
    `\`\`\``,
  ].join("\n");
}

export const TrajectoryEvalHarness: React.FC<TrajectoryEvalHarnessProps> = ({
  skill,
  allSkills,
  skillFlows,
  evalCases,
  config,
  onSelectSkill,
  onHighlightFlows,
  onAddFlowMemory,
  onToggleRuleState,
  onUpdateFlowMemory,
  onBakeRuleIntoSkill,
  onDeleteFlow,
}) => {
  const activeRules = useMemo(
    () => skillFlows.filter((f) => f.state !== "off" && f.state !== "deleted"),
    [skillFlows]
  );

  const blueprint = useMemo(() => getSkillPlanBlueprint(skill), [skill]);
  const story = useMemo(() => getSkillUseCaseStory(skill), [skill]);

  const [promptInput, setPromptInput] = useState(blueprint.taskPrompt);
  const [rightTab, setRightTab] = useState<"plan" | "prompt" | "markdown">(
    "plan"
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [recallState, setRecallState] = useState<
    "idle" | "saving" | "saved" | "failed"
  >("idle");
  const [latencyMs, setLatencyMs] = useState<number>(34);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const [newRuleText, setNewRuleText] = useState("");
  const [newRuleRationale, setNewRuleRationale] = useState("");
  const [newRuleSeverity, setNewRuleSeverity] =
    useState<FlowMemoryNode["severity"]>("hard-rule");
  const [showFactBuilder, setShowFactBuilder] = useState(false);
  const [addingRuleState, setAddingRuleState] = useState<
    "idle" | "saving" | "saved"
  >("idle");
  const [lastAddedToast, setLastAddedToast] = useState<string | null>(null);
  const ruleInputRef = useRef<HTMLInputElement>(null);
  const planScopeRef = useRef<GlimmScopeHandle>(null);
  const {
    activePalette,
    bandTight,
    direction,
    brightness,
    triggerPageSweep,
  } = useGlimmStudio();

  const isReadOnly = config.accessRole === "read-only";

  useEffect(() => {
    setPromptInput(blueprint.taskPrompt);
    setRecallState("idle");
    setShowFactBuilder(false);
  }, [skill.id, blueprint.taskPrompt]);

  const skillOptions = useMemo(
    () =>
      allSkills.map((s) => ({
        value: s.id,
        label: s.name,
        meta: s.category.split(" ")[0],
      })),
    [allSkills]
  );

  const featuredSkills = useMemo(
    () =>
      FEATURED_SKILL_IDS.map((id) => allSkills.find((s) => s.id === id)).filter(
        Boolean
      ) as HostedSkillNode[],
    [allSkills]
  );

  const availableSuggestions = useMemo(
    () =>
      blueprint.suggestedFacts.filter(
        (sug) =>
          !skillFlows.some(
            (f) => f.rule.toLowerCase().trim() === sug.rule.toLowerCase().trim()
          )
      ),
    [blueprint.suggestedFacts, skillFlows]
  );

  const hextaPromptText = useMemo(
    () => buildHextaStyleAgentPrompt(skill, activeRules, promptInput, blueprint),
    [skill, activeRules, promptInput, blueprint]
  );

  const playgroundMarkdown = useMemo(
    () =>
      buildPlaygroundMarkdownOutput(
        skill,
        skillFlows,
        activeRules,
        promptInput,
        blueprint,
        latencyMs
      ),
    [skill, skillFlows, activeRules, promptInput, blueprint, latencyMs]
  );

  const markdownSources = useMemo<Source[]>(
    () => [
      {
        id: "1",
        title: `Walrus Console · ${skill.id}.SKILL.md`,
        url: "https://console.walrus.xyz/buckets/?b=217e53fc-36ff-4d1b-8834-04f69c2ef553",
      },
      {
        id: "2",
        title: `Walrus Memory · ${skill.namespace} (${activeRules.length} rules)`,
        url: `https://walruscan.com/mainnet/blob/${activeRules[0]?.blobId || skill.blobId}`,
      },
    ],
    [skill.id, skill.namespace, skill.blobId, activeRules]
  );

  const handleCopyPrompt = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(hextaPromptText);
    }
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 1800);
  };

  const handleRunFactCheck = async () => {
    setRecallState("saving");
    setIsStreaming(true);
    const t0 = performance.now();
    onHighlightFlows?.(
      activeRules.map((f) => f.id),
      true
    );
    try {
      const res = await fetch(
        `/api/ns/${encodeURIComponent(config.namespace)}/rules?skill=${encodeURIComponent(skill.id)}`
      );
      if (!res.ok && hasLiveCredentials(config)) {
        const client = createMemWalClient(config);
        await client.recall(`${skill.name} ${promptInput}`, 5);
      }
      const elapsed = Math.max(18, Math.round(performance.now() - t0));
      planScopeRef.current?.play({
        change: () => {
          setLatencyMs(elapsed);
          setRecallState("saved");
        },
      });
      setTimeout(() => setRecallState("idle"), 1600);
    } catch {
      planScopeRef.current?.play({
        change: () => {
          setRecallState("saved");
        },
      });
      setTimeout(() => setRecallState("idle"), 1400);
    } finally {
      setTimeout(() => setIsStreaming(false), 700);
      setTimeout(() => onHighlightFlows?.([], false), 800);
    }
  };

  const commitNewFactOrRule = async (
    ruleText: string,
    rationaleText?: string,
    severityVal: FlowMemoryNode["severity"] = "hard-rule"
  ) => {
    const clean = ruleText.trim();
    if (!clean || isReadOnly) return;
    setAddingRuleState("saving");
    try {
      await onAddFlowMemory({
        skillId: skill.id,
        rule: clean,
        rationale:
          rationaleText?.trim() ||
          `Enforced in ${skill.name} Plan & Fact Check`,
        severity: severityVal,
        linkedSkills: [],
      });
      setNewRuleText("");
      setNewRuleRationale("");
      setShowFactBuilder(false);
      planScopeRef.current?.play({
        change: () => {
          setAddingRuleState("saved");
          setLastAddedToast(`Added Fact to ${skill.name} Plan!`);
        },
      });
      setTimeout(() => setLastAddedToast(null), 2600);
    } finally {
      setTimeout(() => setAddingRuleState("idle"), 1400);
    }
  };

  const handleAddButtonClick = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isReadOnly) return;
    const clean = newRuleText.trim();
    if (clean) {
      await commitNewFactOrRule(clean, newRuleRationale, newRuleSeverity);
      return;
    }
    const nextSug = availableSuggestions[0] || blueprint.suggestedFacts[0];
    if (!showFactBuilder && nextSug) {
      setNewRuleText(nextSug.rule);
      setNewRuleRationale(nextSug.rationale);
      setNewRuleSeverity(nextSug.severity);
      setShowFactBuilder(true);
      setTimeout(() => {
        ruleInputRef.current?.focus();
        ruleInputRef.current?.select();
      }, 40);
    } else {
      setShowFactBuilder((v) => !v);
      setTimeout(() => ruleInputRef.current?.focus(), 40);
    }
  };

  const currentDiffCase = useMemo<TrajectoryEvalCase>(() => {
    if (evalCases[0]) return evalCases[0];
    return {
      id: `${skill.id}-playground`,
      skillId: skill.id,
      namespace: skill.namespace,
      title: skill.name,
      taskPrompt: promptInput,
      recalledFlowIds: activeRules.map((r) => r.id),
      thinkTrace: [
        `$ memwal_recall --ns ${skill.namespace} --skill ${skill.name}`,
        `→ Applied ${activeRules.length} active team rule(s) in ${latencyMs}ms`,
      ],
      coldAgentOutput: {
        verdict: "FAIL / STALE RULE",
        action: story.withoutSummary,
        explanation: "Static SKILL.md without Walrus Memory team rules.",
      },
      recallAgentOutput: {
        verdict: "PASS · WALRUS RECALL",
        action: story.withSummary,
        explanation: "Recalled live team rules from Walrus Memory.",
        appliedBlobs: activeRules.map((r) => r.blobId),
      },
    };
  }, [evalCases, skill.id, skill.namespace, skill.name, promptInput, activeRules, latencyMs, story]);

  const handleToggleAllFactsForProof = async () => {
    if (isReadOnly || !onToggleRuleState || skillFlows.length === 0) return;
    const targetState: "on" | "off" = activeRules.length > 0 ? "off" : "on";
    for (const f of skillFlows) {
      if ((f.state !== "off") !== (targetState === "on")) {
        await onToggleRuleState(f.id, targetState);
      }
    }
    planScopeRef.current?.play({
      change: () => {
        setLastAddedToast(
          targetState === "off"
            ? `Simulated Failure: Turned OFF ${skillFlows.length} Walrus Facts.`
            : `Restored Walrus Fix: Turned ON ${skillFlows.length} Walrus Facts!`
        );
      },
    });
    triggerPageSweep(undefined, {
      palette: targetState === "off" ? PALETTES.ember : activePalette,
      direction: targetState === "off" ? "rtl" : "ltr",
      sweepMs: 680,
      label: targetState === "off" ? "simulate:fail" : "restore:fix",
    });
    setTimeout(() => setLastAddedToast(null), 2600);
  };

  return (
    <div className="space-y-3" data-testid="demo-essential-zones">
      {/* ====================================================================
          SINGLE-ROW TOP SWITCHBOARD: 5 USE-CASE PILLS + GLIMM ORBS + CHECK PLAN
         ==================================================================== */}
      <section
        data-testid="hackathon-story-banner"
        className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-neutral-200/90 bg-white px-3 py-2 shadow-2xs dark:border-white/10 dark:bg-[#111514]"
      >
        <div className="flex max-w-full items-center gap-1 overflow-x-auto">
          {featuredSkills.map((s, idx) => {
            const active = s.id === skill.id;
            const useCaseShortLabels: Record<string, string> = {
              "memwal-qa": "1. PR Gate",
              "ui-ux-qa": "2. Visual Proof",
              "concise-ui-copy": "3. Microcopy",
              boost: "4. Agent Swarm",
              glimm: "5. WebGL Sweeps",
            };
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectSkill?.(s.id)}
                className={cx(
                  "h-8 shrink-0 cursor-pointer rounded-xl px-2 font-mono text-[11px] font-semibold transition",
                  active
                    ? "bg-neutral-900 text-white shadow-2xs dark:bg-emerald-500 dark:text-neutral-950"
                    : "bg-neutral-100/90 text-neutral-600 hover:bg-neutral-200/70 dark:bg-white/[0.05] dark:text-neutral-300 dark:hover:bg-white/10"
                )}
              >
                {useCaseShortLabels[s.id] || `${idx + 1}. ${s.name}`}
              </button>
            );
          })}
          <SmoothDropdown
            testId="demo-skill-dropdown"
            prefixLabel={`ALL ${allSkills.length}`}
            value={skill.id}
            options={skillOptions}
            onChange={(nextId) => onSelectSkill?.(nextId)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <GlimmStudioBar
            activeSkillId={skill.id}
            onSelectGlimmSkill={() => onSelectSkill?.("glimm")}
            onTriggerCardScope={(at) => {
              planScopeRef.current?.play({
                at,
                change: () => {
                  setLatencyMs((prev) => (prev === 34 ? 28 : 34));
                },
              });
            }}
          />

          <button
            type="button"
            onClick={() => setShowDiffModal((v) => !v)}
            className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-xl border border-neutral-200/80 bg-white px-2 font-mono text-[11px] font-medium text-neutral-600 hover:bg-neutral-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-neutral-300"
          >
            <FileDiff className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden xl:inline">Diff</span>
          </button>

          <SaveButton
            testId="run-live-recall-btn"
            state={recallState}
            idleLabel="Check Plan"
            savingLabel="Checking…"
            savedLabel={`${latencyMs}ms ✓`}
            icon={<Play className="size-3.5 fill-current" />}
            onClick={() => void handleRunFactCheck()}
          />
        </div>
      </section>

      {showDiffModal && (
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xs dark:border-white/10 dark:bg-[#111514]">
          <PierreDiffViewer
            skill={skill}
            currentCase={currentDiffCase}
            activeFlowObjects={activeRules}
            activeCallerProfile={resolveDelegateProfile(config.memberHandle)}
            accountId={config.accountId}
          />
        </div>
      )}

      {/* ====================================================================
          2-COLUMN WORKBENCH:
          LEFT (380px) = 1. TEAM RULES & PROJECT FACTS (FULL-WIDTH ROWS)
          RIGHT (1fr)  = 2. WITHOUT VS WITH MEMWAL TERMINAL PROOF + 3-PHASE PLAN
         ==================================================================== */}
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[380px_minmax(0,1fr)]">
        {/* LEFT COLUMN: 1. TEAM FACTS & RULES SWITCHBOARD */}
        <section
          data-testid="demo-rules-strip"
          className="flex flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-3.5 shadow-2xs dark:border-white/10 dark:bg-[#111514]"
        >
          <div>
            <div className="flex items-center justify-between gap-2 border-b border-neutral-100 pb-2.5 dark:border-white/8">
              <div className="flex items-center gap-2">
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-neutral-900 font-mono text-[10px] font-bold text-white dark:bg-emerald-500 dark:text-neutral-950">
                  1
                </span>
                <h2 className="font-mono text-xs font-bold tracking-wider text-neutral-900 uppercase dark:text-white">
                  Team Rules &amp; Facts
                </h2>
              </div>
              <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                {activeRules.length}/{skillFlows.length} ACTIVE
              </span>
            </div>

            {lastAddedToast && (
              <div
                data-testid="rule-added-toast"
                className="mt-2.5 flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/12 px-3 py-1.5 font-mono text-[11px] font-semibold text-emerald-800 dark:text-emerald-200"
              >
                <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
                <span>{lastAddedToast}</span>
              </div>
            )}

            {/* ADD RULE / FACT FORM AT TOP OF CARD */}
            <form
              onSubmit={(e) => void handleAddButtonClick(e)}
              className="mt-2.5 space-y-2 rounded-xl border border-neutral-200/80 bg-neutral-50/70 p-2.5 dark:border-white/10 dark:bg-white/[0.02]"
            >
              <div className="flex items-center gap-2">
                <input
                  ref={ruleInputRef}
                  type="text"
                  data-testid="demo-add-rule-input"
                  disabled={isReadOnly}
                  value={newRuleText}
                  onChange={(e) => setNewRuleText(e.target.value)}
                  placeholder={
                    isReadOnly
                      ? "Read-Only session"
                      : `Add rule for ${skill.name}…`
                  }
                  className="h-8 min-w-0 flex-1 rounded-xl border border-neutral-200/90 bg-white px-3 text-xs text-neutral-900 outline-none focus:border-emerald-500 dark:border-white/12 dark:bg-black/40 dark:text-white"
                />
                <SaveButton
                  testId="demo-add-rule-btn"
                  state={addingRuleState}
                  disabled={isReadOnly}
                  idleLabel={newRuleText.trim() ? "Save Fact" : "Add"}
                  savingLabel="Saving…"
                  savedLabel="Added ✓"
                  icon={<Plus className="size-3.5" />}
                  onClick={() => void handleAddButtonClick()}
                />
              </div>

              {showFactBuilder && (
                <div
                  data-testid="expanded-fact-builder"
                  className="space-y-2 rounded-xl border border-emerald-500/35 bg-emerald-500/[0.06] p-2.5 dark:bg-emerald-950/30"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold text-emerald-800 uppercase dark:text-emerald-300">
                      Rule Kind
                    </span>
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
                  </div>
                  <input
                    type="text"
                    value={newRuleRationale}
                    onChange={(e) => setNewRuleRationale(e.target.value)}
                    placeholder="Optional rationale for Plan check…"
                    className="h-7 w-full rounded-lg border border-neutral-200/90 bg-white px-2.5 text-[11px] text-neutral-800 outline-none focus:border-emerald-500 dark:border-white/12 dark:bg-black/40 dark:text-neutral-200"
                  />
                </div>
              )}

              {!isReadOnly && availableSuggestions.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 pt-0.5">
                  {availableSuggestions.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      data-testid={`quick-suggest-fact-${i}`}
                      onClick={() =>
                        void commitNewFactOrRule(
                          sug.rule,
                          sug.rationale,
                          sug.severity
                        )
                      }
                      className="cursor-pointer rounded-lg border border-emerald-500/30 bg-emerald-500/[0.08] px-2 py-0.5 text-left font-mono text-[10px] font-medium text-emerald-800 transition hover:bg-emerald-500/18 dark:text-emerald-300"
                    >
                      {sug.label}
                    </button>
                  ))}
                </div>
              )}
            </form>

            {/* FULL-WIDTH RULE CARDS (Never squeezed into a narrow side column!) */}
            <div className="mt-2.5 space-y-2">
              {skillFlows.length === 0 ? (
                <p className="py-4 text-xs text-neutral-500">
                  No rules for {skill.name} yet. Click a suggestion or + Add above.
                </p>
              ) : (
                skillFlows.map((flow) => {
                  const isOn = flow.state !== "off";
                  const badge = getFactKindBadge(flow.severity, flow.rule);
                  return (
                    <div
                      key={flow.id}
                      data-testid={`demo-rule-row-${flow.id}`}
                      className={cx(
                        "rounded-xl border p-2.5 transition",
                        isOn
                          ? "border-emerald-500/35 bg-emerald-500/[0.04] dark:border-emerald-500/30 dark:bg-emerald-500/[0.06]"
                          : "border-amber-500/30 bg-amber-500/[0.03] opacity-75 dark:border-amber-500/20 dark:bg-amber-500/[0.03]"
                      )}
                    >
                      {/* Row 1: Kind Badge + Phase Gate on Left, Bake + Toggle + Delete on Right */}
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span
                            className={cx(
                              "shrink-0 rounded px-1.5 py-0.5 font-mono text-[9.5px] font-bold uppercase",
                              badge.tone
                            )}
                          >
                            {badge.label}
                          </span>
                          <span className="truncate font-mono text-[10px] text-neutral-500 dark:text-neutral-400">
                            {badge.phaseShort}
                          </span>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                          {!isReadOnly && onBakeRuleIntoSkill && isOn && (
                            <button
                              type="button"
                              title="Bake this Fact permanently into SKILL.md on Walrus Console (rev N+1)"
                              onClick={async () => {
                                await onBakeRuleIntoSkill(flow.id, skill.id);
                                setLastAddedToast(
                                  `Baked Fact into ${skill.name}.SKILL.md (rev ${(skill.rev ?? 1) + 1})!`
                                );
                                setTimeout(() => setLastAddedToast(null), 3000);
                              }}
                              className="inline-flex cursor-pointer items-center gap-0.5 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[9.5px] font-semibold text-emerald-800 hover:bg-emerald-500/20 dark:text-emerald-300"
                            >
                              <ArrowUpRight className="size-2.5" />
                              <span>Bake</span>
                            </button>
                          )}
                          <SorbetSwitch
                            on={isOn}
                            disabled={isReadOnly}
                            labelId={`demo-rule-${flow.id}`}
                            onToggle={() => {
                              void onToggleRuleState?.(
                                flow.id,
                                isOn ? "off" : "on"
                              );
                            }}
                          />
                          {!isReadOnly && onDeleteFlow && (
                            <button
                              type="button"
                              title="Delete rule"
                              onClick={() => onDeleteFlow(flow.id)}
                              className="inline-flex size-6 cursor-pointer items-center justify-center rounded-md text-neutral-400 transition hover:bg-rose-500/10 hover:text-rose-600"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Row 2: 100% Full-Width Rule Text */}
                      <div className={isOn ? "w-full" : "w-full line-through opacity-60"}>
                        <InlineRuleEdit
                          value={flow.rule}
                          disabled={isReadOnly}
                          onSave={async (nextText) => {
                            await onUpdateFlowMemory?.(
                              flow.id,
                              nextText,
                              flow.rationale
                            );
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: 2. WITHOUT VS WITH MEMWAL TERMINAL PROOF + 3-PHASE PLAN */}
        <GlimmScope
          ref={planScopeRef}
          palette={activePalette}
          bandTight={Math.max(16, bandTight)}
          direction={direction}
          curve={0.12}
          sweepMs={980}
          brightness={brightness}
          pageEffect={false}
          style={{ borderRadius: "16px" }}
        >
          <section
            data-testid="skill-prompt-playground-card"
            className="flex flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white shadow-2xs dark:border-white/10 dark:bg-[#111514]"
          >
            {/* Card Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200/80 px-4 py-2.5 dark:border-white/10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-neutral-900 font-mono text-[10px] font-bold text-white dark:bg-emerald-500 dark:text-neutral-950">
                  2
                </span>
                <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white">
                  {skill.name}
                </span>
                <span
                  className={cx(
                    "rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold",
                    activeRules.length > 0
                      ? "bg-emerald-500/12 text-emerald-800 dark:text-emerald-300"
                      : "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                  )}
                >
                  {activeRules.length}/{skillFlows.length} Facts Enforced · rev{" "}
                  {skill.rev ?? 1}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <DiscreteTabs
                  layoutId="prompt-playground-mode-tabs"
                  size="sm"
                  activeId={rightTab}
                  onChange={(id) =>
                    setRightTab(id as "plan" | "prompt" | "markdown")
                  }
                  items={[
                    { id: "plan", label: "Plan & Proof" },
                    { id: "prompt", label: "Agent Prompt" },
                    { id: "markdown", label: "SKILL.md" },
                  ]}
                />

                <button
                  type="button"
                  data-testid="copy-hexta-prompt-btn"
                  onClick={handleCopyPrompt}
                  className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-600 px-3 font-mono text-xs font-bold text-white transition hover:bg-emerald-500"
                >
                  {copiedPrompt ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  <span>{copiedPrompt ? "Copied" : "Copy Prompt"}</span>
                </button>
              </div>
            </div>

            {/* Interactive Task Input Bar + Simulate Failure Toggle */}
            <div className="flex flex-wrap items-center gap-2 border-b border-neutral-100 bg-neutral-50/70 px-4 py-2 dark:border-white/8 dark:bg-white/[0.02]">
              <Terminal className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <input
                type="text"
                aria-label="Task prompt for skill"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleRunFactCheck();
                  }
                }}
                className="min-w-0 flex-1 bg-transparent font-mono text-xs text-neutral-900 outline-none dark:text-neutral-100"
              />
              {!isReadOnly && skillFlows.length > 0 && (
                <button
                  type="button"
                  data-testid="playground-simulate-toggle-btn"
                  onClick={() => void handleToggleAllFactsForProof()}
                  className={cx(
                    "h-7 shrink-0 cursor-pointer rounded-lg border px-2.5 font-mono text-[10.5px] font-bold transition",
                    activeRules.length > 0
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-800 hover:bg-amber-500/20 dark:text-amber-300"
                      : "border-emerald-500/50 bg-emerald-500 text-neutral-950 hover:bg-emerald-400"
                  )}
                >
                  {activeRules.length > 0
                    ? "⚡ Simulate Failure"
                    : "⚡ Restore Fix"}
                </button>
              )}
              <button
                type="button"
                onClick={() => void handleRunFactCheck()}
                className="inline-flex h-7 shrink-0 cursor-pointer items-center gap-1 rounded-lg bg-neutral-900 px-2.5 font-mono text-[11px] font-semibold text-white hover:bg-neutral-800 dark:bg-emerald-500 dark:text-neutral-950"
              >
                <Play className="size-3 fill-current" />
                <span>Verify</span>
              </button>
            </div>

            {/* TAB 1 (DEFAULT): WITHOUT VS WITH MEMWAL TERMINAL CARDS + 3-PHASE PLAN */}
            {rightTab === "plan" && (
              <div
                className="space-y-3 p-3.5"
                data-testid="full-plan-fact-inspector"
              >
                {/* SIDE-BY-SIDE WITHOUT MEMWAL VS WITH MEMWAL TERMINAL CARDS */}
                <div
                  data-testid="playground-usecase-proof-strip"
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                >
                  {/* LEFT CARD: WITHOUT MEMWAL */}
                  <div
                    className={cx(
                      "flex flex-col justify-between rounded-2xl border p-3.5 transition",
                      activeRules.length === 0
                        ? "border-amber-500/55 bg-amber-500/[0.06] dark:border-amber-500/45 dark:bg-[#16130e]"
                        : "border-neutral-200/80 bg-neutral-50/70 opacity-85 dark:border-white/10 dark:bg-[#0d1110]"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="size-3.5" />
                          <span>Without MemWal</span>
                        </span>
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/12 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-700 dark:text-amber-300">
                          Static SKILL.md
                        </span>
                      </div>

                      <p className="mt-2 text-sm font-bold leading-snug text-neutral-900 dark:text-white">
                        {story.withoutSummary}
                      </p>
                    </div>

                    <div className="mt-2.5 rounded-xl border border-neutral-200/80 bg-neutral-950 px-3 py-2 font-mono text-[11px] leading-relaxed dark:border-white/8 dark:bg-black/65">
                      <div className="truncate text-neutral-400">
                        $ agent run {skill.id} --static-only
                      </div>
                      <div className="truncate font-bold text-amber-400">
                        → Verdict: {story.withoutVerdict}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT CARD: WITH MEMWAL */}
                  <div
                    className={cx(
                      "flex flex-col justify-between rounded-2xl border p-3.5 transition",
                      activeRules.length > 0
                        ? "border-emerald-500/55 bg-emerald-500/[0.06] dark:border-emerald-500/45 dark:bg-[#0c1714]"
                        : "border-neutral-200/80 bg-neutral-50/70 opacity-60 dark:border-white/10 dark:bg-[#0d1110]"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="size-3.5" />
                          <span>With MemWal</span>
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                          +{activeRules.length} Active · {latencyMs}ms
                        </span>
                      </div>

                      <p className="mt-2 text-sm font-bold leading-snug text-neutral-900 dark:text-white">
                        {story.withSummary}
                      </p>
                    </div>

                    <div className="mt-2.5 rounded-xl border border-emerald-500/20 bg-neutral-950 px-3 py-2 font-mono text-[11px] leading-relaxed dark:border-emerald-500/15 dark:bg-black/65">
                      <div className="truncate text-neutral-400">
                        $ memwal_recall --ns {skill.namespace} --skill {skill.id}
                      </div>
                      <div className="truncate font-bold text-emerald-400">
                        → Verdict: {story.withVerdict}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3-PHASE FACT-CHECKED EXECUTION PLAN (Compact, scannable above the fold) */}
                <div className="rounded-2xl border border-neutral-200/90 bg-neutral-50/60 p-3 dark:border-white/10 dark:bg-black/25">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold tracking-wider text-neutral-800 uppercase dark:text-neutral-200">
                      3-Phase Fact-Checked Plan ({skill.name})
                    </span>
                    <span className="font-mono text-[10.5px] text-emerald-700 dark:text-emerald-400">
                      Target: {blueprint.targetFiles}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {(
                      [
                        {
                          num: 1 as const,
                          title: "Phase 1 · Scope & Fact Gate",
                          base: blueprint.phase1Base,
                        },
                        {
                          num: 2 as const,
                          title: "Phase 2 · Implementation",
                          base: blueprint.phase2Base,
                        },
                        {
                          num: 3 as const,
                          title: "Phase 3 · Verification Gate",
                          base: `${blueprint.phase3Base} (${blueprint.verificationCmd})`,
                        },
                      ] as const
                    ).map((phase) => {
                      const phaseFlows = skillFlows.filter(
                        (f) => getFactKindBadge(f.severity, f.rule).phaseNum === phase.num
                      );
                      return (
                        <div
                          key={phase.num}
                          className="rounded-xl border border-neutral-200/70 bg-white px-3 py-2 text-xs dark:border-white/8 dark:bg-white/[0.03]"
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <div>
                              <span className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                                {phase.title}:{" "}
                              </span>
                              <span className="text-neutral-800 dark:text-neutral-200">
                                {phase.base}
                              </span>
                            </div>
                          </div>

                          {phaseFlows.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {phaseFlows.map((pf) => {
                                const isOn = pf.state !== "off";
                                return (
                                  <span
                                    key={pf.id}
                                    className={cx(
                                      "inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 font-mono text-[10px] font-medium",
                                      isOn
                                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                                        : "border-amber-500/30 bg-amber-500/10 text-amber-800 line-through opacity-75 dark:text-amber-300"
                                    )}
                                  >
                                    {isOn ? (
                                      <ShieldCheck className="size-3 shrink-0 text-emerald-500" />
                                    ) : (
                                      <AlertTriangle className="size-3 shrink-0 text-amber-500" />
                                    )}
                                    <span>{pf.rule}</span>
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: HEXTAUI-STYLE NUMBERED AGENT PROMPT RECIPE */}
            {rightTab === "prompt" && (
              <div className="p-3.5">
                <div className="rounded-xl border border-neutral-200/90 bg-neutral-950 p-3.5 font-mono text-xs leading-relaxed text-neutral-100 shadow-inner dark:border-white/10">
                  <pre className="overflow-x-auto whitespace-pre-wrap break-words">
                    {hextaPromptText}
                  </pre>
                </div>
              </div>
            )}

            {/* TAB 3: HEXTAUI PRO <MARKDOWN /> PREVIEW */}
            {rightTab === "markdown" && (
              <div className="p-3.5">
                <Markdown
                  text={playgroundMarkdown}
                  streaming={isStreaming}
                  smooth
                  sources={markdownSources}
                  size="sm"
                  anchors
                  title={`${skill.name} · Fact-Checked Plan`}
                  badge={`Bucket 217e53fc… · ${latencyMs}ms`}
                  showToolbar
                  showDemoControls={false}
                  enableTextReveal={false}
                  maxHeightClass="max-h-[420px]"
                />
              </div>
            )}

            {/* Compact Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 bg-neutral-50/50 px-4 py-2 text-[11px] text-neutral-600 dark:border-white/8 dark:bg-white/[0.02] dark:text-neutral-400">
              <div className="flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>
                  Bucket 217e53fc… · SEAL Policy 0xddca…e51a · {activeRules.length}/{skillFlows.length} Facts Active
                </span>
              </div>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => void handleAddButtonClick()}
                  className="cursor-pointer font-mono text-[11px] font-bold text-emerald-700 hover:underline dark:text-emerald-300"
                >
                  + Add Fact to Plan →
                </button>
              )}
            </div>
          </section>
        </GlimmScope>
      </div>
    </div>
  );
};
export default TrajectoryEvalHarness;
