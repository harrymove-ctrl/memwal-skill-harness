"use client";

import { Fragment, useId, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  blockFrame,
  blockToneProps,
  CtaLink,
  Reveal,
  SectionHeader,
  useBlockReducedMotion,
  type BlockLink,
  type BlockTone,
} from "./marketing-kit";
import { cn } from "../../../lib/utils";
import { RichInlineMarkdown } from "../../RichMarkdown";

export interface BentoSpan {
  label: string;
  /** Start offset, in the same unit as `total`. */
  start: number;
  duration: number;
  /** Marks the span as the slow one: accent bar and a duration tag. */
  slow?: boolean;
}

export type BentoVisual =
  | { type: "waterfall"; spans: BentoSpan[]; total: number; unit?: string }
  | {
      type: "replay";
      markers: number[];
      position: number;
      timecode: string;
      label: string;
      steps?: { label: string; timecode: string; position: number }[];
    }
  | {
      type: "alerts";
      alerts: { title: string; meta: string; severity?: string; blobId?: string }[];
    }
  | {
      type: "cost";
      value: string;
      caption: string;
      bars: number[];
      labels?: string[];
      highlight?: number;
      onSelectBar?: (index: number) => void;
    }
  | { type: "code"; filename: string; lines: string[] }
  | {
      type: "keys";
      shortcuts: { keys: string[]; label: string; onTrigger?: () => void }[];
    }
  | {
      type: "redact";
      segments: (string | { redacted: string })[];
      badge: string;
    }
  | { type: "custom"; node: ReactNode };

export interface BentoFeature {
  id: string;
  title: string;
  description: string;
  visual: BentoVisual;
  /** Width on the six-column grid: sm is a third, md a half, lg two thirds, full the whole row. */
  size?: "sm" | "md" | "lg" | "full";
  /** Optional dimensional code callout (e.g. "BENTO-01 · W=4·COL") */
  dimCode?: string;
  /** Turns the whole card into a link or interactive card. */
  href?: string;
  onSelect?: () => void;
}

export interface MarketingFeatureBentoProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  cta?: BlockLink;
  onCtaClick?: () => void;
  headerSlot?: ReactNode;
  features: BentoFeature[];
  tone?: BlockTone;
  /** Play the in-view motion. Turn off for screenshots. */
  animate?: boolean;
  className?: string;
}

/**
 * Walrus Memory Skill Hub & Trajectory Eval Bento Grid — built from real content, not static images:
 * 1. Trace waterfall with the slow/critical span called out
 * 2. Replay scrubber
 * 3. Stack of Flow Memory alerts
 * 4. Token/recall cost histogram
 * 5. Two-line install snippet
 * 6. Keyboard shortcuts
 * 7. Masked log line
 * Six columns on desktop, two on tablets, one on phones.
 */
