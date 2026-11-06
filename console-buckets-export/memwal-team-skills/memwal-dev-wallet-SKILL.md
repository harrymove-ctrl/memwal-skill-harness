---
name: memwal-dev-wallet
description: >-
  Configures and drives @mysten-incubation/dev-wallet (v0.6.0) for automated Sui
  keypair/account management, headless Wallet Standard browser auto-connection and
  signing in MemWal dApps (apps/app Playground/Dashboard), and programmatic
  account lifecycle flows (createAccount, addDelegateKey, removeDelegateKey,
  /api/sponsor dual-signing) without manual wallet extension prompts.
---

# memwal-dev-wallet

The `memwal-dev-wallet` skill provides reusable documentation, integration blueprints, and operational workflows for driving `@mysten-incubation/dev-wallet` across both programmatic Node.js test harnesses and headless Playwright browser environments for Walrus Memory (`MystenLabs/MemWal`).

## 1. Activation & Use Cases

Activate this skill when:
- Writing or maintaining automated E2E tests for MemWal's web application (`apps/app` Playground or Dashboard).
- Running programmatic on-chain transactions or personal-message signing in CI/test environments without human wallet extension popups.
- Executing MemWal account lifecycle operations (`createAccount`, `addDelegateKey`, `removeDelegateKey`).
- Orchestrating dual-signing gasless transactions through the MemWal Relayer `/sponsor` and `/sponsor/execute` endpoints.
- Verifying Wallet Standard compliance and cross-realm window event registration in headless Playwright sessions.
- Conducting automated QA or verification runs under `memwal-qa` and `memwal-review` safety guidelines.

---

## 2. Package Architecture: `@mysten-incubation/dev-wallet`

### 2.1 Package Metadata & Version Pinning
- **Package**: `@mysten-incubation/dev-wallet`
- **Target Version**: `0.6.0` (compatible with `0.5.1`+)
- **Upstream Source**: `https://github.com/MystenLabs/ts-sdks-incubation/tree/main/packages/dev-wallet`
- **Peer Dependencies**: `@mysten/sui` (`^2.17.0` / `^2.20.0`), `@mysten/wallet-standard` (`^0.21.0`), `@mysten/wallet-sdk` (`^0.4.0`)

### 2.2 Subpath Exports Map

| Subpath | Types | JS Entrypoint | Primary Exports & Purpose |
|---|---|---|---|
| `.` | `./dist/index.d.mts` | `./dist/index.mjs` | `DevWallet`, `devWalletInitializer`, `mountAndRegisterDevWallet` |
| `./adapters` | `./dist/adapters/browser.d.mts` | `./dist/adapters/browser.mjs` | `InMemorySignerAdapter`, `WebCryptoSignerAdapter`, `RemoteCliAdapter` |
| `./inject` | `./dist/inject/index.d.mts` | `./dist/inject/index.mjs` | `registerDevstackDevWallet`, headless browser injection helpers |
| `./ui` | `./dist/ui/index.d.mts` | `./dist/ui/index.mjs` | Lit Web Components drawer, interactive signing modals |
| `./react` | `./dist/react/index.d.mts` | `./dist/react/index.mjs` | `useDevWallet`, `DevWalletProvider`, React context hooks |
| `./client` | `./dist/client/index.d.mts` | `./dist/client/index.mjs` | `DevWalletClient` for popup mode |
| `./server` | `./dist/server/index.d.mts` | `./dist/server/index.mjs` | `parseWalletRequest`, CLI signing middleware |

### 2.3 Signer Adapters & Auto-Approval Policies

`DevWallet` decouples key generation and signing through adapters:
1. **`InMemorySignerAdapter`** (`id: 'in-memory'`):
   - Ephemeral in-memory `Ed25519Keypair` storage (zero disk persistence).
   - `allowAutoSign: true` by default.
   - **Recommended for programmatic testing, CI, and headless Playwright runs.**
2. **`WebCryptoSignerAdapter`** (`id: 'webcrypto'`):
   - Uses `WebCryptoSigner` (`Secp256r1`) stored in browser IndexedDB.
   - Keys persist across page reloads. `allowAutoSign: true`.
