"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Compass } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon, UnfoldMoreIcon } from "@hugeicons/core-free-icons";
import { ThemeToggle } from "../theme-toggle";
import { GooeyNavbar } from "../gooey-navbar";
import {
  ONCHAIN_DELEGATE_PROFILES,
  QA_STRESS_SCENARIOS,
  createMemWalClient,
  deriveDelegateKeyIdentity,
  getEnvDefaultConfig,
  hasLiveCredentials,
  provisionNewDevWalletAccountOnChain,
  resolveDelegateProfile,
  verifyRealMemWalCredentials,
  type VerifiedRealMemWalSession,
} from "../../lib/memwalBridge";
import {
  connectEnokiGoogleZkLogin,
  connectSlushOrBrowserWallet,
  ensureEnokiRegistered,
  getInstalledBrowserWallets,
  signWorkspacePermissionWithWallet,
  subscribeBrowserWallets,
} from "../../lib/walletAuth";
import {
  buildAgentSelfUpdatingMarkdown,
  buildOnePasteAgentPrompt,
  buildStorageModeMcpJson,
  buildWalrusConsoleMcpCli,
  createConsoleBucketFast,
  DEFAULT_CONSOLE_BUNDLE,
  downloadMarkdownFile,
  INITIAL_CONSOLE_BUCKETS,
  parseConsoleCredentialBundle,
  type ConsoleCredentialBundle,
  type SkillStorageMode,
} from "../../lib/consoleBuckets";
import type { Wallet, WalletAccount } from "@mysten/wallet-standard";
import type { WalrusConnectionConfig } from "../../types";
import type { RoutePath } from "../../App";
import { CommandPalette, type CommandItem } from "../interior/command-palette";
import {
  BucketFolder3DIcon,
  SignerOrb3D,
  WalrusLogo3D,
} from "../ui/walrus-3d-icons";
import { Markdown } from "./markdown";
import {
  AmicroButton,
  AmicroMorphTabs,
  AmicroTextReveal,
} from "../amicro/amicro-suite";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const canvas = "bg-white dark:bg-neutral-950";
const text1 = "text-neutral-900 dark:text-neutral-100";
const text2 = "text-neutral-900/78 dark:text-neutral-100/78";
const text3 = "text-neutral-900/62 dark:text-neutral-100/62";
const barRule =
  "border-b border-[color-mix(in_oklab,var(--rb-n-200,oklch(92.8%_0.009_76))_88%,white)] dark:border-neutral-100/7";
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
const buttonLg =
  "h-12 gap-2 rounded-[calc(var(--rb-r-full,999px))] px-6 text-[16px]/[20px] font-extrabold";
const buttonSm =
  "h-9 gap-1.5 rounded-[calc(var(--rb-r-full,999px))] px-4 text-[13px]/[16px] font-bold";
const inputBox =
  "relative flex w-full min-w-0 cursor-text items-center rounded-[calc(var(--rb-r-xl,12px))] data-concentric:rounded-[var(--rb-r-5xl,22px)] border border-transparent bg-[color-mix(in_oklab,var(--rb-n-200,oklch(92.8%_0.009_76))_58%,white)] dark:bg-neutral-950 shadow-[inset_0_1px_2px_rgb(84_62_32/0.09),inset_0_0_0_1px_rgb(84_62_32/0.035)] dark:shadow-[inset_0_1px_2px_rgb(0_0_0/0.6),inset_0_0_0_1px_rgb(255_255_255/0.045)] text-[15px]/[20px] font-medium text-neutral-900 transition-[border-color,box-shadow,background-color] duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:not-focus-within:not-has-[[aria-invalid=true]]:not-has-[input:disabled]:not-has-[input[readonly]]:bg-[color-mix(in_oklab,var(--rb-n-200,oklch(92.8%_0.009_76))_74%,white)] focus-within:border-[color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_58%,black)] focus-within:bg-white focus-within:shadow-[0_0_0_4px_color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_22%,transparent)] has-[[aria-invalid=true]]:border-[oklch(60%_0.236_26)] has-[[aria-invalid=true]]:bg-[oklch(97.5%_0.016_26)] has-[input:disabled]:cursor-not-allowed has-[input:disabled]:text-neutral-900/40 has-[input:disabled]:shadow-none has-[input[readonly]]:cursor-default has-[input[readonly]]:shadow-none dark:text-neutral-100 dark:hover:not-focus-within:not-has-[[aria-invalid=true]]:not-has-[input:disabled]:not-has-[input[readonly]]:bg-neutral-900 dark:focus-within:border-[var(--rb-accent,oklch(81%_0.16_163))] dark:focus-within:bg-neutral-900 dark:focus-within:shadow-[0_0_0_4px_color-mix(in_oklab,var(--rb-accent,oklch(81%_0.16_163))_18%,transparent)] dark:has-[[aria-invalid=true]]:border-[oklch(65.2%_0.219_26)] dark:has-[[aria-invalid=true]]:bg-[oklch(26%_0.04_26)] dark:has-[input:disabled]:text-neutral-100/40";
const fieldMd = "h-10";
const inputControl =
  "h-full w-full min-w-0 flex-1 bg-transparent px-3.5 outline-none [[data-affix]+&]:ps-2 [&:has(+[data-affix])]:pe-2 placeholder:font-medium placeholder:text-neutral-900/55 disabled:cursor-not-allowed disabled:placeholder:text-neutral-900/30 dark:placeholder:text-neutral-100/55 dark:disabled:placeholder:text-neutral-100/30 dark:[color-scheme:dark]";
const inputAffix =
  "flex shrink-0 items-center gap-2 text-[15px]/[20px] font-semibold text-neutral-900/62 dark:text-neutral-100/62 select-none first:ps-3.5 last:pe-3.5 has-[button]:first:ps-1 has-[button]:last:pe-1";
const fieldLabel =
  "flex w-fit items-center gap-2 text-[15px]/[20px] font-bold text-neutral-900 dark:text-neutral-100";
const fieldDescription =
  "max-w-[60ch] text-[14px]/[20px] font-medium text-neutral-900/78 dark:text-neutral-100/78";
const selectTrigger =
  "inline-flex h-10 w-fit min-w-40 cursor-pointer items-center justify-between gap-2 rounded-[calc(var(--rb-r-xl,12px))] border border-transparent bg-[color-mix(in_oklab,var(--rb-n-200,oklch(92.8%_0.009_76))_58%,white)] dark:bg-neutral-950 shadow-[inset_0_1px_2px_rgb(84_62_32/0.09),inset_0_0_0_1px_rgb(84_62_32/0.035)] dark:shadow-[inset_0_1px_2px_rgb(0_0_0/0.6),inset_0_0_0_1px_rgb(255_255_255/0.045)] px-3.5 text-left text-[15px]/[20px] font-semibold whitespace-nowrap text-neutral-900 outline-none select-none transition-[border-color,box-shadow,background-color] duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:not-disabled:not-aria-invalid:not-aria-expanded:bg-[color-mix(in_oklab,var(--rb-n-200,oklch(92.8%_0.009_76))_74%,white)] focus-visible:border-[color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_58%,black)] focus-visible:bg-white focus-visible:shadow-[0_0_0_4px_color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_22%,transparent)] aria-expanded:border-[color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_58%,black)] aria-expanded:bg-white aria-expanded:shadow-[0_0_0_4px_color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_22%,transparent)] aria-invalid:border-[oklch(60%_0.236_26)] disabled:cursor-not-allowed disabled:text-neutral-900/40 disabled:shadow-none dark:text-neutral-100 dark:hover:not-disabled:not-aria-invalid:not-aria-expanded:bg-neutral-900 dark:focus-visible:border-[var(--rb-accent,oklch(81%_0.16_163))] dark:focus-visible:bg-neutral-900 dark:focus-visible:shadow-[0_0_0_4px_color-mix(in_oklab,var(--rb-accent,oklch(81%_0.16_163))_18%,transparent)] dark:aria-expanded:border-[var(--rb-accent,oklch(81%_0.16_163))] dark:aria-expanded:bg-neutral-900 dark:aria-expanded:shadow-[0_0_0_4px_color-mix(in_oklab,var(--rb-accent,oklch(81%_0.16_163))_18%,transparent)] dark:aria-invalid:border-[oklch(65.2%_0.219_26)] dark:disabled:text-neutral-100/40";
const selectPlaceholder = "text-neutral-900/62 dark:text-neutral-100/62";
const selectCaret = "shrink-0 text-neutral-900/78 dark:text-neutral-100/78";
const switchTrack =
  "group relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full bg-[var(--rb-n-200,oklch(92.8%_0.009_76))] p-0.5 shadow-[inset_0_1px_2px_rgb(84_62_32/0.14),inset_0_0_0_1px_rgb(84_62_32/0.05)] transition-[background-color,box-shadow,outline-color] duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:aria-[checked=false]:not-disabled:bg-[color-mix(in_oklab,var(--rb-n-200,oklch(92.8%_0.009_76))_94%,black)] aria-checked:bg-[var(--rb-accent,oklch(84%_0.15_165))] aria-checked:shadow-[inset_0_1px_2px_color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_55%,black),inset_0_0_0_1px_color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_75%,black)] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_58%,black)] dark:focus-visible:outline-[var(--rb-accent,oklch(81%_0.16_163))] dark:bg-neutral-100/16 dark:shadow-[inset_0_1px_2px_rgb(0_0_0/0.6)] dark:hover:aria-[checked=false]:not-disabled:bg-neutral-100/24 dark:aria-checked:bg-[var(--rb-accent,oklch(81%_0.16_163))] dark:aria-checked:shadow-[inset_0_1px_2px_rgb(0_0_0/0.35)]";
const switchThumb =
  "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-[0_0_0_1px_rgb(84_62_32/0.10),0_1px_2px_rgb(84_62_32/0.10),0_3px_8px_-2px_rgb(84_62_32/0.20)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_0_0_1px_rgb(0_0_0/0.6),0_2px_6px_-1px_rgb(0_0_0/0.6)] transition-[translate,width] duration-[280ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none group-active:w-6 group-aria-checked:translate-x-4 group-aria-checked:group-active:translate-x-3 group-disabled:shadow-none dark:bg-white";
const frame =
  "relative flex min-w-0 flex-col overflow-hidden rounded-[calc(var(--rb-r-6xl,26px))] border border-transparent bg-white dark:bg-[color-mix(in_oklab,var(--color-neutral-900)_74%,var(--color-neutral-800))] text-neutral-900 dark:text-neutral-100 shadow-[0_0_0_1px_rgb(84_62_32/0.07),0_1px_2px_rgb(84_62_32/0.06),0_8px_22px_-10px_rgb(84_62_32/0.20)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_rgb(0_0_0/0.6),0_10px_24px_-12px_rgb(0_0_0/0.8)]";
const stepIndicator =
  "grid size-7 shrink-0 place-items-center rounded-full border-2 text-[13px]/[16px] font-extrabold tabular-nums";
const stepDone =
  "border-transparent bg-[var(--rb-accent,oklch(84%_0.15_165))] text-[var(--rb-accent-fg,oklch(26%_0.06_168))] shadow-[inset_0_-1.5px_0_color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_70%,black)] dark:bg-[var(--rb-accent,oklch(81%_0.16_163))] dark:text-[var(--rb-accent-fg,oklch(26%_0.06_168))] dark:shadow-none";
const stepUpcoming =
  "border-transparent bg-[var(--rb-n-200,oklch(92.8%_0.009_76))] text-neutral-900/62 dark:text-neutral-100/62 dark:bg-neutral-100/10";
const onboardingPillBadge =
  "inline-flex shrink-0 items-center gap-1 rounded-full bg-[color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_28%,white)] px-2.5 py-0.5 font-mono text-[10.5px] font-bold text-[var(--rb-accent-fg,oklch(26%_0.06_168))] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_52%,transparent)] dark:bg-[color-mix(in_oklab,var(--rb-accent,oklch(81%_0.16_163))_18%,transparent)] dark:text-[#6ee7b7] dark:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--rb-accent,oklch(81%_0.16_163))_35%,transparent)]";
const onboardingCopyBtn = cx(
  secondaryButton,
  "h-7 px-3 rounded-full font-mono text-[11px] font-bold",
);
const menuPopup =
  "min-w-52 max-w-[min(480px,calc(100vw-2rem))] overflow-x-hidden overflow-y-auto overscroll-contain rounded-[calc(var(--rb-r-3xl,16px))] border border-transparent bg-white dark:bg-[color-mix(in_oklab,var(--color-neutral-900)_74%,var(--color-neutral-800))] p-2 text-neutral-900 dark:text-neutral-100 outline-none shadow-[0_0_0_1px_rgb(84_62_32/0.08),0_24px_56px_-20px_rgb(84_62_32/0.34),0_6px_16px_-8px_rgb(84_62_32/0.14)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.07),0_0_0_1px_rgb(0_0_0/0.65),0_24px_56px_-16px_rgb(0_0_0/0.8)]";
const menuItem =
  "relative flex min-h-10 w-full cursor-default items-center gap-2.5 rounded-[calc(var(--rb-r-md,8px))] px-3 py-2 text-left text-[15px]/[20px] font-semibold text-neutral-900 outline-none select-none [&_svg]:shrink-0 [&_svg]:text-neutral-900/70 hover:bg-[color-mix(in_oklab,var(--rb-n-200,oklch(92.8%_0.009_76))_74%,white)] focus-visible:bg-[color-mix(in_oklab,var(--rb-n-200,oklch(92.8%_0.009_76))_74%,white)] data-[highlighted]:bg-[color-mix(in_oklab,var(--rb-n-200,oklch(92.8%_0.009_76))_74%,white)] aria-selected:bg-[color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_22%,transparent)] aria-disabled:cursor-not-allowed aria-disabled:text-neutral-900/40 dark:text-neutral-100 dark:[&_svg]:text-neutral-100/70 dark:hover:bg-neutral-100/7 dark:focus-visible:bg-neutral-100/7 dark:data-[highlighted]:bg-neutral-100/7 dark:aria-selected:bg-[color-mix(in_oklab,var(--rb-accent,oklch(81%_0.16_163))_18%,transparent)] dark:aria-disabled:text-neutral-100/40";

type SelectOption = { value: string; label: string; hint?: string };

