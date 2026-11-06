"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  Cancel01Icon,
  MinusSignIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { RichMarkdown, RichInlineMarkdown } from "../RichMarkdown";
import type { WalrusConnectionConfig } from "../../types";
import { createMemWalClient, getEnvDefaultConfig, hasLiveCredentials } from "../../lib/memwalBridge";

export const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

export const canvas = "bg-white dark:bg-neutral-950";
export const text1 = "text-neutral-900 dark:text-neutral-100";
export const text2 = "text-neutral-900/78 dark:text-neutral-100/78";
export const text3 = "text-neutral-900/62 dark:text-neutral-100/62";
export const rowsRuled =
  "divide-y divide-[color-mix(in_oklab,var(--rb-n-200,oklch(92.8%_0.009_76))_88%,white)] dark:divide-neutral-100/7";
export const typeHeadingXs = "text-[17px]/[22px] font-extrabold";
export const typeLabel = "text-[15px]/[20px] font-bold";
export const typeBodySm = "text-[14px]/[20px] font-medium";
export const typeCaption = "text-[13px]/[16px] font-semibold tabular-nums";
export const typeCodeSm = "font-mono text-[12px]/[16px] tabular-nums";

export const primaryButton =
  "relative inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap select-none transition-[color,background-color,border-color,box-shadow,outline-color,scale,translate,filter] duration-[240ms] ease-[cubic-bezier(0.34,1.45,0.64,1)] active:duration-[90ms] motion-reduce:active:translate-y-0 disabled:cursor-not-allowed aria-busy:cursor-progress focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_58%,black)] dark:focus-visible:outline-[var(--rb-accent,oklch(81%_0.16_163))] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_68%,white),var(--rb-accent,oklch(84%_0.15_165)))] text-[var(--rb-accent-fg,oklch(26%_0.06_168))] shadow-[inset_0_1px_0_rgb(255_255_255/0.5),inset_0_-2px_0_color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_70%,black),0_0_0_1px_color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_70%,black),0_4px_10px_-4px_color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_80%,transparent)] hover:not-disabled:-translate-y-px hover:not-disabled:brightness-[1.04] hover:not-disabled:shadow-[inset_0_1px_0_rgb(255_255_255/0.5),inset_0_-2px_0_color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_70%,black),0_0_0_1px_color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_70%,black),0_7px_16px_-6px_color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_85%,transparent)] active:not-disabled:translate-y-px active:not-disabled:brightness-[0.98] active:not-disabled:shadow-[inset_0_2px_4px_color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_55%,black),0_0_0_1px_color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_70%,black)] motion-reduce:hover:translate-y-0 disabled:opacity-45 disabled:shadow-none dark:bg-[linear-gradient(180deg,color-mix(in_oklab,var(--rb-accent,oklch(81%_0.16_163))_78%,white),var(--rb-accent,oklch(81%_0.16_163)))] dark:text-[var(--rb-accent-fg,oklch(26%_0.06_168))] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.45),inset_0_-2px_0_color-mix(in_oklab,var(--rb-accent,oklch(81%_0.16_163))_58%,black),0_0_0_1px_color-mix(in_oklab,var(--rb-accent,oklch(81%_0.16_163))_55%,black),0_6px_16px_-6px_color-mix(in_oklab,var(--rb-accent,oklch(81%_0.16_163))_55%,transparent)] dark:hover:not-disabled:shadow-[inset_0_1px_0_rgb(255_255_255/0.45),inset_0_-2px_0_color-mix(in_oklab,var(--rb-accent,oklch(81%_0.16_163))_58%,black),0_0_0_1px_color-mix(in_oklab,var(--rb-accent,oklch(81%_0.16_163))_55%,black),0_9px_22px_-8px_color-mix(in_oklab,var(--rb-accent,oklch(81%_0.16_163))_60%,transparent)] dark:active:not-disabled:shadow-[inset_0_2px_4px_color-mix(in_oklab,var(--rb-accent,oklch(81%_0.16_163))_45%,black),0_0_0_1px_color-mix(in_oklab,var(--rb-accent,oklch(81%_0.16_163))_55%,black)] dark:disabled:shadow-none";

