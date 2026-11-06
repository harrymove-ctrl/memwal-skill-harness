import { describe, expect, it } from "vitest";
// @ts-expect-error runtime ESM module
import { foldRuleEvents, listFoldedRules, parseRuleMemoryEvent, setRuleState, upsertRule } from "../../server/memoryGateway.mjs";
// @ts-expect-error runtime ESM module
import { getConsoleSkill, putConsoleSkill } from "../../server/consoleGateway.mjs";

describe("memoryGateway & consoleGateway dual-store unit suite", () => {
  it("folds [RULE:<id>], [RULE_STATE:<id>], inline edits, and legacy [FLOW:<skill>] events deterministically", () => {
    const raw1 = parseRuleMemoryEvent(
      `[RULE:rule-1] [skill:memwal-qa] [state:on] [rev:1] [author:@harrymove-ctrl] [severity:hard-rule]\n` +
        JSON.stringify({
          ruleId: "rule-1",
          skillId: "memwal-qa",
          text: "First version of rule",
          state: "on",
          rev: 1,
        }),
      { blobId: "blob-r1" }
    );
    const rawEdit = parseRuleMemoryEvent(
      `[RULE:rule-1] [skill:memwal-qa] [state:on] [rev:2] [author:@harrymove-ctrl] [severity:hard-rule]\n` +
        JSON.stringify({
          ruleId: "rule-1",
          skillId: "memwal-qa",
          text: "Updated second version of rule",
          state: "on",
          rev: 2,
        }),
      { blobId: "blob-r2" }
    );
    const rawOff = parseRuleMemoryEvent(
      `[RULE_STATE:rule-1] [state:off] [rev:3]\n` +
        JSON.stringify({ ruleId: "rule-1", state: "off", rev: 3 }),
      { blobId: "blob-r3" }
    );
    const rawLegacy = parseRuleMemoryEvent(
      `[FLOW:memwal-review] [author:@teammate-dev] [severity:workflow-update]\nUse only dev and production environments.`,
      { blobId: "blob-legacy" }
    );

    const folded = foldRuleEvents(
      [raw1, rawEdit, rawOff, rawLegacy],
      "memwal-team-skills"
    );
    expect(folded).toHaveLength(2);
    const r1 = folded.find((r: any) => r.ruleId === "rule-1");
    expect(r1?.text).toBe("Updated second version of rule");
    expect(r1?.state).toBe("off");
    expect(r1?.rev).toBe(3);
    expect(r1?.memoryBlobId).toBe("blob-r3");

    // Deleting a rule removes it from folded output
    const rawDelete = parseRuleMemoryEvent(
      `[RULE_STATE:rule-1] [state:deleted] [rev:4]\n{"ruleId":"rule-1","state":"deleted","rev":4}`,
      { blobId: "blob-r4" }
    );
    const afterDelete = foldRuleEvents(
      [raw1, rawEdit, rawOff, rawLegacy, rawDelete],
      "memwal-team-skills"
    );
    expect(afterDelete.find((r: any) => r.ruleId === "rule-1")).toBeUndefined();
    expect(afterDelete).toHaveLength(1);
  });

  it("persists rule upsert, toggle off/on, and delete across listFoldedRules calls", async () => {
    const testNs = `unit-test-ns-${Date.now()}`;
    const created = await upsertRule(testNs, {
      ruleId: "rule-persist-1",
      skillId: "ui-ux-qa",
      text: "Keep cards under 3 actions",
      author: "@harrymove-ctrl",
    });
    expect(created.rule.state).toBe("on");
    expect(created.rev).toBe(1);

    await setRuleState(testNs, "rule-persist-1", "off");
    const afterOff = await listFoldedRules(testNs);
    expect(afterOff.find((r: any) => r.ruleId === "rule-persist-1")?.state).toBe(
      "off"
    );

    await setRuleState(testNs, "rule-persist-1", "on");
    const afterOn = await listFoldedRules(testNs);
    expect(afterOn.find((r: any) => r.ruleId === "rule-persist-1")?.state).toBe(
      "on"
    );

    await setRuleState(testNs, "rule-persist-1", "deleted");
    const afterDelete = await listFoldedRules(testNs);
    expect(
      afterDelete.find((r: any) => r.ruleId === "rule-persist-1")
    ).toBeUndefined();
  });

  it("enforces If-Match revision conflict (409) and retains bounded 3-revision history in consoleGateway", async () => {
    const testNs = `unit-console-ns-${Date.now()}`;
    const r1 = await putConsoleSkill(testNs, "test-skill", {
      markdown: "# Test Skill v1",
      author: "@harrymove-ctrl",
      skipRemoteUpload: true,
    });
    expect(r1.rev).toBe(1);

    const r2 = await putConsoleSkill(testNs, "test-skill", {
      markdown: "# Test Skill v2",
      ifMatchRev: 1,
      author: "@harrymove-ctrl",
      skipRemoteUpload: true,
    });
    expect(r2.rev).toBe(2);

    await expect(
      putConsoleSkill(testNs, "test-skill", {
        markdown: "# Stale Save Attempt",
        ifMatchRev: 1,
        skipRemoteUpload: true,
      })
    ).rejects.toMatchObject({
      statusCode: 409,
    });

    const loaded = await getConsoleSkill(testNs, "test-skill");
    expect(loaded.rev).toBe(2);
    expect(Array.isArray(loaded.history)).toBe(true);
    expect(loaded.history.length).toBeGreaterThanOrEqual(2);
  });
});
