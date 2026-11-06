import { useCallback, useEffect, useState } from "react";

export type SessionStatus = "loading" | "signedOut" | "signedIn";

export interface WalletOption {
  name: string;
  icon?: string;
}

export interface SessionState {
  status: SessionStatus;
  address: string | null;
  /** Set while a wallet is open, so a second click cannot start another sign in. */
  signingIn: boolean;
  error: string | null;
  listWallets: () => Promise<WalletOption[]>;
  signIn: (walletName?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const REJECTED = /reject|denied|cancel|closed/i;

/** Plain words for what a wallet throws, which is written for developers. */
export function signInErrorMessage(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error ?? "");
  if (REJECTED.test(text)) return "You closed the wallet before signing. Nothing changed.";
  if (/no sui browser wallet/i.test(text)) return "No Sui wallet found in this browser. Install Slush, then try again.";
  if (/did not match|not one this site|another site|expired|already used/i.test(text)) return text;
  return "Sign in did not finish. Please try again.";
}

async function postJson(path: string, body: unknown): Promise<Record<string, unknown>> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) throw new Error(String(json.error ?? `Request failed with ${response.status}`));
  return json;
}

/** The signed in wallet. The cookie itself is HttpOnly, so this only ever holds the address. */
export function useSession(): SessionState {
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [address, setAddress] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/session", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : { address: null }))
      .then((json: { address?: string | null }) => {
        setAddress(json.address ?? null);
        setStatus(json.address ? "signedIn" : "signedOut");
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus("signedOut");
      });
    return () => controller.abort();
  }, []);

  const listWallets = useCallback(async (): Promise<WalletOption[]> => {
    // Loaded on demand: the wallet code is large and most visitors start with the demo.
    const { getInstalledBrowserWallets } = await import("../lib/walletAuth");
    return getInstalledBrowserWallets()
      .filter((wallet) => !/enoki|zklogin/i.test(wallet.name))
      .map((wallet) => ({ name: wallet.name, icon: wallet.icon }));
  }, []);

  const signIn = useCallback(
    async (walletName?: string) => {
      if (signingIn) return false;
      setSigningIn(true);
      setError(null);
      try {
        const { connectSlushOrBrowserWallet } = await import("../lib/walletAuth");
        const { wallet, account, address: walletAddress } = await connectSlushOrBrowserWallet(walletName);
        const challenge = await postJson("/api/auth/challenge", { address: walletAddress });
        const feature = wallet.features["sui:signPersonalMessage"] as
          | {
              signPersonalMessage: (input: {
                message: Uint8Array;
                account: typeof account;
                chain?: `${string}:${string}`;
              }) => Promise<{ signature: string }>;
            }
          | undefined;
        if (!feature) throw new Error(`${wallet.name} cannot sign messages.`);
        const message = String(challenge.message);
        const { signature } = await feature.signPersonalMessage({
          message: new TextEncoder().encode(message),
          account,
          chain: "sui:mainnet",
        });
        const session = await postJson("/api/auth/session", { message, signature });
        setAddress(String(session.address));
        setStatus("signedIn");
        return true;
      } catch (err) {
        setError(signInErrorMessage(err));
        return false;
      } finally {
        setSigningIn(false);
      }
    },
    [signingIn]
  );

  const signOut = useCallback(async () => {
    await fetch("/api/auth/session", { method: "DELETE" }).catch(() => undefined);
    setAddress(null);
    setStatus("signedOut");
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { status, address, signingIn, error, listWallets, signIn, signOut, clearError };
}
