import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function shortId(value: string, head = 6, tail = 4): string {
  return value.length <= head + tail + 1 ? value : `${value.slice(0, head)}…${value.slice(-tail)}`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Remembers a copy for a moment, so a button can say it worked. */
export function useCopied(): [boolean, (text: string) => Promise<boolean>] {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async (text: string) => {
    const ok = await copyText(text);
    if (ok) {
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    }
    return ok;
  };
  return [copied, copy];
}

/** A long identifier on one line, with its full value in a tooltip and a copy button. */
export function IdPill({ value, label }: { value: string; label?: string }) {
  const [copied, copy] = useCopied();
  return (
    <span className="cc-idpill" title={value} data-testid="id-pill">
      <span className="cc-idpill__text">{shortId(value)}</span>
      <button
        type="button"
        className="cc-idpill__copy"
        aria-label={copied ? "Copied" : `Copy ${label ?? value}`}
        onClick={() => void copy(value)}
      >
        {copied ? <Check size={14} strokeWidth={2} aria-hidden /> : <Copy size={14} strokeWidth={1.75} aria-hidden />}
      </button>
    </span>
  );
}
