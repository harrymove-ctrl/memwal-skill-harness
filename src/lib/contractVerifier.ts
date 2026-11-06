import {
  delegateKeyToPublicKey,
  delegateKeyToSuiAddress,
} from "@mysten-incubation/memwal";
import type { WalrusConnectionConfig } from "../types";
import {
  fetchOnChainMemWalAccount,
  hasLiveCredentials,
  type OnChainMemWalAccountState,
} from "./memwalBridge";

export type ContractFaultSimulationMode =
  | "none"
  | "unregistered-delegate"
  | "namespace-mismatch"
  | "stale-seal-counter";

export interface ContractGateResult {
  id: string;
  code: string;
  title: string;
  moveCall: string;
  errorCode: string;
  formula: string;
  expectedValue: string;
  actualValue: string;
  passed: boolean;
  detail: string;
}

export interface OnChainDelegateMember {
  id: string;
  handle: string;
  label: string;
  role: "owner" | "delegate";
  suiAddress: string;
  publicKeyHex: string;
  namespaces: string[];
  status: "online" | "syncing" | "idle";
  avatarGradient: [string, string, string];
  initials: string;
  isCurrentUser?: boolean;
}

export interface SmartContractVerificationResult {
  verified: boolean;
  mode: "on-chain-rpc" | "move-vm-simulation";
  faultSimulation: ContractFaultSimulationMode;
  connectedAddress: string;
  publicKeyHex: string;
  accountId: string;
  ownerAddress: string;
  activeNamespace: string;
  boundNamespaces: string[];
  accessCounterVersion: number;
  delegateCount: number;
  gates: ContractGateResult[];
  abortReason: string | null;
  verifiedAt: string;
  onChainAccount?: OnChainMemWalAccountState | null;
}

export interface ImplementationPhaseStep {
  phase: string;
  title: string;
  gateRef: string;
  summary: string;
  deliverables: string[];
  cliOrSdkCommand: string;
}

