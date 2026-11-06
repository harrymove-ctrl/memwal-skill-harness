"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Tick02Icon } from "@hugeicons/core-free-icons";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const pageFog =
  "bg-[var(--rb-n-100,oklch(97.7%_0.0055_80))] dark:bg-neutral-900";
const text1 = "text-neutral-900 dark:text-neutral-100";
const text3 = "text-neutral-900/62 dark:text-neutral-100/62";
const ruleEnd = "border-r border-transparent";
const typeHeadingSm = "text-[22px]/[28px] font-extrabold tracking-[-0.01em]";
const typeBodySm = "text-[14px]/[20px] font-medium";
const typeLabel = "text-[15px]/[20px] font-bold";
const typeCaption = "text-[13px]/[16px] font-semibold tabular-nums";
const cornerSm = "rounded-[var(--rb-r-4xl,18px)]";
const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_58%,black)] dark:focus-visible:outline-[var(--rb-accent,oklch(81%_0.16_163))]";
const transition =
  "transition-[color,background-color,border-color,box-shadow,outline-color,opacity,scale,translate] duration-[240ms] ease-[cubic-bezier(0.34,1.45,0.64,1)] active:duration-[90ms]";
const primaryButton =
  "relative inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap select-none transition-[color,background-color,border-color,box-shadow,outline-color,scale,translate,filter] duration-[240ms] ease-[cubic-bezier(0.34,1.45,0.64,1)] active:duration-[90ms] motion-reduce:active:translate-y-0 disabled:cursor-not-allowed aria-busy:cursor-progress focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_58%,black)] dark:focus-visible:outline-[var(--rb-accent,oklch(81%_0.16_163))] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_68%,white),var(--rb-accent,oklch(84%_0.15_165)))] text-[var(--rb-accent-fg,oklch(26%_0.06_168))] shadow-[inset_0_1px_0_rgb(255_255_255/0.5),inset_0_-2px_0_color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_70%,black),0_0_0_1px_color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_70%,black),0_4px_10px_-4px_color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_80%,transparent)] hover:not-disabled:-translate-y-px hover:not-disabled:brightness-[1.04] hover:not-disabled:shadow-[inset_0_1px_0_rgb(255_255_255/0.5),inset_0_-2px_0_color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_70%,black),0_0_0_1px_color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_70%,black),0_7px_16px_-6px_color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_85%,transparent)] active:not-disabled:translate-y-px active:not-disabled:brightness-[0.98] active:not-disabled:shadow-[inset_0_2px_4px_color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_55%,black),0_0_0_1px_color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_70%,black)] motion-reduce:hover:translate-y-0 disabled:opacity-45 disabled:shadow-none dark:bg-[linear-gradient(180deg,color-mix(in_oklab,var(--rb-accent,oklch(81%_0.16_163))_78%,white),var(--rb-accent,oklch(81%_0.16_163)))] dark:text-[var(--rb-accent-fg,oklch(26%_0.06_168))] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.45),inset_0_-2px_0_color-mix(in_oklab,var(--rb-accent,oklch(81%_0.16_163))_58%,black),0_0_0_1px_color-mix(in_oklab,var(--rb-accent,oklch(81%_0.16_163))_55%,black),0_6px_16px_-6px_color-mix(in_oklab,var(--rb-accent,oklch(81%_0.16_163))_55%,transparent)] dark:hover:not-disabled:shadow-[inset_0_1px_0_rgb(255_255_255/0.45),inset_0_-2px_0_color-mix(in_oklab,var(--rb-accent,oklch(81%_0.16_163))_58%,black),0_0_0_1px_color-mix(in_oklab,var(--rb-accent,oklch(81%_0.16_163))_55%,black),0_9px_22px_-8px_color-mix(in_oklab,var(--rb-accent,oklch(81%_0.16_163))_60%,transparent)] dark:active:not-disabled:shadow-[inset_0_2px_4px_color-mix(in_oklab,var(--rb-accent,oklch(81%_0.16_163))_45%,black),0_0_0_1px_color-mix(in_oklab,var(--rb-accent,oklch(81%_0.16_163))_55%,black)] dark:disabled:shadow-none";
