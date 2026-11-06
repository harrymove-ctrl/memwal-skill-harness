import { Wallet, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { SessionState, WalletOption } from "../hooks/useSession";
import { Notice, SkeletonRows } from "../parts";
import { Button } from "../shell/Button";
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
          <h2 id="cc-signin-heading" className="cc-card__title">Sign in</h2>
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
        </div>
      </div>
    </div>
  );
}