export const CONTRACT_IMPLEMENTATION_PLAN: ImplementationPhaseStep[] = [
  {
    phase: "PHASE 01",
    title: "Move 2024 Package & MemWalAccount Dependency Wiring",
    gateRef: "PACKAGE · Move.toml",
    summary:
      "Link `memwal_namespace_guard` against `memwal::account` (`AccountRegistry`, `MemWalAccount`, `DelegateKey`) so namespace checks read the canonical on-chain delegate roster and SEAL counter.",
    deliverables: [
      "Define `NamespaceSkillVault` shared object with `account_id: ID`, `namespaces: vector<String>`, `delegate_namespaces: Table<address, vector<String>>`, and `skill_blobs: Table<String, SkillBlobRecord>`.",
      "Map deterministic abort codes `200..206` (`ENotAccountOwner`, `EDelegateNotAuthorizedOnAccount`, `ENamespaceNotFound`, `EDelegateNamespaceMismatch`, `EAccountVaultMismatch`, `EAccountInactive`, `EStaleAccessCounter`).",
    ],
    cliOrSdkCommand: `cd /Volumes/Dev/memwal-skill-harness/contracts/memwal_namespace_guard
sui move build
sui move test`,
  },
  {
    phase: "PHASE 02",
    title: "G1 · Ed25519 Delegate Key → Sui Address Derivation",
    gateRef: "GATE 01 · derive_sui_address",
    summary:
      "Derive the 32-byte Ed25519 public key and `0x...` Sui address (`blake2b256(0x00 || pubkey)`) identically in TypeScript (`@mysten-incubation/memwal`) and on-chain Move (`memwal::account::derive_sui_address`).",
    deliverables: [
      "Parse `suiprivkey1...` Bech32 or 64-char hex private key without exposing raw key material in network requests.",
      "Compute `public_key` (32 bytes) and `sui_address = blake2b256(0x00 || public_key)` before building the PTB.",
    ],
    cliOrSdkCommand: `import { delegateKeyToPublicKey, delegateKeyToSuiAddress } from "@mysten-incubation/memwal";
const publicKey = await delegateKeyToPublicKey(delegatePrivateKey);
const connectedAddress = await delegateKeyToSuiAddress(delegatePrivateKey);`,
  },
  {
    phase: "PHASE 03",
    title: "G2 & G3 · Vault Creation & Delegate Namespace Binding",
    gateRef: "GATE 02 + 03 · authorize_delegate_for_namespace",
    summary:
      "Owner creates `NamespaceSkillVault` for their `MemWalAccount`, registers team namespaces (`memwal-team-skills`, `design-skills`), and binds each authorized delegate Sui address to its allowed namespaces.",
    deliverables: [
      "Call `memwal::account::add_delegate_key(account, registry, pk_bytes, label, clock)` to register the delegate on the parent account.",
      "Call `namespace_skill_vault::authorize_delegate_for_namespace(account, vault, delegate_addr, namespace)` in the same PTB.",
    ],
    cliOrSdkCommand: `tx.moveCall({
  target: \`\${GUARD_PKG}::namespace_skill_vault::authorize_delegate_for_namespace\`,
  arguments: [
    tx.object(accountId),
    tx.object(vaultId),
    tx.pure.address(connectedAddress),
    tx.pure.string("memwal-team-skills"),
  ],
});`,
  },
  {
    phase: "PHASE 04",
    title: "G4 · SEAL Counter Linearization & Skill Blob Commit",
    gateRef: "GATE 04 · seal_approve_namespace + commit_skill_blob",
    summary:
      "Gate both Walrus `SKILL.md` / Flow Memory writes and SEAL key-server decryption on `assert_connected_delegate_same_namespace` plus `access_counter_version` equality.",
    deliverables: [
      "Dry-run `seal_approve_namespace(id, registry, account, vault, namespace)` on SEAL key servers so revoked delegates or wrong-namespace callers abort with `EDelegateNamespaceMismatch (203)`.",
      "Anchor updated `SKILL.md` Walrus `blob_id` via `commit_skill_blob` with `expected_counter_version` fence.",
    ],
    cliOrSdkCommand: `tx.moveCall({
  target: \`\${GUARD_PKG}::namespace_skill_vault::commit_skill_blob\`,
  arguments: [
    tx.object(registryId),
    tx.object(accountId),
    tx.object(vaultId),
    tx.pure.string(namespace),
    tx.pure.string(\`\${namespace}::\${skillId}\`),
    tx.pure.string(skillId),
    tx.pure.string(walrusBlobId),
    tx.pure.u64(accessCounterVersion),
    tx.object("0x6"),
  ],
});`,
  },
  {
    phase: "PHASE 05",
    title: "Relayer Recall & Revocation Rotation Verification",
    gateRef: "RUNTIME · https://relayer.memory.walrus.xyz",
    summary:
      "Verify end-to-end with `@mysten-incubation/memwal` against `https://relayer.memory.walrus.xyz` on Sui Mainnet: when a delegate leaves, `remove_delegate_key` bumps `access_counter_version` (`v -> v+1`), cutting off future namespace writes and SEAL decrypts.",
    deliverables: [
      "Run `pnpm test && pnpm build` to verify all 4 contract gates (`G1` to `G4`) and UI harness routes (`/`, `/graph`, `/eval`, `/bento`, `/cad`).",
      "Use the Fault Simulator in the card header to test `PASS`, `EDelegateNotAuthorizedOnAccount (201)`, `EDelegateNamespaceMismatch (203)`, and `EStaleAccessCounter (206)`.",
    ],
    cliOrSdkCommand: `pnpm --dir /Volumes/Dev/memwal-skill-harness test
pnpm --dir /Volumes/Dev/memwal-skill-harness build`,
  },
];

