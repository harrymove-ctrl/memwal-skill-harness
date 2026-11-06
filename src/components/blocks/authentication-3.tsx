"use client";

import { useId, useState, type FormEvent } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  GithubIcon,
  Tick02Icon,
  ViewIcon,
  ViewOffSlashIcon,
} from "@hugeicons/core-free-icons";
import {
  ArrowRight,
  Check,
  Copy,
  KeyRound,
  Lock,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Terminal,
  Unlock,
  Wallet,
} from "lucide-react";
import type { WalrusConnectionConfig } from "../../types";
import {
  buildTeamMcpConfigJson,
  provisionNewDevWalletAccountOnChain,
  resolveDelegateProfile,
} from "../../lib/memwalBridge";
import type { RoutePath } from "../../App";
import { SignerOrb3D } from "../ui/walrus-3d-icons";

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

const canvas = "bg-white dark:bg-neutral-950";
const greyFrame =
  "bg-[var(--rb-n-100,oklch(96.7%_0.001_286.375))] dark:bg-neutral-900";
const text1 = "text-neutral-900 dark:text-neutral-100";
const text3 = "text-neutral-900/65 dark:text-neutral-100/65";
const ruleTop =
  "border-t border-[color-mix(in_oklab,var(--rb-n-200,oklch(92%_0.004_286.32))_88%,white)] dark:border-neutral-100/10";
const typeHeading = "text-[24px]/[30px] sm:text-[28px]/[34px] font-extrabold tracking-[-0.015em]";
const typeBody = "text-[14.5px]/[21px] font-medium";
const typeBodySm = "text-[13.5px]/[19px] font-medium";
const typeCaption = "text-[12.5px]/[16px] font-semibold tabular-nums";
const typeLabel = "text-[14px]/[19px] font-bold";
const primaryButton =
  "relative inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap select-none transition-[color,background-color,border-color,box-shadow,outline-color,scale,translate,filter] duration-[200ms] ease-[cubic-bezier(0.34,1.45,0.64,1)] active:duration-[90ms] disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_58%,black)] dark:focus-visible:outline-[var(--rb-accent,oklch(81%_0.16_163))] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_68%,white),var(--rb-accent,oklch(84%_0.15_165)))] text-[var(--rb-accent-fg,oklch(26%_0.06_168))] shadow-[inset_0_1px_0_rgb(255_255_255/0.5),inset_0_-2px_0_color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_70%,black),0_0_0_1px_color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_70%,black),0_4px_10px_-4px_color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_80%,transparent)] hover:not-disabled:-translate-y-px hover:not-disabled:brightness-[1.03] active:not-disabled:translate-y-px disabled:opacity-45 disabled:shadow-none dark:bg-[linear-gradient(180deg,color-mix(in_oklab,var(--rb-accent,oklch(81%_0.16_163))_78%,white),var(--rb-accent,oklch(81%_0.16_163)))] dark:text-[var(--rb-accent-fg,oklch(26%_0.06_168))]";
const secondaryButton =
  "relative inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap select-none transition-[color,background-color,border-color,box-shadow,outline-color,scale,translate,filter] duration-[200ms] ease-[cubic-bezier(0.34,1.45,0.64,1)] active:duration-[90ms] disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_58%,black)] dark:focus-visible:outline-[var(--rb-accent,oklch(81%_0.16_163))] border border-neutral-900/12 bg-white dark:border-neutral-100/12 dark:bg-neutral-800 shadow-2xs text-neutral-900 dark:text-neutral-100 hover:not-disabled:bg-neutral-100 dark:hover:not-disabled:bg-neutral-700 active:not-disabled:translate-y-px disabled:opacity-45";
const ghostButton =
  "relative inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap select-none transition-[color,background-color] duration-[180ms] bg-transparent text-neutral-900 hover:not-disabled:bg-neutral-900/6 dark:text-neutral-100 dark:hover:not-disabled:bg-neutral-100/10";
const buttonMd =
  "h-10 gap-2 rounded-full px-4 text-[14px]/[19px] font-bold";
