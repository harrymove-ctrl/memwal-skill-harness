import { useCallback, useEffect, useRef, useState } from "react";
import { isRealBlobId } from "./activity";
import type { LoadStatus } from "./useActivity";

export interface Access {
  /** The signed in member's handle or address. */
  caller?: string;
  readOnly?: boolean;
}

export function accessHeaders(access: Access = {}): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (access.caller) headers["X-MemWal-Caller-Address"] = access.caller;
  headers["X-MemWal-Access-Role"] = access.readOnly ? "read-only" : "read-write";
  return headers;
}

export interface Rule {
  ruleId: string;
  skillId: string;
  text: string;
  state: "on" | "off";
  author: string;
  updatedAt: string;
  rev: number;
  /** A real Walrus blob backs this rule; false while the id is the server's placeholder. */
  onWalrus: boolean;
}

interface RawRule {
  ruleId?: string;
  id?: string;
  skillId?: string;
  text?: string;
  rule?: string;
  state?: string;
  author?: string;
  updatedAt?: string;
  rev?: number;
  blobId?: string;
  memoryBlobId?: string;
}

function toRule(raw: RawRule): Rule {
  return {
    ruleId: String(raw.ruleId ?? raw.id ?? ""),
    skillId: String(raw.skillId ?? ""),
    text: String(raw.text ?? raw.rule ?? ""),
    state: raw.state === "off" ? "off" : "on",
    author: String(raw.author ?? ""),
    updatedAt: String(raw.updatedAt ?? ""),
    rev: Number(raw.rev ?? 1),
    onWalrus: isRealBlobId(raw.memoryBlobId ?? raw.blobId),
  };
}

export interface RuleError {
  ruleId: string | null;
  message: string;
}

export interface RulesState {
  status: LoadStatus;
  rules: Rule[];
  /** Rules with a request in flight; their controls stay disabled. */
  pending: ReadonlySet<string>;
  error: RuleError | null;
  clearError: () => void;
  refresh: () => void;
  add: (skillId: string, text: string) => Promise<boolean>;
  edit: (rule: Rule, text: string) => Promise<boolean>;
  setOn: (rule: Rule, on: boolean) => Promise<boolean>;
  remove: (rule: Rule) => Promise<boolean>;
  /** Writes the rule into the SKILL.md as a new revision and turns the rule off. */
  bake: (rule: Rule) => Promise<boolean>;
}

const ADDING = "__adding__";

async function send(url: string, method: string, body: unknown, access: Access): Promise<Record<string, unknown>> {
  const response = await fetch(url, { method, headers: accessHeaders(access), body: JSON.stringify(body) });
  const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok || json.ok === false) {
    throw new Error(typeof json.error === "string" ? json.error : `The server returned ${response.status}`);
  }
  return json;
}

function friendly(error: unknown, fallback: string): string {
  if (error instanceof TypeError) return `${fallback} You look offline.`;
  if (error instanceof Error && /read-only|allowlist/i.test(error.message)) {
    return `${fallback} Your role cannot change this space.`;
  }
  return fallback;
}

export function useRules(namespace: string, access: Access = {}): RulesState {
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [rules, setRules] = useState<Rule[]>([]);
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());
  const [error, setError] = useState<RuleError | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const pendingRef = useRef(new Set<string>());
  const accessRef = useRef(access);
  accessRef.current = access;

  const base = `/api/ns/${encodeURIComponent(namespace)}/rules`;

  const load = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus((current) => (current === "ready" ? current : "loading"));
    try {
      const response = await fetch(base, { signal: controller.signal });
      if (!response.ok) throw new Error(`Rules returned ${response.status}`);
      const json = (await response.json()) as { rules?: RawRule[] };
      if (controller.signal.aborted) return;
      setRules((Array.isArray(json.rules) ? json.rules : []).map(toRule));
      setStatus("ready");
    } catch {
      if (!controller.signal.aborted) setStatus("error");
    }
  }, [base]);

  useEffect(() => {
    if (!namespace) return;
    setRules([]);
    setError(null);
    setStatus("loading");
    pendingRef.current = new Set();
    setPending(new Set());
    void load();
    return () => controllerRef.current?.abort();
  }, [namespace, load]);

  /** One request per rule at a time, so rapid clicks cannot race each other. */
  const run = useCallback(async (key: string, ruleId: string | null, failure: string, task: () => Promise<void>) => {
    if (pendingRef.current.has(key)) return false;
    pendingRef.current.add(key);
    setPending(new Set(pendingRef.current));
    setError(null);
    try {
      await task();
      return true;
    } catch (caught) {
      setError({ ruleId, message: friendly(caught, failure) });
      return false;
    } finally {
      pendingRef.current.delete(key);
      setPending(new Set(pendingRef.current));
    }
  }, []);

  const add = useCallback(
    (skillId: string, text: string) =>
      run(ADDING, null, "The rule was not saved. Your text is still here.", async () => {
        const json = await send(base, "POST", { skillId, text, author: accessRef.current.caller }, accessRef.current);
        const saved = toRule((json.rule ?? {}) as RawRule);
        setRules((current) => [saved, ...current.filter((rule) => rule.ruleId !== saved.ruleId)]);
      }),
    [base, run],
  );

  const edit = useCallback(
    (rule: Rule, text: string) =>
      run(rule.ruleId, rule.ruleId, "The change was not saved. The rule is unchanged.", async () => {
        const json = await send(
          base,
          "POST",
          { ruleId: rule.ruleId, skillId: rule.skillId, text, author: accessRef.current.caller },
          accessRef.current,
        );
        const saved = toRule((json.rule ?? {}) as RawRule);
        setRules((current) => current.map((item) => (item.ruleId === rule.ruleId ? saved : item)));
      }),
    [base, run],
  );

  const setOn = useCallback(
    (rule: Rule, on: boolean) =>
      run(rule.ruleId, rule.ruleId, `The rule was not turned ${on ? "on" : "off"}.`, async () => {
        const next = on ? "on" : "off";
        setRules((current) => current.map((item) => (item.ruleId === rule.ruleId ? { ...item, state: next } : item)));
        try {
          await send(`${base}/${encodeURIComponent(rule.ruleId)}/state`, "POST", { state: next }, accessRef.current);
        } catch (caught) {
          setRules((current) => current.map((item) => (item.ruleId === rule.ruleId ? { ...item, state: rule.state } : item)));
          throw caught;
        }
      }),
    [base, run],
  );

  const remove = useCallback(
    (rule: Rule) =>
      run(rule.ruleId, rule.ruleId, "The rule was not deleted.", async () => {
        await send(`${base}/${encodeURIComponent(rule.ruleId)}/state`, "POST", { state: "deleted" }, accessRef.current);
        setRules((current) => current.filter((item) => item.ruleId !== rule.ruleId));
      }),
    [base, run],
  );

  const bake = useCallback(
    (rule: Rule) =>
      run(rule.ruleId, rule.ruleId, "The rule was not added to the SKILL.md.", async () => {
        await send(`${base}/${encodeURIComponent(rule.ruleId)}/bake`, "POST", { skillId: rule.skillId, author: accessRef.current.caller }, accessRef.current);
        setRules((current) => current.map((item) => (item.ruleId === rule.ruleId ? { ...item, state: "off" } : item)));
      }),
    [base, run],
  );

  const refresh = useCallback(() => void load(), [load]);
  const clearError = useCallback(() => setError(null), []);

  return { status, rules, pending, error, clearError, refresh, add, edit, setOn, remove, bake };
}

export const RULE_ADDING_KEY = ADDING;