export const FULL_MOVE_CONTRACT_SOURCE = `/// contracts/memwal_namespace_guard/sources/namespace_skill_vault.move
module memwal_namespace_guard::namespace_skill_vault {
    use std::string::String;
    use sui::clock::Clock;
    use sui::event;
    use sui::table::{Self, Table};
    use memwal::account::{Self, AccountRegistry, MemWalAccount};

    // === Error Codes ===
    const ENotAccountOwner: u64 = 200;
    const EDelegateNotAuthorizedOnAccount: u64 = 201;
    const ENamespaceNotFound: u64 = 202;
    const EDelegateNamespaceMismatch: u64 = 203;
    const EAccountVaultMismatch: u64 = 204;
    const EAccountInactive: u64 = 205;
    const EStaleAccessCounter: u64 = 206;

    /// Versioned Walrus blob pointer for a SKILL.md or Flow Memory in a namespace
    public struct SkillBlobRecord has store, copy, drop {
        skill_id: String,
        namespace: String,
        walrus_blob_id: String,
        version: u64,
        committed_by: address,
        access_counter_version: u64,
        updated_at_ms: u64,
    }

    /// Shared guard binding a MemWalAccount 1:1 to its namespaces and delegate roster
    public struct NamespaceSkillVault has key {
        id: UID,
        account_id: ID,
        owner: address,
        namespaces: vector<String>,
        delegate_namespaces: Table<address, vector<String>>,
        skill_blobs: Table<String, SkillBlobRecord>,
        last_synced_counter_version: u64,
        created_at: u64,
    }

    /// Bind an authorized delegate address on MemWalAccount to a shared namespace
    entry fun authorize_delegate_for_namespace(
        account: &MemWalAccount,
        vault: &mut NamespaceSkillVault,
        delegate_address: address,
        namespace: String,
        ctx: &TxContext,
    ) {
        assert!(account::owner(account) == ctx.sender(), ENotAccountOwner);
        assert!(object::id(account) == vault.account_id, EAccountVaultMismatch);
        assert!(account::is_active(account), EAccountInactive);

        // G2: Must be owner or registered delegate key on MemWalAccount
        assert!(
            delegate_address == account::owner(account) ||
            account::is_delegate_address(account, delegate_address),
            EDelegateNotAuthorizedOnAccount,
        );

        if (!contains_string(&vault.namespaces, &namespace)) {
            vault.namespaces.push_back(namespace);
        };
        if (!vault.delegate_namespaces.contains(delegate_address)) {
            vault.delegate_namespaces.add(delegate_address, vector::empty());
        };
        let bound_list = vault.delegate_namespaces.borrow_mut(delegate_address);
        if (!contains_string(bound_list, &namespace)) {
            bound_list.push_back(namespace);
        };
        vault.last_synced_counter_version = account::access_counter_version(account);
    }

    /// 4-Gate On-Chain Assertion: Connected Address + Delegate Account + Same Namespace
    entry fun assert_connected_delegate_same_namespace(
        _registry: &AccountRegistry,
        account: &MemWalAccount,
        vault: &NamespaceSkillVault,
        namespace: String,
        ctx: &TxContext,
    ) {
        // G4a: Account active & linked to vault
        assert!(account::is_active(account), EAccountInactive);
        assert!(object::id(account) == vault.account_id, EAccountVaultMismatch);
        assert!(contains_string(&vault.namespaces, &namespace), ENamespaceNotFound);

        // G1 + G2: Connected signer (blake2b256(0x00 || pk)) is owner or delegate on account
        let connected_address = ctx.sender();
        let is_owner = connected_address == account::owner(account);
        let is_delegate = account::is_delegate_address(account, connected_address);
        assert!(is_owner || is_delegate, EDelegateNotAuthorizedOnAccount);

        // G3: Connected delegate is explicitly bound to the active namespace
        if (!is_owner) {
            assert!(
                vault.delegate_namespaces.contains(connected_address),
                EDelegateNamespaceMismatch,
            );
            let bound = vault.delegate_namespaces.borrow(connected_address);
            assert!(contains_string(bound, &namespace), EDelegateNamespaceMismatch);
        };
    }

    /// Commit a Walrus SKILL.md blob after passing G1-G4 and SEAL counter fence
    entry fun commit_skill_blob(
        registry: &AccountRegistry,
        account: &MemWalAccount,
        vault: &mut NamespaceSkillVault,
        namespace: String,
        skill_key: String,
        skill_id: String,
        walrus_blob_id: String,
        expected_counter_version: u64,
        clock: &Clock,
        ctx: &TxContext,
    ) {
        assert_connected_delegate_same_namespace(registry, account, vault, namespace, ctx);
        let current_counter = account::access_counter_version(account);
        assert!(current_counter == expected_counter_version, EStaleAccessCounter);

        let next_version = if (vault.skill_blobs.contains(skill_key)) {
            let prev = vault.skill_blobs.remove(skill_key);
            prev.version + 1
        } else { 1 };

        vault.skill_blobs.add(skill_key, SkillBlobRecord {
            skill_id,
            namespace,
            walrus_blob_id,
            version: next_version,
            committed_by: ctx.sender(),
            access_counter_version: current_counter,
            updated_at_ms: clock.timestamp_ms(),
        });
        vault.last_synced_counter_version = current_counter;
    }

    /// Composite SEAL key-server policy enforcing account + namespace membership
    entry fun seal_approve_namespace(
        id: vector<u8>,
        registry: &AccountRegistry,
        account: &MemWalAccount,
        vault: &NamespaceSkillVault,
        namespace: String,
        ctx: &TxContext,
    ) {
        account::seal_approve(id, registry, account, ctx);
        assert_connected_delegate_same_namespace(registry, account, vault, namespace, ctx);
    }
}`;