export const secondaryButton =
  "relative inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap select-none transition-[color,background-color,border-color,box-shadow,outline-color,scale,translate,filter] duration-[240ms] ease-[cubic-bezier(0.34,1.45,0.64,1)] active:duration-[90ms] motion-reduce:active:translate-y-0 disabled:cursor-not-allowed aria-busy:cursor-progress focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_58%,black)] dark:focus-visible:outline-[var(--rb-accent,oklch(81%_0.16_163))] border border-transparent bg-[linear-gradient(180deg,#ffffff,var(--rb-n-100,oklch(97.7%_0.0055_80)))] dark:bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-neutral-700)_55%,var(--color-neutral-800)),var(--color-neutral-800))] shadow-[0_0_0_1px_rgb(84_62_32/0.10),0_1px_1px_rgb(84_62_32/0.07),0_2px_5px_-2px_rgb(84_62_32/0.14)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.07),0_0_0_1px_rgb(0_0_0/0.6),0_2px_4px_-1px_rgb(0_0_0/0.5)] text-neutral-900 dark:text-neutral-100 hover:not-disabled:bg-[linear-gradient(180deg,#ffffff,color-mix(in_oklab,var(--rb-n-200,oklch(92.8%_0.009_76))_74%,white))] dark:hover:not-disabled:bg-[linear-gradient(180deg,var(--color-neutral-700),color-mix(in_oklab,var(--color-neutral-700)_55%,var(--color-neutral-800)))] active:not-disabled:translate-y-px active:not-disabled:shadow-[inset_0_1px_3px_rgb(84_62_32/0.16),0_0_0_1px_rgb(84_62_32/0.10)] dark:active:not-disabled:shadow-[inset_0_1px_3px_rgb(0_0_0/0.6),0_0_0_1px_rgb(0_0_0/0.6)] aria-expanded:bg-none aria-expanded:bg-[var(--rb-n-200,oklch(92.8%_0.009_76))] aria-expanded:shadow-[inset_0_1px_3px_rgb(84_62_32/0.14),0_0_0_1px_rgb(84_62_32/0.10)] dark:aria-expanded:bg-neutral-800 dark:aria-expanded:shadow-[inset_0_1px_3px_rgb(0_0_0/0.6),0_0_0_1px_rgb(0_0_0/0.6)] disabled:bg-none disabled:bg-[color-mix(in_oklab,var(--rb-n-200,oklch(92.8%_0.009_76))_58%,white)] disabled:text-neutral-900/40 disabled:shadow-none dark:disabled:bg-neutral-800/60 dark:disabled:text-neutral-100/40";

export const buttonSm =
  "h-8 gap-1.5 rounded-[calc(var(--rb-r-full,999px))] px-3.5 text-[14px]/[18px] font-bold";

export const switchTrack =
  "group relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full bg-[var(--rb-n-200,oklch(92.8%_0.009_76))] p-0.5 shadow-[inset_0_1px_2px_rgb(84_62_32/0.14),inset_0_0_0_1px_rgb(84_62_32/0.05)] transition-[background-color,box-shadow,outline-color] duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:aria-[checked=false]:not-disabled:bg-[color-mix(in_oklab,var(--rb-n-200,oklch(92.8%_0.009_76))_94%,black)] aria-checked:bg-[var(--rb-accent,oklch(84%_0.15_165))] aria-checked:shadow-[inset_0_1px_2px_color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_55%,black),inset_0_0_0_1px_color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_75%,black)] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_58%,black)] dark:focus-visible:outline-[var(--rb-accent,oklch(81%_0.16_163))] dark:bg-neutral-100/16 dark:shadow-[inset_0_1px_2px_rgb(0_0_0/0.6)] dark:hover:aria-[checked=false]:not-disabled:bg-neutral-100/24 dark:aria-checked:bg-[var(--rb-accent,oklch(81%_0.16_163))] dark:aria-checked:shadow-[inset_0_1px_2px_rgb(0_0_0/0.35)]";

