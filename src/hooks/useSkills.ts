import { useCallback, useEffect, useRef, useState } from "react";
import type { LoadStatus } from "./useActivity";
import { type Access, accessHeaders } from "./useRules";

export interface SkillRevision {
  rev: number;
  author?: string;
  updatedAt?: string;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  description?: string;
  markdown: string;
  rev: number;
  author?: string;
  updatedAt?: string;
  history?: SkillRevision[];
}

export type SaveResult =
  | { status: "saved"; skill: Skill }
  | { status: "conflict"; current: Skill | null }
  | { status: "failed"; message: string }
  | { status: "offline" };

export interface SkillsState {
  status: LoadStatus;
  skills: Skill[];
  refresh: () => void;
  save: (skillId: string, markdown: string, baseRev: number) => Promise<SaveResult>;
  remove: (skillId: string) => Promise<boolean>;
}

export function useSkills(namespace: string, access: Access = {}): SkillsState {
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [skills, setSkills] = useState<Skill[]>([]);
  const controllerRef = useRef<AbortController | null>(null);
  const accessRef = useRef(access);
  accessRef.current = access;

  const base = `/api/ns/${encodeURIComponent(namespace)}/skills`;

  const load = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus((current) => (current === "ready" ? current : "loading"));
    try {
      const response = await fetch(base, { signal: controller.signal });
      if (!response.ok) throw new Error(`Skills returned ${response.status}`);
      const json = (await response.json()) as { skills?: Skill[] };
      if (controller.signal.aborted) return;
      setSkills(Array.isArray(json.skills) ? json.skills : []);
      setStatus("ready");
    } catch {
      if (!controller.signal.aborted) setStatus("error");
    }
  }, [base]);

  useEffect(() => {
    if (!namespace) return;
    setSkills([]);
    setStatus("loading");
    void load();
    return () => controllerRef.current?.abort();
  }, [namespace, load]);

  const save = useCallback(
    async (skillId: string, markdown: string, baseRev: number): Promise<SaveResult> => {
      if (typeof navigator !== "undefined" && navigator.onLine === false) return { status: "offline" };
      try {
        const response = await fetch(`${base}/${encodeURIComponent(skillId)}`, {
          method: "PUT",
          headers: { ...accessHeaders(accessRef.current), "If-Match": String(baseRev) },
          body: JSON.stringify({ markdown, author: accessRef.current.caller }),
        });
        const json = (await response.json().catch(() => ({}))) as {
          skill?: Skill;
          currentSkill?: Skill;
          error?: string;
        };
        if (response.status === 409) return { status: "conflict", current: json.currentSkill ?? null };
        if (response.status === 403) return { status: "failed", message: "Your role cannot change this space." };
        if (!response.ok || !json.skill) return { status: "failed", message: "The save did not finish." };
        const saved = json.skill;
        setSkills((current) => current.map((skill) => (skill.id === skillId ? saved : skill)));
        return { status: "saved", skill: saved };
      } catch {
        if (typeof navigator !== "undefined" && navigator.onLine === false) return { status: "offline" };
        return { status: "failed", message: "The save did not reach the server." };
      }
    },
    [base],
  );

  const remove = useCallback(
    async (skillId: string) => {
      try {
        const response = await fetch(`${base}/${encodeURIComponent(skillId)}`, {
          method: "DELETE",
          headers: accessHeaders(accessRef.current),
        });
        if (!response.ok) return false;
        setSkills((current) => current.filter((skill) => skill.id !== skillId));
        return true;
      } catch {
        return false;
      }
    },
    [base],
  );

  const refresh = useCallback(() => void load(), [load]);

  return { status, skills, refresh, save, remove };
}