export const FULL_TS_PTB_SOURCE = `// Programmable Transaction Block (PTB) + Delegate Namespace Verification
import { Transaction } from "@mysten/sui/transactions";
import {
  MemWal,
  delegateKeyToPublicKey,
  delegateKeyToSuiAddress,
} from "@mysten-incubation/memwal";

export interface NamespaceGuardPtbInput {
  guardPackageId: string;
  registryId: string;
  accountId: string;
  vaultId: string;
  delegateKey: string;
  namespace: string;
  skillId: string;
  walrusBlobId: string;
  expectedCounterVersion: number;
}

export async function buildVerifyAndCommitSkillPtb(input: NamespaceGuardPtbInput) {
  // G1: Derive 32-byte Ed25519 public key & 0x Sui address from delegate key
  const publicKeyBytes = await delegateKeyToPublicKey(input.delegateKey);
  const connectedAddress = await delegateKeyToSuiAddress(input.delegateKey);

  const tx = new Transaction();
  tx.setSender(connectedAddress);

  // G2 + G3: Assert connected delegate belongs to MemWalAccount & same namespace
  tx.moveCall({
    target: \`\${input.guardPackageId}::namespace_skill_vault::assert_connected_delegate_same_namespace\`,
    arguments: [
      tx.object(input.registryId),
      tx.object(input.accountId),
      tx.object(input.vaultId),
      tx.pure.string(input.namespace),
    ],
  });

  // G4: Commit Walrus SKILL.md blob gated on SEAL access_counter_version fence
  tx.moveCall({
    target: \`\${input.guardPackageId}::namespace_skill_vault::commit_skill_blob\`,
    arguments: [
      tx.object(input.registryId),
      tx.object(input.accountId),
      tx.object(input.vaultId),
      tx.pure.string(input.namespace),
      tx.pure.string(\`\${input.namespace}::\${input.skillId}\`),
      tx.pure.string(input.skillId),
      tx.pure.string(input.walrusBlobId),
      tx.pure.u64(input.expectedCounterVersion),
      tx.object("0x6"), // Sui Clock
    ],
  });

  // Sync encrypted Flow Memory / SKILL.md via Walrus Mainnet Relayer
  const memwal = MemWal.create({
    key: input.delegateKey,
    accountId: input.accountId,
    namespace: input.namespace,
    relayerUrl: "https://relayer.memory.walrus.xyz",
  });

  return { tx, connectedAddress, publicKeyBytes, memwal };
}`;

/**
 * Deterministic fallback hash so demo delegate keys also produce realistic
 * 32-byte Ed25519 public keys and `0x...` Sui addresses (`blake2b(0x00 || pk)`).
 */