3. **`RemoteCliAdapter`** (`id: 'remote-cli'`):
   - Routes signing to local `sui keytool sign` CLI via HTTP.
   - `allowAutoSign: false` (always requires explicit human interaction; does NOT support `signPersonalMessage`).

#### The Auto-Approval Contract:
- **`autoConnect: true`**: When a dApp triggers `standard:connect`, `DevWallet` resolves `{ accounts: this.accounts }` immediately without user interaction.
- **`autoApprove: true | ((request) => boolean)`**: Bypasses the UI request queue and executes signing immediately via `#executeSigning`.
- **Queue Serialization Invariant**: If `autoApprove: false`, DevWallet allows only ONE pending signing request at a time. A second concurrent request is rejected with `Error: A signing request is already pending.`. When `autoApprove: true`, requests resolve synchronously or sequentially without queue blocks.

---

## 3. Programmatic Headless Signer Adapter (`createDevWalletSigner`)

### 3.1 MemWal SDK `WalletSigner` Interface Contract
In `@mysten-incubation/memwal/account` (`packages/sdk/src/types.ts`):
```typescript
export interface WalletSigner {
    address: string;
    signAndExecuteTransaction: (input: { transaction: any }) => Promise<
        | { digest: string }
        | { $kind: "Transaction"; Transaction: { digest: string }; FailedTransaction?: never }
        | { $kind: "FailedTransaction"; Transaction?: never; FailedTransaction: { digest: string } }
    >;
    signPersonalMessage: (input: { message: Uint8Array }) => Promise<{ signature: string }>;
}
```

### 3.2 Standard Implementation Pattern (`e2e/harness/dev-wallet/signer.ts`)

```typescript
import { DevWallet } from '@mysten-incubation/dev-wallet';
import { InMemorySignerAdapter } from '@mysten-incubation/dev-wallet/adapters';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';

export interface CreateDevWalletSignerOptions {
    keypair?: Ed25519Keypair | string;
    label?: string;
    network?: 'testnet' | 'devnet' | 'localnet';
    networks?: Record<string, string>;
    suiClient?: any;
    relayerUrl?: string;
    mode?: 'direct' | 'sponsored';
    onSigningRequest?: (request: { type: string; at: number }) => void;
}

export async function createDevWalletSigner(opts: CreateDevWalletSignerOptions = {}) {
    const network = opts.network ?? 'testnet';
    const chain = `sui:${network}` as const;
    const relayerUrl = opts.relayerUrl ?? 'https://relayer.dev.memwal.ai';
    const mode = opts.mode ?? (opts.relayerUrl ? 'sponsored' : 'direct');

    // 1. Resolve Keypair
    let keypair: Ed25519Keypair;
    if (!opts.keypair) {
        keypair = new Ed25519Keypair();
    } else if (typeof opts.keypair === 'string') {
        if (opts.keypair.startsWith('suiprivkey')) {
            const { secretKey } = decodeSuiPrivateKey(opts.keypair);
            keypair = Ed25519Keypair.fromSecretKey(secretKey);
        } else {
            const secretBytes = Buffer.from(opts.keypair.replace(/^0x/, ''), 'hex');
            keypair = Ed25519Keypair.fromSecretKey(secretBytes);
        }
    } else {
        keypair = opts.keypair;
    }

    // 2. Initialize InMemory Adapter
    const adapter = new InMemorySignerAdapter();
    await adapter.initialize();
    const managedAccount = await adapter.importAccount({
        signer: keypair,
        label: opts.label ?? 'memwal-e2e-signer',
    });

    const networkUrls = {
        testnet: 'https://fullnode.testnet.sui.io:443',
        devnet: 'https://fullnode.devnet.sui.io:443',
        localnet: 'http://127.0.0.1:9000',
        ...opts.networks,
    };

    // 3. Initialize DevWallet with autoApprove & autoConnect
    const wallet = new DevWallet({
        adapters: [adapter],
        networks: networkUrls,
        activeNetwork: network,
        autoConnect: true,
        name: 'MemWal Programmatic Dev Wallet',
        clientFactory: (net, url) => new SuiGrpcClient({ network: net, baseUrl: url }) as any,
        autoApprove: (request) => {
            opts.onSigningRequest?.({ type: request.type, at: Date.now() });
            return true;
        },
    });

    const walletAccount = managedAccount.walletAccount;
    const address = walletAccount.address;

    return {
        address,
        wallet,
        adapter,
        managedAccount,
        walletAccount,
        keypair,
        network,
        chain,
        relayerUrl,
        mode,
        signPersonalMessage: async ({ message }: { message: Uint8Array }) => {
            const res = await wallet.features['sui:signPersonalMessage'].signPersonalMessage({
                message,
                account: walletAccount,
                chain,
            });
            return { signature: res.signature };
        },
        signTransaction: async ({ transaction, chain: targetChain }: { transaction: any; chain?: string }) => {
            const res = await wallet.features['sui:signTransaction'].signTransaction({
                transaction,
                account: walletAccount,
                chain: (targetChain as `sui:${string}`) || chain,
            });
            return { bytes: res.bytes, signature: res.signature };
        },
        destroy: () => wallet.destroy(),
    };
}
```