const secondaryButton =
  "relative inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap select-none transition-[color,background-color,border-color,box-shadow,outline-color,scale,translate,filter] duration-[240ms] ease-[cubic-bezier(0.34,1.45,0.64,1)] active:duration-[90ms] motion-reduce:active:translate-y-0 disabled:cursor-not-allowed aria-busy:cursor-progress focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_58%,black)] dark:focus-visible:outline-[var(--rb-accent,oklch(81%_0.16_163))] border border-transparent bg-[linear-gradient(180deg,#ffffff,var(--rb-n-100,oklch(97.7%_0.0055_80)))] dark:bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-neutral-700)_55%,var(--color-neutral-800)),var(--color-neutral-800))] shadow-[0_0_0_1px_rgb(84_62_32/0.10),0_1px_1px_rgb(84_62_32/0.07),0_2px_5px_-2px_rgb(84_62_32/0.14)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.07),0_0_0_1px_rgb(0_0_0/0.6),0_2px_4px_-1px_rgb(0_0_0/0.5)] text-neutral-900 dark:text-neutral-100 hover:not-disabled:bg-[linear-gradient(180deg,#ffffff,color-mix(in_oklab,var(--rb-n-200,oklch(92.8%_0.009_76))_74%,white))] dark:hover:not-disabled:bg-[linear-gradient(180deg,var(--color-neutral-700),color-mix(in_oklab,var(--color-neutral-700)_55%,var(--color-neutral-800)))] active:not-disabled:translate-y-px active:not-disabled:shadow-[inset_0_1px_3px_rgb(84_62_32/0.16),0_0_0_1px_rgb(84_62_32/0.10)] dark:active:not-disabled:shadow-[inset_0_1px_3px_rgb(0_0_0/0.6),0_0_0_1px_rgb(0_0_0/0.6)] aria-expanded:bg-none aria-expanded:bg-[var(--rb-n-200,oklch(92.8%_0.009_76))] aria-expanded:shadow-[inset_0_1px_3px_rgb(84_62_32/0.14),0_0_0_1px_rgb(84_62_32/0.10)] dark:aria-expanded:bg-neutral-800 dark:aria-expanded:shadow-[inset_0_1px_3px_rgb(0_0_0/0.6),0_0_0_1px_rgb(0_0_0/0.6)] disabled:bg-none disabled:bg-[color-mix(in_oklab,var(--rb-n-200,oklch(92.8%_0.009_76))_58%,white)] disabled:text-neutral-900/40 disabled:shadow-none dark:disabled:bg-neutral-800/60 dark:disabled:text-neutral-100/40";
const buttonMd =
  "h-10 gap-2 rounded-[calc(var(--rb-r-full,999px))] px-5 text-[15px]/[20px] font-bold";
const buttonLg =
  "h-12 gap-2 rounded-[calc(var(--rb-r-full,999px))] px-6 text-[16px]/[20px] font-extrabold";
