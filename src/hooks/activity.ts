/*
 * Turns what /api/tatum-memwal/activity returns into plain events. The endpoint
 * hands back raw memory headers, so this is the one place that knows their
 * format. Nothing here invents an event: an unrecognized memory is dropped, and a
 * recall is counted only when an agent actually logged one.
 *
 * The recall format agents must write (see docs/ux/handoff-antigravity.md):
 *   [AGENT_LOG:RECALL] [agent:claude-code] [author:@handle] [target:memwal-qa]
 */
import { agentName, plainHandle, plural } from "../shell/copy";

export type ActivityKind = "recall" | "rule" | "rule_state" | "skill" | "space" | "task";

export interface ActivityEvent {
  id: string;
  kind: ActivityKind;
  /** Who did it, ready to display. */
  actor: string;
  actorIsAgent: boolean;
  /** The sentence after the actor, such as "recalled rules for memwal-qa". */
  action: string;
  /** An optional second line, such as the rule's text. */
  detail?: string;
  skillId?: string;
  /** The member whose agent did this, on recall events. */
  member?: string;
  /** Set on rule events, so a screen can show the rule's words. */
  ruleId?: string;
  at: string;
  proofUrl?: string;
}

export interface RawReceipt {
  memoryId?: string;
  blobId?: string;
  walruscanUrl?: string;
  kind?: string;
  signerHandle?: string;
  createdAt?: string;
  preview?: string;
}

/** The server fills unsynced items with this id, so it proves nothing. */
export const PLACEHOLDER_BLOB_IDS = new Set([
  "z7BHX3brsgqcmDQXh2IzmoCj4g14XioezjkuIL1Fkk0",
  "fEe2NWB1i5M0z5I-LYedaYeNAtxChegvJUf2Rui_Tho",
  "zjcqsfXK3MBg04n8LHLaKMM8IHuBCuumfn_qk46aclk",
  "zhQZcZCUElxe3vOeDLbbq9vh9K0UyzpOU-QwmUGsj1I",
  "XvqXdkl79MSND_EcvKX6LM2DRPAnytD6A_DKDbCbICY",
]);

export function isRealBlobId(blobId: string | undefined | null): blobId is string {
  return !!blobId && !PLACEHOLDER_BLOB_IDS.has(blobId);
}