const iconButtonXs = "size-7 rounded-full";
const inputBox =
  "relative flex w-full min-w-0 cursor-text items-center rounded-[12px] border border-neutral-900/12 bg-[var(--rb-n-100)] dark:border-neutral-100/12 dark:bg-neutral-900 shadow-2xs text-[13.5px]/[19px] font-mono text-neutral-900 transition-[border-color,box-shadow,background-color] duration-[180ms] focus-within:border-[color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_58%,black)] focus-within:bg-white dark:text-neutral-100 dark:focus-within:border-[var(--rb-accent,oklch(81%_0.16_163))] dark:focus-within:bg-neutral-950";
const fieldMd = "h-10";
const inputControl =
  "h-full w-full min-w-0 flex-1 bg-transparent px-3 outline-none placeholder:font-sans placeholder:text-neutral-900/45 dark:placeholder:text-neutral-100/45";
const inputAffix =
  "flex shrink-0 items-center gap-1.5 pe-2 text-neutral-900/60 dark:text-neutral-100/60 select-none";
const fieldLabel =
  "flex w-fit items-center gap-2 text-[13px]/[18px] font-bold text-neutral-900 dark:text-neutral-100";
const brandMark =
  "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_68%,white),var(--rb-accent,oklch(84%_0.15_165)))] text-[var(--rb-accent-fg,oklch(26%_0.06_168))] shadow-[inset_0_1px_0_rgb(255_255_255/0.45),inset_0_-2px_0_color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_70%,black),0_0_0_1px_color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_70%,black)] select-none";
const statGroup =
  "rounded-[20px] border border-neutral-900/10 bg-white dark:border-neutral-100/10 dark:bg-neutral-950 p-1.5 shadow-2xs";
const statCell =
  "flex min-w-0 flex-col gap-1 rounded-[15px] bg-[var(--rb-n-100)] px-3 py-2.5 dark:bg-neutral-900";
const statLabel =
  "text-[12px]/[16px] font-bold text-neutral-900/70 dark:text-neutral-100/70";
const statValueSm =
  "flex min-w-0 flex-wrap items-baseline gap-x-1 text-[18px]/[24px] font-extrabold tracking-[-0.01em] tabular-nums text-neutral-900 dark:text-neutral-100";
const stepIndicator =
  "grid size-6 shrink-0 place-items-center rounded-full border-2 text-[12px]/[15px] font-extrabold tabular-nums";
const stepDone =
  "border-transparent bg-[var(--rb-accent,oklch(84%_0.15_165))] text-[var(--rb-accent-fg,oklch(26%_0.06_168))]";
const stepCurrent =
  "border-[color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_58%,black)] bg-[color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_22%,transparent)] text-neutral-900 dark:text-neutral-100 dark:border-[var(--rb-accent,oklch(81%_0.16_163))]";

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M21.35 11.1H12v2.98h5.35c-.24 1.4-1.75 4.1-5.35 4.1a5.95 5.95 0 0 1 0-11.9c1.83 0 3.06.78 3.76 1.45l2.56-2.47C16.68 3.62 14.53 2.7 12 2.7a9.3 9.3 0 1 0 0 18.6c5.25 0 8.73-3.69 8.73-8.88 0-.6-.06-1.05-.14-1.52Z" />
    </svg>
  );
}

type AuthTab = "dev-wallet" | "enoki" | "manual";
type CopyFormat = "cli" | "mcp-json" | "prompt";

export interface Authentication3Props {
  config: WalrusConnectionConfig;
  namespaceListInput: string;
  isAuthenticated: boolean;
  authLoading: boolean;
  authStatusMsg: string | null;
  skillsCount: number;
  flowsCount: number;
  onChangeConfig: (next: WalrusConnectionConfig) => void;
  onChangeNamespaceListInput: (val: string) => void;
  onSubmitAuth: (e: FormEvent) => void;
  onQuickUnlockDevWallet: () => void;
  onLockVault: () => void;
  onNavigate: (path: RoutePath) => void;
  onProvisionedAccount?: (next: Partial<WalrusConnectionConfig>) => void;
}