const inputBox =
  "relative flex w-full min-w-0 cursor-text items-center rounded-[calc(var(--rb-r-xl,12px))] data-concentric:rounded-[var(--rb-r-5xl,22px)] border border-transparent bg-[color-mix(in_oklab,var(--rb-n-200,oklch(92.8%_0.009_76))_58%,white)] dark:bg-neutral-950 shadow-[inset_0_1px_2px_rgb(84_62_32/0.09),inset_0_0_0_1px_rgb(84_62_32/0.035)] dark:shadow-[inset_0_1px_2px_rgb(0_0_0/0.6),inset_0_0_0_1px_rgb(255_255_255/0.045)] text-[15px]/[20px] font-medium text-neutral-900 transition-[border-color,box-shadow,background-color] duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:not-focus-within:not-has-[[aria-invalid=true]]:not-has-[input:disabled]:not-has-[input[readonly]]:bg-[color-mix(in_oklab,var(--rb-n-200,oklch(92.8%_0.009_76))_74%,white)] focus-within:border-[color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_58%,black)] focus-within:bg-white focus-within:shadow-[0_0_0_4px_color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_22%,transparent)] has-[[aria-invalid=true]]:border-[oklch(60%_0.236_26)] has-[[aria-invalid=true]]:bg-[oklch(97.5%_0.016_26)] has-[input:disabled]:cursor-not-allowed has-[input:disabled]:text-neutral-900/40 has-[input:disabled]:shadow-none has-[input[readonly]]:cursor-default has-[input[readonly]]:shadow-none dark:text-neutral-100 dark:hover:not-focus-within:not-has-[[aria-invalid=true]]:not-has-[input:disabled]:not-has-[input[readonly]]:bg-neutral-900 dark:focus-within:border-[var(--rb-accent,oklch(81%_0.16_163))] dark:focus-within:bg-neutral-900 dark:focus-within:shadow-[0_0_0_4px_color-mix(in_oklab,var(--rb-accent,oklch(81%_0.16_163))_18%,transparent)] dark:has-[[aria-invalid=true]]:border-[oklch(65.2%_0.219_26)] dark:has-[[aria-invalid=true]]:bg-[oklch(26%_0.04_26)] dark:has-[input:disabled]:text-neutral-100/40";
const fieldMd = "h-10";
const inputControl =
  "h-full w-full min-w-0 flex-1 bg-transparent px-3.5 outline-none [[data-affix]+&]:ps-2 [&:has(+[data-affix])]:pe-2 placeholder:font-medium placeholder:text-neutral-900/55 disabled:cursor-not-allowed disabled:placeholder:text-neutral-900/30 dark:placeholder:text-neutral-100/55 dark:disabled:placeholder:text-neutral-100/30 dark:[color-scheme:dark]";
const fieldLabel =
  "flex w-fit items-center gap-2 text-[15px]/[20px] font-bold text-neutral-900 dark:text-neutral-100";
const fieldDescription =
  "max-w-[60ch] text-[14px]/[20px] font-medium text-neutral-900/78 dark:text-neutral-100/78";
const checkboxBox =
  "relative inline-flex size-[18px] shrink-0 items-center justify-center";
const checkbox =
  "peer size-[18px] shrink-0 cursor-pointer appearance-none rounded-[calc(var(--rb-r-sm,6px))] border-2 border-neutral-900/28 bg-white transition-[background-color,border-color,box-shadow,outline-color,scale] duration-[240ms] ease-[cubic-bezier(0.34,1.45,0.64,1)] active:scale-[0.86] motion-reduce:active:scale-100 hover:not-checked:not-disabled:border-neutral-900/60 active:not-checked:bg-neutral-900/8 checked:border-transparent checked:bg-[var(--rb-accent,oklch(84%_0.15_165))] indeterminate:border-transparent indeterminate:bg-[var(--rb-accent,oklch(84%_0.15_165))] checked:shadow-[inset_0_1px_0_rgb(255_255_255/0.4),inset_0_-1.5px_0_color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_70%,black),0_0_0_1px_color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_70%,black)] indeterminate:shadow-[inset_0_1px_0_rgb(255_255_255/0.4),inset_0_-1.5px_0_color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_70%,black),0_0_0_1px_color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_70%,black)] aria-invalid:border-[oklch(60%_0.236_26)] disabled:cursor-not-allowed disabled:border-neutral-900/20 disabled:checked:bg-neutral-900/25 disabled:checked:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_58%,black)] dark:focus-visible:outline-[var(--rb-accent,oklch(81%_0.16_163))] dark:border-neutral-100/34 dark:bg-neutral-900 dark:hover:not-checked:not-disabled:border-neutral-100/70 dark:active:not-checked:bg-neutral-100/10 dark:checked:bg-[var(--rb-accent,oklch(81%_0.16_163))] dark:indeterminate:bg-[var(--rb-accent,oklch(81%_0.16_163))] dark:checked:shadow-none dark:indeterminate:shadow-none dark:aria-invalid:border-[oklch(65.2%_0.219_26)] dark:disabled:border-neutral-100/24 dark:disabled:checked:bg-neutral-100/28";