/** Internal tracker ids can sit in old memories and must not reach the screen. */
function cleanText(text: string): string {
  return text
    .replace(/\s*\(?\bWALM-\d+\b\)?/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function readTags(header: string): Map<string, string> {
  const tags = new Map<string, string>();
  for (const match of header.matchAll(/\[([A-Za-z_]+)(?::([^\]]*))?\]/g)) {
    tags.set(match[1]!.toLowerCase(), (match[2] ?? "").trim());
  }
  return tags;
}

function jsonField(body: string, field: string): string | undefined {
  const match = body.match(new RegExp(`"${field}"\\s*:\\s*("(?:[^"\\\\]|\\\\.)*"|\\d+)`));
  if (!match) return undefined;
  try {
    return String(JSON.parse(match[1]!));
  } catch {
    return undefined;
  }
}

function isTestMemory(id: string | undefined): boolean {
  return !!id && /^e2e[-_]/i.test(id);
}

export function parseReceipt(raw: RawReceipt): ActivityEvent | null {
  const preview = String(raw.preview ?? "");
  const newline = preview.indexOf("\n");
  const header = newline === -1 ? preview : preview.slice(0, newline);
  const body = newline === -1 ? "" : preview.slice(newline + 1);
  const tags = readTags(header);
  const signer = plainHandle(raw.signerHandle ?? "");

  const base = {
    id: raw.memoryId ?? raw.blobId ?? preview.slice(0, 80),
    at: raw.createdAt ?? "",
    proofUrl: isRealBlobId(raw.blobId) ? raw.walruscanUrl : undefined,
  };

  if (tags.has("agent_log")) {
    const verb = (tags.get("agent_log") ?? "").toUpperCase();
    const agent = tags.get("agent");
    const author = plainHandle(tags.get("author") ?? signer);
    const target = tags.get("target") ?? "";
    const who = agent
      ? { actor: agentName(agent), actorIsAgent: true }
      : { actor: author, actorIsAgent: false };

    if (verb.startsWith("RECALL")) {
      const count = Number(tags.get("rules"));
      const what = Number.isFinite(count) && count > 0 ? plural(count, "rule") : "rules";
      return { ...base, ...who, kind: "recall", action: `recalled ${what} for ${target || "this space"}`, skillId: target || undefined, member: author || undefined };
    }
    if (verb === "LEARN_RULE") {
      return { ...base, ...who, kind: "rule", action: `taught a rule in ${target}`, skillId: target || undefined };
    }
    if (verb === "CREATE_NAMESPACE") {
      return { ...base, ...who, kind: "space", action: `created the space ${target}` };
    }
    if (verb === "TASK_EXECUTION") {
      return { ...base, ...who, kind: "task", action: `ran a task in ${target || "this space"}`, skillId: target || undefined };
    }
    return null;
  }

  if (tags.has("rule")) {
    const ruleId = tags.get("rule");
    if (isTestMemory(ruleId)) return null;
    const skillId = tags.get("skill") ?? "";
    const text = jsonField(body, "text");
    return {
      ...base,
      kind: "rule",
      actor: plainHandle(tags.get("author") ?? signer),
      actorIsAgent: false,
      action: `taught a rule in ${skillId}`,
      detail: text ? cleanText(text) : undefined,
      skillId: skillId || undefined,
    };
  }

  if (tags.has("rule_state")) {
    if (isTestMemory(tags.get("rule_state"))) return null;
    const state = tags.get("state");
    if (state !== "on" && state !== "off" && state !== "deleted") return null;
    const action = state === "deleted" ? "deleted a rule" : `turned a rule ${state}`;
    return { ...base, kind: "rule_state", actor: signer, actorIsAgent: false, action, ruleId: tags.get("rule_state") };
  }

  if (tags.has("flow")) {
    const skillId = tags.get("flow") ?? "";
    const line = body.split("\n").find((item) => item.startsWith("Rule:"));
    return {
      ...base,
      kind: "rule",
      actor: plainHandle(tags.get("author") ?? signer),
      actorIsAgent: false,
      action: `taught a rule in ${skillId}`,
      detail: line ? cleanText(line.slice(5)) : undefined,
      skillId: skillId || undefined,
    };
  }

  if (tags.has("skill_ref")) {
    const skillId = tags.get("skill_ref") ?? "";
    const rev = jsonField(body, "rev");
    return {
      ...base,
      kind: "skill",
      actor: plainHandle(jsonField(body, "author") ?? signer),
      actorIsAgent: false,
      action: rev ? `saved ${skillId}, revision ${rev}` : `saved ${skillId}`,
      skillId: skillId || undefined,
    };
  }

  return null;
}

const FOLD_WITHIN = 10 * 60_000;

/** Flipping one rule back and forth reads as one change: the last state it landed on. */
function foldSwitching(events: ActivityEvent[]): ActivityEvent[] {
  const latest = new Map<string, number>();
  return events.filter((event) => {
    if (event.kind !== "rule_state" || !event.ruleId) return true;
    const time = Date.parse(event.at);
    const newer = latest.get(event.ruleId);
    latest.set(event.ruleId, time);
    return newer === undefined || newer - time > FOLD_WITHIN;
  });
}

export function parseReceipts(receipts: RawReceipt[]): ActivityEvent[] {
  const events = receipts
    .map(parseReceipt)
    .filter((event): event is ActivityEvent => event !== null && !Number.isNaN(Date.parse(event.at)));
  return foldSwitching(events.sort((a, b) => Date.parse(b.at) - Date.parse(a.at)));
}

/** Adds the rule's words to a switch event, when the rule still exists. */
export function withRuleText(events: ActivityEvent[], rules: { ruleId: string; text: string }[]): ActivityEvent[] {
  const byId = new Map(rules.map((rule) => [rule.ruleId, rule.text]));
  return events.map((event) => {
    const text = event.ruleId ? byId.get(event.ruleId) : undefined;
    return text && !event.detail ? { ...event, detail: cleanText(text) } : event;
  });
}

export type AgentStatus = "active" | "idle" | "offline";

export interface AgentNow {
  name: string;
  status: AgentStatus;
  lastAt: string;
  skillId?: string;
}

export interface LiveSummary {
  today: number;
  yesterday: number;
  skillsToday: number;
  /** Recalls per hour for the last 12 hours, oldest first. */
  hours: number[];
  agents: AgentNow[];
  activeCount: number;
  hasRecall: boolean;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const ACTIVE_WITHIN = 5 * MINUTE;
const IDLE_WITHIN = 24 * HOUR;

function startOfDay(time: number): number {
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function summarize(events: ActivityEvent[], now: number = Date.now()): LiveSummary {
  const recalls = events.filter((event) => event.kind === "recall");
  const today = startOfDay(now);
  const yesterday = startOfDay(today - HOUR);
  const hours = new Array<number>(12).fill(0);
  const skillsToday = new Set<string>();
  const agents = new Map<string, AgentNow>();
  let todayCount = 0;
  let yesterdayCount = 0;

  for (const event of recalls) {
    const time = Date.parse(event.at);
    if (time >= today) {
      todayCount += 1;
      if (event.skillId) skillsToday.add(event.skillId);
    } else if (time >= yesterday) {
      yesterdayCount += 1;
    }

    const hoursAgo = Math.floor((now - time) / HOUR);
    if (hoursAgo >= 0 && hoursAgo < 12) hours[11 - hoursAgo]! += 1;

    const known = agents.get(event.actor);
    if (!known || Date.parse(known.lastAt) < time) {
      const age = now - time;
      const status: AgentStatus = age < ACTIVE_WITHIN ? "active" : age < IDLE_WITHIN ? "idle" : "offline";
      agents.set(event.actor, { name: event.actor, status, lastAt: event.at, skillId: event.skillId });
    }
  }

  const list = [...agents.values()].sort((a, b) => Date.parse(b.lastAt) - Date.parse(a.lastAt));
  return {
    today: todayCount,
    yesterday: yesterdayCount,
    skillsToday: skillsToday.size,
    hours,
    agents: list,
    activeCount: list.filter((agent) => agent.status === "active").length,
    hasRecall: recalls.length > 0,
  };
}
