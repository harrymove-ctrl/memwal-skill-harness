import { describe, expect, it } from "vitest";
import { isRealBlobId, parseReceipt, parseReceipts, summarize, withRuleText, type ActivityEvent } from "./activity";

const AT = "2026-11-03T09:06:03.941Z";
const receipt = (preview: string, extra = {}) => ({
  memoryId: "m1",
  blobId: "realBlob",
  walruscanUrl: "https://walruscan.com/mainnet/blob/realBlob",
  signerHandle: "@harrymove-ctrl",
  createdAt: AT,
  preview,
  ...extra,
});

describe("parseReceipt", () => {
  it("reads a real rule memory", () => {
    const event = parseReceipt(
      receipt('[RULE:flow-a] [skill:ui-ux-qa] [state:on] [rev:1] [author:@teammate-qa] [severity:hard-rule]\n{"ruleId":"flow-a","text":"Keep titles short"}'),
    );
    expect(event).toMatchObject({ kind: "rule", actor: "teammate-qa", action: "taught a rule in ui-ux-qa", detail: "Keep titles short", skillId: "ui-ux-qa" });
  });

  it("survives a rule whose JSON was cut off by the preview", () => {
    const event = parseReceipt(receipt('[RULE:flow-a] [skill:s] [author:@a]\n{"ruleId":"flow-a","text":"cut off he'));
    expect(event?.detail).toBeUndefined();
    expect(event?.action).toBe("taught a rule in s");
  });

  it("drops end to end test memories", () => {
    expect(parseReceipt(receipt("[RULE:e2e-rule-179] [skill:s]\n{}"))).toBeNull();
    expect(parseReceipt(receipt("[RULE_STATE:e2e-rule-179] [state:on]"))).toBeNull();
  });

  it("reads rule state changes", () => {
    expect(parseReceipt(receipt("[RULE_STATE:flow-a] [state:off] [rev:3]"))?.action).toBe("turned a rule off");
    expect(parseReceipt(receipt("[RULE_STATE:flow-a] [state:deleted] [rev:3]"))?.action).toBe("deleted a rule");
    expect(parseReceipt(receipt("[RULE_STATE:flow-a] [state:weird]"))).toBeNull();
  });

  it("keeps only the rule line of a flow memory and removes tracker ids", () => {
    const event = parseReceipt(
      receipt("[FLOW:typesafe-ai] [AUTHOR:@harrymove-ctrl]\nRule: Use structured schemas (WALM-654) for routing.\nRationale: Eliminates parsing in WALM-654."),
    );
    expect(event?.detail).toBe("Use structured schemas for routing.");
    expect(JSON.stringify(event)).not.toMatch(/WALM/);
  });

  it("reads a skill save", () => {
    const event = parseReceipt(receipt('[SKILL_REF:ui-ux-qa]\n{"id":"ui-ux-qa","rev":4,"author":"@teammate-qa"}'));
    expect(event).toMatchObject({ kind: "skill", actor: "teammate-qa", action: "saved ui-ux-qa, revision 4" });
  });

  it("reads an agent's recall with friendly names", () => {
    const event = parseReceipt(receipt("[AGENT_LOG:RECALL] [agent:claude-code] [author:@h] [target:memwal-qa] [rules:2]"));
    expect(event).toMatchObject({ kind: "recall", actor: "Claude Code", actorIsAgent: true, action: "recalled 2 rules for memwal-qa" });
    expect(parseReceipt(receipt("[AGENT_LOG:RECALL] [agent:cursor] [target:x] [rules:1]"))?.action).toBe("recalled 1 rule for x");
  });

  it("never turns other memories into activity", () => {
    expect(parseReceipt(receipt("[AGENT_LOG:SOMETHING_ELSE] [agent:x]"))).toBeNull();
    expect(parseReceipt(receipt("Active SEAL encrypted Walrus blob (120 bytes)."))).toBeNull();
    expect(parseReceipt(receipt(""))).toBeNull();
  });

  it("hides proof for the placeholder blob the server uses when a write did not sync", () => {
    const event = parseReceipt(receipt("[RULE_STATE:a] [state:on]", { blobId: "z7BHX3brsgqcmDQXh2IzmoCj4g14XioezjkuIL1Fkk0" }));
    expect(event?.proofUrl).toBeUndefined();
    expect(isRealBlobId("z7BHX3brsgqcmDQXh2IzmoCj4g14XioezjkuIL1Fkk0")).toBe(false);
    expect(isRealBlobId("realBlob")).toBe(true);
    expect(isRealBlobId(undefined)).toBe(false);
  });
});