export const MEMWAL_BENTO_SAMPLE: MarketingFeatureBentoProps = {
  eyebrow: "SPECIFICATION · BENTO-GRID-001 · 6-COL DESKTOP / 2-COL TABLET / 1-COL MOBILE",
  title: "Every skill & flow memory between the prompt and the verdict.",
  description:
    "A feature section on a bento grid where every card explains itself. The illustrations are built from your Walrus Memory namespace content, not images: a trace waterfall with the slow span called out, a replay scrubber, a stack of Flow Memory alerts, a token histogram, an MCP install snippet, keyboard shortcuts and a masked log line.",
  cta: { label: "Jump to Namespace Graph & Eval Workbench", href: "#workbench" },
  features: [
    {
      id: "traces",
      size: "lg",
      dimCode: "[1] SPAN-WATERFALL · W = 4·COL (LG)",
      title: "Live memory trajectory traces, span by span",
      description:
        "Every SKILL.md fetch, Ed25519 delegate signature, Walrus blob recall, and SEAL decryption lands on one timeline while the evaluation is still running.",
      visual: {
        type: "waterfall",
        total: 7.2,
        unit: "s",
        spans: [
          { label: "fetch_skill_md", start: 0, duration: 0.4 },
          { label: "sign_delegate_key", start: 0.4, duration: 0.6 },
          { label: "walrus_recall_sort", start: 1.0, duration: 1.1 },
          { label: "seal_decrypt_override", start: 2.1, duration: 3.8, slow: true },
          { label: "compile_skill_flows", start: 5.9, duration: 0.8 },
          { label: "emit_ab_verdict", start: 6.7, duration: 0.5 },
        ],
      },
    },
    {
      id: "replay",
      size: "sm",
      dimCode: "[2] REPLAY-SCRUB · W = 2·COL (SM)",
      title: "Replay from any memory state",
      description:
        "Rewind a stale Cold Agent run to the exact step before it failed and re-run with a newly taught Walrus Flow Memory blob.",
      visual: {
        type: "replay",
        markers: [0, 0.08, 0.22, 0.42, 0.82, 0.95],
        position: 0.42,
        timecode: "00:02.1",
        label: "seal_decrypt_override",
      },
    },
    {
      id: "alerts",
      size: "sm",
      dimCode: "[3] FLOW-STACK · W = 2·COL (SM)",
      title: "Flow rules that read like sentences",
      description:
        "Newest-wins `[FLOW:<skill>]` rules committed by teammates override stale lines in base SKILL.md.",
      visual: {
        type: "alerts",
        alerts: [
          {
            title: "apps/chatbot retired — close PR as not planned",
            meta: "[FLOW:memwal-qa] · blob 0x94a1...e71b · @harry",
          },
          {
            title: "Never expose WALM-* IDs on public GitHub",
            meta: "[FLOW:walm-ticket] · blob 0x38f2...b204 · @harry",
          },
          {
            title: "staging retired — promote dev -> main directly",
            meta: "[FLOW:memwal-review] · blob 0x51e8...4c10 · @harry",
          },
        ],
      },
    },
    {
      id: "cost",
      size: "sm",
      dimCode: "[4] HISTOGRAM · W = 2·COL (SM)",
      title: "Token budget per recall, not guesswork",
      description:
        "High-relevance Flow Memories are ranked and truncated to your exact token budget on every skill run.",
      visual: {
        type: "cost",
        value: "142 tok",
        caption: "median flow memory payload per skill recall",
        bars: [4, 6, 9, 13, 16, 14, 10, 7, 5, 4, 3, 7],
        highlight: 11,
      },
    },
    {
      id: "install",
      size: "sm",
      dimCode: "[5] MCP-SNIPPET · W = 2·COL (SM)",
      title: "Two lines to share with your team",
      description:
        "Reuses `@mysten-incubation/memwal-mcp`. Share one Account ID, Delegate Key, and Namespace folder.",
      visual: {
        type: "code",
        filename: "memwal-sync.ts",
        lines: [
          'import { MemWal } from "@mysten-incubation/memwal";',
          "",
          'const vm = MemWal.create({ namespace: "memwal-team-skills" });',
        ],
      },
    },
    {
      id: "keys",
      size: "md",
      dimCode: "[6] SHORTCUTS · W = 3·COL (MD)",
      title: "Built for the keyboard",
      description:
        "Jump between namespace skills, graph nodes, and trajectory steps without reaching for the mouse.",
      visual: {
        type: "keys",
        shortcuts: [
          { keys: ["⌘", "K"], label: "Filter skill nodes" },
          { keys: ["J"], label: "Next skill in namespace" },
          { keys: ["K"], label: "Previous skill in namespace" },
          { keys: ["R"], label: "Replay trajectory trace" },
        ],
      },
    },
    {
      id: "private",
      size: "md",
      dimCode: "[7] REDACTION · W = 3·COL (MD)",
      title: "Private & redacted by default",
      description:
        "Delegate private keys, internal Linear `WALM-*` ticket IDs, and credentials are stripped before public output.",
      visual: {
        type: "redact",
        badge: "3 fields masked",
        segments: [
          "Signed recall with delegate key ",
          { redacted: "suiprivkey1q9x8a1b0" },
          " for internal ticket ",
          { redacted: "WALM-688" },
          " and verified Railway env token ",
          { redacted: "rw_live_9920" },
          " before posting on GitHub.",
        ],
      },
    },
  ],
};

// Six columns on desktop (lg:grid-cols-6), two on tablets (md:grid-cols-2), one on phones (grid-cols-1)
const SIZE_CLASS: Record<NonNullable<BentoFeature["size"]>, string> = {
  sm: "col-span-1 md:col-span-1 lg:col-span-2",
  md: "col-span-1 md:col-span-1 lg:col-span-3",
  lg: "col-span-1 md:col-span-2 lg:col-span-4",
  full: "col-span-1 md:col-span-2 lg:col-span-6",
};