export const switchThumb =
  "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-[0_0_0_1px_rgb(84_62_32/0.10),0_1px_2px_rgb(84_62_32/0.10),0_3px_8px_-2px_rgb(84_62_32/0.20)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_0_0_1px_rgb(0_0_0/0.6),0_2px_6px_-1px_rgb(0_0_0/0.6)] transition-[translate,width] duration-[280ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none group-active:w-6 group-aria-checked:translate-x-4 group-aria-checked:group-active:translate-x-3 group-disabled:shadow-none dark:bg-white";

export const panel =
  "relative flex min-w-0 flex-col overflow-hidden rounded-[calc(var(--rb-r-6xl,26px))] border border-transparent bg-[var(--rb-n-100,oklch(97.7%_0.0055_80))] dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-[inset_0_0_0_1px_rgb(84_62_32/0.05)] dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.05)]";

export const panelBody =
  "mx-1 mb-1 flex min-w-0 flex-col overflow-hidden rounded-[calc(var(--rb-r-5xl,22px))] border border-transparent bg-white dark:bg-neutral-950 shadow-[0_0_0_1px_rgb(84_62_32/0.10),0_1px_1px_rgb(84_62_32/0.07),0_2px_5px_-2px_rgb(84_62_32/0.14)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.07),0_0_0_1px_rgb(0_0_0/0.6),0_2px_4px_-1px_rgb(0_0_0/0.5)] [&:has(+*)]:mb-0";

export const disclosureRow =
  "group -mx-2 flex min-h-9 max-w-[calc(100%+16px)] min-w-0 cursor-pointer items-center gap-2 self-start rounded-[calc(var(--rb-r-lg,10px))] px-2 text-left text-[14px]/[20px] font-semibold text-neutral-900/78 dark:text-neutral-100/78 transition-[background-color] duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-[color-mix(in_oklab,var(--rb-n-200,oklch(92.8%_0.009_76))_74%,white)] active:bg-[var(--rb-n-200,oklch(92.8%_0.009_76))] dark:hover:bg-neutral-100/6 dark:active:bg-neutral-100/10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_58%,black)] dark:focus-visible:outline-[var(--rb-accent,oklch(81%_0.16_163))]";

export const disclosureCaret =
  "shrink-0 text-neutral-900/62 dark:text-neutral-100/62 transition-transform duration-[280ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none group-aria-expanded:rotate-90";

export const stepGlyph = "flex size-[18px] shrink-0 items-center justify-center";
export const toolLabel = "shrink-0 text-neutral-900/78 dark:text-neutral-100/78";
export const toolDetail =
  "min-w-[6ch] truncate font-bold text-neutral-900 dark:text-neutral-100";
export const toolEnd =
  "ms-auto flex shrink-0 items-center gap-2 whitespace-nowrap tabular-nums text-neutral-900/62 dark:text-neutral-100/62";
export const toolWell =
  "flex min-w-0 flex-col gap-3 rounded-[calc(var(--rb-r-xl,12px))] bg-[color-mix(in_oklab,var(--rb-n-200,oklch(92.8%_0.009_76))_58%,white)] dark:bg-neutral-950 shadow-[inset_0_1px_2px_rgb(84_62_32/0.09),inset_0_0_0_1px_rgb(84_62_32/0.035)] dark:shadow-[inset_0_1px_2px_rgb(0_0_0/0.6),inset_0_0_0_1px_rgb(255_255_255/0.045)] px-3.5 py-2.5";
export const codeText = "min-w-0 flex-1 whitespace-pre";
export const fadeTop =
  "bg-linear-to-b from-white to-transparent transition-opacity duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] dark:from-neutral-950";
export const fadeBottom =
  "bg-linear-to-t from-white to-transparent transition-opacity duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] dark:from-neutral-950";

