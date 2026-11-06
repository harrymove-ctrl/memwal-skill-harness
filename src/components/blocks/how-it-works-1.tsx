"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Check,
  Copy,
  KeyRound,
  Sparkles,
  Terminal,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import type { RoutePath } from "../../App";

interface HowItWorksProps {
  namespace: string;
  accountId: string;
  skillsCount: number;
  flowsCount: number;
  cliCommand: string;
  onNavigate?: (path: RoutePath) => void;
}

export function HowItWorks1({
  namespace = "memwal-team-skills",
  accountId = "0x52ada02a30d40ad519bd0b8203d79bb29cc548b0b142ea6e14a71a33567b58b9",
  skillsCount = 15,
  flowsCount = 8,
  cliCommand,
  onNavigate,
}: HowItWorksProps) {
  const shouldReduceMotion = useReducedMotion();
  const [copiedStep, setCopiedStep] = useState(false);

  const defaultCli =
    cliCommand ||
    `claude mcp add memwal -e MEMWAL_ACCOUNT_ID=${accountId.slice(0, 14)}... -e MEMWAL_NAMESPACE=${namespace} -- npx -y @mysten-incubation/memwal-mcp`;

  const handleCopyCli = async () => {
    try {
      await navigator.clipboard.writeText(defaultCli);
      setCopiedStep(true);
      setTimeout(() => setCopiedStep(false), 1800);
    } catch {
      // ignore clipboard errors in headless mode
    }
  };

  const steps = [
    {
      index: "01",
      badge: "FASTEST · < 100MS",
      title: "Authenticate with Dev Wallet or Enoki Portal",
      description:
        "Start immediately with a 1-click @mysten-incubation/dev-wallet (gasless /sponsor on Sui Mainnet) or sign in with Google/GitHub via Mysten Enoki zkLogin without seed phrases.",
      meta: `On-chain MemWalAccount ${accountId.slice(0, 10)}…${accountId.slice(-6)}`,
      actionLabel: "1-Click Dev Wallet Ready",
      icon: KeyRound,
    },
    {
      index: "02",
      badge: "1-CLICK COPY · ZERO CONFIG",
      title: "Copy 1-Line MCP Command into Your IDE",
      description:
        "Paste one command into Claude Code, Cursor, Windsurf, or Antigravity. Every agent on your machine connects to the shared Walrus Memory namespace.",
      meta: defaultCli,
      actionLabel: copiedStep ? "Copied CLI Command ✓" : "Copy claude mcp add",
      onAction: handleCopyCli,
      icon: Terminal,
    },
    {
      index: "03",
      badge: `${skillsCount} SKILLS · ${flowsCount} FLOW BLOBS`,
      title: "Recall Live Rules & Override Stale SKILL.md",
      description:
        "When an agent runs QA or reviews a PR, memwal_recall fetches SEAL-decrypted Flow Memory blobs and overrides outdated instructions with cryptographic blob_id proof.",
      meta: `Active namespace: ${namespace} (SEAL v0 verified)`,
      actionLabel: "Open /eval Trajectory Ledger →",
      onAction: () => onNavigate?.("/eval"),
      icon: Sparkles,
    },
  ];

  return (
    <section
      aria-label="How Walrus Memory Onboarding Works"
      className="w-full rounded-[22px] border border-neutral-900/10 bg-[var(--rb-n-100,oklch(96.7%_0.001_286.375))] px-5 py-7 dark:border-neutral-100/10 dark:bg-neutral-900/90 sm:px-7"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-neutral-900/10 pb-5 dark:border-neutral-100/10">
        <div>
          <p className="font-mono text-xs font-semibold tracking-[0.08em] text-emerald-700 uppercase dark:text-emerald-300">
            HOW ONBOARDING WORKS · 3 STEPS IN 15 SECONDS
          </p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-neutral-900 sm:text-3xl dark:text-neutral-100">
            Onboard any teammate or coding agent without touching Move contracts
          </h2>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-900/12 bg-white px-3.5 py-1.5 font-mono text-xs font-bold text-neutral-900 shadow-2xs dark:border-neutral-100/12 dark:bg-neutral-950 dark:text-neutral-100">
          <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Dev Wallet (~40ms) · Enoki zkLogin (~1.2s)</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.index}
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.28,
                delay: shouldReduceMotion ? 0 : idx * 0.05,
                ease: "easeOut",
              }}
              className="flex flex-col justify-between rounded-[18px] border border-neutral-900/10 bg-white p-5 shadow-2xs dark:border-neutral-100/10 dark:bg-neutral-950"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_28%,transparent)] px-2.5 py-1 font-mono text-[11px] font-extrabold text-neutral-900 dark:text-neutral-100">
                    <span>STEP {step.index}</span>
                    <span>·</span>
                    <span>{step.badge}</span>
                  </span>
                  <span className="inline-flex size-8 items-center justify-center rounded-full border border-neutral-900/10 bg-[var(--rb-n-100)] text-neutral-900 dark:border-neutral-100/10 dark:bg-neutral-900 dark:text-neutral-100">
                    <Icon className="size-4" />
                  </span>
                </div>

                <h3 className="mt-3.5 text-lg font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-900/70 dark:text-neutral-100/70">
                  {step.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-900/8 dark:border-neutral-100/8">
                <div className="truncate rounded-[10px] border border-neutral-900/10 bg-[var(--rb-n-100)] px-3 py-2 font-mono text-[11px] font-medium text-neutral-900/85 dark:border-neutral-100/10 dark:bg-neutral-900 dark:text-neutral-100/85">
                  {step.meta}
                </div>

                {step.onAction ? (
                  <button
                    type="button"
                    onClick={step.onAction}
                    className="mt-2.5 inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-full border border-neutral-900/15 bg-neutral-900 px-3.5 py-2 font-mono text-xs font-bold text-white transition hover:opacity-90 dark:border-neutral-100/15 dark:bg-neutral-100 dark:text-neutral-950"
                  >
                    {idx === 1 ? (
                      copiedStep ? (
                        <Check className="size-3.5 text-emerald-400 dark:text-emerald-600" />
                      ) : (
                        <Copy className="size-3.5" />
                      )
                    ) : (
                      <ArrowRight className="size-3.5" />
                    )}
                    <span>{step.actionLabel}</span>
                  </button>
                ) : (
                  <div className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-emerald-600/35 bg-emerald-500/10 px-3.5 py-2 font-mono text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <Check className="size-3.5" />
                    <span>{step.actionLabel}</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

export default HowItWorks1;
