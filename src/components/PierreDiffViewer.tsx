import React, { useMemo, useState } from "react";
import type {
  FlowMemoryNode,
  HostedSkillNode,
  TrajectoryEvalCase,
} from "../types";
import {
  resolveDelegateProfile,
  type DelegateProfileInfo,
} from "../lib/memwalBridge";

interface PierreDiffViewerProps {
  skill: HostedSkillNode;
  currentCase: TrajectoryEvalCase;
  activeFlowObjects: FlowMemoryNode[];
  activeCallerProfile: DelegateProfileInfo;
  accountId?: string;
  defaultViewMode?: "split" | "unified";
}

interface DiffTokenSpan {
  text: string;
  emphasized?: boolean;
}

interface DiffLinePair {
  id: string;
  oldLineNumber?: number;
  newLineNumber?: number;
  type: "context" | "modification" | "addition" | "deletion";
  oldTokens?: DiffTokenSpan[];
  newTokens?: DiffTokenSpan[];
  annotation?: {
    title: string;
    blobId: string;
    severity: string;
    authorProfile: DelegateProfileInfo;
    callerProfile: DelegateProfileInfo;
    similarityScore: number;
  };
}

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

/**
 * Authentic `@pierre/diffs` (https://diffs.com/) FileDiff Viewer
 * Implements:
 * - `[data-diffs-header]` with `diffs-icon-symbol-modified`, diffstat `+N -M` & 5-block bar
 * - Split (side-by-side) vs Unified view mode toggle (`diffs-icon-diff-split` / `diffs-icon-diff-unified`)
 * - 4px vertical left gutter indicator bars (`#18a46c` / `#07c480` addition, `#d52c36` / `#ff2e3f` deletion) or classic `+`/`-`
 * - Diagonal hatch buffer (`repeating-linear-gradient(-45deg, ...)`) for unbalanced split rows
 * - Intra-line word-level emphasis spans (`[data-diff-span]`)
 * - Inline diff annotations (`[data-line-annotation]`) with Walrus `blob_id` & Delegate attribution
 */
