import { describe, expect, it } from "vitest";
import { skillIdFromFile } from "../CommandCenter";
import { usesLegacyApp } from "../Root";
import { AGENTS, buildRecallInstruction, buildSetup, KEY_PLACEHOLDER } from "./agentSetup";
import { tryOutcome } from "./tryScenarios";

const rule = (ruleId: string, text: string) => ({ ruleId, text, author: "@someone" });
const ASYNC_RULE = rule("r1", "Release Mutex locks before running async await calls so worker threads never deadlock.");
const OTHER = rule("r2", "Post release notes in the team channel.");

describe("tryOutcome", () => {
  it("changes the plan only when the matching rule is on", () => {
    const on = tryOutcome("rust-async-patterns", "rust-async-patterns", [ASYNC_RULE, OTHER]);
    expect(on.changed).toBe(true);
    expect(on.applied).toEqual([ASYNC_RULE]);
    expect(on.withRules).not.toBe(on.without);

    const off = tryOutcome("rust-async-patterns", "rust-async-patterns", [OTHER]);
    expect(off.changed).toBe(false);
    expect(off.applied).toEqual([]);
    expect(off.withRules).toBe(off.without);
    expect(off.withVerdict).toBe("No rule changed this");
  });

  it("builds a skill without a written example from its real rules", () => {
    const outcome = tryOutcome("some-skill", "Some skill", [OTHER]);
    expect(outcome.changed).toBe(true);
    expect(outcome.withRules).toContain(OTHER.text);
    expect(outcome.withoutVerdict).toBe("Misses 1 team rule");
    expect(tryOutcome("some-skill", "Some skill", [OTHER, ASYNC_RULE]).withVerdict).toBe("Follows 2 team rules");
  });

  it("claims no change when a skill has no rules on", () => {
    const outcome = tryOutcome("some-skill", "Some skill", []);
    expect(outcome.changed).toBe(false);
    expect(outcome.withRules).toBe(outcome.without);
  });
});

describe("agent setup", () => {
  const input = {
    accountId: "0xabc",
    namespace: "my-space",
    serverUrl: "https://relayer.example",
    origin: "https://app.example",
  };

  it.each(AGENTS.map((agent) => agent.id))("%s names the space and never holds a key", (agent) => {
    const text = buildSetup({ ...input, agent });
    expect(text).toContain("my-space");
    expect(text).not.toMatch(/suiprivkey/);
    expect(text).not.toMatch(/PRIVATE_KEY["' =:]+[0-9a-f]{16}/i);
    if (agent === "claude-code") expect(text).toContain('"$MEMWAL_PRIVATE_KEY"');
    if (agent === "cursor" || agent === "antigravity" || agent === "codex") expect(text).toContain(KEY_PLACEHOLDER);
  });

  it("gives JSON that parses, for the agents that take JSON", () => {
    for (const agent of ["cursor", "antigravity", "tatum-ai"] as const) {
      expect(() => JSON.parse(buildSetup({ ...input, agent }))).not.toThrow();
    }
  });

  it("asks agents for the exact log line the screens read", () => {
    const text = buildRecallInstruction("cursor", "my-space");
    expect(text).toContain("[AGENT_LOG:RECALL] [agent:cursor] [author:");
    expect(text).toContain("my-space");
  });
});

describe("skillIdFromFile", () => {
  it("prefers the name in the front matter", () => {
    expect(skillIdFromFile("whatever.md", "---\nname: Code Review\ndescription: x\n---\n# hi")).toBe("code-review");
  });

  it("falls back to the file name, but not a bare SKILL.md", () => {
    expect(skillIdFromFile("release-notes.md", "# hi")).toBe("release-notes");
    expect(skillIdFromFile("SKILL.md", "# hi")).toBeNull();
    expect(skillIdFromFile("skill.MD", "no front matter")).toBeNull();
  });

  it("makes an id that is safe in a path", () => {
    expect(skillIdFromFile("../../etc/passwd.md", "# hi")).toBe("etc-passwd");
    expect(skillIdFromFile("x.md", '---\nname: "../evil"\n---')).toBe("evil");
  });
});

describe("usesLegacyApp", () => {
  it("keeps only /bento and ?legacy on the older app", () => {
    expect(usesLegacyApp("/bento", "")).toBe(true);
    expect(usesLegacyApp("/bento/", "")).toBe(true);
    expect(usesLegacyApp("/home", "?legacy=1")).toBe(true);
    for (const path of ["/", "/home", "/skills", "/try", "/team", "/agents", "/eval", "/graph", "/cad", "/join"]) {
      expect(usesLegacyApp(path, "")).toBe(false);
    }
  });
});
