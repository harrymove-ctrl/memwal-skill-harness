import type { FlowMemoryNode, HostedSkillNode } from "../types";

export type SyncSaveState = "idle" | "saving" | "saved" | "conflict" | "failed";

export interface NamespaceSkillsResponse {
  ok: boolean;
  schema: string;
  namespace: string;
  bucketId: string;
  bucketName: string;
  skills: HostedSkillNode[];
}

export interface SaveSkillResponse {
  ok: boolean;
  conflict?: boolean;
  error?: string;
  skill: HostedSkillNode;
  rev: number;
  sha256: string;
  fileId: string;
  blobId: string;
  pointerBlobId?: string | null;
  syncedToWalrus?: boolean;
  currentSkill?: HostedSkillNode;
}

export interface NamespaceRulesResponse {
  ok: boolean;
  namespace: string;
  rules: FlowMemoryNode[];
}

export async function fetchNamespaceSkills(
  namespace: string
): Promise<NamespaceSkillsResponse | null> {
  try {
    const res = await fetch(
      `/api/ns/${encodeURIComponent(namespace)}/skills`,
      { method: "GET" }
    );
    if (!res.ok) return null;
    const json = await res.json();
    if (!json || !Array.isArray(json.skills)) return null;
    return {
      ...json,
      skills: json.skills.map((s: any) => ({
        ...s,
        authorKey: s.authorKey || s.author || "@harrymove-ctrl",
      })),
    };
  } catch {
    return null;
  }
}

