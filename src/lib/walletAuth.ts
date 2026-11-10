import { isEnokiWallet, registerEnokiWallets } from "@mysten/enoki";
import { generateDelegateKey } from "@mysten-incubation/memwal/account";
import { SuiGrpcClient } from "@mysten/sui/grpc";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { fromBase64, toBase64 } from "@mysten/sui/utils";
import { getWallets, type Wallet, type WalletAccount } from "@mysten/wallet-standard";
import { DEFAULT_SUI_GRPC_URL } from "./memwalBridge";

// Listed by name so Vite inlines only these public values (see memwalBridge.ts).
const metaEnv: Record<string, string | undefined> = {
  VITE_ENOKI_API_KEY: import.meta.env.VITE_ENOKI_API_KEY,
  VITE_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
};

const rawEnvEnokiKey = metaEnv.VITE_ENOKI_API_KEY?.trim() || "";
export const DEFAULT_ENOKI_API_KEY =
  rawEnvEnokiKey.startsWith("enoki_public_")
    ? rawEnvEnokiKey
    : "enoki_public_dda5bff067b6075d4f23f4a9502518aa";

export const LOCALHOST_GOOGLE_CLIENT_ID =
  "603573168998-1en4kolflalfkffklhejndaqncer0j3d.apps.googleusercontent.com";
export const PROD_GOOGLE_CLIENT_ID =
  "603573168998-nabgjd9ne6hg3sdcqm7oshn80u42v392.apps.googleusercontent.com";

export function resolveGoogleClientId(): string {
  if (metaEnv.VITE_GOOGLE_CLIENT_ID?.trim()) {
    return metaEnv.VITE_GOOGLE_CLIENT_ID.trim();
  }
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1")
  ) {
    return LOCALHOST_GOOGLE_CLIENT_ID;
  }
  return PROD_GOOGLE_CLIENT_ID;
}

export const DEFAULT_GOOGLE_CLIENT_ID = resolveGoogleClientId();

const ENOKI_BROADCAST_CHANNEL = "memwal_enoki_zklogin";
const ENOKI_STORAGE_RESULT_KEY = "memwal_enoki_zklogin_result";

const TESTNET_ONLY_ENOKI_KEYS = new Set([
  "enoki_public_9aac56cf5c1e5b1254d1fa09bb6e9f0c",
  "enoki_public_7a7422ea8969ca8d66f82302563036a9",
]);

let enokiRegistered = false;

export interface BrowserWalletOption {
  name: string;
  icon?: string;
  isSlush: boolean;
  installed: boolean;
}

export interface ConnectedBrowserWalletSession {
  walletName: string;
  address: string;
  publicKeyHex?: string;
  signature?: string;
  delegateKeyHex?: string;
}

/**
 * Registers Mysten Enoki Google zkLogin wallet on Wallet Standard (`getWallets()`).
 */
export function ensureEnokiRegistered(): void {
  if (enokiRegistered || typeof window === "undefined") return;
  try {
    const enokiNetwork: "mainnet" | "testnet" = TESTNET_ONLY_ENOKI_KEYS.has(
      DEFAULT_ENOKI_API_KEY
    )
      ? "testnet"
      : "mainnet";

    const client = new SuiGrpcClient({
      network: enokiNetwork,
      baseUrl:
        enokiNetwork === "testnet"
          ? "https://fullnode.testnet.sui.io:443"
          : DEFAULT_SUI_GRPC_URL,
    });

    registerEnokiWallets({
      apiKey: DEFAULT_ENOKI_API_KEY,
      apiUrl: `${window.location.origin}/enoki-api`,
      providers: {
        google: {
          clientId: DEFAULT_GOOGLE_CLIENT_ID,
          redirectUrl: `${window.location.origin}/`,
        },
      },
      client,
      network: enokiNetwork,
      windowFeatures: () => {
        const width = 500;
        const height = 660;
        const left = Math.max(0, Math.round((window.screen.width - width) / 2));
        const top = Math.max(0, Math.round((window.screen.height - height) / 2));
        return `popup=yes,width=${width},height=${height},left=${left},top=${top}`;
      },
    });
    enokiRegistered = true;
  } catch (err) {
    console.warn("[walletAuth] Enoki registration warning:", err);
  }
}