const checkboxMark =
  "pointer-events-none absolute scale-50 text-[var(--rb-accent-fg,oklch(26%_0.06_168))] opacity-0 transition-[opacity,scale] duration-[260ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] peer-checked:scale-100 peer-checked:opacity-100 peer-indeterminate:scale-100 peer-indeterminate:opacity-100 peer-active:scale-[0.86] motion-reduce:transition-none dark:text-[var(--rb-accent-fg,oklch(26%_0.06_168))]";
const radio =
  "size-[18px] shrink-0 cursor-pointer appearance-none rounded-full border-2 border-neutral-900/28 bg-white transition-[background-color,border-color,border-width,box-shadow,outline-color,scale] duration-[240ms] ease-[cubic-bezier(0.34,1.45,0.64,1)] active:scale-[0.86] motion-reduce:active:scale-100 hover:not-checked:not-disabled:border-neutral-900/60 active:not-checked:bg-neutral-900/8 checked:border-[6px] checked:border-[var(--rb-accent,oklch(84%_0.15_165))] checked:bg-white checked:shadow-[0_0_0_1px_color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_70%,black)] aria-invalid:border-[oklch(60%_0.236_26)] disabled:cursor-not-allowed disabled:border-neutral-900/20 disabled:checked:border-neutral-900/25 disabled:checked:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_58%,black)] dark:focus-visible:outline-[var(--rb-accent,oklch(81%_0.16_163))] dark:border-neutral-100/34 dark:bg-neutral-900 dark:hover:not-checked:not-disabled:border-neutral-100/70 dark:active:not-checked:bg-neutral-100/10 dark:checked:border-[var(--rb-accent,oklch(81%_0.16_163))] dark:checked:bg-neutral-900 dark:checked:shadow-none dark:aria-invalid:border-[oklch(65.2%_0.219_26)] dark:disabled:border-neutral-100/24 dark:disabled:checked:border-neutral-100/28";
const frame =
  "relative flex min-w-0 flex-col overflow-hidden rounded-[calc(var(--rb-r-6xl,26px))] border border-transparent bg-white dark:bg-[color-mix(in_oklab,var(--color-neutral-900)_74%,var(--color-neutral-800))] text-neutral-900 dark:text-neutral-100 shadow-[0_0_0_1px_rgb(84_62_32/0.07),0_1px_2px_rgb(84_62_32/0.06),0_8px_22px_-10px_rgb(84_62_32/0.20)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_rgb(0_0_0/0.6),0_10px_24px_-12px_rgb(0_0_0/0.8)]";
const itemRow =
  "relative flex min-h-12 w-full min-w-0 flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-left text-neutral-900 dark:text-neutral-100 transition-[background-color] duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] has-[[data-description]]:min-h-16";
const itemRowInteractive =
  "cursor-pointer hover:bg-[color-mix(in_oklab,var(--rb-n-200,oklch(92.8%_0.009_76))_74%,white)] dark:hover:bg-neutral-100/6 active:bg-[var(--rb-n-200,oklch(92.8%_0.009_76))] dark:active:bg-neutral-100/10";
const itemRowSelected =
  "bg-[color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_22%,transparent)] dark:bg-[color-mix(in_oklab,var(--rb-accent,oklch(81%_0.16_163))_18%,transparent)]";
const stepIndicator =
  "grid size-7 shrink-0 place-items-center rounded-full border-2 text-[13px]/[16px] font-extrabold tabular-nums";