export async function saveNamespaceSkillRevision(
  namespace: string,
  skillId: string,
  payload: {
    markdown: string;
    name?: string;
    category?: string;
    description?: string;
    relatedSkills?: string[];
    author?: string;
    callerAddress?: string;
    accessRole?: "read-write" | "read-only";
    ifMatchRev?: number;
  }
): Promise<{ status: SyncSaveState; data?: SaveSkillResponse; error?: string }> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (payload.ifMatchRev !== undefined) {
      headers["If-Match"] = String(payload.ifMatchRev);
    }
    if (payload.callerAddress || payload.author) {
      headers["X-MemWal-Caller-Address"] = String(
        payload.callerAddress || payload.author
      );
    }
    if (payload.accessRole) {
      headers["X-MemWal-Access-Role"] = payload.accessRole;
    }
    const res = await fetch(
      `/api/ns/${encodeURIComponent(namespace)}/skills/${encodeURIComponent(skillId)}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      }
    );
    const json = (await res.json().catch(() => ({}))) as SaveSkillResponse;
    if (res.status === 409) {
      return {
        status: "conflict",
        data: json,
        error: json.error || "Revision conflict detected",
      };
    }
    if (!res.ok || !json.ok) {
      return {
        status: "failed",
        error: json.error || `HTTP ${res.status}`,
      };
    }
    return {
      status: "saved",
      data: json,
    };
  } catch (err: any) {
    return {
      status: "failed",
      error: String(err?.message || err),
    };
  }
}

export async function deleteNamespaceSkillRevision(
  namespace: string,
  skillId: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `/api/ns/${encodeURIComponent(namespace)}/skills/${encodeURIComponent(skillId)}`,
      { method: "DELETE" }
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchNamespaceRules(
  namespace: string,
  skillFilter?: string
): Promise<FlowMemoryNode[] | null> {
  try {
    const query = skillFilter ? `?skill=${encodeURIComponent(skillFilter)}` : "";
    const res = await fetch(
      `/api/ns/${encodeURIComponent(namespace)}/rules${query}`,
      { method: "GET" }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as NamespaceRulesResponse;
    if (!json || !Array.isArray(json.rules)) return null;
    return json.rules.map((r: any) => ({
      id: r.ruleId || r.id,
      ruleId: r.ruleId || r.id,
      skillId: r.skillId,
      namespace: r.namespace || namespace,
      rule: r.text || r.rule,
      text: r.text || r.rule,
      rationale: r.rationale || "",
      severity: r.severity || "hard-rule",
      state: r.state || "on",
      rev: r.rev || 1,
      blobId: r.memoryBlobId || r.blobId,
      memoryBlobId: r.memoryBlobId || r.blobId,
      createdAt: r.createdAt || r.updatedAt || new Date().toISOString(),
      updatedAt: r.updatedAt || r.createdAt || new Date().toISOString(),
      authorHandle: r.author || r.authorHandle || "@harrymove-ctrl",
      authorDelegateKey: "0x8a2572a9...e124",
      linkedSkills: Array.isArray(r.linkedSkills) ? r.linkedSkills : [],
    }));
  } catch {
    return null;
  }
}

export async function upsertNamespaceRule(
  namespace: string,
  payload: {
    ruleId?: string;
    skillId: string;
    text: string;
    rationale?: string;
    severity?: "hard-rule" | "workflow-update" | "gotcha" | "trust-score";
    state?: "on" | "off";
    author?: string;
    linkedSkills?: string[];
  }
): Promise<{
  status: SyncSaveState;
  rule?: FlowMemoryNode;
  memoryBlobId?: string;
  rev?: number;
  error?: string;
}> {
  try {
    const res = await fetch(
      `/api/ns/${encodeURIComponent(namespace)}/rules`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      return {
        status: "failed",
        error: json.error || `HTTP ${res.status}`,
      };
    }
    const r = json.rule || {};
    const node: FlowMemoryNode = {
      id: r.ruleId || r.id,
      ruleId: r.ruleId || r.id,
      skillId: r.skillId || payload.skillId,
      namespace,
      rule: r.text || r.rule || payload.text,
      text: r.text || r.rule || payload.text,
      rationale: r.rationale || payload.rationale || "",
      severity: r.severity || payload.severity || "hard-rule",
      state: r.state || "on",
      rev: json.rev || r.rev || 1,
      blobId: json.memoryBlobId || r.memoryBlobId || r.blobId,
      memoryBlobId: json.memoryBlobId || r.memoryBlobId || r.blobId,
      createdAt: r.createdAt || r.updatedAt || new Date().toISOString(),
      updatedAt: r.updatedAt || new Date().toISOString(),
      authorHandle: r.author || payload.author || "@harrymove-ctrl",
      authorDelegateKey: "0x8a2572a9...e124",
      linkedSkills: r.linkedSkills || payload.linkedSkills || [],
    };
    return {
      status: "saved",
      rule: node,
      memoryBlobId: json.memoryBlobId,
      rev: json.rev,
    };
  } catch (err: any) {
    return {
      status: "failed",
      error: String(err?.message || err),
    };
  }
}

export async function updateNamespaceRuleState(
  namespace: string,
  ruleId: string,
  state: "on" | "off" | "deleted"
): Promise<{
  status: SyncSaveState;
  state?: "on" | "off" | "deleted";
  memoryBlobId?: string;
  rev?: number;
}> {
  try {
    const res = await fetch(
      `/api/ns/${encodeURIComponent(namespace)}/rules/${encodeURIComponent(ruleId)}/state`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
      }
    );
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      return { status: "failed" };
    }
    return {
      status: "saved",
      state: json.state,
      memoryBlobId: json.memoryBlobId,
      rev: json.rev,
    };
  } catch {
    return { status: "failed" };
  }
}

export async function bakeNamespaceRuleIntoSkill(
  namespace: string,
  ruleId: string,
  skillId?: string,
  author?: string
): Promise<{
  status: SyncSaveState;
  skill?: HostedSkillNode;
  rev?: number;
  fileId?: string;
}> {
  try {
    const res = await fetch(
      `/api/ns/${encodeURIComponent(namespace)}/rules/${encodeURIComponent(ruleId)}/bake`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId, author }),
      }
    );
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      return { status: "failed" };
    }
    return {
      status: "saved",
      skill: json.skill,
      rev: json.rev,
      fileId: json.fileId,
    };
  } catch {
    return { status: "failed" };
  }
}