---

## 4. Headless Browser Wallet Standard Injection

### 4.1 The Realm Isolation Problem
In Playwright, `page.addInitScript` executes in an isolated context prior to page scripts.
- Directly invoking `DevWallet.register()` inside `addInitScript` updates only the `addInitScript`'s private singleton instance of `@wallet-standard/app`.
- The dApp (`apps/app`) imports its own bundled instance of `@wallet-standard/app` inside `node_modules`.
- Because module registries are isolated, `@mysten/dapp-kit`'s `WalletProvider` never discovers the injected wallet.

### 4.2 Cross-Realm Window Event Protocol
To bridge execution realms without shared module instances, registration uses the standard browser window events:
```typescript
function registerWalletViaEvent(wallet: DevWallet): void {
    const callback = ({ register }: { register: (...wallets: DevWallet[]) => void }) => register(wallet);
    try {
        window.dispatchEvent(
            new CustomEvent('wallet-standard:register-wallet', {
                bubbles: false,
                cancelable: false,
                composed: false,
                detail: callback,
            }),
        );
    } catch (error) {
        console.error('wallet-standard:register-wallet dispatch error', error);
    }
    try {
        window.addEventListener('wallet-standard:app-ready', ((event: CustomEvent) =>
            callback(event.detail)) as EventListener);
    } catch (error) {
        console.error('wallet-standard:app-ready listener error', error);
    }
}
```

### 4.3 Vite IIFE Standalone Bundler Pattern (`bundle.ts`)
Browser injection cannot resolve bare module specifiers (`@mysten-incubation/dev-wallet`, `@mysten/sui`). Vite prebundles the entry point into a standalone IIFE bundle with process-level promise caching:
```typescript
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const HERE = dirname(fileURLToPath(import.meta.url));
let cachedBundlePromise: Promise<string> | undefined;

export function buildDevWalletBundle(): Promise<string> {
    cachedBundlePromise ??= compileBundle();
    return cachedBundlePromise;
}

async function compileBundle(): Promise<string> {
    const outDir = mkdtempSync(join(tmpdir(), 'memwal-e2e-dev-wallet-'));
    await build({
        configFile: false,
        logLevel: 'warn',
        build: {
            outDir,
            emptyOutDir: true,
            minify: false,
            target: 'es2020',
            lib: {
                entry: resolve(HERE, 'devWalletEntry.ts'),
                name: 'memwalE2EDevWallet',
                formats: ['iife'],
                fileName: () => 'dev-wallet-entry.js',
            },
            rollupOptions: { output: { inlineDynamicImports: true } },
        },
    });
    return resolve(outDir, 'dev-wallet-entry.js');
}
```