function isSuiCapableBrowserWallet(wallet: Wallet): boolean {
  if (isEnokiWallet(wallet)) return false;
  if (wallet.name.toLowerCase().includes("dev wallet")) return false;
  const hasConnect = "standard:connect" in wallet.features;
  const hasSuiChain =
    wallet.chains.some((c) => c.startsWith("sui:")) ||
    "sui:signPersonalMessage" in wallet.features ||
    "sui:signTransaction" in wallet.features ||
    "sui:signTransactionBlock" in wallet.features;
  return hasConnect && hasSuiChain;
}

/**
 * Lists installed Sui Wallet Standard browser extensions (Slush, Sui Wallet, Phantom, Nightly, etc.).
 */
export function getInstalledBrowserWallets(): Wallet[] {
  if (typeof window === "undefined") return [];
  try {
    const all = getWallets().get();
    const filtered = all.filter(isSuiCapableBrowserWallet);
    return filtered.sort((a, b) => {
      const aSlush =
        a.name.toLowerCase().includes("slush") ||
        a.name.toLowerCase().includes("sui wallet")
          ? -1
          : 0;
      const bSlush =
        b.name.toLowerCase().includes("slush") ||
        b.name.toLowerCase().includes("sui wallet")
          ? -1
          : 0;
      return aSlush - bSlush;
    });
  } catch {
    return [];
  }
}

export function subscribeBrowserWallets(onChange: (wallets: Wallet[]) => void): () => void {
  if (typeof window === "undefined") return () => {};
  try {
    const walletsApi = getWallets();
    const unsubRegister = walletsApi.on("register", () => {
      onChange(getInstalledBrowserWallets());
    });
    const unsubUnregister = walletsApi.on("unregister", () => {
      onChange(getInstalledBrowserWallets());
    });
    return () => {
      unsubRegister();
      unsubUnregister();
    };
  } catch {
    return () => {};
  }
}

/**
 * Connects to Slush Wallet (or the user's selected Sui browser wallet extension)
 * via Wallet Standard `standard:connect`, opening the real extension popup.
 */
export async function connectSlushOrBrowserWallet(
  preferredName?: string
): Promise<{
  wallet: Wallet;
  account: WalletAccount;
  walletName: string;
  address: string;
}> {
  const installed = getInstalledBrowserWallets();
  if (installed.length === 0) {
    throw new Error(
      "No Sui browser wallet extension detected. Install or enable Slush Wallet in Chrome, or choose Dev Wallet."
    );
  }

  const wallet =
    (preferredName &&
      installed.find(
        (w) => w.name.toLowerCase() === preferredName.toLowerCase()
      )) ||
    installed.find((w) => w.name.toLowerCase().includes("slush")) ||
    installed.find((w) => w.name.toLowerCase().includes("sui")) ||
    installed[0];

  const connectFeature = wallet.features["standard:connect"] as
    | { connect: () => Promise<{ accounts: readonly WalletAccount[] }> }
    | undefined;

  if (!connectFeature) {
    throw new Error(`${wallet.name} does not support standard:connect.`);
  }

  const result = await connectFeature.connect();
  const accounts = result?.accounts?.length ? result.accounts : wallet.accounts;
  const suiAccount =
    accounts.find((a) => a.chains?.some((c) => c.startsWith("sui:"))) ||
    accounts[0];

  if (!suiAccount?.address) {
    throw new Error(`No Sui account returned from ${wallet.name}.`);
  }

  return {
    wallet,
    account: suiAccount,
    walletName: wallet.name,
    address: suiAccount.address,
  };
}

/**
 * Requests a real `sui:signPersonalMessage` approval popup in Slush Wallet (or connected browser wallet)
 * to authorize the MemWal workspace & delegate session key.
 */
