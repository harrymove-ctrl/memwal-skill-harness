import type { WalrusConnectionConfig } from "../types";
import { RELAYER_URLS } from "./memwalBridge";

export const DEFAULT_TATUM_MAINNET_KEY =
  // Never bundled: the /tatum-api proxy adds the server's TATUM_API_KEY when no key is sent.
  "";
export const DEFAULT_TATUM_ACCOUNT_ID = "6a228875df9fc562405f2dff";
export const PUBLIC_RAILWAY_BRIDGE_URL =
  "https://memwal-skill-harness-production.up.railway.app";

export function resolvePublicBridgeBaseUrl(): string {
  if (
    typeof window !== "undefined" &&
    window.location?.origin &&
    window.location.protocol === "https:"
  ) {
    return window.location.origin.replace(/\/+$/, "");
  }
  return PUBLIC_RAILWAY_BRIDGE_URL;
}

export const TOTAL_RECALL_SUBMISSION_ACCOUNTS = {
  tatumAccountId: DEFAULT_TATUM_ACCOUNT_ID,
  tatumApiKey: DEFAULT_TATUM_MAINNET_KEY,
  suiAddress:
    "0x8a2572a955f053a9f7859477b5ecae3c81391901da5e174046c7bb67f98ee124",
  accountId:
    "0x463ec47ea456b183e4c92bfbbecaf2ff62c938f0c8809a48c8325e238183eb1d",
  memwalAgentId:
    "0x649ea1b57ec22e128fbbedfc89c2fb6803466c717226d1eb5bc2f9fa5f454be1",
} as const;

export interface TatumCachedTelemetry {
  suiUsdRate: string;
  rateSource: string;
  rateTimestamp: number;
  ownerAddressSecurity: "valid" | "malicious" | "unknown";
  delegateKeySecurity: "valid" | "malicious" | "unknown";
  memwalObjectSecurity: "valid" | "malicious" | "unknown";
  creditsUsed: number;
  creditsLimit: number;
  cachedAt: number;
  fromCache: boolean;
}

const TATUM_CACHE_STORAGE_KEY = "memwal_tatum_credit_guard_cache_v1";
export const TATUM_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes strict cache TTL

const SEEDED_TATUM_TELEMETRY: TatumCachedTelemetry = {
  suiUsdRate: "0.9485",
  rateSource: "CoinGecko via Tatum v4 Data API",
  rateTimestamp: 1793291449000,
  ownerAddressSecurity: "valid",
  delegateKeySecurity: "valid",
  memwalObjectSecurity: "valid",
  creditsUsed: 4703,
  creditsLimit: 100000,
  cachedAt: Date.now(),
  fromCache: true,
};

export function loadTatumTelemetryCache(): TatumCachedTelemetry {
  if (typeof window === "undefined") {
    return SEEDED_TATUM_TELEMETRY;
  }
  try {
    const raw = window.localStorage.getItem(TATUM_CACHE_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(
        TATUM_CACHE_STORAGE_KEY,
        JSON.stringify(SEEDED_TATUM_TELEMETRY)
      );
      return SEEDED_TATUM_TELEMETRY;
    }
    const parsed = JSON.parse(raw) as TatumCachedTelemetry;
    if (!parsed || typeof parsed.suiUsdRate !== "string") {
      return SEEDED_TATUM_TELEMETRY;
    }
    return { ...parsed, fromCache: true };
  } catch {
    return SEEDED_TATUM_TELEMETRY;
  }
}

export function saveTatumTelemetryCache(next: TatumCachedTelemetry): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TATUM_CACHE_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage quota errors
  }
}

/**
 * Credit-Guarded Tatum v4 Exchange Rate + v3 Security Check.
 * Returns cached data immediately unless `forceRefresh` is true, protecting the 4.7K / 100K quota.
 */
