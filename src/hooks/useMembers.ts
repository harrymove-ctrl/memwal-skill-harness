import { useCallback, useEffect, useRef, useState } from "react";
import type { LoadStatus } from "./useActivity";

export type AccessRole = "owner" | "read-write" | "read-only";
export type Verification = "owner" | "key" | "pending" | "unknown";

export interface Member {
  handle: string;
  suiAddress: string;
  role: AccessRole;
  addedAt: string | null;
  verification: Verification;
}

export interface Caller {
  address: string;
  handle: string | null;
  /** Null for someone signed in who is not a member of this space. */
  role: AccessRole | null;
}

export type AddOutcome =
  | { status: "added"; verdict: string; address: string }
  | { status: "refused"; code: string; message: string };

export interface InviteLink {
  token: string;
  expiresAt: number;
}

export interface MembersState {
  status: LoadStatus;
  members: Member[];
  you: Caller | null;
  accountRead: boolean;
  refresh: () => void;
  add: (address: string, role: AccessRole, acceptUnchecked?: boolean) => Promise<AddOutcome>;
  setRole: (address: string, role: AccessRole) => Promise<string | null>;
  remove: (address: string) => Promise<string | null>;
  invite: (role: AccessRole) => Promise<InviteLink | null>;
}

export const ROLE_LABELS: Record<AccessRole, string> = {
  owner: "Owner",
  "read-write": "Editor",
  "read-only": "Viewer",
};

export function useMembers(namespace: string): MembersState {
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [members, setMembers] = useState<Member[]>([]);
  const [you, setYou] = useState<Caller | null>(null);
  const [accountRead, setAccountRead] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const base = `/api/ns/${encodeURIComponent(namespace)}`;

  const load = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus((current) => (current === "ready" ? current : "loading"));
    try {
      const response = await fetch(`${base}/members`, { signal: controller.signal });
      if (!response.ok) throw new Error(`Members returned ${response.status}`);
      const json = (await response.json()) as { members?: Member[]; you?: Caller | null; accountRead?: boolean };
      if (controller.signal.aborted) return;
      setMembers(Array.isArray(json.members) ? json.members : []);
      setYou(json.you ?? null);
      setAccountRead(Boolean(json.accountRead));
      setStatus("ready");
    } catch {
      if (!controller.signal.aborted) setStatus("error");
    }
  }, [base]);

  useEffect(() => {
    if (!namespace) return;
    setStatus("loading");
    void load();
    return () => controllerRef.current?.abort();
  }, [namespace, load]);

  const post = useCallback(
    async (path: string, body: unknown, method = "POST") => {
      const response = await fetch(`${base}${path}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      return { ok: response.ok, json };
    },
    [base]
  );

  const add = useCallback(
    async (address: string, role: AccessRole, acceptUnchecked = false): Promise<AddOutcome> => {
      try {
        const { ok, json } = await post("/members", { address, role, acceptUnchecked });
        if (!ok) {
          return {
            status: "refused",
            code: String(json.code ?? "failed"),
            message: String(json.error ?? "That did not work. Please try again."),
          };
        }
        if (Array.isArray(json.members)) setMembers(json.members as Member[]);
        const check = (json.check ?? {}) as { verdict?: string; address?: string };
        return { status: "added", verdict: String(check.verdict ?? "unknown"), address: String(check.address ?? address) };
      } catch {
        return { status: "refused", code: "network", message: "Could not reach the server. Please try again." };
      }
    },
    [post]
  );

  const change = useCallback(
    async (path: string, body: unknown, method: string): Promise<string | null> => {
      try {
        const { ok, json } = await post(path, body, method);
        if (!ok) return String(json.error ?? "That did not work. Please try again.");
        if (Array.isArray(json.members)) setMembers(json.members as Member[]);
        return null;
      } catch {
        return "Could not reach the server. Please try again.";
      }
    },
    [post]
  );

  const setRole = useCallback(
    (address: string, role: AccessRole) => change(`/members/${encodeURIComponent(address)}/role`, { role }, "POST"),
    [change]
  );

  const remove = useCallback(
    (address: string) => change(`/members/${encodeURIComponent(address)}`, undefined, "DELETE"),
    [change]
  );

  const invite = useCallback(
    async (role: AccessRole): Promise<InviteLink | null> => {
      try {
        const { ok, json } = await post("/invites", { role });
        return ok ? { token: String(json.token), expiresAt: Number(json.expiresAt) } : null;
      } catch {
        return null;
      }
    },
    [post]
  );

  return { status, members, you, accountRead, refresh: () => void load(), add, setRole, remove, invite };
}