describe("parseReceipts", () => {
  it("sorts newest first and drops unusable dates", () => {
    const events = parseReceipts([
      receipt("[RULE_STATE:a] [state:on]", { memoryId: "old", createdAt: "2026-11-01T00:00:00Z" }),
      receipt("[RULE_STATE:b] [state:on]", { memoryId: "new", createdAt: "2026-11-03T00:00:00Z" }),
      receipt("[RULE_STATE:c] [state:on]", { memoryId: "bad", createdAt: "not a date" }),
    ]);
    expect(events.map((event) => event.id)).toEqual(["new", "old"]);
  });
});

describe("rule switches", () => {
  const flip = (memoryId: string, state: string, createdAt: string, rule = "a") =>
    receipt(`[RULE_STATE:${rule}] [state:${state}]`, { memoryId, createdAt });

  it("folds flipping one rule into its last state", () => {
    const events = parseReceipts([
      flip("1", "on", "2026-11-03T09:00:00Z"),
      flip("2", "off", "2026-11-03T09:01:00Z"),
      flip("3", "on", "2026-11-03T09:02:00Z"),
    ]);
    expect(events.map((event) => event.id)).toEqual(["3"]);
  });

  it("keeps switches far apart, and other rules", () => {
    const events = parseReceipts([
      flip("1", "on", "2026-11-03T08:00:00Z"),
      flip("2", "off", "2026-11-03T09:00:00Z"),
      flip("3", "on", "2026-11-03T09:01:00Z", "b"),
    ]);
    expect(events.map((event) => event.id)).toEqual(["3", "2", "1"]);
  });

  it("adds the rule's words without tracker ids", () => {
    const [event] = withRuleText(parseReceipts([flip("1", "off", AT)]), [{ ruleId: "a", text: "Check CI (WALM-1) first" }]);
    expect(event?.detail).toBe("Check CI first");
  });

  it("leaves a deleted rule's event without words", () => {
    const [event] = withRuleText(parseReceipts([flip("1", "deleted", AT)]), []);
    expect(event?.detail).toBeUndefined();
  });
});

describe("summarize", () => {
  const now = new Date(2026, 10, 4, 12, 0, 0).getTime();
  const recall = (actor: string, minutesAgo: number, skillId = "memwal-qa"): ActivityEvent => ({
    id: `${actor}${minutesAgo}`,
    kind: "recall",
    actor,
    actorIsAgent: true,
    action: "recalled rules",
    skillId,
    at: new Date(now - minutesAgo * 60_000).toISOString(),
  });

  it("reports nothing when no agent has recalled, even with other activity", () => {
    const summary = summarize([{ ...recall("x", 1), kind: "rule" }], now);
    expect(summary).toMatchObject({ today: 0, yesterday: 0, hasRecall: false, activeCount: 0, agents: [] });
    expect(summary.hours.every((value) => value === 0)).toBe(true);
  });

  it("splits today from yesterday by the local day", () => {
    const summary = summarize([recall("a", 10), recall("a", 60), recall("a", 13 * 60), recall("a", 60 * 40)], now);
    expect(summary.today).toBe(2);
    expect(summary.yesterday).toBe(1);
  });

  it("buckets the last 12 hours, oldest first, newest last", () => {
    const summary = summarize([recall("a", 5), recall("a", 30), recall("a", 11 * 60 + 30), recall("a", 13 * 60)], now);
    expect(summary.hours[11]).toBe(2);
    expect(summary.hours[0]).toBe(1);
    expect(summary.hours.reduce((sum, value) => sum + value, 0)).toBe(3);
  });

  it("gives each agent one status from its latest recall", () => {
    const summary = summarize([recall("Claude Code", 1), recall("Claude Code", 500), recall("Cursor", 12), recall("Codex", 60 * 48)], now);
    expect(summary.agents.map((agent) => [agent.name, agent.status])).toEqual([
      ["Claude Code", "active"],
      ["Cursor", "idle"],
      ["Codex", "offline"],
    ]);
    expect(summary.activeCount).toBe(1);
  });
});