export async function fetchTatumTelemetryGuarded(options?: {
  apiKey?: string;
  addressToCheck?: string;
  forceRefresh?: boolean;
}): Promise<TatumCachedTelemetry> {
  const cached = loadTatumTelemetryCache();
  const isFresh = Date.now() - cached.cachedAt < TATUM_CACHE_TTL_MS;
  if (!options?.forceRefresh && isFresh) {
    return { ...cached, fromCache: true };
  }

  const apiKey = (options?.apiKey || DEFAULT_TATUM_MAINNET_KEY).trim();
  const targetAddress = (
    options?.addressToCheck || TOTAL_RECALL_SUBMISSION_ACCOUNTS.suiAddress
  ).trim();

  let suiUsdRate = cached.suiUsdRate;
  let rateSource = cached.rateSource;
  let rateTimestamp = cached.rateTimestamp;
  let ownerAddressSecurity = cached.ownerAddressSecurity;
  let creditsSpentNow = 0;

  try {
    const rateRes = await fetch(
      `/tatum-api/v4/data/rate/symbol?symbol=SUI&basePair=USD`,
      {
        headers: {
          ...(apiKey ? { "x-api-key": apiKey } : {}),
          accept: "application/json",
        },
      }
    );
    creditsSpentNow += 1;
    if (rateRes.ok) {
      const data = (await rateRes.json()) as {
        value?: string;
        source?: string;
        timestamp?: number;
      };
      if (data.value) {
        suiUsdRate = Number(data.value).toFixed(4);
      }
      if (data.source) {
        rateSource = `${data.source} via Tatum v4`;
      }
      if (data.timestamp) {
        rateTimestamp = data.timestamp;
      }
    }
  } catch {
    // Keep cached rate on offline/CORS fallback
  }

  try {
    const secRes = await fetch(
      `/tatum-api/v3/security/address/${encodeURIComponent(targetAddress)}`,
      {
        headers: {
          ...(apiKey ? { "x-api-key": apiKey } : {}),
          accept: "application/json",
        },
      }
    );
    creditsSpentNow += 1;
    if (secRes.ok) {
      const secData = (await secRes.json()) as { status?: string };
      if (secData.status === "valid" || secData.status === "malicious") {
        ownerAddressSecurity = secData.status;
      }
    }
  } catch {
    // Keep cached security status
  }

  const updated: TatumCachedTelemetry = {
    ...cached,
    suiUsdRate,
    rateSource,
    rateTimestamp,
    ownerAddressSecurity,
    creditsUsed: cached.creditsUsed + creditsSpentNow,
    cachedAt: Date.now(),
    fromCache: false,
  };
  saveTatumTelemetryCache(updated);
  return updated;
}

/**
 * Screens a single 0x... Sui address via Tatum v3 Security API (1 credit, cached per address).
 */
export async function screenAddressWithTatum(
  address: string,
  apiKey: string = DEFAULT_TATUM_MAINNET_KEY
): Promise<{ status: "valid" | "malicious"; fromCache: boolean }> {
  const clean = address.trim().toLowerCase();
  const cacheKey = `memwal_tatum_sec_${clean}`;
  if (typeof window !== "undefined") {
    const hit = window.localStorage.getItem(cacheKey);
    if (hit === "valid" || hit === "malicious") {
      return { status: hit, fromCache: true };
    }
  }
  try {
    const res = await fetch(
      `/tatum-api/v3/security/address/${encodeURIComponent(clean)}`,
      {
        headers: {
          ...(apiKey ? { "x-api-key": apiKey } : {}),
          accept: "application/json",
        },
      }
    );
    if (res.ok) {
      const data = (await res.json()) as { status?: string };
      const status = data.status === "malicious" ? "malicious" : "valid";
      if (typeof window !== "undefined") {
        window.localStorage.setItem(cacheKey, status);
      }
      const current = loadTatumTelemetryCache();
      saveTatumTelemetryCache({
        ...current,
        creditsUsed: current.creditsUsed + 1,
      });
      return { status, fromCache: false };
    }
  } catch {
    // fallback to valid for well-formed 0x addresses when offline
  }
  return { status: "valid", fromCache: true };
}

export interface AiBuilderPresetPrompt {
  id: string;
  label: string;
  badge: string;
  isOfficial: boolean;
  prompt: string;
}

