import { Wallet, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { SessionState, WalletOption } from "../hooks/useSession";
import { Notice, SkeletonRows } from "../parts";
import { Button } from "../shell/Button";
import { LogoMark } from "../shell/Logo";
import "./places.css";

export interface SignInDialogProps {
  session: SessionState;
  note?: string;
  onClose: () => void;
  onSignedIn?: () => void;
}

/** Signing costs nothing: the wallet signs a message and sends no transaction. */
export function SignInDialog({ session, note, onClose, onSignedIn }: SignInDialogProps) {
  const [wallets, setWallets] = useState<WalletOption[] | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const { listWallets, clearError } = session;

  useEffect(() => {
    let active = true;
    listWallets()
      .then((found) => {
        if (active) setWallets(found);
      })
      .catch(() => {
        if (active) setWallets([]);
      });
    return () => {
      active = false;
    };
  }, [listWallets]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => {
      clearError();
      opener?.focus?.();
    };
  }, [clearError]);

  const signIn = async (name: string) => {
    if (await session.signIn(name)) {
      onSignedIn?.();
      onClose();
    }
  };

  return (
    <div
      className="cc-proof cc-signin"
      data-testid="signin-dialog"
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <div className="cc-proof__scrim" onClick={onClose} aria-hidden />
      <div className="cc-signin__panel" role="dialog" aria-modal="true" aria-labelledby="cc-signin-heading">
        <div className="cc-proof__head">
          <h2 id="cc-signin-heading" className="cc-card__title" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <LogoMark size={20} glint className="cc-brand__mark" />
            Sign in
          </h2>
          <button ref={closeRef} type="button" className="cc-icon-btn" aria-label="Close sign in" onClick={onClose}>
            <X size={16} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          <p style={{ margin: 0, color: "var(--cc-ink-2)" }}>
            {note ?? "Your wallet signs one message to prove it is you. It costs nothing and sends no transaction."}
          </p>
          {session.error && <Notice tone="danger" testId="signin-error">{session.error}</Notice>}
          {wallets === null && <SkeletonRows count={1} />}
          {wallets?.length === 0 && (
            <Notice tone="warn" testId="signin-no-wallet">
              No Sui wallet found in this browser. Install{" "}
              <a className="cc-link" href="https://slush.app" target="_blank" rel="noreferrer">Slush</a>, then reload this page.
            </Notice>
          )}
          {wallets?.map((wallet) => (
            <Button
              key={wallet.name}
              className="cc-signin__wallet"
              disabled={session.signingIn}
              data-testid="signin-wallet"
              onClick={() => void signIn(wallet.name)}
            >
              {wallet.icon ? <img src={wallet.icon} alt="" width={20} height={20} /> : <Wallet size={16} strokeWidth={1.75} aria-hidden />}
              {session.signingIn ? "Waiting for your wallet" : wallet.name}
            </Button>
          ))}
          <Button
            className="cc-signin__wallet"
            disabled={session.signingIn}
            data-testid="signin-enoki"
            onClick={() => void signIn("enoki")}
          >
            <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden="true" style={{ flex: "none" }}>
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29a11.99 11.99 0 0 0 0 10.76l3.98-3.09Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96Z"
              />
            </svg>
            {session.signingIn ? "Waiting for Google zkLogin" : "Google (Mysten Enoki zkLogin)"}
          </Button>
        </div>
      </div>
    </div>
  );
}
