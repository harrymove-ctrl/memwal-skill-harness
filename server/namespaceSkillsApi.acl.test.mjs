import { Readable } from "node:stream";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The real gateways write to Walrus mainnet. These mocks keep this test offline.
vi.mock("./consoleGateway.mjs", () => ({
  deleteConsoleSkill: vi.fn(),
  getConsoleSkill: vi.fn(async () => ({ markdown: "# skill\n" })),
  listConsoleSkills: vi.fn(),
  putConsoleSkill: vi.fn(async () => ({ skill: {}, rev: 2 })),
}));
vi.mock("./memoryGateway.mjs", () => ({
  listFoldedRules: vi.fn(async () => [{ ruleId: "r1", skillId: "s1", text: "t" }]),
  setRuleState: vi.fn(async () => ({ ruleId: "r1", state: "off" })),
  upsertRule: vi.fn(),
}));

const { handleNamespaceSkillsRequest } = await import("./namespaceSkillsApi.mjs");
const { setRuleState } = await import("./memoryGateway.mjs");
const { putConsoleSkill } = await import("./consoleGateway.mjs");

async function call(path, headers = {}, body = { state: "off" }) {
  const req = Readable.from([Buffer.from(JSON.stringify(body))]);
  Object.assign(req, { url: path, method: "POST", headers });
  const res = {
    statusCode: 0,
    headers: {},
    setHeader() {},
    end(text) {
      this.body = JSON.parse(text);
    },
  };
  await handleNamespaceSkillsRequest(req, res);
  return res;
}

describe("rule writes respect the role", () => {
  beforeEach(() => vi.clearAllMocks());

  const READ_ONLY = { "x-memwal-access-role": "read-only" };
  const STRANGER = { "x-memwal-caller-address": "0xdeadbeef" };

  it("refuses a read only member turning a rule off", async () => {
    const res = await call("/api/ns/space/rules/r1/state", READ_ONLY);
    expect(res.statusCode).toBe(403);
    expect(setRuleState).not.toHaveBeenCalled();
  });

  it("refuses an address outside the allowlist", async () => {
    const res = await call("/api/ns/space/rules/r1/state", STRANGER);
    expect(res.statusCode).toBe(403);
    expect(setRuleState).not.toHaveBeenCalled();
  });

  it("refuses a read only member writing a rule into a skill", async () => {
    const res = await call("/api/ns/space/rules/r1/bake", READ_ONLY, {});
    expect(res.statusCode).toBe(403);
    expect(putConsoleSkill).not.toHaveBeenCalled();
    expect(setRuleState).not.toHaveBeenCalled();
  });

  it("still lets an editor change a rule", async () => {
    const res = await call("/api/ns/space/rules/r1/state", { "x-memwal-access-role": "read-write" });
    expect(res.statusCode).toBe(200);
    expect(setRuleState).toHaveBeenCalledOnce();
  });
});