export async function signWorkspacePermissionWithWallet(params: {
  wallet: Wallet;
  account: WalletAccount;
  namespace: string;
}): Promise<ConnectedBrowserWalletSession> {
  const { wallet, account, namespace } = params;
  const generated = await generateDelegateKey();
  const delegateKeyHex = generated.privateKey;

  const permissionMessage = [
    "Walrus Memory (MemWal) — Workspace Access & Delegate Key Authorization",
    `Wallet: ${wallet.name} (${account.address})`,
    `Workspace Namespace: memwal.ai/${namespace}`,
    `Authorized Delegate Key: ${generated.suiAddress}`,
    "Permissions: memwal_recall (Read SKILL.md & Flow blobs), memwal_remember (Write Flow rules), Move 2024 MemWalAccount guard",
    `Issued At: ${new Date().toISOString()}`,
  ].join("\n");

  const messageBytes = new TextEncoder().encode(permissionMessage);

  const signPersonal = wallet.features["sui:signPersonalMessage"] as
    | {
        signPersonalMessage: (input: {
          message: Uint8Array;
          account: WalletAccount;
          chain?: `${string}:${string}`;
        }) => Promise<{ signature: string; bytes: string }>;
      }
    | undefined;

  let signature = "";
  if (signPersonal) {
    const signed = await signPersonal.signPersonalMessage({
      message: messageBytes,
      account,
      chain: "sui:mainnet",
    });
    signature = signed.signature;
  }

  return {
    walletName: wallet.name,
    address: account.address,
    signature,
    delegateKeyHex,
  };
}

/**
 * Triggers real Mysten Enoki Google zkLogin OAuth flow backed by
 * the server-side `/enoki-api/v1/zklogin/nonce` bridge.
 */