export const PierreDiffViewer: React.FC<PierreDiffViewerProps> = ({
  skill,
  currentCase,
  activeFlowObjects,
  activeCallerProfile,
  accountId,
  defaultViewMode = "split",
}) => {
  const [viewMode, setViewMode] = useState<"split" | "unified">(defaultViewMode);
  const [indicatorStyle, setIndicatorStyle] = useState<"bars" | "classic">(
    "bars"
  );
  const [expandedHunks, setExpandedHunks] = useState<Record<string, boolean>>({
    skill_header: false,
    verdict_header: false,
  });
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const handleCopy = (val: string) => {
    navigator.clipboard?.writeText(val);
    setCopiedToken(val);
    setTimeout(() => setCopiedToken(null), 1500);
  };

  // Build File 1: `~/.agents/skills/<skill.id>/SKILL.md` diff lines
  const skillDiffData = useMemo(() => {
    const rawLines = skill.markdown.split("\n");
    const hiddenContextLines = rawLines.slice(0, 8).map((line, idx) => ({
      id: `ctx-top-${idx}`,
      oldLineNumber: idx + 1,
      newLineNumber: idx + 1,
      type: "context" as const,
      oldTokens: [{ text: line }],
      newTokens: [{ text: line }],
    }));

    const baseLineStart = 18;
    const lines: DiffLinePair[] = [
      {
        id: "sk-ctx-1",
        oldLineNumber: baseLineStart,
        newLineNumber: baseLineStart,
        type: "context",
        oldTokens: [{ text: "## Execution & Verification Rules" }],
        newTokens: [{ text: "## Execution & Verification Rules" }],
      },
      {
        id: "sk-ctx-2",
        oldLineNumber: baseLineStart + 1,
        newLineNumber: baseLineStart + 1,
        type: "context",
        oldTokens: [
          {
            text: `target_skill: "${skill.id}" # namespace: ${skill.namespace}`,
          },
        ],
        newTokens: [
          {
            text: `target_skill: "${skill.id}" # namespace: ${skill.namespace}`,
          },
        ],
      },
      {
        id: "sk-mod-1",
        oldLineNumber: baseLineStart + 2,
        newLineNumber: baseLineStart + 2,
        type: "modification",
        oldTokens: [
          { text: "memory_mode: " },
          { text: '"cold_static_skill_md"', emphasized: true },
          { text: " # ignores Walrus vault" },
        ],
        newTokens: [
          { text: "memory_mode: " },
          {
            text: `"walrus_flow_recall (${activeFlowObjects.length} blobs)"`,
            emphasized: true,
          },
          { text: ` # caller: ${activeCallerProfile.handle}` },
        ],
      },
      {
        id: "sk-mod-2",
        oldLineNumber: baseLineStart + 3,
        newLineNumber: baseLineStart + 3,
        type: "modification",
        oldTokens: [
          { text: "default_policy: " },
          { text: currentCase.coldAgentOutput.action, emphasized: true },
        ],
        newTokens: [
          { text: "default_policy: " },
          { text: currentCase.recallAgentOutput.action, emphasized: true },
        ],
      },
    ];

    let nextNewLine = baseLineStart + 4;
    activeFlowObjects.forEach((flow, idx) => {
      const authorProfile = resolveDelegateProfile(
        flow.authorHandle,
        accountId
      );
      lines.push({
        id: `sk-add-flow-${flow.id}`,
        oldLineNumber: undefined,
        newLineNumber: nextNewLine++,
        type: "addition",
        newTokens: [
          { text: `+ [FLOW_${idx + 1} `, emphasized: false },
          { text: flow.severity.toUpperCase(), emphasized: true },
          { text: ` blob:${flow.blobId.slice(0, 12)}…] `, emphasized: true },
          { text: flow.rule, emphasized: false },
        ],
        annotation: {
          title: `Walrus Flow Memory Override #${idx + 1}`,
          blobId: flow.blobId,
          severity: flow.severity,
          authorProfile,
          callerProfile: activeCallerProfile,
          similarityScore: Math.round((flow.similarityScore ?? 0.96) * 100),
        },
      });
    });

    lines.push({
      id: "sk-ctx-end",
      oldLineNumber: baseLineStart + 4,
      newLineNumber: nextNewLine,
      type: "context",
      oldTokens: [
        {
          text: "guard_entry: memwal::namespace_guard::assert_same_namespace_and_delegate",
        },
      ],
      newTokens: [
        {
          text: "guard_entry: memwal::namespace_guard::assert_same_namespace_and_delegate",
        },
      ],
    });

    return {
      hiddenContextLines,
      lines,
      additions: 2 + activeFlowObjects.length,
      deletions: 2,
    };
  }, [
    accountId,
    activeCallerProfile,
    activeFlowObjects,
    currentCase.coldAgentOutput.action,
    currentCase.recallAgentOutput.action,
    skill.id,
    skill.markdown,
    skill.namespace,
  ]);

  // Build File 2: `trajectory/apply_verdict.ts` (Step 5 Cold vs Recall Verdict Diff)
  const verdictDiffData = useMemo(() => {
    const hiddenContextLines: DiffLinePair[] = [
      {
        id: "v-ctx-top-1",
        oldLineNumber: 1,
        newLineNumber: 1,
        type: "context",
        oldTokens: [
          {
            text: 'import { verifyNamespaceGuard } from "@mysten-incubation/memwal";',
          },
        ],
        newTokens: [
          {
            text: 'import { verifyNamespaceGuard } from "@mysten-incubation/memwal";',
          },
        ],
      },
      {
        id: "v-ctx-top-2",
        oldLineNumber: 2,
        newLineNumber: 2,
        type: "context",
        oldTokens: [{ text: `// Scenario: ${currentCase.title}` }],
        newTokens: [{ text: `// Scenario: ${currentCase.title}` }],
      },
    ];

    const lines: DiffLinePair[] = [
      {
        id: "v-ctx-1",
        oldLineNumber: 10,
        newLineNumber: 10,
        type: "context",
        oldTokens: [
          { text: "export const trajectoryVerdict = evaluateTurn({" },
        ],
        newTokens: [
          { text: "export const trajectoryVerdict = evaluateTurn({" },
        ],
      },
      {
        id: "v-mod-verdict",
        oldLineNumber: 11,
        newLineNumber: 11,
        type: "modification",
        oldTokens: [
          { text: '  verdict: "' },
          { text: currentCase.coldAgentOutput.verdict, emphasized: true },
          { text: '",' },
        ],
        newTokens: [
          { text: '  verdict: "' },
          { text: currentCase.recallAgentOutput.verdict, emphasized: true },
          { text: '",' },
        ],
      },
      {
        id: "v-mod-action",
        oldLineNumber: 12,
        newLineNumber: 12,
        type: "modification",
        oldTokens: [
          { text: '  action: "' },
          { text: currentCase.coldAgentOutput.action, emphasized: true },
          { text: '",' },
        ],
        newTokens: [
          { text: '  action: "' },
          { text: currentCase.recallAgentOutput.action, emphasized: true },
          { text: '",' },
        ],
      },
      {
        id: "v-mod-explanation",
        oldLineNumber: 13,
        newLineNumber: 13,
        type: "modification",
        oldTokens: [
          { text: '  explanation: "' },
          {
            text: currentCase.coldAgentOutput.explanation.replace(/`/g, ""),
            emphasized: true,
          },
          { text: '",' },
        ],
        newTokens: [
          { text: '  explanation: "' },
          {
            text: currentCase.recallAgentOutput.explanation.replace(/`/g, ""),
            emphasized: true,
          },
          { text: '",' },
        ],
      },
      {
        id: "v-mod-blobs",
        oldLineNumber: 14,
        newLineNumber: 14,
        type: "modification",
        oldTokens: [
          { text: "  appliedWalrusBlobs: " },
          { text: "[] /* 0 flows (cold static) */", emphasized: true },
          { text: "," },
        ],
        newTokens: [
          { text: "  appliedWalrusBlobs: [" },
          {
            text: activeFlowObjects
              .map((f) => `"${f.blobId.slice(0, 14)}…"`)
              .join(", "),
            emphasized: true,
          },
          { text: "]," },
        ],
      },
      {
        id: "v-add-caller",
        oldLineNumber: undefined,
        newLineNumber: 15,
        type: "addition",
        newTokens: [
          { text: '  recalledByDelegate: "' },
          {
            text: `${activeCallerProfile.handle} (${activeCallerProfile.suiAddress.slice(0, 10)}…${activeCallerProfile.suiAddress.slice(-4)})`,
            emphasized: true,
          },
          { text: '",' },
        ],
      },
      {
        id: "v-ctx-end",
        oldLineNumber: 15,
        newLineNumber: 16,
        type: "context",
        oldTokens: [{ text: "});" }],
        newTokens: [{ text: "});" }],
      },
    ];

    return {
      hiddenContextLines,
      lines,
      additions: 5,
      deletions: 4,
    };
  }, [
    activeCallerProfile.handle,
    activeCallerProfile.suiAddress,
    activeFlowObjects,
    currentCase.coldAgentOutput.action,
    currentCase.coldAgentOutput.explanation,
    currentCase.coldAgentOutput.verdict,
    currentCase.recallAgentOutput.action,
    currentCase.recallAgentOutput.explanation,
    currentCase.recallAgentOutput.verdict,
    currentCase.title,
  ]);

  const totalAdditions = skillDiffData.additions + verdictDiffData.additions;
  const totalDeletions = skillDiffData.deletions + verdictDiffData.deletions;

  const renderTokens = (
    tokens: DiffTokenSpan[] | undefined,
    side: "deletion" | "addition" | "context"
  ) => {
    if (!tokens || tokens.length === 0) return null;
    return tokens.map((tok, i) => {
      if (!tok.emphasized) {
        return <span key={i}>{tok.text}</span>;
      }
      return (
        <span
          key={i}
          data-diff-span=""
          className={cx(
            "rounded-[3px] px-1 py-[1px] font-semibold",
            side === "deletion"
              ? "bg-[#d52c36]/20 text-[#9e1c24] dark:bg-[#ff2e3f]/25 dark:text-[#ff9ea6]"
              : side === "addition"
                ? "bg-[#18a46c]/20 text-[#0c6340] dark:bg-[#07c480]/25 dark:text-[#7bf5c4]"
                : ""
          )}
        >
          {tok.text}
        </span>
      );
    });
  };

  const renderAnnotationCard = (
    ann: NonNullable<DiffLinePair["annotation"]>
  ) => (
    <div
      data-line-annotation=""
      className="border-y border-emerald-600/20 bg-[#18a46c]/[0.04] px-3.5 py-2 font-mono text-[11px] dark:border-emerald-400/20 dark:bg-[#07c480]/[0.06]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex h-2 w-2 rounded-full bg-[#18a46c] dark:bg-[#07c480]" />
          <span className="font-extrabold text-neutral-900 dark:text-neutral-100">
            {ann.title}
          </span>
          <span className="rounded bg-emerald-600/15 px-1.5 py-0.5 text-[10px] font-bold text-[#0c6340] dark:text-[#7bf5c4]">
            {ann.similarityScore}% match
          </span>
          <button
            type="button"
            onClick={() => handleCopy(ann.blobId)}
            title={`Copy full Walrus blob_id: ${ann.blobId}`}
            className="inline-flex items-center gap-1 rounded border border-emerald-600/30 bg-white px-2 py-0.5 text-[10px] font-bold text-[#0c6340] shadow-2xs hover:bg-emerald-50 dark:border-emerald-400/30 dark:bg-neutral-900 dark:text-[#7bf5c4]"
          >
            <span>
              blob_id: {ann.blobId.slice(0, 14)}…{ann.blobId.slice(-5)}
            </span>
            <span>{copiedToken === ann.blobId ? "✓" : "⧉"}</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[10.5px]">
          <span className="inline-flex items-center gap-1 text-neutral-900/75 dark:text-neutral-100/75">
            <span className="text-neutral-900/50 uppercase dark:text-neutral-100/50">
              Committed:
            </span>
            <strong className="text-neutral-900 dark:text-neutral-100">
              {ann.authorProfile.handle}
            </strong>
            <code className="rounded bg-neutral-900/6 px-1 py-0.2 text-[10px] dark:bg-neutral-100/10">
              {ann.authorProfile.suiAddress.slice(0, 8)}…
              {ann.authorProfile.suiAddress.slice(-4)}
            </code>
          </span>
          <span className="inline-flex items-center gap-1 text-[#0c6340] dark:text-[#7bf5c4]">
            <span className="uppercase opacity-75">Recalled by:</span>
            <strong>{ann.callerProfile.handle}</strong>
            <code className="rounded bg-emerald-500/15 px-1 py-0.2 text-[10px]">
              {ann.callerProfile.suiAddress.slice(0, 8)}…
              {ann.callerProfile.suiAddress.slice(-4)}
            </code>
          </span>
        </div>
      </div>
    </div>
  );

  const renderFileBlock = (
    fileKey: "skill_header" | "verdict_header",
    filePath: string,
    badgeLabel: string,
    additions: number,
    deletions: number,
    hunkSignature: string,
    hiddenContextLines: DiffLinePair[],
    lines: DiffLinePair[]
  ) => {
    const isExpanded = !!expandedHunks[fileKey];
    const displayedLines = isExpanded
      ? [...hiddenContextLines, ...lines]
      : lines;

    return (
      <div
        data-diffs-file=""
        className="overflow-hidden rounded-[12px] border border-neutral-900/12 bg-white shadow-[0_1px_2px_rgb(0_0_0/0.04)] dark:border-neutral-100/12 dark:bg-[#0a0a0a]"
      >
        {/* Pierre Diffs File Header (`[data-diffs-header]`) */}
        <div
          data-diffs-header=""
          className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-900/10 bg-[#f8f8f8] px-3.5 py-2 font-mono text-[12px] dark:border-neutral-100/10 dark:bg-[#121212]"
        >
          <div className="flex min-w-0 items-center gap-2">
            {/* Pierre `diffs-icon-symbol-modified` */}
            <svg
               viewBox="0 0 16 16"
              width={15}
              height={15}
              className="shrink-0 text-[#009fff]"
              fill="currentColor"
            >
              <path d="M12 1C13.6569 1 15 2.34315 15 4V12C15 13.6569 13.6569 15 12 15H4C2.34315 15 1 13.6569 1 12V4C1 2.34315 2.34315 1 4 1H12ZM12 2.5H4C3.17157 2.5 2.5 3.17157 2.5 4V12C2.5 12.8284 3.17157 13.5 4 13.5H12C12.8284 13.5 13.5 12.8284 13.5 12V4C13.5 3.17157 12.8284 2.5 12 2.5ZM8 5.5C9.38071 5.5 10.5 6.61929 10.5 8C10.5 9.38071 9.38071 10.5 8 10.5C6.61929 10.5 5.5 9.38071 5.5 8C5.5 6.61929 6.61929 5.5 8 5.5Z" />
            </svg>
            <span className="truncate font-bold text-[#0a0a0a] dark:text-[#fafafa]">
              {filePath}
            </span>
            <span className="rounded bg-neutral-900/7 px-2 py-0.5 text-[10px] font-bold text-neutral-900/75 dark:bg-neutral-100/10 dark:text-neutral-100/75">
              {badgeLabel}
            </span>
          </div>

          {/* Pierre Diffstat (`+N -M` + 5-block bar) */}
          <div className="flex items-center gap-2 font-mono text-[11.5px] font-bold tabular-nums">
            <span className="text-[#18a46c] dark:text-[#07c480]">
              +{additions}
            </span>
            <span className="text-[#d52c36] dark:text-[#ff2e3f]">
              -{deletions}
            </span>
            <div
              className="flex items-center gap-[2px]"
              aria-label={`+${additions} -${deletions}`}
            >
              <span className="h-2 w-2 rounded-[1.5px] bg-[#18a46c] dark:bg-[#07c480]" />
              <span className="h-2 w-2 rounded-[1.5px] bg-[#18a46c] dark:bg-[#07c480]" />
              <span className="h-2 w-2 rounded-[1.5px] bg-[#18a46c] dark:bg-[#07c480]" />
              <span className="h-2 w-2 rounded-[1.5px] bg-[#d52c36] dark:bg-[#ff2e3f]" />
              <span className="h-2 w-2 rounded-[1.5px] bg-neutral-900/15 dark:bg-neutral-100/20" />
            </div>
          </div>
        </div>

        {/* Pierre Expandable Hunk Separator (`[data-separator="line-info"]`) */}
        <div
          data-separator="line-info"
          className="flex h-7 items-center border-b border-neutral-900/8 bg-neutral-900/[0.03] font-mono text-[11px] text-neutral-900/60 dark:border-neutral-100/8 dark:bg-neutral-100/[0.04] dark:text-neutral-100/60"
        >
          <button
            type="button"
            onClick={() =>
              setExpandedHunks((prev) => ({
                ...prev,
                [fileKey]: !prev[fileKey],
              }))
            }
            title={
              isExpanded
                ? "Collapse unmodified context lines"
                : `Expand ${hiddenContextLines.length} unmodified lines`
            }
            className="flex h-full w-9 shrink-0 items-center justify-center border-r border-neutral-900/8 text-neutral-900/65 transition hover:bg-neutral-900/10 hover:text-neutral-900 dark:border-neutral-100/8 dark:text-neutral-100/65 dark:hover:bg-neutral-100/10 dark:hover:text-neutral-100"
          >
            {/* Pierre `diffs-icon-expand-all` */}
            <svg viewBox="0 0 16 16" width={13} height={13} fill="currentColor">
              <path d="M7.4707 1.21899C7.7636 0.926165 8.23835 0.926141 8.53125 1.21899L11.7305 4.41919L10.6699 5.47974L8.75 3.55981V6.99927H7.25V3.56177L5.33105 5.47974L4.27051 4.41919L7.4707 1.21899Z" />
              <path d="M7.25 9V12.4375L5.33105 10.5195L4.27051 11.5801L7.4707 14.7803C7.7636 15.0731 8.23835 15.0731 8.53125 14.7803L11.7305 11.5801L10.6699 10.5195L8.75 12.4395V9H7.25Z" />
            </svg>
          </button>
          <div className="flex flex-1 items-center justify-between px-3">
            <span>
              {isExpanded
                ? `Showing ${hiddenContextLines.length} unmodified context lines`
                : `${hiddenContextLines.length} unmodified lines`}{" "}
              <span className="opacity-65">— {hunkSignature}</span>
            </span>
            <button
              type="button"
              onClick={() =>
                setExpandedHunks((prev) => ({
                  ...prev,
                  [fileKey]: !prev[fileKey],
                }))
              }
              className="text-[10.5px] font-bold text-[#009fff] hover:underline"
            >
              {isExpanded ? "Hide context" : "Expand context"}
            </button>
          </div>
        </div>

        {/* SPLIT (SIDE-BY-SIDE) VIEW (`[data-diff-type="split"]`) */}
        {viewMode === "split" ? (
          <div data-diff-type="split" className="divide-y divide-neutral-900/6 dark:divide-neutral-100/6">
            {/* Column Subheaders: Cold Static vs Walrus Recall */}
            <div className="grid grid-cols-1 border-b border-neutral-900/8 bg-neutral-900/[0.015] font-mono text-[10.5px] font-bold md:grid-cols-2 dark:border-neutral-100/8 dark:bg-neutral-100/[0.02]">
              <div className="flex items-center justify-between border-b border-neutral-900/8 px-3 py-1.5 text-[#d52c36] md:border-r md:border-b-0 dark:border-neutral-100/8 dark:text-[#ff2e3f]">
                <span>[A] Cold Static Baseline (No Recall)</span>
                <span className="rounded bg-[#d52c36]/12 px-1.5 py-0.2 text-[10px]">
                  {currentCase.coldAgentOutput.verdict}
                </span>
              </div>
              <div className="flex items-center justify-between px-3 py-1.5 text-[#18a46c] dark:text-[#07c480]">
                <span>
                  [B] Walrus Recall Compiled (+{activeFlowObjects.length} Flows)
                </span>
                <span className="rounded bg-[#18a46c]/15 px-1.5 py-0.2 text-[10px]">
                  {currentCase.recallAgentOutput.verdict}
                </span>
              </div>
            </div>

            {displayedLines.map((row) => {
              const isMod = row.type === "modification";
              const isAdd = row.type === "addition";
              const isDel = row.type === "deletion";
              const hasLeft =
                row.type === "context" || isMod || isDel;
              const hasRight =
                row.type === "context" || isMod || isAdd;

              return (
                <React.Fragment key={row.id}>
                  <div className="grid grid-cols-1 font-mono text-[12px]/[20px] md:grid-cols-2">
                    {/* LEFT PANE (Cold Baseline / Deletion) */}
                    {hasLeft ? (
                      <div
                        data-line-type={
                          isMod || isDel ? "change-deletion" : "context"
                        }
                        className={cx(
                          "relative flex min-w-0 items-stretch border-neutral-900/8 md:border-r dark:border-neutral-100/8",
                          (isMod || isDel) &&
                            "bg-[#d52c36]/[0.08] dark:bg-[#ff2e3f]/[0.11]"
                        )}
                      >
                        {/* 4px Pierre Left Bar Indicator */}
                        {indicatorStyle === "bars" && (isMod || isDel) && (
                          <span className="w-[4px] shrink-0 bg-[#d52c36] dark:bg-[#ff2e3f]" />
                        )}
                        <span
                          data-column-number=""
                          className={cx(
                            "w-9 shrink-0 select-none pr-2 text-right text-[11px] tabular-nums",
                            isMod || isDel
                              ? "text-[#d52c36] dark:text-[#ff2e3f]"
                              : "text-neutral-900/38 dark:text-neutral-100/38"
                          )}
                        >
                          {row.oldLineNumber ?? ""}
                        </span>
                        {indicatorStyle === "classic" && (
                          <span
                            className={cx(
                              "w-4 shrink-0 select-none text-center font-bold",
                              isMod || isDel
                                ? "text-[#d52c36] dark:text-[#ff2e3f]"
                                : "text-transparent"
                            )}
                          >
                            {isMod || isDel ? "-" : " "}
                          </span>
                        )}
                        <div
                          data-column-content=""
                          className="min-w-0 flex-1 break-words px-2.5 py-0.5 text-[#0a0a0a] dark:text-[#fafafa]"
                        >
                          {renderTokens(
                            row.oldTokens,
                            isMod || isDel ? "deletion" : "context"
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Pierre Diagonal Hatch Buffer (`[data-content-buffer]`) */
                      <div
                        data-content-buffer=""
                        className="hidden min-h-[24px] border-r border-neutral-900/8 bg-[repeating-linear-gradient(-45deg,transparent,transparent_4.2px,rgba(0,0,0,0.045)_4.2px,rgba(0,0,0,0.045)_5.6px)] md:block dark:border-neutral-100/8 dark:bg-[repeating-linear-gradient(-45deg,transparent,transparent_4.2px,rgba(255,255,255,0.05)_4.2px,rgba(255,255,255,0.05)_5.6px)]"
                      />
                    )}

                    {/* RIGHT PANE (Walrus Recall / Addition) */}
                    {hasRight ? (
                      <div
                        data-line-type={
                          isMod || isAdd ? "change-addition" : "context"
                        }
                        className={cx(
                          "relative flex min-w-0 items-stretch",
                          (isMod || isAdd) &&
                            "bg-[#18a46c]/[0.08] dark:bg-[#07c480]/[0.11]"
                        )}
                      >
                        {/* 4px Pierre Left Bar Indicator */}
                        {indicatorStyle === "bars" && (isMod || isAdd) && (
                          <span className="w-[4px] shrink-0 bg-[#18a46c] dark:bg-[#07c480]" />
                        )}
                        <span
                          data-column-number=""
                          className={cx(
                            "w-9 shrink-0 select-none pr-2 text-right text-[11px] tabular-nums",
                            isMod || isAdd
                              ? "text-[#18a46c] dark:text-[#07c480]"
                              : "text-neutral-900/38 dark:text-neutral-100/38"
                          )}
                        >
                          {row.newLineNumber ?? ""}
                        </span>
                        {indicatorStyle === "classic" && (
                          <span
                            className={cx(
                              "w-4 shrink-0 select-none text-center font-bold",
                              isMod || isAdd
                                ? "text-[#18a46c] dark:text-[#07c480]"
                                : "text-transparent"
                            )}
                          >
                            {isMod || isAdd ? "+" : " "}
                          </span>
                        )}
                        <div
                          data-column-content=""
                          className="min-w-0 flex-1 break-words px-2.5 py-0.5 text-[#0a0a0a] dark:text-[#fafafa]"
                        >
                          {renderTokens(
                            row.newTokens,
                            isMod || isAdd ? "addition" : "context"
                          )}
                        </div>
                      </div>
                    ) : (
                      <div
                        data-content-buffer=""
                        className="hidden min-h-[24px] bg-[repeating-linear-gradient(-45deg,transparent,transparent_4.2px,rgba(0,0,0,0.045)_4.2px,rgba(0,0,0,0.045)_5.6px)] md:block dark:bg-[repeating-linear-gradient(-45deg,transparent,transparent_4.2px,rgba(255,255,255,0.05)_4.2px,rgba(255,255,255,0.05)_5.6px)]"
                      />
                    )}
                  </div>

                  {row.annotation && renderAnnotationCard(row.annotation)}
                </React.Fragment>
              );
            })}
          </div>
        ) : (
          /* UNIFIED STACKED VIEW (`[data-diff-type="single"]`) */
          <div
            data-diff-type="single"
            className="divide-y divide-neutral-900/5 font-mono text-[12px]/[20px] dark:divide-neutral-100/5"
          >
            {displayedLines.map((row) => {
              const subRows: Array<{
                key: string;
                kind: "context" | "deletion" | "addition";
                oldNum?: number;
                newNum?: number;
                tokens?: DiffTokenSpan[];
              }> = [];

              if (row.type === "context") {
                subRows.push({
                  key: `${row.id}-ctx`,
                  kind: "context",
                  oldNum: row.oldLineNumber,
                  newNum: row.newLineNumber,
                  tokens: row.newTokens,
                });
              } else if (row.type === "modification") {
                subRows.push({
                  key: `${row.id}-del`,
                  kind: "deletion",
                  oldNum: row.oldLineNumber,
                  newNum: undefined,
                  tokens: row.oldTokens,
                });
                subRows.push({
                  key: `${row.id}-add`,
                  kind: "addition",
                  oldNum: undefined,
                  newNum: row.newLineNumber,
                  tokens: row.newTokens,
                });
              } else if (row.type === "deletion") {
                subRows.push({
                  key: `${row.id}-del`,
                  kind: "deletion",
                  oldNum: row.oldLineNumber,
                  newNum: undefined,
                  tokens: row.oldTokens,
                });
              } else if (row.type === "addition") {
                subRows.push({
                  key: `${row.id}-add`,
                  kind: "addition",
                  oldNum: undefined,
                  newNum: row.newLineNumber,
                  tokens: row.newTokens,
                });
              }

              return (
                <React.Fragment key={row.id}>
                  {subRows.map((sr) => (
                    <div
                      key={sr.key}
                      data-line-type={
                        sr.kind === "deletion"
                          ? "change-deletion"
                          : sr.kind === "addition"
                            ? "change-addition"
                            : "context"
                      }
                      className={cx(
                        "relative flex min-w-0 items-stretch",
                        sr.kind === "deletion" &&
                          "bg-[#d52c36]/[0.08] dark:bg-[#ff2e3f]/[0.11]",
                        sr.kind === "addition" &&
                          "bg-[#18a46c]/[0.08] dark:bg-[#07c480]/[0.11]"
                      )}
                    >
                      {indicatorStyle === "bars" && sr.kind !== "context" && (
                        <span
                          className={cx(
                            "w-[4px] shrink-0",
                            sr.kind === "deletion"
                              ? "bg-[#d52c36] dark:bg-[#ff2e3f]"
                              : "bg-[#18a46c] dark:bg-[#07c480]"
                          )}
                        />
                      )}
                      <span className="w-8 shrink-0 select-none pr-1.5 text-right text-[11px] tabular-nums text-neutral-900/40 dark:text-neutral-100/40">
                        {sr.oldNum ?? ""}
                      </span>
                      <span className="w-8 shrink-0 select-none pr-2 text-right text-[11px] tabular-nums text-neutral-900/40 dark:text-neutral-100/40">
                        {sr.newNum ?? ""}
                      </span>
                      {indicatorStyle === "classic" && (
                        <span
                          className={cx(
                            "w-4 shrink-0 select-none text-center font-bold",
                            sr.kind === "deletion"
                              ? "text-[#d52c36] dark:text-[#ff2e3f]"
                              : sr.kind === "addition"
                                ? "text-[#18a46c] dark:text-[#07c480]"
                                : "text-transparent"
                          )}
                        >
                          {sr.kind === "deletion"
                            ? "-"
                            : sr.kind === "addition"
                              ? "+"
                              : " "}
                        </span>
                      )}
                      <div className="min-w-0 flex-1 break-words px-2.5 py-0.5 text-[#0a0a0a] dark:text-[#fafafa]">
                        {renderTokens(sr.tokens, sr.kind)}
                      </div>
                    </div>
                  ))}
                  {row.annotation && renderAnnotationCard(row.annotation)}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      data-pierre-diffs-root=""
      className="space-y-3"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Pierre Diffs Toolbar (`@pierre/diffs` style) */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] border border-neutral-900/10 bg-[#f8f8f8] px-3.5 py-2 font-mono text-[11.5px] dark:border-neutral-100/10 dark:bg-[#121212]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-neutral-900 px-2 py-0.5 text-[10.5px] font-extrabold text-white dark:bg-neutral-100 dark:text-neutral-950">
            <span>@pierre/diffs</span>
          </span>
          <span className="font-bold text-neutral-900 dark:text-neutral-100">
            2 files changed
          </span>
          <span className="font-bold tabular-nums text-[#18a46c] dark:text-[#07c480]">
            +{totalAdditions}
          </span>
          <span className="font-bold tabular-nums text-[#d52c36] dark:text-[#ff2e3f]">
            -{totalDeletions}
          </span>
          <span className="hidden text-neutral-900/45 sm:inline dark:text-neutral-100/45">
            · Cold Static Agent vs Walrus Recall ({activeCallerProfile.handle})
          </span>
        </div>

        {/* View Mode (`Split` vs `Unified`) & Gutter Indicator (`Bars` vs `+ / -`) */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="inline-flex items-center rounded-lg border border-neutral-900/10 bg-white p-0.5 dark:border-neutral-100/10 dark:bg-neutral-900">
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={cx(
                "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold transition",
                viewMode === "split"
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950"
                  : "text-neutral-900/70 hover:text-neutral-900 dark:text-neutral-100/70 dark:hover:text-neutral-100"
              )}
            >
              {/* Pierre `diffs-icon-diff-split` */}
              <svg
                viewBox="0 0 16 16"
                width={12}
                height={12}
                fill="currentColor"
              >
                <path d="M13 1C14.1046 1 15 1.89543 15 3V13C15 14.1046 14.1046 15 13 15H3C1.89543 15 1 14.1046 1 13V3C1 1.89543 1.89543 1 3 1H13ZM13 2.5H8.75V13.5H13C13.2761 13.5 13.5 13.2761 13.5 13V3C13.5 2.72386 13.2761 2.5 13 2.5ZM7.25 2.5H3C2.72386 2.5 2.5 2.72386 2.5 3V13C2.5 13.2761 2.72386 13.5 3 13.5H7.25V2.5Z" />
              </svg>
              <span>Split</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("unified")}
              className={cx(
                "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold transition",
                viewMode === "unified"
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950"
                  : "text-neutral-900/70 hover:text-neutral-900 dark:text-neutral-100/70 dark:hover:text-neutral-100"
              )}
            >
              {/* Pierre `diffs-icon-diff-unified` */}
              <svg
                viewBox="0 0 16 16"
                width={12}
                height={12}
                fill="currentColor"
              >
                <path d="M13 1C14.1046 1 15 1.89543 15 3V13C15 14.1046 14.1046 15 13 15H3C1.89543 15 1 14.1046 1 13V3C1 1.89543 1.89543 1 3 1H13ZM13 2.5H3C2.72386 2.5 2.5 2.72386 2.5 3V7.25H13.5V3C13.5 2.72386 13.2761 2.5 13 2.5ZM2.5 13C2.5 13.2761 2.72386 13.5 3 13.5H13C13.2761 13.5 13.5 13.2761 13.5 13V8.75H2.5V13Z" />
              </svg>
              <span>Unified</span>
            </button>
          </div>

          <div className="inline-flex items-center rounded-lg border border-neutral-900/10 bg-white p-0.5 dark:border-neutral-100/10 dark:bg-neutral-900">
            <button
              type="button"
              onClick={() => setIndicatorStyle("bars")}
              className={cx(
                "rounded-md px-2 py-0.5 text-[11px] font-bold transition",
                indicatorStyle === "bars"
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950"
                  : "text-neutral-900/70 hover:text-neutral-900 dark:text-neutral-100/70 dark:hover:text-neutral-100"
              )}
            >
              Bars
            </button>
            <button
              type="button"
              onClick={() => setIndicatorStyle("classic")}
              className={cx(
                "rounded-md px-2 py-0.5 text-[11px] font-bold transition",
                indicatorStyle === "classic"
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950"
                  : "text-neutral-900/70 hover:text-neutral-900 dark:text-neutral-100/70 dark:hover:text-neutral-100"
              )}
            >
              +/-
            </button>
          </div>
        </div>
      </div>

      {/* File 2 First: `trajectory/apply_verdict.ts` (Agent Decision Diff: Cold Static vs Walrus Recall) */}
      {renderFileBlock(
        "verdict_header",
        `trajectory/apply_verdict.ts`,
        `${currentCase.coldAgentOutput.verdict} → ${currentCase.recallAgentOutput.verdict}`,
        verdictDiffData.additions,
        verdictDiffData.deletions,
        "@@ -10,6 +10,7 @@ export const trajectoryVerdict = evaluateTurn({",
        verdictDiffData.hiddenContextLines,
        verdictDiffData.lines
      )}

      {/* File 1 Second: `~/.agents/skills/<skill.id>/SKILL.md` (Compiled Skill Instructions Diff) */}
      {renderFileBlock(
        "skill_header",
        `~/.agents/skills/${skill.id}/SKILL.md`,
        `+${activeFlowObjects.length} Flow Memory Blobs`,
        skillDiffData.additions,
        skillDiffData.deletions,
        `@@ -18,5 +18,${5 + activeFlowObjects.length} @@ ## Execution & Verification Rules`,
        skillDiffData.hiddenContextLines,
        skillDiffData.lines
      )}
    </div>
  );
};
