"use client";

import React, { useCallback, useEffect, useId, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import type { WalrusConnectionConfig } from "../types";
import {
  CONTRACT_IMPLEMENTATION_PLAN,
  type ContractFaultSimulationMode,
  FULL_MOVE_CONTRACT_SOURCE,
  FULL_TS_PTB_SOURCE,
  type OnChainDelegateMember,
  type SmartContractVerificationResult,
  verifyDelegateAndNamespaceContract,
} from "../lib/contractVerifier";
import {
  addRealDelegateKeyOnChain,
  getEnvOwnerCredentials,
  provisionNewDevWalletAccountOnChain,
  removeRealDelegateKeyOnChain,
  type OnChainDelegateKeyEntry,
} from "../lib/memwalBridge";
import { DitherButton } from "./dithercn/dither-button";
import { SignerOrb3D } from "./ui/walrus-3d-icons";
import ToolCalls6, {
  canvas,
  captionText,
  codeName,
  cx,
  detailText,
  disclosureCaret,
  disclosureRow,
  jsonText,
  pageTitle,
  panel,
  panelBody,
  rowsRuled,
  secondaryButton,
  SorbetActiveRequest,
  SorbetSettledLine,
  SorbetSwitch,
  stepGlyph,
  text1,
  toolWell,
  type StepItem,
  type StepStatus,
} from "./sorbet/SorbetToolPermissions";

interface NamespacePresenceCardProps {
  config: WalrusConnectionConfig;
  availableNamespaces: string[];
  isAuthenticated: boolean;
  onSelectNamespace?: (ns: string) => void;
  onQuickUnlockDemo?: () => void;
  onProvisionedAccount?: (next: Partial<WalrusConnectionConfig>) => void;
}

const AVATAR_GRADIENTS: [string, string, string][] = [
  ["#dcfce7", "#bbf7d0", "#14532d"],
  ["#dbeafe", "#bfdbfe", "#1e3a8a"],
  ["#fef3c7", "#fde68a", "#78350f"],
  ["#f3e8ff", "#e9d5ff", "#581c87"],
  ["#e2e8f0", "#cbd5e1", "#0f172a"],
];

function initialsFromLabel(label: string, idx: number): string {
  const cleaned = label.replace(/^@/, "").trim();
  if (!cleaned) return `D${idx + 1}`;
  const parts = cleaned.split(/[\s·_-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}

function mapOnChainEntryToMember(
  entry: OnChainDelegateKeyEntry,
  idx: number,
  namespaces: string[],
  connectedSuiAddress?: string
): OnChainDelegateMember {
  const handlePart = entry.label.split("·")[0]?.trim() || `@delegate-${idx + 1}`;
  const roleLabel =
    entry.label.split("·")[1]?.trim() || "On-Chain Delegate Key";
  const isCurrent =
    Boolean(connectedSuiAddress) &&
    entry.suiAddress.toLowerCase() === connectedSuiAddress?.toLowerCase();

  return {
    id: `onchain-${entry.suiAddress}-${idx}`,
    handle: handlePart.startsWith("@") ? handlePart : `@${handlePart}`,
    label: roleLabel,
    role: idx === 0 ? "owner" : "delegate",
    suiAddress: entry.suiAddress,
    publicKeyHex: entry.publicKeyHex,
    namespaces,
    status: "online",
    avatarGradient: AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length],
    initials: initialsFromLabel(handlePart, idx),
    isCurrentUser: isCurrent || idx === 0,
  };
}

const FALLBACK_DELEGATE_POOL: Omit<OnChainDelegateMember, "namespaces">[] = [
  {
    id: "del-1",
    handle: "@harrymove-ctrl",
    label: "Primary Agent (On-Chain Delegate)",
    role: "owner",
    suiAddress:
      "0x649ea1b580142c91582283108764a50b73423432fa48aefeb01881b6af454be1",
    publicKeyHex:
      "68423c5a909df878941fc363970172c05e13dfce583aed7ebab35b9390ce82f6",
    status: "online",
    avatarGradient: ["#dcfce7", "#bbf7d0", "#14532d"],
    initials: "HM",
    isCurrentUser: true,
  },
  {
    id: "del-2",
    handle: "@teammate-dev",
    label: "Relayer & Rust Engineer",
    role: "delegate",
    suiAddress:
      "0x6a7df26b80c9b9c2d6339a05640151f468644764373902e3b879f2182a0f0587",
    publicKeyHex:
      "fde66b9fc1f03fe3949c7fb10c65913bf8c7f7c9b9f01776dd6ddbe9c97b32dc",
    status: "online",
    avatarGradient: ["#dbeafe", "#bfdbfe", "#1e3a8a"],
    initials: "TD",
  },
  {
    id: "del-3",
    handle: "@teammate-qa",
    label: "QA & Dev-Wallet Verifier",
    role: "delegate",
    suiAddress:
      "0xaa692d042dcd39a34f747cd0de60c56ea47fae7c4307139ceff813e1ea94445d",
    publicKeyHex:
      "a1db334fd3d085bf48cb2209899fc8fd0e1ab46a7d39758d21821dc101df9911",
    status: "online",
    avatarGradient: ["#fef3c7", "#fde68a", "#78350f"],
    initials: "TQ",
  },
];

export const NamespacePresenceCard: React.FC<NamespacePresenceCardProps> = ({
  config,
  availableNamespaces,
  isAuthenticated,
  onSelectNamespace,
  onQuickUnlockDemo,
  onProvisionedAccount,
}) => {
  const uid = useId();
  const envOwner = useMemo(() => getEnvOwnerCredentials(), []);
  const [ownerSecretKey, setOwnerSecretKey] = useState<string>(
    () => envOwner.ownerSecretKey
  );
  const [lastTxDigest, setLastTxDigest] = useState<string>(
    () => envOwner.addKeysTxDigest.split(",")[0] || envOwner.createTxDigest
  );
  const [txBusy, setTxBusy] = useState<string | null>(null);
  const [txStatusMessage, setTxStatusMessage] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState<number>(0);

  const [delegates, setDelegates] = useState<OnChainDelegateMember[]>(() =>
    FALLBACK_DELEGATE_POOL.map((d) => ({
      ...d,
      namespaces:
        availableNamespaces.length > 0
          ? availableNamespaces
          : ["memwal-team-skills", "design-skills"],
    }))
  );
  const [onChainRawKeys, setOnChainRawKeys] = useState<
    OnChainDelegateKeyEntry[]
  >([]);
  const [verification, setVerification] =
    useState<SmartContractVerificationResult | null>(null);
  const [accessCounterVersion, setAccessCounterVersion] = useState<number>(0);
  const [faultMode, setFaultMode] =
    useState<ContractFaultSimulationMode>("none");

  const [phaseStatuses, setPhaseStatuses] = useState<
    Record<string, StepStatus>
  >({
    "PHASE 01": "approved",
    "PHASE 02": "approved",
    "PHASE 03": "pending",
    "PHASE 04": "pending",
    "PHASE 05": "pending",
  });

  const [showMoveSource, setShowMoveSource] = useState(false);
  const [showPtbSource, setShowPtbSource] = useState(false);
  const [showOnChainRoster, setShowOnChainRoster] = useState(true);

  const nsList = useMemo(
    () =>
      availableNamespaces.length > 0
        ? availableNamespaces
        : ["memwal-team-skills", "design-skills"],
    [availableNamespaces]
  );

  // Run real Sui Mainnet contract verification via SuiGrpcClient
  useEffect(() => {
    let cancelled = false;
    verifyDelegateAndNamespaceContract(
      config,
      nsList,
      delegates,
      accessCounterVersion,
      faultMode
    ).then((res) => {
      if (cancelled) return;
      setVerification(res);
      if (res.onChainAccount) {
        setAccessCounterVersion(res.onChainAccount.accessCounterVersion);
        setOnChainRawKeys(res.onChainAccount.delegateKeys);
        if (res.onChainAccount.delegateKeys.length > 0) {
          setDelegates(
            res.onChainAccount.delegateKeys.map((entry, idx) =>
              mapOnChainEntryToMember(
                entry,
                idx,
                nsList,
                res.connectedAddress
              )
            )
          );
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [
    config,
    nsList,
    accessCounterVersion,
    faultMode,
    refreshNonce,
  ]);

  // Execute a REAL sponsored add_delegate_key transaction on relayer.memory.walrus.xyz
  const handleSomeoneJoins = useCallback(async () => {
    if (txBusy) return;
    if (ownerSecretKey && config.accountId.startsWith("0x")) {
      setTxBusy("join");
      setTxStatusMessage(
        "Sponsoring add_delegate_key on relayer.memory.walrus.xyz (/sponsor -> /sponsor/execute)..."
      );
      try {
        const nextHandle = `@agent-worker-${delegates.length + 1} · DevWallet Delegate`;
        const added = await addRealDelegateKeyOnChain({
          accountId: config.accountId,
          ownerSecretKey,
          label: nextHandle,
          serverUrl: config.serverUrl,
        });
        setLastTxDigest(added.digest);
        setTxStatusMessage(
          `Added real on-chain DelegateKey (${added.delegateSuiAddress.slice(0, 10)}...) · Tx ${added.digest}`
        );
        setTimeout(() => setRefreshNonce((n) => n + 1), 1500);
      } catch (err) {
        setTxStatusMessage(
          `On-chain add_delegate_key error: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setTxBusy(null);
      }
      return;
    }

    // Fallback if no ownerSecretKey configured
    setTxStatusMessage(
      "Provisioning new DevWallet owner + MemWalAccount on relayer.memory.walrus.xyz..."
    );
    setTxBusy("provision");
    try {
      const prov = await provisionNewDevWalletAccountOnChain({
        serverUrl: config.serverUrl,
        memberHandle: config.memberHandle || "@harrymove-ctrl",
      });
      setOwnerSecretKey(prov.ownerSecretKey);
      setLastTxDigest(prov.addKeyDigest);
      onProvisionedAccount?.({
        accountId: prov.accountId,
        delegateKey: prov.delegateKey,
        memberHandle: config.memberHandle || "@harrymove-ctrl",
      });
      setTxStatusMessage(
        `Provisioned real MemWalAccount ${prov.accountId.slice(0, 10)}... · Tx ${prov.addKeyDigest}`
      );
      setTimeout(() => setRefreshNonce((n) => n + 1), 1500);
    } catch (err) {
      setTxStatusMessage(
        `Provisioning error: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setTxBusy(null);
    }
  }, [
    txBusy,
    ownerSecretKey,
    config.accountId,
    config.serverUrl,
    config.memberHandle,
    delegates.length,
    onProvisionedAccount,
  ]);

  // Execute a REAL sponsored remove_delegate_key transaction on relayer.memory.walrus.xyz
  const handleSomeoneLeaves = useCallback(async () => {
    if (txBusy) return;
    if (
      ownerSecretKey &&
      config.accountId.startsWith("0x") &&
      onChainRawKeys.length > 1
    ) {
      const targetKey = onChainRawKeys[onChainRawKeys.length - 1];
      setTxBusy("revoke");
      setTxStatusMessage(
        `Sponsoring remove_delegate_key (${targetKey.label}) on relayer.memory.walrus.xyz...`
      );
      try {
        const removed = await removeRealDelegateKeyOnChain({
          accountId: config.accountId,
          ownerSecretKey,
          publicKey: targetKey.publicKeyBytes,
          serverUrl: config.serverUrl,
        });
        setLastTxDigest(removed.digest);
        setAccessCounterVersion((v) => v + 1);
        setTxStatusMessage(
          `Revoked ${targetKey.label} on-chain & bumped SEAL access_counter_version · Tx ${removed.digest}`
        );
        setTimeout(() => setRefreshNonce((n) => n + 1), 1500);
      } catch (err) {
        setTxStatusMessage(
          `On-chain remove_delegate_key error: ${err instanceof Error ? err.message : String(err)}`
        );
      } finally {
        setTxBusy(null);
      }
      return;
    }

    if (delegates.length <= 1) return;
    setDelegates((prev) => prev.slice(0, -1));
    setAccessCounterVersion((v) => v + 1);
  }, [
    txBusy,
    ownerSecretKey,
    config.accountId,
    config.serverUrl,
    onChainRawKeys,
    delegates.length,
  ]);

  // Convert the 4 Move Contract Gates into compact Sorbet StepItems
  const gateSteps: StepItem[] = useMemo(() => {
    if (!verification) return [];
    return verification.gates.map((gate) => ({
      id: gate.id,
      tool: gate.code.toLowerCase().replace(/\s+/g, "_"),
      sentence: `${gate.title}: \`${gate.actualValue}\``,
      rawInput: `Move Call: ${gate.moveCall}\nInvariant: ${gate.formula}\nEvaluated: ${gate.actualValue}`,
      markdownDetail: [
        `- **Move Call:** \`${gate.moveCall}\``,
        `- **Invariant:** \`${gate.formula}\``,
        `- **Live Result:** \`${gate.actualValue}\``,
        `- **Verification Mode:** \`${verification.mode}\` (\`MemWalAccount ${verification.accountId}\`)`,
      ].join("\n"),
      status: gate.passed ? "approved" : "pending",
      auto: gate.passed,
      approveLabel: "Reset abort & verify",
      rejectLabel: "Keep abort",
      settledRightLabel:
        verification.mode === "on-chain-rpc"
          ? "Verified on Sui Mainnet"
          : "Verified on-chain",
    }));
  }, [verification]);

  // Convert the 5 Implementation Phases into compact Sorbet StepItems
  const phaseSteps: StepItem[] = useMemo(() => {
    return CONTRACT_IMPLEMENTATION_PLAN.map((step, idx) => ({
      id: step.phase,
      tool: `phase_0${idx + 1}`,
      sentence: `${step.title} (\`${step.gateRef}\`)`,
      rawInput: step.cliOrSdkCommand,
      markdownDetail: [
        step.summary,
        ...step.deliverables.map((d) => `- ${d}`),
        `\`\`\`bash\n${step.cliOrSdkCommand}\n\`\`\``,
      ].join("\n\n"),
      status: phaseStatuses[step.phase] ?? "pending",
      auto: idx < 2,
      approveLabel: "Complete phase",
      rejectLabel: "Skip phase",
    }));
  }, [phaseStatuses]);

  const pendingPhases = phaseSteps.filter((p) => p.status === "pending");
  const activePhaseId = pendingPhases[0]?.id;

  const isLiveOnChain = verification?.mode === "on-chain-rpc";

  return (
    <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* LEFT 7 COLS: Step-by-Step Move 2024 4-Gate Guard + 5-Phase Implementation Plan */}
      <div
        className={cx(
          canvas,
          text1,
          "relative isolate flex flex-col overflow-hidden rounded-[calc(var(--rb-r-6xl,26px))] border border-neutral-900/10 pb-4 lg:col-span-7 dark:border-neutral-100/10"
        )}
      >
        {/* Header */}
        <header className="mx-4 mt-4 mb-1 flex flex-wrap items-center justify-between gap-3 sm:mx-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className={pageTitle}>Move 2024 namespace guard</h2>
            <span className="rounded-full bg-neutral-900/6 px-2.5 py-0.5 font-mono text-[11px] font-bold text-neutral-900/75 dark:bg-neutral-100/10 dark:text-neutral-100/80">
              {config.namespace || "memwal-team-skills"}
            </span>
            <span
              className={cx(
                "rounded-full px-2.5 py-0.5 font-mono text-[10.5px] font-bold uppercase",
                isLiveOnChain
                  ? "bg-emerald-500/15 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300"
                  : "bg-amber-500/15 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300"
              )}
            >
              {isLiveOnChain
                ? "LIVE SUI MAINNET · gRPC"
                : "CHECKING SUI MAINNET..."}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className={captionText}>
              SEAL v{verification?.accessCounterVersion ?? accessCounterVersion}
            </span>
            <button
              type="button"
              onClick={() => setRefreshNonce((n) => n + 1)}
              className={cx(
                secondaryButton,
                "h-7 rounded-full px-2.5 font-mono text-[11px] font-bold"
              )}
              title="Re-query MemWalAccount on Sui Mainnet via SuiGrpcClient"
            >
              Sync RPC
            </button>
            {!isAuthenticated && onQuickUnlockDemo && (
              <DitherButton
                size="sm"
                color="green"
                fill="gradient"
                onClick={onQuickUnlockDemo}
                className="h-7 rounded-full px-3 text-[11px] font-bold"
              >
                Connect live dev delegate
              </DitherButton>
            )}
          </div>
        </header>

        {/* Compact Active Delegate Roster Bar (Live On-Chain MemWalAccount.delegate_keys) */}
        <section className="mx-4 mt-2 sm:mx-5">
          <div className={panel}>
            <div
              className={cx(
                panelBody,
                "mt-1 flex flex-col gap-2.5 px-3.5 py-3"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center -space-x-1.5">
                    <AnimatePresence initial={false} mode="popLayout">
                      {delegates.map((member) => (
                        <motion.div
                          key={member.id}
                          layout
                          initial={{ opacity: 0, scale: 0.7 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.7 }}
                          title={`${member.handle} (${member.label}) — ${member.suiAddress}`}
                          className="relative"
                        >
                          <SignerOrb3D
                            initials={member.initials}
                            handle={member.handle}
                            size="md"
                            online={member.status === "online"}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-[13px] font-bold text-neutral-900 dark:text-neutral-100">
                        {delegates.length} authorized delegates
                      </p>
                      <span className="rounded bg-emerald-500/12 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300">
                        on-chain MemWalAccount
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-neutral-900/65 dark:text-neutral-100/65">
                      {config.memberHandle || "@harrymove-ctrl"} ·{" "}
                      {verification?.connectedAddress
                        ? `${verification.connectedAddress.slice(0, 10)}...${verification.connectedAddress.slice(-6)}`
                        : "0x..."}{" "}
                      · Account{" "}
                      <span className="font-bold text-neutral-900 dark:text-neutral-100">
                        {config.accountId.slice(0, 10)}...
                        {config.accountId.slice(-6)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {availableNamespaces.map((ns) => (
                    <button
                      key={ns}
                      type="button"
                      onClick={() => onSelectNamespace?.(ns)}
                      className={cx(
                        "rounded-full px-2.5 py-1 font-mono text-[11px] font-bold transition-colors",
                        config.namespace === ns
                          ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950"
                          : "bg-neutral-900/6 text-neutral-900/75 hover:bg-neutral-900/12 dark:bg-neutral-100/10 dark:text-neutral-100/75"
                      )}
                    >
                      {ns}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={Boolean(txBusy)}
                    onClick={handleSomeoneJoins}
                    title="Execute real gasless add_delegate_key via /sponsor on relayer.memory.walrus.xyz"
                    className={cx(
                      secondaryButton,
                      "h-7 rounded-full px-2.5 text-[11.5px] font-bold"
                    )}
                  >
                    {txBusy === "join"
                      ? "Sponsoring..."
                      : "+ Join (On-Chain)"}
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(txBusy) || delegates.length <= 1}
                    onClick={handleSomeoneLeaves}
                    title="Execute real gasless remove_delegate_key via /sponsor on relayer.memory.walrus.xyz"
                    className={cx(
                      secondaryButton,
                      "h-7 rounded-full px-2.5 text-[11.5px] font-bold"
                    )}
                  >
                    {txBusy === "revoke"
                      ? "Revoking..."
                      : "- Revoke (On-Chain)"}
                  </button>
                </div>
              </div>

              {/* Live On-Chain Metadata & Delegate Key Vector Inspector */}
              <div className="border-t border-neutral-900/8 pt-2 dark:border-neutral-100/8">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="font-mono text-neutral-900/65 dark:text-neutral-100/65">
                    Owner:{" "}
                    <strong className="text-neutral-900 dark:text-neutral-100">
                      {verification?.ownerAddress
                        ? `${verification.ownerAddress.slice(0, 10)}...${verification.ownerAddress.slice(-6)}`
                        : "0x8a2572a9...ee124"}
                    </strong>{" "}
                    · Last Sponsored Tx:{" "}
                    <strong className="text-emerald-700 dark:text-emerald-400">
                      {lastTxDigest.slice(0, 14)}...
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowOnChainRoster((v) => !v)}
                    className="font-mono text-[11px] font-bold text-neutral-900/70 underline decoration-dotted underline-offset-2 hover:text-neutral-900 dark:text-neutral-100/70 dark:hover:text-neutral-100"
                  >
                    {showOnChainRoster
                      ? "Hide on-chain delegate_keys"
                      : "Show on-chain delegate_keys"}
                  </button>
                </div>

                {txStatusMessage && (
                  <p className="mt-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-emerald-900 dark:bg-emerald-400/10 dark:text-emerald-200">
                    {txStatusMessage}
                  </p>
                )}

                {showOnChainRoster && (
                  <ul className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                    {delegates.map((d, idx) => (
                      <li
                        key={d.id}
                        className="rounded-xl border border-neutral-900/8 bg-neutral-900/[0.02] px-2.5 py-1.5 font-mono text-[11px] dark:border-neutral-100/10 dark:bg-neutral-100/[0.03]"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate font-bold text-neutral-900 dark:text-neutral-100">
                            {d.handle}
                          </span>
                          <span className="rounded bg-neutral-900/8 px-1.5 py-0.2 text-[9.5px] font-bold uppercase dark:bg-neutral-100/12">
                            slot #{idx}
                          </span>
                        </div>
                        <p className="truncate text-[10px] text-neutral-900/60 dark:text-neutral-100/60">
                          {d.label}
                        </p>
                        <p
                          className="mt-0.5 truncate text-[10px] text-emerald-700 dark:text-emerald-400"
                          title={d.suiAddress}
                        >
                          addr: {d.suiAddress.slice(0, 10)}...
                          {d.suiAddress.slice(-6)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Section 1: 4-Gate On-Chain Verification Queue (Step-by-Step Settled/Active Lines) */}
        <section>
          <div className="flex items-center justify-between px-4 pt-4 pb-1.5 sm:px-5">
            <h3 className={captionText}>
              On-chain verification gates (
              {gateSteps.filter((g) => g.status === "approved").length}/4
              passed)
            </h3>
            <span className={captionText}>
              {verification?.verified
                ? "All gates verified on Sui Mainnet"
                : verification?.abortReason || "Abort triggered"}
            </span>
          </div>

          <div className={cx(panel, "mx-4 sm:mx-5")}>
            <ul className={cx(panelBody, rowsRuled, "mt-1")}>
              {gateSteps.map((gate) => (
                <li key={gate.id}>
                  {gate.status === "pending" ? (
                    <SorbetActiveRequest
                      request={gate}
                      actionable={true}
                      disclosureText="View Move call & invariant"
                      onDecide={(approved) => {
                        if (approved) setFaultMode("none");
                      }}
                    />
                  ) : (
                    <SorbetSettledLine request={gate} />
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Section 2: Contract Fault Simulation Switches */}
        <section>
          <h3 className={cx(captionText, "px-4 pt-4 pb-1.5 sm:px-5")}>
            Contract guard switches
          </h3>
          <div className={cx(panel, "mx-4 sm:mx-5")}>
            <ul className={cx(panelBody, rowsRuled, "mt-1")}>
              {[
                {
                  id: "unregistered-delegate" as const,
                  tool: "simulate_abort_201",
                  scope:
                    "Trigger EDelegateNotAuthorizedOnAccount (201) on Gate 2",
                },
                {
                  id: "namespace-mismatch" as const,
                  tool: "simulate_abort_203",
                  scope:
                    "Trigger EDelegateNamespaceMismatch (203) on Gate 3",
                },
                {
                  id: "stale-seal-counter" as const,
                  tool: "simulate_abort_206",
                  scope: "Trigger EStaleAccessCounter (206) on Gate 4",
                },
              ].map((item) => {
                const labelId = `${uid}-fault-${item.id}`;
                const isOn = faultMode === item.id;
                return (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-4 px-3.5 py-2.5"
                  >
                    <div className="min-w-0">
                      <p id={labelId} className={codeName}>
                        {item.tool}
                      </p>
                      <p className={cx(detailText, "mt-0.5 truncate")}>
                        {item.scope}
                      </p>
                    </div>
                    <SorbetSwitch
                      on={isOn}
                      labelId={labelId}
                      onToggle={() =>
                        setFaultMode((prev) =>
                          prev === item.id ? "none" : item.id
                        )
                      }
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Section 3: Step-by-Step 5-Phase Implementation Plan */}
        <section>
          <div className="flex items-center justify-between px-4 pt-4 pb-1.5 sm:px-5">
            <h3 className={captionText}>
              Implementation plan ({5 - pendingPhases.length}/5 phases)
            </h3>
            {pendingPhases.length > 0 ? (
              <button
                type="button"
                onClick={() =>
                  setPhaseStatuses({
                    "PHASE 01": "approved",
                    "PHASE 02": "approved",
                    "PHASE 03": "approved",
                    "PHASE 04": "approved",
                    "PHASE 05": "approved",
                  })
                }
                className="rounded-full px-2 py-0.5 text-[12px] font-bold text-neutral-900/60 hover:bg-neutral-900/6 hover:text-neutral-900 dark:text-neutral-100/60 dark:hover:bg-neutral-100/10 dark:hover:text-neutral-100"
              >
                Approve all phases
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setPhaseStatuses({
                    "PHASE 01": "approved",
                    "PHASE 02": "approved",
                    "PHASE 03": "pending",
                    "PHASE 04": "pending",
                    "PHASE 05": "pending",
                  })
                }
                className="rounded-full px-2 py-0.5 text-[12px] font-bold text-neutral-900/60 hover:bg-neutral-900/6 hover:text-neutral-900 dark:text-neutral-100/60 dark:hover:bg-neutral-100/10 dark:hover:text-neutral-100"
              >
                Reset phases
              </button>
            )}
          </div>

          <div className={cx(panel, "mx-4 sm:mx-5")}>
            <ul className={cx(panelBody, rowsRuled, "mt-1")}>
              {phaseSteps.map((phase) => (
                <li key={phase.id}>
                  {phase.status === "pending" ? (
                    <SorbetActiveRequest
                      request={phase}
                      actionable={phase.id === activePhaseId}
                      disclosureText="View deliverables & CLI"
                      onDecide={(approved) =>
                        setPhaseStatuses((prev) => ({
                          ...prev,
                          [phase.id]: approved ? "approved" : "denied",
                        }))
                      }
                    />
                  ) : (
                    <SorbetSettledLine
                      request={phase}
                      onReopen={() =>
                        setPhaseStatuses((prev) => ({
                          ...prev,
                          [phase.id]: "pending",
                        }))
                      }
                    />
                  )}
                </li>
              ))}

              {/* Compact Move 2024 Source & PTB Disclosures */}
              <li className="px-3.5 py-2.5">
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setShowMoveSource((v) => !v)}
                    aria-expanded={showMoveSource}
                    className={disclosureRow}
                  >
                    <span className={stepGlyph}>
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        size={14}
                        strokeWidth={2.0}
                        aria-hidden="true"
                        className={disclosureCaret}
                      />
                    </span>
                    View namespace_skill_vault.move
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPtbSource((v) => !v)}
                    aria-expanded={showPtbSource}
                    className={disclosureRow}
                  >
                    <span className={stepGlyph}>
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        size={14}
                        strokeWidth={2.0}
                        aria-hidden="true"
                        className={disclosureCaret}
                      />
                    </span>
                    View @mysten/sui PTB builder
                  </button>
                </div>

                {showMoveSource && (
                  <div className={cx(toolWell, "mt-2 max-h-64 overflow-y-auto")}>
                    <pre className={jsonText}>{FULL_MOVE_CONTRACT_SOURCE}</pre>
                  </div>
                )}

                {showPtbSource && (
                  <div className={cx(toolWell, "mt-2 max-h-64 overflow-y-auto")}>
                    <pre className={jsonText}>{FULL_TS_PTB_SOURCE}</pre>
                  </div>
                )}
              </li>
            </ul>
          </div>
        </section>
      </div>

      {/* RIGHT 5 COLS: Exact React Bits Pro Sorbet `ToolCalls6` (Tool permissions & requests) */}
      <div className="overflow-hidden rounded-[calc(var(--rb-r-6xl,26px))] border border-neutral-900/10 lg:col-span-5 dark:border-neutral-100/10">
        <ToolCalls6 config={config} />
      </div>
    </div>
  );
};
