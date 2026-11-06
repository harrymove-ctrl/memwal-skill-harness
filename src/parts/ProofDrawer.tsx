import { CheckCircle2, ExternalLink, X, XCircle } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { isRealBlobId } from "../hooks/activity";
import { failureStatus, type FrameStatus, StateFrame } from "./StateFrame";
import { IdPill } from "./IdPill";
import "./parts.css";

interface ProofData {
  bucket?: { id: string; url: string; files: { id: string; label: string }[] };
  blobs?: { id: string; label: string; url: string }[];
  memoryCount?: number | null;
  account?: {
    id: string;
    url: string;
    owner: string;
    active: boolean;
    keys: { address: string; label: string }[];
  } | null;
  transactions?: { digest: string; label: string; ok: boolean | null; url: string }[];
  source?: string;
  readAt?: string;
}

function Section({ title, meta, children }: { title: string; meta?: string; children: ReactNode }) {
  return (
    <section className="cc-proof__section">
      <h3 className="cc-proof__title">{title}</h3>
      {meta && <p className="cc-meta" style={{ margin: "0 0 8px" }}>{meta}</p>}
      {children}
    </section>
  );
}

function ProofRow({ label, value, href, trailing }: { label: string; value: string; href?: string; trailing?: ReactNode }) {
  return (
    <div className="cc-proof__row" data-testid="proof-row">
      <span className="cc-proof__label" title={label}>{label}</span>
      {trailing}
      <IdPill value={value} label={label} />
      {href && (
        <a className="cc-icon-btn" href={href} target="_blank" rel="noreferrer" aria-label={`Open ${label}`}>
          <ExternalLink size={14} strokeWidth={1.75} aria-hidden />
        </a>
      )}
    </div>
  );
}

export interface ProofDrawerProps {
  namespace: string;
  onClose: () => void;
}

/** Where the hashes live, so the rest of the app never has to show them. */
export function ProofDrawer({ namespace, onClose }: ProofDrawerProps) {
  const [status, setStatus] = useState<FrameStatus>("loading");
  const [proof, setProof] = useState<ProofData>({});
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus("loading");
    try {
      const response = await fetch(`/api/ns/${encodeURIComponent(namespace)}/proof`, { signal: controller.signal });
      if (!response.ok) throw new Error(`Proof returned ${response.status}`);
      const json = (await response.json()) as ProofData;
      if (controller.signal.aborted) return;
      setProof(json);
      setStatus("ready");
    } catch {
      if (!controller.signal.aborted) setStatus(failureStatus());
    }
  }, [namespace]);

  useEffect(() => {
    void load();
    return () => controllerRef.current?.abort();
  }, [load]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => opener?.focus?.();
  }, []);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const items = panelRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
    if (!items?.length) return;
    const first = items[0]!;
    const last = items[items.length - 1]!;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const blobs = (proof.blobs ?? []).filter((blob) => isRealBlobId(blob.id));
  const account = proof.account;

  return (
    <div className="cc-proof" onKeyDown={onKeyDown} data-testid="proof-drawer">
      <div className="cc-proof__scrim" onClick={onClose} aria-hidden />
      <div ref={panelRef} className="cc-proof__panel" role="dialog" aria-modal="true" aria-labelledby="cc-proof-heading">
        <div className="cc-proof__head">
          <h2 id="cc-proof-heading" className="cc-card__title">Proof</h2>
          <button ref={closeRef} type="button" className="cc-icon-btn" aria-label="Close proof" onClick={onClose} data-testid="proof-close">
            <X size={16} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
        <div className="cc-proof__body">
          <StateFrame
            status={status}
            onRetry={() => void load()}
            skeletonRows={6}
            errorText="Proof did not load. Your skills and rules are unaffected."
          >
            <Section title="Memories on mainnet">
              <p className="cc-metric" style={{ margin: 0 }} data-testid="proof-count">
                {proof.memoryCount == null ? "Not available" : proof.memoryCount.toLocaleString("en-US")}
              </p>
            </Section>

            <Section title="Sui account" meta={proof.source ? `Read through the ${proof.source}` : undefined}>
              {account ? (
                <>
                  <ProofRow label="Account" value={account.id} href={account.url} />
                  <ProofRow label="Owner" value={account.owner} />
                  {account.keys.map((key) => (
                    <ProofRow key={key.address} label={key.label || "Agent key"} value={key.address} />
                  ))}
                </>
              ) : (
                <p className="cc-meta" style={{ margin: 0 }} data-testid="proof-no-account">
                  Tatum could not read the account just now. Nothing here is assumed.
                </p>
              )}
            </Section>

            <Section title="Transactions">
              {proof.transactions?.length ? (
                proof.transactions.map((tx) => (
                  <ProofRow
                    key={tx.digest}
                    label={tx.label}
                    value={tx.digest}
                    href={tx.url}
                    trailing={
                      tx.ok === true ? (
                        <CheckCircle2 size={14} strokeWidth={1.75} className="cc-proof__ok" aria-label="Succeeded" />
                      ) : tx.ok === false ? (
                        <XCircle size={14} strokeWidth={1.75} className="cc-proof__bad" aria-label="Failed" />
                      ) : null
                    }
                  />
                ))
              ) : (
                <p className="cc-meta" style={{ margin: 0 }}>None recorded for this space.</p>
              )}
            </Section>

            <Section title="Rules on Walrus">
              {blobs.length ? (
                blobs.map((blob) => <ProofRow key={blob.id} label={blob.label} value={blob.id} href={blob.url} />)
              ) : (
                <p className="cc-meta" style={{ margin: 0 }} data-testid="proof-no-blobs">
                  No rule has a confirmed Walrus record yet.
                </p>
              )}
            </Section>

            {proof.bucket && (
              <Section title="Skill files on Walrus Console">
                <ProofRow label="Storage" value={proof.bucket.id} href={proof.bucket.url} />
                {proof.bucket.files.map((file) => (
                  <ProofRow key={file.id} label={file.label} value={file.id} />
                ))}
              </Section>
            )}
          </StateFrame>
        </div>
      </div>
    </div>
  );
}
