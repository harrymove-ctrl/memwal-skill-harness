import type { ReactNode } from "react";
import { Notice, SkeletonRows } from "./index";

export type FrameStatus = "loading" | "empty" | "error" | "offline" | "ready";

export interface StateFrameProps {
  status: FrameStatus;
  /** Says what failed and that the person's data is unaffected. */
  errorText: string;
  empty?: ReactNode;
  onRetry?: () => void;
  skeletonRows?: number;
  children: ReactNode;
}

/** Why a load failed, in the one way the screen can tell: is the browser online at all? */
export function failureStatus(): "error" | "offline" {
  return typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : "error";
}

/** The states every list and panel shares, so each one looks and reads the same. */
export function StateFrame({ status, errorText, empty, onRetry, skeletonRows = 3, children }: StateFrameProps) {
  if (status === "loading") return <SkeletonRows count={skeletonRows} />;
  if (status === "offline") {
    return (
      <Notice tone="warn" onRetry={onRetry} testId="state-offline">
        You look offline. Reconnect, then retry.
      </Notice>
    );
  }
  if (status === "error") {
    return (
      <Notice tone="danger" onRetry={onRetry} testId="state-error">
        {errorText}
      </Notice>
    );
  }
  if (status === "empty") return <div data-testid="state-empty">{empty}</div>;
  return <>{children}</>;
}