export function MarketingFeatureBento({
  eyebrow,
  title,
  description,
  cta,
  onCtaClick,
  headerSlot,
  features,
  tone = "auto",
  animate = false,
  className,
}: MarketingFeatureBentoProps) {
  const titleId = useId();
  const toneProps = blockToneProps(tone);

  return (
    <section
      aria-labelledby={titleId}
      {...toneProps}
      className={cn(
        "@container w-full bg-[var(--bjork-bg)] py-8 text-[color:var(--bjork-text)]",
        toneProps.className,
        className
      )}
    >
      <div className={blockFrame}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-end lg:gap-12">
          <SectionHeader id={titleId} eyebrow={eyebrow} title={title} />
          <div className="flex flex-col items-start gap-4">
            {description ? (
              <p className="max-w-[52ch] text-pretty text-[14px] leading-6 text-[color:var(--bjork-text-medium)]">
                {description}
              </p>
            ) : null}
            {cta ? (
              onCtaClick ? (
                <button
                  type="button"
                  onClick={onCtaClick}
                  className="inline-flex items-center gap-2 rounded-full border border-[color:var(--ink)] bg-[var(--sheet)] px-4 py-2 font-mono text-[12px] font-bold text-[color:var(--ink)] transition hover:bg-[var(--fill2)]"
                >
                  <span>{cta.label}</span>
                  <span aria-hidden="true">→</span>
                </button>
              ) : (
                <CtaLink link={cta} variant="secondary" arrow />
              )
            ) : null}
          </div>
        </div>

        {headerSlot ? <div className="mt-6">{headerSlot}</div> : null}

        {/* Six columns on desktop (lg:grid-cols-6), two on tablets (md:grid-cols-2), one on phones (grid-cols-1) */}
        <ul className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              index={index}
              animate={animate}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}

function FeatureCard({
  feature,
  index,
  animate,
}: {
  feature: BentoFeature;
  index: number;
  animate: boolean;
}) {
  const titleId = useId();
  const body = (
    <>
      {/* Clean card eyebrow header */}
      <div className="flex items-center justify-between border-b border-[color:var(--bjork-border)] bg-[var(--fill)] px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.06em] text-[color:var(--ink2)]">
        <span>{feature.dimCode ?? `CARD 0${index + 1}`}</span>
        <span className="tabular-nums text-[color:var(--bjork-text-muted)]">Sui Mainnet · Synced</span>
      </div>

      <div className="relative flex min-h-[185px] flex-1 items-center justify-center overflow-hidden px-5 pt-5">
        <Visual visual={feature.visual} animate={animate} />
      </div>
      <div className="border-t border-[color:var(--bjork-border-muted)] px-5 pb-5 pt-4">
        <div className="flex items-center justify-between gap-2">
          <h3
            id={titleId}
            className="text-balance text-[15px] font-semibold tracking-[-0.01em] text-[color:var(--bjork-text)]"
          >
            {feature.title}
          </h3>
          {feature.onSelect && (
            <button
              type="button"
              onClick={feature.onSelect}
              className="shrink-0 rounded-[5px] border border-[color:var(--ink)] bg-[var(--fill)] px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-[color:var(--ink)] hover:bg-[var(--fill2)]"
            >
              Open →
            </button>
          )}
        </div>
        <div className="mt-1 max-w-[54ch] text-pretty text-[13px] leading-5 text-[color:var(--bjork-text-muted)]">
          <RichInlineMarkdown text={feature.description} />
        </div>
      </div>
    </>
  );

  const shell =
    "group/card relative flex h-full flex-col overflow-hidden rounded-[16px] border-[1.2px] border-[color:var(--ink)] bg-[var(--bjork-surface)] shadow-[var(--bjork-shadow-panel)] transition-colors duration-200";

  const content = feature.href ? (
    <a
      href={feature.href}
      aria-labelledby={titleId}
      className={cn(
        shell,
        "hover:border-[color:var(--bjork-border-strong)] outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--bjork-accent)]"
      )}
    >
      {body}
    </a>
  ) : (
    <article aria-labelledby={titleId} className={shell}>
      {body}
    </article>
  );

  const size = SIZE_CLASS[feature.size ?? "sm"];
  if (!animate) return <li className={size}>{content}</li>;
  return (
    <Reveal as="li" delay={Math.min(index, 4) * 0.04} className={size}>
      {content}
    </Reveal>
  );
}

function Visual({
  visual,
  animate,
}: {
  visual: BentoVisual;
  animate: boolean;
}) {
  switch (visual.type) {
    case "waterfall":
      return <Waterfall {...visual} animate={animate} />;
    case "replay":
      return <Replay {...visual} />;
    case "alerts":
      return <Alerts alerts={visual.alerts} />;
    case "cost":
      return <Cost {...visual} animate={animate} />;
    case "code":
      return <Code filename={visual.filename} lines={visual.lines} />;
    case "keys":
      return <Keys shortcuts={visual.shortcuts} />;
    case "redact":
      return <Redact segments={visual.segments} badge={visual.badge} />;
    case "custom":
      return <>{visual.node}</>;
  }
}

function useGrow(animate: boolean) {
  const reduce = useBlockReducedMotion();
  return (delay: number) =>
    animate && !reduce
      ? {
          initial: { scaleX: 0 },
          whileInView: { scaleX: 1 },
          viewport: { once: true, amount: 0.6 },
          transition: {
            type: "spring" as const,
            stiffness: 180,
            damping: 26,
            mass: 0.9,
            delay,
          },
        }
      : {};
}

function Waterfall({
  spans,
  total,
  unit = "s",
  animate,
}: {
  spans: BentoSpan[];
  total: number;
  unit?: string;
  animate: boolean;
}) {
  const grow = useGrow(animate);
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  return (
    <div className="w-full max-w-[640px] self-stretch rounded-[12px] border border-[color:var(--ink)] bg-[var(--bjork-panel)] p-3.5">
      <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-x-3 sm:grid-cols-[158px_minmax(0,1fr)]">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.06em] text-[color:var(--ink3)]">
          SPAN · SLOT
        </span>
        <div className="relative mb-2 h-4 font-mono text-[10.5px] text-[color:var(--bjork-text-soft)]">
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute top-0 -translate-x-1/2 tabular-nums first:translate-x-0 last:-translate-x-full"
              style={{ left: `${tick * 100}%` }}
            >
              {(tick * total).toFixed(tick * total % 1 ? 1 : 0)}
              {unit}
            </span>
          ))}
        </div>
        {spans.map((span, index) => (
          <Fragment key={span.label}>
            <span
              className={cn(
                "truncate py-[4px] font-mono text-[11px] leading-4",
                span.slow
                  ? "font-semibold text-[color:var(--bjork-text)]"
                  : "text-[color:var(--bjork-text-muted)]"
              )}
            >
              {span.label}
            </span>
            <div className="relative py-[4px]">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, var(--bjork-border) 1px, transparent 1px)",
                  backgroundSize: "25% 100%",
                }}
              />
              <div
                className="relative h-4"
                style={{
                  marginLeft: `${(span.start / total) * 100}%`,
                  width: `${(span.duration / total) * 100}%`,
                }}
              >
                <motion.div
                  {...grow(0.08 + index * 0.06)}
                  className={cn(
                    "h-full origin-left rounded-[3px] border border-[color:var(--ink)]",
                    span.slow
                      ? "bg-[color:var(--bjork-accent)] shadow-[0_0_0_3px_var(--bjork-accent-soft)]"
                      : "hatch-fill bg-[color:var(--fill2)] transition-colors duration-200 group-hover/card:bg-[color:var(--bjork-text-faint)]"
                  )}
                />
                {span.slow ? (
                  <span className="absolute left-full top-1/2 ml-2 -translate-y-1/2 whitespace-nowrap rounded-[4px] border border-[color:var(--ink)] bg-[var(--sheet)] px-1.5 py-px font-mono text-[10px] font-semibold tabular-nums text-[color:var(--ink)]">
                    SLOW · {span.duration}
                    {unit}
                  </span>
                ) : null}
              </div>
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function Replay({
  markers,
  position,
  timecode,
  label,
  steps,
}: {
  markers: number[];
  position: number;
  timecode: string;
  label: string;
  steps?: { label: string; timecode: string; position: number }[];
}) {
  const defaultSteps = steps ?? [
    { label: "fetch_skill_md", timecode: "00:00.2", position: markers[0] ?? 0 },
    {
      label: "sign_delegate_key",
      timecode: "00:00.8",
      position: markers[1] ?? 0.18,
    },
    {
      label: "memwal_recall",
      timecode: "00:01.4",
      position: markers[2] ?? 0.32,
    },
    { label, timecode, position: markers[3] ?? position },
    {
      label: "exit_plan_mode",
      timecode: "00:03.2",
      position: markers[4] ?? 0.78,
    },
    {
      label: "apply_verdict",
      timecode: "00:03.8",
      position: markers[5] ?? 0.95,
    },
  ];
  const [stepIdx, setStepIdx] = useState(3);
  const current = defaultSteps[stepIdx] ?? { label, timecode, position };

  return (
    <div className="w-full max-w-[310px]">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStepIdx((i) => (i + 1) % defaultSteps.length)}
          className="flex cursor-pointer items-center gap-2 rounded-full border border-[color:var(--ink)] bg-[var(--bjork-panel)] py-1 pl-1 pr-2.5 font-mono text-[11px] font-semibold text-[color:var(--bjork-text-medium)] transition hover:bg-[var(--fill2)]"
        >
          <span className="grid size-5 place-items-center rounded-full bg-[color:var(--bjork-text)] text-[color:var(--bjork-bg)]">
            <svg viewBox="0 0 10 10" className="ml-px size-2.5">
              <path d="M2.5 1.5v7l6-3.5z" fill="currentColor" />
            </svg>
          </span>
          <span>Step {stepIdx + 1}/{defaultSteps.length}</span>
        </button>
        <span className="font-mono text-[11px] tabular-nums text-[color:var(--bjork-text-muted)]">
          {current.timecode}
        </span>
      </div>
      <div className="relative h-10">
        <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[color:var(--bjork-border)]" />
        <div
          className="absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[color:var(--bjork-accent)] transition-all duration-300"
          style={{ width: `${current.position * 100}%` }}
        />
        {defaultSteps.map((st, idx) => (
          <button
            key={st.label + idx}
            type="button"
            onClick={() => setStepIdx(idx)}
            title={`Jump to ${st.label} (${st.timecode})`}
            className={cn(
              "absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border border-[color:var(--ink)] transition-transform hover:scale-125",
              st.position <= current.position
                ? "bg-[color:var(--bjork-accent)]"
                : "bg-[color:var(--sheet)]"
            )}
            style={{ left: `${st.position * 100}%` }}
          />
        ))}
        <div
          className="pointer-events-none absolute top-0 h-full transition-all duration-300"
          style={{ left: `${current.position * 100}%` }}
        >
          <span className="absolute left-0 top-0 h-full w-[1.5px] -translate-x-1/2 rounded-full bg-[color:var(--bjork-text)]" />
          <span className="absolute -top-6 left-0 -translate-x-1/2 whitespace-nowrap rounded-[4px] border border-[color:var(--ink)] bg-[color:var(--bjork-text)] px-1.5 py-0.5 font-mono text-[10px] text-[color:var(--bjork-inverted-text)]">
            {current.label}
          </span>
        </div>
      </div>
    </div>
  );
}