const stepDone =
  "border-transparent bg-[var(--rb-accent,oklch(84%_0.15_165))] text-[var(--rb-accent-fg,oklch(26%_0.06_168))] shadow-[inset_0_-1.5px_0_color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_70%,black)] dark:bg-[var(--rb-accent,oklch(81%_0.16_163))] dark:text-[var(--rb-accent-fg,oklch(26%_0.06_168))] dark:shadow-none";
const stepCurrent =
  "border-[color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_58%,black)] bg-[color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_22%,transparent)] text-neutral-900 dark:text-neutral-100 dark:border-[var(--rb-accent,oklch(81%_0.16_163))] dark:bg-[color-mix(in_oklab,var(--rb-accent,oklch(81%_0.16_163))_18%,transparent)]";
const stepUpcoming =
  "border-transparent bg-[var(--rb-n-200,oklch(92.8%_0.009_76))] text-neutral-900/62 dark:text-neutral-100/62 dark:bg-neutral-100/10";
const fadeTopOnPaper =
  "bg-linear-to-b from-white to-transparent transition-opacity duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] dark:from-[color-mix(in_oklab,var(--color-neutral-900)_74%,var(--color-neutral-800))]";
const fadeBottomOnPaper =
  "bg-linear-to-t from-white to-transparent transition-opacity duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] dark:from-[color-mix(in_oklab,var(--color-neutral-900)_74%,var(--color-neutral-800))]";

function useScrollFade<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [edges, setEdges] = useState({ start: false, end: false });
  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setEdges({
      start: scrollTop > 1,
      end: scrollTop + clientHeight < scrollHeight - 1,
    });
  }, []);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    const RO = el.ownerDocument.defaultView?.ResizeObserver;
    const ro = RO ? new RO(update) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [update]);
  return { ref, edges, onScroll: update };
}

const STEPS = [
  { id: "profile", label: "Profile", blurb: "Basic profile details." },
  { id: "role", label: "Role", blurb: "Tune starter views." },
  { id: "source", label: "Source", blurb: "Optional discovery signal." },
  { id: "workspace", label: "Workspace", blurb: "Name the workspace." },
  { id: "goals", label: "Goals", blurb: "Pick first workflows." },
  { id: "invite", label: "Invite", blurb: "Add teammates." },
] as const;

const ROLES = ["Engineering", "Design", "Product", "Operations"];
const SOURCES = ["Search", "Social", "A colleague", "Conference talk"];
const GOALS = [
  "Track work across teams",
  "Automate handoffs",
  "Report on delivery",
  "Centralise documents",
];

const HEADINGS: Record<string, { title: string; blurb: string }> = {
  profile: {
    title: "Set up your profile",
    blurb: "Add the details teammates will see across the workspace.",
  },
  role: {
    title: "What do you work on?",
    blurb: "We use this to pick the starter views you land on.",
  },
  source: {
    title: "How did you find us?",
    blurb: "Optional, and it only ever shapes what we build next.",
  },
  workspace: {
    title: "Name your workspace",
    blurb: "This appears in invitations and in the sidebar.",
  },
  goals: {
    title: "What should we set up first?",
    blurb: "Pick as many as you like. You can change these later.",
  },
  invite: {
    title: "Bring your team in",
    blurb: "Invitations stay open for 14 days.",
  },
};

