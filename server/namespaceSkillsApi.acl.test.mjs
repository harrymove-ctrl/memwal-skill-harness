// @vitest-environment node
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Readable } from "node:stream";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The real gateways write to Walrus mainnet and read Tatum. These mocks keep this test offline.
// The signatures, sessions and role decisions under test are all real.
const OWNER = new Ed25519Keypair();
const EDITOR = new Ed25519Keypair();
const VIEWER = new Ed25519Keypair();
const STRANGER = new Ed25519Keypair();
const CHAIN_OWNER = new Ed25519Keypair();
const ACL = [];

function resetAcl() {
  ACL.length = 0;
  ACL.push(
    { handle: "@owner", accessRole: "owner", isOwner: true, suiAddress: OWNER.toSuiAddress() },
    { handle: "@editor", accessRole: "read-write", suiAddress: EDITOR.toSuiAddress() },
    { handle: "@viewer", accessRole: "read-only", suiAddress: VIEWER.toSuiAddress() }
  );
}

vi.mock("./consoleGateway.mjs", () => ({
  DEFAULT_CONSOLE_BUCKET_ID: "bucket",
  DEFAULT_CONSOLE_URL: "https://console.example/bucket",
  deleteConsoleSkill: vi.fn(async () => ({ removed: true })),
  getConsoleSkill: vi.fn(async () => ({ markdown: "# skill\n" })),
  listConsoleSkills: vi.fn(async () => ({ skills: [{ id: "s1", name: "s1", fileId: "file-1" }] })),
  putConsoleSkill: vi.fn(async () => ({ skill: {}, rev: 2 })),
}));
vi.mock("./memoryGateway.mjs", () => ({
  listFoldedRules: vi.fn(async () => [
    { ruleId: "r1", skillId: "s1", text: "t", memoryBlobId: "z7BHX3brsgqcmDQXh2IzmoCj4g14XioezjkuIL1Fkk0" },
    { ruleId: "r2", skillId: "s1", text: "real", memoryBlobId: "realBlob" },
  ]),
  readMemoryCount: vi.fn(async () => 42),
  rememberRecallLog: vi.fn(async () => true),
  setRuleState: vi.fn(async () => ({ ruleId: "r1", state: "off" })),
  upsertRule: vi.fn(async () => ({ rule: {} })),
}));
vi.mock("./namespaceAcl.mjs", () => ({
  getNamespaceAcl: vi.fn(async () => ACL),
  updateNamespaceAcl: vi.fn(async (_ns, updater) => {
    const next = updater([...ACL]);
    ACL.length = 0;
    ACL.push(...next);
    return { members: next, walrusJobId: null };
  }),
}));
vi.mock("./tatumSuiGateway.mjs", async (load) => {
  const real = await load();
  return {
    ...real,
    checkAddress: vi.fn(async (input) => {
      const address = real.normalizeAddress(input);
      if (!address) return { input, verdict: "invalid" };
      return { input, address, verdict: mockVerdict.value };
    }),
    readAccount: vi.fn(async () => ({
      accountId: "0x1",
      owner: real.normalizeAddress(CHAIN_OWNER.toSuiAddress()),
      active: true,
      delegateKeys: [{ suiAddress: real.normalizeAddress(EDITOR.toSuiAddress()), label: "editor key" }],
    })),
    readTransaction: vi.fn(async (digest) => ({ digest, ok: true, url: `tx/${digest}` })),
  };
});
const mockVerdict = vi.hoisted(() => ({ value: "clean" }));

const { handleNamespaceSkillsRequest } = await import("./namespaceSkillsApi.mjs");
const { handleAuthRequest, issueSession, readSessionToken, verifySignedChallenge, createChallenge } = await import("./auth.mjs");
const { createInvite, forgetRecallLogsForTests, readInvite } = await import("./teamApi.mjs");
const { setRuleState, upsertRule, rememberRecallLog } = await import("./memoryGateway.mjs");
const { deleteConsoleSkill, putConsoleSkill } = await import("./consoleGateway.mjs");

function makeRes() {
  return {
    statusCode: 0,
    headers: {},
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    end(text) {
      this.body = JSON.parse(text);
    },
  };
}

function makeReq(path, method, headers, body) {
  const req = Readable.from(body === undefined ? [] : [Buffer.from(JSON.stringify(body))]);
  Object.assign(req, { url: path, method, headers: { host: "app.test", ...headers } });
  return req;
}

async function call(path, { method = "POST", headers = {}, body = {} } = {}) {
  const res = makeRes();
  await handleNamespaceSkillsRequest(makeReq(path, method, headers, body), res);
  return res;
}