export const pageTitle = cx(typeHeadingXs, text1);
export const rowTitle = cx(typeLabel, text1);
export const detailText = cx(typeBodySm, text2);
export const captionText = cx(typeCaption, text3);
export const codeMeta = cx(typeCodeSm, text3);
export const codeName = cx(typeCodeSm, text1);
export const jsonText = cx(typeCodeSm, text2, codeText);

export function useScrollFade<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setEdges({
      start: scrollTop > 1,
      end: Math.ceil(scrollTop + clientHeight) < scrollHeight - 1,
    });
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    const view = el?.ownerDocument.defaultView;
    if (!el || !view?.ResizeObserver) return;
    const observer = new view.ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [update]);

  return { ref, edges, onScroll: update };
}

export function SorbetSwitch({
  on,
  onToggle,
  labelId,
  disabled,
}: {
  on: boolean;
  onToggle: () => void;
  labelId: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-labelledby={labelId}
      disabled={disabled}
      onClick={onToggle}
      className={switchTrack}
    >
      <span className={switchThumb} />
    </button>
  );
}

export type StepStatus = "pending" | "approved" | "denied";

export interface StepItem {
  id: string;
  tool: string;
  sentence: string;
  rawInput: string;
  markdownDetail?: string;
  customPreviewNode?: React.ReactNode;
  defaultOpenPreview?: boolean;
  status: StepStatus;
  auto?: boolean;
  approveLabel?: string;
  rejectLabel?: string;
  settledRightLabel?: string;
  durationMs?: number;
  ttftMs?: number;
  decodingMs?: number;
  tokensLabel?: string;
  kindBadge?: "SYSTEM" | "USER" | "SKILL" | "TOOL" | "THINK" | "PLAN" | "VERDICT";
}