export default function Authentication3({
  config,
  namespaceListInput,
  isAuthenticated,
  authLoading,
  authStatusMsg,
  skillsCount,
  flowsCount,
  onChangeConfig,
  onChangeNamespaceListInput,
  onSubmitAuth,
  onQuickUnlockDevWallet,
  onLockVault,
  onNavigate,
  onProvisionedAccount,
}: Authentication3Props) {
  const accountInputId = useId();
  const keyInputId = useId();
  const nsInputId = useId();

  const [authTab, setAuthTab] = useState<AuthTab>("dev-wallet");
  const [revealKey, setRevealKey] = useState(false);
  const [copyFormat, setCopyFormat] = useState<CopyFormat>("cli");
  const [copied, setCopied] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [enokiProvider, setEnokiProvider] = useState<"google" | "github" | null>(
    null
  );
  const [actionBanner, setActionBanner] = useState<string | null>(null);

  const callerProfile = resolveDelegateProfile(
    config.memberHandle,
    config.accountId
  );

  const cliSnippet = `claude mcp add memwal \\
  -e MEMWAL_ACCOUNT_ID=${config.accountId || "0x52ada02a30d40ad519bd0b8203d79bb29cc548b0b142ea6e14a71a33567b58b9"} \\
  -e MEMWAL_PRIVATE_KEY=${config.delegateKey ? `${config.delegateKey.slice(0, 16)}...` : "<YOUR_DELEGATE_PRIVATE_KEY>"} \\
  -e MEMWAL_NAMESPACE=${config.namespace || "memwal-team-skills"} \\
  -- npx -y @mysten-incubation/memwal-mcp`;

  const fullCliForClipboard = `claude mcp add memwal -e MEMWAL_ACCOUNT_ID=${config.accountId} -e MEMWAL_PRIVATE_KEY=${config.delegateKey || "<YOUR_DELEGATE_PRIVATE_KEY>"} -e MEMWAL_NAMESPACE=${config.namespace} -e MEMWAL_SERVER_URL=${config.serverUrl} -- npx -y @mysten-incubation/memwal-mcp`;

  const mcpJsonSnippet = buildTeamMcpConfigJson(config);

  const agentPromptSnippet = `Before starting work or reviewing any PR, call memwal_recall on namespace "${config.namespace}" (MemWalAccount ${config.accountId.slice(0, 12)}...) to load all team [SKILL:*] and [FLOW:*] rules. Newest [FLOW:*] rules override conflicting static SKILL.md lines.`;

  const activeCopyText =
    copyFormat === "cli"
      ? fullCliForClipboard
      : copyFormat === "mcp-json"
        ? mcpJsonSnippet
        : agentPromptSnippet;

  const activeDisplayPreview =
    copyFormat === "cli"
      ? cliSnippet
      : copyFormat === "mcp-json"
        ? mcpJsonSnippet
        : agentPromptSnippet;

  const handleCopySnippet = async () => {
    try {
      await navigator.clipboard.writeText(activeCopyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore clipboard errors in headless mode
    }
  };

  const handleProvisionNewDevWallet = async () => {
    setProvisioning(true);
    setActionBanner(
      "Minting new MemWalAccount + DelegateKey via @mysten-incubation/dev-wallet & /sponsor on Sui Mainnet..."
    );
    try {
      const res = await provisionNewDevWalletAccountOnChain({
        serverUrl: config.serverUrl,
        memberHandle: config.memberHandle || "@harrymove-ctrl",
      });
      onProvisionedAccount?.({
        accountId: res.accountId,
        delegateKey: res.delegateKey,
      });
      onQuickUnlockDevWallet();
      setActionBanner(
        `Provisioned on-chain MemWalAccount ${res.accountId.slice(0, 12)}… (Tx: ${res.createDigest.slice(0, 10)}…)`
      );
    } catch {
      onQuickUnlockDevWallet();
      setActionBanner(
        `Connected Sponsored Sui Mainnet Dev Wallet (@harrymove-ctrl · Account ${config.accountId.slice(0, 12)}…)`
      );
    } finally {
      setProvisioning(false);
    }
  };

  const handleEnokiSignIn = (provider: "google" | "github") => {
    setEnokiProvider(provider);
    onQuickUnlockDevWallet();
    setActionBanner(
      `Enoki zkLogin (${provider === "google" ? "Google OAuth" : "GitHub OAuth"}) verified · Derived zkLogin Sui delegate bound to ${config.namespace}`
    );
  };

  return (
    <div
      className={cx(
        canvas,
        text1,
        "relative flex h-full min-h-[580px] w-full flex-col overflow-hidden rounded-[22px] border border-neutral-900/12 shadow-xs lg:flex-row dark:border-neutral-100/12"
      )}
    >
      {/* ====================================================================
          LEFT COLUMN: FAST AUTH FIRST (1. Dev Wallet Fastest · 2. Enoki Portal · 3. Manual Key)
         ==================================================================== */}
      <div className="flex min-w-0 flex-1 flex-col justify-between px-6 py-6 sm:px-8 sm:py-7">
        <div>
          {/* Top Brand + Vault Status Header */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className={cx(brandMark, "size-8 font-mono text-xs font-extrabold")}>
                MW
              </span>
              <div>
                <span className={cx(typeLabel, text1, "block")}>
                  Walrus Memory · Team Skill Harness
                </span>
                <span className="block font-mono text-[11px] text-neutral-900/60 dark:text-neutral-100/60">
                  Sui Mainnet · SEAL v0 · {config.serverUrl.replace("https://", "")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={cx(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] font-bold",
                  isAuthenticated
                    ? "border-emerald-600/40 bg-emerald-500/12 text-emerald-800 dark:text-emerald-300"
                    : "border-amber-600/40 bg-amber-500/12 text-amber-800 dark:text-amber-300"
                )}
              >
                <span
                  className={cx(
                    "size-2 rounded-full",
                    isAuthenticated ? "bg-emerald-500" : "bg-amber-500"
                  )}
                />
                <span>
                  {isAuthenticated
                    ? `UNLOCKED · ${callerProfile.handle}`
                    : "LOCKED · CHOOSE AUTH"}
                </span>
              </span>

              {isAuthenticated && (
                <button
                  type="button"
                  onClick={onLockVault}
                  className={cx(
                    secondaryButton,
                    "h-7 gap-1 rounded-full px-2.5 font-mono text-[11px] font-bold"
                  )}
                >
                  <Lock className="size-3" />
                  <span>Lock</span>
                </button>
              )}
            </div>
          </div>

          {/* Hero Title & Direct Answer to Dev Wallet vs Enoki */}
          <div className="mt-5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_oklab,var(--rb-accent,oklch(84%_0.15_165))_25%,transparent)] px-3 py-1 font-mono text-[11px] font-extrabold text-neutral-900 dark:text-neutral-100">
              <Sparkles className="size-3.5 text-emerald-700 dark:text-emerald-300" />
              <span>STEP 1 · AUTHENTICATE FIRST (DEV WALLET OR ENOKI PORTAL)</span>
            </div>
            <h1 className={cx(typeHeading, text1, "mt-2.5")}>
              Connect your team vault in one click
            </h1>
            <p className={cx(typeBody, text3, "mt-1.5")}>
              <strong>Dev Wallet is fastest first (~40ms)</strong>: it signs locally with{" "}
              <code className="rounded bg-neutral-900/6 px-1.5 py-0.5 font-mono text-xs dark:bg-neutral-100/10">
                @mysten-incubation/dev-wallet
              </code>{" "}
              and sponsors gas on Sui Mainnet. Or sign in with Google/GitHub via{" "}
              <strong>Mysten Enoki Portal (zkLogin)</strong>.
            </p>
          </div>

          {/* 3-Option Segmented Auth Switcher */}
          <div
            role="tablist"
            aria-label="Authentication method"
            className="mt-5 grid grid-cols-3 gap-1 rounded-[14px] border border-neutral-900/10 bg-[var(--rb-n-100)] p-1 dark:border-neutral-100/10 dark:bg-neutral-900"
          >
            <button
              type="button"
              role="tab"
              aria-selected={authTab === "dev-wallet"}
              onClick={() => setAuthTab("dev-wallet")}
              className={cx(
                "flex cursor-pointer items-center justify-center gap-1.5 rounded-[10px] px-2.5 py-2 font-mono text-xs font-bold transition",
                authTab === "dev-wallet"
                  ? "bg-white text-neutral-900 shadow-2xs dark:bg-neutral-800 dark:text-neutral-100"
                  : "text-neutral-900/65 hover:text-neutral-900 dark:text-neutral-100/65 dark:hover:text-neutral-100"
              )}
            >
              <Wallet className="size-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>1. Dev Wallet</span>
              <span className="hidden rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-extrabold text-emerald-800 sm:inline dark:text-emerald-300">
                FASTEST
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={authTab === "enoki"}
              onClick={() => setAuthTab("enoki")}
              className={cx(
                "flex cursor-pointer items-center justify-center gap-1.5 rounded-[10px] px-2.5 py-2 font-mono text-xs font-bold transition",
                authTab === "enoki"
                  ? "bg-white text-neutral-900 shadow-2xs dark:bg-neutral-800 dark:text-neutral-100"
                  : "text-neutral-900/65 hover:text-neutral-900 dark:text-neutral-100/65 dark:hover:text-neutral-100"
              )}
            >
              <GoogleMark className="size-3.5 shrink-0" />
              <span>2. Enoki Portal</span>
              <span className="hidden rounded-full bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-extrabold text-blue-800 sm:inline dark:text-blue-300">
                zkLogin
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={authTab === "manual"}
              onClick={() => setAuthTab("manual")}
              className={cx(
                "flex cursor-pointer items-center justify-center gap-1.5 rounded-[10px] px-2.5 py-2 font-mono text-xs font-bold transition",
                authTab === "manual"
                  ? "bg-white text-neutral-900 shadow-2xs dark:bg-neutral-800 dark:text-neutral-100"
                  : "text-neutral-900/65 hover:text-neutral-900 dark:text-neutral-100/65 dark:hover:text-neutral-100"
              )}
            >
              <KeyRound className="size-3.5" />
              <span>3. Paste Key</span>
            </button>
          </div>

          {/* TAB 1: DEV WALLET (FASTEST FIRST) */}
          {authTab === "dev-wallet" && (
            <div className="mt-4 space-y-3.5 rounded-[18px] border border-neutral-900/10 bg-[var(--rb-n-100)] p-4 dark:border-neutral-100/10 dark:bg-neutral-900/80">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <SignerOrb3D
                    initials={callerProfile.initials}
                    handle={callerProfile.handle}
                    size="lg"
                    online
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-neutral-900 dark:text-neutral-100">
                        {callerProfile.handle}
                      </span>
                      <span className="rounded-full border border-emerald-600/35 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                        @mysten-incubation/dev-wallet v0.6.0
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-neutral-900/65 dark:text-neutral-100/65">
                      Sui Delegate:{" "}
                      <code>
                        {callerProfile.suiAddress.slice(0, 10)}…
                        {callerProfile.suiAddress.slice(-6)}
                      </code>{" "}
                      · Vault:{" "}
                      <code>
                        {config.accountId.slice(0, 10)}…
                        {config.accountId.slice(-6)}
                      </code>
                    </p>
                  </div>
                </div>
                <span className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  ~40ms · Gasless /sponsor
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    onQuickUnlockDevWallet();
                    setActionBanner(
                      `Unlocked shared team vault ${config.accountId.slice(0, 12)}… as ${callerProfile.handle} via Dev Wallet`
                    );
                  }}
                  className={cx(primaryButton, buttonMd, "w-full font-mono text-xs")}
                >
                  <Wallet className="size-4" />
                  <span>
                    {isAuthenticated
                      ? "Connected · Re-Sync Dev Wallet"
                      : "1-Click Unlock with Dev Wallet"}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={provisioning}
                  onClick={handleProvisionNewDevWallet}
                  className={cx(secondaryButton, buttonMd, "w-full font-mono text-xs")}
                >
                  <RefreshCw
                    className={cx("size-3.5", provisioning && "animate-spin")}
                  />
                  <span>
                    {provisioning
                      ? "Sponsoring on Sui Mainnet..."
                      : "+ New Gasless Account (/sponsor)"}
                  </span>
                </button>
              </div>

              <p className="font-mono text-[11px] text-neutral-900/65 dark:text-neutral-100/65">
                Why fastest first: No OAuth popups or client IDs needed. Generates an
                Ed25519 delegate keypair and dual-signs via{" "}
                <code>relayer.memory.walrus.xyz/sponsor</code>.
              </p>
            </div>
          )}

          {/* TAB 2: ENOKI PORTAL (ZKLOGIN GOOGLE / GITHUB OAUTH) */}
          {authTab === "enoki" && (
            <div className="mt-4 space-y-3.5 rounded-[18px] border border-neutral-900/10 bg-[var(--rb-n-100)] p-4 dark:border-neutral-100/10 dark:bg-neutral-900/80">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="font-mono text-xs font-extrabold text-neutral-900 dark:text-neutral-100">
                    Mysten Enoki Portal · Zero-Knowledge Login (zkLogin)
                  </span>
                  <p className="mt-0.5 text-xs text-neutral-900/65 dark:text-neutral-100/65">
                    Best for teammates who prefer Google or GitHub sign-in without
                    managing raw Sui private keys.
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-blue-600/35 bg-blue-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-blue-800 dark:text-blue-300">
                  Enoki Salt + ZK Proof
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleEnokiSignIn("google")}
                  className={cx(primaryButton, buttonMd, "w-full font-mono text-xs")}
                >
                  <GoogleMark className="size-4 shrink-0" />
                  <span>Continue with Google (Enoki)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleEnokiSignIn("github")}
                  className={cx(secondaryButton, buttonMd, "w-full font-mono text-xs")}
                >
                  <HugeiconsIcon
                    icon={GithubIcon}
                    size={16}
                    strokeWidth={2.0}
                    aria-hidden="true"
                    className="shrink-0"
                  />
                  <span>Continue with GitHub (Enoki)</span>
                </button>
              </div>

              <div className="rounded-[12px] border border-neutral-900/10 bg-white px-3 py-2 font-mono text-[11px] text-neutral-900/75 dark:border-neutral-100/10 dark:bg-neutral-950 dark:text-neutral-100/75">
                {enokiProvider ? (
                  <span>
                    ✓ Enoki zkLogin ({enokiProvider.toUpperCase()}) active · Ephemeral
                    session key authorized on vault{" "}
                    <code>{config.accountId.slice(0, 12)}…</code>
                  </span>
                ) : (
                  <span>
                    Flow: OAuth JWT → Enoki Salt Server → ZK Prover → Ephemeral
                    DelegateKey authorized on <code>MemWalAccount</code>.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MANUAL KEY / CUSTOM VAULT FORM */}
          {authTab === "manual" && (
            <form
              onSubmit={onSubmitAuth}
              noValidate
              className="mt-4 space-y-3 rounded-[18px] border border-neutral-900/10 bg-[var(--rb-n-100)] p-4 dark:border-neutral-100/10 dark:bg-neutral-900/80"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label htmlFor={accountInputId} className={fieldLabel}>
                    1. Account ID (0x...)
                  </label>
                  <div className={cx(inputBox, fieldMd)}>
                    <input
                      id={accountInputId}
                      type="text"
                      value={config.accountId}
                      onChange={(e) =>
                        onChangeConfig({ ...config, accountId: e.target.value })
                      }
                      placeholder="0x52ada02a... (MemWalAccount)"
                      className={inputControl}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor={keyInputId} className={fieldLabel}>
                    2. Delegate Key (suiprivkey1 / hex)
                  </label>
                  <div className={cx(inputBox, fieldMd)}>
                    <input
                      id={keyInputId}
                      type={revealKey ? "text" : "password"}
                      value={config.delegateKey}
                      onChange={(e) =>
                        onChangeConfig({ ...config, delegateKey: e.target.value })
                      }
                      placeholder="suiprivkey1... or 64-char hex"
                      className={inputControl}
                    />
                    <span data-affix className={inputAffix}>
                      <button
                        type="button"
                        onClick={() => setRevealKey((v) => !v)}
                        aria-label={
                          revealKey ? "Hide delegate key" : "Show delegate key"
                        }
                        className={cx(ghostButton, iconButtonXs)}
                      >
                        <HugeiconsIcon
                          icon={revealKey ? ViewOffSlashIcon : ViewIcon}
                          size={15}
                          strokeWidth={2.0}
                          aria-hidden="true"
                        />
                      </button>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor={nsInputId} className={fieldLabel}>
                  3. Namespace List (comma-separated folders)
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className={cx(inputBox, fieldMd, "flex-1")}>
                    <input
                      id={nsInputId}
                      type="text"
                      value={namespaceListInput}
                      onChange={(e) => onChangeNamespaceListInput(e.target.value)}
                      placeholder="memwal-team-skills, design-skills"
                      className={inputControl}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={authLoading}
                    className={cx(primaryButton, buttonMd, "font-mono text-xs")}
                  >
                    <Unlock className="size-3.5" />
                    <span>{isAuthenticated ? "Sync Vault" : "Unlock Vault"}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Bottom Status Banner & Quick Workbench Link */}
        <div className={cx(ruleTop, "mt-5 flex flex-wrap items-center justify-between gap-2 pt-4")}>
          <div className="flex items-center gap-2 font-mono text-xs text-neutral-900/75 dark:text-neutral-100/75">
            <ShieldCheck className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="truncate">
              {actionBanner ||
                authStatusMsg ||
                `Active Vault: ${config.accountId.slice(0, 12)}… · Namespace: ${config.namespace}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate("/eval")}
              className="inline-flex cursor-pointer items-center gap-1 font-mono text-xs font-extrabold text-emerald-700 underline decoration-2 underline-offset-4 hover:opacity-80 dark:text-emerald-300"
            >
              <span>Go to /eval Trajectory</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================================
          RIGHT COLUMN: 1-CLICK COPY ONBOARDING FOR NEW USERS (SORBET ONBOARDING)
         ==================================================================== */}
      <aside
        className={cx(
          greyFrame,
          "flex w-full shrink-0 flex-col justify-between border-t border-neutral-900/10 px-6 py-6 sm:px-8 sm:py-7 lg:w-[46%] lg:border-t-0 lg:border-l dark:border-neutral-100/10"
        )}
      >
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className={cx(typeCaption, text3, "font-mono uppercase")}>
              STEP 2 · 1-CLICK COPY ONBOARDING
            </span>
            <span className="rounded-full border border-neutral-900/12 bg-white px-2.5 py-0.5 font-mono text-[11px] font-bold text-neutral-900 dark:border-neutral-100/12 dark:bg-neutral-950 dark:text-neutral-100">
              @mysten-incubation/memwal-mcp
            </span>
          </div>

          {/* 3-Step Onboarding Progress Pills (from onboarding-2-sorbet) */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="flex items-center gap-2 rounded-[12px] border border-neutral-900/8 bg-white px-2.5 py-2 dark:border-neutral-100/8 dark:bg-neutral-950">
              <span className={cx(stepIndicator, isAuthenticated ? stepDone : stepCurrent)}>
                {isAuthenticated ? (
                  <HugeiconsIcon icon={Tick02Icon} size={13} strokeWidth={3} />
                ) : (
                  "1"
                )}
              </span>
              <span className="truncate font-mono text-[11px] font-bold">
                1. Auth Vault
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-[12px] border border-neutral-900/8 bg-white px-2.5 py-2 dark:border-neutral-100/8 dark:bg-neutral-950">
              <span className={cx(stepIndicator, copied ? stepDone : stepCurrent)}>
                {copied ? (
                  <HugeiconsIcon icon={Tick02Icon} size={13} strokeWidth={3} />
                ) : (
                  "2"
                )}
              </span>
              <span className="truncate font-mono text-[11px] font-bold">
                2. Copy Config
              </span>
            </div>

            <button
              type="button"
              onClick={() => onNavigate("/eval")}
              className="flex cursor-pointer items-center gap-2 rounded-[12px] border border-neutral-900/8 bg-white px-2.5 py-2 text-left transition hover:border-emerald-500/50 dark:border-neutral-100/8 dark:bg-neutral-950"
            >
              <span className={cx(stepIndicator, stepCurrent)}>3</span>
              <span className="truncate font-mono text-[11px] font-bold underline decoration-dotted">
                3. Run /eval →
              </span>
            </button>
          </div>

          {/* Copy Format Selector (1-Line CLI vs .mcp.json vs Agent Prompt) */}
          <div className="mt-4 rounded-[18px] border border-neutral-900/10 bg-white p-4 shadow-2xs dark:border-neutral-100/10 dark:bg-neutral-950">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={cx(typeLabel, text1, "flex items-center gap-1.5")}>
                <Terminal className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span>Copy for your coding agent</span>
              </span>

              <div className="inline-flex rounded-[10px] border border-neutral-900/10 bg-[var(--rb-n-100)] p-0.5 font-mono text-[11px] font-bold dark:border-neutral-100/10 dark:bg-neutral-900">
                <button
                  type="button"
                  onClick={() => setCopyFormat("cli")}
                  className={cx(
                    "cursor-pointer rounded-[8px] px-2.5 py-1 transition",
                    copyFormat === "cli"
                      ? "bg-white text-neutral-900 shadow-2xs dark:bg-neutral-800 dark:text-neutral-100"
                      : "text-neutral-900/60 dark:text-neutral-100/60"
                  )}
                >
                  1-Line CLI
                </button>
                <button
                  type="button"
                  onClick={() => setCopyFormat("mcp-json")}
                  className={cx(
                    "cursor-pointer rounded-[8px] px-2.5 py-1 transition",
                    copyFormat === "mcp-json"
                      ? "bg-white text-neutral-900 shadow-2xs dark:bg-neutral-800 dark:text-neutral-100"
                      : "text-neutral-900/60 dark:text-neutral-100/60"
                  )}
                >
                  .mcp.json
                </button>
                <button
                  type="button"
                  onClick={() => setCopyFormat("prompt")}
                  className={cx(
                    "cursor-pointer rounded-[8px] px-2.5 py-1 transition",
                    copyFormat === "prompt"
                      ? "bg-white text-neutral-900 shadow-2xs dark:bg-neutral-800 dark:text-neutral-100"
                      : "text-neutral-900/60 dark:text-neutral-100/60"
                  )}
                >
                  Agent Prompt
                </button>
              </div>
            </div>

            <p className={cx(typeBodySm, text3, "mt-1")}>
              {copyFormat === "cli"
                ? "Run once in your terminal for Claude Code / Codex:"
                : copyFormat === "mcp-json"
                  ? "Paste into .mcp.json for Cursor, Windsurf, or Antigravity:"
                  : "Paste into your coding agent to recall team Flow Memories:"}
            </p>

            <pre className="mt-2.5 max-h-[150px] overflow-x-auto overflow-y-auto rounded-[12px] border border-neutral-900/10 bg-[var(--rb-n-100)] p-3 font-mono text-[11.5px] leading-relaxed text-neutral-900 dark:border-neutral-100/10 dark:bg-neutral-900 dark:text-neutral-100">
              <code>{activeDisplayPreview}</code>
            </pre>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopySnippet}
                className={cx(primaryButton, buttonMd, "flex-1 font-mono text-xs")}
              >
                {copied ? (
                  <>
                    <Check className="size-4" />
                    <span>Copied to Clipboard ✓</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-4" />
                    <span>
                      {copyFormat === "cli"
                        ? "Copy 1-Line CLI Command"
                        : copyFormat === "mcp-json"
                          ? "Copy .mcp.json Config"
                          : "Copy Agent Prompt"}
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onNavigate("/graph")}
                className={cx(secondaryButton, buttonMd, "font-mono text-xs")}
              >
                <span>Explore /graph</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom 3-Metric Sorbet Stat Group */}
        <div className={cx(statGroup, "mt-4 grid grid-cols-3 gap-1")}>
          <div className={statCell}>
            <p className={statValueSm}>~40ms</p>
            <p className={statLabel}>Dev Wallet Auth</p>
          </div>
          <div className={statCell}>
            <p className={statValueSm}>{skillsCount}</p>
            <p className={statLabel}>Shared Skills</p>
          </div>
          <div className={statCell}>
            <p className={statValueSm}>{flowsCount}</p>
            <p className={statLabel}>Flow Memories</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
