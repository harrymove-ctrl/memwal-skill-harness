import { useCallback, useEffect, useRef, useState } from "react";
import { type ActivityEvent, parseReceipts, type RawReceipt } from "./activity";

export type LoadStatus = "loading" | "ready" | "error";

export interface ActivityState {
  status: LoadStatus;
  events: ActivityEvent[];
  /** Set when a refresh failed while older events stay on screen. */
  stale: boolean;
  refresh: () => void;
}

export interface UseActivityOptions {
  limit?: number;
  /** Refresh interval. Polling pauses while the tab is hidden. 0 turns it off. */
  pollMs?: number;
  enabled?: boolean;
}

export function useActivity(namespace: string, options: UseActivityOptions = {}): ActivityState {
  const { limit = 100, pollMs = 30_000, enabled = true } = options;
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [stale, setStale] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const hasDataRef = useRef(false);

  const load = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      const query = new URLSearchParams({ namespace, limit: String(limit) });
      const response = await fetch(`/api/tatum-memwal/activity?${query}`, { signal: controller.signal });
      if (!response.ok) throw new Error(`Activity returned ${response.status}`);
      const json = (await response.json()) as { receipts?: RawReceipt[] };
      if (controller.signal.aborted) return;
      setEvents(parseReceipts(Array.isArray(json.receipts) ? json.receipts : []));
      hasDataRef.current = true;
      setStale(false);
      setStatus("ready");
    } catch {
      if (controller.signal.aborted) return;
      if (hasDataRef.current) setStale(true);
      else setStatus("error");
    }
  }, [namespace, limit]);

  const refresh = useCallback(() => {
    if (!hasDataRef.current) setStatus("loading");
    void load();
  }, [load]);

  useEffect(() => {
    if (!enabled || !namespace) return;
    hasDataRef.current = false;
    setEvents([]);
    setStale(false);
    setStatus("loading");
    void load();

    let timer: ReturnType<typeof setInterval> | undefined;
    if (pollMs > 0) {
      timer = setInterval(() => {
        if (document.visibilityState === "visible") void load();
      }, pollMs);
    }
    return () => {
      if (timer) clearInterval(timer);
      controllerRef.current?.abort();
    };
  }, [enabled, namespace, pollMs, load]);

  return { status, events, stale, refresh };
}