const as = (keypair) => ({ authorization: `Bearer ${issueSession(keypair.toSuiAddress()).token}` });

beforeEach(() => {
  vi.clearAllMocks();
  resetAcl();
  forgetRecallLogsForTests();
  mockVerdict.value = "clean";
});

describe("old claims no longer grant anything", () => {
  it("refuses a write with no identity, which used to be allowed", async () => {
    const res = await call("/api/ns/space/rules/r1/state", { body: { state: "off" } });
    expect(res.statusCode).toBe(401);
    expect(setRuleState).not.toHaveBeenCalled();
  });

  it("ignores the caller and role headers", async () => {
    const res = await call("/api/ns/space/rules", {
      headers: { "x-memwal-caller-address": OWNER.toSuiAddress(), "x-memwal-access-role": "read-write" },
      body: { text: "spoofed", author: "@owner", callerAddress: OWNER.toSuiAddress() },
    });
    expect(res.statusCode).toBe(401);
    expect(upsertRule).not.toHaveBeenCalled();
  });

  it("refuses skill save and delete from a stranger", async () => {
    const save = await call("/api/ns/space/skills/s1", { method: "PUT", body: { markdown: "x" } });
    const del = await call("/api/ns/space/skills/s1", { method: "DELETE", body: undefined });
    expect([save.statusCode, del.statusCode]).toEqual([401, 401]);
    expect(putConsoleSkill).not.toHaveBeenCalled();
    expect(deleteConsoleSkill).not.toHaveBeenCalled();
  });
});

describe("roles come from the member list and the chain", () => {
  it("refuses a signed in non member", async () => {
    const res = await call("/api/ns/space/rules/r1/state", { headers: as(STRANGER), body: { state: "off" } });
    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe("not_member");
  });

  it("refuses a viewer, including writing a rule into a skill", async () => {
    const state = await call("/api/ns/space/rules/r1/state", { headers: as(VIEWER), body: { state: "off" } });
    const bake = await call("/api/ns/space/rules/r1/bake", { headers: as(VIEWER) });
    expect([state.statusCode, bake.statusCode]).toEqual([403, 403]);
    expect(setRuleState).not.toHaveBeenCalled();
    expect(putConsoleSkill).not.toHaveBeenCalled();
  });

  it("lets an editor change a rule and stamps the real author", async () => {
    const res = await call("/api/ns/space/rules", { headers: as(EDITOR), body: { text: "rule", author: "@owner" } });
    expect(res.statusCode).toBe(200);
    expect(upsertRule.mock.calls[0][1].author).toBe("@editor");
  });

  it("keeps skill delete to owners", async () => {
    const editor = await call("/api/ns/space/skills/s1", { method: "DELETE", headers: as(EDITOR), body: undefined });
    const owner = await call("/api/ns/space/skills/s1", { method: "DELETE", headers: as(OWNER), body: undefined });
    expect([editor.statusCode, owner.statusCode]).toEqual([403, 200]);
  });

  it("treats the on-chain owner as an owner even when the list does not name them", async () => {
    const res = await call("/api/ns/space/skills/s1", { method: "DELETE", headers: as(CHAIN_OWNER), body: undefined });
    expect(res.statusCode).toBe(200);
  });

  it("refuses a forged and an expired session", async () => {
    const { token } = issueSession(OWNER.toSuiAddress());
    const forged = await call("/api/ns/space/rules/r1/state", { headers: { authorization: `Bearer ${token}x` }, body: { state: "off" } });
    expect(forged.statusCode).toBe(401);
    const old = issueSession(OWNER.toSuiAddress(), Date.now() - 13 * 60 * 60 * 1000);
    expect(readSessionToken(old.token)).toBeNull();
  });

  it("accepts the bridge key only when it is configured and correct", async () => {
    const wrong = { "x-api-key": "guess" };
    expect((await call("/api/ns/space/rules", { headers: wrong, body: { text: "x" } })).statusCode).toBe(401);
    vi.stubEnv("MEMWAL_BRIDGE_API_KEY", "right-key");
    expect((await call("/api/ns/space/rules", { headers: wrong, body: { text: "x" } })).statusCode).toBe(401);
    expect((await call("/api/ns/space/rules", { headers: { "x-api-key": "right-key" }, body: { text: "x" } })).statusCode).toBe(200);
    vi.unstubAllEnvs();
  });
});