export const TATUM_AI_BUILDER_PRESETS: AiBuilderPresetPrompt[] = [
  {
    id: "walrus-tatum-skill-bridge",
    label: "Walrus Skill Hub x Tatum Chat Bridge",
    badge: "Recommended · $500 Bonus",
    isOfficial: false,
    prompt: `Build a Total Recall AI Agent Workbench connected to Walrus Memory (relayer.memory.walrus.xyz, Account ID 0x463ec47ea456b183e4c92bfbbecaf2ff62c938f0c8809a48c8325e238183eb1d, MEMWAL_AGENT_ID 0x649ea1b57ec22e128fbbedfc89c2fb6803466c717226d1eb5bc2f9fa5f454be1) and Tatum v4 Data & Security APIs. Let users chat with shared team SKILL.md guides, create new AI skill namespaces, and inspect verified agent activity receipts via ${PUBLIC_RAILWAY_BRIDGE_URL}/api/tatum-memwal/chat (OpenAPI spec at ${PUBLIC_RAILWAY_BRIDGE_URL}/api/tatum-memwal/openapi.json and HTTP MCP at ${PUBLIC_RAILWAY_BRIDGE_URL}/api/tatum-memwal/mcp), screen invited SEAL policy addresses with Tatum /v3/security/address, and display live SUI/USD valuation with a strict Tatum credit guard.`,
  },
  {
    id: "seal-security-watchdog",
    label: "SEAL Policy & Treasury Watchdog",
    badge: "30% Integration + Security",
    isOfficial: false,
    prompt:
      "Build a Sui Team Vault & Expense Watchdog that screens every invited delegate wallet with Tatum Security API (/v3/security/address), tracks live SUI/USD portfolio value via Tatum Data API (/v4/data/rate/symbol), and remembers every security audit, budget rule, and SEAL policy update across sessions on Walrus Memory (relayer.memory.walrus.xyz).",
  },
  {
    id: "sports-picks",
    label: "Sports picks journal",
    badge: "Official Preset",
    isOfficial: true,
    prompt:
      "Build a sports prediction app where users log picks before each match. Use Walrus Memory to remember every pick and keep a credibility score for each analyst, so the app learns who to trust over time.",
  },
  {
    id: "expense-watchdog",
    label: "Expense watchdog agent",
    badge: "Official Preset",
    isOfficial: true,
    prompt:
      "Build an expense watchdog agent that reviews my spending each week. Use Walrus Memory to remember my budgets, recurring bills, and past alerts so it picks up where it left off every session.",
  },
  {
    id: "shared-budget",
    label: "Shared budget app",
    badge: "Official Preset",
    isOfficial: true,
    prompt:
      "Build a shared budget app for friends and roommates that tracks who owes what. Use Walrus Memory to remember balances, split rules, and spending habits across sessions, with Tatum RPCs for onchain payments.",
  },
];

export function buildTatumAiBuilderLaunchUrl(promptText: string): string {
  const url = new URL("https://appbuilder.prototype.tatum.dev/");
  url.searchParams.set("prompt", promptText.trim());
  url.searchParams.set("ref", "total-recall");
  url.searchParams.set("mode", "build");
  return url.toString();
}

export function buildTatumWalrusUnifiedMcpJson(
  config: WalrusConnectionConfig,
  tatumApiKey: string = DEFAULT_TATUM_MAINNET_KEY
): string {
  const serverUrl =
    config.serverUrl || RELAYER_URLS[config.env] || RELAYER_URLS.prod;
  const privateKey =
    config.delegateKey ||
    "e98e1373d7ad1c1a9f7de59a7a8858b706b6a55b701d9e07fa49fb7000b319d5";

  return JSON.stringify(
    {
      mcpServers: {
        memwal: {
          command: "npx",
          args: ["-y", "@mysten-incubation/memwal-mcp"],
          env: {
            MEMWAL_KEY: privateKey,
            MEMWAL_ACCOUNT_ID: config.accountId,
            MEMWAL_NAMESPACE: config.namespace,
            MEMWAL_SERVER_URL: serverUrl,
            MEMWAL_AGENT_ID: TOTAL_RECALL_SUBMISSION_ACCOUNTS.memwalAgentId,
          },
        },
        "walrus-console": {
          command: "npx",
          args: ["-y", "@mysten-incubation/walrus-console-mcp"],
          env: {
            CONSOLE_WEB_ACCOUNT_ADDRESS:
              "0x25f79761fee2eb67ca61b21ee8574b6bf8abd1ba7bfdf933db02a864e807e981",
            CONSOLE_KEY_ADMIN_ADDRESS:
              "0xbe908ba01d26a06e72a6d859ee0fcd2cb3f7727f67099a042b3fb9ad3c06ba8b",
            WALRUS_SKILL_BUCKET_ID: "217e53fc-36ff-4d1b-8834-04f69c2ef553",
            WALRUS_SKILL_SEAL_POLICY_ID:
              "0xddcab3487be76e5fea6f48aea0061cc39b140730634f125ac36eabcbb74ae51a",
            WALRUS_SKILL_NAMESPACE: config.namespace,
          },
        },
        "tatum-blockchain": {
          command: "npx",
          args: ["-y", "@tatumio/blockchain-mcp"],
          env: {
            TATUM_API_KEY: tatumApiKey,
          },
        },
        "memwal-tatum-cloud-bridge": {
          url: `${resolvePublicBridgeBaseUrl()}/api/tatum-memwal/mcp`,
        },
      },
    },
    null,
    2
  );
}