export function SorbetSettledLine({
  request,
  onReopen,
  isSelected,
  onSelect,
}: {
  request: StepItem;
  onReopen?: () => void;
  isSelected?: boolean;
  onSelect?: () => void;
}) {
  const denied = request.status === "denied";
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cx(
        isSelected &&
          "bg-[color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_10%,transparent)] dark:bg-emerald-500/8",
      )}
    >
      <div
        onClick={() => {
          setExpanded((v) => !v);
          onSelect?.();
        }}
        className={cx(
          typeBodySm,
          "flex min-h-12 cursor-pointer items-center gap-2.5 px-3.5 py-2.5 transition-colors hover:bg-neutral-900/[0.025] dark:hover:bg-neutral-100/[0.035]",
        )}
      >
        <span className={stepGlyph}>
          <HugeiconsIcon
            icon={denied ? MinusSignIcon : Tick02Icon}
            size={15}
            strokeWidth={2.1}
            aria-hidden="true"
            className={
              denied
                ? "text-red-600 dark:text-red-400"
                : "text-emerald-600 dark:text-emerald-400"
            }
          />
        </span>
        <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-2">
          {request.kindBadge && (
            <span className="rounded bg-neutral-900/7 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-neutral-900/75 uppercase dark:bg-neutral-100/10 dark:text-neutral-100/75">
              {request.kindBadge}
            </span>
          )}
          <span className={cx(toolLabel, typeCodeSm, "font-semibold")}>
            {request.tool}
          </span>
          <span className={cx(toolDetail, "flex-1")}>
            <RichInlineMarkdown text={request.sentence} />
          </span>
        </span>
        <span className={toolEnd}>
          {request.durationMs !== undefined && (
            <span className="rounded bg-neutral-900/5 px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-neutral-900/70 dark:bg-neutral-100/8 dark:text-neutral-100/70">
              {request.durationMs} ms
            </span>
          )}
          <span className="text-[12.5px]">
            {request.settledRightLabel
              ? request.settledRightLabel
              : denied
                ? "Skipped"
                : request.auto
                  ? "Auto-approved"
                  : "Approved"}
          </span>
          {onSelect && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className={cx(
                "ms-1 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold transition-colors",
                isSelected
                  ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950"
                  : "bg-neutral-900/6 text-neutral-900/75 hover:bg-neutral-900/12 hover:text-neutral-900 dark:bg-neutral-100/10 dark:text-neutral-100/75 dark:hover:bg-neutral-100/18 dark:hover:text-neutral-100",
              )}
            >
              Inspect
            </button>
          )}
          {onReopen && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onReopen();
              }}
              className="ms-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold text-neutral-900/55 hover:bg-neutral-900/8 hover:text-neutral-900 dark:text-neutral-100/55 dark:hover:bg-neutral-100/10 dark:hover:text-neutral-100"
            >
              Re-run
            </button>
          )}
        </span>
      </div>

      {expanded && (
        <div className="px-3.5 pb-3.5">
          <div className={cx(toolWell, "max-h-[480px] overflow-y-auto")}>
            {request.customPreviewNode ? (
              request.customPreviewNode
            ) : request.markdownDetail ? (
              <RichMarkdown markdown={request.markdownDetail} />
            ) : (
              <pre className={jsonText}>{request.rawInput}</pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function SorbetActiveRequest({
  request,
  actionable,
  onDecide,
  disclosureText = "View request",
  isSelected,
  onSelect,
}: {
  request: StepItem;
  actionable: boolean;
  onDecide: (approved: boolean) => void;
  disclosureText?: string;
  isSelected?: boolean;
  onSelect?: () => void;
}) {
  const [showRaw, setShowRaw] = useState(Boolean(request.defaultOpenPreview));

  // Queued step (not yet the active step): render as a clean, compact single-line row
  if (!actionable) {
    return (
      <div
        className={cx(
          isSelected &&
            "bg-[color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_10%,transparent)] dark:bg-emerald-500/8",
        )}
      >
        <div
          onClick={() => {
            setShowRaw((v) => !v);
            onSelect?.();
          }}
          className={cx(
            typeBodySm,
            "flex min-h-11 cursor-pointer items-center gap-2.5 px-3.5 py-2 transition-colors hover:bg-neutral-900/[0.025] dark:hover:bg-neutral-100/[0.035]",
          )}
        >
          <span className={stepGlyph}>
            <span className="h-2 w-2 rounded-full bg-amber-500/75" />
          </span>
          <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-2">
            {request.kindBadge && (
              <span className="rounded bg-amber-500/14 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-amber-800 uppercase dark:bg-amber-400/15 dark:text-amber-300">
                {request.kindBadge}
              </span>
            )}
            <span className={cx(toolLabel, typeCodeSm, "font-semibold")}>
              {request.tool}
            </span>
            <span className={cx(toolDetail, "flex-1")}>
              <RichInlineMarkdown text={request.sentence} />
            </span>
          </span>
          <span className={toolEnd}>
            {request.durationMs !== undefined && (
              <span className="rounded bg-neutral-900/5 px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-neutral-900/70 dark:bg-neutral-100/8 dark:text-neutral-100/70">
                {request.durationMs} ms
              </span>
            )}
            <span className="font-mono text-[11px] text-neutral-900/50 dark:text-neutral-100/50">
              Queued
            </span>
          </span>
        </div>
        {showRaw && (
          <div className="px-3.5 pb-3">
            <div className={cx(toolWell, "max-h-[420px] overflow-y-auto")}>
              {request.customPreviewNode ? (
                request.customPreviewNode
              ) : request.markdownDetail ? (
                <RichMarkdown markdown={request.markdownDetail} />
              ) : (
                <pre className={jsonText}>{request.rawInput}</pre>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelect?.()}
      className={cx(
        "p-3.5 transition-colors",
        isSelected &&
          "bg-[color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_10%,transparent)] dark:bg-emerald-500/8",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className={rowTitle}>
              <RichInlineMarkdown text={request.sentence} />
            </div>
            <div className="flex items-center gap-1.5">
              {request.durationMs !== undefined && (
                <span className="rounded bg-neutral-900/6 px-2 py-0.5 font-mono text-[11px] font-bold tabular-nums text-neutral-900/75 dark:bg-neutral-100/10 dark:text-neutral-100/75">
                  est. {request.durationMs} ms
                </span>
              )}
            </div>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            {request.kindBadge && (
              <span className="rounded bg-amber-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-amber-800 uppercase dark:bg-amber-400/15 dark:text-amber-300">
                {request.kindBadge}
              </span>
            )}
            <p className={codeMeta}>{request.tool}</p>
            {request.tokensLabel && (
              <span className="font-mono text-[11px] text-neutral-900/55 dark:text-neutral-100/55">
                · {request.tokensLabel}
              </span>
            )}
          </div>

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDecide(true);
                }}
                className={cx(primaryButton, buttonSm)}
              >
                <HugeiconsIcon
                  icon={Tick02Icon}
                  size={17}
                  strokeWidth={2.0}
                  aria-hidden="true"
                />
                {request.approveLabel || "Approve"}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDecide(false);
                }}
                className={cx(secondaryButton, buttonSm)}
              >
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  size={17}
                  strokeWidth={2.0}
                  aria-hidden="true"
                />
                {request.rejectLabel || "Reject"}
              </button>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowRaw((v) => !v);
              }}
              aria-expanded={showRaw}
              className={cx(disclosureRow, "min-h-7 py-0.5 text-[12.5px]")}
            >
              <span className={stepGlyph}>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={13}
                  strokeWidth={2.0}
                  aria-hidden="true"
                  className={disclosureCaret}
                />
              </span>
              {disclosureText}
            </button>
          </div>

          {showRaw && (
            <div className={cx(toolWell, "mt-2.5 max-h-[460px] overflow-y-auto")}>
              {request.customPreviewNode ? (
                request.customPreviewNode
              ) : request.markdownDetail ? (
                <RichMarkdown markdown={request.markdownDetail} />
              ) : (
                <pre className={jsonText}>{request.rawInput}</pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function buildInitialRequests(cfg: WalrusConnectionConfig): StepItem[] {
  const acct =
    cfg.accountId ||
    "0x463ec47ea456b183e4c92bfbbecaf2ff62c938f0c8809a48c8325e238183eb1d";
  const ns = cfg.namespace || "memwal-team-skills";
  const server = cfg.serverUrl || "https://relayer.memory.walrus.xyz";
  return [
    {
      id: "call_w1",
      tool: "memwal_recall",
      sentence: `Recall live Flow Memory blobs from \`${server}\` in \`${ns}\``,
      rawInput: JSON.stringify(
        {
          account: acct,
          namespace: ns,
          serverUrl: server,
          query: "sponsor SuiGrpcClient",
          limit: 5,
        },
        null,
        2
      ),
      status: "pending",
    },
    {
      id: "call_e1",
      tool: "add_delegate_key",
      sentence: `Verify on-chain \`delegate_keys\` vector on \`${acct.slice(0, 10)}...${acct.slice(-6)}\` (Sui Mainnet)`,
      rawInput: JSON.stringify(
        {
          packageId:
            "0xe7c16fbea0560e7057e2bf7422feaa4fb313749fc69c9e9092fac7a33b81d7f5",
          registryId:
            "0x8bf82c9e09e36b8d1c38298f68b7cb68e7b8762887e7592add9986d5e9cf199f",
          accountId: acct,
          network: "mainnet",
        },
        null,
        2
      ),
      status: "pending",
    },
    {
      id: "call_m1",
      tool: "run_migration",
      sentence: "Apply migration `0042_add_idempotency_key` to production",
      rawInput: `{ "target": "production", "file": "0042_add_idempotency_key.sql" }`,
      status: "pending",
    },
    {
      id: "call_r1",
      tool: "read_file",
      sentence: "Read `services/payments/retry.ts`",
      rawInput: `{ "path": "services/payments/retry.ts" }`,
      status: "approved",
      auto: true,
    },
  ];
}

type Perm = { id: string; tool: string; scope: string; enabled: boolean };
type Group = { label: string; perms: Perm[] };

const GROUPS: Group[] = [
  {
    label: "Walrus Memory & Move 2024 Guard",
    perms: [
      {
        id: "memwal_recall",
        tool: "memwal_recall",
        scope: "Recall encrypted SKILL.md and Flow Memory blobs from namespace",
        enabled: true,
      },
      {
        id: "memwal_remember",
        tool: "memwal_remember",
        scope: "Commit new Flow Memory blob signed by connected delegate key",
        enabled: true,
      },
      {
        id: "rotate_seal_counter",
        tool: "rotate_seal_counter",
        scope: "Increment SEAL access_counter_version when delegate is revoked",
        enabled: false,
      },
    ],
  },
  {
    label: "Filesystem",
    perms: [
      {
        id: "read_file",
        tool: "read_file",
        scope: "Read any file inside the workspace",
        enabled: true,
      },
      {
        id: "edit_file",
        tool: "edit_file",
        scope: "Modify files and show a diff before saving",
        enabled: true,
      },
      {
        id: "delete_file",
        tool: "delete_file",
        scope: "Remove files, asking before each deletion",
        enabled: false,
      },
    ],
  },
  {
    label: "Network",
    perms: [
      {
        id: "web_search",
        tool: "web_search",
        scope: "Search the web for public documentation",
        enabled: true,
      },
      {
        id: "send_email",
        tool: "send_email",
        scope: "Send email, asking approval each time",
        enabled: false,
      },
    ],
  },
];

export default function ToolCalls6({ config }: { config?: WalrusConnectionConfig }) {
  const uid = useId();
  const effectiveConfig = config ?? getEnvDefaultConfig();
  const [requests, setRequests] = useState<StepItem[]>(() =>
    buildInitialRequests(effectiveConfig),
  );
  const [perms, setPerms] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      GROUPS.flatMap((g) => g.perms.map((p) => [p.id, p.enabled])),
    ),
  );

  useEffect(() => {
    setRequests((prev) =>
      prev.map((item) =>
        item.id === "call_w1" && item.status === "pending"
          ? buildInitialRequests(effectiveConfig)[0]
          : item,
      ),
    );
  }, [effectiveConfig.accountId, effectiveConfig.namespace, effectiveConfig.serverUrl]);

  const pending = requests.filter((r) => r.status === "pending");
  const activeId = pending[0]?.id;

  const requestsRef = useRef<HTMLUListElement>(null);
  const {
    ref: bodyRef,
    edges: bodyEdges,
    onScroll: onBodyScroll,
  } = useScrollFade<HTMLDivElement>();

  const decideRequest = useCallback(
    async (id: string, approved: boolean) => {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: approved ? "approved" : "denied" } : r,
        ),
      );
      requestsRef.current?.focus({ preventScroll: true });

      if (approved && id === "call_w1" && hasLiveCredentials(effectiveConfig)) {
        const t0 = performance.now();
        try {
          const client = createMemWalClient(effectiveConfig);
          const recalled = await client.recall("sponsor SuiGrpcClient", {
            limit: 5,
            namespace: effectiveConfig.namespace,
          });
          const elapsed = Math.round(performance.now() - t0);
          const hits = Array.isArray(recalled.results) ? recalled.results : [];
          setRequests((prev) =>
            prev.map((r) =>
              r.id === "call_w1"
                ? {
                    ...r,
                    durationMs: elapsed,
                    settledRightLabel: `${hits.length} live blobs recalled`,
                    markdownDetail: [
                      `- **Live Relayer:** \`${effectiveConfig.serverUrl}\` (\`${elapsed} ms\`)`,
                      `- **Account ID:** \`${effectiveConfig.accountId}\``,
                      ...hits.map(
                        (h: any) =>
                          `- **Blob \`${h.blob_id}\`** (distance \`${Number(h.distance ?? 0).toFixed(3)}\`): ${String(h.text || "").split("\n")[1] || h.text}`,
                      ),
                    ].join("\n"),
                  }
                : r,
            ),
          );
        } catch {
          // keep settled state if offline
        }
      }
    },
    [effectiveConfig],
  );

  const resetRequests = useCallback(() => {
    setRequests(buildInitialRequests(effectiveConfig));
  }, [effectiveConfig]);

  return (
    <div
      className={cx(
        canvas,
        text1,
        "relative flex h-full w-full flex-col overflow-hidden rounded-[calc(var(--rb-r-6xl,26px))]",
      )}
    >
      <header className="mx-4 mt-4 mb-1 flex shrink-0 items-center justify-between gap-3 sm:mx-6">
        <div className="flex items-center gap-2.5">
          <h2 className={pageTitle}>Tool permissions</h2>
          {pending.length === 0 && (
            <button
              type="button"
              onClick={resetRequests}
              className="rounded-full px-2.5 py-0.5 text-[12px] font-bold text-neutral-900/60 hover:bg-neutral-900/6 hover:text-neutral-900 dark:text-neutral-100/60 dark:hover:bg-neutral-100/10 dark:hover:text-neutral-100"
            >
              Reset queue
            </button>
          )}
        </div>
        <span className={captionText}>{pending.length} pending</span>
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={bodyRef}
          onScroll={onBodyScroll}
          className="h-full overflow-y-auto overscroll-contain [overflow-anchor:none]"
        >
          <section>
            <h3 className={cx(captionText, "px-4 pt-5 pb-1.5 sm:px-6")}>
              Requests
            </h3>
            <div className={cx(panel, "mx-4 sm:mx-6")}>
              <ul
                ref={requestsRef}
                tabIndex={-1}
                aria-live="polite"
                className={cx(panelBody, rowsRuled, "mt-1 focus:outline-none")}
              >
                {requests.map((r) => (
                  <li key={r.id}>
                    {r.status === "pending" ? (
                      <SorbetActiveRequest
                        request={r}
                        actionable={r.id === activeId}
                        onDecide={(approved) => decideRequest(r.id, approved)}
                      />
                    ) : (
                      <SorbetSettledLine
                        request={r}
                        onReopen={() =>
                          setRequests((prev) =>
                            prev.map((item) =>
                              item.id === r.id
                                ? { ...item, status: "pending", auto: false }
                                : item,
                            ),
                          )
                        }
                      />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {GROUPS.map((g) => (
            <section key={g.label}>
              <h3 className={cx(captionText, "px-4 pt-5 pb-1.5 sm:px-6")}>
                {g.label}
              </h3>
              <div className={cx(panel, "mx-4 sm:mx-6")}>
                <ul className={cx(panelBody, rowsRuled, "mt-1")}>
                  {g.perms.map((p) => {
                    const labelId = `${uid}-${p.id}`;
                    return (
                      <li
                        key={p.id}
                        className="flex items-center justify-between gap-4 px-3.5 py-3"
                      >
                        <div className="min-w-0">
                          <p id={labelId} className={codeName}>
                            {p.tool}
                          </p>
                          <p className={cx(detailText, "mt-0.5 truncate")}>
                            {p.scope}
                          </p>
                        </div>
                        <SorbetSwitch
                          on={perms[p.id]}
                          labelId={labelId}
                          onToggle={() =>
                            setPerms((s) => ({ ...s, [p.id]: !s[p.id] }))
                          }
                        />
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          ))}
          <div className="h-4" />
        </div>

        <div
          aria-hidden="true"
          className={cx(
            fadeTop,
            "pointer-events-none absolute inset-x-0 top-0 h-8",
            bodyEdges.start ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          aria-hidden="true"
          className={cx(
            fadeBottom,
            "pointer-events-none absolute inset-x-0 bottom-0 h-8",
            bodyEdges.end ? "opacity-100" : "opacity-0",
          )}
        />
      </div>
    </div>
  );
}