describe("signing in", () => {
  const sign = async (keypair, message) =>
    (await keypair.signPersonalMessage(new TextEncoder().encode(message))).signature;

  it("issues a session for a real signature, with a cookie scripts cannot read", async () => {
    const message = createChallenge(OWNER.toSuiAddress(), "app.test");
    const res = makeRes();
    await handleAuthRequest(makeReq("/api/auth/session", "POST", {}, { message, signature: await sign(OWNER, message) }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.address).toBe(OWNER.toSuiAddress());
    const cookie = res.headers["set-cookie"];
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Strict");
    expect(cookie).toContain("Secure");
  });

  it("refuses another key's signature", async () => {
    const message = createChallenge(OWNER.toSuiAddress(), "app.test");
    await expect(verifySignedChallenge(message, await sign(STRANGER, message), "app.test")).rejects.toThrow(/did not match/);
  });

  it("refuses a signature replayed after first use", async () => {
    const message = createChallenge(OWNER.toSuiAddress(), "app.test");
    const signature = await sign(OWNER, message);
    await verifySignedChallenge(message, signature, "app.test");
    await expect(verifySignedChallenge(message, signature, "app.test")).rejects.toThrow(/already used/);
  });

  it("refuses a message issued for another site or edited after issue", async () => {
    const message = createChallenge(OWNER.toSuiAddress(), "evil.test");
    await expect(verifySignedChallenge(message, await sign(OWNER, message), "app.test")).rejects.toThrow(/another site/);
    const edited = createChallenge(OWNER.toSuiAddress(), "app.test").replace(OWNER.toSuiAddress(), STRANGER.toSuiAddress());
    await expect(verifySignedChallenge(edited, await sign(STRANGER, edited), "app.test")).rejects.toThrow(/not one this site issued/);
  });

  it("refuses a message older than five minutes", async () => {
    vi.useFakeTimers({ now: Date.now() - 6 * 60 * 1000, toFake: ["Date"] });
    const message = createChallenge(OWNER.toSuiAddress(), "app.test");
    vi.useRealTimers();
    await expect(verifySignedChallenge(message, await sign(OWNER, message), "app.test")).rejects.toThrow(/expired/);
  });
});

describe("members", () => {
  const target = "0x" + "ab".repeat(32);

  it("shows each member's on-chain state and who you are", async () => {
    const res = await call("/api/ns/space/members", { method: "GET", headers: as(EDITOR), body: undefined });
    expect(res.statusCode).toBe(200);
    const editor = res.body.members.find((m) => m.handle === "@editor");
    const viewer = res.body.members.find((m) => m.handle === "@viewer");
    expect(editor.verification).toBe("key");
    expect(viewer.verification).toBe("pending");
    expect(res.body.you.role).toBe("read-write");
  });

  it("only lets an owner add, and never registers anyone by asking", async () => {
    const editor = await call("/api/ns/space/members", { headers: as(EDITOR), body: { address: target } });
    const anon = await call("/api/ns/space/members", { body: { address: target } });
    expect([editor.statusCode, anon.statusCode]).toEqual([403, 401]);
    expect(ACL).toHaveLength(3);
  });

  it("adds a clean address, refuses a flagged one, and asks before adding an unchecked one", async () => {
    mockVerdict.value = "flagged";
    expect((await call("/api/ns/space/members", { headers: as(OWNER), body: { address: target } })).statusCode).toBe(409);
    mockVerdict.value = "unknown";
    const unchecked = await call("/api/ns/space/members", { headers: as(OWNER), body: { address: target } });
    expect(unchecked.body.code).toBe("unchecked");
    expect(ACL).toHaveLength(3);
    const accepted = await call("/api/ns/space/members", { headers: as(OWNER), body: { address: target, acceptUnchecked: true } });
    expect(accepted.statusCode).toBe(200);
    expect(ACL).toHaveLength(4);
    expect(ACL[3].accessRole).toBe("read-only");
  });

  it("refuses bad input and duplicates", async () => {
    expect((await call("/api/ns/space/members", { headers: as(OWNER), body: { address: "nope" } })).statusCode).toBe(400);
    expect((await call("/api/ns/space/members", { headers: as(OWNER), body: { address: VIEWER.toSuiAddress() } })).body.code).toBe("exists");
  });

  it("keeps at least one owner, and cannot demote the chain owner", async () => {
    const path = `/api/ns/space/members/${OWNER.toSuiAddress()}`;
    expect((await call(`${path}/role`, { headers: as(OWNER), body: { role: "read-only" } })).body.code).toBe("last_owner");
    expect((await call(path, { method: "DELETE", headers: as(OWNER), body: undefined })).body.code).toBe("last_owner");
    const chain = await call(`/api/ns/space/members/${CHAIN_OWNER.toSuiAddress()}/role`, { headers: as(OWNER), body: { role: "read-only" } });
    expect(chain.body.code).toBe("chain_owner");
  });

  it("lets an owner change a role and remove a member", async () => {
    const path = `/api/ns/space/members/${VIEWER.toSuiAddress()}`;
    expect((await call(`${path}/role`, { headers: as(OWNER), body: { role: "read-write" } })).statusCode).toBe(200);
    expect(ACL.find((m) => m.handle === "@viewer").accessRole).toBe("read-write");
    expect((await call(path, { method: "DELETE", headers: as(OWNER), body: undefined })).statusCode).toBe(200);
    expect(ACL).toHaveLength(2);
  });
});

describe("invites", () => {
  it("only owners create them, and they stick to one space and role", async () => {
    expect((await call("/api/ns/space/invites", { headers: as(EDITOR), body: { role: "read-write" } })).statusCode).toBe(403);
    const { body } = await call("/api/ns/space/invites", { headers: as(OWNER), body: { role: "owner" } });
    expect(body.role).toBe("read-only");
    expect(readInvite(body.token, "space")).toEqual({ role: "read-only" });
    expect(readInvite(body.token, "other-space")).toBeNull();
    expect(readInvite(`${body.token}x`, "space")).toBeNull();
    expect(readInvite(createInvite("space", "read-write", Date.now() - 8 * 86400000).token, "space")).toBeNull();
  });

  it("joins a signed in stranger at the invited role and never changes an existing member", async () => {
    const { token } = createInvite("space", "read-write");
    const anon = await call("/api/ns/space/invites/redeem", { body: { token } });
    expect(anon.statusCode).toBe(401);
    const joined = await call("/api/ns/space/invites/redeem", { headers: as(STRANGER), body: { token } });
    expect(joined.body).toMatchObject({ joined: true, role: "read-write" });
    const viewer = await call("/api/ns/space/invites/redeem", { headers: as(VIEWER), body: { token } });
    expect(viewer.body).toMatchObject({ joined: false, role: "read-only" });
  });

  it("refuses a flagged address", async () => {
    mockVerdict.value = "flagged";
    const res = await call("/api/ns/space/invites/redeem", { headers: as(STRANGER), body: { token: createInvite("space", "read-only").token } });
    expect(res.statusCode).toBe(403);
    expect(ACL).toHaveLength(3);
  });
});

describe("recall logs", () => {
  it("needs a member, writes the agreed format, and limits the rate", async () => {
    expect((await call("/api/ns/space/recalls", { body: { agent: "cursor" } })).statusCode).toBe(401);
    const first = await call("/api/ns/space/recalls", {
      headers: as(VIEWER),
      body: { agent: "Claude Code", target: "memwal-qa", rules: 2 },
    });
    expect(first.body.logged).toBe(true);
    expect(rememberRecallLog.mock.calls[0][1]).toBe(
      "[AGENT_LOG:RECALL] [agent:claude-code] [author:@viewer] [target:memwal-qa] [rules:2]"
    );
    const second = await call("/api/ns/space/recalls", {
      headers: as(VIEWER),
      body: { agent: "Claude Code", target: "memwal-qa", rules: 2 },
    });
    expect(second.body.logged).toBe(false);
    expect(rememberRecallLog).toHaveBeenCalledOnce();
  });

  it("cannot be used to inject another header into the log", async () => {
    await call("/api/ns/space/recalls", {
      headers: as(VIEWER),
      body: { agent: "x] [author:@owner", target: "a\nb", rules: "9999" },
    });
    const line = rememberRecallLog.mock.calls[0][1];
    expect(line.match(/\[author:/g)).toHaveLength(1);
    expect(line).toContain("[author:@viewer]");
    expect(line).not.toContain("\n");
    expect(line).toContain("[rules:999]");
  });
});

describe("proof", () => {
  it("is public, reads the chain, and never offers a placeholder as evidence", async () => {
    vi.stubEnv("VITE_MEMWAL_CREATE_TX_DIGEST", "5p7GMukmf64UtGoyv7UbpeEV3MRdW6aDrZgJ4R1f5Vq6");
    const res = await call("/api/ns/space/proof", { method: "GET", body: undefined });
    vi.unstubAllEnvs();
    expect(res.statusCode).toBe(200);
    expect(res.body.memoryCount).toBe(42);
    expect(res.body.blobs.map((b) => b.id)).toEqual(["realBlob"]);
    expect(res.body.account.keys).toHaveLength(1);
    expect(res.body.transactions[0].ok).toBe(true);
    expect(res.body.bucket.files[0].id).toBe("file-1");
  });
});