function Alerts({
  alerts,
}: {
  alerts: { title: string; meta: string; severity?: string; blobId?: string }[];
}) {
  const [frontIdx, setFrontIdx] = useState(0);
  if (alerts.length === 0) return null;
  const ordered = alerts.map(
    (_, i) => alerts[(frontIdx + i) % alerts.length]
  );
  const stack = ordered.slice(0, 3);

  return (
    <div
      onClick={() => setFrontIdx((i) => (i + 1) % alerts.length)}
      title="Click to cycle Flow Memory rules in namespace"
      className="relative h-[126px] w-full max-w-[325px] cursor-pointer"
    >
      {stack.map((alert, index) => {
        const depth = index;
        return (
          <div
            key={`${alert.meta}-${index}`}
            className="absolute inset-x-0 top-0 rounded-[12px] border border-[color:var(--ink)] bg-[var(--bjork-surface)] p-3 shadow-[var(--bjork-shadow-menu)] transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] [transform:translateY(calc(var(--depth)*13px))_scale(calc(1-var(--depth)*0.05))] group-hover/card:[transform:translateY(calc(var(--depth)*38px))_scale(calc(1-var(--depth)*0.02))] motion-reduce:transition-none"
            style={{
              zIndex: stack.length - depth,
              opacity: 1 - depth * 0.16,
              background:
                depth === 0 ? "var(--sheet)" : "var(--bjork-surface-active)",
              ["--depth" as string]: depth,
            }}
          >
            <div
              className={cn(
                "flex items-start gap-2.5",
                depth > 0 &&
                  "opacity-0 transition-opacity duration-300 group-hover/card:opacity-100 motion-reduce:transition-none"
              )}
            >
              <span className="callout-box mt-0.5 shrink-0">
                {((frontIdx + depth) % alerts.length) + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block line-clamp-2 text-[12px] leading-snug font-semibold text-[color:var(--bjork-text)]">
                  <RichInlineMarkdown text={alert.title} />
                </span>
                <span className="mt-1 block truncate font-mono text-[10px] text-[color:var(--bjork-text-soft)]">
                  {alert.meta}
                </span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Cost({
  value,
  caption,
  bars,
  labels,
  highlight,
  onSelectBar,
  animate,
}: {
  value: string;
  caption: string;
  bars: number[];
  labels?: string[];
  highlight?: number;
  onSelectBar?: (index: number) => void;
  animate: boolean;
}) {
  const reduce = useBlockReducedMotion();
  const max = Math.max(...bars, 1);
  return (
    <div className="flex w-full max-w-[310px] flex-col gap-3.5">
      <div>
        <p className="font-mono text-[32px] font-bold leading-none tracking-[-0.04em] tabular-nums text-[color:var(--bjork-text)]">
          {value}
        </p>
        <p className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.04em] text-[color:var(--bjork-text-soft)]">
          {caption}
        </p>
      </div>
      <div className="flex h-14 items-end gap-[4px] border-b border-[color:var(--ink)] pb-1">
        {bars.map((bar, index) => (
          <motion.button
            type="button"
            key={index}
            onClick={() => onSelectBar?.(index)}
            title={
              labels?.[index]
                ? `${labels[index]}: ${bar} tok`
                : `${bar} tok`
            }
            initial={animate && !reduce ? { scaleY: 0 } : false}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 24,
              delay: 0.08 + index * 0.025,
            }}
            className={cn(
              "flex-1 origin-bottom cursor-pointer rounded-t-[2px] border border-[color:var(--ink)] transition-opacity hover:opacity-80",
              index === highlight
                ? "bg-emerald-500 dark:bg-emerald-400"
                : "hatch-fill bg-[color:var(--fill2)]"
            )}
            style={{ height: `${Math.max((bar / max) * 100, 14)}%` }}
          />
        ))}
      </div>
    </div>
  );
}

const CODE_TOKEN = /("[^"]*"|\b(?:import|from|const|await|export)\b)/g;

function Code({ filename, lines }: { filename: string; lines: string[] }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="w-full max-w-[340px] overflow-hidden rounded-[12px] border border-[color:var(--ink)] bg-[var(--bjork-panel)]">
      <div className="flex items-center justify-between border-b border-[color:var(--ink)] bg-[var(--fill2)] px-3 py-1.5">
        <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[color:var(--ink)]">
          {filename}
        </span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(lines.join("\n"));
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          }}
          className="rounded border border-[color:var(--ink)] bg-[var(--sheet)] px-1.5 py-0.2 font-mono text-[9.5px] font-bold text-[color:var(--ink)] hover:bg-[var(--fill)]"
        >
          {copied ? "COPIED ✓" : "COPY"}
        </button>
      </div>
      <pre className="overflow-x-auto px-3 py-3 font-mono text-[10.5px] leading-[1.65] text-[color:var(--bjork-text-medium)]">
        {lines.map((line, index) => (
          <div key={index} className="flex gap-2.5">
            <span className="w-3 select-none text-right tabular-nums text-[color:var(--bjork-text-faint)]">
              {index + 1}
            </span>
            <span className="whitespace-pre">
              {line.split(CODE_TOKEN).map((part, partIndex) =>
                part.startsWith('"') ? (
                  <span
                    key={partIndex}
                    className="font-semibold text-[color:var(--bjork-text)] underline decoration-dotted underline-offset-2"
                  >
                    {part}
                  </span>
                ) : /^(import|from|const|await|export)$/.test(part) ? (
                  <span
                    key={partIndex}
                    className="font-semibold text-[color:var(--ink2)]"
                  >
                    {part}
                  </span>
                ) : (
                  <span key={partIndex}>{part}</span>
                )
              )}
            </span>
          </div>
        ))}
      </pre>
    </div>
  );
}

function Keys({
  shortcuts,
}: {
  shortcuts: { keys: string[]; label: string; onTrigger?: () => void }[];
}) {
  return (
    <div className="grid w-full max-w-[440px] grid-cols-1 gap-2 sm:grid-cols-2">
      {shortcuts.map((shortcut, index) => (
        <button
          type="button"
          key={shortcut.label}
          onClick={shortcut.onTrigger}
          className="flex cursor-pointer items-center justify-between gap-3 rounded-[10px] border border-[color:var(--ink)] bg-[var(--bjork-panel)] px-3 py-2 text-left transition hover:bg-[var(--fill2)]"
        >
          <span className="truncate text-[12px] text-[color:var(--bjork-text-medium)]">
            {shortcut.label}
          </span>
          <span className="flex gap-1">
            {shortcut.keys.map((key) => (
              <kbd
                key={key}
                className={cn(
                  "grid h-6 min-w-6 place-items-center rounded-[5px] border border-b-2 border-[color:var(--ink)] bg-[var(--bjork-surface)] px-1.5 font-mono text-[11px] font-semibold text-[color:var(--bjork-text)] transition-transform duration-150 motion-reduce:transition-none",
                  index === 0 &&
                    "group-hover/card:translate-y-px group-hover/card:border-b"
                )}
              >
                {key}
              </kbd>
            ))}
          </span>
        </button>
      ))}
    </div>
  );
}

function Redact({
  segments,
  badge,
}: {
  segments: (string | { redacted: string })[];
  badge: string;
}) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="w-full max-w-[460px] rounded-[12px] border border-[color:var(--ink)] bg-[var(--bjork-panel)] p-3.5">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[color:var(--ink2)]">
          SPAN INPUT · SEAL POLICY
        </span>
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          className="flex cursor-pointer items-center gap-1.5 rounded-[4px] border border-[color:var(--ink)] bg-[var(--sheet)] px-2 py-0.5 font-mono text-[10.5px] font-semibold text-[color:var(--ink)] transition hover:bg-[var(--fill2)]"
        >
          <svg viewBox="0 0 12 12" className="size-3">
            <rect
              x="2.5"
              y="5.5"
              width="7"
              height="5"
              rx="1.2"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path
              d="M4 5.5V4a2 2 0 0 1 4 0v1.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          </svg>
          <span>{revealed ? "Revealed (Click to mask)" : badge}</span>
        </button>
      </div>
      <p className="font-mono text-[12px] leading-[1.85] text-[color:var(--bjork-text-medium)]">
        {segments.map((segment, index) =>
          typeof segment === "string" ? (
            <span key={index}>{segment}</span>
          ) : revealed ? (
            <code
              key={index}
              className="mx-0.5 inline-block rounded-[3px] border border-amber-600/40 bg-amber-500/15 px-1.5 font-mono text-[11px] font-bold text-amber-900 dark:text-amber-200"
            >
              {segment.redacted}
            </code>
          ) : (
            <span
              key={index}
              onClick={() => setRevealed(true)}
              title="Click to peek SEAL-masked token"
              className="relative mx-0.5 inline-block cursor-pointer rounded-[3px] border border-[color:var(--ink)] align-middle leading-none"
            >
              <span className="invisible px-1.5 font-mono text-[11px]">
                {segment.redacted}
              </span>
              <span
                className="absolute inset-0 rounded-[2px] bg-[color:var(--ink)] opacity-90"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(135deg, transparent 0 4px, rgba(255,255,255,0.22) 4px 5px)",
                }}
              />
            </span>
          )
        )}
      </p>
    </div>
  );
}