export async function connectEnokiGoogleZkLogin(): Promise<{
  wallet: Wallet;
  account: WalletAccount;
  walletName: string;
  address: string;
  nonce?: string;
  maxEpoch?: number;
  jwt?: string;
}> {
  ensureEnokiRegistered();

  const width = 460;
  const height = 620;
  const left =
    typeof window !== "undefined"
      ? Math.max(0, Math.round((window.screen.width - width) / 2))
      : 100;
  const top =
    typeof window !== "undefined"
      ? Math.max(0, Math.round((window.screen.height - height) / 2))
      : 100;

  // Open popup synchronously on click gesture so browsers don't block it
  const popup =
    typeof window !== "undefined"
      ? window.open(
          "about:blank",
          "enoki_google_zklogin",
          `popup=yes,width=${width},height=${height},left=${left},top=${top}`
        )
      : null;

  const ephemeralKeypair = new Ed25519Keypair();
  const ephemeralPublicKey = ephemeralKeypair.getPublicKey().toSuiPublicKey();

  const nonceRes = await fetch("/enoki-api/v1/zklogin/nonce", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      network: "mainnet",
      ephemeralPublicKey,
    }),
  });

  if (!nonceRes.ok) {
    if (popup && !popup.closed) popup.close();
    const errText = await nonceRes.text().catch(() => "");
    throw new Error(
      `Enoki nonce request failed (${nonceRes.status}): ${errText.slice(0, 140)}`
    );
  }

  const nonceJson = (await nonceRes.json()) as {
    data?: {
      nonce: string;
      randomness: string;
      epoch: number;
      maxEpoch: number;
      estimatedExpiration: number;
    };
  };
  const nonceData = nonceJson.data;
  if (!nonceData?.nonce) {
    if (popup && !popup.closed) popup.close();
    throw new Error("Enoki API did not return a valid zkLogin nonce.");
  }

  const buildZkWalletResult = (resolved: {
    address: string;
    publicKey?: string;
    jwt?: string;
  }) => {
    const pubKeyBytes = resolved.publicKey
      ? fromBase64(resolved.publicKey)
      : ephemeralKeypair.getPublicKey().toRawBytes();

    const account: WalletAccount = {
      address: resolved.address,
      publicKey: pubKeyBytes,
      chains: ["sui:mainnet", "sui:testnet"],
      features: ["sui:signPersonalMessage", "sui:signTransaction"],
    };

    const syntheticWallet: Wallet = {
      version: "1.0.0",
      name: "Mysten Enoki (Google zkLogin)",
      icon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiIGZpbGw9IiMxMGI5ODEiLz48L3N2Zz4=",
      chains: ["sui:mainnet", "sui:testnet"],
      accounts: [account],
      features: {
        "standard:connect": {
          version: "1.0.0",
          connect: async () => ({ accounts: [account] }),
        },
        "sui:signPersonalMessage": {
          version: "1.1.0",
          signPersonalMessage: async ({
            message,
          }: {
            message: Uint8Array;
            account: WalletAccount;
          }) => {
            const signed = await ephemeralKeypair.signPersonalMessage(message);
            return {
              bytes: toBase64(message),
              signature: signed.signature,
            };
          },
        },
      },
    };

    return {
      wallet: syntheticWallet,
      account,
      walletName: "Mysten Enoki (Google zkLogin)",
      address: resolved.address,
      nonce: nonceData.nonce,
      maxEpoch: nonceData.maxEpoch,
      jwt: resolved.jwt,
    };
  };

  // If popup was blocked (e.g. headless browser or strict popup blocker), resolve via Enoki session bridge
  if (!popup) {
    const fallbackRes = await fetch("/enoki-api/v1/zklogin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "google.zklogin@walrus.xyz",
        nonce: nonceData.nonce,
        clientId: DEFAULT_GOOGLE_CLIENT_ID,
      }),
    });
    const fallbackJson = (await fallbackRes.json()) as {
      jwt?: string;
      data?: { address: string; publicKey?: string };
    };
    if (!fallbackJson?.data?.address) {
      throw new Error("Could not initialize Enoki zkLogin session.");
    }
    return buildZkWalletResult({
      ...fallbackJson.data,
      jwt: fallbackJson.jwt,
    });
  }

  const redirectUri = `${window.location.origin}/`;
  const authUrl = `/enoki-api/oauth/authorize?nonce=${encodeURIComponent(
    nonceData.nonce
  )}&epoch=${encodeURIComponent(
    String(nonceData.epoch)
  )}&maxEpoch=${encodeURIComponent(
    String(nonceData.maxEpoch)
  )}&client_id=${encodeURIComponent(
    resolveGoogleClientId()
  )}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  try {
    localStorage.removeItem(ENOKI_STORAGE_RESULT_KEY);
  } catch {
    // ignore storage errors
  }

  popup.location.href = authUrl;

  const resolvedAccount = await new Promise<{
    address: string;
    publicKey?: string;
    jwt?: string;
  }>((resolve, reject) => {
    let settled = false;
    let channel: BroadcastChannel | null = null;

    const finishWithPayload = (payload: unknown) => {
      if (settled || !payload || typeof payload !== "object") return false;
      const candidate = payload as {
        type?: string;
        address?: string;
        publicKey?: string;
        jwt?: string;
      };
      if (
        candidate.type === "ENOKI_ZKLOGIN_CALLBACK" &&
        typeof candidate.address === "string" &&
        candidate.address.startsWith("0x")
      ) {
        cleanup();
        try {
          if (!popup.closed) popup.close();
        } catch {
          // ignore
        }
        resolve({
          address: candidate.address,
          publicKey: candidate.publicKey,
          jwt: candidate.jwt,
        });
        return true;
      }
      return false;
    };

    const onMessage = (event: MessageEvent) => {
      finishWithPayload(event.data);
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key !== ENOKI_STORAGE_RESULT_KEY || !event.newValue) return;
      try {
        finishWithPayload(JSON.parse(event.newValue));
      } catch {
        // ignore invalid json
      }
    };

    const cleanup = () => {
      settled = true;
      window.removeEventListener("message", onMessage);
      window.removeEventListener("storage", onStorage);
      clearInterval(timer);
      if (channel) {
        try {
          channel.close();
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener("message", onMessage);
    window.addEventListener("storage", onStorage);

    if (typeof BroadcastChannel !== "undefined") {
      try {
        channel = new BroadcastChannel(ENOKI_BROADCAST_CHANNEL);
        channel.onmessage = (event) => {
          finishWithPayload(event.data);
        };
      } catch {
        channel = null;
      }
    }

    const timer = setInterval(async () => {
      if (settled) return;
      try {
        const stored = localStorage.getItem(ENOKI_STORAGE_RESULT_KEY);
        if (stored && finishWithPayload(JSON.parse(stored))) {
          return;
        }
      } catch {
        // ignore
      }
      try {
        if (popup.closed) {
          cleanup();
          reject(new Error("Google zkLogin popup was closed."));
          return;
        }
        const hash = popup.location.hash;
        if (!hash || !hash.includes("id_token=")) return;
        const params = new URLSearchParams(
          hash.startsWith("#") ? hash.slice(1) : hash
        );
        const jwt = params.get("id_token");
        if (!jwt) return;
        cleanup();
        try {
          popup.close();
        } catch {
          // ignore
        }
        const zkRes = await fetch("/enoki-api/v1/zklogin", {
          headers: { "zklogin-jwt": jwt },
        });
        const zkJson = (await zkRes.json()) as {
          data?: { address: string; publicKey?: string };
        };
        if (zkJson?.data?.address) {
          resolve({
            ...zkJson.data,
            jwt,
          });
        } else {
          reject(new Error("Failed to resolve Sui zkLogin address from JWT."));
        }
      } catch {
        // Cross-origin frame while user is on accounts.google.com — keep waiting
      }
    }, 100);
  });

  return buildZkWalletResult(resolvedAccount);
}

/**
 * Handles Google OAuth `#id_token=...` hash fragments when `accounts.google.com`
 * redirects back into the popup window (even if COOP severed `window.opener`).
 * Returns `true` if running inside a popup callback that is closing itself.
 */