### 4.4 Playwright Test Setup Flow
```typescript
import { test, expect } from '@playwright/test';
import { injectDevWallet, waitForDevWalletReady, getDevWalletCalls } from '../../../e2e/harness/dev-wallet';

test.beforeEach(async ({ page }) => {
    await injectDevWallet(page, {
        suiPrivateKey: process.env.MEMWAL_SUI_PRIVATE_KEY!,
        endpoint: 'https://fullnode.testnet.sui.io:443',
        transport: 'grpc',
        network: 'testnet',
        walletName: 'MemWal E2E Dev Wallet',
        autoConnect: true,
        autoApprove: true,
    });
});

test('connects and signs without dialogs', async ({ page }) => {
    await page.goto('/');
    await waitForDevWalletReady(page);

    await page.getByRole('button', { name: 'Connect wallet' }).click();
    await page.getByRole('button', { name: 'MemWal E2E Dev Wallet' }).click();
    await expect(page).toHaveURL(/\/(dashboard|setup)/, { timeout: 20_000 });

    const calls = await getDevWalletCalls(page);
    expect(calls).toHaveLength(0);
});
```

---

## 5. MemWal Account Lifecycle & Gasless Sponsorship

### 5.1 Programmatic On-Chain Operations
Using `packages/sdk/src/account.ts` with `DevWalletSigner`:
1. **`createAccount`**:
   - Move Call: `{packageId}::account::create_account(registry, 0x6)`.
   - Contract Constraint: Exactly one `MemWalAccount` per Sui address.
2. **`addDelegateKey`**:
   - Generation: `const delegate = await generateDelegateKey()` (fresh 32-byte Ed25519).
   - Address Derivation: Contract derives Blake2b(`0x00 || publicKey`).
   - Move Call: `{packageId}::account::add_delegate_key(accountId, registry, publicKey, label, 0x6)`.
3. **`removeDelegateKey`**:
   - Move Call: `{packageId}::account::remove_delegate_key(accountId, registry, publicKey)`.
   - Forward-Only Revocation: Prior memories remain readable until re-encrypted; subsequent memories cannot be decrypted by the revoked key.

### 5.2 5-Step Dual-Signing Gasless Sponsorship (`/api/sponsor`)
Gasless account setup allows new users to register on Sui without holding SUI coins:
1. **Build `TransactionKind` bytes**:
   ```typescript
   const kindBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });
   ```
2. **Personal Message Challenge Authorization**:
   ```typescript
   import { createSponsorAuthorization } from '@mysten-incubation/memwal';

   const authorization = await createSponsorAuthorization(
       senderAddress,
       kindBytes,
       (message) => devWalletSigner.signPersonalMessage({ message })
   );
   ```
   *Challenge message format*:
   ```
   MemWal sponsor authorization
   sender: <sender_address>
   transaction-kind-sha256: <sha256_hex>
   timestamp: <unix_seconds>
   nonce: <uuid_v4>
   ```
3. **POST `/sponsor`**:
   - Relayer verifies:
     - Timestamp within `SPONSOR_AUTH_WINDOW_SECONDS` (300s).
     - Nonce unused (Redis `SET sponsor:auth:nonce:{nonce} 1 EX 600 NX`).
     - Move allowlist: `create_account`, `add_delegate_key`, `remove_delegate_key`, `reactivate_account`.
   - Returns `{ bytes: "<sponsoredTxBytesBase64>", digest: "..." }`.
4. **Sign Sponsored Transaction**:
   ```typescript
   const sponsoredTx = Transaction.from(sponsored.bytes);
   const { signature } = await devWalletSigner.signTransaction({
       transaction: sponsoredTx,
       chain: devWalletSigner.chain,
   });
   ```
5. **POST `/sponsor/execute`**:
   - Relayer submits transaction to Sui network and returns `{ digest }`.

---

## 6. Safety, Hygiene & Walrus Memory Rules

When operating under this skill, adhere strictly to `memwal-qa`, `memwal-review`, `walm-ticket`, and `gh-issue-fixed` boundaries:

1. **Strict Read-Only Infrastructure & Active Environments (`dev` and `production` only)**:
   - Note: `staging` is retired and no longer used in Walrus Memory; promotions go directly `dev → main` (`production`).
   - NEVER trigger Railway deploys or modify Railway project configuration.
   - NEVER execute destructive database migrations on shared `dev` or `production` databases.
2. **Secret Redaction & Local Isolation**:
   - Private keys (`SUI_PRIVATE_KEY`, `MEMWAL_PRIVATE_KEY`) must reside exclusively in local untracked `.env` files (e.g. `.env.dev.local`).
   - Private key material, seed phrases, and auth tokens must NEVER appear in console logs, test artifacts, or git commits.
3. **Namespace Isolation & Guaranteed Teardown**:
   - All test memory writes must use a unique run namespace marker:
     ```typescript
     const namespace = `e2e-devwallet-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
     ```
   - Always clean up memories via `POST /api/forget` or SDK `forget()` in a `finally` block or test teardown.
4. **Public GitHub vs Internal Linear (`WALM-*`) & Strict Merge Gate**:
   - **Never** put `WALM-*` or `walm-*` in GitHub branch names, PR titles, PR bodies, commit messages, code comments, or changelogs (`CHANGELOG.md` / `changelog.mdx`). Use GitHub issue numbers (`fix/issue-<N>-<slug>`, `Fixes #<N>`, `(#<N>)`) on GitHub, and link the GitHub PR inside the `WALM-*` Linear ticket (`linear-mysten`).
   - **Never** claim an issue is fixed or merge a PR without reproducing the issue end-to-end (`Local vs dev` / live `dev`) and verifying 100% of CI checks and deploy checks are `SUCCESS`.
5. **Operator Identity**:
   - Verify your active GitHub account via `gh auth status` before pushing, commenting, or reviewing. Zero AI attribution (`Co-Authored-By`, etc.).

---

## 7. Verification & Troubleshooting Reference

### Common Error Matrix

| Symptom / Error | Root Cause | Resolution |
|---|---|---|
| `DevWallet` opens modal or queues request when `autoApprove: true` | Using an adapter with `allowAutoSign: false` (e.g. `RemoteCliAdapter` or `PasskeySignerAdapter`) | Use `InMemorySignerAdapter` for headless automation. |
| `Error: A signing request is already pending.` | `autoApprove` is `false` and a second signing request arrived before the first completed | Set `autoApprove: true` or pass an approval predicate. |
| dApp Kit's `Connect wallet` modal does not list `MemWal E2E Dev Wallet` | Using `DevWallet.register()` in `page.addInitScript` (isolated realm) | Use window-event protocol: `wallet-standard:register-wallet` and `wallet-standard:app-ready`. |
| Relayer `/sponsor` returns `HTTP 401: Invalid sponsor authorization` | Clock drift > 300s or replaying a used nonce | Check system clock sync; ensure fresh UUIDv4 per sponsorship request. |
| Relayer `/sponsor` returns `HTTP 400: Transaction kind is not permitted` | Submitted Move call is not in relayer allowlist | Only submit `create_account`, `add_delegate_key`, `remove_delegate_key`, `reactivate_account`. |
| SDK throws `Invalid Ed25519 public key length` | Public key array is not exactly 32 bytes | Ensure key is derived from 32-byte Ed25519 public key bytes. |

### Verification Commands
```bash
# Verify harness driver standalone against live dev relayer
pnpm exec tsx e2e/harness/dev-wallet/driver.ts

# Verify browser injection spec in apps/app
pnpm --filter @memwal/app test:e2e apps/app/e2e/devWalletInjection.spec.ts

# Typecheck E2E harness
pnpm exec tsc --noEmit
```

## Live Flow Memories (Walrus Recalled)
- **[FLOW:memwal-dev-wallet]** (gotcha · blob `XvqXdkl79MSND_EcvKX6LM2DRPAnytD6A_DKDbCbICY` · by `@teammate-qa`): Use sponsored dev-wallet accounts for gas-free automated browser testing on dev.
  - *Rationale*: Avoids testnet faucet limits during automated E2E tests.
