// @vitest-environment node
import { describe, expect, it } from "vitest";
import { normalizeAddress, parseAccountObject, unframe, verifyMember } from "./tatumSuiGateway.mjs";
import { mergeRecalledEvents } from "./memoryGateway.mjs";

const OWNER = "0x" + "11".repeat(32);
const KEY = "0x" + "22".repeat(32);

describe("account parsing", () => {
  it("reads the shape Tatum returned for the real account", () => {
    const account = parseAccountObject({
      active: true,
      owner: OWNER,
      delegate_keys: [{ label: "@teammate", public_key: "/eZrn8HwP+OUnH+xDGWRO/jH98m58Bd23W3b6cl7Mtw=", sui_address: KEY }],
    });
    expect(account.owner).toBe(OWNER);
    expect(account.delegateKeys[0]).toMatchObject({ suiAddress: KEY, label: "@teammate" });
    expect(account.delegateKeys[0].publicKeyHex).toHaveLength(64);
  });

  it("survives an empty or odd object", () => {
    expect(parseAccountObject(undefined)).toMatchObject({ owner: "", delegateKeys: [] });
    expect(parseAccountObject({ delegate_keys: "nope" }).delegateKeys).toEqual([]);
  });
});

describe("verifyMember", () => {
  const account = { owner: OWNER, delegateKeys: [{ suiAddress: KEY }] };
  it("tells owner, key, pending and unknown apart", () => {
    expect(verifyMember(OWNER, account)).toBe("owner");
    expect(verifyMember(KEY, account)).toBe("key");
    expect(verifyMember("0x" + "33".repeat(32), account)).toBe("pending");
    expect(verifyMember(OWNER, null)).toBe("unknown");
  });
});

describe("normalizeAddress", () => {
  it("accepts real addresses and refuses the rest", () => {
    expect(normalizeAddress(OWNER.toUpperCase().replace("0X", "0x"))).toBe(OWNER);
    expect(normalizeAddress("0x2")).toBe("0x" + "0".repeat(63) + "2");
    for (const bad of ["", "nope", "0x", "0xnothex", `${OWNER}00`, undefined, null]) {
      expect(normalizeAddress(bad)).toBeNull();
    }
  });
});

describe("gRPC framing", () => {
  it("reads a message and refuses a truncated or compressed one", () => {
    const body = Buffer.from([0, 0, 0, 0, 2, 7, 8]);
    expect([...unframe(body)]).toEqual([7, 8]);
    expect(unframe(Buffer.alloc(0))).toHaveLength(0);
    expect(() => unframe(Buffer.from([0, 0, 0, 0, 9, 1]))).toThrow(/Truncated/);
    expect(() => unframe(Buffer.from([1, 0, 0, 0, 1, 1]))).toThrow(/Compressed/);
  });
});

describe("rebuilding rules from Walrus", () => {
  const rule = (ruleId, rev, updatedAt, state = "on") => ({ kind: "rule", ruleId, rev, updatedAt, state });
  const stateEvent = (ruleId, rev, updatedAt, state) => ({ kind: "state", ruleId, rev, updatedAt, state });

  it("adds what the local list lost, oldest first, so a later off still wins", () => {
    const { events, added } = mergeRecalledEvents(
      [rule("seed", 1, "2026-10-01T00:00:00Z")],
      [stateEvent("new", 2, "2026-11-02T00:00:00Z", "off"), rule("new", 1, "2026-11-01T00:00:00Z")]
    );
    expect(added).toBe(2);
    expect(events.map((event) => `${event.kind}:${event.ruleId}`)).toEqual(["rule:seed", "rule:new", "state:new"]);
  });

  it("skips what it already has and test data", () => {
    const local = [rule("a", 1, "2026-10-01T00:00:00Z")];
    const { events, added } = mergeRecalledEvents(local, [rule("a", 1, "2026-10-01T00:00:00Z"), rule("e2e-rule-9", 1, "2026-11-01T00:00:00Z")]);
    expect(added).toBe(0);
    expect(events).toBe(local);
  });
});