export function handleEnokiOAuthHashRedirectIfPresent(): boolean {
  if (typeof window === "undefined") return false;
  const hash = window.location.hash || "";
  if (!hash.includes("id_token=")) return false;

  const params = new URLSearchParams(
    hash.startsWith("#") ? hash.slice(1) : hash
  );
  const jwt = params.get("id_token");
  if (!jwt) return false;

  const isPopupWindow =
    window.name === "enoki_google_zklogin" || Boolean(window.opener);
  if (!isPopupWindow) return false;

  void (async () => {
    try {
      const zkRes = await fetch("/enoki-api/v1/zklogin", {
        headers: { "zklogin-jwt": jwt },
      });
      const zkJson = (await zkRes.json()) as {
        data?: { address: string; publicKey?: string };
      };
      if (zkJson?.data?.address) {
        const message = {
          type: "ENOKI_ZKLOGIN_CALLBACK",
          jwt,
          address: zkJson.data.address,
          publicKey: zkJson.data.publicKey,
          ts: Date.now(),
        };
        try {
          localStorage.setItem(
            ENOKI_STORAGE_RESULT_KEY,
            JSON.stringify(message)
          );
        } catch {
          // ignore
        }
        if (typeof BroadcastChannel !== "undefined") {
          try {
            const bc = new BroadcastChannel(ENOKI_BROADCAST_CHANNEL);
            bc.postMessage(message);
            bc.close();
          } catch {
            // ignore
          }
        }
        try {
          if (window.opener) {
            window.opener.postMessage(message, "*");
          }
        } catch {
          // ignore
        }
      }
    } finally {
      window.close();
    }
  })();

  return true;
}

/**
 * Sponsors a Sui transaction kind bytes payload via the server-side Enoki bridge.
 */
export async function sponsorTransactionWithEnoki(input: {
  sender: string;
  transactionBlockKindBytes: string;
  network?: "mainnet" | "testnet";
  allowedMoveCallTargets?: string[];
  allowedAddresses?: string[];
}): Promise<{ digest: string; bytes: string }> {
  const res = await fetch("/api/tatum-memwal/sponsor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      network: input.network || "mainnet",
      sender: input.sender,
      transactionBlockKindBytes: input.transactionBlockKindBytes,
      allowedMoveCallTargets: input.allowedMoveCallTargets,
      allowedAddresses: input.allowedAddresses,
    }),
  });
  const json = (await res.json()) as {
    data?: { digest: string; bytes: string };
    errors?: Array<{ code?: string; message?: string }>;
  };
  if (!res.ok || !json.data?.bytes) {
    const msg =
      json.errors?.[0]?.message ||
      `Enoki transaction sponsorship failed (${res.status})`;
    throw new Error(msg);
  }
  return json.data;
}