export default function Onboarding2() {
  const {
    ref: bodyRef,
    edges: bodyEdges,
    onScroll: onBodyScroll,
  } = useScrollFade<HTMLFormElement>();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("Sam Rivera");
  const [title, setTitle] = useState("Product Lead");
  const [role, setRole] = useState("Product");
  const [source, setSource] = useState("");
  const [workspace, setWorkspace] = useState("Northwind");
  const [goals, setGoals] = useState<string[]>([GOALS[0]]);
  const [invites, setInvites] = useState(["", ""]);

  const current = STEPS[step];
  const heading = HEADINGS[current.id];
  const last = step === STEPS.length - 1;

  const toggleGoal = (goal: string) =>
    setGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal],
    );

  const slug =
    workspace.trim().toLowerCase().replace(/\s+/g, "-") || "workspace";

  return (
    <div
      className={cx(
        pageFog,
        text1,
        "relative flex h-full min-h-[720px] w-full overflow-hidden",
      )}
    >
      <div className="hidden w-64 shrink-0 flex-col justify-center px-6 lg:flex">
        <ol className="space-y-0">
          {STEPS.map((item, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setStep(i)}
                  aria-current={active ? "step" : undefined}
                  className={cx(
                    focusRing,
                    transition,
                    cornerSm,
                    "flex w-full cursor-pointer items-start gap-3 px-1 py-1.5 text-left",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cx(
                      stepIndicator,
                      done ? stepDone : active ? stepCurrent : stepUpcoming,
                      "mt-0.5",
                    )}
                  >
                    {done ? (
                      <HugeiconsIcon
                        icon={Tick02Icon}
                        size={14}
                        strokeWidth={2.0}
                      />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={cx(
                        typeLabel,
                        "block truncate",
                        active || done ? text1 : text3,
                      )}
                    >
                      {item.label}
                      {done && <span className="sr-only">, done</span>}
                      {active && <span className="sr-only">, current</span>}
                    </span>
                    <span className={cx(typeCaption, text3, "block truncate")}>
                      {item.blurb}
                    </span>
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className={cx(ruleEnd, "ml-4 block h-3 w-px")}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="flex min-w-0 flex-1 p-4 sm:p-6">
        <div className={cx(frame, "min-w-0 flex-1")}>
          <form
            ref={bodyRef}
            onScroll={onBodyScroll}
            onSubmit={(e) => {
              e.preventDefault();
              if (!last) setStep((s) => s + 1);
            }}
            className="flex h-full w-full flex-col overflow-y-auto p-6 sm:p-10"
          >
            <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col">
              <p className={cx(typeCaption, text3, "lg:hidden")}>
                Step {step + 1} of {STEPS.length}
              </p>
              <h2 className={cx(typeHeadingSm, "mt-2 lg:mt-0")}>
                {heading.title}
              </h2>
              <p className={cx(typeBodySm, text3, "mt-1.5")}>{heading.blurb}</p>

              <div className="mt-8 space-y-4">
                {current.id === "profile" && (
                  <>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="ob2-name" className={fieldLabel}>
                        Full name
                      </label>
                      <div className={cx(inputBox, fieldMd)}>
                        <input
                          id="ob2-name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name"
                          className={inputControl}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="ob2-title" className={fieldLabel}>
                        Job title
                      </label>
                      <div className={cx(inputBox, fieldMd)}>
                        <input
                          id="ob2-title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="What you do"
                          className={inputControl}
                        />
                      </div>
                    </div>
                  </>
                )}

                {current.id === "role" && (
                  <div
                    role="radiogroup"
                    aria-label="Role"
                    className="flex flex-col gap-1"
                  >
                    {ROLES.map((option) => {
                      const selected = option === role;
                      return (
                        <label
                          key={option}
                          className={cx(
                            itemRow,
                            selected ? itemRowSelected : itemRowInteractive,
                            cornerSm,
                            "px-3",
                          )}
                        >
                          <input
                            type="radio"
                            name="ob2-role"
                            value={option}
                            checked={selected}
                            onChange={() => setRole(option)}
                            className={radio}
                          />
                          <span
                            className={cx(typeLabel, "min-w-0 flex-1 truncate")}
                          >
                            {option}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {current.id === "source" && (
                  <div
                    role="radiogroup"
                    aria-label="Source"
                    className="flex flex-col gap-1"
                  >
                    {SOURCES.map((option) => {
                      const selected = option === source;
                      return (
                        <label
                          key={option}
                          className={cx(
                            itemRow,
                            selected ? itemRowSelected : itemRowInteractive,
                            cornerSm,
                            "px-3",
                          )}
                        >
                          <input
                            type="radio"
                            name="ob2-source"
                            value={option}
                            checked={selected}
                            onChange={() => setSource(option)}
                            className={radio}
                          />
                          <span
                            className={cx(typeLabel, "min-w-0 flex-1 truncate")}
                          >
                            {option}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {current.id === "workspace" && (
                  <div className="flex flex-col gap-2">
                    <label htmlFor="ob2-ws" className={fieldLabel}>
                      Workspace name
                    </label>
                    <div className={cx(inputBox, fieldMd)}>
                      <input
                        id="ob2-ws"
                        value={workspace}
                        onChange={(e) => setWorkspace(e.target.value)}
                        placeholder="Acme"
                        aria-describedby="ob2-ws-hint"
                        className={inputControl}
                      />
                    </div>
                    <p id="ob2-ws-hint" className={fieldDescription}>
                      Your team will reach it at northwind.app/{slug}
                    </p>
                  </div>
                )}

                {current.id === "goals" && (
                  <div className="flex flex-col gap-1">
                    {GOALS.map((option) => {
                      const selected = goals.includes(option);
                      return (
                        <label
                          key={option}
                          className={cx(
                            itemRow,
                            selected ? itemRowSelected : itemRowInteractive,
                            cornerSm,
                            "px-3",
                          )}
                        >
                          <span className={checkboxBox}>
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleGoal(option)}
                              className={checkbox}
                            />
                            <HugeiconsIcon
                              icon={Tick02Icon}
                              size={14}
                              strokeWidth={2.5}
                              aria-hidden="true"
                              className={checkboxMark}
                            />
                          </span>
                          <span
                            className={cx(typeLabel, "min-w-0 flex-1 truncate")}
                          >
                            {option}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {current.id === "invite" && (
                  <>
                    {invites.map((email, i) => (
                      <div key={i} className="flex flex-col gap-2">
                        <label
                          htmlFor={`ob2-invite-${i}`}
                          className={fieldLabel}
                        >
                          Email address {i + 1}
                        </label>
                        <div className={cx(inputBox, fieldMd)}>
                          <input
                            id={`ob2-invite-${i}`}
                            type="email"
                            value={email}
                            onChange={(e) =>
                              setInvites((prev) =>
                                prev.map((v, j) =>
                                  j === i ? e.target.value : v,
                                ),
                              )
                            }
                            placeholder="teammate@company.com"
                            className={inputControl}
                          />
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setInvites((prev) => [...prev, ""])}
                      className={cx(secondaryButton, buttonMd)}
                    >
                      <HugeiconsIcon
                        icon={Add01Icon}
                        size={18}
                        strokeWidth={2.0}
                        aria-hidden="true"
                      />
                      Add another
                    </button>
                  </>
                )}
              </div>

              <div className="mt-8 flex shrink-0 items-center gap-2 pt-4">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    className={cx(secondaryButton, buttonLg)}
                  >
                    Back
                  </button>
                )}
                <button
                  type="submit"
                  className={cx(primaryButton, buttonLg, "flex-1")}
                >
                  {last ? "Finish setup" : "Continue"}
                </button>
              </div>
            </div>
          </form>
          <div
            aria-hidden="true"
            className={cx(
              fadeTopOnPaper,
              "pointer-events-none absolute inset-x-0 top-0 h-8",
              bodyEdges.start ? "opacity-100" : "opacity-0",
            )}
          />
          <div
            aria-hidden="true"
            className={cx(
              fadeBottomOnPaper,
              "pointer-events-none absolute inset-x-0 bottom-0 h-8",
              bodyEdges.end ? "opacity-100" : "opacity-0",
            )}
          />
        </div>
      </div>
    </div>
  );
}