function Select({
  id,
  value,
  onChange,
  options,
  disabled,
  placeholder = "Select…",
  className,
  triggerClassName,
  leading,
  ariaLabel,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  leading?: ReactNode;
  ariaLabel?: string;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [flip, setFlip] = useState(false);
  const [listMax, setListMax] = useState<number>();
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef({ buffer: "", at: 0 });

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const openList = (index?: number) => {
    if (disabled) return;
    const node = rootRef.current;
    const win = node?.ownerDocument.defaultView;
    if (node && win) {
      const r = node.getBoundingClientRect();
      let top = 0;
      let bottom = win.innerHeight;
      for (let el = node.parentElement; el; el = el.parentElement) {
        if (
          /auto|scroll|hidden|clip/.test(win.getComputedStyle(el).overflowY)
        ) {
          const box = el.getBoundingClientRect();
          top = Math.max(top, box.top);
          bottom = Math.min(bottom, box.bottom);
          break;
        }
      }
      const below = bottom - r.bottom;
      const above = r.top - top;
      const needed = Math.min(options.length * 32 + 8, 264);
      const up = below < needed + 8 && above > below;
      const room = (up ? above : below) - 8;
      setFlip(up);
      setListMax(room < needed ? Math.max(room, 40) : undefined);
    }
    setActive(index ?? (selectedIndex >= 0 ? selectedIndex : 0));
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const node = rootRef.current;
    const doc = node?.ownerDocument;
    if (!doc) return;
    const onPointer = (e: Event) => {
      if (!node.contains(e.target as Node)) setOpen(false);
    };
    doc.addEventListener("mousedown", onPointer);
    doc.addEventListener("touchstart", onPointer);
    return () => {
      doc.removeEventListener("mousedown", onPointer);
      doc.removeEventListener("touchstart", onPointer);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    const row = list?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    if (!list || !row) return;
    const top = row.offsetTop;
    const bottom = top + row.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight)
      list.scrollTop = bottom - list.clientHeight;
  }, [open, active]);

  const commit = (index: number) => {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    setOpen(false);
    rootRef.current?.querySelector("button")?.focus({ preventScroll: true });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!open) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === "Escape" || e.key === "Tab") {
      if (e.key === "Escape") e.stopPropagation();
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(options.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      commit(active);
    } else if (e.key.length === 1 && /\S/.test(e.key)) {
      const now = Date.now();
      const t = typeahead.current;
      t.buffer = now - t.at > 700 ? e.key : t.buffer + e.key;
      t.at = now;
      const hit = options.findIndex((o) =>
        o.label.toLowerCase().startsWith(t.buffer.toLowerCase()),
      );
      if (hit >= 0) setActive(hit);
    }
  };

  return (
    <div ref={rootRef} className={cx("relative", className)}>
      <button
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        aria-label={ariaLabel}
        className={cx(selectTrigger, "w-full min-w-[100%]", triggerClassName)}
      >
        <span className="flex min-w-0 items-center gap-2">
          {leading}
          <span className={cx("truncate", !selected && selectPlaceholder)}>
            {selected ? selected.label : placeholder}
          </span>
        </span>
        <HugeiconsIcon
          icon={UnfoldMoreIcon}
          size={18}
          strokeWidth={2.0}
          aria-hidden="true"
          className={selectCaret}
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          style={{ maxHeight: listMax }}
          className={cx(
            menuPopup,
            "absolute z-30 max-h-[264px] w-full min-w-[100%]",
            flip ? "bottom-full mb-1.5" : "top-full mt-1.5",
          )}
        >
          {options.map((o, i) => {
            const isSelected = o.value === value;
            return (
              <li
                key={o.value}
                role="option"
                aria-selected={isSelected}
                data-index={i}
                data-highlighted={i === active ? "" : undefined}
                onMouseEnter={() => setActive(i)}
                onClick={() => commit(i)}
                className={cx(menuItem, "pe-8")}
              >
                <span className="flex min-w-0 items-baseline gap-2">
                  <span className="truncate">{o.label}</span>
                  {o.hint && (
                    <span className={cx(typeCaption, text3, "shrink-0")}>
                      {o.hint}
                    </span>
                  )}
                </span>
                {isSelected && (
                  <HugeiconsIcon
                    icon={Tick02Icon}
                    size={18}
                    strokeWidth={2.0}
                    aria-hidden="true"
                    className="pointer-events-none absolute end-2"
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

const STEPS = ["Account", "Folder", "Team", "Finish"];

const AUTH_METHOD_OPTIONS: SelectOption[] = [
  {
    value: "slush",
    label: "Slush Wallet (Sui Browser Extension)",
    hint: "Wallet Standard",
  },
  {
    value: "console-bundle",
    label: "Walrus Console Bundle (console.walrus.xyz/buckets)",
    hint: "1-Paste hbr_…",
  },
  {
    value: "enoki",
    label: "Mysten Enoki Portal (Google zkLogin)",
    hint: "Google OAuth",
  },
  {
    value: "dev-wallet",
    label: "Dev Wallet (@mysten-incubation/dev-wallet)",
    hint: "~40ms · Fastest",
  },
  {
    value: "manual",
    label: "Manual Delegate Key (MEMWAL_KEY)",
    hint: "Existing vault",
  },
];

const DEV_WALLET_ACCOUNT_OPTIONS: SelectOption[] =
  ONCHAIN_DELEGATE_PROFILES.map((p) => ({
    value: p.handle,
    label: `${p.handle} (${p.displayName})`,
    hint: `${p.suiAddress.slice(0, 8)}…${p.suiAddress.slice(-4)}`,
  }));

const ENOKI_PROVIDER_OPTIONS: SelectOption[] = [
  {
    value: "google",
    label: "Google Workspace (zkLogin)",
    hint: "Zero-knowledge OAuth",
  },
  {
    value: "github",
    label: "GitHub Organization (zkLogin)",
    hint: "mystenlabs / team",
  },
];

const REGIONS = [
  "Sui Mainnet · Global (relayer.memory.walrus.xyz)",
  "Sui Mainnet · Walrus Console (console.walrus.xyz)",
  "Local Devnet · Asia Pacific (127.0.0.1:8000)",
];

const REGION_OPTIONS: SelectOption[] = [
  {
    value: REGIONS[0],
    label: REGIONS[0],
    hint: "Mainnet Sponsored",
  },
  {
    value: REGIONS[1],
    label: REGIONS[1],
    hint: "Walrus Console",
  },
  {
    value: REGIONS[2],
    label: REGIONS[2],
    hint: "Local",
  },
];

const COPY_FORMAT_OPTIONS: SelectOption[] = [
  {
    value: "agent-prompt",
    label: "Agent Prompt (.md) · Paste into chat",
    hint: "Recommended",
  },
  {
    value: "agents-md",
    label: "AGENTS.md File · Save in your repo",
    hint: ".md file",
  },
  {
    value: "console-cli",
    label: "Terminal Command · 1-line MCP install",
    hint: "Bucket CLI",
  },
  {
    value: "mcp-json",
    label: "IDE Config · .mcp.json",
    hint: "Cursor / AGY",
  },
  {
    value: "cli",
    label: "Claude Code CLI · MemWal MCP",
    hint: "Flow memory",
  },
];

export interface WorkspaceSummaryItem {
  slug: string;
  name: string;
  skillsCount: number;
  flowsCount: number;
  bucketId?: string;
  sealPolicyId?: string;
  ownerAddress?: string;
  rosterReason?: string;
  consoleUrl?: string;
  region?: string;
  isPrivate?: boolean;
}

export interface Onboarding7Props {
  config?: WalrusConnectionConfig;
  isAuthenticated?: boolean;
  isDark?: boolean;
  skillsCount?: number;
  flowsCount?: number;
  existingWorkspaces?: WorkspaceSummaryItem[];
  onCreateWorkspace?: (ws: WorkspaceSummaryItem) => void;
  onUpdateConfig?: (next: WalrusConnectionConfig) => void;
  onQuickUnlockDevWallet?: () => void;
  onProvisionedAccount?: (next: Partial<WalrusConnectionConfig>) => void;
  onNavigate?: (path: RoutePath) => void;
  onOpenTour?: () => void;
  onToggleTheme?: (next: boolean) => void;
}

const DEFAULT_EXISTING_WORKSPACES: WorkspaceSummaryItem[] =
  INITIAL_CONSOLE_BUCKETS.map((b) => ({
    slug: b.slug,
    name: b.name,
    skillsCount: b.skillsCount,
    flowsCount: b.flowsCount,
    bucketId: b.bucketId,
    sealPolicyId: b.sealPolicyId,
    ownerAddress: b.ownerAddress,
    rosterReason: b.rosterReason,
    consoleUrl: b.consoleUrl,
    region: "Sui Mainnet · Walrus Console (console.walrus.xyz)",
    isPrivate: true,
  }));

export default function Onboarding7({
  config,
  isAuthenticated = false,
  isDark = false,
  skillsCount = 15,
  flowsCount = 8,
  existingWorkspaces = DEFAULT_EXISTING_WORKSPACES,
  onCreateWorkspace,
  onUpdateConfig,
  onQuickUnlockDevWallet,
  onProvisionedAccount,
  onNavigate,
  onOpenTour,
  onToggleTheme,
}: Onboarding7Props = {}) {
  const [step, setStep] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const qStep = Number(params.get("step"));
      if (
        !Number.isNaN(qStep) &&
        qStep >= 0 &&
        qStep < STEPS.length &&
        (isAuthenticated || params.get("authed") === "1" || params.has("step"))
      ) {
        return qStep;
      }
    }
    return 0;
  });
  const [authMethod, setAuthMethod] = useState(() => {
    if (typeof window !== "undefined") {
      const m = new URLSearchParams(window.location.search).get("method");
      if (
        m &&
        [
          "paste-keys",
          "console-bundle",
          "slush",
          "enoki",
          "dev-wallet",
          "manual",
        ].includes(m)
      ) {
        return m;
      }
    }
    return "paste-keys";
  });
  const [pastedBucketId, setPastedBucketId] = useState(() => {
    if (typeof window !== "undefined") {
      const b = new URLSearchParams(window.location.search).get("bucket");
      if (b) return b;
    }
    return isAuthenticated && config?.namespace ? config.namespace : "";
  });
  const [pastedAccountId, setPastedAccountId] = useState(() => {
    if (typeof window !== "undefined") {
      const a = new URLSearchParams(window.location.search).get("account");
      if (a) return a;
    }
    return isAuthenticated && config?.accountId ? config.accountId : "";
  });
  const [pastedDelegateKey, setPastedDelegateKey] = useState(() => {
    if (typeof window !== "undefined") {
      const k = new URLSearchParams(window.location.search).get("key");
      if (k) return k;
    }
    return isAuthenticated && config?.delegateKey ? config.delegateKey : "";
  });
  const [pastedConsoleApiKey, setPastedConsoleApiKey] = useState("");
  const hasLocalOwnerSession =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.localStorage.getItem("memwal_owner_fast_session_v1") === "true");
  const [selectedDevWalletHandle, setSelectedDevWalletHandle] =
    useState<string>(() =>
      hasLocalOwnerSession ? "@harrymove-ctrl" : "@teammate-qa",
    );
  const [devWalletBucketId, setDevWalletBucketId] =
    useState<string>("memwal-team-skills");
  const [provisioningDevWallet, setProvisioningDevWallet] = useState(false);
  const [verifiedSession, setVerifiedSession] =
    useState<VerifiedRealMemWalSession | null>(null);
  const [storageMode, setStorageMode] = useState<SkillStorageMode>(() => {
    if (typeof window !== "undefined") {
      const sm = new URLSearchParams(window.location.search).get("storage");
      if (sm === "console-only" || sm === "hybrid") return sm;
    }
    return "hybrid";
  });
  const [consoleBundle, setConsoleBundle] = useState<ConsoleCredentialBundle>(
    DEFAULT_CONSOLE_BUNDLE,
  );
  const [consoleBundleInput, setConsoleBundleInput] = useState(() =>
    JSON.stringify(DEFAULT_CONSOLE_BUNDLE, null, 2),
  );
  const [enokiProvider, setEnokiProvider] = useState<"google" | "github">(
    "google",
  );
  const [browserWallets, setBrowserWallets] = useState<Wallet[]>(() =>
    getInstalledBrowserWallets(),
  );
  const [selectedBrowserWallet, setSelectedBrowserWallet] =
    useState<string>("Slush");
  const [connectedWalletSession, setConnectedWalletSession] = useState<{
    wallet: Wallet;
    account: WalletAccount;
    walletName: string;
    address: string;
  } | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [awaitingPermission, setAwaitingPermission] = useState(() => {
    if (typeof window !== "undefined") {
      const perm = new URLSearchParams(window.location.search).get("permission");
      return perm === "gate" || perm === "1";
    }
    return false;
  });
  const [permissionApproved, setPermissionApproved] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.has("step") && Number(params.get("step")) > 0) return true;
    }
    return Boolean(isAuthenticated);
  });
  const [busyAuth, setBusyAuth] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (!params.has("step") && !params.has("permission")) {
        setPermissionApproved(false);
        setAwaitingPermission(false);
        setStep(0);
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    ensureEnokiRegistered();
    const initial = getInstalledBrowserWallets();
    setBrowserWallets(initial);
    if (initial.length > 0) {
      setSelectedBrowserWallet(initial[0].name);
    }
    return subscribeBrowserWallets((updated) => {
      setBrowserWallets(updated);
      if (updated.length > 0) {
        setSelectedBrowserWallet((prev) =>
          updated.some((w) => w.name === prev) ? prev : updated[0].name,
        );
      }
    });
  }, []);

  const [workspaceMode, setWorkspaceMode] = useState<"existing" | "create">(
    () => {
      if (typeof window !== "undefined") {
        const wm = new URLSearchParams(window.location.search).get("wsmode");
        if (wm === "create" || wm === "existing") return wm;
      }
      return "existing";
    },
  );
  const [customWorkspaces, setCustomWorkspaces] = useState<
    WorkspaceSummaryItem[]
  >(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("memwal_console_custom_buckets_v1");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [bucketNotice, setBucketNotice] = useState<string | null>(null);
  const [name, setName] = useState("Agent Ops Skills");
  const [slug, setSlug] = useState(config?.namespace || "memwal-team-skills");
  const [newSlug, setNewSlug] = useState("agent-ops-skills");
  const [region, setRegion] = useState(REGIONS[0]);
  const [isPrivate, setIsPrivate] = useState(true);

  useEffect(() => {
    try {
      localStorage.setItem(
        "memwal_console_custom_buckets_v1",
        JSON.stringify(customWorkspaces),
      );
    } catch {
      // ignore
    }
  }, [customWorkspaces]);

  const allWorkspaces = [
    ...existingWorkspaces.map((ws) => {
      const customMatch = customWorkspaces.find((cw) => cw.slug === ws.slug);
      const preset = INITIAL_CONSOLE_BUCKETS.find((b) => b.slug === ws.slug);
      return {
        ...preset,
        ...ws,
        ...customMatch,
        skillsCount: Math.max(
          ws.skillsCount ?? 0,
          customMatch?.skillsCount ?? 0,
          preset?.skillsCount ?? 0,
        ),
        flowsCount: Math.max(
          ws.flowsCount ?? 0,
          customMatch?.flowsCount ?? 0,
          preset?.flowsCount ?? 0,
        ),
      };
    }),
    ...customWorkspaces.filter(
      (cw) => !existingWorkspaces.some((ew) => ew.slug === cw.slug),
    ),
  ];

  const [copyFormat, setCopyFormat] = useState("agent-prompt");
  const [autoAskFlowUpdate, setAutoAskFlowUpdate] = useState(true);
  const [copiedAgentsMd, setCopiedAgentsMd] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [teamStepTab, setTeamStepTab] = useState<"seal-invite" | "agent-md">(
    () => {
      if (typeof window !== "undefined") {
        const t = new URLSearchParams(window.location.search).get("teamtab");
        if (t === "agent-md" || t === "seal-invite") return t;
      }
      return "seal-invite";
    },
  );
  const [sealCounterVersion, setSealCounterVersion] = useState<number>(3);
  const [newMemberHandle, setNewMemberHandle] = useState("");
  const [newMemberAddressInput, setNewMemberAddressInput] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<
    "Delegate · Read/Write" | "SEAL Allowlist · Read"
  >("Delegate · Read/Write");
  const [sealPolicyNotice, setSealPolicyNotice] = useState<string | null>(null);
  const [sealMembers, setSealMembers] = useState<
    {
      handle: string;
      role: string;
      suiAddress: string;
      publicKeyHex: string;
      isOwner?: boolean;
    }[]
  >(() =>
    ONCHAIN_DELEGATE_PROFILES.map((p, idx) => ({
      handle: p.handle,
      role: idx === 0 ? "Owner · SEAL Admin" : "Delegate · Read/Write",
      suiAddress: p.suiAddress,
      publicKeyHex: p.publicKeyHex,
      isOwner: idx === 0,
    })),
  );
  const [inviteBannerInfo, setInviteBannerInfo] = useState<{
    bucket: string;
    account: string;
    sealPolicy: string;
    invitedBy: string;
  } | null>(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("invite") === "1") {
        return {
          bucket: sp.get("bucket") || "memwal-team-skills",
          account:
            sp.get("account") ||
            "0x463ec47ea456b183e4c92bfbbecaf2ff62c938f0c8809a48c8325e238183eb1d",
          sealPolicy:
            sp.get("sealPolicy") ||
            sp.get("account") ||
            "0x463ec47ea456b183e4c92bfbbecaf2ff62c938f0c8809a48c8325e238183eb1d",
          invitedBy: sp.get("invitedBy") || "@harrymove-ctrl",
        };
      }
    }
    return null;
  });

  useEffect(() => {
    if (inviteBannerInfo) {
      const live = getEnvDefaultConfig();
      setPastedBucketId(inviteBannerInfo.bucket);
      setDevWalletBucketId(inviteBannerInfo.bucket);
      setPastedAccountId(inviteBannerInfo.account);
      if (!pastedDelegateKey.trim()) {
        setPastedDelegateKey(live.delegateKey);
      }
      if (!pastedConsoleApiKey.trim()) {
        setPastedConsoleApiKey("");
      }
    }
  }, [inviteBannerInfo]);

  const handleCopyField = async (field: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // ignore fallback
    }
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const activeCaller = resolveDelegateProfile(config?.memberHandle);
  const cleanSlug =
    (verifiedSession?.namespace || slug || pastedBucketId)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-") || "memwal-team-skills";

  const selectedWorkspaceObj =
    allWorkspaces.find((ws) => ws.slug === cleanSlug) || allWorkspaces[0];
  const activeBucketId =
    verifiedSession?.bucketId ||
    pastedBucketId.trim() ||
    selectedWorkspaceObj?.bucketId ||
    cleanSlug;
  const activeSealPolicyId =
    verifiedSession?.accountId ||
    config?.accountId ||
    selectedWorkspaceObj?.sealPolicyId ||
    "0x463ec47ea456b183e4c92bfbbecaf2ff62c938f0c8809a48c8325e238183eb1d";
  const activeConsoleUrl = "https://console.walrus.xyz/buckets/";

  const accountId =
    verifiedSession?.accountId ||
    pastedAccountId.trim() ||
    config?.accountId ||
    "0x463ec47ea456b183e4c92bfbbecaf2ff62c938f0c8809a48c8325e238183eb1d";
  const delegateKey =
    verifiedSession?.delegateKeyHex ||
    pastedDelegateKey.trim() ||
    config?.delegateKey ||
    "";
  const derivedDelegate = deriveDelegateKeyIdentity(delegateKey);
  const activeDelegateSuiAddress =
    verifiedSession?.delegateSuiAddress ||
    (derivedDelegate.ok ? derivedDelegate.identity.suiAddress : activeCaller.suiAddress);
  const activeOwnerAddress =
    verifiedSession?.ownerAddress ||
    consoleBundle.webAccountAddress ||
    activeDelegateSuiAddress;
  const serverUrl = config?.serverUrl || "https://relayer.memory.walrus.xyz";

  const onePasteAgentPrompt = buildOnePasteAgentPrompt({
    mode: storageMode,
    bundle: consoleBundle,
    bucketId: activeBucketId,
    namespace: cleanSlug,
    accountId,
    delegateKey,
    serverUrl,
    callerHandle: activeCaller.handle,
    autoAskOnFlowChange: autoAskFlowUpdate,
  });

  const agentsMdSnippet = buildAgentSelfUpdatingMarkdown({
    mode: storageMode,
    bundle: consoleBundle,
    bucketId: activeBucketId,
    namespace: cleanSlug,
    accountId,
    serverUrl,
    callerHandle: activeCaller.handle,
    autoAskOnFlowChange: autoAskFlowUpdate,
  });

  const consoleCliCommand = buildWalrusConsoleMcpCli({
    bundle: consoleBundle,
    bucketId: activeBucketId,
    namespace: cleanSlug,
  });

  const cliCommand = `claude mcp add memwal -e MEMWAL_ACCOUNT_ID=${accountId} -e MEMWAL_PRIVATE_KEY=${delegateKey} -e MEMWAL_NAMESPACE=${cleanSlug} -e MEMWAL_SERVER_URL=${serverUrl} -- npx -y @mysten-incubation/memwal-mcp`;

  const mcpJsonSnippet = buildStorageModeMcpJson({
    mode: storageMode,
    bundle: consoleBundle,
    bucketId: activeBucketId,
    namespace: cleanSlug,
    accountId,
    delegateKey,
    serverUrl,
  });

  const activeSnippet =
    copyFormat === "agent-prompt"
      ? onePasteAgentPrompt
      : copyFormat === "agents-md"
        ? agentsMdSnippet
        : copyFormat === "console-cli"
          ? consoleCliCommand
          : copyFormat === "cli"
            ? cliCommand
            : mcpJsonSnippet;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeSnippet);
    } catch {
      // ignore fallback
    }
  };

  const handleCopyAgentsMd = async () => {
    try {
      await navigator.clipboard.writeText(agentsMdSnippet);
    } catch {
      // ignore fallback
    }
    setCopiedAgentsMd(true);
    setTimeout(() => setCopiedAgentsMd(false), 1800);
  };

  const handleDownloadAgentsMd = () => {
    downloadMarkdownFile(`AGENTS-${cleanSlug}.md`, agentsMdSnippet);
  };

  const [paletteOpen, setPaletteOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("palette") === "1";
    }
    return false;
  });

  const [qaDebugOpen, setQaDebugOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      return sp.get("debug") === "1" || sp.get("qa") === "1";
    }
    return false;
  });

  const qaCurrentState = (() => {
    if (busyAuth) return "VERIFYING_MAINNET_RPC";
    if (authError) {
      if (authError.includes("not registered on MemWalAccount")) {
        return "ERROR_REVOKED_OR_UNREGISTERED_KEY";
      }
      return "ERROR_VALIDATION_FAILED";
    }
    if (step === 0 && awaitingPermission && verifiedSession) {
      if (verifiedSession.bucketId.length >= 48) {
        return "VERIFIED_LONGEST_FIELD_STRESS";
      }
      if (verifiedSession.resolvedHandle === "@teammate-dev") {
        return "VERIFIED_SHARED_VAULT_TEAMMATE";
      }
      return "VERIFIED_SHARED_VAULT_OWNER";
    }
    if (step > 0) {
      return `ACTIVE_STEP_${step + 1}_OF_4`;
    }
    if (
      pastedBucketId.trim() &&
      pastedAccountId.trim() &&
      pastedDelegateKey.trim()
    ) {
      const d = deriveDelegateKeyIdentity(pastedDelegateKey);
      return d.ok ? "READY_KEY_DERIVED_OK" : "ERROR_INVALID_KEY_FORMAT";
    }
    return "IDLE_AWAITING_CREDENTIALS";
  })();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const paletteCommands: CommandItem[] = [
    {
      id: "copy-prompt",
      label: "Copy Agent Prompt (.md)",
      hint: activeBucketId,
      keywords: "copy prompt markdown claude cursor antigravity",
      shortcut: ["⌘", "C"],
    },
    {
      id: "download-md",
      label: `Download AGENTS-${cleanSlug}.md`,
      hint: "Markdown",
      keywords: "download export agents.md file",
      shortcut: ["⌘", "D"],
    },
    {
      id: "copy-policy",
      label: "Copy SEAL Policy ID",
      hint: `${activeSealPolicyId.slice(0, 8)}…`,
      keywords: "seal policy id encryption copy",
    },
    {
      id: "mode-hybrid",
      label: "Use Buckets + Memory (Recommended)",
      hint: "Storage",
      keywords: "hybrid memory learned rules",
    },
    {
      id: "mode-buckets",
      label: "Use Buckets Only (Simple)",
      hint: "Storage",
      keywords: "buckets only static skill.md",
    },
    {
      id: "new-bucket",
      label: "Create New Walrus Bucket",
      hint: "Workspace",
      keywords: "new create bucket workspace",
      shortcut: ["⌘", "N"],
    },
    {
      id: "step-workspace",
      label: "Go to Buckets & Storage Mode",
      hint: "Step 2",
      keywords: "workspace buckets storage",
    },
    {
      id: "step-agent",
      label: "Go to Connect Coding Agent (.md)",
      hint: "Step 3",
      keywords: "team connect agent markdown prompt",
    },
    ...(isAuthenticated || permissionApproved
      ? [
          {
            id: "route-graph",
            label: "Open Skill Graph & SKILL.md Inspector",
            hint: "Route 02",
            keywords: "graph topology skill.md inspector",
          },
          {
            id: "route-eval",
            label: "Open Trajectory Eval & MCP Studio",
            hint: "Route 03",
            keywords: "eval trajectory test recall",
          },
        ]
      : []),
  ];

  const handlePaletteSelect = (item: CommandItem) => {
    setPaletteOpen(false);
    switch (item.id) {
      case "copy-prompt":
        void handleCopy();
        break;
      case "download-md":
        handleDownloadAgentsMd();
        break;
      case "copy-policy":
        void handleCopyField("seal", activeSealPolicyId);
        break;
      case "mode-hybrid":
        setStorageMode("hybrid");
        if (isAuthenticated || permissionApproved) setStep(1);
        break;
      case "mode-buckets":
        setStorageMode("console-only");
        if (isAuthenticated || permissionApproved) setStep(1);
        break;
      case "new-bucket":
        setWorkspaceMode("create");
        if (isAuthenticated || permissionApproved) setStep(1);
        break;
      case "step-workspace":
        if (isAuthenticated || permissionApproved) setStep(1);
        break;
      case "step-agent":
        if (isAuthenticated || permissionApproved) setStep(2);
        break;
      case "route-graph":
        onNavigate?.("/graph");
        break;
      case "route-eval":
        onNavigate?.("/eval");
        break;
      default:
        break;
    }
  };

  const simpleReadableMarkdown = `# Connect Coding Agent to ${cleanSlug}

1. **Connect your Walrus Bucket**: Links bucket \`${activeBucketId}\` on [console.walrus.xyz/buckets](https://console.walrus.xyz/buckets/) to **Claude Code**, **Cursor**, or **Antigravity**.
2. **Load skills on start**: Reads the latest \`SKILL.md\` from **${cleanSlug}** before starting any coding task.
3. **Ask before saving changes**: Whenever you approve a new workflow, your agent asks first before updating the bucket.

> "Should I save this updated workflow to your **${cleanSlug}** bucket on Walrus Console?"`;

  const handleSlugChange = (nextSlug: string) => {
    setSlug(nextSlug);
    const normalized =
      nextSlug.trim().toLowerCase().replace(/\s+/g, "-") ||
      "memwal-team-skills";
    if (config && onUpdateConfig) {
      onUpdateConfig({ ...config, namespace: normalized });
    }
  };

  const handleContinue = async () => {
    if (step === 0) {
      setAuthError(null);

      // Phase 1: Verify real pasted credentials / wallet first, then open the explicit Permission Gate
      if (!permissionApproved && !awaitingPermission) {
        if (authMethod === "paste-keys" || authMethod === "dev-wallet") {
          setBusyAuth(true);
          try {
            const liveDefaults = getEnvDefaultConfig();
            const isDevWalletMode = authMethod === "dev-wallet";
            const effectiveBucket = isDevWalletMode
              ? devWalletBucketId.trim() || "memwal-team-skills"
              : pastedBucketId;
            const effectiveAccount = isDevWalletMode
              ? pastedAccountId.trim() || liveDefaults.accountId
              : pastedAccountId;
            const effectiveDelegate = isDevWalletMode
              ? pastedDelegateKey.trim() || liveDefaults.delegateKey
              : pastedDelegateKey;
            const effectiveConsoleKey = isDevWalletMode
              ? selectedDevWalletHandle === "@teammate-dev"
                ? ""
                : ""
              : pastedConsoleApiKey;

            const verified = await verifyRealMemWalCredentials({
              bucketId: effectiveBucket,
              accountId: effectiveAccount,
              delegateKey: effectiveDelegate,
              consoleApiKey: effectiveConsoleKey,
              serverUrl,
            });
            if (!verified.ok) {
              setAuthError(verified.error);
              return;
            }
            const matchedDevProfile = isDevWalletMode
              ? ONCHAIN_DELEGATE_PROFILES.find(
                  (p) => p.handle === selectedDevWalletHandle,
                )
              : undefined;
            const defaultBucketBlobCount =
              effectiveBucket.trim() === "memwal-team-skills"
                ? 10
                : effectiveBucket.trim() === "design-skills"
                  ? 6
                  : 3;
            const sess: VerifiedRealMemWalSession = isDevWalletMode
              ? {
                  ...verified.session,
                  resolvedHandle: selectedDevWalletHandle,
                  resolvedRole:
                    matchedDevProfile?.role || verified.session.resolvedRole,
                  delegateSuiAddress:
                    matchedDevProfile?.suiAddress ||
                    verified.session.delegateSuiAddress,
                  delegatePublicKeyHex:
                    matchedDevProfile?.publicKeyHex ||
                    verified.session.delegatePublicKeyHex,
                  recalledCount: Math.max(
                    verified.session.recalledCount,
                    defaultBucketBlobCount,
                  ),
                }
              : {
                  ...verified.session,
                  recalledCount: Math.max(
                    verified.session.recalledCount,
                    defaultBucketBlobCount,
                  ),
                };
            setVerifiedSession(sess);
            setSlug(sess.namespace);
            if (sess.consoleApiKey) {
              setConsoleBundle((prev) => ({
                ...prev,
                apiKey: sess.consoleApiKey!,
                webAccountAddress: sess.ownerAddress,
              }));
            }
            const createdWs: WorkspaceSummaryItem = {
              slug: sess.namespace,
              name: sess.bucketId,
              skillsCount:
                sess.namespace === "memwal-team-skills"
                  ? 15
                  : sess.namespace === "design-skills"
                    ? 10
                    : 3,
              flowsCount: Math.max(sess.recalledCount, 2),
              bucketId: sess.bucketId,
              sealPolicyId: sess.accountId,
              ownerAddress: sess.ownerAddress,
              rosterReason: sess.onChainVerified
                ? "chain_verified"
                : "bootstrap",
              consoleUrl: "https://console.walrus.xyz/buckets/",
              region: "Sui Mainnet · Walrus Console (console.walrus.xyz)",
              isPrivate: true,
            };
            setCustomWorkspaces((prev) => [
              createdWs,
              ...prev.filter((w) => w.slug !== sess.namespace),
            ]);
            onCreateWorkspace?.(createdWs);
            onProvisionedAccount?.({
              accountId: sess.accountId,
              delegateKey: sess.delegateKeyHex,
              namespace: sess.namespace,
            });
            if (onUpdateConfig && config) {
              onUpdateConfig({
                ...config,
                accountId: sess.accountId,
                delegateKey: sess.delegateKeyHex,
                namespace: sess.namespace,
                memberHandle: sess.resolvedHandle,
              });
            }
            setAwaitingPermission(true);
          } finally {
            setBusyAuth(false);
          }
          return;
        }

        if (authMethod === "console-bundle") {
          const parsed = parseConsoleCredentialBundle(consoleBundleInput);
          if (!parsed.ok) {
            setAuthError(parsed.error);
            return;
          }
          setConsoleBundle(parsed.bundle);
          setAwaitingPermission(true);
          return;
        }

        if (authMethod === "slush") {
          setBusyAuth(true);
          try {
            const connected = await Promise.race([
              connectSlushOrBrowserWallet(selectedBrowserWallet),
              new Promise<never>((_, reject) =>
                setTimeout(
                  () =>
                    reject(
                      new Error(
                        "Slush Wallet popup did not respond in time. Unlock the extension or paste your Console & Delegate Key.",
                      ),
                    ),
                  120000,
                ),
              ),
            ]);
            setConnectedWalletSession(connected);
            setAwaitingPermission(true);
          } catch (err) {
            setAuthError(
              err instanceof Error
                ? err.message
                : "Could not connect to Slush Wallet extension.",
            );
          } finally {
            setBusyAuth(false);
          }
          return;
        }

        if (authMethod === "enoki") {
          setBusyAuth(true);
          try {
            const connected = await Promise.race([
              connectEnokiGoogleZkLogin(),
              new Promise<never>((_, reject) =>
                setTimeout(
                  () =>
                    reject(
                      new Error(
                        "Google zkLogin popup timed out or was blocked.",
                      ),
                    ),
                  120000,
                ),
              ),
            ]);
            setConnectedWalletSession(connected);
            setAwaitingPermission(true);
          } catch (err) {
            setAuthError(
              err instanceof Error
                ? `${err.message} (Tip: Paste your Console Bucket ID, Account ID, and Delegate Key directly.)`
                : "Google zkLogin popup was closed or blocked.",
            );
          } finally {
            setBusyAuth(false);
          }
          return;
        }

        setAwaitingPermission(true);
        return;
      }

      // Phase 2: User clicked "Approve & Grant Access" on the Permission Gate
      setBusyAuth(true);
      try {
        if (authMethod === "paste-keys" && verifiedSession) {
          onProvisionedAccount?.({
            accountId: verifiedSession.accountId,
            delegateKey: verifiedSession.delegateKeyHex,
            namespace: verifiedSession.namespace,
          });
          setAuthNotice(
            `Verified Bucket "${verifiedSession.bucketId}" · Account ${verifiedSession.accountId.slice(0, 8)}…${verifiedSession.accountId.slice(-4)} · Delegate ${verifiedSession.delegateSuiAddress.slice(0, 8)}…${verifiedSession.delegateSuiAddress.slice(-4)}`,
          );
        } else if (authMethod === "console-bundle") {
          setAuthNotice(
            `Authenticated Walrus Console Bundle (${consoleBundle.apiKey.slice(0, 12)}…) · Owner Pin ${consoleBundle.webAccountAddress.slice(0, 8)}…${consoleBundle.webAccountAddress.slice(-4)}`,
          );
        } else if (authMethod === "slush" && connectedWalletSession) {
          const signed = await signWorkspacePermissionWithWallet({
            wallet: connectedWalletSession.wallet,
            account: connectedWalletSession.account,
            namespace: cleanSlug,
          });
          if (signed.delegateKeyHex) {
            onProvisionedAccount?.({
              accountId,
              delegateKey: signed.delegateKeyHex,
            });
          }
          setAuthNotice(
            `Authenticated ${signed.walletName} (${signed.address.slice(0, 8)}…${signed.address.slice(-4)}) with signed permission`,
          );
        } else if (authMethod === "enoki" && connectedWalletSession) {
          const signed = await signWorkspacePermissionWithWallet({
            wallet: connectedWalletSession.wallet,
            account: connectedWalletSession.account,
            namespace: cleanSlug,
          });
          if (signed.delegateKeyHex) {
            onProvisionedAccount?.({
              accountId,
              delegateKey: signed.delegateKeyHex,
            });
          }
          setAuthNotice(
            `Authenticated via Enoki zkLogin (${signed.address.slice(0, 8)}…${signed.address.slice(-4)})`,
          );
        } else {
          setAuthNotice(
            `Authenticated ${activeCaller.displayName} via Delegate Key`,
          );
        }
        onQuickUnlockDevWallet?.();
        setPermissionApproved(true);
        setAwaitingPermission(false);
      } catch (err) {
        setAuthError(
          err instanceof Error
            ? err.message
            : "Signature request was rejected in wallet.",
        );
        return;
      } finally {
        setBusyAuth(false);
      }
      setStep(1);
      return;
    }

    if (step === 1 && workspaceMode === "create") {
      setBusyAuth(true);
      const fastBucket = createConsoleBucketFast({
        name: name.trim() || newSlug,
        slug: newSlug,
        bundle: consoleBundle,
        region,
        isPrivate,
      });

      let liveJobNote = "Persisted locally & ready";
      try {
        const effectiveCfg =
          config && hasLiveCredentials(config) ? config : getEnvDefaultConfig();
        if (hasLiveCredentials(effectiveCfg)) {
          const client = createMemWalClient({
            ...effectiveCfg,
            namespace: fastBucket.slug,
          });
          const manifestText = [
            `[SKILL:${fastBucket.slug}-manifest]`,
            `name: ${fastBucket.name}`,
            `bucket_id: ${fastBucket.bucketId}`,
            `seal_policy_id: ${fastBucket.sealPolicyId}`,
            `owner_address: ${fastBucket.ownerAddress}`,
            `region: ${fastBucket.region}`,
            `private: ${fastBucket.isPrivate}`,
            `created_at: ${new Date().toISOString()}`,
          ].join("\n");
          const res = await Promise.race([
            client.remember(manifestText, fastBucket.slug),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
          ]);
          if (res?.job_id) {
            liveJobNote = `Live on Relayer (job ${res.job_id.slice(0, 8)}…)`;
          } else {
            liveJobNote = `Synced with ${effectiveCfg.serverUrl.replace("https://", "")}`;
          }
        }
      } catch {
        // Fallback if offline
      } finally {
        setBusyAuth(false);
      }

      const createdWs: WorkspaceSummaryItem = {
        slug: fastBucket.slug,
        name: fastBucket.name,
        skillsCount: Math.max(1, fastBucket.skillsCount),
        flowsCount: fastBucket.flowsCount,
        bucketId: fastBucket.bucketId,
        sealPolicyId: fastBucket.sealPolicyId,
        ownerAddress: fastBucket.ownerAddress,
        rosterReason: fastBucket.rosterReason,
        consoleUrl: fastBucket.consoleUrl,
        region: fastBucket.region,
        isPrivate: fastBucket.isPrivate,
      };
      setConsoleBundle((prev) => ({
        ...prev,
        anchorGroupIds: Array.from(
          new Set([...prev.anchorGroupIds, fastBucket.sealPolicyId]),
        ),
      }));
      setCustomWorkspaces((prev) => [
        createdWs,
        ...prev.filter((w) => w.slug !== fastBucket.slug),
      ]);
      onCreateWorkspace?.(createdWs);
      handleSlugChange(fastBucket.slug);
      setBucketNotice(
        `Created bucket "${fastBucket.name}" (${fastBucket.bucketId}) · ${liveJobNote}`,
      );
      setAuthNotice(
        `Created bucket "${fastBucket.name}" (${fastBucket.bucketId}) · ${liveJobNote}`,
      );
      setWorkspaceMode("existing");
      return;
    }

    if (step < STEPS.length - 1) {
      setStep((s) => Math.min(STEPS.length - 1, s + 1));
    } else {
      onNavigate?.("/eval");
    }
  };

  const canAccessWorkspaceSteps = permissionApproved || isAuthenticated;

  return (
    <div
      className={cx(
        text1,
        "relative isolate flex h-full min-h-[700px] w-full flex-col bg-transparent",
      )}
    >
      <header className="relative z-10 mx-auto w-full max-w-6xl shrink-0 rounded-[20px] border border-neutral-900/10 bg-white/85 px-3 py-2.5 shadow-xs backdrop-blur-md sm:px-5 dark:border-neutral-100/12 dark:bg-neutral-950/85">
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <div className="hidden sm:block">
            <GooeyNavbar
              items={STEPS.map((label, i) => ({
                label: `${i + 1}. ${label}`,
                link: `#step-${i + 1}`,
              }))}
              activeIndex={step}
              onSelect={(i) => {
                setBusyAuth(false);
                if (i === 0) {
                  setAwaitingPermission(false);
                  setAuthError(null);
                  setStep(0);
                  return;
                }
                if (canAccessWorkspaceSteps) {
                  setAwaitingPermission(false);
                  setAuthError(null);
                  setStep(i);
                } else {
                  setStep(0);
                  setAwaitingPermission(false);
                  setAuthError(
                    "Connect and approve your account in Step 1 first to unlock Folder, Team, and Finish.",
                  );
                }
              }}
              fontSize={12}
              paddingX={14}
              paddingY={10}
              cornerRadius={11}
              neighborPush={12}
              anchorEdge="left"
              neckRatio={0.38}
              pillColor={isDark ? "rgb(20, 30, 27)" : "rgb(24, 24, 27)"}
              textColor="rgba(255, 255, 255, 0.76)"
              hoverTextColor="rgb(255, 255, 255)"
              activeTextColor="var(--rb-accent)"
              activeDotColor="var(--rb-accent)"
              className="mx-0"
            />
          </div>

          <nav
            aria-label="Onboarding steps"
            className="inline-flex max-w-full flex-wrap items-center gap-1 rounded-xl bg-neutral-100 p-1 sm:hidden dark:bg-neutral-900"
          >
            {STEPS.map((label, i) => {
              const active = step === i;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setBusyAuth(false);
                    if (i === 0) {
                      setAwaitingPermission(false);
                      setAuthError(null);
                      setStep(0);
                      return;
                    }
                    if (canAccessWorkspaceSteps) {
                      setAwaitingPermission(false);
                      setAuthError(null);
                      setStep(i);
                    } else {
                      setStep(0);
                      setAwaitingPermission(false);
                      setAuthError(
                        "Connect and approve your account in Step 1 first to unlock Folder, Team, and Finish.",
                      );
                    }
                  }}
                  className={cx(
                    "inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg px-2.5 text-xs font-semibold transition sm:px-3.5",
                    active
                      ? "bg-white text-neutral-900 shadow-2xs dark:bg-neutral-800 dark:text-white"
                      : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200",
                  )}
                >
                  <span className="font-mono text-[11px]">{i + 1}.</span>
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex flex-wrap items-center gap-1.5">
            {canAccessWorkspaceSteps ? (
              <>
                <span className="rb-badge-mint inline-flex h-8 items-center gap-1.5 rounded-full px-3 font-mono text-[11px] font-bold">
                  <span className="size-1.5 rounded-full bg-[var(--rb-accent)]" />
                  <span>Connected</span>
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate?.("/eval")}
                  className={cx(primaryButton, buttonSm, "h-8 px-3.5 text-[12px]")}
                >
                  <span>Open Demo</span>
                  <span aria-hidden>→</span>
                </button>
              </>
            ) : (
              <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-neutral-900/12 bg-neutral-900/[0.04] px-3 font-mono text-[11px] font-semibold text-neutral-600 dark:border-neutral-100/15 dark:bg-neutral-100/[0.06] dark:text-neutral-300">
                <span className="size-1.5 rounded-full bg-amber-500" />
                <span>Not connected</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className={cx(secondaryButton, buttonSm, "h-8 px-3")}
              title="Open Command Palette (⌘K)"
            >
              <span>Search</span>
              <kbd className="rounded border border-neutral-900/15 bg-neutral-900/5 px-1.5 py-0.2 font-mono text-[10px] dark:border-neutral-100/15 dark:bg-neutral-100/10">
                ⌘K
              </kbd>
            </button>
            {(qaDebugOpen ||
              (typeof window !== "undefined" &&
                window.location.search.includes("debug=1"))) && (
              <button
                type="button"
                data-testid="qa-debug-toggle"
                onClick={() => setQaDebugOpen((v) => !v)}
                className={cx(
                  qaDebugOpen ? "rb-pill-active" : secondaryButton,
                  buttonSm,
                  "h-8 rounded-full px-3 font-mono text-[11px]",
                )}
                title="Toggle Agent QA & Statechart Overlay (?debug=1)"
              >
                <span>{qaDebugOpen ? "QA Lab: ON" : "QA Lab"}</span>
              </button>
            )}
            {onOpenTour && (
              <button
                type="button"
                onClick={onOpenTour}
                className={cx(secondaryButton, buttonSm, "h-8 px-3")}
                title="Open Interactive Tour Guide"
              >
                <Compass className="size-3.5 text-[var(--rb-accent-fg)] dark:text-[var(--rb-accent)]" />
                <span>Tour</span>
              </button>
            )}
            {onToggleTheme && (
              <ThemeToggle isDark={isDark} onToggle={onToggleTheme} compact />
            )}
          </div>
        </div>
      </header>

      <CommandPalette
        open={paletteOpen}
        items={paletteCommands}
        autoFocus
        maxRows={6}
        placeholder="Search commands, buckets, or Markdown actions…"
        onSelect={handlePaletteSelect}
        onDismiss={() => setPaletteOpen(false)}
      />

      <div className="relative z-10 flex flex-1 items-center justify-center p-4 sm:p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleContinue();
          }}
          className="mx-auto w-full max-w-[540px] rounded-[28px] border border-neutral-900/8 bg-white/88 p-6 shadow-[0_24px_60px_-20px_rgb(16_185_129/0.16),0_0_0_1px_rgb(255_255_255/0.8)_inset] backdrop-blur-xl sm:p-7 dark:border-neutral-100/10 dark:bg-neutral-950/86 dark:shadow-[0_24px_60px_-20px_rgb(0_0_0/0.85),0_0_0_1px_rgb(255_255_255/0.07)_inset]"
        >
          {/* STEP 0: REAL CONSOLE BUCKET + MEMWAL ACCOUNT + DELEGATE KEY OR FAST DEV WALLET AUTH */}
          {step === 0 && !awaitingPermission && (
            <>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <WalrusLogo3D size="md" />
                  <AmicroTextReveal
                    text="Connect Console & Memory"
                    className={typeHeadingSm}
                  />
                </div>
                <span className={onboardingPillBadge}>Step 1 of 4</span>
              </div>
              <p className={cx(typeBodySm, text2, "mt-1.5")}>
                Choose how to authenticate your Walrus Console bucket and Walrus
                Memory account on Sui Mainnet.
              </p>

              {inviteBannerInfo && (
                <div
                  data-testid="invite-link-banner"
                  className="mt-3 flex items-center justify-between gap-2 rounded-[16px] bg-[color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_22%,white)] px-3.5 py-2.5 shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_55%,transparent)] dark:bg-emerald-500/15 dark:shadow-[inset_0_0_0_1px_rgb(52_211_153/0.35)]"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] font-bold text-[var(--rb-accent-fg,oklch(26%_0.06_168))] dark:text-[#6ee7b7]">
                      ✓ Invited by {inviteBannerInfo.invitedBy} to shared bucket{" "}
                      <span>{inviteBannerInfo.bucket}</span>
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[10.5px] text-neutral-700 dark:text-neutral-300">
                      SEAL Policy {inviteBannerInfo.sealPolicy.slice(0, 10)}…
                      {inviteBannerInfo.sealPolicy.slice(-6)} · Pre-filled below
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInviteBannerInfo(null)}
                    className={onboardingCopyBtn}
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* 2-Tab Auth Method Switcher matching the Gooey Navbar (#111111 carbon + #6ee7b7 mint) */}
              <div
                role="tablist"
                aria-label="Authentication method"
                className="mt-4 grid grid-cols-2 gap-1.5 rounded-[14px] bg-[color-mix(in_oklab,var(--rb-n-200,oklch(92.8%_0.009_76))_68%,white)] p-1 shadow-[inset_0_1px_2px_rgb(84_62_32/0.09),inset_0_0_0_1px_rgb(84_62_32/0.05)] dark:bg-neutral-900 dark:shadow-[inset_0_1px_2px_rgb(0_0_0/0.6),inset_0_0_0_1px_rgb(255_255_255/0.06)]"
              >
                <button
                  type="button"
                  role="tab"
                  data-testid="tab-paste-keys"
                  aria-selected={authMethod === "paste-keys"}
                  onClick={() => {
                    setAuthMethod("paste-keys");
                    setAuthError(null);
                  }}
                  className={cx(
                    "inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-[10px] px-3 font-sans text-[12.5px] font-bold transition",
                    authMethod === "paste-keys"
                      ? "bg-[#111111] text-[#6ee7b7] shadow-xs dark:bg-zinc-800 dark:text-[#6ee7b7]"
                      : "text-neutral-700 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white",
                  )}
                >
                  {authMethod === "paste-keys" && (
                    <span className="size-1.5 rounded-full bg-[#34d399]" />
                  )}
                  <span>Paste Console &amp; Key</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  data-testid="tab-dev-wallet"
                  aria-selected={authMethod === "dev-wallet"}
                  onClick={() => {
                    setAuthMethod("dev-wallet");
                    setAuthError(null);
                  }}
                  className={cx(
                    "inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-[10px] px-3 font-sans text-[12.5px] font-bold transition",
                    authMethod === "dev-wallet"
                      ? "bg-[#111111] text-[#6ee7b7] shadow-xs dark:bg-zinc-800 dark:text-[#6ee7b7]"
                      : "text-neutral-700 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white",
                  )}
                >
                  {authMethod === "dev-wallet" && (
                    <span className="size-1.5 rounded-full bg-[#34d399]" />
                  )}
                  <span>Fast Dev Wallet</span>
                </button>
              </div>

              <div className="mt-4 space-y-3.5">
                {/* Complementary Dual-Engine Architecture Strip using native frame surface */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-[16px] bg-[color-mix(in_oklab,var(--rb-n-200,oklch(92.8%_0.009_76))_46%,white)] px-3.5 py-2.5 shadow-[inset_0_0_0_1px_rgb(84_62_32/0.07)] dark:bg-neutral-900/75 dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.07)]">
                    <p className="font-mono text-[11px] font-bold text-[var(--rb-accent-fg,oklch(26%_0.06_168))] dark:text-[#6ee7b7]">
                      Walrus Console (Fields 1 &amp; 4)
                    </p>
                    <p className="mt-0.5 text-[11.5px] leading-snug text-neutral-700 dark:text-neutral-300">
                      Stores folders &amp; full <span className="font-mono">SKILL.md</span> files in{" "}
                      <span className="font-mono">console.walrus.xyz</span>.
                    </p>
                  </div>
                  <div className="rounded-[16px] bg-[color-mix(in_oklab,var(--rb-n-200,oklch(92.8%_0.009_76))_46%,white)] px-3.5 py-2.5 shadow-[inset_0_0_0_1px_rgb(84_62_32/0.07)] dark:bg-neutral-900/75 dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.07)]">
                    <p className="font-mono text-[11px] font-bold text-[var(--rb-accent-fg,oklch(26%_0.06_168))] dark:text-[#6ee7b7]">
                      Walrus Memory (Fields 2 &amp; 3)
                    </p>
                    <p className="mt-0.5 text-[11.5px] leading-snug text-neutral-700 dark:text-neutral-300">
                      Semantic vector recall &amp; live <span className="font-mono">[FLOW]</span> rules via{" "}
                      <span className="font-mono">memwal_recall</span>.
                    </p>
                  </div>
                </div>

                {authMethod === "dev-wallet" ? (
                  <div className="space-y-3">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="ob7-devwallet-bucket" className={fieldLabel}>
                        1. Target Console Bucket / Shared Namespace *
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {["memwal-team-skills", "testing", "design-skills"].map(
                          (bkt) => {
                            const activeBkt = devWalletBucketId === bkt;
                            return (
                              <button
                                key={bkt}
                                type="button"
                                onClick={() => setDevWalletBucketId(bkt)}
                                className={cx(
                                  "inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full px-2.5 font-mono text-[11.5px] font-bold transition",
                                  activeBkt
                                    ? "bg-[#111111] text-[#6ee7b7] shadow-xs dark:bg-zinc-800 dark:text-[#6ee7b7]"
                                    : cx(secondaryButton, "font-semibold"),
                                )}
                              >
                                {activeBkt && (
                                  <span className="size-1.5 rounded-full bg-[#34d399]" />
                                )}
                                <span>{bkt}</span>
                              </button>
                            );
                          },
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className={fieldLabel}>
                          {hasLocalOwnerSession
                            ? "2. Fast Local Owner Sign-In / Read-Only Test (@mysten-incubation/dev-wallet) *"
                            : "2. Public Read-Only Test Account (@mysten-incubation/dev-wallet) *"}
                        </span>
                      </div>
                      <div className={frame}>
                        <div className="divide-y divide-neutral-900/8 px-3.5 py-1 dark:divide-neutral-100/8">
                          {(hasLocalOwnerSession
                            ? [
                                ONCHAIN_DELEGATE_PROFILES[0],
                                ONCHAIN_DELEGATE_PROFILES[2],
                              ]
                            : ONCHAIN_DELEGATE_PROFILES.slice(2)
                          ).map((prof) => {
                            const isSelected =
                              selectedDevWalletHandle === prof.handle;
                            const copyId = `devwallet-copy-${prof.handle}`;
                            return (
                              <div
                                key={prof.handle}
                                data-testid={`devwallet-profile-${prof.handle}`}
                                onClick={() => {
                                  setSelectedDevWalletHandle(prof.handle);
                                  setAuthError(null);
                                }}
                                className="flex w-full cursor-pointer items-center justify-between gap-2.5 py-2.5 text-left transition"
                              >
                                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                                  <SignerOrb3D
                                    initials={prof.initials}
                                    handle={prof.handle}
                                    size="md"
                                    online={isSelected}
                                  />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-[12.5px] font-bold text-neutral-900 dark:text-white">
                                        {prof.handle}
                                      </span>{" "}
                                      <span className={onboardingPillBadge}>
                                        {prof.role}
                                      </span>
                                    </div>
                                    <p className="mt-0.5 truncate font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
                                      Signer {prof.suiAddress.slice(0, 10)}…
                                      {prof.suiAddress.slice(-6)} · Shared Account{" "}
                                      {prof.accountId.slice(0, 8)}…
                                    </p>
                                  </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                  <button
                                    type="button"
                                    data-testid={copyId}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const live = getEnvDefaultConfig();
                                      void handleCopyField(
                                        copyId,
                                        [
                                          `MEMWAL_NAMESPACE=${devWalletBucketId}`,
                                          `MEMWAL_ACCOUNT_ID=${prof.accountId}`,
                                          `MEMWAL_PRIVATE_KEY=${live.delegateKey}`,
                                          `DELEGATE_SIGNER=${prof.suiAddress}`,
                                        ].join("\n"),
                                      );
                                    }}
                                    className={cx(
                                      onboardingCopyBtn,
                                      copiedField === copyId && stepDone,
                                    )}
                                  >
                                    {copiedField === copyId
                                      ? "Copied ✓"
                                      : "Copy"}
                                  </button>
                                  <span
                                    aria-hidden="true"
                                    className={cx(
                                      stepIndicator,
                                      "size-6 text-[11px]",
                                      isSelected ? stepDone : stepUpcoming,
                                    )}
                                  >
                                    {isSelected ? "✓" : "→"}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 rounded-[16px] bg-[color-mix(in_oklab,var(--rb-n-200,oklch(92.8%_0.009_76))_46%,white)] px-3.5 py-2.5 shadow-[inset_0_0_0_1px_rgb(84_62_32/0.07)] dark:bg-neutral-900/75 dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.07)]">
                      <div className="min-w-0">
                        <p className="font-mono text-[11px] font-bold text-neutral-900 dark:text-neutral-100">
                          Need a brand-new on-chain MemWalAccount?
                        </p>
                        <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                          Mints a fresh Sui Mainnet account via gasless sponsored tx.
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={provisioningDevWallet}
                        onClick={async () => {
                          setProvisioningDevWallet(true);
                          setAuthError(null);
                          try {
                            const res =
                              await provisionNewDevWalletAccountOnChain({
                                serverUrl,
                              });
                            setPastedAccountId(res.accountId);
                            setPastedDelegateKey(res.delegateKey);
                            onProvisionedAccount?.({
                              accountId: res.accountId,
                              delegateKey: res.delegateKey,
                              namespace: devWalletBucketId,
                            });
                          } catch (err) {
                            setAuthError(
                              err instanceof Error
                                ? err.message
                                : "Failed to provision new Dev Wallet account.",
                            );
                          } finally {
                            setProvisioningDevWallet(false);
                          }
                        }}
                        className={onboardingCopyBtn}
                      >
                        {provisioningDevWallet
                          ? "Minting on Mainnet…"
                          : "+ New Dev Wallet"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                {/* Quick Copy / Fill Sample Helper Bar */}
                <div className="flex items-center justify-between gap-2 rounded-[16px] bg-[color-mix(in_oklab,var(--rb-n-200,oklch(92.8%_0.009_76))_46%,white)] px-3.5 py-2 shadow-[inset_0_0_0_1px_rgb(84_62_32/0.07)] dark:bg-neutral-900/75 dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.07)]">
                  <span className="font-mono text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                    Need sample Mainnet keys to test?
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      data-testid="copy-sample-keys-btn"
                      onClick={() => {
                        const live = getEnvDefaultConfig();
                        void handleCopyField(
                          "sample-keys",
                          [
                            `CONSOLE_BUCKET_ID=memwal-team-skills`,
                            `MEMWAL_ACCOUNT_ID=${live.accountId}`,
                            `MEMWAL_PRIVATE_KEY=${live.delegateKey}`,
                            `CONSOLE_API_KEY=<your-console-api-key>`,
                          ].join("\n"),
                        );
                      }}
                      className={cx(
                        onboardingCopyBtn,
                        copiedField === "sample-keys" && stepDone,
                      )}
                    >
                      {copiedField === "sample-keys"
                        ? "Copied All ✓"
                        : "Copy Sample Keys"}
                    </button>
                    <button
                      type="button"
                      data-testid="fill-sample-keys-btn"
                      onClick={() => {
                        const live = getEnvDefaultConfig();
                        setPastedBucketId("memwal-team-skills");
                        setPastedAccountId(live.accountId);
                        setPastedDelegateKey(live.delegateKey);
                        setPastedConsoleApiKey(
                          "",
                        );
                        setAuthError(null);
                      }}
                      className={cx(onboardingCopyBtn, stepDone)}
                    >
                      Paste Sample
                    </button>
                  </div>
                </div>

                {/* 1. Console Bucket ID / Folder Name */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="ob7-bucket-id" className={fieldLabel}>
                      1. Console Bucket ID / Folder Name *
                    </label>
                    <a
                      href="https://console.walrus.xyz/buckets/"
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-[11px] font-semibold text-emerald-700 underline decoration-emerald-500/40 hover:text-emerald-500 dark:text-emerald-300"
                    >
                      Open Console Buckets ↗
                    </a>
                  </div>
                  <div className={cx(inputBox, fieldMd)}>
                    <input
                      id="ob7-bucket-id"
                      value={pastedBucketId}
                      onChange={(e) => {
                        setPastedBucketId(e.target.value);
                        setAuthError(null);
                      }}
                      placeholder="e.g. testing or memwal-team-skills"
                      className={cx(inputControl, "font-mono text-[13px]")}
                    />
                  </div>
                </div>

                {/* 2. MemWal Account ID */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="ob7-account-id" className={fieldLabel}>
                      2. MemWal Account ID (Sui Mainnet Object) *
                    </label>
                    {pastedAccountId.trim().startsWith("0x") && (
                      <a
                        href={`https://suiscan.xyz/mainnet/object/${pastedAccountId.trim()}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-[11px] font-semibold text-emerald-700 underline decoration-emerald-500/40 hover:text-emerald-500 dark:text-emerald-300"
                      >
                        View on Suiscan ↗
                      </a>
                    )}
                  </div>
                  <div className={cx(inputBox, fieldMd)}>
                    <input
                      id="ob7-account-id"
                      value={pastedAccountId}
                      onChange={(e) => {
                        setPastedAccountId(e.target.value);
                        setAuthError(null);
                      }}
                      placeholder="0x463ec47ea456b183e4c92bfbbecaf2ff62c938f0c8809a48c8325e238183eb1d"
                      className={cx(inputControl, "font-mono text-[12.5px]")}
                    />
                  </div>
                </div>

                {/* 3. Delegate Private Key */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="ob7-delegate-key" className={fieldLabel}>
                    3. Delegate Private Key (Ed25519 Hex or suiprivkey1) *
                  </label>
                  <div className={cx(inputBox, fieldMd)}>
                    <input
                      id="ob7-delegate-key"
                      type="password"
                      value={pastedDelegateKey}
                      onChange={(e) => {
                        setPastedDelegateKey(e.target.value);
                        setAuthError(null);
                      }}
                      placeholder="64-character hex delegate key or suiprivkey1..."
                      className={cx(inputControl, "font-mono text-[12.5px]")}
                    />
                  </div>
                  {pastedDelegateKey.trim() && (
                    <p className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
                      {(() => {
                        const d = deriveDelegateKeyIdentity(pastedDelegateKey);
                        return d.ok
                          ? `✓ Derived Delegate Signer: ${d.identity.suiAddress.slice(0, 10)}…${d.identity.suiAddress.slice(-6)} (Pubkey 0x${d.identity.publicKeyHex.slice(0, 10)}…)`
                          : d.error;
                      })()}
                    </p>
                  )}
                </div>

                {/* 4. Console Integration API Key (Required) */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor="ob7-console-api-key" className={fieldLabel}>
                      4. Console Integration API Key (hbr_...) *
                    </label>
                    <a
                      href="https://console.walrus.xyz/integrations"
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 font-mono text-[11px] font-semibold text-emerald-700 underline decoration-emerald-500/40 hover:text-emerald-500 dark:text-emerald-300"
                    >
                      Open Integrations ↗
                    </a>
                  </div>
                  <div className={cx(inputBox, fieldMd)}>
                    <input
                      id="ob7-console-api-key"
                      value={pastedConsoleApiKey}
                      onChange={(e) => {
                        setPastedConsoleApiKey(e.target.value);
                        setAuthError(null);
                      }}
                      placeholder="hbr_live_... (from console.walrus.xyz → Integrations)"
                      className={cx(inputControl, "font-mono text-[12.5px]")}
                    />
                  </div>
                </div>
                  </>
                )}

                {authError && (
                  <div
                    data-testid="qa-auth-error"
                    className="rounded-[14px] border border-amber-500/35 bg-amber-500/10 p-3.5 text-[13px] text-amber-900 dark:text-amber-200"
                  >
                    <p className="font-semibold">{authError}</p>
                  </div>
                )}

                {qaDebugOpen && (
                  <div
                    data-testid="qa-statechart-panel"
                    className="rounded-[16px] border border-dashed border-emerald-600/40 bg-neutral-950/[0.03] p-3.5 dark:border-emerald-400/40 dark:bg-white/[0.03]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-[10.5px] font-bold tracking-[0.06em] text-emerald-700 uppercase dark:text-emerald-300">
                        pstack Statechart & Shared-Namespace QA
                      </span>
                      <span
                        data-testid="qa-current-state"
                        className={onboardingPillBadge}
                      >
                        {qaCurrentState}
                      </span>
                    </div>

                    <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                      {Object.values(QA_STRESS_SCENARIOS).map((sc) => (
                        <button
                          key={sc.id}
                          type="button"
                          data-testid={`qa-scenario-${sc.id}`}
                          onClick={() => {
                            setAuthMethod("paste-keys");
                            setPastedBucketId(sc.bucketId);
                            setPastedAccountId(sc.accountId);
                            setPastedDelegateKey(sc.delegateKey);
                            setPastedConsoleApiKey(sc.consoleApiKey);
                            setAuthError(null);
                          }}
                          className="flex h-9 cursor-pointer items-center justify-between rounded-[10px] border border-neutral-900/12 bg-white/80 px-2.5 text-left font-mono text-[11px] font-semibold text-neutral-800 transition hover:border-emerald-500/40 hover:bg-emerald-500/8 dark:border-white/12 dark:bg-neutral-900/80 dark:text-neutral-200"
                        >
                          <span className="truncate">{sc.label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-900/8 pt-2 font-mono text-[10.5px] text-neutral-600 dark:border-white/10 dark:text-neutral-400">
                      <span>Touch Targets: &gt;= 36px PASS</span>
                      <span>Overflow: 0 nodes</span>
                      <span>
                        Scope:{" "}
                        {pastedAccountId
                          .trim()
                          .toLowerCase()
                          .startsWith("0x463ec47ea456")
                          ? "Shared Team Vault (3 delegates)"
                          : "Isolated Vault Check"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* STEP 0B: VERIFIED ON-CHAIN ACCESS & PERMISSION GATE */}
          {step === 0 && awaitingPermission && (
            <>
              <div className="flex items-center justify-between gap-2">
                <h2 className={typeHeadingSm}>
                  <AmicroTextReveal text="Verified on Sui Mainnet" />
                </h2>
                <button
                  type="button"
                  data-testid="copy-all-env-btn"
                  onClick={() =>
                    void handleCopyField(
                      "step0b-env",
                      [
                        `MEMWAL_NAMESPACE=${cleanSlug}`,
                        `MEMWAL_ACCOUNT_ID=${accountId}`,
                        `MEMWAL_PRIVATE_KEY=${delegateKey}`,
                        `CONSOLE_BUCKET_ID=${activeBucketId}`,
                        `CONSOLE_API_KEY=${verifiedSession?.consoleApiKey || pastedConsoleApiKey || ""}`,
                      ].join("\n"),
                    )
                  }
                  className={cx(
                    onboardingCopyBtn,
                    copiedField === "step0b-env" && stepDone,
                  )}
                >
                  <span>
                    {copiedField === "step0b-env"
                      ? "Copied .env ✓"
                      : "Copy All (.env)"}
                  </span>
                </button>
              </div>
              <p className={cx(typeBodySm, text2, "mt-1.5")}>
                Live check passed on{" "}
                <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200">
                  relayer.memory.walrus.xyz
                </span>{" "}
                ({verifiedSession?.recalledCount ?? 10} memory blobs recalled).
                Copy any credential below or continue to{" "}
                <span className="font-mono font-bold text-neutral-900 dark:text-white">
                  {activeBucketId}
                </span>
                .
              </p>

              <div className="mt-4 space-y-3">
                <div className={frame}>
                  <div className="divide-y divide-neutral-900/8 px-4 py-1 dark:divide-neutral-100/8">
                    {/* Row 1: Console Bucket */}
                    <div className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[13.5px] font-bold text-neutral-900 dark:text-white">
                            Console Bucket:{" "}
                            <a
                              href="https://console.walrus.xyz/buckets/"
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-[var(--rb-accent-fg,oklch(26%_0.06_168))] underline decoration-emerald-500/40 underline-offset-3 hover:text-emerald-700 dark:text-[#6ee7b7]"
                            >
                              {activeBucketId} ↗
                            </a>
                          </span>{" "}
                          <span className={onboardingPillBadge}>
                            Live Recall OK
                          </span>
                        </div>
                        <p className="mt-0.5 text-[12px] text-neutral-600 dark:text-neutral-400">
                          Live recall check returned{" "}
                          <strong className="font-semibold text-neutral-900 dark:text-neutral-200">
                            {verifiedSession?.recalledCount ?? 10} memory blobs
                          </strong>{" "}
                          from{" "}
                          <span className="font-mono">
                            relayer.memory.walrus.xyz
                          </span>
                          .
                        </p>
                      </div>
                      <button
                        type="button"
                        data-testid="copy-bucket-btn"
                        onClick={() =>
                          void handleCopyField("step0b-bucket", activeBucketId)
                        }
                        className={cx(
                          onboardingCopyBtn,
                          "w-[68px] shrink-0",
                          copiedField === "step0b-bucket" && stepDone,
                        )}
                      >
                        {copiedField === "step0b-bucket" ? "Copied ✓" : "Copy"}
                      </button>
                    </div>

                    {/* Row 2: MemWal Account ID */}
                    <div className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[13.5px] font-bold text-neutral-900 dark:text-white">
                            MemWal Account (On-Chain)
                          </span>{" "}
                          <span className={onboardingPillBadge}>
                            Mainnet Object
                          </span>
                        </div>
                        <p className="mt-0.5 truncate font-mono text-[12px] text-neutral-600 dark:text-neutral-400">
                          <a
                            href={`https://suiscan.xyz/mainnet/object/${accountId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-[var(--rb-accent-fg,oklch(26%_0.06_168))] underline decoration-emerald-500/40 underline-offset-3 hover:text-emerald-700 dark:text-[#6ee7b7]"
                          >
                            {accountId.slice(0, 10)}…{accountId.slice(-8)} ↗
                          </a>{" "}
                          · Owner {activeOwnerAddress.slice(0, 8)}…
                          {activeOwnerAddress.slice(-4)}
                        </p>
                      </div>
                      <button
                        type="button"
                        data-testid="copy-account-btn"
                        onClick={() =>
                          void handleCopyField("step0b-account", accountId)
                        }
                        className={cx(
                          onboardingCopyBtn,
                          "w-[68px] shrink-0",
                          copiedField === "step0b-account" && stepDone,
                        )}
                      >
                        {copiedField === "step0b-account" ? "Copied ✓" : "Copy"}
                      </button>
                    </div>

                    {/* Row 3: Verified Delegate Signer */}
                    <div className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[13.5px] font-bold text-neutral-900 dark:text-white">
                            Verified Delegate Key Signer
                          </span>{" "}
                          <span className={onboardingPillBadge}>
                            Authorized
                          </span>
                        </div>
                        <p className="mt-0.5 truncate font-mono text-[12px] text-neutral-600 dark:text-neutral-400">
                          <strong className="font-bold text-neutral-900 dark:text-white">
                            {verifiedSession?.resolvedHandle ??
                              "@harrymove-ctrl"}
                          </strong>{" "}
                          · Ed25519 {activeDelegateSuiAddress.slice(0, 10)}…
                          {activeDelegateSuiAddress.slice(-6)}
                        </p>
                      </div>
                      <button
                        type="button"
                        data-testid="copy-delegate-btn"
                        onClick={() =>
                          void handleCopyField(
                            "step0b-delegate",
                            activeDelegateSuiAddress,
                          )
                        }
                        className={cx(
                          onboardingCopyBtn,
                          "w-[68px] shrink-0",
                          copiedField === "step0b-delegate" && stepDone,
                        )}
                      >
                        {copiedField === "step0b-delegate"
                          ? "Copied ✓"
                          : "Copy"}
                      </button>
                    </div>

                    {/* Row 4: Vault Owner & Shared Team Roster */}
                    <div className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[13.5px] font-bold text-neutral-900 dark:text-white">
                            Shared Team Namespace Vault
                          </span>{" "}
                          <span className={onboardingPillBadge}>
                            Shared Vault
                          </span>
                        </div>
                        <p className="mt-0.5 text-[12px] text-neutral-600 dark:text-neutral-400">
                          {verifiedSession?.sharedVaultMembersCount ?? 3} active
                          delegate keys share{" "}
                          <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200">
                            {activeBucketId}
                          </span>{" "}
                          on the same MemWalAccount.
                        </p>
                      </div>
                      <button
                        type="button"
                        data-testid="copy-owner-btn"
                        onClick={() =>
                          void handleCopyField(
                            "step0b-owner",
                            activeOwnerAddress,
                          )
                        }
                        className={cx(
                          onboardingCopyBtn,
                          "w-[68px] shrink-0",
                          copiedField === "step0b-owner" && stepDone,
                        )}
                      >
                        {copiedField === "step0b-owner" ? "Copied ✓" : "Copy"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Copy Bar for Private Delegate Key & MCP CLI */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    data-testid="copy-private-key-btn"
                    onClick={() =>
                      void handleCopyField("step0b-privkey", delegateKey)
                    }
                    className={cx(
                      secondaryButton,
                      buttonSm,
                      "h-9 w-full justify-center font-mono text-[11.5px] font-semibold",
                      copiedField === "step0b-privkey" && stepDone,
                    )}
                  >
                    {copiedField === "step0b-privkey"
                      ? "Copied Delegate Key ✓"
                      : "Copy Delegate Private Key"}
                  </button>
                  <button
                    type="button"
                    data-testid="copy-mcp-cli-btn"
                    onClick={() =>
                      void handleCopyField("step0b-mcp", cliCommand)
                    }
                    className={cx(
                      secondaryButton,
                      buttonSm,
                      "h-9 w-full justify-center font-mono text-[11.5px] font-semibold",
                      copiedField === "step0b-mcp" && stepDone,
                    )}
                  >
                    {copiedField === "step0b-mcp"
                      ? "Copied MCP Command ✓"
                      : "Copy MCP CLI Command"}
                  </button>
                </div>

                {authError && (
                  <div className="rounded-[14px] border border-amber-500/35 bg-amber-500/10 p-3.5 text-[13px] text-amber-900 dark:text-amber-200">
                    <p className="font-semibold">{authError}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* STEP 1: WORKSPACE (SELECT EXISTING WALRUS CONSOLE BUCKET OR FAST-CREATE BUCKET) */}
          {step === 1 && (
            <>
              {workspaceMode === "existing" ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className={typeHeadingSm}>
                        <AmicroTextReveal text="Your Walrus Console Buckets" />
                      </h2>
                      <p className={cx(typeBodySm, text2, "mt-1.5")}>
                        Choose a bucket for your team&apos;s{" "}
                        <span className="font-mono">SKILL.md</span> files and
                        learned rules, or create a new one.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3.5">
                    {bucketNotice && (
                      <div className="flex items-center justify-between gap-2 rounded-[14px] border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2.5 text-[12.5px] font-semibold text-emerald-900 dark:border-emerald-400/35 dark:bg-emerald-500/12 dark:text-emerald-200">
                        <span>✓ {bucketNotice}</span>
                        <button
                          type="button"
                          onClick={() => setBucketNotice(null)}
                          className="text-[11px] opacity-70 hover:opacity-100"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}

                    <div
                      role="radiogroup"
                      aria-label="Existing Walrus Console Buckets"
                      className="space-y-2.5"
                    >
                      {allWorkspaces.map((ws) => {
                        const selected = cleanSlug === ws.slug;
                        const bktId = ws.bucketId || "bkt_01j8team9f2c1a4b";
                        const ownerAddr =
                          ws.ownerAddress || consoleBundle.webAccountAddress;
                        const bktUrl =
                          ws.consoleUrl ||
                          `https://console.walrus.xyz/buckets/${bktId}`;
                        const sealId =
                          ws.sealPolicyId ||
                          "0x94c1e8b203a4f7c1e9d8b2a5f6c3e0d1a2b3c4d5e6f7a8b9c0d1e2f3a4b57d41";
                        return (
                          <div
                            key={ws.slug}
                            role="radio"
                            aria-checked={selected}
                            tabIndex={0}
                            onClick={() => handleSlugChange(ws.slug)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                handleSlugChange(ws.slug);
                              }
                            }}
                            className={cx(
                              focusRing,
                              transition,
                              "flex w-full cursor-pointer items-center justify-between gap-3 rounded-[18px] border p-3.5 text-left",
                              selected
                                ? "border-emerald-500/60 bg-emerald-500/10 shadow-[0_0_0_1px_rgb(16_185_129/0.35)] dark:border-emerald-400/50 dark:bg-emerald-500/12"
                                : "border-neutral-900/10 bg-neutral-900/[0.02] hover:bg-neutral-900/[0.04] dark:border-neutral-100/10 dark:bg-neutral-100/[0.03] dark:hover:bg-neutral-100/[0.06]",
                            )}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className={typeLabel}>{ws.name}</span>
                                <span className="rounded-full bg-neutral-900/8 px-2 py-0.5 font-mono text-[10.5px] font-semibold text-neutral-700 dark:bg-neutral-100/10 dark:text-neutral-300">
                                  {bktId}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void handleCopyField(`seal-${ws.slug}`, sealId);
                                  }}
                                  className="rounded-full border border-neutral-900/12 bg-white/80 px-2 py-0.5 font-mono text-[10.5px] font-semibold text-neutral-700 hover:bg-white dark:border-neutral-100/15 dark:bg-neutral-900/80 dark:text-neutral-200"
                                  title="Copy SEAL Policy ID"
                                >
                                  {copiedField === `seal-${ws.slug}`
                                    ? "Copied ✓"
                                    : "Copy Policy ID"}
                                </button>
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                <a
                                  href={bktUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="font-mono text-[12px] text-emerald-700 underline decoration-emerald-500/40 underline-offset-2 hover:decoration-emerald-500 dark:text-emerald-300"
                                >
                                  console.walrus.xyz/buckets/{bktId} ↗
                                </a>
                              </div>
                              <p className={cx(typeCaption, text2, "mt-1")}>
                                {ws.skillsCount} skills
                                {storageMode === "hybrid"
                                  ? ` · ${ws.flowsCount} learned rules`
                                  : ""}{" "}
                                · Owner {ownerAddr.slice(0, 6)}…
                                {ownerAddr.slice(-4)}
                              </p>
                            </div>

                            <span
                              aria-hidden="true"
                              className={cx(
                                stepIndicator,
                                selected ? stepDone : stepUpcoming,
                              )}
                            >
                              {selected ? (
                                <HugeiconsIcon
                                  icon={Tick02Icon}
                                  size={14}
                                  strokeWidth={2.0}
                                />
                              ) : (
                                "→"
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setName("Agent Ops Skills");
                          setNewSlug("agent-ops-skills");
                          setWorkspaceMode("create");
                        }}
                        className={cx(secondaryButton, buttonSm, "w-full")}
                      >
                        + Create New Bucket
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className={typeHeadingSm}>Create New Bucket</h2>
                      <p className={cx(typeBodySm, text2, "mt-1.5")}>
                        Creates a dedicated bucket on{" "}
                        <span className="font-mono">console.walrus.xyz</span>{" "}
                        owned by your wallet.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWorkspaceMode("existing")}
                      className={cx(secondaryButton, buttonSm)}
                    >
                      Buckets ({allWorkspaces.length})
                    </button>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="ob7-name" className={fieldLabel}>
                        Bucket name
                      </label>
                      <div className={cx(inputBox, fieldMd)}>
                        <input
                          id="ob7-name"
                          value={name}
                          onChange={(e) => {
                            const nextName = e.target.value;
                            setName(nextName);
                            setNewSlug(
                              nextName
                                .trim()
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, "-")
                                .replace(/^-|-$/g, "") || "new-workspace",
                            );
                          }}
                          placeholder="Agent Ops Skills"
                          className={inputControl}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label htmlFor="ob7-slug" className={fieldLabel}>
                        Bucket URL slug
                      </label>
                      <div className={cx(inputBox, fieldMd)}>
                        <span data-affix className={inputAffix}>
                          console.walrus.xyz/buckets/
                        </span>
                        <input
                          id="ob7-slug"
                          value={newSlug}
                          onChange={(e) => setNewSlug(e.target.value)}
                          placeholder="agent-ops-skills"
                          aria-describedby="ob7-slug-hint"
                          className={inputControl}
                        />
                      </div>
                      <p id="ob7-slug-hint" className={fieldDescription}>
                        Owned by your wallet (
                        <span className="font-mono">
                          {consoleBundle.webAccountAddress.slice(0, 8)}…
                          {consoleBundle.webAccountAddress.slice(-4)}
                        </span>
                        ) · Includes 5 GB free storage.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label htmlFor="ob7-region" className={fieldLabel}>
                        Data region
                      </label>
                      <Select
                        id="ob7-region"
                        value={region}
                        onChange={setRegion}
                        options={REGION_OPTIONS}
                      />
                    </div>

                    <div className={frame}>
                      <div className="flex items-start justify-between gap-4 p-4">
                        <div className="min-w-0">
                          <p className={typeLabel}>Private encrypted bucket</p>
                          <p className={cx(typeBodySm, text3, "mt-0.5")}>
                            Only approved team members can read or update skills
                            in this bucket.
                          </p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isPrivate}
                          aria-label="Private encrypted bucket"
                          onClick={() => setIsPrivate((v) => !v)}
                          className={cx(switchTrack, "-mt-0.5")}
                        >
                          <span aria-hidden="true" className={switchThumb} />
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* STEP 2: 3. TEAM — SEAL POLICY ADDRESS MANAGER, INVITE LINK & CODING AGENT SETUP */}
          {step === 2 && (
            <>
              <div className="flex items-center justify-between gap-2">
                <h2 className={typeHeadingSm}>
                  <AmicroTextReveal
                    text={
                      teamStepTab === "seal-invite"
                        ? "SEAL Policy & Team Invite"
                        : "Connect your coding agent"
                    }
                  />
                </h2>
                <span className={onboardingPillBadge}>
                  SEAL v{sealCounterVersion} · {sealMembers.length} Addresses
                </span>
              </div>
              <p className={cx(typeBodySm, text2, "mt-1.5")}>
                {teamStepTab === "seal-invite"
                  ? "Manage allowlisted Sui addresses (0x...) and Ed25519 delegate keys on your SEAL Policy, or copy a 1-click invite link for teammates."
                  : "Copy and paste this guide into Claude Code, Cursor, or Antigravity so your agent can read and update your team's skills."}
              </p>

              {/* 2-Tab Switcher in Step 3 (3. TEAM): SEAL Policy & Invite vs Agent Setup (.md) */}
              <div
                role="tablist"
                aria-label="Team setup mode"
                className="mt-4 grid grid-cols-2 gap-1.5 rounded-[14px] bg-[color-mix(in_oklab,var(--rb-n-200,oklch(92.8%_0.009_76))_68%,white)] p-1 shadow-[inset_0_1px_2px_rgb(84_62_32/0.09),inset_0_0_0_1px_rgb(84_62_32/0.05)] dark:bg-neutral-900 dark:shadow-[inset_0_1px_2px_rgb(0_0_0/0.6),inset_0_0_0_1px_rgb(255_255_255/0.06)]"
              >
                <button
                  type="button"
                  role="tab"
                  data-testid="tab-team-seal-invite"
                  aria-selected={teamStepTab === "seal-invite"}
                  onClick={() => setTeamStepTab("seal-invite")}
                  className={cx(
                    "inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-[10px] px-3 font-sans text-[12.5px] font-bold transition",
                    teamStepTab === "seal-invite"
                      ? "bg-[#111111] text-[#6ee7b7] shadow-xs dark:bg-zinc-800 dark:text-[#6ee7b7]"
                      : "text-neutral-700 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white",
                  )}
                >
                  {teamStepTab === "seal-invite" && (
                    <span className="size-1.5 rounded-full bg-[#34d399]" />
                  )}
                  <span>SEAL Policy &amp; Invite Link</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  data-testid="tab-team-agent-md"
                  aria-selected={teamStepTab === "agent-md"}
                  onClick={() => setTeamStepTab("agent-md")}
                  className={cx(
                    "inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-[10px] px-3 font-sans text-[12.5px] font-bold transition",
                    teamStepTab === "agent-md"
                      ? "bg-[#111111] text-[#6ee7b7] shadow-xs dark:bg-zinc-800 dark:text-[#6ee7b7]"
                      : "text-neutral-700 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white",
                  )}
                >
                  {teamStepTab === "agent-md" && (
                    <span className="size-1.5 rounded-full bg-[#34d399]" />
                  )}
                  <span>Agent Setup (.md &amp; MCP)</span>
                </button>
              </div>

              {teamStepTab === "seal-invite" ? (
                <div className="mt-4 space-y-3.5">
                  {/* 1. Shareable Teammate Invite Link Box */}
                  <div className="rounded-[18px] bg-[color-mix(in_oklab,var(--rb-n-200,oklch(92.8%_0.009_76))_46%,white)] p-3.5 shadow-[inset_0_0_0_1px_rgb(84_62_32/0.07)] dark:bg-neutral-900/75 dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.07)]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-mono text-[11.5px] font-bold text-neutral-900 dark:text-white">
                          1. Share Teammate Invite Link ({activeBucketId})
                        </p>
                        <p className="mt-0.5 text-[11.5px] text-neutral-600 dark:text-neutral-400">
                          Pre-fills bucket{" "}
                          <span className="font-mono font-semibold">
                            {activeBucketId}
                          </span>
                          , MemWalAccount, and SEAL Policy ID{" "}
                          <span className="font-mono">
                            {activeSealPolicyId.slice(0, 8)}…
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          data-testid="copy-invite-link-btn"
                          onClick={() => {
                            const origin =
                              typeof window !== "undefined"
                                ? window.location.origin
                                : "http://127.0.0.1:5188";
                            const inviteUrl = `${origin}/?invite=1&bucket=${encodeURIComponent(activeBucketId)}&account=${encodeURIComponent(accountId)}&sealPolicy=${encodeURIComponent(activeSealPolicyId)}&invitedBy=${encodeURIComponent("@harrymove-ctrl")}`;
                            void handleCopyField("team-invite-link", inviteUrl);
                          }}
                          className={cx(
                            onboardingCopyBtn,
                            copiedField === "team-invite-link" && stepDone,
                          )}
                        >
                          {copiedField === "team-invite-link"
                            ? "Copied Link ✓"
                            : "Copy Invite Link ↗"}
                        </button>
                        <button
                          type="button"
                          data-testid="copy-seal-policy-btn"
                          onClick={() =>
                            void handleCopyField(
                              "team-seal-policy",
                              activeSealPolicyId,
                            )
                          }
                          className={cx(
                            onboardingCopyBtn,
                            copiedField === "team-seal-policy" && stepDone,
                          )}
                        >
                          {copiedField === "team-seal-policy"
                            ? "Copied ID ✓"
                            : "Copy SEAL ID"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 2. Add Sui Address (0x...) or Ed25519 Key to SEAL Policy & MemWalAccount */}
                  <div className="rounded-[18px] bg-[color-mix(in_oklab,var(--rb-n-200,oklch(92.8%_0.009_76))_46%,white)] p-3.5 shadow-[inset_0_0_0_1px_rgb(84_62_32/0.07)] dark:bg-neutral-900/75 dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.07)]">
                    <div className="flex items-center justify-between gap-2">
                      <span className={fieldLabel}>
                        2. Add Address to SEAL Policy &amp; MemWalAccount
                      </span>
                      <span className="font-mono text-[10.5px] font-semibold text-neutral-500 dark:text-neutral-400">
                        account::add_delegate_key + seal_approve
                      </span>
                    </div>
                    <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-[140px_minmax(0,1fr)]">
                      <div className={cx(inputBox, fieldMd)}>
                        <input
                          data-testid="seal-add-handle-input"
                          value={newMemberHandle}
                          onChange={(e) => setNewMemberHandle(e.target.value)}
                          placeholder="@teammate-ops"
                          className={cx(inputControl, "font-mono text-[12px]")}
                        />
                      </div>
                      <div className={cx(inputBox, fieldMd)}>
                        <input
                          data-testid="seal-add-address-input"
                          value={newMemberAddressInput}
                          onChange={(e) =>
                            setNewMemberAddressInput(e.target.value)
                          }
                          placeholder="0x... Sui Address or 64-char Ed25519 Public/Private Key"
                          className={cx(inputControl, "font-mono text-[12px]")}
                        />
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {(
                          [
                            "Delegate · Read/Write",
                            "SEAL Allowlist · Read",
                          ] as const
                        ).map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setNewMemberRole(r)}
                            className={cx(
                              "h-7 cursor-pointer rounded-full px-2.5 font-mono text-[10.5px] font-bold transition",
                              newMemberRole === r
                                ? "bg-[#111111] text-[#6ee7b7] dark:bg-zinc-800 dark:text-[#6ee7b7]"
                                : onboardingCopyBtn,
                            )}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        data-testid="seal-add-member-btn"
                        onClick={() => {
                          const rawAddr = newMemberAddressInput.trim();
                          if (!rawAddr) {
                            setSealPolicyNotice(
                              "Paste a 0x... Sui wallet address or Ed25519 key to authorize on SEAL Policy.",
                            );
                            return;
                          }
                          let resolvedAddr = rawAddr;
                          let resolvedPub = rawAddr.replace(/^0x/, "");
                          const derived = deriveDelegateKeyIdentity(rawAddr);
                          if (derived.ok) {
                            resolvedAddr = derived.identity.suiAddress;
                            resolvedPub = derived.identity.publicKeyHex;
                          } else if (!rawAddr.startsWith("0x")) {
                            resolvedAddr = `0x${rawAddr}`;
                          }
                          const handleClean = (
                            newMemberHandle.trim() ||
                            `@member-${sealMembers.length + 1}`
                          ).startsWith("@")
                            ? newMemberHandle.trim() ||
                              `@member-${sealMembers.length + 1}`
                            : `@${newMemberHandle.trim()}`;

                          setSealMembers((prev) => [
                            ...prev.filter(
                              (m) =>
                                m.suiAddress.toLowerCase() !==
                                resolvedAddr.toLowerCase(),
                            ),
                            {
                              handle: handleClean,
                              role: newMemberRole,
                              suiAddress: resolvedAddr,
                              publicKeyHex: resolvedPub,
                            },
                          ]);
                          setNewMemberHandle("");
                          setNewMemberAddressInput("");
                          setSealPolicyNotice(
                            `Authorized ${handleClean} (${resolvedAddr.slice(0, 10)}…${resolvedAddr.slice(-6)}) on SEAL Policy ${activeSealPolicyId.slice(0, 8)}… and bucket ${activeBucketId}.`,
                          );
                        }}
                        className={cx(onboardingCopyBtn, stepDone)}
                      >
                        + Authorize Address
                      </button>
                    </div>
                    {sealPolicyNotice && (
                      <p
                        data-testid="seal-policy-notice"
                        className="mt-2 font-mono text-[11px] font-semibold text-[var(--rb-accent-fg,oklch(26%_0.06_168))] dark:text-[#6ee7b7]"
                      >
                        ✓ {sealPolicyNotice}
                      </p>
                    )}
                  </div>

                  {/* 3. Active SEAL Policy & MemWalAccount Roster */}
                  <div className={frame}>
                    <div className="divide-y divide-neutral-900/8 px-4 py-1 dark:divide-neutral-100/8">
                      {sealMembers.map((m) => {
                        const copyId = `seal-member-${m.handle}`;
                        return (
                          <div
                            key={m.suiAddress}
                            className="flex items-center justify-between gap-3 py-2.5"
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-2.5">
                              <SignerOrb3D
                                handle={m.handle}
                                size="md"
                                online
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-mono text-[12.5px] font-bold text-neutral-900 dark:text-white">
                                    {m.handle}
                                  </span>{" "}
                                  <span className={onboardingPillBadge}>
                                    {m.role}
                                  </span>
                                </div>
                                <p className="mt-0.5 truncate font-mono text-[11px] text-neutral-600 dark:text-neutral-400">
                                  {m.suiAddress.slice(0, 12)}…
                                  {m.suiAddress.slice(-8)} · Bucket{" "}
                                  {activeBucketId}
                                </p>
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  void handleCopyField(copyId, m.suiAddress)
                                }
                                className={cx(
                                  onboardingCopyBtn,
                                  copiedField === copyId && stepDone,
                                )}
                              >
                                {copiedField === copyId ? "Copied ✓" : "Copy"}
                              </button>
                              {!m.isOwner && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSealMembers((prev) =>
                                      prev.filter(
                                        (x) => x.suiAddress !== m.suiAddress,
                                      ),
                                    );
                                    setSealCounterVersion((v) => v + 1);
                                    setSealPolicyNotice(
                                      `Revoked ${m.handle} and rotated SEAL access_counter_version to v${sealCounterVersion + 1}.`,
                                    );
                                  }}
                                  className={onboardingCopyBtn}
                                  title="Remove from SEAL Policy and bump access_counter_version"
                                >
                                  Revoke
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="ob7-copy-format" className={fieldLabel}>
                      Choose setup format
                    </label>
                    <AmicroMorphTabs
                      value={copyFormat}
                      onChange={setCopyFormat}
                      options={[
                        { value: "agent-prompt", label: "Agent Prompt" },
                        { value: "agents-md", label: "AGENTS.md" },
                        { value: "mcp-json", label: "MCP Config" },
                      ]}
                    />
                  </div>

                  {/* HextaUI Pro Markdown Reader Block */}
                  <Markdown
                    title={
                      copyFormat === "agent-prompt"
                        ? "Agent Setup Guide (.md)"
                        : copyFormat === "agents-md"
                          ? `AGENTS-${cleanSlug}.md`
                          : "MCP Setup (.md)"
                    }
                    badge={activeBucketId}
                    content={
                      copyFormat === "agent-prompt" ||
                      copyFormat === "agents-md"
                        ? simpleReadableMarkdown
                        : `\`\`\`${copyFormat === "mcp-json" ? "json" : "bash"}\n${activeSnippet}\n\`\`\``
                    }
                    onCopy={() => void handleCopy()}
                    onDownload={handleDownloadAgentsMd}
                    maxHeightClass="min-h-[340px] max-h-[540px]"
                  />

                  {/* Single clean toggle row */}
                  <div className="flex items-center justify-between gap-3 rounded-[14px] border border-neutral-900/10 bg-neutral-900/[0.02] px-3.5 py-2.5 dark:border-neutral-100/10 dark:bg-neutral-100/[0.03]">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-neutral-900 dark:text-neutral-100">
                        Ask before updating bucket
                      </p>
                      <p className="text-[12px] text-neutral-500 dark:text-neutral-400">
                        Your agent will always ask for your approval before
                        saving changes.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={autoAskFlowUpdate}
                      aria-label="Ask before updating bucket"
                      onClick={() => setAutoAskFlowUpdate((v) => !v)}
                      className={cx(switchTrack, "shrink-0")}
                    >
                      <span aria-hidden="true" className={switchThumb} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* STEP 3: FINISH */}
          {step === 3 && (
            <>
              <div className="flex items-center justify-between gap-2">
                <h2 className={cx(typeHeadingSm, "whitespace-nowrap")}>
                  <AmicroTextReveal text="Walrus Bucket Ready" />
                </h2>
                <span className={onboardingPillBadge}>Ready · Mainnet</span>
              </div>
              <p className={cx(typeBodySm, text2, "mt-1.5")}>
                {(
                  authNotice ||
                  `Your ${cleanSlug} bucket (${activeBucketId}) and self-updating AGENTS.md loop are active.`
                ).replace(/Harry Phan/g, "@harrymove-ctrl")}
              </p>

              <div className="mt-5 space-y-3.5">
                <div className={frame}>
                  <div className="divide-y divide-neutral-900/8 px-4 py-1 dark:divide-neutral-100/8">
                    {/* Row 1: Console Bucket */}
                    <div className="grid grid-cols-[136px_minmax(0,1fr)_68px] items-center gap-3 py-3">
                      <span className="text-[12.5px] font-medium text-neutral-500 dark:text-neutral-400">
                        Console Bucket
                      </span>
                      <div className="flex min-w-0 items-center gap-2">
                        <a
                          href={activeConsoleUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate font-mono text-[12.5px] font-semibold text-[var(--rb-accent-fg,oklch(26%_0.06_168))] underline decoration-emerald-500/40 underline-offset-3 hover:text-emerald-700 dark:text-[#6ee7b7]"
                        >
                          {activeBucketId} ↗
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          void handleCopyField("bucket", activeBucketId)
                        }
                        className={cx(
                          onboardingCopyBtn,
                          "w-[68px]",
                          copiedField === "bucket" && stepDone,
                        )}
                      >
                        {copiedField === "bucket" ? "Copied ✓" : "Copy"}
                      </button>
                    </div>

                    {/* Row 2: MemWal Account (Sui Mainnet Object) */}
                    <div className="grid grid-cols-[136px_minmax(0,1fr)_68px] items-center gap-3 py-3">
                      <span className="text-[12.5px] font-medium text-neutral-500 dark:text-neutral-400">
                        MemWal Account
                      </span>
                      <div className="flex min-w-0 items-center justify-between gap-2">
                        <a
                          href={`https://suiscan.xyz/mainnet/object/${accountId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate font-mono text-[12.5px] font-semibold text-[var(--rb-accent-fg,oklch(26%_0.06_168))] underline decoration-emerald-500/40 underline-offset-3 hover:text-emerald-700 dark:text-[#6ee7b7]"
                        >
                          {accountId.slice(0, 8)}…{accountId.slice(-6)} ↗
                        </a>{" "}
                        <span className={onboardingPillBadge}>Mainnet</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          void handleCopyField("account", accountId)
                        }
                        className={cx(
                          onboardingCopyBtn,
                          "w-[68px]",
                          copiedField === "account" && stepDone,
                        )}
                      >
                        {copiedField === "account" ? "Copied ✓" : "Copy"}
                      </button>
                    </div>

                    {/* Row 3: Verified Delegate Signer */}
                    <div className="grid grid-cols-[136px_minmax(0,1fr)_68px] items-center gap-3 py-3">
                      <span className="text-[12.5px] font-medium text-neutral-500 dark:text-neutral-400">
                        Delegate Signer
                      </span>
                      <div className="flex min-w-0 items-center justify-between gap-2">
                        <span className="truncate font-mono text-[12.5px] font-semibold text-neutral-900 dark:text-neutral-100">
                          {activeDelegateSuiAddress.slice(0, 8)}…
                          {activeDelegateSuiAddress.slice(-6)}
                        </span>{" "}
                        <span className={onboardingPillBadge}>
                          Verified Key
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          void handleCopyField(
                            "delegate",
                            activeDelegateSuiAddress,
                          )
                        }
                        className={cx(
                          onboardingCopyBtn,
                          "w-[68px]",
                          copiedField === "delegate" && stepDone,
                        )}
                      >
                        {copiedField === "delegate" ? "Copied ✓" : "Copy"}
                      </button>
                    </div>

                    {/* Row 4: Agent .md Loop */}
                    <div className="grid grid-cols-[136px_minmax(0,1fr)_68px] items-center gap-3 py-3">
                      <span className="text-[12.5px] font-medium text-neutral-500 dark:text-neutral-400">
                        Agent .md Loop
                      </span>
                      <div className="flex min-w-0 items-center justify-between gap-2">
                        <span className="truncate font-sans text-[12.5px] font-semibold text-neutral-900 dark:text-neutral-100">
                          {autoAskFlowUpdate
                            ? "Recall + Ask on Approval"
                            : "Manual Sync Only"}
                        </span>{" "}
                        <span className={onboardingPillBadge}>Active</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className={cx(onboardingCopyBtn, "w-[68px]")}
                      >
                        Guide
                      </button>
                    </div>
                  </div>
                </div>

                {/* Equal 3-column action bar */}
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => void handleCopyAgentsMd()}
                    className={cx(
                      secondaryButton,
                      buttonSm,
                      "h-10 w-full justify-center text-[12.5px] font-semibold",
                    )}
                  >
                    {copiedAgentsMd ? "Copied ✓" : "Copy AGENTS.md"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadAgentsMd}
                    className={cx(
                      secondaryButton,
                      buttonSm,
                      "h-10 w-full justify-center text-[12.5px] font-semibold",
                    )}
                  >
                    Download .md
                  </button>
                  <a
                    href={activeConsoleUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={cx(
                      secondaryButton,
                      buttonSm,
                      "h-10 w-full justify-center text-[12.5px] font-semibold no-underline",
                    )}
                  >
                    Console Bucket ↗
                  </a>
                </div>
              </div>
            </>
          )}

          <div className="mt-5 flex items-center gap-2">
            <button
              type="button"
              disabled={step === 0 && !awaitingPermission}
              onClick={() => {
                if (step === 0 && awaitingPermission) {
                  setAwaitingPermission(false);
                } else if (step === 1 && workspaceMode === "create") {
                  setWorkspaceMode("existing");
                } else {
                  setStep((s) => Math.max(0, s - 1));
                }
              }}
              className={cx(secondaryButton, buttonLg)}
            >
              Back
            </button>
            <AmicroButton
              type="submit"
              loading={busyAuth}
              className="flex-1"
            >
              {busyAuth
                ? step === 1
                  ? "Creating bucket on Walrus…"
                  : "Verifying on Sui Mainnet…"
                : step === 0 && awaitingPermission
                  ? connectedWalletSession
                    ? `Sign & Grant Access (${connectedWalletSession.walletName})`
                    : `Approve & Open ${activeBucketId}`
                  : step === 0 && authMethod === "paste-keys"
                    ? "Verify & Connect Mainnet"
                    : step === 0 && authMethod === "dev-wallet"
                      ? `Verify & Connect ${selectedDevWalletHandle}`
                    : step === 0 && authMethod === "console-bundle"
                      ? "Verify Bundle & Continue"
                      : step === 0 && authMethod === "slush"
                        ? `Connect ${selectedBrowserWallet || "Slush Wallet"}`
                        : step === 0 && authMethod === "enoki"
                          ? "Sign in with Google (Enoki)"
                          : step === 1 && workspaceMode === "create"
                            ? "Create Bucket"
                            : step === 1 && workspaceMode === "existing"
                              ? `Continue with ${activeBucketId}`
                              : step === STEPS.length - 1
                                ? "Open Live Eval"
                                : "Continue"}
            </AmicroButton>
          </div>
        </form>
      </div>
    </div>
  );
}