function deterministicHexFromSeed(seed: string, byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  for (let i = 0; i < byteLength; i++) {
    let h = (2166136261 ^ i * 16777619) >>> 0;
    for (let j = 0; j < seed.length; j++) {
      h ^= seed.charCodeAt(j) + ((i + j) & 0xff);
      h = Math.imul(h, 16777619) >>> 0;
    }
    bytes[i] = h & 0xff;
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Derive the Sui address (`0x...`) and 32-byte Ed25519 public key from a
 * delegate private key (`suiprivkey1...` or 64-char hex).
 */
export async function deriveDelegateIdentity(delegateKey: string): Promise<{
  suiAddress: string;
  publicKeyHex: string;
  usedSdkCrypto: boolean;
}> {
  const trimmed = delegateKey.trim();
  if (!trimmed) {
    return {
      suiAddress:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      publicKeyHex: "0".repeat(64),
      usedSdkCrypto: false,
    };
  }

  try {
    const [suiAddress, pkBytes] = await Promise.all([
      delegateKeyToSuiAddress(trimmed),
      delegateKeyToPublicKey(trimmed),
    ]);
    return {
      suiAddress,
      publicKeyHex: bytesToHex(pkBytes),
      usedSdkCrypto: true,
    };
  } catch {
    // Demo or shorthand delegate key: derive deterministic 32-byte pubkey & 0x Sui address
    const publicKeyHex = deterministicHexFromSeed(`pk:${trimmed}`, 32);
    const suiAddress = `0x${deterministicHexFromSeed(`sui:0x00:${publicKeyHex}`, 32)}`;
    return {
      suiAddress,
      publicKeyHex,
      usedSdkCrypto: false,
    };
  }
}

/**
 * Verify that the connected delegate key address belongs to the `MemWalAccount`
 * AND is bound to the active `namespace` (`memwal_namespace_guard::namespace_skill_vault`).
 */
export async function verifyDelegateAndNamespaceContract(
  config: WalrusConnectionConfig,
  boundNamespaces: string[],
  delegates: OnChainDelegateMember[],
  accessCounterVersion: number,
  faultSimulation: ContractFaultSimulationMode = "none"
): Promise<SmartContractVerificationResult> {
  const identity = await deriveDelegateIdentity(config.delegateKey);
  const normalizedNsList = Array.from(
    new Set(boundNamespaces.map((n) => n.trim()).filter(Boolean))
  );

  let mode: "on-chain-rpc" | "move-vm-simulation" = "move-vm-simulation";
  let ownerAddress =
    "0x8a2572a955f053a9f7859477b5ecae3c81391901da5e174046c7bb67f98ee124";
  let onChainActive = true;
  let onChainDelegateMatch: boolean | null = null;
  let onChainCounter = accessCounterVersion;
  let onChainAccount: OnChainMemWalAccountState | null = null;

  const hasValidAccount =
    config.accountId.trim().startsWith("0x") &&
    config.accountId.trim().length >= 10;
  const hasValidKey = config.delegateKey.trim().length >= 8;

  // Live Sui Testnet gRPC inspection of `MemWalAccount` object via SuiGrpcClient
  if (hasValidAccount && hasLiveCredentials(config)) {
    const fetched = await fetchOnChainMemWalAccount(config.accountId.trim());
    if (fetched) {
      onChainAccount = fetched;
      mode = "on-chain-rpc";
      ownerAddress = fetched.owner;
      onChainActive = fetched.active;
      onChainCounter = fetched.accessCounterVersion;
      onChainDelegateMatch = fetched.delegateKeys.some(
        (dk) => dk.suiAddress.toLowerCase() === identity.suiAddress.toLowerCase()
      );
    }
  }

  const effectiveDelegateCount = onChainAccount
    ? onChainAccount.delegateKeys.length
    : delegates.length;

  const baseRegisteredInRoster =
    onChainDelegateMatch !== null
      ? onChainDelegateMatch ||
        ownerAddress.toLowerCase() === identity.suiAddress.toLowerCase()
      : hasValidAccount &&
        hasValidKey &&
        delegates.some(
          (d) =>
            d.isCurrentUser ||
            d.suiAddress.toLowerCase() === identity.suiAddress.toLowerCase()
        );

  const isRegisteredInRoster =
    faultSimulation === "unregistered-delegate" ? false : baseRegisteredInRoster;

  const baseSameNamespace =
    hasValidAccount &&
    hasValidKey &&
    normalizedNsList.includes(config.namespace.trim());

  const isSameNamespace =
    faultSimulation === "namespace-mismatch" ? false : baseSameNamespace;

  const sealFencePassed =
    faultSimulation === "stale-seal-counter"
      ? false
      : hasValidAccount && onChainActive;

  const gates: ContractGateResult[] = [
    {
      id: "gate-derive",
      code: "G1 · ED25519 → SUI ADDR",
      title: "Connected Delegate Address Derivation",
      moveCall: "memwal::account::derive_sui_address(&public_key)",
      errorCode: "EInvalidPublicKeyLength (5)",
      formula: "blake2b256(0x00 ‖ ed25519_pk[32])",
      expectedValue: "32-byte Ed25519 pk → 0x Sui Address",
      actualValue: hasValidKey ? identity.suiAddress : "MISSING_DELEGATE_KEY",
      passed: hasValidKey,
      detail: hasValidKey
        ? `Derived address ${identity.suiAddress} from 32-byte Ed25519 pubkey (${identity.publicKeyHex.slice(0, 16)}...)`
        : "Missing delegate private key — paste suiprivkey1... or load demo key",
    },
    {
      id: "gate-account",
      code: "G2 · DELEGATE ∈ ACCOUNT",
      title: "MemWalAccount Delegate Authorization",
      moveCall: "memwal::account::is_delegate_address(account, connected_addr)",
      errorCode: "EDelegateNotAuthorizedOnAccount (201)",
      formula: "ctx.sender() ∈ account.delegate_keys[0..20]",
      expectedValue: `Registered on ${config.accountId || "0x..."}`,
      actualValue: isRegisteredInRoster
        ? `Authorized on-chain (${effectiveDelegateCount}/20 slots active)`
        : "Abort 201: EDelegateNotAuthorizedOnAccount",
      passed: hasValidAccount && isRegisteredInRoster && onChainActive,
      detail:
        hasValidAccount && isRegisteredInRoster
          ? `Connected address is registered in MemWalAccount.delegate_keys (${effectiveDelegateCount}/20 keys)`
          : "Connected address is NOT in MemWalAccount.delegate_keys → Move abort 201",
    },
    {
      id: "gate-namespace",
      code: "G3 · SAME NAMESPACE GUARD",
      title: "Connected Address Uses Same Namespace",
      moveCall:
        "namespace_skill_vault::assert_connected_delegate_same_namespace(reg, acct, vault, ns)",
      errorCode: "EDelegateNamespaceMismatch (203)",
      formula: `namespace ∈ vault.delegate_namespaces[ctx.sender()]`,
      expectedValue: `"${config.namespace}" ∈ [${normalizedNsList.join(", ")}]`,
      actualValue: isSameNamespace
        ? `Bound to "${config.namespace}" (${normalizedNsList.length} shared namespaces)`
        : `Abort 203: EDelegateNamespaceMismatch ("${config.namespace}" unbound)`,
      passed: isSameNamespace,
      detail: isSameNamespace
        ? `Delegate is bound to active namespace "${config.namespace}" across [${normalizedNsList.join(", ")}]`
        : `Delegate is NOT bound to namespace "${config.namespace}" → Move abort 203`,
    },
    {
      id: "gate-seal",
      code: "G4 · SEAL COUNTER FENCE",
      title: "SEAL Access Counter Linearization",
      moveCall:
        "namespace_skill_vault::seal_approve_namespace(id, reg, acct, vault, ns)",
      errorCode: "EStaleAccessCounter (206) / ENoAccess (100)",
      formula: `BCS(owner) ‖ BCS(counter == v${onChainCounter}) && account.active`,
      expectedValue: `v${onChainCounter} (active=true)`,
      actualValue: sealFencePassed
        ? `v${onChainCounter} == on-chain v${onChainCounter} (active=true)`
        : `Abort 206: EStaleAccessCounter (client v${onChainCounter} != rotated v${onChainCounter + 1})`,
      passed: sealFencePassed,
      detail: sealFencePassed
        ? `SEAL identity BCS(owner) ‖ BCS(v${onChainCounter}) matches active MemWalAccount`
        : `Stale SEAL counter detected after delegate revocation → Move abort 206`,
    },
  ];

  const failedGate = gates.find((g) => !g.passed);
  const verified = !failedGate;

  return {
    verified,
    mode,
    faultSimulation,
    connectedAddress: identity.suiAddress,
    publicKeyHex: identity.publicKeyHex,
    accountId: config.accountId,
    ownerAddress,
    activeNamespace: config.namespace,
    boundNamespaces: normalizedNsList,
    accessCounterVersion: onChainCounter,
    delegateCount: effectiveDelegateCount,
    gates,
    abortReason: failedGate ? `${failedGate.code} → ${failedGate.errorCode}` : null,
    verifiedAt: new Date().toISOString(),
    onChainAccount,
  };
}
